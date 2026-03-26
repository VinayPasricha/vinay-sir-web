/* ============================================
   THREE.js Post-Processing — Minimal Bundle
   EffectComposer + RenderPass + UnrealBloomPass
   + Custom Vignette/Color Grading ShaderPass
   For THREE r160, global script (non-module)
   ============================================ */

(function () {
  'use strict';

  /* ── Pass base class ── */
  class Pass {
    constructor() {
      this.enabled = true;
      this.needsSwap = true;
      this.clear = false;
      this.renderToScreen = false;
    }
    setSize(/* w, h */) {}
    render(/* renderer, writeBuffer, readBuffer */) {
      console.error('THREE.Pass: .render() must be implemented');
    }
    dispose() {}
  }

  /* ── FullScreenQuad ── */
  class FullScreenQuad {
    constructor(material) {
      this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    }
    get material() { return this._mesh.material; }
    set material(m) { this._mesh.material = m; }
    render(renderer) {
      const _camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer.render(new THREE.Scene().add(this._mesh) && this._mesh.parent, _camera);
    }
    dispose() { this._mesh.geometry.dispose(); }
  }

  /* Fix FullScreenQuad.render to work properly */
  FullScreenQuad.prototype.render = function (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(this._mesh);
    renderer.render(scene, camera);
  };

  /* ── EffectComposer ── */
  class EffectComposer {
    constructor(renderer, renderTarget) {
      this.renderer = renderer;
      const size = renderer.getSize(new THREE.Vector2());
      const pixelRatio = renderer.getPixelRatio();
      const w = size.x * pixelRatio;
      const h = size.y * pixelRatio;

      if (renderTarget === undefined) {
        const params = {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.HalfFloatType,
        };
        renderTarget = new THREE.WebGLRenderTarget(w, h, params);
      }

      this.renderTarget1 = renderTarget;
      this.renderTarget2 = renderTarget.clone();
      this.writeBuffer = this.renderTarget1;
      this.readBuffer = this.renderTarget2;
      this.renderToScreen = true;
      this.passes = [];
      this._previousFrameTime = Date.now();
    }

    addPass(pass) {
      this.passes.push(pass);
      const size = this.renderer.getSize(new THREE.Vector2());
      const pixelRatio = this.renderer.getPixelRatio();
      pass.setSize(size.x * pixelRatio, size.y * pixelRatio);
    }

    render() {
      let maskActive = false;
      for (let i = 0; i < this.passes.length; i++) {
        const pass = this.passes[i];
        if (!pass.enabled) continue;

        pass.renderToScreen = (this.renderToScreen && this.isLastEnabledPass(i));
        pass.render(this.renderer, this.writeBuffer, this.readBuffer, 0, maskActive);

        if (pass.needsSwap) {
          const tmp = this.readBuffer;
          this.readBuffer = this.writeBuffer;
          this.writeBuffer = tmp;
        }
      }
    }

    isLastEnabledPass(passIndex) {
      for (let i = passIndex + 1; i < this.passes.length; i++) {
        if (this.passes[i].enabled) return false;
      }
      return true;
    }

    setSize(w, h) {
      this.renderTarget1.setSize(w, h);
      this.renderTarget2.setSize(w, h);
      for (const pass of this.passes) {
        pass.setSize(w, h);
      }
    }

    dispose() {
      this.renderTarget1.dispose();
      this.renderTarget2.dispose();
      for (const pass of this.passes) {
        if (pass.dispose) pass.dispose();
      }
    }
  }

  /* ── RenderPass ── */
  class RenderPass extends Pass {
    constructor(scene, camera) {
      super();
      this.scene = scene;
      this.camera = camera;
      this.clear = true;
      this.needsSwap = false;
      this.clearColor = null;
      this.clearAlpha = null;
    }

    render(renderer, writeBuffer, readBuffer) {
      const oldAutoClear = renderer.autoClear;
      renderer.autoClear = false;

      if (this.renderToScreen) {
        renderer.setRenderTarget(null);
      } else {
        renderer.setRenderTarget(readBuffer);
      }

      renderer.clear();
      renderer.render(this.scene, this.camera);
      renderer.autoClear = oldAutoClear;
    }
  }

  /* ── ShaderPass ── */
  class ShaderPass extends Pass {
    constructor(shader, textureID) {
      super();
      this.textureID = textureID || 'tDiffuse';

      if (shader instanceof THREE.ShaderMaterial) {
        this.uniforms = shader.uniforms;
        this.material = shader;
      } else {
        this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
        this.material = new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
        });
      }

      this.fsQuad = new FullScreenQuad(this.material);
    }

    render(renderer, writeBuffer, readBuffer) {
      if (this.uniforms[this.textureID]) {
        this.uniforms[this.textureID].value = readBuffer.texture;
      }

      if (this.renderToScreen) {
        renderer.setRenderTarget(null);
      } else {
        renderer.setRenderTarget(writeBuffer);
        if (this.clear) renderer.clear();
      }

      this.fsQuad.render(renderer);
    }

    dispose() {
      this.material.dispose();
      this.fsQuad.dispose();
    }
  }

  /* ── UnrealBloomPass ── */
  const LuminosityHighPassShader = {
    uniforms: {
      tDiffuse: { value: null },
      luminosityThreshold: { value: 1.0 },
      smoothWidth: { value: 1.0 },
      defaultColor: { value: new THREE.Color(0x000000) },
      defaultOpacity: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec3 defaultColor;
      uniform float defaultOpacity;
      uniform float luminosityThreshold;
      uniform float smoothWidth;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec3 luma = vec3(0.299, 0.587, 0.114);
        float v = dot(texel.xyz, luma);
        vec4 outputColor = vec4(defaultColor.rgb, defaultOpacity);
        float alpha = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, v);
        gl_FragColor = mix(outputColor, texel, alpha);
      }
    `,
  };

  class UnrealBloomPass extends Pass {
    constructor(resolution, strength, radius, threshold) {
      super();
      this.strength = (strength !== undefined) ? strength : 1;
      this.radius = radius;
      this.threshold = threshold;
      this.resolution = (resolution !== undefined) ?
        new THREE.Vector2(resolution.x, resolution.y) :
        new THREE.Vector2(256, 256);

      this.clearColor = new THREE.Color(0, 0, 0);
      this.nMips = 5;
      this.renderTargetsHorizontal = [];
      this.renderTargetsVertical = [];
      this.separableBlurMaterials = [];

      let resX = Math.round(this.resolution.x / 2);
      let resY = Math.round(this.resolution.y / 2);

      const pars = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      };

      this.renderTargetBright = new THREE.WebGLRenderTarget(resX, resY, pars);
      this.renderTargetBright.texture.name = 'UnrealBloomPass.bright';

      for (let i = 0; i < this.nMips; i++) {
        const rtH = new THREE.WebGLRenderTarget(resX, resY, pars);
        rtH.texture.name = 'UnrealBloomPass.h' + i;
        this.renderTargetsHorizontal.push(rtH);

        const rtV = new THREE.WebGLRenderTarget(resX, resY, pars);
        rtV.texture.name = 'UnrealBloomPass.v' + i;
        this.renderTargetsVertical.push(rtV);

        this.separableBlurMaterials.push(this.getSeperableBlurMaterial(Math.max(1, Math.round(3 * (this.nMips - i)))));

        resX = Math.round(resX / 2);
        resY = Math.round(resY / 2);
      }

      this.highPassUniforms = THREE.UniformsUtils.clone(LuminosityHighPassShader.uniforms);
      this.highPassUniforms['luminosityThreshold'].value = threshold;
      this.highPassUniforms['smoothWidth'].value = 0.01;

      this.materialHighPassFilter = new THREE.ShaderMaterial({
        uniforms: this.highPassUniforms,
        vertexShader: LuminosityHighPassShader.vertexShader,
        fragmentShader: LuminosityHighPassShader.fragmentShader,
      });

      this.compositeMaterial = this.getCompositeMaterial(this.nMips);
      this.compositeMaterial.uniforms['bloomStrength'].value = strength;
      this.compositeMaterial.uniforms['bloomRadius'].value = 0.1;

      const bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
      this.compositeMaterial.uniforms['bloomFactors'].value = bloomFactors;
      this.compositeMaterial.uniforms['bloomTintColors'].value = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, 1, 1),
      ];

      this.blendMaterial = new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.renderTargetsVertical[0].texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() { gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv); }
        `,
      });

      this.enabled = true;
      this._oldClearColor = new THREE.Color();
      this.basic = new THREE.MeshBasicMaterial();
      this.fsQuad = new FullScreenQuad(null);
    }

    dispose() {
      for (let i = 0; i < this.renderTargetsHorizontal.length; i++) {
        this.renderTargetsHorizontal[i].dispose();
        this.renderTargetsVertical[i].dispose();
      }
      this.renderTargetBright.dispose();
    }

    setSize(width, height) {
      let resX = Math.round(width / 2);
      let resY = Math.round(height / 2);
      this.renderTargetBright.setSize(resX, resY);
      for (let i = 0; i < this.nMips; i++) {
        this.renderTargetsHorizontal[i].setSize(resX, resY);
        this.renderTargetsVertical[i].setSize(resX, resY);
        this.separableBlurMaterials[i].uniforms['invSize'].value = new THREE.Vector2(1.0 / resX, 1.0 / resY);
        resX = Math.round(resX / 2);
        resY = Math.round(resY / 2);
      }
    }

    render(renderer, writeBuffer, readBuffer) {
      renderer.getClearColor(this._oldClearColor);
      const oldClearAlpha = renderer.getClearAlpha();
      const oldAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setClearColor(this.clearColor, 0);

      // 1. Extract bright areas
      this.highPassUniforms['tDiffuse'].value = readBuffer.texture;
      this.highPassUniforms['luminosityThreshold'].value = this.threshold;
      this.fsQuad.material = this.materialHighPassFilter;
      renderer.setRenderTarget(this.renderTargetBright);
      renderer.clear();
      this.fsQuad.render(renderer);

      // 2. Blur bright areas
      let inputRenderTarget = this.renderTargetBright;
      for (let i = 0; i < this.nMips; i++) {
        this.fsQuad.material = this.separableBlurMaterials[i];
        this.separableBlurMaterials[i].uniforms['colorTexture'].value = inputRenderTarget.texture;
        this.separableBlurMaterials[i].uniforms['direction'].value = new THREE.Vector2(1.0, 0.0);
        renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
        renderer.clear();
        this.fsQuad.render(renderer);

        this.separableBlurMaterials[i].uniforms['colorTexture'].value = this.renderTargetsHorizontal[i].texture;
        this.separableBlurMaterials[i].uniforms['direction'].value = new THREE.Vector2(0.0, 1.0);
        renderer.setRenderTarget(this.renderTargetsVertical[i]);
        renderer.clear();
        this.fsQuad.render(renderer);

        inputRenderTarget = this.renderTargetsVertical[i];
      }

      // 3. Composite all bloom mips
      this.fsQuad.material = this.compositeMaterial;
      this.compositeMaterial.uniforms['bloomStrength'].value = this.strength;
      this.compositeMaterial.uniforms['bloomRadius'].value = this.radius;
      for (let i = 0; i < this.nMips; i++) {
        this.compositeMaterial.uniforms['blurTexture' + (i + 1)].value = this.renderTargetsVertical[i].texture;
      }
      renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
      renderer.clear();
      this.fsQuad.render(renderer);

      // 4. Blend bloom with original
      this.fsQuad.material = this.blendMaterial;
      this.blendMaterial.uniforms['baseTexture'].value = readBuffer.texture;
      this.blendMaterial.uniforms['bloomTexture'].value = this.renderTargetsHorizontal[0].texture;

      if (this.renderToScreen) {
        renderer.setRenderTarget(null);
      } else {
        renderer.setRenderTarget(writeBuffer);
      }
      renderer.clear();
      this.fsQuad.render(renderer);

      renderer.setClearColor(this._oldClearColor, oldClearAlpha);
      renderer.autoClear = oldAutoClear;
    }

    getSeperableBlurMaterial(kernelRadius) {
      return new THREE.ShaderMaterial({
        uniforms: {
          colorTexture: { value: null },
          invSize: { value: new THREE.Vector2(0.5, 0.5) },
          direction: { value: new THREE.Vector2(0.5, 0.5) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          #include <common>
          varying vec2 vUv;
          uniform sampler2D colorTexture;
          uniform vec2 invSize;
          uniform vec2 direction;

          float gaussianPdf(in float x, in float sigma) {
            return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
          }

          void main() {
            float fSigma = float(${kernelRadius});
            float weightSum = gaussianPdf(0.0, fSigma);
            vec3 diffuseSum = texture2D(colorTexture, vUv).rgb * weightSum;
            for (int i = 1; i < ${kernelRadius}; i++) {
              float x = float(i);
              float w = gaussianPdf(x, fSigma);
              vec2 uvOffset = direction * invSize * x;
              vec3 s1 = texture2D(colorTexture, vUv + uvOffset).rgb;
              vec3 s2 = texture2D(colorTexture, vUv - uvOffset).rgb;
              diffuseSum += (s1 + s2) * w;
              weightSum += 2.0 * w;
            }
            gl_FragColor = vec4(diffuseSum / weightSum, 1.0);
          }
        `,
      });
    }

    getCompositeMaterial(nMips) {
      const uniforms = {
        bloomStrength: { value: 1.0 },
        bloomRadius: { value: 0.0 },
        bloomFactors: { value: null },
        bloomTintColors: { value: null },
      };
      for (let i = 0; i < nMips; i++) {
        uniforms['blurTexture' + (i + 1)] = { value: null };
      }

      let samplerDecl = '';
      let compositeBody = '';
      for (let i = 0; i < nMips; i++) {
        samplerDecl += `uniform sampler2D blurTexture${i + 1};\n`;
        compositeBody += `lerpBloomFactor(bloomFactors[${i}]) * bloomTintColors[${i}] * texture2D(blurTexture${i + 1}, vUv) + `;
      }

      return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float bloomStrength;
          uniform float bloomRadius;
          uniform float bloomFactors[${nMips}];
          uniform vec3 bloomTintColors[${nMips}];
          ${samplerDecl}

          float lerpBloomFactor(const in float f) {
            float mirrorFactor = 1.2 - f;
            return mix(f, mirrorFactor, bloomRadius);
          }

          void main() {
            gl_FragColor = bloomStrength * (${compositeBody} vec4(0.0));
          }
        `,
      });
    }
  }

  /* ── Custom Vignette + Color Grading Shader ── */
  const VignetteColorShader = {
    uniforms: {
      tDiffuse: { value: null },
      vignetteStrength: { value: 0.4 },
      vignetteRadius: { value: 0.75 },
      saturation: { value: 1.15 },
      contrast: { value: 1.08 },
      brightness: { value: 1.02 },
      warmth: { value: 0.03 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float vignetteStrength;
      uniform float vignetteRadius;
      uniform float saturation;
      uniform float contrast;
      uniform float brightness;
      uniform float warmth;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec3 c = color.rgb;

        // Brightness
        c *= brightness;

        // Contrast
        c = (c - 0.5) * contrast + 0.5;

        // Saturation
        float luma = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(luma), c, saturation);

        // Warm color shift (slight orange tint)
        c.r += warmth;
        c.g += warmth * 0.4;

        // Vignette
        vec2 uv = vUv * 2.0 - 1.0;
        float dist = length(uv);
        float vig = smoothstep(vignetteRadius, vignetteRadius + 0.6, dist);
        c *= 1.0 - vig * vignetteStrength;

        gl_FragColor = vec4(clamp(c, 0.0, 1.0), color.a);
      }
    `,
  };

  /* ── Expose to global scope ── */
  THREE.EffectComposer = EffectComposer;
  THREE.RenderPass = RenderPass;
  THREE.ShaderPass = ShaderPass;
  THREE.UnrealBloomPass = UnrealBloomPass;
  THREE.VignetteColorShader = VignetteColorShader;
  THREE.Pass = Pass;
  THREE.FullScreenQuad = FullScreenQuad;

})();

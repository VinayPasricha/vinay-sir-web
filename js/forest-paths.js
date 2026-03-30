/* ============================================
   FOREST PATHS — First-Person Walking Experience
   Walk through a 3D forest, choose your path
   ============================================ */

(function () {
  'use strict';

  const PATH_DATA = [
    { name: 'The Human',        sub: 'Inner Landscape',    url: 'pages/path1.html', num: 'I' },
    { name: 'The Builder',      sub: 'Systems & Ventures', url: 'pages/path2.html', num: 'II' },
    { name: 'The Thinker',      sub: 'Ideas & Frameworks', url: 'pages/path3.html', num: 'III' },
    { name: 'The Technologist', sub: 'Technology & Future', url: 'pages/path4.html', num: 'IV' },
    { name: 'The Future',       sub: 'Long Horizon',       url: 'pages/path5.html', num: 'V' },
    { name: 'The Writer',       sub: 'Essays & Books',     url: 'pages/path6.html', num: 'VI' },
    { name: 'The Social Being', sub: 'Society & Systems',  url: 'pages/path7.html', num: 'VII' },
  ];

  /* 7 paths radiate from center — spread across full 360° so they feel
     like real forest trails, not spokes on a wheel */
  const BRANCH_TREE = {
    start: [0, 0, 35],     // entrance
    end: [0, 0, 0],        // center clearing
    width: 1.5,            // narrower natural trail
    edgeId: 'trunk',
    children: [
      { end: [-22, 0, 18], width: 0.8, pathIndex: 1 },     // The Builder (back-left)
      { end: [-26, 0, -4], width: 0.8, pathIndex: 2 },     // The Thinker (left)
      { end: [-16, 0, -24], width: 0.8, pathIndex: 3 },    // The Technologist (front-left)
      { end: [0, 0, -28], width: 0.85, pathIndex: 4 },     // The Future (straight ahead)
      { end: [16, 0, -24], width: 0.8, pathIndex: 5 },     // The Writer (front-right)
      { end: [26, 0, -4], width: 0.8, pathIndex: 6 },      // The Social Being (right)
      { end: [22, 0, 18], width: 0.8, pathIndex: 0 },      // The Human (back-right)
    ]
  };

  const PLAYER_HEIGHT = 1.7;
  const WALK_SPEED = 6;
  const MOUSE_SENSITIVITY = 0.002;

  class ForestPaths {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.state = 'loading'; // loading → splash → descending → walking
      this.clock = new THREE.Clock();

      this.pathEndpoints = new Array(7).fill(null);
      this.pathEdges = [];
      this.pathSegments = [];

      this.init();
    }

    init() {
      try {
      this.setupRenderer();
      this.setupCamera();
      this.setupScene();
      this.setupPostProcessing();
      this.createTerrain();
      this.buildBranchingPaths(BRANCH_TREE, null);
      this.plantInstancedForest();
      this.createCenterGlow();
      this.createFireflies();
      this.createHUD();
      this.createPathMarkers();
      this.setupControls();
      this.animate();
      } catch(e) { console.error('ForestPaths init error:', e); }

      /* Build entry overlay directly — no reliance on external HTML/CSS */
      this.createEntryOverlay();

      setTimeout(() => {
        this.state = 'splash';
        this.showEntryOverlay();
      }, 1200);
    }

    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = false;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.8;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
      this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
      /* Start from aerial view */
      this.camera.position.set(0, 55, 25);
      this.camera.lookAt(0, 0, 0);
    }

    setupScene() {
      this.scene = new THREE.Scene();
      this.fog = new THREE.FogExp2(0x1a3020, 0.004);
      this.scene.fog = this.fog;

      /* ── Sky dome — gradient canvas on inverted sphere ── */
      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 2; skyCanvas.height = 512;
      const sctx = skyCanvas.getContext('2d');
      const skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
      /* Deep blue-purple zenith → blue → soft teal → warm golden horizon */
      skyGrad.addColorStop(0, '#0a0e1a');
      skyGrad.addColorStop(0.15, '#101830');
      skyGrad.addColorStop(0.35, '#1a2a48');
      skyGrad.addColorStop(0.55, '#2a4060');
      skyGrad.addColorStop(0.72, '#3a5a60');
      skyGrad.addColorStop(0.85, '#5a7a60');
      skyGrad.addColorStop(0.92, '#8a9060');
      skyGrad.addColorStop(0.97, '#c0a060');
      skyGrad.addColorStop(1.0, '#e8b860');
      sctx.fillStyle = skyGrad;
      sctx.fillRect(0, 0, 2, 512);
      const skyTex = new THREE.CanvasTexture(skyCanvas);
      skyTex.magFilter = THREE.LinearFilter;
      const skyGeo = new THREE.SphereGeometry(90, 16, 16);
      const skyMat = new THREE.MeshBasicMaterial({
        map: skyTex, side: THREE.BackSide, fog: false,
      });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(sky);
      this.sky = sky;

      /* ── Beaming sun in the sky ── */
      const sunGroup = new THREE.Group();

      /* Sun core — bright glowing sphere */
      const sunCoreGeo = new THREE.SphereGeometry(4, 32, 32);
      const sunCoreMat = new THREE.MeshBasicMaterial({
        color: 0xfff4d0, fog: false,
      });
      const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
      sunGroup.add(sunCore);

      /* Inner glow — slightly larger, semi-transparent */
      const sunGlowGeo = new THREE.SphereGeometry(5.5, 32, 32);
      const sunGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffe080, transparent: true, opacity: 0.35, fog: false,
      });
      sunGroup.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));

      /* Outer halo — soft wide glow */
      const sunHaloGeo = new THREE.SphereGeometry(8, 32, 32);
      const sunHaloMat = new THREE.MeshBasicMaterial({
        color: 0xffcc44, transparent: true, opacity: 0.12, fog: false,
      });
      sunGroup.add(new THREE.Mesh(sunHaloGeo, sunHaloMat));

      /* Sun rays — flat planes radiating outward */
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0xffe880, transparent: true, opacity: 0.18,
        side: THREE.DoubleSide, fog: false,
      });
      for (let i = 0; i < 12; i++) {
        const rayGeo = new THREE.PlaneGeometry(1.2, 14);
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.rotation.z = (i / 12) * Math.PI * 2;
        ray.position.y = 0;
        sunGroup.add(ray);
      }

      /* Position the sun in the sky dome, matching directional light */
      sunGroup.position.set(-25, 55, -30);
      this.scene.add(sunGroup);
      this.sunVisual = sunGroup;

      /* Brighter lighting to match the sky */
      this.scene.add(new THREE.HemisphereLight(0xb0d8f0, 0x4a7a3a, 1.0));
      this.scene.add(new THREE.AmbientLight(0x3a5a2a, 0.8));

      this.sun = new THREE.DirectionalLight(0xfff8e0, 2.5);
      this.sun.position.set(-15, 50, 15);
      this.scene.add(this.sun);

      const fill = new THREE.DirectionalLight(0xc0e0c0, 0.8);
      fill.position.set(15, 30, -15);
      this.scene.add(fill);

      const backFill = new THREE.DirectionalLight(0xffe8c0, 0.4);
      backFill.position.set(0, 20, -40);
      this.scene.add(backFill);
    }

    setupPostProcessing() {
      if (!THREE.EffectComposer) return;

      this.composer = new THREE.EffectComposer(this.renderer);

      /* 1. Render the scene */
      this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

      /* 2. Bloom — soft glow on bright areas (fireflies, torches, emissive paths) */
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.6,    /* strength — subtle, not overwhelming */
        0.4,    /* radius — how far bloom spreads */
        0.85    /* threshold — only bright things glow */
      );
      this.composer.addPass(bloomPass);
      this.bloomPass = bloomPass;

      /* 3. Vignette + color grading — subtle cinematic look */
      const colorPass = new THREE.ShaderPass(THREE.VignetteColorShader);
      colorPass.uniforms.vignetteStrength.value = 0.25;
      colorPass.uniforms.vignetteRadius.value = 0.85;
      colorPass.uniforms.saturation.value = 1.15;
      colorPass.uniforms.contrast.value = 1.05;
      colorPass.uniforms.brightness.value = 1.05;
      colorPass.uniforms.warmth.value = 0.01;
      this.composer.addPass(colorPass);
    }

    createTerrain() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1e2e18';
      ctx.fillRect(0, 0, 512, 512);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < [2000, 1000][pass]; i++) {
          const g = 20 + pass * 15 + Math.random() * 30;
          ctx.fillStyle = `rgba(${g * 0.4},${g},${5 + Math.random() * 10},${[0.25, 0.12][pass]})`;
          ctx.beginPath();
          ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * [2, 5][pass], 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);

      const geo = new THREE.PlaneGeometry(120, 120, 32, 32);
      const pos = geo.attributes.position.array;
      for (let i = 2; i < pos.length; i += 3) {
        const px = pos[i - 2] * 0.12, py = pos[i - 1] * 0.12;
        pos[i] += Math.sin(px) * Math.cos(py) * 0.1 + (Math.random() - 0.5) * 0.03;
      }
      geo.computeVertexNormals();

      const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x2a5a24, map: tex, roughness: 0.9, metalness: 0
      }));
      ground.rotation.x = -Math.PI / 2;
      this.scene.add(ground);
    }

    buildBranchingPaths(node, parentEnd) {
      const start = parentEnd
        ? new THREE.Vector3(parentEnd.x, 0, parentEnd.z)
        : new THREE.Vector3(node.start[0], 0, node.start[2]);
      const end = new THREE.Vector3(node.end[0], 0, node.end[2]);

      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const len = start.distanceTo(end);

      /* More control points + bigger wobble = organic winding trails */
      const controlPoints = [start];
      const numMids = node.edgeId === 'trunk' ? 4 : 5;
      for (let i = 1; i <= numMids; i++) {
        const t = i / (numMids + 1);
        const pt = new THREE.Vector3().lerpVectors(start, end, t);
        const wobbleAmt = node.edgeId === 'trunk' ? len * 0.06 : len * 0.12;
        pt.add(perp.clone().multiplyScalar((Math.random() - 0.5) * wobbleAmt));
        controlPoints.push(pt);
      }
      controlPoints.push(end);

      const curve = new THREE.CatmullRomCurve3(controlPoints);
      const width = node.width || 0.6;

      /* Store edge for walking */
      const edge = {
        curve,
        start: start.clone(),
        end: end.clone(),
        pathIndex: node.pathIndex,
        isTerminal: node.pathIndex !== undefined,
        isTrunk: node.edgeId === 'trunk',
        children: [],
      };
      this.pathEdges.push(edge);

      if (node.pathIndex !== undefined) {
        this.pathEndpoints[node.pathIndex] = end.clone();
      }

      this.createTrailGeometry(curve, width, node.pathIndex);

      if (node.children) {
        node.children.forEach(child => {
          const childEdge = this.buildBranchingPaths(child, end);
          edge.children.push(childEdge);
        });
      }

      return edge;
    }

    createTrailGeometry(curve, width, pathIndex) {
      if (!this._dirtTex) {
        const dc = document.createElement('canvas');
        dc.width = 256; dc.height = 256;
        const dctx = dc.getContext('2d');
        /* Warm dirt base */
        const baseGrad = dctx.createLinearGradient(0, 0, 256, 256);
        baseGrad.addColorStop(0, '#a08860');
        baseGrad.addColorStop(0.5, '#8a7550');
        baseGrad.addColorStop(1, '#7a6845');
        dctx.fillStyle = baseGrad;
        dctx.fillRect(0, 0, 256, 256);
        /* Lighter noise — fewer circles for fast init */
        for (let pass = 0; pass < 3; pass++) {
          const counts = [1500, 1000, 600];
          const sizes = [1.5, 3, 1];
          const alphas = [0.3, 0.18, 0.25];
          for (let i = 0; i < counts[pass]; i++) {
            const v = Math.random();
            if (pass < 2) {
              dctx.fillStyle = v > 0.6
                ? `rgba(${85 + Math.random() * 45},${60 + Math.random() * 35},${35 + Math.random() * 25},${alphas[pass]})`
                : `rgba(${55 + Math.random() * 35},${40 + Math.random() * 30},${22 + Math.random() * 15},${alphas[pass] * 0.7})`;
            } else {
              dctx.fillStyle = `rgba(${140 + Math.random() * 60},${120 + Math.random() * 50},${90 + Math.random() * 40},0.15)`;
            }
            dctx.beginPath();
            dctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * sizes[pass] + 0.3, 0, Math.PI * 2);
            dctx.fill();
          }
        }
        this._dirtTex = new THREE.CanvasTexture(dc);
        this._dirtTex.wrapS = this._dirtTex.wrapT = THREE.RepeatWrapping;
      }

      const pts = curve.getPoints(80);
      const verts = [], uvs = [], idx = [];

      /* Main path strip — wider, smoother taper */
      for (let p = 0; p < pts.length; p++) {
        const pt = pts[p], t = p / (pts.length - 1);
        /* Gentler taper — stays wide in the middle */
        const taper = Math.sin(t * Math.PI) * 0.15 + 0.85;
        const w = width * taper;
        const tangent = curve.getTangent(Math.min(t, 0.999));
        const pr = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const y = 0.08;
        verts.push(pt.x + pr.x * w, y, pt.z + pr.z * w, pt.x - pr.x * w, y, pt.z - pr.z * w);
        uvs.push(0, t * 4, 1, t * 4);
      }
      for (let p = 0; p < pts.length - 1; p++) {
        const a = p * 2, b = p * 2 + 1, c = (p + 1) * 2, d = (p + 1) * 2 + 1;
        idx.push(a, c, b, b, c, d);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        map: this._dirtTex, color: 0xc8a870, roughness: 0.85, metalness: 0
      });
      mat.emissive = new THREE.Color(0xffe880);
      mat.emissiveIntensity = 0;

      const trail = new THREE.Mesh(geo, mat);
      trail.receiveShadow = false;
      trail.renderOrder = 1;
      this.scene.add(trail);

      this.pathSegments.push({ trail, mat, curve, pathIndex });

      /* Single torch at midpoint — no extra point lights for performance */
      if (pathIndex !== undefined) {
        if (!this._torchPoleMat) {
          this._torchPoleMat = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.9 });
        }
        if (!this._torchPoleGeo) {
          this._torchPoleGeo = new THREE.CylinderGeometry(0.04, 0.07, 2.0, 5);
        }
        const mid = curve.getPointAt(0.5);
        const tangent = curve.getTangent(0.5);
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const tx = mid.x + perp.x * (width + 0.5);
        const tz = mid.z + perp.z * (width + 0.5);

        const pole = new THREE.Mesh(this._torchPoleGeo, this._torchPoleMat);
        pole.position.set(tx, 1.0, tz);
        this.scene.add(pole);

        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffdd60, transparent: true, opacity: 1.0 })
        );
        flame.position.set(tx, 2.1, tz);
        this.scene.add(flame);
      }
    }

    plantInstancedForest() {
      const pathSamples = [];
      this.pathEdges.forEach(edge => {
        for (let t = 0; t <= 1; t += 0.02) {
          pathSamples.push(edge.curve.getPoint(t));
        }
      });

      const distPaths = (x, z) => {
        let min = Infinity;
        for (const s of pathSamples) {
          const d = (x - s.x) * (x - s.x) + (z - s.z) * (z - s.z);
          if (d < min) min = d;
        }
        return Math.sqrt(min);
      };

      const positions = [];
      let tries = 0;
      while (positions.length < 250 && tries < 2000) {
        tries++;
        const x = (Math.random() - 0.5) * 80, z = (Math.random() - 0.5) * 80;
        if (x * x + z * z < 20) continue;  // center clearing
        if (distPaths(x, z) < 2.5) continue;  // path corridors
        let ok = true;
        for (let j = positions.length - 1; j >= Math.max(0, positions.length - 15); j--) {
          if ((x - positions[j].x) ** 2 + (z - positions[j].z) ** 2 < 2.5) { ok = false; break; }
        }
        if (!ok) continue;
        positions.push({ x, z, s: 0.6 + Math.random() * 0.8, r: Math.random() * Math.PI * 2, ci: Math.floor(Math.random() * 6), type: Math.random() > 0.2 ? 'c' : 'r' });
      }

      const count = positions.length;
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.92 });
      const canopyMat = new THREE.MeshStandardMaterial({ roughness: 0.82 });

      const trunkGeo = new THREE.CylinderGeometry(0.08, 0.16, 2.0, 4);
      const cone1 = new THREE.ConeGeometry(1.0, 2.2, 5);
      const cone2 = new THREE.ConeGeometry(0.75, 1.6, 5);
      const cone3 = new THREE.ConeGeometry(0.5, 1.2, 5);
      const crownGeo = new THREE.IcosahedronGeometry(0.85, 0);

      const greens = [0x2a7228, 0x328430, 0x266622, 0x3a8e36, 0x2e7a2e, 0x408840].map(c => new THREE.Color(c));

      const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
      /* shadows disabled for performance */
      const c1Mesh = new THREE.InstancedMesh(cone1, canopyMat.clone(), count);

      c1Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const c2Mesh = new THREE.InstancedMesh(cone2, canopyMat.clone(), count);

      c2Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const c3Mesh = new THREE.InstancedMesh(cone3, canopyMat.clone(), count);

      c3Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const crMesh = new THREE.InstancedMesh(crownGeo, canopyMat.clone(), count);

      crMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

      const d = new THREE.Object3D();
      const col = new THREE.Color();
      const hide = () => { d.position.set(0, -100, 0); d.scale.set(0, 0, 0); d.updateMatrix(); };

      positions.forEach((p, i) => {
        const s = p.s;
        col.copy(greens[p.ci]);
        col.r += (Math.random() - 0.5) * 0.03;
        col.g += (Math.random() - 0.5) * 0.04;

        d.position.set(p.x, s * 1.0, p.z); d.scale.set(s, s, s); d.rotation.set(0, p.r, 0); d.updateMatrix();
        trunkMesh.setMatrixAt(i, d.matrix);

        if (p.type === 'c') {
          d.position.set(p.x, s * 2.4, p.z); d.scale.set(s, s * (0.8 + Math.random() * 0.4), s); d.updateMatrix();
          c1Mesh.setMatrixAt(i, d.matrix); c1Mesh.instanceColor.setXYZ(i, col.r, col.g, col.b);
          d.position.y = s * 3.6; d.scale.set(s * 0.8, s * (0.7 + Math.random() * 0.4), s * 0.8); d.updateMatrix();
          c2Mesh.setMatrixAt(i, d.matrix); c2Mesh.instanceColor.setXYZ(i, col.r * 0.95, col.g * 1.05, col.b * 0.95);
          d.position.y = s * 4.5; d.scale.set(s * 0.6, s * (0.6 + Math.random() * 0.3), s * 0.6); d.updateMatrix();
          c3Mesh.setMatrixAt(i, d.matrix); c3Mesh.instanceColor.setXYZ(i, col.r * 0.9, col.g * 1.1, col.b * 0.9);
          hide(); crMesh.setMatrixAt(i, d.matrix);
        } else {
          d.position.set(p.x, s * 2.0, p.z); d.scale.set(s * (1 + Math.random() * 0.3), s * (0.7 + Math.random() * 0.4), s * (1 + Math.random() * 0.3)); d.updateMatrix();
          crMesh.setMatrixAt(i, d.matrix); crMesh.instanceColor.setXYZ(i, col.r * 1.1, col.g * 1.15, col.b);
          hide(); c1Mesh.setMatrixAt(i, d.matrix); c2Mesh.setMatrixAt(i, d.matrix); c3Mesh.setMatrixAt(i, d.matrix);
        }
      });

      this.scene.add(trunkMesh, c1Mesh, c2Mesh, c3Mesh, crMesh);
    }

    createCenterGlow() {
      /* Large dirt clearing disc at center so all paths blend into it */
      if (!this._dirtTex) this.createTrailGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0)]), 0.1); // ensure texture exists
      const clearingMat = new THREE.MeshStandardMaterial({
        map: this._dirtTex,
        color: 0xc8a870,
        roughness: 0.88,
        metalness: 0,
        emissive: new THREE.Color(0xffe880),
        emissiveIntensity: 0,
      });
      const clearing = new THREE.Mesh(new THREE.CircleGeometry(4, 24), clearingMat);
      clearing.rotation.x = -Math.PI / 2;
      clearing.position.y = 0.06;
      clearing.renderOrder = 1;
      this.scene.add(clearing);
      this.centerClearing = clearingMat;

      /* Single warm light at center */
      this.centerLight = new THREE.PointLight(0xffe080, 1.5, 12, 2);
      this.centerLight.position.set(0, 2, 0);
      this.scene.add(this.centerLight);
    }

    createFireflies() {
      const count = 30;
      const positions = new Float32Array(count * 3);
      this.fireflyData = [];
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 40, y = 1 + Math.random() * 3, z = (Math.random() - 0.5) * 40;
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        this.fireflyData.push({ baseX: x, baseY: y, baseZ: z, phase: Math.random() * Math.PI * 2, speed: 0.2 + Math.random() * 0.5, radius: 0.5 + Math.random() * 2 });
      }
      const gc = document.createElement('canvas');
      gc.width = 64; gc.height = 64;
      const gctx = gc.getContext('2d');
      const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,240,160,1)');
      grad.addColorStop(0.4, 'rgba(255,220,100,0.4)');
      grad.addColorStop(1, 'rgba(255,200,80,0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 64, 64);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.fireflies = new THREE.Points(geo, new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(gc), size: 0.7, sizeAttenuation: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe880,
      }));
      this.scene.add(this.fireflies);
    }

    /* ── ENTRY OVERLAY — Built entirely in JS ── */
    createEntryOverlay() {
      this.entryOverlay = document.createElement('div');
      Object.assign(this.entryOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        zIndex: '2000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,10,4,0.6)',
        opacity: '0', transition: 'opacity 1s ease',
      });

      const text = document.createElement('p');
      Object.assign(text.style, {
        color: '#f2ece0', fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', fontWeight: '300',
        lineHeight: '1.6', textAlign: 'center', maxWidth: '600px',
        padding: '0 2rem', textShadow: '0 2px 30px rgba(0,0,0,0.7)',
      });
      this.entryText = text;
      this.entryOverlay.appendChild(text);

      const divider = document.createElement('div');
      Object.assign(divider.style, {
        width: '60px', height: '1px', background: '#e8d090',
        margin: '2rem auto', opacity: '0', transition: 'opacity 0.8s ease, width 0.8s ease',
      });
      this.entryDivider = divider;
      this.entryOverlay.appendChild(divider);

      const btn = document.createElement('button');
      btn.textContent = 'EXPLORE THE PATHS';
      Object.assign(btn.style, {
        marginTop: '1rem', padding: '14px 52px', background: 'transparent',
        color: '#f2ece0', fontFamily: "'Inter', sans-serif", fontSize: '0.7rem',
        fontWeight: '500', letterSpacing: '4px', textTransform: 'uppercase',
        border: '1px solid rgba(242,236,224,0.25)', borderRadius: '0',
        cursor: 'pointer', opacity: '0', transition: 'all 0.4s ease',
      });
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(242,236,224,0.08)';
        btn.style.borderColor = 'rgba(242,236,224,0.5)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
        btn.style.borderColor = 'rgba(242,236,224,0.25)';
      });
      btn.addEventListener('click', () => {
        /* Fade out overlay then enter */
        this.entryOverlay.style.opacity = '0';
        this.entryOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          this.entryOverlay.remove();
          this.enter();
          if (window.showAudioToggle) setTimeout(() => window.showAudioToggle(), 1500);
          if (window.playWhoosh) window.playWhoosh();
        }, 800);
      });
      this.entryBtn = btn;
      this.entryOverlay.appendChild(btn);

      document.body.appendChild(this.entryOverlay);
    }

    showEntryOverlay() {
      if (!this.entryOverlay) return;

      /* Remove any old loading screen */
      const ls = document.getElementById('loading-screen');
      if (ls) ls.remove();
      const oldSplash = document.getElementById('splash-overlay');
      if (oldSplash) oldSplash.remove();

      /* Fade in overlay */
      requestAnimationFrame(() => { this.entryOverlay.style.opacity = '1'; });

      /* Typewriter effect */
      const lines = ['Welcome, dear traveler.', 'Seven paths stretch before you.', 'Choose the one that calls.'];
      let lineIdx = 0, charIdx = 0;
      const type = () => {
        if (lineIdx >= lines.length) {
          /* Show divider and button */
          this.entryDivider.style.opacity = '1';
          this.entryDivider.style.width = '60px';
          setTimeout(() => { this.entryBtn.style.opacity = '1'; }, 400);
          return;
        }
        const line = lines[lineIdx];
        if (charIdx === 0 && lineIdx > 0) {
          this.entryText.innerHTML += '<br>';
        }
        if (charIdx < line.length) {
          this.entryText.innerHTML += line[charIdx];
          charIdx++;
          setTimeout(type, 35 + Math.random() * 30);
        } else {
          lineIdx++;
          charIdx = 0;
          setTimeout(type, 300);
        }
      };
      setTimeout(type, 600);

      /* Handle skip-splash (returning from path page) */
      const skipSplash = sessionStorage.getItem('skip-splash') === 'true';
      if (skipSplash) {
        sessionStorage.removeItem('skip-splash');
        this.entryOverlay.remove();
        this.enter();
        if (window.showAudioToggle) setTimeout(() => window.showAudioToggle(), 1500);
      }
    }

    /* ── PATH MARKERS — Wooden signposts with readable text + floating name sprites ── */
    createPathMarkers() {
      this.markers = [];
      const postMat = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.9 });

      PATH_DATA.forEach((path, i) => {
        const ep = this.pathEndpoints[i];
        if (!ep) return;

        /* Tall wooden signpost */
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.8, 6), postMat);
        pole.position.set(ep.x, 1.4, ep.z);
        this.scene.add(pole);

        /* Wooden plank with text rendered on canvas */
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512; signCanvas.height = 128;
        const sctx = signCanvas.getContext('2d');
        /* Wood plank background */
        sctx.fillStyle = '#5a4020';
        sctx.fillRect(0, 0, 512, 128);
        /* Wood grain */
        sctx.globalAlpha = 0.15;
        for (let g = 0; g < 30; g++) {
          sctx.strokeStyle = g % 2 === 0 ? '#3a2510' : '#6a5535';
          sctx.lineWidth = 1 + Math.random() * 2;
          sctx.beginPath();
          sctx.moveTo(0, Math.random() * 128);
          sctx.lineTo(512, Math.random() * 128);
          sctx.stroke();
        }
        sctx.globalAlpha = 1;
        /* Border */
        sctx.strokeStyle = '#3a2510';
        sctx.lineWidth = 6;
        sctx.strokeRect(3, 3, 506, 122);
        /* Path name text */
        sctx.fillStyle = '#f2ece0';
        sctx.font = 'bold 42px Georgia, serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.shadowColor = 'rgba(0,0,0,0.6)';
        sctx.shadowBlur = 4;
        sctx.fillText(path.name, 256, 50);
        /* Subtitle */
        sctx.font = '24px Georgia, serif';
        sctx.fillStyle = '#d4c8a8';
        sctx.shadowBlur = 2;
        sctx.fillText(path.sub, 256, 95);

        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshStandardMaterial({
          map: signTex, roughness: 0.8, metalness: 0.05,
        });
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.08), signMat);
        plank.position.set(ep.x, 2.6, ep.z);
        plank.lookAt(0, 2.6, 0);
        this.scene.add(plank);

        /* Floating name sprite visible from far away at junction */
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 512; spriteCanvas.height = 160;
        const spctx = spriteCanvas.getContext('2d');
        /* Transparent dark pill background */
        spctx.fillStyle = 'rgba(10,20,10,0.75)';
        const rx = 20;
        spctx.beginPath();
        spctx.moveTo(rx, 0); spctx.lineTo(512 - rx, 0);
        spctx.quadraticCurveTo(512, 0, 512, rx);
        spctx.lineTo(512, 160 - rx);
        spctx.quadraticCurveTo(512, 160, 512 - rx, 160);
        spctx.lineTo(rx, 160);
        spctx.quadraticCurveTo(0, 160, 0, 160 - rx);
        spctx.lineTo(0, rx);
        spctx.quadraticCurveTo(0, 0, rx, 0);
        spctx.fill();
        /* Border glow */
        spctx.strokeStyle = 'rgba(255,232,128,0.5)';
        spctx.lineWidth = 3;
        spctx.stroke();
        /* Roman numeral */
        spctx.fillStyle = '#ffe880';
        spctx.font = 'bold 36px Georgia, serif';
        spctx.textAlign = 'center';
        spctx.textBaseline = 'middle';
        spctx.fillText(path.num, 256, 42);
        /* Name */
        spctx.fillStyle = '#f2ece0';
        spctx.font = 'bold 40px Georgia, serif';
        spctx.fillText(path.name, 256, 90);
        /* Subtitle */
        spctx.fillStyle = '#c0b898';
        spctx.font = '26px Georgia, serif';
        spctx.fillText(path.sub, 256, 132);

        const spriteTex = new THREE.CanvasTexture(spriteCanvas);
        const spriteMat = new THREE.SpriteMaterial({
          map: spriteTex, transparent: true, depthTest: true, sizeAttenuation: true,
        });
        const sprite = new THREE.Sprite(spriteMat);
        /* Position above the endpoint, facing camera always */
        sprite.position.set(ep.x, 4.5, ep.z);
        sprite.scale.set(5, 1.6, 1);
        this.scene.add(sprite);

        this.markers.push({ pathIndex: i, sprite, plank });
      });
    }

    /* ── HUD — Path info + click prompt ── */
    createHUD() {
      this.hud = document.createElement('div');
      this.hud.className = 'fp-hud';
      this.hud.style.display = 'none';
      this.hud.innerHTML = `
        <div class="fp-path-info" id="fp-path-info"></div>
        <div class="fp-controls-hint" id="fp-hint">
          Click a path to explore
        </div>
      `;
      this.container.appendChild(this.hud);

      /* Create clickable path buttons around the screen */
      this.pathButtons = [];
    }

    /* ── CONTROLS — Click to navigate, drag to look around ── */
    setupControls() {
      this.raycaster = new THREE.Raycaster();
      this.mouseVec = new THREE.Vector2();
      this.isAnimating = false;

      /* Camera yaw for looking around at junction */
      this.cameraYaw = Math.PI;  /* Start facing -Z (forward into paths) */
      this.cameraPitch = 0;
      this._isDragging = false;
      this._dragStartX = 0;
      this._dragStartY = 0;
      this._dragMoved = false;

      /* Mouse down — start drag */
      this.renderer.domElement.addEventListener('mousedown', (e) => {
        if (this.state !== 'atJunction' || this.isAnimating) return;
        this._isDragging = true;
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;
        this._dragMoved = false;
      });

      /* Mouse move — drag to rotate camera OR hover paths */
      this.renderer.domElement.addEventListener('mousemove', (e) => {
        if (this.isAnimating) return;

        if (this._isDragging && this.state === 'atJunction') {
          const dx = e.clientX - this._dragStartX;
          const dy = e.clientY - this._dragStartY;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._dragMoved = true;
          this.cameraYaw -= dx * 0.004;
          this.cameraPitch -= dy * 0.002;
          this.cameraPitch = Math.max(-0.4, Math.min(0.4, this.cameraPitch));
          this._dragStartX = e.clientX;
          this._dragStartY = e.clientY;

          /* Update camera look direction */
          this._updateJunctionCamera();
          return;
        }

        if (this.state !== 'atJunction') return;

        /* Hover raycast for path highlighting */
        this.mouseVec.set(
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1
        );
        this.raycaster.setFromCamera(this.mouseVec, this.camera);

        const trailMeshes = this.pathSegments.filter(s => s.pathIndex !== undefined).map(s => s.trail);
        const hits = this.raycaster.intersectObjects(trailMeshes);

        /* Reset all glows */
        this.pathSegments.forEach(s => {
          if (s.pathIndex !== undefined) {
            s._hoverTarget = 0;
          }
        });

        const infoEl = document.getElementById('fp-path-info');

        if (hits.length > 0) {
          const seg = this.pathSegments.find(s => s.trail === hits[0].object);
          if (seg && seg.pathIndex !== undefined) {
            seg._hoverTarget = 0.4;
            this.renderer.domElement.style.cursor = 'pointer';
            const p = PATH_DATA[seg.pathIndex];
            if (infoEl) {
              infoEl.innerHTML = `<span class="fp-info-num">${p.num}</span> ${p.name}<br><small>${p.sub} — click to explore</small>`;
              infoEl.style.opacity = '1';
            }
            if (this.markers) {
              this.markers.forEach(m => {
                if (m.sprite) m.sprite.material.opacity = m.pathIndex === seg.pathIndex ? 1.0 : 0.6;
              });
            }
          }
        } else {
          this.renderer.domElement.style.cursor = 'default';
          if (infoEl) infoEl.style.opacity = '0';
          if (this.markers) {
            this.markers.forEach(m => { if (m.sprite) m.sprite.material.opacity = 0.85; });
          }
        }
      });

      /* Mouse up — end drag, or if it was a short click, select path */
      this.renderer.domElement.addEventListener('mouseup', (e) => {
        const wasDragging = this._isDragging && this._dragMoved;
        this._isDragging = false;

        if (this.isAnimating) return;

        /* If the user dragged, don't treat as a click */
        if (wasDragging) return;

        if (this.state === 'atJunction') {
          this.mouseVec.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
          );
          this.raycaster.setFromCamera(this.mouseVec, this.camera);

          const trailMeshes = this.pathSegments.filter(s => s.pathIndex !== undefined).map(s => s.trail);
          const hits = this.raycaster.intersectObjects(trailMeshes);

          if (hits.length > 0) {
            const hitTrail = hits[0].object;
            const seg = this.pathSegments.find(s => s.trail === hitTrail);
            if (seg && seg.pathIndex !== undefined) {
              this.walkToPath(seg.pathIndex);
            }
          }
        } else if (this.state === 'atEntrance') {
          this.walkToCenter();
        }
      });

      /* Touch support for mobile drag-to-look */
      this.renderer.domElement.addEventListener('touchstart', (e) => {
        if (this.state !== 'atJunction' || this.isAnimating) return;
        const t = e.touches[0];
        this._isDragging = true;
        this._dragStartX = t.clientX;
        this._dragStartY = t.clientY;
        this._dragMoved = false;
      }, { passive: true });

      this.renderer.domElement.addEventListener('touchmove', (e) => {
        if (!this._isDragging || this.state !== 'atJunction') return;
        const t = e.touches[0];
        const dx = t.clientX - this._dragStartX;
        const dy = t.clientY - this._dragStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._dragMoved = true;
        this.cameraYaw -= dx * 0.004;
        this.cameraPitch -= dy * 0.002;
        this.cameraPitch = Math.max(-0.4, Math.min(0.4, this.cameraPitch));
        this._dragStartX = t.clientX;
        this._dragStartY = t.clientY;
        this._updateJunctionCamera();
      }, { passive: true });

      this.renderer.domElement.addEventListener('touchend', (e) => {
        const wasDragging = this._isDragging && this._dragMoved;
        this._isDragging = false;
        if (wasDragging || this.isAnimating) return;
        if (this.state === 'atEntrance') this.walkToCenter();
      });

      /* Resize */
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
          const pr = this.renderer.getPixelRatio();
          this.composer.setSize(window.innerWidth * pr, window.innerHeight * pr);
        }
      });
    }

    _updateJunctionCamera() {
      const lookX = Math.sin(this.cameraYaw);
      const lookZ = Math.cos(this.cameraYaw);
      const lookY = PLAYER_HEIGHT + this.cameraPitch * 3;
      this.camera.lookAt(lookX * 10, lookY, lookZ * 10);
    }

    /* ── ENTER — Cinematic descent then land at entrance ── */
    enter() {
      if (this.state !== 'splash') return;
      this.state = 'descending';
      this.isAnimating = true;

      const descentCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 55, 25),
        new THREE.Vector3(6, 35, 28),
        new THREE.Vector3(3, 18, 32),
        new THREE.Vector3(-1, 8, 34),
        new THREE.Vector3(0, PLAYER_HEIGHT, 35),
      ]);

      const lookCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 1, 15),
        new THREE.Vector3(0, 1.5, 5),
        new THREE.Vector3(0, PLAYER_HEIGHT, 0),
      ]);

      const s = { t: 0 };
      gsap.to(s, {
        t: 1, duration: 4, ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.position.copy(descentCurve.getPointAt(s.t));
          this.camera.lookAt(lookCurve.getPointAt(s.t));
          this.camera.fov = 42 + s.t * 28;
          this.camera.updateProjectionMatrix();
          this.fog.density = 0.005 + s.t * 0.015;
        },
        onComplete: () => {
          this.state = 'atEntrance';
          this.isAnimating = false;
          this.hud.style.display = 'block';

          const header = document.getElementById('site-header');
          if (header) header.classList.add('visible');

          /* Show click hint */
          const infoEl = document.getElementById('fp-path-info');
          if (infoEl) {
            infoEl.innerHTML = 'Click anywhere to walk forward';
            infoEl.style.opacity = '1';
          }

          setTimeout(() => {
            const hint = document.getElementById('fp-hint');
            if (hint) gsap.to(hint, { opacity: 0, duration: 1 });
          }, 4000);
        }
      });
    }

    /* ── WALK TO CENTER — Auto-walk along trunk ── */
    walkToCenter() {
      if (this.isAnimating) return;
      this.isAnimating = true;

      const trunk = this.pathEdges[0];
      if (!trunk) return;

      /* Glow the trunk */
      this.pathSegments.forEach(s => {
        if (s.curve === trunk.curve) s.mat.emissiveIntensity = 0.15;
      });

      /* Animate camera along trunk curve */
      const s = { t: 0 };
      gsap.to(s, {
        t: 1, duration: 4, ease: 'power1.inOut',
        onUpdate: () => {
          const pos = trunk.curve.getPointAt(s.t);
          const lookT = Math.min(s.t + 0.05, 1);
          const look = trunk.curve.getPointAt(lookT);
          this.camera.position.set(pos.x, PLAYER_HEIGHT, pos.z);
          this.camera.lookAt(look.x, PLAYER_HEIGHT, look.z);
        },
        onComplete: () => {
          this.state = 'atJunction';
          this.isAnimating = false;

          /* Position at center, facing forward */
          this.camera.position.set(0, PLAYER_HEIGHT, 2);
          this.cameraYaw = Math.PI;
          this.cameraPitch = 0;
          this._updateJunctionCamera();

          /* Show path selection hint */
          const infoEl = document.getElementById('fp-path-info');
          if (infoEl) {
            infoEl.innerHTML = 'Drag to look around — click a path to explore';
            infoEl.style.opacity = '1';
            setTimeout(() => { infoEl.style.opacity = '0'; }, 4000);
          }

          /* Reset trunk glow */
          this.pathSegments.forEach(s => {
            if (s.curve === trunk.curve) s.mat.emissiveIntensity = 0;
          });
        }
      });
    }

    /* ── WALK TO PATH — Auto-walk down selected branch ── */
    walkToPath(pathIndex) {
      if (this.isAnimating) return;
      this.isAnimating = true;

      /* Find the edge for this path */
      const seg = this.pathSegments.find(s => s.pathIndex === pathIndex);
      if (!seg) return;

      const path = PATH_DATA[pathIndex];
      if (window.playChime) window.playChime();

      /* Glow the selected path */
      seg.mat.emissiveIntensity = 0.2;

      /* Show path name */
      const infoEl = document.getElementById('fp-path-info');
      if (infoEl) {
        infoEl.innerHTML = `<span class="fp-info-num">${path.num}</span> ${path.name}<br><small>${path.sub}</small>`;
        infoEl.style.opacity = '1';
      }

      /* Walk along the path curve */
      const s = { t: 0 };
      gsap.to(s, {
        t: 0.95, duration: 3, ease: 'power1.inOut',
        onUpdate: () => {
          const pos = seg.curve.getPointAt(s.t);
          const lookT = Math.min(s.t + 0.05, 1);
          const look = seg.curve.getPointAt(lookT);
          this.camera.position.set(pos.x, PLAYER_HEIGHT, pos.z);
          this.camera.lookAt(look.x, PLAYER_HEIGHT, look.z);
        },
        onComplete: () => {
          /* Fade to dark and navigate */
          const flash = document.createElement('div');
          flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(5,10,4,0);pointer-events:none;';
          document.body.appendChild(flash);
          gsap.to(flash, {
            background: 'rgba(5,10,4,1)', duration: 1, ease: 'power2.in',
            onComplete: () => {
              sessionStorage.setItem('leaf-transition', 'true');
              window.location.href = path.url;
            }
          });
        }
      });
    }

    enterPath(index) {
      const path = PATH_DATA[index];
      if (window.playChime) window.playChime();

      document.exitPointerLock();

      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(5,10,4,0);pointer-events:none;';
      document.body.appendChild(flash);

      gsap.to(flash, {
        background: 'rgba(5,10,4,1)', duration: 1.2, ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('leaf-transition', 'true');
          window.location.href = path.url;
        }
      });
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      const delta = Math.min(this.clock.getDelta(), 0.05);
      const time = this.clock.getElapsedTime();

      /* Smooth hover glow on paths */
      if (this.state === 'atJunction') {
        this.pathSegments.forEach(seg => {
          if (seg.pathIndex !== undefined) {
            const target = seg._hoverTarget || 0;
            seg.mat.emissiveIntensity += (target - seg.mat.emissiveIntensity) * 0.15;
          }
        });
      }

      /* Aerial mode — cinematic slow orbit */
      if (this.state === 'splash') {
        const orbitRadius = 8;
        const orbitSpeed = 0.08;
        this.camera.position.x = Math.sin(time * orbitSpeed) * orbitRadius;
        this.camera.position.z = Math.cos(time * orbitSpeed) * orbitRadius + 5;
        this.camera.position.y = 55 + Math.sin(time * 0.15) * 3;
        this.camera.lookAt(0, 0, 2);
      }

      /* Center light pulse */
      if (this.centerLight) {
        this.centerLight.intensity = 1.5 + Math.sin(time * 1.5) * 0.5;
      }

      /* Fireflies */
      if (this.fireflies) {
        const pos = this.fireflies.geometry.attributes.position.array;
        for (let i = 0; i < this.fireflyData.length; i++) {
          const f = this.fireflyData[i];
          pos[i * 3]     = f.baseX + Math.sin(time * f.speed + f.phase) * f.radius;
          pos[i * 3 + 1] = f.baseY + Math.cos(time * f.speed * 0.7 + f.phase) * 0.6;
          pos[i * 3 + 2] = f.baseZ + Math.cos(time * f.speed + f.phase * 1.3) * f.radius;
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true;
      }

      /* Sky dome follows camera */
      if (this.sky) {
        this.sky.position.copy(this.camera.position);
      }

      /* Sun visual — slow ray rotation + gentle pulse */
      if (this.sunVisual) {
        this.sunVisual.rotation.z = time * 0.05;
        const pulse = 1 + Math.sin(time * 0.8) * 0.08;
        this.sunVisual.scale.setScalar(pulse);
      }


      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  window.ForestPaths = ForestPaths;
})();

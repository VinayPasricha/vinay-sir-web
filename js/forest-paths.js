/* ============================================
   FOREST PATHS — 3D Aerial Forest Experience
   Procedural trees, glowing trails, overhead camera
   ============================================ */

(function () {
  'use strict';

  const PATH_DATA = [
    { name: 'The Human',        sub: 'Inner Landscape',     url: 'pages/path1.html', num: 'I' },
    { name: 'The Builder',      sub: 'Systems & Ventures',  url: 'pages/path2.html', num: 'II' },
    { name: 'The Thinker',      sub: 'Ideas & Frameworks',  url: 'pages/path3.html', num: 'III' },
    { name: 'The Technologist', sub: 'Technology & Future',  url: 'pages/path4.html', num: 'IV' },
    { name: 'The Future',       sub: 'Long Horizon',        url: 'pages/path5.html', num: 'V' },
    { name: 'The Writer',       sub: 'Essays & Books',      url: 'pages/path6.html', num: 'VI' },
    { name: 'The Social Being', sub: 'Society & Systems',   url: 'pages/path7.html', num: 'VII' },
  ];

  /* 7 paths evenly spread, angles in radians */
  const PATH_ANGLES = [];
  for (let i = 0; i < 7; i++) {
    PATH_ANGLES.push((i / 7) * Math.PI * 2 - Math.PI / 2);
  }

  const PATH_LENGTHS = [18, 16, 17, 15, 16, 15, 17];

  class ForestPaths {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.state = 'loading';
      this.mouseX = 0;
      this.mouseY = 0;
      this.hoveredPath = -1;
      this.clock = new THREE.Clock();

      this.init();
    }

    init() {
      this.setupRenderer();
      this.setupCamera();
      this.setupScene();
      this.createGround();
      this.createPaths();
      this.createTrees();
      this.createCenterGlow();
      this.createFireflies();
      this.createLabels();
      this.setupEvents();
      this.animate();

      /* Ready after short delay */
      setTimeout(() => {
        this.state = 'splash';
        const loadScreen = document.getElementById('loading-screen');
        if (loadScreen) {
          gsap.to(loadScreen, {
            opacity: 0, duration: 0.8,
            onComplete: () => loadScreen.style.display = 'none'
          });
        }
      }, 600);
    }

    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.4;
      this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
      this.camera = new THREE.PerspectiveCamera(
        55, window.innerWidth / window.innerHeight, 0.1, 200
      );
      /* Bird's eye view looking straight down with slight tilt */
      this.camera.position.set(0, 32, 12);
      this.camera.lookAt(0, 0, 0);
      this.baseCamPos = this.camera.position.clone();
      this.lookTarget = new THREE.Vector3(0, 0, 0);
    }

    setupScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x081208);
      /* Light fog — not too dense */
      this.scene.fog = new THREE.FogExp2(0x0a1a0d, 0.006);

      /* Strong ambient so trees are always visible */
      this.scene.add(new THREE.AmbientLight(0x3a6a3a, 1.2));

      /* Warm sunlight from above-left */
      const sun = new THREE.DirectionalLight(0xfff0c0, 2.0);
      sun.position.set(-8, 35, 8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -35;
      sun.shadow.camera.right = 35;
      sun.shadow.camera.top = 35;
      sun.shadow.camera.bottom = -35;
      this.scene.add(sun);

      /* Fill light from other side */
      const fill = new THREE.DirectionalLight(0x4a8a4a, 0.8);
      fill.position.set(10, 20, -10);
      this.scene.add(fill);

      /* Hemisphere light for natural sky/ground color */
      this.scene.add(new THREE.HemisphereLight(0x4488aa, 0x1a3a10, 0.6));
    }

    createGround() {
      /* Procedural ground texture */
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      /* Dark earthy green */
      ctx.fillStyle = '#1a2e14';
      ctx.fillRect(0, 0, 512, 512);

      /* Moss and grass patches */
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 1 + Math.random() * 5;
        const green = 30 + Math.random() * 50;
        ctx.fillStyle = `rgba(${green * 0.5}, ${green}, ${10 + Math.random() * 15}, ${0.2 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Brown dirt spots */
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillStyle = `rgba(${40 + Math.random() * 30}, ${25 + Math.random() * 20}, ${10 + Math.random() * 10}, ${0.1 + Math.random() * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);

      const geo = new THREE.PlaneGeometry(80, 80, 32, 32);
      /* Subtle terrain bumps */
      const pos = geo.attributes.position.array;
      for (let i = 2; i < pos.length; i += 3) {
        pos[i] += (Math.random() - 0.5) * 0.15;
      }
      geo.computeVertexNormals();

      const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        map: tex,
        color: 0x1a3a14,
        roughness: 0.95,
        metalness: 0,
      }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    createPaths() {
      this.pathMeshes = [];
      this.pathEndpoints = [];

      PATH_ANGLES.forEach((angle, i) => {
        const len = PATH_LENGTHS[i];
        const curvePoints = [];
        const segments = 30;

        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const dist = t * len;
          /* Organic curve */
          const wave = Math.sin(t * 2.5 + i * 1.3) * 1.5 * t;
          const x = Math.cos(angle) * dist + Math.sin(angle + Math.PI / 2) * wave;
          const z = Math.sin(angle) * dist + Math.cos(angle + Math.PI / 2) * wave;
          curvePoints.push(new THREE.Vector3(x, 0, z));
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const pts = curve.getPoints(80);

        /* Build wide smooth ribbon */
        const verts = [];
        const uvs = [];
        const indices = [];

        for (let p = 0; p < pts.length; p++) {
          const pt = pts[p];
          const t = p / (pts.length - 1);
          /* Path widens from center then narrows at end */
          const width = (0.4 + Math.sin(t * Math.PI) * 0.8) * 1.8;
          const tangent = curve.getTangent(Math.min(t, 0.999));
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

          verts.push(
            pt.x + perp.x * width, 0.08, pt.z + perp.z * width,
            pt.x - perp.x * width, 0.08, pt.z - perp.z * width
          );
          uvs.push(0, t, 1, t);
        }

        for (let p = 0; p < pts.length - 1; p++) {
          const a = p * 2, b = p * 2 + 1, c = (p + 1) * 2, d = (p + 1) * 2 + 1;
          indices.push(a, c, b, b, c, d);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        /* Main path — sandy/earthy with golden glow */
        const pathMat = new THREE.MeshStandardMaterial({
          color: 0xc8a860,
          roughness: 0.5,
          metalness: 0.05,
          emissive: 0xc8a860,
          emissiveIntensity: 0.4,
        });

        const pathMesh = new THREE.Mesh(geo, pathMat);
        pathMesh.receiveShadow = true;
        this.scene.add(pathMesh);

        /* Soft glow underneath — wider */
        const glowVerts = [];
        for (let p = 0; p < pts.length; p++) {
          const pt = pts[p];
          const t = p / (pts.length - 1);
          const gw = (0.4 + Math.sin(t * Math.PI) * 0.8) * 3.5;
          const tangent = curve.getTangent(Math.min(t, 0.999));
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
          glowVerts.push(
            pt.x + perp.x * gw, 0.04, pt.z + perp.z * gw,
            pt.x - perp.x * gw, 0.04, pt.z - perp.z * gw
          );
        }

        const glowGeo = new THREE.BufferGeometry();
        glowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glowVerts), 3));
        glowGeo.setIndex(indices.slice());
        glowGeo.computeVertexNormals();

        const glowMesh = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
          color: 0xffe880,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        }));
        this.scene.add(glowMesh);

        /* Store */
        const endpoint = pts[pts.length - 1];
        this.pathEndpoints.push(endpoint);
        this.pathMeshes.push({ main: pathMesh, glow: glowMesh, mat: pathMat });

        /* Point light along path for glow */
        const midPt = pts[Math.floor(pts.length * 0.4)];
        const pl = new THREE.PointLight(0xffe080, 1.0, 15, 2);
        pl.position.set(midPt.x, 1.5, midPt.z);
        this.scene.add(pl);
      });
    }

    createTrees() {
      /* Multiple tree types for variety */
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3a2510, roughness: 0.9, metalness: 0,
      });

      const greens = [
        new THREE.MeshStandardMaterial({ color: 0x1e5a1e, roughness: 0.8, metalness: 0 }),
        new THREE.MeshStandardMaterial({ color: 0x2a6e28, roughness: 0.8, metalness: 0 }),
        new THREE.MeshStandardMaterial({ color: 0x184a16, roughness: 0.85, metalness: 0 }),
        new THREE.MeshStandardMaterial({ color: 0x226422, roughness: 0.8, metalness: 0 }),
        new THREE.MeshStandardMaterial({ color: 0x1a5420, roughness: 0.85, metalness: 0 }),
        new THREE.MeshStandardMaterial({ color: 0x306a2e, roughness: 0.75, metalness: 0 }),
      ];

      this.treeGroup = new THREE.Group();
      const treeCount = 500;

      /* Check if position is too close to any path */
      const isOnPath = (x, z) => {
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 3) return true;

        for (let i = 0; i < PATH_ANGLES.length; i++) {
          const angle = PATH_ANGLES[i];
          const len = PATH_LENGTHS[i];
          const dx = Math.cos(angle);
          const dz = Math.sin(angle);
          const proj = x * dx + z * dz;
          if (proj < -1 || proj > len + 1) continue;
          const perpDist = Math.abs(x * dz - z * dx);
          const clearance = 3.0 - Math.min(proj / len, 1) * 1.0;
          if (perpDist < clearance) return true;
        }
        return false;
      };

      for (let i = 0; i < treeCount; i++) {
        const x = (Math.random() - 0.5) * 65;
        const z = (Math.random() - 0.5) * 65;

        if (isOnPath(x, z)) continue;

        const tree = new THREE.Group();
        const scale = 0.8 + Math.random() * 1.0;
        const foliageMat = greens[Math.floor(Math.random() * greens.length)];

        if (Math.random() > 0.25) {
          /* CONIFER — stacked cones */
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.15, 1.2, 5),
            trunkMat
          );
          trunk.position.y = 0.6;
          trunk.castShadow = true;
          tree.add(trunk);

          const layers = 2 + Math.floor(Math.random() * 2);
          for (let l = 0; l < layers; l++) {
            const s = 1.0 - l * 0.2;
            const cone = new THREE.Mesh(
              new THREE.ConeGeometry(1.0 * s, 2.0, 7),
              foliageMat
            );
            cone.position.y = 1.8 + l * 1.2;
            cone.castShadow = true;
            cone.receiveShadow = true;
            tree.add(cone);
          }
        } else {
          /* ROUND tree — sphere crown */
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.12, 0.8, 4),
            trunkMat
          );
          trunk.position.y = 0.4;
          trunk.castShadow = true;
          tree.add(trunk);

          const crown = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.9, 1),
            foliageMat
          );
          crown.position.y = 1.3;
          crown.scale.y = 0.7 + Math.random() * 0.3;
          crown.castShadow = true;
          crown.receiveShadow = true;
          tree.add(crown);
        }

        tree.position.set(x, 0, z);
        tree.scale.setScalar(scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        this.treeGroup.add(tree);
      }

      this.scene.add(this.treeGroup);
    }

    createCenterGlow() {
      /* Bright center where all paths meet */
      this.centerSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xfff0a0,
          transparent: true,
          opacity: 0.8,
        })
      );
      this.centerSphere.position.y = 0.5;
      this.scene.add(this.centerSphere);

      /* Halo */
      this.centerHalo = new THREE.Mesh(
        new THREE.SphereGeometry(4, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffe880,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        })
      );
      this.centerHalo.position.y = 0.3;
      this.scene.add(this.centerHalo);

      /* Strong point light */
      this.centerLight = new THREE.PointLight(0xffe080, 5, 25, 1.5);
      this.centerLight.position.set(0, 3, 0);
      this.centerLight.castShadow = true;
      this.scene.add(this.centerLight);
    }

    createFireflies() {
      const count = 100;
      const positions = new Float32Array(count * 3);
      this.fireflyData = [];

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 50;
        const y = 1.5 + Math.random() * 5;
        const z = (Math.random() - 0.5) * 50;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        this.fireflyData.push({
          baseX: x, baseY: y, baseZ: z,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.8,
          radius: 0.5 + Math.random() * 2,
        });
      }

      const glowC = document.createElement('canvas');
      glowC.width = 64; glowC.height = 64;
      const gctx = glowC.getContext('2d');
      const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 232, 128, 1)');
      grad.addColorStop(0.3, 'rgba(255, 220, 100, 0.5)');
      grad.addColorStop(1, 'rgba(255, 200, 80, 0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 64, 64);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      this.fireflies = new THREE.Points(geo, new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(glowC),
        size: 1.0,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffe880,
        opacity: 0.9,
      }));
      this.scene.add(this.fireflies);
    }

    createLabels() {
      this.labelsContainer = document.createElement('div');
      this.labelsContainer.className = 'fp-labels';
      this.container.appendChild(this.labelsContainer);

      this.labelElements = [];

      PATH_DATA.forEach((path, i) => {
        const hotspot = document.createElement('div');
        hotspot.className = 'fp-hotspot';
        hotspot.dataset.index = i;

        const label = document.createElement('div');
        label.className = 'fp-label';

        label.innerHTML = `
          <span class="fp-label-num">${path.num}</span>
          <span class="fp-label-name">${path.name}</span>
          <span class="fp-label-sub">${path.sub}</span>
        `;

        hotspot.appendChild(label);
        this.labelsContainer.appendChild(hotspot);
        this.labelElements.push({ hotspot, label });
      });
    }

    setupEvents() {
      window.addEventListener('resize', () => this.onResize());

      window.addEventListener('mousemove', (e) => {
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      });

      this.labelElements.forEach((el, i) => {
        el.hotspot.addEventListener('mouseenter', () => {
          if (this.state !== 'exploring') return;
          this.hoveredPath = i;
          el.hotspot.classList.add('active');
          this.highlightPath(i, true);
          if (window.playRustle) window.playRustle();
        });

        el.hotspot.addEventListener('mouseleave', () => {
          this.hoveredPath = -1;
          el.hotspot.classList.remove('active');
          this.highlightPath(i, false);
        });

        el.hotspot.addEventListener('click', () => {
          if (this.state !== 'exploring') return;
          this.navigateToPath(i);
        });
      });
    }

    highlightPath(index, active) {
      const pm = this.pathMeshes[index];
      if (!pm) return;
      gsap.to(pm.mat, {
        emissiveIntensity: active ? 1.0 : 0.4,
        duration: 0.4,
      });
      gsap.to(pm.glow.material, {
        opacity: active ? 0.3 : 0.1,
        duration: 0.4,
      });
    }

    enter() {
      if (this.state !== 'splash') return;
      this.state = 'exploring';

      this.labelElements.forEach((el, i) => {
        gsap.fromTo(el.hotspot,
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 0.8, delay: 0.3 + i * 0.12, ease: 'back.out(1.5)' }
        );
      });

      const header = document.getElementById('site-header');
      if (header) header.classList.add('visible');
    }

    navigateToPath(index) {
      const path = PATH_DATA[index];
      const endpoint = this.pathEndpoints[index];

      if (window.playChime) window.playChime();

      /* Camera zooms toward path */
      gsap.to(this.camera.position, {
        x: endpoint.x * 0.5,
        y: 15,
        z: endpoint.z * 0.5 + 6,
        duration: 1.5,
        ease: 'power2.in',
      });

      gsap.to(this.lookTarget, {
        x: endpoint.x * 0.7,
        z: endpoint.z * 0.7,
        duration: 1.5,
        ease: 'power2.in',
      });

      /* Fade out other labels */
      this.labelElements.forEach((el, j) => {
        if (j !== index) gsap.to(el.hotspot, { opacity: 0, duration: 0.4 });
      });

      /* Fade to dark */
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(10,26,13,0);pointer-events:none;';
      document.body.appendChild(flash);

      gsap.to(flash, {
        background: 'rgba(10,26,13,1)',
        duration: 1.0,
        delay: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('leaf-transition', 'true');
          window.location.href = path.url;
        }
      });
    }

    onResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      const time = this.clock.getElapsedTime();

      /* Camera parallax */
      if (this.state === 'exploring' && !gsap.isTweening(this.camera.position)) {
        const tx = this.baseCamPos.x + this.mouseX * 4;
        const tz = this.baseCamPos.z + this.mouseY * 3;
        this.camera.position.x += (tx - this.camera.position.x) * 0.03;
        this.camera.position.z += (tz - this.camera.position.z) * 0.03;
      }

      this.camera.lookAt(this.lookTarget);

      /* Center pulse */
      if (this.centerSphere) {
        this.centerSphere.material.opacity = 0.6 + Math.sin(time * 1.5) * 0.2;
        this.centerSphere.scale.setScalar(1 + Math.sin(time * 2) * 0.06);
      }
      if (this.centerHalo) {
        this.centerHalo.material.opacity = 0.1 + Math.sin(time * 1.2) * 0.05;
      }
      if (this.centerLight) {
        this.centerLight.intensity = 4 + Math.sin(time * 1.5) * 1;
      }

      /* Fireflies */
      if (this.fireflies) {
        const pos = this.fireflies.geometry.attributes.position.array;
        for (let i = 0; i < this.fireflyData.length; i++) {
          const f = this.fireflyData[i];
          pos[i * 3]     = f.baseX + Math.sin(time * f.speed + f.phase) * f.radius;
          pos[i * 3 + 1] = f.baseY + Math.cos(time * f.speed * 0.7 + f.phase) * 0.8;
          pos[i * 3 + 2] = f.baseZ + Math.cos(time * f.speed + f.phase * 1.3) * f.radius;
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true;
      }

      /* Path glow pulse */
      this.pathMeshes.forEach((pm, i) => {
        if (i !== this.hoveredPath) {
          pm.mat.emissiveIntensity = 0.3 + Math.sin(time * 0.8 + i) * 0.1;
        }
      });

      /* Update label positions (3D → screen) */
      if (this.state === 'exploring') {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.pathEndpoints.forEach((ep, i) => {
          const v = new THREE.Vector3(ep.x, 2, ep.z);
          v.project(this.camera);
          const el = this.labelElements[i];
          if (el) {
            el.hotspot.style.left = ((v.x * 0.5 + 0.5) * w) + 'px';
            el.hotspot.style.top = ((-v.y * 0.5 + 0.5) * h) + 'px';
          }
        });
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.ForestPaths = ForestPaths;
})();

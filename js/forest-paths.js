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

  /* 7 path angles radiating from center (in radians) */
  const PATH_ANGLES = [
    Math.PI * 0.5,        // I   — down
    Math.PI * 0.75,       // II  — lower-left
    Math.PI * 1.0,        // III — left
    Math.PI * 1.3,        // IV  — upper-left
    Math.PI * 1.6,        // V   — upper-center-left
    Math.PI * 1.85,       // VI  — upper-center-right
    Math.PI * 0.15,       // VII — right
  ];

  const PATH_LENGTHS = [28, 24, 26, 22, 24, 22, 25];

  class ForestPaths {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.state = 'loading';
      this.mouseX = 0;
      this.mouseY = 0;
      this.hoveredPath = -1;
      this.clock = new THREE.Clock();
      this.pathEndScreenPos = [];

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
      this.setupRaycasting();
      this.setupEvents();
      this.animate();

      /* Ready */
      setTimeout(() => {
        this.state = 'splash';
        const loadScreen = document.getElementById('loading-screen');
        if (loadScreen) {
          gsap.to(loadScreen, {
            opacity: 0, duration: 0.8,
            onComplete: () => loadScreen.style.display = 'none'
          });
        }
      }, 500);
    }

    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
      this.camera = new THREE.PerspectiveCamera(
        50, window.innerWidth / window.innerHeight, 0.1, 200
      );
      /* Overhead angled view */
      this.camera.position.set(0, 45, 18);
      this.camera.lookAt(0, 0, -2);

      this.baseCamPos = this.camera.position.clone();
      this.baseLookAt = new THREE.Vector3(0, 0, -2);
    }

    setupScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050a06);
      this.scene.fog = new THREE.FogExp2(0x0a1a0d, 0.012);

      /* Ambient light — green forest tint */
      const ambient = new THREE.AmbientLight(0x1a3a1a, 0.6);
      this.scene.add(ambient);

      /* Main directional light — warm sunlight from above */
      const sun = new THREE.DirectionalLight(0xffe8a0, 1.2);
      sun.position.set(-10, 40, 10);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -40;
      sun.shadow.camera.right = 40;
      sun.shadow.camera.top = 40;
      sun.shadow.camera.bottom = -40;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 80;
      this.scene.add(sun);

      /* Warm fill from below */
      const fill = new THREE.DirectionalLight(0x2a4a20, 0.3);
      fill.position.set(5, 10, -5);
      this.scene.add(fill);
    }

    createGround() {
      /* Procedural forest floor texture */
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      /* Dark forest green base */
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, 1024, 1024);

      /* Mossy patches */
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = 1 + Math.random() * 4;
        const g = 15 + Math.random() * 30;
        const b = 8 + Math.random() * 15;
        ctx.fillStyle = `rgba(${g * 0.6}, ${g}, ${b}, ${0.15 + Math.random() * 0.25})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Brown earth spots */
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = 1 + Math.random() * 3;
        ctx.fillStyle = `rgba(${30 + Math.random() * 20}, ${20 + Math.random() * 15}, ${10 + Math.random() * 8}, ${0.1 + Math.random() * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const groundTex = new THREE.CanvasTexture(canvas);
      groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
      groundTex.repeat.set(4, 4);

      const groundGeo = new THREE.PlaneGeometry(100, 100, 64, 64);
      /* Subtle displacement */
      const pos = groundGeo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 2] += (Math.random() - 0.5) * 0.3;
      }
      groundGeo.computeVertexNormals();

      const groundMat = new THREE.MeshStandardMaterial({
        map: groundTex,
        roughness: 0.95,
        metalness: 0.0,
        color: 0x0f2810,
      });

      this.ground = new THREE.Mesh(groundGeo, groundMat);
      this.ground.rotation.x = -Math.PI / 2;
      this.ground.receiveShadow = true;
      this.scene.add(this.ground);
    }

    createPaths() {
      /* 7 glowing trails radiating from center */
      this.pathMeshes = [];
      this.pathEndpoints = [];

      const pathMat = new THREE.MeshStandardMaterial({
        color: 0xc4a050,
        roughness: 0.4,
        metalness: 0.1,
        emissive: 0xc4a050,
        emissiveIntensity: 0.3,
      });

      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffe880,
        transparent: true,
        opacity: 0.15,
      });

      PATH_ANGLES.forEach((angle, i) => {
        const len = PATH_LENGTHS[i];
        const points = [];
        const segments = 20;

        /* Create organic curved path */
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const dist = t * len;
          /* Add organic waviness */
          const waveX = Math.sin(t * 3 + i * 1.7) * 1.2 * t;
          const waveZ = Math.cos(t * 2.5 + i * 2.1) * 0.8 * t;

          const x = Math.cos(angle) * dist + waveX;
          const z = Math.sin(angle) * dist + waveZ;
          points.push(new THREE.Vector3(x, 0, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);

        /* Main path — narrow dirt trail */
        const pathWidth = 0.6 + Math.random() * 0.3;
        const shape = new THREE.Shape();
        shape.moveTo(-pathWidth / 2, 0);
        shape.lineTo(pathWidth / 2, 0);

        const extrudeSettings = {
          steps: 60,
          extrudePath: curve,
        };

        /* Use a flat ribbon geometry instead */
        const ribbonPoints = [];
        const ribbonFaces = [];
        const curvePoints = curve.getPoints(60);

        for (let p = 0; p < curvePoints.length; p++) {
          const pt = curvePoints[p];
          const t = p / (curvePoints.length - 1);
          /* Width tapers from center outward */
          const w = (1.0 - t * 0.6) * pathWidth;

          /* Get tangent for perpendicular */
          const tangent = curve.getTangent(Math.min(t, 0.999));
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

          ribbonPoints.push(
            pt.x + perp.x * w, 0.05, pt.z + perp.z * w,
            pt.x - perp.x * w, 0.05, pt.z - perp.z * w
          );
        }

        const ribbonGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array(ribbonPoints);
        const indices = [];
        for (let p = 0; p < curvePoints.length - 1; p++) {
          const a = p * 2;
          const b = p * 2 + 1;
          const c = (p + 1) * 2;
          const d = (p + 1) * 2 + 1;
          indices.push(a, c, b, b, c, d);
        }

        ribbonGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        ribbonGeo.setIndex(indices);
        ribbonGeo.computeVertexNormals();

        const pathMesh = new THREE.Mesh(ribbonGeo, pathMat.clone());
        pathMesh.receiveShadow = true;
        pathMesh.userData.pathIndex = i;
        this.scene.add(pathMesh);

        /* Wider glow underneath */
        const glowRibbon = [];
        for (let p = 0; p < curvePoints.length; p++) {
          const pt = curvePoints[p];
          const t = p / (curvePoints.length - 1);
          const gw = (1.0 - t * 0.5) * pathWidth * 2.5;
          const tangent = curve.getTangent(Math.min(t, 0.999));
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

          glowRibbon.push(
            pt.x + perp.x * gw, 0.02, pt.z + perp.z * gw,
            pt.x - perp.x * gw, 0.02, pt.z - perp.z * gw
          );
        }

        const glowGeo = new THREE.BufferGeometry();
        glowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glowRibbon), 3));
        glowGeo.setIndex(indices.slice());
        glowGeo.computeVertexNormals();

        const glow = new THREE.Mesh(glowGeo, glowMat.clone());
        glow.userData.pathIndex = i;
        this.scene.add(glow);

        /* Store endpoint and meshes */
        const endpoint = curvePoints[curvePoints.length - 1];
        this.pathEndpoints.push(endpoint);
        this.pathMeshes.push({
          main: pathMesh,
          glow: glow,
          curve: curve,
          endpoint: endpoint,
        });
      });
    }

    createTrees() {
      /* Two types: tall conifers and shorter round trees */

      /* Conifer: cone on cylinder */
      const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.8, 5);
      const coneGeo = new THREE.ConeGeometry(0.8, 2.5, 6);

      /* Round tree: sphere on cylinder */
      const roundTrunkGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.6, 4);
      const sphereGeo = new THREE.SphereGeometry(0.6, 6, 5);

      /* Materials */
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x2a1a0c, roughness: 0.9, metalness: 0.0,
      });

      /* Several green shades for variety */
      const foliageColors = [0x1a4a18, 0x1e5520, 0x163e14, 0x225a22, 0x184818, 0x2a6a28];

      /* Generate tree positions avoiding paths */
      const treeCount = 600;
      this.treeGroup = new THREE.Group();

      const isOnPath = (x, z) => {
        for (let i = 0; i < PATH_ANGLES.length; i++) {
          const angle = PATH_ANGLES[i];
          const len = PATH_LENGTHS[i];
          /* Check distance from path line */
          const dx = Math.cos(angle);
          const dz = Math.sin(angle);
          /* Project point onto path direction */
          const proj = x * dx + z * dz;
          if (proj < -1 || proj > len + 2) continue;
          /* Perpendicular distance */
          const perpDist = Math.abs(x * dz - z * dx);
          /* Wider clearance near center, narrower at edges */
          const clearance = 2.0 + (1.0 - Math.min(proj / len, 1)) * 1.5;
          if (perpDist < clearance) return true;
        }
        /* Also clear center area */
        if (Math.sqrt(x * x + z * z) < 3.5) return true;
        return false;
      };

      for (let i = 0; i < treeCount; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;

        if (isOnPath(x, z)) continue;

        const isConifer = Math.random() > 0.3;
        const scale = 0.7 + Math.random() * 0.8;
        const foliageColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];

        const foliageMat = new THREE.MeshStandardMaterial({
          color: foliageColor,
          roughness: 0.85,
          metalness: 0.0,
        });

        const tree = new THREE.Group();

        if (isConifer) {
          /* Layered conifer — 2-3 cone layers */
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 0.4;
          trunk.castShadow = true;
          tree.add(trunk);

          const layers = 2 + Math.floor(Math.random() * 2);
          for (let l = 0; l < layers; l++) {
            const layerScale = 1.0 - l * 0.25;
            const cone = new THREE.Mesh(coneGeo, foliageMat);
            cone.position.y = 1.2 + l * 1.0;
            cone.scale.set(layerScale, layerScale * (0.8 + Math.random() * 0.4), layerScale);
            cone.castShadow = true;
            tree.add(cone);
          }
        } else {
          /* Round tree */
          const trunk = new THREE.Mesh(roundTrunkGeo, trunkMat);
          trunk.position.y = 0.3;
          trunk.castShadow = true;
          tree.add(trunk);

          const crown = new THREE.Mesh(sphereGeo, foliageMat);
          crown.position.y = 0.9;
          crown.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5);
          crown.castShadow = true;
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
      /* Central bright glowing point where paths converge */
      const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffe880,
        transparent: true,
        opacity: 0.7,
      });
      this.centerSphere = new THREE.Mesh(glowGeo, glowMat);
      this.centerSphere.position.y = 0.3;
      this.scene.add(this.centerSphere);

      /* Outer glow halo */
      const haloGeo = new THREE.SphereGeometry(3.5, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffe880,
        transparent: true,
        opacity: 0.12,
      });
      this.centerHalo = new THREE.Mesh(haloGeo, haloMat);
      this.centerHalo.position.y = 0.2;
      this.scene.add(this.centerHalo);

      /* Point light at center */
      const centerLight = new THREE.PointLight(0xffe080, 3, 30, 1.5);
      centerLight.position.set(0, 2, 0);
      centerLight.castShadow = true;
      this.scene.add(centerLight);
      this.centerLight = centerLight;

      /* Additional path lights along each trail */
      PATH_ANGLES.forEach((angle, i) => {
        const dist = 5 + Math.random() * 3;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const pl = new THREE.PointLight(0xffe080, 0.5, 12, 2);
        pl.position.set(x, 1, z);
        this.scene.add(pl);
      });
    }

    createFireflies() {
      /* Floating particle system */
      const count = 80;
      const positions = new Float32Array(count * 3);
      this.fireflyData = [];

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = 1 + Math.random() * 6;
        const z = (Math.random() - 0.5) * 60;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        this.fireflyData.push({
          baseX: x, baseY: y, baseZ: z,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.8,
          radius: 0.5 + Math.random() * 1.5,
        });
      }

      /* Create glow texture */
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 64; glowCanvas.height = 64;
      const gctx = glowCanvas.getContext('2d');
      const gradient = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 232, 128, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 220, 100, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 200, 80, 0)');
      gctx.fillStyle = gradient;
      gctx.fillRect(0, 0, 64, 64);

      const glowTex = new THREE.CanvasTexture(glowCanvas);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        map: glowTex,
        size: 0.8,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffe880,
        opacity: 0.9,
      });

      this.fireflies = new THREE.Points(geo, mat);
      this.scene.add(this.fireflies);
    }

    createLabels() {
      /* HTML overlay labels at path endpoints */
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

        const numSpan = document.createElement('span');
        numSpan.className = 'fp-label-num';
        numSpan.textContent = path.num;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'fp-label-name';
        nameSpan.textContent = path.name;

        const subSpan = document.createElement('span');
        subSpan.className = 'fp-label-sub';
        subSpan.textContent = path.sub;

        label.appendChild(numSpan);
        label.appendChild(nameSpan);
        label.appendChild(subSpan);
        hotspot.appendChild(label);

        this.labelsContainer.appendChild(hotspot);
        this.labelElements.push({ hotspot, label });
      });
    }

    setupRaycasting() {
      this.raycaster = new THREE.Raycaster();
      this.mouseVec = new THREE.Vector2();
    }

    setupEvents() {
      window.addEventListener('resize', () => this.onResize());

      window.addEventListener('mousemove', (e) => {
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        this.mouseVec.set(this.mouseX, -this.mouseY);
      });

      /* Label hover & click */
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

      gsap.to(pm.main.material, {
        emissiveIntensity: active ? 0.8 : 0.3,
        duration: 0.4,
      });
      gsap.to(pm.glow.material, {
        opacity: active ? 0.35 : 0.15,
        duration: 0.4,
      });
    }

    enter() {
      if (this.state !== 'splash') return;
      this.state = 'exploring';

      /* Reveal labels with stagger */
      this.labelElements.forEach((el, i) => {
        gsap.fromTo(el.hotspot,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1, scale: 1,
            duration: 0.8,
            delay: 0.3 + i * 0.12,
            ease: 'back.out(1.5)',
          }
        );
      });

      /* Show header */
      const header = document.getElementById('site-header');
      if (header) header.classList.add('visible');
    }

    navigateToPath(index) {
      const path = PATH_DATA[index];
      const endpoint = this.pathEndpoints[index];

      if (window.playChime) window.playChime();

      /* Camera zooms toward the path endpoint */
      const targetPos = new THREE.Vector3(
        endpoint.x * 0.6,
        20,
        endpoint.z * 0.6 + 8
      );

      gsap.to(this.camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'power2.in',
      });

      gsap.to(this.baseLookAt, {
        x: endpoint.x,
        z: endpoint.z,
        duration: 1.5,
        ease: 'power2.in',
      });

      /* Fade out other labels */
      this.labelElements.forEach((el, i) => {
        if (i !== index) {
          gsap.to(el.hotspot, { opacity: 0, duration: 0.4 });
        }
      });

      /* Fade to dark then navigate */
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
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    updateLabelPositions() {
      if (this.state !== 'exploring') return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      this.pathEndpoints.forEach((ep, i) => {
        const pos = new THREE.Vector3(ep.x, 1.5, ep.z);
        pos.project(this.camera);

        const x = (pos.x * 0.5 + 0.5) * w;
        const y = (-pos.y * 0.5 + 0.5) * h;

        const el = this.labelElements[i];
        if (el) {
          el.hotspot.style.left = x + 'px';
          el.hotspot.style.top = y + 'px';
        }
      });
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const time = this.clock.getElapsedTime();

      /* Subtle camera parallax on mouse */
      if (this.state === 'exploring' && !gsap.isTweening(this.camera.position)) {
        const targetX = this.baseCamPos.x + this.mouseX * 3;
        const targetZ = this.baseCamPos.z + this.mouseY * 2;

        this.camera.position.x += (targetX - this.camera.position.x) * 0.03;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.03;
      }

      this.camera.lookAt(this.baseLookAt);

      /* Center glow pulse */
      if (this.centerSphere) {
        const pulse = 0.5 + Math.sin(time * 1.5) * 0.2;
        this.centerSphere.material.opacity = pulse;
        this.centerSphere.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      }
      if (this.centerHalo) {
        this.centerHalo.material.opacity = 0.08 + Math.sin(time * 1.2) * 0.04;
        this.centerHalo.scale.setScalar(1 + Math.sin(time * 0.8) * 0.08);
      }
      if (this.centerLight) {
        this.centerLight.intensity = 2.5 + Math.sin(time * 1.5) * 0.5;
      }

      /* Animate fireflies */
      if (this.fireflies) {
        const positions = this.fireflies.geometry.attributes.position.array;
        for (let i = 0; i < this.fireflyData.length; i++) {
          const f = this.fireflyData[i];
          positions[i * 3] = f.baseX + Math.sin(time * f.speed + f.phase) * f.radius;
          positions[i * 3 + 1] = f.baseY + Math.cos(time * f.speed * 0.7 + f.phase) * 0.5;
          positions[i * 3 + 2] = f.baseZ + Math.cos(time * f.speed + f.phase * 1.3) * f.radius;
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true;
      }

      /* Path glow animation */
      this.pathMeshes.forEach((pm, i) => {
        if (i !== this.hoveredPath) {
          const baseIntensity = 0.25 + Math.sin(time * 0.8 + i * 0.9) * 0.08;
          pm.main.material.emissiveIntensity = baseIntensity;
        }
      });

      /* Update label screen positions */
      this.updateLabelPositions();

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.ForestPaths = ForestPaths;
})();

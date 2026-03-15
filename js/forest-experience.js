/* ============================================
   FOREST EXPERIENCE — Three.js Immersive Landing
   Cinematic 3D forest → 9-branch world tree
   ============================================ */

(function () {
  'use strict';

  /* ============================================
     BRANCH DATA — The 9 Paths
     ============================================ */
  const BRANCH_DATA = [
    { name: 'The Human',     sub: 'Inner Landscape',  url: 'pages/path1.html', num: 'I' },
    { name: 'The Thinker',   sub: 'Coming soon',      url: '#', num: 'II' },
    { name: 'The Builder',   sub: 'Coming soon',      url: '#', num: 'III' },
    { name: 'The Writer',    sub: 'Coming soon',      url: '#', num: 'IV' },
    { name: 'The Seeker',    sub: 'Coming soon',      url: '#', num: 'V' },
    { name: 'The Connector', sub: 'Coming soon',      url: '#', num: 'VI' },
    { name: 'The Voyager',   sub: 'Coming soon',      url: '#', num: 'VII' },
    { name: 'The Visionary', sub: 'Coming soon',      url: '#', num: 'VIII' },
    { name: 'The Journey',   sub: 'Coming soon',      url: '#', num: 'IX' },
  ];

  /* Branch angles — spread like a real tree crown
     Upper tier (0-4): main branches, moderate elevation
     Lower tier (5-8): secondary branches, lower angle
     Tuned so labels don't overlap on screen */
  const BRANCH_ANGLES = [
    { azimuth: -80, elevation: 35, length: 6.5 },
    { azimuth: -35, elevation: 48, length: 5.5 },
    { azimuth:  10, elevation: 55, length: 5.0 },
    { azimuth:  55, elevation: 46, length: 5.5 },
    { azimuth:  90, elevation: 32, length: 6.0 },
    { azimuth: -65, elevation: 15, length: 5.5 },
    { azimuth:  -5, elevation: 22, length: 5.2 },
    { azimuth:  45, elevation: 12, length: 5.8 },
    { azimuth:  85, elevation: 8,  length: 5.5 },
  ];

  /* ============================================
     PROCEDURAL TEXTURES
     ============================================ */
  function createBarkTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a1a0c';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256;
      const w = 1 + Math.random() * 3;
      ctx.fillStyle = `rgba(${35 + Math.random() * 40}, ${22 + Math.random() * 20}, ${8 + Math.random() * 12}, ${0.3 + Math.random() * 0.4})`;
      ctx.fillRect(x, 0, w, 256);
    }
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 256;
      ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.15})`;
      ctx.fillRect(0, y, 256, 1 + Math.random() * 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createGroundTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    /* Darker mossy green base */
    ctx.fillStyle = '#0e1c0a';
    ctx.fillRect(0, 0, 512, 512);
    /* Green/mossy speckles */
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 0.5 + Math.random() * 2.5;
      ctx.fillStyle = `rgba(${14 + Math.random() * 20}, ${28 + Math.random() * 30}, ${10 + Math.random() * 14}, ${0.18 + Math.random() * 0.28})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    /* Subtle brown dirt patches */
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 1 + Math.random() * 3;
      ctx.fillStyle = `rgba(${30 + Math.random() * 20}, ${20 + Math.random() * 15}, ${10 + Math.random() * 10}, ${0.08 + Math.random() * 0.12})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }

  function createLeafTexture() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 32, 32);
    const g = ctx.createRadialGradient(16, 14, 0, 16, 14, 14);
    g.addColorStop(0, 'rgba(80,140,50,0.9)');
    g.addColorStop(0.6, 'rgba(50,100,30,0.5)');
    g.addColorStop(1, 'rgba(30,60,15,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(16, 14, 8, 12, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  function createDustTexture() {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(200,220,160,0.8)');
    g.addColorStop(0.5, 'rgba(200,220,160,0.2)');
    g.addColorStop(1, 'rgba(200,220,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(c);
  }

  function createGodRayTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 128, 512);

    /* Vertical gradient — intense golden at top, long fade */
    const vg = ctx.createLinearGradient(0, 0, 0, 512);
    vg.addColorStop(0, 'rgba(255,235,160,0.95)');
    vg.addColorStop(0.05, 'rgba(255,228,140,0.80)');
    vg.addColorStop(0.15, 'rgba(255,220,120,0.55)');
    vg.addColorStop(0.3, 'rgba(255,215,100,0.32)');
    vg.addColorStop(0.5, 'rgba(255,210,90,0.18)');
    vg.addColorStop(0.7, 'rgba(255,205,80,0.08)');
    vg.addColorStop(0.9, 'rgba(255,200,70,0.02)');
    vg.addColorStop(1, 'rgba(255,200,70,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 128, 512);

    /* Soft horizontal edges so rays don't have hard borders */
    ctx.globalCompositeOperation = 'destination-in';
    const hg = ctx.createLinearGradient(0, 0, 128, 0);
    hg.addColorStop(0, 'rgba(255,255,255,0)');
    hg.addColorStop(0.12, 'rgba(255,255,255,0.6)');
    hg.addColorStop(0.3, 'rgba(255,255,255,0.9)');
    hg.addColorStop(0.5, 'rgba(255,255,255,1)');
    hg.addColorStop(0.7, 'rgba(255,255,255,0.9)');
    hg.addColorStop(0.88, 'rgba(255,255,255,0.6)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, 128, 512);

    return new THREE.CanvasTexture(c);
  }

  function createMistTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(200,210,140,0.30)');
    g.addColorStop(0.4, 'rgba(180,200,120,0.15)');
    g.addColorStop(0.7, 'rgba(160,190,100,0.05)');
    g.addColorStop(1, 'rgba(160,190,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  /* ============================================
     FOREST EXPERIENCE CLASS
     ============================================ */
  class ForestExperience {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.mouse = new THREE.Vector2(0, 0);
      this.mouseSmooth = new THREE.Vector2(0, 0);
      this.clock = new THREE.Clock();
      this.raycaster = new THREE.Raycaster();

      /* State: loading → splash → entering → branches */
      this.state = 'loading';

      /* Scene objects */
      this.forestTrees = [];
      this.worldTreeGroup = null;
      this.branchMeshes = [];
      this.branchEndpoints = [];
      this.branchHitTargets = [];
      this.hoveredBranch = -1;
      this.prevHoveredBranch = -1;

      /* Particle arrays */
      this.leafParticles = null;
      this.leafVelocities = [];
      this.dustParticles = null;
      this.dustVelocities = [];
      this.mistParticles = null;
      this.mistVelocities = [];
      this.godRays = [];

      /* Camera targets */
      this.cameraTarget = new THREE.Vector3(0, 4, -10);
      this.cameraLookTarget = new THREE.Vector3(0, 4, -10);

      /* Materials (reusable) */
      this.barkMaterial = null;
      this.canopyMaterial = null;
      this.worldBarkMaterial = null;

      this.init();
    }

    /* ============================================
       INITIALIZATION
       ============================================ */
    init() {
      this.setupRenderer();
      this.setupCamera();
      this.setupScene();
      this.setupLighting();
      this.createMaterials();
      this.createGround();
      this.createForest();
      this.createGodRays();
      this.createLeafParticles();
      this.createDustParticles();
      this.createMistParticles();
      this.createWorldTree();
      this.setupEvents();
      this.animate();

      /* Signal ready */
      setTimeout(() => this.onReady(), 800);
    }

    /* ============================================
       RENDERER
       ============================================ */
    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x0c1a08, 1);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.6;
      this.container.appendChild(this.renderer.domElement);
    }

    /* ============================================
       CAMERA
       ============================================ */
    setupCamera() {
      this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 120);
      this.camera.position.set(0, 2.8, 14);
      this.camera.lookAt(0, 3, -10);

      /* Store initial values for breathing */
      this.cameraBasePos = this.camera.position.clone();
      this.cameraBaseLook = new THREE.Vector3(0, 3, -10);
    }

    /* ============================================
       SCENE & FOG
       ============================================ */
    setupScene() {
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x1a2e14, 0.026);
      this.scene.background = new THREE.Color(0x0c1a08);
    }

    /* ============================================
       LIGHTING
       ============================================ */
    setupLighting() {
      /* Warm golden ambient for forest atmosphere */
      const ambient = new THREE.AmbientLight(0x3a6a30, 0.7);
      this.scene.add(ambient);

      /* Hemisphere: warm golden sky / cool mossy ground */
      const hemi = new THREE.HemisphereLight(0x8a9a50, 0x1a3015, 0.55);
      this.scene.add(hemi);

      /* Sun — intense warm golden directional from upper-right */
      this.sunLight = new THREE.DirectionalLight(0xffd870, 3.5);
      this.sunLight.position.set(10, 18, 6);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 1;
      this.sunLight.shadow.camera.far = 50;
      this.sunLight.shadow.camera.left = -15;
      this.sunLight.shadow.camera.right = 15;
      this.sunLight.shadow.camera.top = 15;
      this.sunLight.shadow.camera.bottom = -5;
      this.scene.add(this.sunLight);

      /* Warm golden fill from left */
      const fill = new THREE.DirectionalLight(0xe0b860, 0.9);
      fill.position.set(-6, 8, 3);
      this.scene.add(fill);

      /* Warm back rim for depth and golden haze */
      const rim = new THREE.DirectionalLight(0xa0c040, 0.5);
      rim.position.set(0, 10, -15);
      this.scene.add(rim);

      /* Low golden bounce from ground */
      const bounce = new THREE.DirectionalLight(0xc4a030, 0.3);
      bounce.position.set(0, -2, 0);
      this.scene.add(bounce);
    }

    /* ============================================
       MATERIALS
       ============================================ */
    createMaterials() {
      const barkTex = createBarkTexture();

      this.barkMaterial = new THREE.MeshStandardMaterial({
        map: barkTex,
        color: 0x3a2a12,
        roughness: 0.92,
        metalness: 0.0,
      });

      this.canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a6a28,
        roughness: 0.75,
        metalness: 0.0,
        transparent: true,
        opacity: 0.85,
      });

      this.worldBarkMaterial = new THREE.MeshStandardMaterial({
        map: barkTex,
        color: 0x5a4828,
        roughness: 0.85,
        metalness: 0.05,
        emissive: 0x1a0e04,
        emissiveIntensity: 0.2,
      });
    }

    /* ============================================
       GROUND
       ============================================ */
    createGround() {
      const tex = createGroundTexture();

      /* Higher subdivision for gentle undulation */
      const geo = new THREE.PlaneGeometry(80, 80, 80, 80);

      /* Displace vertices for organic terrain */
      const pos = geo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const gx = pos[i];
        const gy = pos[i + 1];
        pos[i + 2] =
          Math.sin(gx * 0.15) * Math.cos(gy * 0.12) * 0.4 +
          Math.sin(gx * 0.4 + 2.5) * Math.cos(gy * 0.35 + 1.3) * 0.15 +
          Math.sin(gx * 0.08) * 0.25;
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        color: 0x243a1a,
        roughness: 0.90,
        metalness: 0.0,
      });
      const ground = new THREE.Mesh(geo, mat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      this.scene.add(ground);

      /* Forest floor detail */
      this.createUndergrowth();
      this.createGroundDebris();
      this.createGrass();
    }

    /* ============================================
       UNDERGROWTH — Moss mounds & fern clumps
       ============================================ */
    createUndergrowth() {
      const mossColors = [0x1a3a18, 0x1e4a1a, 0x163316, 0x254a20];

      /* Low moss mounds */
      for (let i = 0; i < 30; i++) {
        const size = 0.2 + Math.random() * 0.55;
        const sGeo = new THREE.SphereGeometry(size, 5, 3);

        /* Squash vertically for flat mound */
        const sPos = sGeo.attributes.position.array;
        for (let j = 1; j < sPos.length; j += 3) sPos[j] *= 0.32;
        sGeo.computeVertexNormals();

        const sMat = new THREE.MeshStandardMaterial({
          color: mossColors[Math.floor(Math.random() * mossColors.length)],
          roughness: 1.0,
        });
        const mound = new THREE.Mesh(sGeo, sMat);
        mound.position.set(
          (Math.random() - 0.5) * 30,
          size * 0.12,
          -15 + Math.random() * 25
        );
        mound.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(mound);
      }

      /* Low bush / fern clumps */
      for (let i = 0; i < 10; i++) {
        const fg = new THREE.Group();
        fg.position.set(
          (Math.random() - 0.5) * 28,
          0,
          -15 + Math.random() * 22
        );

        const frondCount = 3 + Math.floor(Math.random() * 3);
        for (let f = 0; f < frondCount; f++) {
          const fH = 0.18 + Math.random() * 0.3;
          const fW = 0.08 + Math.random() * 0.12;
          const fGeo = new THREE.ConeGeometry(fW, fH, 4);
          const fMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.3 + Math.random() * 0.08, 0.4 + Math.random() * 0.2, 0.08 + Math.random() * 0.06),
            roughness: 0.95,
            transparent: true,
            opacity: 0.7,
          });
          const frond = new THREE.Mesh(fGeo, fMat);
          frond.position.set(
            (Math.random() - 0.5) * 0.3,
            fH / 2,
            (Math.random() - 0.5) * 0.3
          );
          frond.rotation.z = (Math.random() - 0.5) * 0.6;
          frond.rotation.x = (Math.random() - 0.5) * 0.6;
          fg.add(frond);
        }
        this.scene.add(fg);
      }
    }

    /* ============================================
       GROUND DEBRIS — Rocks & fallen twigs
       ============================================ */
    createGroundDebris() {
      /* Scattered rocks */
      for (let i = 0; i < 22; i++) {
        const size = 0.06 + Math.random() * 0.25;
        const rGeo = new THREE.DodecahedronGeometry(size, 0);

        /* Deform slightly for organic feel */
        const rPos = rGeo.attributes.position.array;
        for (let j = 0; j < rPos.length; j += 3) {
          rPos[j]     *= 0.7 + Math.random() * 0.6;
          rPos[j + 1] *= 0.5 + Math.random() * 0.5;
          rPos[j + 2] *= 0.7 + Math.random() * 0.6;
        }
        rGeo.computeVertexNormals();

        const rMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(
            0.14 + Math.random() * 0.1,
            0.12 + Math.random() * 0.08,
            0.1 + Math.random() * 0.06
          ),
          roughness: 0.95,
        });
        const rock = new THREE.Mesh(rGeo, rMat);
        rock.position.set(
          (Math.random() - 0.5) * 30,
          size * 0.25,
          -15 + Math.random() * 25
        );
        rock.rotation.y = Math.random() * Math.PI;
        rock.receiveShadow = true;
        this.scene.add(rock);
      }

      /* Fallen twigs */
      for (let i = 0; i < 12; i++) {
        const tLen = 0.5 + Math.random() * 1.4;
        const tGeo = new THREE.CylinderGeometry(0.01, 0.022, tLen, 4);
        const tMat = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 1.0 });
        const twig = new THREE.Mesh(tGeo, tMat);
        twig.position.set(
          (Math.random() - 0.5) * 25,
          0.02,
          -15 + Math.random() * 22
        );
        twig.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        twig.rotation.y = Math.random() * Math.PI;
        this.scene.add(twig);
      }
    }

    /* ============================================
       GRASS — Dense blades covering the ground
       ============================================ */
    createGrass() {
      const bladeCount = 4000;

      /* Grass blade shape: thin triangle, taller */
      const bladeGeo = new THREE.BufferGeometry();
      const verts = new Float32Array([
        -0.05, 0.0, 0.0,
         0.05, 0.0, 0.0,
         0.0,  0.6, 0.0,
      ]);
      bladeGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      bladeGeo.computeVertexNormals();

      /* Multiple green shades for variation — bright enough to look like grass */
      const grassColors = [
        new THREE.Color().setHSL(0.28, 0.60, 0.22),
        new THREE.Color().setHSL(0.30, 0.65, 0.26),
        new THREE.Color().setHSL(0.32, 0.55, 0.20),
        new THREE.Color().setHSL(0.26, 0.50, 0.24),
        new THREE.Color().setHSL(0.34, 0.60, 0.21),
        new THREE.Color().setHSL(0.29, 0.70, 0.28),
        new THREE.Color().setHSL(0.33, 0.55, 0.18),
        new THREE.Color().setHSL(0.27, 0.60, 0.25),
      ];

      const grassMat = new THREE.MeshStandardMaterial({
        color: 0x3a7a2a,
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.InstancedMesh(bladeGeo, grassMat, bladeCount);

      const dummy = new THREE.Object3D();
      const colorAttr = new Float32Array(bladeCount * 3);

      for (let i = 0; i < bladeCount; i++) {
        const x = (Math.random() - 0.5) * 50;
        const z = -25 + Math.random() * 35;

        /* Terrain height at this point (match ground displacement) */
        const ty =
          Math.sin(x * 0.15) * Math.cos(z * 0.12) * 0.4 +
          Math.sin(x * 0.4 + 2.5) * Math.cos(z * 0.35 + 1.3) * 0.15 +
          Math.sin(x * 0.08) * 0.25;

        dummy.position.set(x, ty, z);

        /* Random height and lean */
        const scale = 0.3 + Math.random() * 0.7;
        dummy.scale.set(0.6 + Math.random() * 0.4, scale, 1);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.rotation.z = (Math.random() - 0.5) * 0.4;
        dummy.rotation.x = (Math.random() - 0.5) * 0.2;

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        /* Per-instance color */
        const c = grassColors[Math.floor(Math.random() * grassColors.length)];
        /* Slight random variation */
        const lv = 0.85 + Math.random() * 0.3;
        colorAttr[i * 3]     = c.r * lv;
        colorAttr[i * 3 + 1] = c.g * lv;
        colorAttr[i * 3 + 2] = c.b * lv;
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);

      this.scene.add(mesh);
      this.grassMesh = mesh;
    }

    /* ============================================
       FOREST — Procedural trees in a corridor
       ============================================ */
    createForest() {
      const count = 32;
      const corridorHalfWidth = 3.5;
      const depthMin = -25;
      const depthMax = 8;
      const spread = 10;

      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (corridorHalfWidth + Math.random() * spread);
        const z = depthMin + Math.random() * (depthMax - depthMin);
        const height = 8 + Math.random() * 8;
        const radius = 0.2 + Math.random() * 0.35;

        const tree = this.createTree(x, z, height, radius);
        tree.userData.originalX = x;
        this.forestTrees.push(tree);
        this.scene.add(tree);
      }
    }

    createTree(x, z, height, radius) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      /* Slight random lean for naturalism */
      const leanX = (Math.random() - 0.5) * 0.35;
      const leanZ = (Math.random() - 0.5) * 0.35;

      /* ── TRUNK — tapered cylinder with lean ── */
      const trunkGeo = new THREE.CylinderGeometry(
        radius * 0.35, radius * 1.15, height, 8, 1
      );
      const trunk = new THREE.Mesh(trunkGeo, this.barkMaterial);
      trunk.position.set(leanX * 0.5, height / 2, leanZ * 0.5);
      trunk.rotation.x = leanZ * 0.12;
      trunk.rotation.z = -leanX * 0.12;
      trunk.castShadow = true;
      group.add(trunk);

      /* ── ROOT BUTTRESSES ── */
      const rootCount = 3 + Math.floor(Math.random() * 3);
      for (let r = 0; r < rootCount; r++) {
        const rAngle = (r / rootCount) * Math.PI * 2 + Math.random() * 0.5;
        const rLen = radius * 2.5 + Math.random() * radius * 2;
        const rGeo = new THREE.CylinderGeometry(0.02, radius * 0.35, rLen, 4);
        const root = new THREE.Mesh(rGeo, this.barkMaterial);
        root.position.set(
          Math.sin(rAngle) * radius * 0.6,
          rLen * 0.18,
          Math.cos(rAngle) * radius * 0.6
        );
        root.rotation.z = Math.sin(rAngle) * 0.7;
        root.rotation.x = Math.cos(rAngle) * 0.7;
        group.add(root);
      }

      /* ── MAJOR BRANCHES — 5-7 visible from distance ── */
      const branchCount = 5 + Math.floor(Math.random() * 3);
      const branchEnds = [];

      for (let b = 0; b < branchCount; b++) {
        const bAngle = (b / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
        const bHeight = height * (0.45 + Math.random() * 0.42);
        const bLen = 1.2 + Math.random() * 2.8;
        const bThick = radius * (0.08 + Math.random() * 0.14);

        const bGeo = new THREE.CylinderGeometry(0.018, bThick, bLen, 5);
        const branch = new THREE.Mesh(bGeo, this.barkMaterial);

        const bx = Math.sin(bAngle) * radius * 0.35 + leanX * (bHeight / height);
        const bz = Math.cos(bAngle) * radius * 0.35 + leanZ * (bHeight / height);
        branch.position.set(bx, bHeight, bz);

        const outAngle = 0.45 + Math.random() * 0.65;
        branch.rotation.z = Math.sin(bAngle) * outAngle;
        branch.rotation.x = Math.cos(bAngle) * outAngle;
        group.add(branch);

        /* Branch endpoint for canopy placement */
        const endX = bx + Math.sin(bAngle) * bLen * Math.sin(outAngle) * 0.6;
        const endY = bHeight + bLen * Math.cos(outAngle) * 0.4;
        const endZ = bz + Math.cos(bAngle) * bLen * Math.sin(outAngle) * 0.6;
        branchEnds.push({ x: endX, y: endY, z: endZ });

        /* Sub-branches on ~60% of branches */
        if (Math.random() > 0.4) {
          const subLen = bLen * 0.45;
          const subGeo = new THREE.CylinderGeometry(0.01, 0.035, subLen, 4);
          const sub = new THREE.Mesh(subGeo, this.barkMaterial);
          sub.position.set(endX, endY, endZ);
          sub.rotation.z = branch.rotation.z + (Math.random() - 0.5) * 0.7;
          sub.rotation.x = branch.rotation.x + (Math.random() - 0.5) * 0.5;
          group.add(sub);
        }
      }

      /* ── CANOPY — many small varied clusters ── */
      const canopyCount = 8 + Math.floor(Math.random() * 8);
      const crownY = height;
      const crownSpread = 2 + radius * 3.5;

      for (let c = 0; c < canopyCount; c++) {
        const cSize = 0.6 + Math.random() * 2.0;

        /* Alternate geometry types for irregular silhouette */
        let cGeo;
        const gt = c % 3;
        if (gt === 0) cGeo = new THREE.IcosahedronGeometry(cSize, 0);
        else if (gt === 1) cGeo = new THREE.DodecahedronGeometry(cSize, 0);
        else cGeo = new THREE.IcosahedronGeometry(cSize, 1);

        /* Slight green-shade variation per cluster */
        const cMat = this.canopyMaterial.clone();
        const hue = 0.28 + Math.random() * 0.12;
        const sat = 0.45 + Math.random() * 0.35;
        const lit = 0.1 + Math.random() * 0.14;
        cMat.color.setHSL(hue, sat, lit);
        cMat.opacity = 0.72 + Math.random() * 0.18;

        const canopy = new THREE.Mesh(cGeo, cMat);

        /* Place near branch tips, the rest around the crown dome */
        if (c < branchEnds.length && Math.random() > 0.25) {
          const ep = branchEnds[c];
          canopy.position.set(
            ep.x + (Math.random() - 0.5) * 1.4,
            ep.y + Math.random() * 1.6,
            ep.z + (Math.random() - 0.5) * 1.4
          );
        } else {
          const cAngle = Math.random() * Math.PI * 2;
          const cDist = Math.random() * crownSpread * 0.45;
          canopy.position.set(
            Math.sin(cAngle) * cDist + leanX,
            crownY - 2 + Math.random() * 5,
            Math.cos(cAngle) * cDist + leanZ
          );
        }

        canopy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
        canopy.castShadow = true;
        group.add(canopy);
      }

      return group;
    }

    /* ============================================
       GOD RAYS — Additive planes for volumetric light
       ============================================ */
    createGodRays() {
      const tex = createGodRayTexture();
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        opacity: 1,
      });

      /* Thick dramatic light shafts angled from sun (upper-right, 10,18,6) */
      const rayCount = 24;
      for (let i = 0; i < rayCount; i++) {
        const w = 3.0 + Math.random() * 7.0;
        const h = 25 + Math.random() * 25;
        const geo = new THREE.PlaneGeometry(w, h);
        const ray = new THREE.Mesh(geo, mat.clone());

        /* Spread rays across the whole scene width and depth */
        ray.position.set(
          -12 + Math.random() * 30,
          12 + Math.random() * 10,
          -22 + Math.random() * 28
        );

        /* All rays angled consistently — streaming from upper-right */
        ray.rotation.x = -0.18 + Math.random() * 0.08;
        ray.rotation.y = -0.48 + Math.random() * 0.12;
        ray.rotation.z = 0.15 + Math.random() * 0.12;

        ray.userData.baseOpacity = 0.25 + Math.random() * 0.35;
        ray.userData.opacityMult = 1.0;
        ray.userData.phase = Math.random() * Math.PI * 2;
        ray.userData.speed = 0.08 + Math.random() * 0.18;

        ray.material.opacity = ray.userData.baseOpacity;
        this.godRays.push(ray);
        this.scene.add(ray);
      }
    }

    /* ============================================
       LEAF PARTICLES
       ============================================ */
    createLeafParticles() {
      const count = 180;
      const tex = createLeafTexture();
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      this.leafVelocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = 1 + Math.random() * 14;
        positions[i * 3 + 2] = -20 + Math.random() * 30;
        sizes[i] = 0.15 + Math.random() * 0.4;

        this.leafVelocities.push({
          x: (Math.random() - 0.5) * 0.3,
          y: -0.1 - Math.random() * 0.15,
          z: (Math.random() - 0.5) * 0.2,
          rotSpeed: (Math.random() - 0.5) * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const mat = new THREE.PointsMaterial({
        map: tex,
        size: 0.4,
        sizeAttenuation: true,
        transparent: true,
        alphaTest: 0.1,
        depthWrite: false,
        blending: THREE.NormalBlending,
        color: 0x7ec050,
      });

      this.leafParticles = new THREE.Points(geo, mat);
      this.scene.add(this.leafParticles);
    }

    /* ============================================
       DUST PARTICLES
       ============================================ */
    createDustParticles() {
      const count = 400;
      const tex = createDustTexture();
      const positions = new Float32Array(count * 3);

      this.dustVelocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 35;
        positions[i * 3 + 1] = 0.5 + Math.random() * 12;
        positions[i * 3 + 2] = -20 + Math.random() * 30;

        this.dustVelocities.push({
          x: (Math.random() - 0.5) * 0.05,
          y: 0.01 + Math.random() * 0.04,
          z: (Math.random() - 0.5) * 0.03,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        map: tex,
        size: 0.12,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xf0e8a0,
        opacity: 0.7,
      });

      this.dustParticles = new THREE.Points(geo, mat);
      this.scene.add(this.dustParticles);
    }

    /* ============================================
       MIST PARTICLES — Drifting fog wisps
       ============================================ */
    createMistParticles() {
      const count = 60;
      const tex = createMistTexture();
      const positions = new Float32Array(count * 3);

      this.mistVelocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = 0.3 + Math.random() * 4;
        positions[i * 3 + 2] = -20 + Math.random() * 35;

        this.mistVelocities.push({
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.003,
          z: 0.003 + Math.random() * 0.006,
          phase: Math.random() * Math.PI * 2,
          drift: 0.5 + Math.random() * 1.0,
        });
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        map: tex,
        size: 7,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        color: 0xc0d090,
        opacity: 0.22,
      });

      this.mistParticles = new THREE.Points(geo, mat);
      this.scene.add(this.mistParticles);
    }

    /* ============================================
       WORLD TREE — Central trunk + 9 branches
       Hidden initially, revealed after ENTER
       ============================================ */
    createWorldTree() {
      this.worldTreeGroup = new THREE.Group();
      this.worldTreeGroup.visible = false;
      this.worldTreeGroup.position.set(0, 0, -8);

      /* Central trunk */
      const trunkH = 8;
      const trunkGeo = new THREE.CylinderGeometry(0.4, 1.0, trunkH, 10, 4);
      const trunk = new THREE.Mesh(trunkGeo, this.worldBarkMaterial);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      this.worldTreeGroup.add(trunk);

      /* Root flare */
      for (let r = 0; r < 5; r++) {
        const rootAngle = (r / 5) * Math.PI * 2 + Math.random() * 0.4;
        const rootLen = 1.5 + Math.random() * 1.5;
        const rootGeo = new THREE.CylinderGeometry(0.05, 0.25, rootLen, 5);
        const root = new THREE.Mesh(rootGeo, this.worldBarkMaterial);
        root.position.set(
          Math.sin(rootAngle) * 0.8,
          0.3,
          Math.cos(rootAngle) * 0.8
        );
        root.rotation.z = Math.sin(rootAngle) * 0.8;
        root.rotation.x = Math.cos(rootAngle) * 0.8;
        this.worldTreeGroup.add(root);
      }

      /* 9 Branches */
      this.branchMeshes = [];
      this.branchEndpoints = [];
      this.branchHitTargets = [];

      for (let i = 0; i < 9; i++) {
        const branchGroup = this.createBranch(i);
        this.worldTreeGroup.add(branchGroup);
      }

      this.scene.add(this.worldTreeGroup);
    }

    createBranch(index) {
      const group = new THREE.Group();
      const a = BRANCH_ANGLES[index];
      const azRad = a.azimuth * Math.PI / 180;
      const elRad = a.elevation * Math.PI / 180;

      /* Start point on trunk */
      const startY = 4.5 + (index < 5 ? 2.0 : 0);
      const start = new THREE.Vector3(
        Math.sin(azRad) * 0.6,
        startY,
        Math.cos(azRad) * 0.6
      );

      /* End point */
      const dx = Math.sin(azRad) * Math.cos(elRad) * a.length;
      const dy = Math.sin(elRad) * a.length;
      const dz = Math.cos(azRad) * Math.cos(elRad) * a.length;
      const end = new THREE.Vector3(
        start.x + dx,
        start.y + dy,
        start.z + dz
      );

      /* Midpoints for organic curve */
      const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.35);
      mid1.y += 0.5 + Math.random() * 0.8;
      mid1.x += (Math.random() - 0.5) * 0.8;

      const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.7);
      mid2.y += 0.3 + Math.random() * 0.5;
      mid2.z += (Math.random() - 0.5) * 0.5;

      /* Create tube along curve */
      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.12, 6, false);

      /* Custom material per branch for hover glow */
      const branchMat = this.worldBarkMaterial.clone();
      branchMat.emissive = new THREE.Color(0x0a0500);
      branchMat.emissiveIntensity = 0.1;

      const branchMesh = new THREE.Mesh(tubeGeo, branchMat);
      branchMesh.castShadow = true;
      branchMesh.userData.branchIndex = index;
      group.add(branchMesh);

      /* Small canopy cluster at end */
      for (let c = 0; c < 2; c++) {
        const cSize = 0.6 + Math.random() * 0.8;
        const cGeo = new THREE.IcosahedronGeometry(cSize, 1);
        const cMat = this.canopyMaterial.clone();
        const canopy = new THREE.Mesh(cGeo, cMat);
        canopy.position.copy(end);
        canopy.position.x += (Math.random() - 0.5) * 1;
        canopy.position.y += Math.random() * 0.8;
        canopy.position.z += (Math.random() - 0.5) * 1;
        canopy.userData.branchIndex = index;
        group.add(canopy);
      }

      /* Glowing endpoint sphere */
      const glowGeo = new THREE.SphereGeometry(0.15, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xddb855,
        transparent: true,
        opacity: 0.55,
      });
      const glowSphere = new THREE.Mesh(glowGeo, glowMat);
      glowSphere.position.copy(end);
      glowSphere.userData.branchIndex = index;
      group.add(glowSphere);

      /* Invisible hit target (larger sphere for raycasting) */
      const hitGeo = new THREE.SphereGeometry(1.0, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({
        visible: false,
      });
      const hitTarget = new THREE.Mesh(hitGeo, hitMat);
      hitTarget.position.copy(end);
      hitTarget.userData.branchIndex = index;
      group.add(hitTarget);

      /* Store references */
      this.branchMeshes.push({ mesh: branchMesh, material: branchMat, glow: glowSphere });
      this.branchEndpoints.push(end.clone().add(this.worldTreeGroup.position));
      this.branchHitTargets.push(hitTarget);

      /* Scale to 0 initially (will be animated in) */
      group.scale.set(0, 0, 0);
      group.userData.branchIndex = index;

      return group;
    }

    /* ============================================
       EVENTS
       ============================================ */
    setupEvents() {
      window.addEventListener('resize', () => this.onResize());
      window.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('click', (e) => this.onClick(e));
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this.state === 'splash') {
          this.enter();
        }
      });
    }

    onResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    }

    onMouseMove(e) {
      this.mouse.x = (e.clientX / this.width) * 2 - 1;
      this.mouse.y = -(e.clientY / this.height) * 2 + 1;
    }

    onClick(e) {
      if (this.state !== 'branches') return;
      if (this.hoveredBranch >= 0) {
        const data = BRANCH_DATA[this.hoveredBranch];
        if (data.url !== '#') {
          /* Animate camera toward branch, then navigate */
          this.navigateToBranch(this.hoveredBranch);
        }
      }
    }

    /* ============================================
       READY — Hide loading, show splash
       ============================================ */
    onReady() {
      this.state = 'splash';
      const loading = document.getElementById('loading-screen');
      const splash = document.getElementById('splash-overlay');

      if (loading) {
        gsap.to(loading, {
          opacity: 0, duration: 0.8,
          onComplete: () => { loading.style.display = 'none'; }
        });
      }
      if (splash) {
        gsap.fromTo(splash, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.5 });
        gsap.fromTo('.splash-text', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, delay: 0.8 });
        gsap.fromTo('.splash-divider', { width: 0, opacity: 0 }, { width: 60, opacity: 0.5, duration: 1, delay: 1.5 });
        gsap.fromTo('.splash-enter', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 1.8 });
      }
    }

    /* ============================================
       ENTER — The dramatic GSAP transition
       ============================================ */
    enter() {
      if (this.state !== 'splash') return;
      this.state = 'entering';

      const splash = document.getElementById('splash-overlay');
      const header = document.getElementById('site-header');

      const tl = gsap.timeline({
        onComplete: () => {
          this.state = 'branches';
          this.createBranchLabels();
        }
      });

      /* 1. Fade out splash text */
      tl.to('.splash-text', { opacity: 0, y: -30, duration: 0.6 }, 0);
      tl.to('.splash-divider', { opacity: 0, duration: 0.4 }, 0.1);
      tl.to('.splash-enter', { opacity: 0, y: -20, duration: 0.4 }, 0.1);
      tl.to(splash, { opacity: 0, duration: 0.3 }, 0.6);
      tl.call(() => { if (splash) splash.style.display = 'none'; }, null, 0.9);

      /* 2. Camera pushes forward into the forest (2s) */
      tl.to(this.camera.position, {
        z: 2, y: 3.2,
        duration: 2.5,
        ease: 'power2.inOut',
      }, 0.5);

      /* 3. Trees slide outward (staggered, 2s) */
      this.forestTrees.forEach((tree, i) => {
        const dir = tree.userData.originalX > 0 ? 1 : -1;
        const delay = 0.8 + Math.random() * 0.6;
        tl.to(tree.position, {
          x: tree.userData.originalX + dir * 15,
          duration: 2.0,
          ease: 'power2.in',
        }, delay);
        tl.to(tree, {
          visible: false,
          duration: 0,
        }, delay + 2.0);
      });

      /* 4. Boost leaf particles (swirl effect) */
      tl.call(() => {
        this.leafVelocities.forEach(v => {
          v.x *= 4;
          v.y *= 2;
          v.z *= 4;
        });
      }, null, 1.0);

      /* Calm particles back down */
      tl.call(() => {
        this.leafVelocities.forEach(v => {
          v.x *= 0.25;
          v.y *= 0.5;
          v.z *= 0.25;
        });
      }, null, 2.5);

      /* 5. Dim god rays slightly but keep them very visible */
      this.godRays.forEach(ray => {
        tl.to(ray.userData, {
          opacityMult: 0.65,
          duration: 1.5,
        }, 1.5);
      });

      /* 6. Show world tree */
      tl.call(() => {
        this.worldTreeGroup.visible = true;
        this.worldTreeGroup.scale.set(0.01, 0.01, 0.01);
      }, null, 2.2);

      /* Grow the trunk */
      tl.to(this.worldTreeGroup.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.8,
        ease: 'elastic.out(1, 0.6)',
      }, 2.3);

      /* 7. Camera settles at viewing position */
      tl.to(this.camera.position, {
        x: 0, y: 5.5, z: 10,
        duration: 1.5,
        ease: 'power2.inOut',
      }, 3.0);

      /* Update camera base position */
      tl.call(() => {
        this.cameraBasePos.set(0, 5.5, 10);
        this.cameraBaseLook.set(0, 5, -8);
      }, null, 4.5);

      /* 8. Grow 9 branches with stagger */
      const branchChildren = this.worldTreeGroup.children.filter(
        c => c.userData.branchIndex !== undefined
      );
      branchChildren.forEach((group, i) => {
        tl.to(group.scale, {
          x: 1, y: 1, z: 1,
          duration: 1.2,
          ease: 'back.out(1.2)',
        }, 3.5 + i * 0.12);
      });

      /* 9. Show header */
      tl.call(() => {
        if (header) header.classList.add('visible');
      }, null, 4.8);

      /* 10. Slightly reduce fog to reveal world tree more clearly */
      tl.to(this.scene.fog, {
        density: 0.02,
        duration: 2.0,
      }, 2.5);
    }

    /* ============================================
       BRANCH LABELS — HTML overlays
       ============================================ */
    createBranchLabels() {
      const container = document.getElementById('branch-labels');
      if (!container) return;
      container.innerHTML = '';

      this._labelHover = -1;

      BRANCH_DATA.forEach((data, i) => {
        const label = document.createElement('div');
        label.className = 'branch-label' + (data.url === '#' ? ' branch-label-empty' : '');
        label.dataset.index = i;
        label.innerHTML = `
          <span class="bl-num">${data.num}</span>
          <span class="bl-name">${data.name}</span>
          <span class="bl-sub">${data.sub}</span>
        `;
        label.style.opacity = '0';
        container.appendChild(label);

        /* Fade in with stagger */
        gsap.to(label, {
          opacity: 1,
          duration: 0.6,
          delay: 0.1 * i,
        });

        /* Click handler */
        label.addEventListener('click', () => {
          if (data.url !== '#') {
            this.navigateToBranch(i);
          }
        });

        /* Track label hover state to prevent flicker */
        label.addEventListener('mouseenter', () => {
          this._labelHover = i;
        });
        label.addEventListener('mouseleave', () => {
          if (this._labelHover === i) this._labelHover = -1;
        });
      });
    }

    /* ============================================
       NAVIGATE TO BRANCH
       ============================================ */
    navigateToBranch(index) {
      if (this.state !== 'branches') return;
      this.state = 'navigating';

      const endpoint = this.branchEndpoints[index];
      const data = BRANCH_DATA[index];

      const tl = gsap.timeline();

      /* Camera flies toward the branch */
      tl.to(this.camera.position, {
        x: endpoint.x * 0.6,
        y: endpoint.y * 0.8,
        z: endpoint.z * 0.6 + 2,
        duration: 1.3,
        ease: 'power2.in',
      }, 0);

      /* Fade out labels */
      tl.to('.branch-labels', { opacity: 0, duration: 0.4 }, 0);
      tl.to('#site-header', { opacity: 0, duration: 0.4 }, 0);

      /* Increase fog */
      tl.to(this.scene.fog, { density: 0.08, duration: 1.3 }, 0);

      /* Start leaf cover mid-way through camera move */
      tl.call(() => {
        this.createLeafTransition(() => {
          sessionStorage.setItem('leaf-transition', 'true');
          window.location.href = data.url;
        });
      }, null, 0.4);
    }

    /* ============================================
       LEAF TRANSITION — Dense bush of realistic leaves
       ============================================ */
    createLeafTransition(onComplete) {
      const overlay = document.createElement('div');
      overlay.id = 'leaf-transition';
      document.body.appendChild(overlay);

      /* Solid green backdrop guarantees no gaps */
      const backdrop = document.createElement('div');
      backdrop.className = 'leaf-backdrop';
      overlay.appendChild(backdrop);

      const leafCount = 280;
      const greens = [
        '#1a3a12', '#2a5a20', '#1e4a18', '#3a6a30', '#244a1e',
        '#1c3c14', '#2e5e28', '#3a7a30', '#1a4a1a', '#2c4c1c',
        '#1d4518', '#335d26', '#183a14', '#204820', '#2a5528',
        '#163210', '#284e1e', '#30602a', '#1a4020', '#224a18',
      ];

      /* 8 realistic leaf clip-path shapes */
      const leafShapes = [
        /* Oak-like with lobes */
        'polygon(50% 0%, 65% 8%, 75% 5%, 80% 18%, 95% 22%, 85% 35%, 98% 45%, 82% 52%, 90% 65%, 75% 68%, 78% 82%, 60% 78%, 50% 100%, 40% 78%, 22% 82%, 25% 68%, 10% 65%, 18% 52%, 2% 45%, 15% 35%, 5% 22%, 20% 18%, 25% 5%, 35% 8%)',
        /* Maple-like */
        'polygon(50% 0%, 60% 15%, 85% 5%, 72% 28%, 100% 35%, 75% 45%, 90% 65%, 65% 55%, 60% 80%, 50% 100%, 40% 80%, 35% 55%, 10% 65%, 25% 45%, 0% 35%, 28% 28%, 15% 5%, 40% 15%)',
        /* Birch/elm — simple serrated */
        'polygon(50% 0%, 62% 12%, 70% 8%, 72% 22%, 82% 20%, 80% 35%, 90% 38%, 82% 50%, 88% 58%, 78% 65%, 80% 75%, 65% 78%, 62% 90%, 50% 100%, 38% 90%, 35% 78%, 20% 75%, 22% 65%, 12% 58%, 18% 50%, 10% 38%, 20% 35%, 18% 20%, 28% 22%, 30% 8%, 38% 12%)',
        /* Broad oval leaf */
        'ellipse(42% 50% at 50% 50%)',
        /* Pointed leaf */
        'polygon(50% 0%, 75% 30%, 80% 55%, 70% 75%, 50% 100%, 30% 75%, 20% 55%, 25% 30%)',
        /* Elongated willow-like */
        'polygon(50% 0%, 62% 15%, 68% 35%, 65% 55%, 60% 75%, 50% 100%, 40% 75%, 35% 55%, 32% 35%, 38% 15%)',
        /* Irregular jagged edge */
        'polygon(50% 0%, 58% 6%, 72% 4%, 68% 18%, 85% 25%, 78% 38%, 92% 48%, 80% 55%, 85% 70%, 72% 72%, 68% 88%, 55% 82%, 50% 100%, 45% 82%, 32% 88%, 28% 72%, 15% 70%, 20% 55%, 8% 48%, 22% 38%, 15% 25%, 32% 18%, 28% 4%, 42% 6%)',
        /* Heart-shaped */
        'polygon(50% 8%, 60% 0%, 75% 2%, 88% 15%, 92% 32%, 82% 52%, 68% 70%, 50% 100%, 32% 70%, 18% 52%, 8% 32%, 12% 15%, 25% 2%, 40% 0%)',
      ];

      const W = window.innerWidth;
      const H = window.innerHeight;
      const leaves = [];

      /* Dense grid coverage: more cols/rows, smaller cells */
      const cols = 16;
      const rows = Math.ceil(leafCount / cols);

      for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'transition-leaf';

        const size = 40 + Math.random() * 80;
        const color = greens[Math.floor(Math.random() * greens.length)];
        const shape = leafShapes[Math.floor(Math.random() * leafShapes.length)];

        leaf.style.width  = size + 'px';
        leaf.style.height = size * (1.0 + Math.random() * 0.5) + 'px';
        leaf.style.background = color;
        leaf.style.clipPath = shape;

        /* Add leaf vein detail */
        const vein = document.createElement('div');
        vein.className = 'leaf-vein';
        leaf.appendChild(vein);

        overlay.appendChild(leaf);
        leaves.push(leaf);
      }

      leaves.forEach((leaf, i) => {
        /* Start position — random edge of viewport */
        const edge = Math.random() * Math.PI * 2;
        const dist = Math.max(W, H) * 0.85;
        const startX = W / 2 + Math.cos(edge) * dist;
        const startY = H / 2 + Math.sin(edge) * dist;

        /* End position — dense overlapping grid */
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellW = W / (cols - 1);
        const cellH = H / (rows - 1);
        const endX = col * cellW + (Math.random() - 0.5) * cellW * 0.8;
        const endY = row * cellH + (Math.random() - 0.5) * cellH * 0.8;

        gsap.fromTo(leaf,
          {
            left: startX, top: startY,
            opacity: 0, scale: 0.3,
            rotation: Math.random() * 360,
          },
          {
            left: endX, top: endY,
            opacity: 1, scale: 1.0 + Math.random() * 0.4,
            rotation: Math.random() * 360,
            duration: 0.5 + Math.random() * 0.5,
            delay: Math.random() * 0.5,
            ease: 'power2.in',
          }
        );
      });

      /* Fade in backdrop behind leaves */
      gsap.fromTo(backdrop, { opacity: 0 }, {
        opacity: 1, duration: 0.6, delay: 0.3, ease: 'power1.in'
      });

      /* Navigate after full bush coverage */
      setTimeout(() => { if (onComplete) onComplete(); }, 1600);
    }

    /* ============================================
       ANIMATION LOOP
       ============================================ */
    animate() {
      requestAnimationFrame(() => this.animate());

      const time = this.clock.getElapsedTime();
      const delta = this.clock.getDelta();

      this.updateCamera(time);
      this.updateLeafParticles(time);
      this.updateDustParticles(time);
      this.updateMistParticles(time);
      this.updateGodRays(time);
      this.updateBranchInteraction();
      this.updateBranchLabels();

      this.renderer.render(this.scene, this.camera);
    }

    /* ============================================
       UPDATE: Camera breathing + mouse parallax
       ============================================ */
    updateCamera(time) {
      /* Smooth mouse follow */
      this.mouseSmooth.x += (this.mouse.x - this.mouseSmooth.x) * 0.03;
      this.mouseSmooth.y += (this.mouse.y - this.mouseSmooth.y) * 0.03;

      /* Breathing */
      const breathX = Math.sin(time * 0.4) * 0.04;
      const breathY = Math.sin(time * 0.3) * 0.03;

      /* Mouse parallax */
      const parallaxX = this.mouseSmooth.x * 0.8;
      const parallaxY = this.mouseSmooth.y * 0.4;

      /* Apply */
      this.camera.position.x = this.cameraBasePos.x + breathX + parallaxX;
      this.camera.position.y = this.cameraBasePos.y + breathY + parallaxY * 0.3;

      /* Look target */
      const lookX = this.cameraBaseLook.x + parallaxX * 0.5;
      const lookY = this.cameraBaseLook.y + parallaxY * 0.3;
      const lookZ = this.cameraBaseLook.z;

      this.cameraLookTarget.set(lookX, lookY, lookZ);
      this.camera.lookAt(this.cameraLookTarget);
    }

    /* ============================================
       UPDATE: Leaf particles
       ============================================ */
    updateLeafParticles(time) {
      if (!this.leafParticles) return;
      const pos = this.leafParticles.geometry.attributes.position.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        const v = this.leafVelocities[i];
        const windX = Math.sin(time * 0.5 + v.phase) * 0.02;
        const windZ = Math.cos(time * 0.3 + v.phase * 1.3) * 0.01;

        pos[i * 3]     += v.x * 0.016 + windX;
        pos[i * 3 + 1] += v.y * 0.016;
        pos[i * 3 + 2] += v.z * 0.016 + windZ;

        /* Reset if fallen below ground or out of bounds */
        if (pos[i * 3 + 1] < 0 || Math.abs(pos[i * 3]) > 20) {
          pos[i * 3]     = (Math.random() - 0.5) * 25;
          pos[i * 3 + 1] = 10 + Math.random() * 6;
          pos[i * 3 + 2] = -20 + Math.random() * 30;
        }
      }
      this.leafParticles.geometry.attributes.position.needsUpdate = true;
    }

    /* ============================================
       UPDATE: Dust particles
       ============================================ */
    updateDustParticles(time) {
      if (!this.dustParticles) return;
      const pos = this.dustParticles.geometry.attributes.position.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        const v = this.dustVelocities[i];
        pos[i * 3]     += v.x + Math.sin(time * 0.8 + v.phase) * 0.003;
        pos[i * 3 + 1] += v.y;
        pos[i * 3 + 2] += v.z + Math.cos(time * 0.6 + v.phase) * 0.002;

        if (pos[i * 3 + 1] > 14) {
          pos[i * 3 + 1] = 0.5;
          pos[i * 3] = (Math.random() - 0.5) * 30;
          pos[i * 3 + 2] = -20 + Math.random() * 30;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    /* ============================================
       UPDATE: Mist particles — slow drift
       ============================================ */
    updateMistParticles(time) {
      if (!this.mistParticles) return;
      const pos = this.mistParticles.geometry.attributes.position.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        const v = this.mistVelocities[i];
        const sway = Math.sin(time * 0.15 + v.phase) * v.drift * 0.004;

        pos[i * 3]     += v.x + sway;
        pos[i * 3 + 1] += v.y + Math.sin(time * 0.2 + v.phase * 2) * 0.001;
        pos[i * 3 + 2] += v.z;

        /* Wrap around when mist drifts too far */
        if (pos[i * 3 + 2] > 16) {
          pos[i * 3 + 2] = -22;
          pos[i * 3] = (Math.random() - 0.5) * 40;
          pos[i * 3 + 1] = 0.3 + Math.random() * 4;
        }
        if (Math.abs(pos[i * 3]) > 25) {
          pos[i * 3] = (Math.random() - 0.5) * 20;
        }
      }
      this.mistParticles.geometry.attributes.position.needsUpdate = true;
    }

    /* ============================================
       UPDATE: God rays shimmer
       ============================================ */
    updateGodRays(time) {
      this.godRays.forEach(ray => {
        const shimmer = Math.sin(time * ray.userData.speed + ray.userData.phase);
        const mult = ray.userData.opacityMult !== undefined ? ray.userData.opacityMult : 1;
        ray.material.opacity = ray.userData.baseOpacity * (0.7 + shimmer * 0.3) * mult;
      });
    }

    /* ============================================
       UPDATE: Branch hover interaction
       Uses BOTH raycaster (3D spheres) and label hover
       to prevent feedback loops
       ============================================ */
    updateBranchInteraction() {
      if (this.state !== 'branches') return;

      /* Raycast against hit targets */
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.branchHitTargets);

      /* Combine: 3D raycast OR HTML label hover */
      let newHover = intersects.length > 0 ? intersects[0].object.userData.branchIndex : -1;
      if (newHover < 0 && this._labelHover >= 0) newHover = this._labelHover;

      if (newHover !== this.prevHoveredBranch) {
        /* Un-hover previous */
        if (this.prevHoveredBranch >= 0) {
          const prev = this.branchMeshes[this.prevHoveredBranch];
          gsap.to(prev.material, { emissiveIntensity: 0.1, duration: 0.4 });
          gsap.to(prev.glow.material, { opacity: 0.4, duration: 0.4 });
          gsap.to(prev.glow.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
        }

        /* Hover new */
        if (newHover >= 0) {
          const cur = this.branchMeshes[newHover];
          gsap.to(cur.material, { emissiveIntensity: 0.5, duration: 0.3 });
          gsap.to(cur.material.emissive, { r: 0.2, g: 0.15, b: 0.05, duration: 0.3 });
          gsap.to(cur.glow.material, { opacity: 0.9, duration: 0.3 });
          gsap.to(cur.glow.scale, { x: 2, y: 2, z: 2, duration: 0.3 });

          document.body.style.cursor = 'pointer';
        } else {
          document.body.style.cursor = 'default';
        }

        this.hoveredBranch = newHover;
        this.prevHoveredBranch = newHover;
      }
    }

    /* ============================================
       UPDATE: Branch label positions (3D → 2D projection)
       Includes 2D collision avoidance + smoothing
       ============================================ */
    updateBranchLabels() {
      if (this.state !== 'branches' && this.state !== 'navigating') return;

      const labels = document.querySelectorAll('.branch-label');
      if (!labels.length) return;

      /* Initialize smoothed positions on first call */
      if (!this._labelPositions) {
        this._labelPositions = [];
        for (let i = 0; i < 9; i++) {
          this._labelPositions.push({ x: this.width / 2, y: this.height / 2 });
        }
      }

      /* Step 1: Project all endpoints to 2D */
      const targets = [];
      labels.forEach((label, i) => {
        if (i >= this.branchEndpoints.length) return;
        const pos = this.branchEndpoints[i];
        const projected = pos.clone().project(this.camera);

        targets.push({
          x: (projected.x * 0.5 + 0.5) * this.width,
          y: (-projected.y * 0.5 + 0.5) * this.height,
          z: projected.z,
          label,
          index: i,
          w: label.offsetWidth || 110,
          h: label.offsetHeight || 70,
        });
      });

      /* Step 2: Resolve overlaps by pushing labels apart */
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 0; i < targets.length; i++) {
          for (let j = i + 1; j < targets.length; j++) {
            const a = targets[i];
            const b = targets[j];
            const overlapX = (a.w / 2 + b.w / 2 + 6) - Math.abs(a.x - b.x);
            const overlapY = (a.h / 2 + b.h / 2 + 6) - Math.abs(a.y - b.y);

            if (overlapX > 0 && overlapY > 0) {
              if (overlapX < overlapY) {
                const pushX = overlapX / 2 + 2;
                if (a.x < b.x) { a.x -= pushX; b.x += pushX; }
                else { a.x += pushX; b.x -= pushX; }
              } else {
                const pushY = overlapY / 2 + 2;
                if (a.y < b.y) { a.y -= pushY; b.y += pushY; }
                else { a.y += pushY; b.y -= pushY; }
              }
            }
          }
        }
      }

      /* Step 3: Clamp to viewport */
      targets.forEach(p => {
        const pad = 8;
        p.x = Math.max(p.w / 2 + pad, Math.min(this.width - p.w / 2 - pad, p.x));
        p.y = Math.max(p.h / 2 + pad, Math.min(this.height - p.h / 2 - pad, p.y));
      });

      /* Step 4: Smooth / lerp toward target (prevents jitter) */
      const smoothing = 0.12;
      targets.forEach((p, i) => {
        const sp = this._labelPositions[i];
        sp.x += (p.x - sp.x) * smoothing;
        sp.y += (p.y - sp.y) * smoothing;

        if (p.z < 1) {
          p.label.style.transform = `translate(-50%, -50%) translate(${sp.x}px, ${sp.y}px)`;
          p.label.style.display = 'block';

          if (p.index === this.hoveredBranch) {
            p.label.classList.add('branch-label-active');
          } else {
            p.label.classList.remove('branch-label-active');
          }
        } else {
          p.label.style.display = 'none';
        }
      });
    }

    /* ============================================
       DISPOSE
       ============================================ */
    dispose() {
      this.renderer.dispose();
      this.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }
  }

  /* Export */
  window.ForestExperience = ForestExperience;
})();

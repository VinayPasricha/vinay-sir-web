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

  /* All 7 paths radiate FORWARD from center so they're all visible
     from the entrance. Spread evenly across ~240° arc ahead. */
  const BRANCH_TREE = {
    start: [0, 0, 38],     // entrance
    end: [0, 0, 0],        // center clearing
    width: 2.2,            // wide main trail
    edgeId: 'trunk',
    children: [
      /* FAR LEFT */
      { end: [-28, 0, 5], width: 1.0, pathIndex: 1 },      // The Builder

      /* LEFT */
      { end: [-25, 0, -12], width: 1.0, pathIndex: 2 },    // The Thinker

      /* CENTER-LEFT */
      { end: [-12, 0, -28], width: 1.0, pathIndex: 3 },    // The Technologist

      /* CENTER — straight ahead */
      { end: [0, 0, -30], width: 1.1, pathIndex: 4 },      // The Future

      /* CENTER-RIGHT */
      { end: [12, 0, -28], width: 1.0, pathIndex: 5 },     // The Writer

      /* RIGHT */
      { end: [25, 0, -12], width: 1.0, pathIndex: 6 },     // The Social Being

      /* FAR RIGHT */
      { end: [28, 0, 5], width: 1.0, pathIndex: 0 },       // The Human
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

      /* Player state */
      this.yaw = 0;
      this.pitch = 0;
      this.playerPos = new THREE.Vector3(0, PLAYER_HEIGHT, 38);
      this.playerVel = new THREE.Vector3();
      this.currentEdge = null;
      this.playerT = 0;
      this.isLocked = false;

      /* Input */
      this.keys = {};
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
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.3;
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
      this.scene.background = new THREE.Color(0x060e06);
      this.fog = new THREE.FogExp2(0x0a1a0d, 0.005);
      this.scene.fog = this.fog;

      this.scene.add(new THREE.HemisphereLight(0x87CEEB, 0x2a4a1a, 0.5));
      this.scene.add(new THREE.AmbientLight(0x1a3a1a, 0.4));

      this.sun = new THREE.DirectionalLight(0xfff4d0, 2.0);
      this.sun.position.set(-15, 50, 15);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1024, 1024);
      this.sun.shadow.camera.left = -20;
      this.sun.shadow.camera.right = 20;
      this.sun.shadow.camera.top = 20;
      this.sun.shadow.camera.bottom = -20;
      this.sun.shadow.camera.near = 5;
      this.sun.shadow.camera.far = 80;
      this.sun.shadow.bias = -0.0005;
      this.scene.add(this.sun);

      const fill = new THREE.DirectionalLight(0xaaccaa, 0.4);
      fill.position.set(15, 30, -15);
      this.scene.add(fill);

      this.scene.add(new THREE.DirectionalLight(0xffe8c0, 0.3).translateZ(-40).translateY(15));
    }

    createTerrain() {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 1024;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#141e10';
      ctx.fillRect(0, 0, 1024, 1024);
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < [4000, 3000, 2000][pass]; i++) {
          const g = 20 + pass * 15 + Math.random() * 30;
          ctx.fillStyle = `rgba(${g * 0.4},${g},${5 + Math.random() * 10},${[0.3, 0.15, 0.08][pass]})`;
          ctx.beginPath();
          ctx.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * [2, 4, 8][pass], 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);

      const geo = new THREE.PlaneGeometry(120, 120, 64, 64);
      const pos = geo.attributes.position.array;
      for (let i = 2; i < pos.length; i += 3) {
        const px = pos[i - 2] * 0.12, py = pos[i - 1] * 0.12;
        pos[i] += Math.sin(px) * Math.cos(py) * 0.15 + (Math.random() - 0.5) * 0.05;
      }
      geo.computeVertexNormals();

      const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        map: tex, color: 0x1a3a14, roughness: 0.93, metalness: 0
      }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    buildBranchingPaths(node, parentEnd) {
      const start = parentEnd
        ? new THREE.Vector3(parentEnd.x, 0, parentEnd.z)
        : new THREE.Vector3(node.start[0], 0, node.start[2]);
      const end = new THREE.Vector3(node.end[0], 0, node.end[2]);

      const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.3);
      const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.65);
      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);

      /* Gentle wobble — keep paths connected at junctions */
      mid1.add(perp.clone().multiplyScalar((Math.random() - 0.5) * 1.2));
      mid2.add(perp.clone().multiplyScalar((Math.random() - 0.5) * 1.0));

      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
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
        dctx.fillStyle = '#6a5030';
        dctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 3000; i++) {
          const v = Math.random();
          dctx.fillStyle = v > 0.7
            ? `rgba(${80 + Math.random() * 40},${55 + Math.random() * 30},${30 + Math.random() * 20},${0.4 + Math.random() * 0.3})`
            : `rgba(${50 + Math.random() * 30},${35 + Math.random() * 25},${18 + Math.random() * 12},${0.15 + Math.random() * 0.2})`;
          dctx.beginPath();
          dctx.arc(Math.random() * 256, Math.random() * 256, 0.5 + Math.random() * 2.5, 0, Math.PI * 2);
          dctx.fill();
        }
        this._dirtTex = new THREE.CanvasTexture(dc);
        this._dirtTex.wrapS = this._dirtTex.wrapT = THREE.RepeatWrapping;
      }

      const pts = curve.getPoints(80);
      const verts = [], uvs = [], idx = [];

      for (let p = 0; p < pts.length; p++) {
        const pt = pts[p], t = p / (pts.length - 1);
        const taper = Math.sin(t * Math.PI) * 0.3 + 0.7;
        const w = width * taper * (1 + Math.sin(t * 15 + (pathIndex || 0) * 3) * 0.08);
        const tangent = curve.getTangent(Math.min(t, 0.999));
        const pr = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const y = 0.04 + Math.sin(t * 8) * 0.01;
        verts.push(pt.x + pr.x * w, y, pt.z + pr.z * w, pt.x - pr.x * w, y, pt.z - pr.z * w);
        uvs.push(0, t * 6, 1, t * 6);
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
        map: this._dirtTex, color: 0x9a7a50, roughness: 0.88, metalness: 0
      });

      const trail = new THREE.Mesh(geo, mat);
      trail.receiveShadow = true;
      this.scene.add(trail);

      /* Glow overlay — same shape but emissive, hidden by default */
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffe880, transparent: true, opacity: 0, depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(geo.clone(), glowMat);
      glowMesh.position.y = 0.02;
      this.scene.add(glowMesh);

      this.pathSegments.push({ trail, mat, glowMat, glowMesh, curve, pathIndex });

      /* Single torch at path midpoint for direction */
      if (pathIndex !== undefined) {
        const torchPts = curve.getPoints(80);
        const mid = torchPts[Math.floor(torchPts.length * 0.5)];
        const tangent = curve.getTangent(0.5);
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const tx = mid.x + perp.x * (width + 0.4);
        const tz = mid.z + perp.z * (width + 0.4);

        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.05, 1.5, 4),
          new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.9 })
        );
        pole.position.set(tx, 0.75, tz);
        this.scene.add(pole);

        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffaa30, transparent: true, opacity: 0.8 })
        );
        flame.position.set(tx, 1.6, tz);
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
      while (positions.length < 600 && tries < 4000) {
        tries++;
        const x = (Math.random() - 0.5) * 90, z = (Math.random() - 0.5) * 90;
        if (x * x + z * z < 36) continue;  // big center clearing (radius 6)
        if (distPaths(x, z) < 3.0) continue;  // wider path corridors
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

      const trunkGeo = new THREE.CylinderGeometry(0.08, 0.16, 2.0, 5);
      const cone1 = new THREE.ConeGeometry(1.0, 2.2, 7);
      const cone2 = new THREE.ConeGeometry(0.75, 1.6, 6);
      const cone3 = new THREE.ConeGeometry(0.5, 1.2, 6);
      const crownGeo = new THREE.IcosahedronGeometry(0.85, 1);

      const greens = [0x1a5218, 0x226420, 0x164612, 0x2a6e26, 0x1e5a1e, 0x306830].map(c => new THREE.Color(c));

      const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
      trunkMesh.castShadow = true;
      const c1Mesh = new THREE.InstancedMesh(cone1, canopyMat.clone(), count);
      c1Mesh.castShadow = true;
      c1Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const c2Mesh = new THREE.InstancedMesh(cone2, canopyMat.clone(), count);
      c2Mesh.castShadow = true;
      c2Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const c3Mesh = new THREE.InstancedMesh(cone3, canopyMat.clone(), count);
      c3Mesh.castShadow = true;
      c3Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
      const crMesh = new THREE.InstancedMesh(crownGeo, canopyMat.clone(), count);
      crMesh.castShadow = true;
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
      /* Flat ground glow disc — no 3D spheres */
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(4, 32),
        new THREE.MeshBasicMaterial({ color: 0xffe880, transparent: true, opacity: 0.12, depthWrite: false })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.08;
      this.scene.add(disc);

      /* Single warm light at center */
      this.centerLight = new THREE.PointLight(0xffe080, 2, 15, 2);
      this.centerLight.position.set(0, 2, 0);
      this.scene.add(this.centerLight);
    }

    createFireflies() {
      const count = 50;
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

    /* ── PATH MARKERS — Simple signposts, no orbs ── */
    createPathMarkers() {
      this.markers = [];
      const postMat = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.9 });
      const signMat = new THREE.MeshStandardMaterial({ color: 0x5a4020, roughness: 0.85 });

      PATH_DATA.forEach((path, i) => {
        const ep = this.pathEndpoints[i];
        if (!ep) return;

        /* Wooden signpost at endpoint */
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 5), postMat);
        pole.position.set(ep.x, 1.1, ep.z);
        this.scene.add(pole);

        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.05), signMat);
        plank.position.set(ep.x, 2.0, ep.z);
        plank.lookAt(0, 2.0, 0);
        this.scene.add(plank);

        this.markers.push({ pathIndex: i });
      });
    }

    /* ── HUD — Crosshair + path info + controls prompt ── */
    createHUD() {
      this.hud = document.createElement('div');
      this.hud.className = 'fp-hud';
      this.hud.style.display = 'none';
      this.hud.innerHTML = `
        <div class="fp-crosshair">+</div>
        <div class="fp-path-info" id="fp-path-info"></div>
        <div class="fp-controls-hint" id="fp-hint">
          Click to look around &bull; WASD to walk
        </div>
      `;
      this.container.appendChild(this.hud);
    }

    /* ── CONTROLS — Pointer lock + WASD ── */
    setupControls() {
      /* Keyboard */
      window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

      /* Pointer lock */
      this.renderer.domElement.addEventListener('click', () => {
        if (this.state === 'walking' && !this.isLocked) {
          this.renderer.domElement.requestPointerLock();
        }
      });

      document.addEventListener('pointerlockchange', () => {
        this.isLocked = document.pointerLockElement === this.renderer.domElement;
      });

      document.addEventListener('mousemove', (e) => {
        if (!this.isLocked || this.state !== 'walking') return;
        this.yaw -= e.movementX * MOUSE_SENSITIVITY;
        this.pitch -= e.movementY * MOUSE_SENSITIVITY;
        this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
      });

      /* Resize */
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    /* ── ENTER — Cinematic descent: spiral down → swoop → land ── */
    enter() {
      if (this.state !== 'splash') return;
      this.state = 'descending';

      /* Camera descent path — smooth curve from sky to ground */
      const descentCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 55, 25),        // start: aerial
        new THREE.Vector3(8, 38, 30),         // spiral right
        new THREE.Vector3(4, 22, 35),         // come around
        new THREE.Vector3(-2, 10, 37),        // swoop left
        new THREE.Vector3(0, 4, 38),          // approaching ground
        new THREE.Vector3(0, PLAYER_HEIGHT, 38), // land at entrance
      ]);

      /* What camera looks at during descent */
      const lookCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),           // looking at center from sky
        new THREE.Vector3(0, 0, 5),            // still center-ish
        new THREE.Vector3(0, 0, 15),           // shifting forward
        new THREE.Vector3(0, 1, 20),           // looking ahead
        new THREE.Vector3(0, 1.5, 10),         // down the path
        new THREE.Vector3(0, PLAYER_HEIGHT, 0),// looking toward center
      ]);

      const duration = 5;
      const descentState = { t: 0 };

      gsap.to(descentState, {
        t: 1,
        duration: duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          const pos = descentCurve.getPointAt(descentState.t);
          const look = lookCurve.getPointAt(descentState.t);
          this.camera.position.copy(pos);
          this.camera.lookAt(look);

          /* Gradually increase FOV */
          this.camera.fov = 42 + descentState.t * 28;
          this.camera.updateProjectionMatrix();

          /* Gradually increase fog */
          this.fog.density = 0.005 + descentState.t * 0.015;
        },
        onComplete: () => {
          /* Extract final yaw from camera orientation */
          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          this.yaw = Math.atan2(-dir.x, -dir.z);
          this.pitch = Math.asin(dir.y);

          this.state = 'walking';
          this.playerPos.set(0, PLAYER_HEIGHT, 38);
          this.currentEdge = this.pathEdges[0];
          this.playerT = 0;

          this.hud.style.display = 'block';

          const header = document.getElementById('site-header');
          if (header) header.classList.add('visible');

          setTimeout(() => {
            const hint = document.getElementById('fp-hint');
            if (hint) gsap.to(hint, { opacity: 0, duration: 1, onComplete: () => hint.style.display = 'none' });
          }, 5000);
        }
      });
    }

    /* ── FIND NEAREST PATH EDGE — For free movement ── */
    findNearestEdge(x, z) {
      let bestEdge = null, bestT = 0, bestDist = Infinity;

      this.pathEdges.forEach(edge => {
        for (let t = 0; t <= 1; t += 0.02) {
          const pt = edge.curve.getPointAt(t);
          const d = (x - pt.x) ** 2 + (z - pt.z) ** 2;
          if (d < bestDist) {
            bestDist = d;
            bestEdge = edge;
            bestT = t;
          }
        }
      });

      return { edge: bestEdge, t: bestT, dist: Math.sqrt(bestDist) };
    }

    /* ── WALKING UPDATE — Movement along/near paths ── */
    updateWalking(delta) {
      if (this.state !== 'walking') return;

      /* Get forward/right vectors from yaw */
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

      /* Movement input */
      const moveDir = new THREE.Vector3();
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize().multiplyScalar(WALK_SPEED * delta);

        /* Move player */
        const newX = this.playerPos.x + moveDir.x;
        const newZ = this.playerPos.z + moveDir.z;

        /* Find nearest path — constrain to within ~3 units of paths */
        const nearest = this.findNearestEdge(newX, newZ);

        if (nearest.dist < 3.0) {
          this.playerPos.x = newX;
          this.playerPos.z = newZ;
          this.currentEdge = nearest.edge;
          this.playerT = nearest.t;
        } else {
          /* Slide along path boundary */
          const pathPt = nearest.edge.curve.getPointAt(nearest.t);
          const toPlayer = new THREE.Vector3(newX - pathPt.x, 0, newZ - pathPt.z).normalize().multiplyScalar(2.8);
          this.playerPos.x = pathPt.x + toPlayer.x;
          this.playerPos.z = pathPt.z + toPlayer.z;
        }

        this.playerPos.y = PLAYER_HEIGHT;
      }

      /* Apply camera */
      this.camera.position.copy(this.playerPos);

      /* Apply look rotation */
      const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);

      /* Move shadow camera to follow player */
      if (this.sun) {
        this.sun.position.set(this.playerPos.x - 15, 50, this.playerPos.z + 15);
        this.sun.target.position.copy(this.playerPos);
        this.sun.target.updateMatrixWorld();
      }

      /* Light up the path we're walking on */
      this.pathSegments.forEach(seg => {
        if (!seg.glowMat) return;
        const isActive = seg.curve === (this.currentEdge ? this.currentEdge.curve : null);
        const targetOpacity = isActive ? 0.15 : 0;
        seg.glowMat.opacity += (targetOpacity - seg.glowMat.opacity) * 0.1;
      });

      /* Check if near a path endpoint */
      this.checkPathProximity();
    }

    checkPathProximity() {
      const px = this.playerPos.x, pz = this.playerPos.z;
      const infoEl = document.getElementById('fp-path-info');

      /* Check proximity to center junction */
      const distCenter = Math.sqrt(px * px + pz * pz);

      if (distCenter < 6) {
        /* At junction — show path you're looking toward AND walking toward */
        const lookDir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        let bestDot = -1, bestIdx = -1;

        this.pathEndpoints.forEach((ep, i) => {
          if (!ep) return;
          const toEp = new THREE.Vector3(ep.x - px, 0, ep.z - pz).normalize();
          const dot = lookDir.dot(toEp);
          if (dot > bestDot) { bestDot = dot; bestIdx = i; }
        });

        if (bestDot > 0.4 && bestIdx >= 0 && infoEl) {
          const p = PATH_DATA[bestIdx];
          infoEl.innerHTML = `<span class="fp-info-num">${p.num}</span> ${p.name}<br><small>${p.sub} — walk to explore</small>`;
          infoEl.style.opacity = '1';

          /* Glow the path we're facing */
          this.pathSegments.forEach(seg => {
            if (seg.pathIndex === bestIdx && seg.glowMat) {
              seg.glowMat.opacity = 0.2;
            }
          });
        } else if (infoEl) {
          infoEl.style.opacity = '0';
        }
        return;
      }

      /* Check proximity to path endpoints */
      for (let i = 0; i < this.pathEndpoints.length; i++) {
        const ep = this.pathEndpoints[i];
        if (!ep) continue;
        const dx = px - ep.x, dz = pz - ep.z;
        if (dx * dx + dz * dz < 9) { // within 3 units
          const p = PATH_DATA[i];
          if (infoEl) {
            infoEl.innerHTML = `<span class="fp-info-num">${p.num}</span> ${p.name}<br><small>Press E to enter</small>`;
            infoEl.style.opacity = '1';
          }

          /* Enter path on E key */
          if (this.keys['KeyE']) {
            this.keys['KeyE'] = false;
            this.enterPath(i);
          }
          return;
        }
      }

      if (infoEl) infoEl.style.opacity = '0';
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

      /* Walking mode */
      this.updateWalking(delta);

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

      /* (markers are static signposts now) */

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.ForestPaths = ForestPaths;
})();

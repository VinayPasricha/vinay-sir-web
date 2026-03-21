/* ============================================
   FOREST PATHS — Hyper-realistic Aerial Forest
   Tree-like branching paths, instanced trees,
   PBR materials, atmospheric lighting
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

  /* ── BRANCHING TREE STRUCTURE ──
     Paths branch like a real tree seen from above.
     Main trunk enters from bottom, splits organically. */
  const BRANCH_TREE = {
    start: [0, 0, 22],
    end: [0, 0, 0],
    width: 1.4,
    children: [
      {
        end: [-14, 0, -12],
        width: 0.9,
        children: [
          { end: [-24, 0, -6], width: 0.6, pathIndex: 2 },
          { end: [-20, 0, -22], width: 0.6, pathIndex: 3 },
        ]
      },
      {
        end: [3, 0, -18],
        width: 0.9,
        children: [
          { end: [-6, 0, -28], width: 0.6, pathIndex: 4 },
          { end: [12, 0, -26], width: 0.6, pathIndex: 5 },
        ]
      },
      {
        end: [18, 0, -8],
        width: 0.8,
        pathIndex: 6,
      },
      {
        end: [-16, 0, 14],
        width: 0.7,
        pathIndex: 1,
      },
      {
        end: [14, 0, 16],
        width: 0.7,
        pathIndex: 0,
      },
    ]
  };

  class ForestPaths {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.state = 'loading';
      this.mouseX = 0;
      this.mouseY = 0;
      this.hoveredPath = -1;
      this.clock = new THREE.Clock();
      this.pathEndpoints = new Array(7).fill(null);
      this.pathSegments = [];
      this.init();
    }

    init() {
      this.setupRenderer();
      this.setupCamera();
      this.setupScene();
      this.createTerrain();
      this.buildBranchingPaths(BRANCH_TREE, null);
      this.plantInstancedForest();
      this.createCenterGlow();
      this.createFireflies();
      this.createLabels();
      this.setupEvents();
      this.animate();

      setTimeout(() => {
        this.state = 'splash';
        const ls = document.getElementById('loading-screen');
        if (ls) gsap.to(ls, { opacity: 0, duration: 0.8, onComplete: () => ls.style.display = 'none' });
      }, 800);
    }

    /* ── RENDERER ── */
    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.container.appendChild(this.renderer.domElement);
    }

    /* ── CAMERA — Drone shot, slight tilt ── */
    setupCamera() {
      this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
      this.camera.position.set(0, 58, 22);
      this.camera.lookAt(0, 0, 0);
      this.baseCamPos = this.camera.position.clone();
      this.lookTarget = new THREE.Vector3(0, 0, 0);
    }

    /* ── SCENE + LIGHTING — PBR environment ── */
    setupScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x040a04);

      /* Atmospheric fog — exponential for natural falloff */
      this.scene.fog = new THREE.FogExp2(0x0a1a0d, 0.005);

      /* Hemisphere: sky blue-ish top + warm green ground bounce */
      this.scene.add(new THREE.HemisphereLight(0x87CEEB, 0x2a4a1a, 0.5));

      /* Ambient fill — low intensity, colored */
      this.scene.add(new THREE.AmbientLight(0x1a3a1a, 0.4));

      /* Main sun — warm directional from upper-left */
      const sun = new THREE.DirectionalLight(0xfff4d0, 2.2);
      sun.position.set(-15, 60, 15);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -50;
      sun.shadow.camera.right = 50;
      sun.shadow.camera.top = 50;
      sun.shadow.camera.bottom = -50;
      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 120;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.02;
      this.scene.add(sun);

      /* Secondary fill — cooler, from opposite side */
      const fill = new THREE.DirectionalLight(0xaaccaa, 0.4);
      fill.position.set(15, 30, -15);
      this.scene.add(fill);

      /* Rim light — creates edge definition on trees */
      const rim = new THREE.DirectionalLight(0xffe8c0, 0.3);
      rim.position.set(0, 15, -40);
      this.scene.add(rim);
    }

    /* ── TERRAIN — Displaced ground with PBR ── */
    createTerrain() {
      /* Procedural ground texture */
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 1024;
      const ctx = c.getContext('2d');

      /* Base: dark forest floor */
      ctx.fillStyle = '#141e10';
      ctx.fillRect(0, 0, 1024, 1024);

      /* Layered moss/grass */
      for (let pass = 0; pass < 3; pass++) {
        const count = [4000, 3000, 2000][pass];
        for (let i = 0; i < count; i++) {
          const x = Math.random() * 1024, y = Math.random() * 1024;
          const size = [2, 4, 8][pass];
          const g = 20 + pass * 15 + Math.random() * 30;
          ctx.fillStyle = `rgba(${g * 0.4},${g},${5 + Math.random() * 10},${[0.3, 0.15, 0.08][pass]})`;
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* Fallen needles / debris */
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 1024, y = Math.random() * 1024;
        ctx.fillStyle = `rgba(${35 + Math.random() * 25},${22 + Math.random() * 18},${10 + Math.random() * 8},${0.1 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const groundTex = new THREE.CanvasTexture(c);
      groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
      groundTex.repeat.set(8, 8);

      /* Roughness map — subtle variation */
      const rc = document.createElement('canvas');
      rc.width = 256; rc.height = 256;
      const rctx = rc.getContext('2d');
      rctx.fillStyle = '#ccc';
      rctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        const v = 150 + Math.random() * 100;
        rctx.fillStyle = `rgb(${v},${v},${v})`;
        rctx.beginPath();
        rctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 4, 0, Math.PI * 2);
        rctx.fill();
      }
      const roughTex = new THREE.CanvasTexture(rc);
      roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
      roughTex.repeat.set(8, 8);

      /* Displaced geometry */
      const geo = new THREE.PlaneGeometry(120, 120, 128, 128);
      const pos = geo.attributes.position.array;
      for (let i = 2; i < pos.length; i += 3) {
        /* Perlin-like displacement using layered sine */
        const px = pos[i - 2] * 0.15, py = pos[i - 1] * 0.15;
        pos[i] += Math.sin(px) * Math.cos(py) * 0.2
                + Math.sin(px * 2.7) * Math.cos(py * 3.1) * 0.1
                + (Math.random() - 0.5) * 0.08;
      }
      geo.computeVertexNormals();

      const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        map: groundTex,
        roughnessMap: roughTex,
        color: 0x1a3a14,
        roughness: 0.92,
        metalness: 0.0,
      }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    /* ── BRANCHING PATHS — Recursive tree structure ── */
    buildBranchingPaths(node, parentEnd) {
      const start = parentEnd
        ? new THREE.Vector3(parentEnd.x, 0, parentEnd.z)
        : new THREE.Vector3(node.start[0], 0, node.start[2]);
      const end = new THREE.Vector3(node.end[0], 0, node.end[2]);

      /* Generate organic curve with intermediate control points */
      const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.3);
      const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.65);

      /* Add natural wavering perpendicular to path direction */
      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);

      mid1.x += perp.x * (Math.random() - 0.5) * 2.5 + (Math.random() - 0.5) * 0.5;
      mid1.z += perp.z * (Math.random() - 0.5) * 2.5 + (Math.random() - 0.5) * 0.5;
      mid2.x += perp.x * (Math.random() - 0.5) * 2.0 + (Math.random() - 0.5) * 0.5;
      mid2.z += perp.z * (Math.random() - 0.5) * 2.0 + (Math.random() - 0.5) * 0.5;

      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
      const width = node.width || 0.6;

      this.createTrailGeometry(curve, width, node.pathIndex);

      /* Store endpoint if this is a terminal path */
      if (node.pathIndex !== undefined) {
        this.pathEndpoints[node.pathIndex] = end.clone();
      }

      /* Recurse into children */
      if (node.children) {
        node.children.forEach(child => {
          this.buildBranchingPaths(child, end);
        });
      }
    }

    createTrailGeometry(curve, width, pathIndex) {
      /* Dirt texture */
      if (!this._dirtTex) {
        const dc = document.createElement('canvas');
        dc.width = 256; dc.height = 256;
        const dctx = dc.getContext('2d');
        /* Sandy dirt base */
        dctx.fillStyle = '#6a5030';
        dctx.fillRect(0, 0, 256, 256);
        /* Pebbles and variation */
        for (let i = 0; i < 3000; i++) {
          const x = Math.random() * 256, y = Math.random() * 256;
          const v = Math.random();
          if (v > 0.7) {
            dctx.fillStyle = `rgba(${80 + Math.random() * 40},${55 + Math.random() * 30},${30 + Math.random() * 20},${0.4 + Math.random() * 0.3})`;
          } else {
            dctx.fillStyle = `rgba(${50 + Math.random() * 30},${35 + Math.random() * 25},${18 + Math.random() * 12},${0.15 + Math.random() * 0.2})`;
          }
          dctx.beginPath();
          dctx.arc(x, y, 0.5 + Math.random() * 2.5, 0, Math.PI * 2);
          dctx.fill();
        }
        /* Wheel/foot tracks */
        for (let i = 0; i < 20; i++) {
          const y = Math.random() * 256;
          dctx.strokeStyle = `rgba(40,28,15,${0.05 + Math.random() * 0.08})`;
          dctx.lineWidth = 1 + Math.random() * 2;
          dctx.beginPath();
          dctx.moveTo(0, y);
          dctx.lineTo(256, y + (Math.random() - 0.5) * 10);
          dctx.stroke();
        }
        this._dirtTex = new THREE.CanvasTexture(dc);
        this._dirtTex.wrapS = this._dirtTex.wrapT = THREE.RepeatWrapping;
      }

      const pts = curve.getPoints(80);
      const verts = [], uvs = [], idx = [];

      for (let p = 0; p < pts.length; p++) {
        const pt = pts[p];
        const t = p / (pts.length - 1);
        /* Width variation — natural wobble + slight taper at ends */
        const taper = Math.sin(t * Math.PI) * 0.3 + 0.7;
        const wobble = 1 + Math.sin(t * 15 + (pathIndex || 0) * 3) * 0.08;
        const w = width * taper * wobble;

        const tangent = curve.getTangent(Math.min(t, 0.999));
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        /* Embed slightly into terrain */
        const y = 0.04 + Math.sin(t * 8) * 0.01;

        verts.push(
          pt.x + perp.x * w, y, pt.z + perp.z * w,
          pt.x - perp.x * w, y, pt.z - perp.z * w
        );
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
        map: this._dirtTex,
        color: 0x9a7a50,
        roughness: 0.88,
        metalness: 0.0,
      });

      const trail = new THREE.Mesh(geo, mat);
      trail.receiveShadow = true;
      this.scene.add(trail);

      /* Subtle edge transition — grass-to-dirt blend */
      const edgeVerts = [];
      for (let p = 0; p < pts.length; p++) {
        const pt = pts[p];
        const t = p / (pts.length - 1);
        const taper = Math.sin(t * Math.PI) * 0.3 + 0.7;
        const ew = width * taper * 2.0;
        const tangent = curve.getTangent(Math.min(t, 0.999));
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        edgeVerts.push(
          pt.x + perp.x * ew, 0.025, pt.z + perp.z * ew,
          pt.x - perp.x * ew, 0.025, pt.z - perp.z * ew
        );
      }

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));
      edgeGeo.setIndex(idx.slice());
      edgeGeo.computeVertexNormals();

      const edgeMesh = new THREE.Mesh(edgeGeo, new THREE.MeshStandardMaterial({
        color: 0x2a3a1a,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }));
      this.scene.add(edgeMesh);

      this.pathSegments.push({ trail, edge: edgeMesh, mat, curve, pathIndex });
    }

    /* ── INSTANCED FOREST — High performance ── */
    plantInstancedForest() {
      /* Pre-calculate path sample points for clearance checks */
      const pathSamples = [];
      this.pathSegments.forEach(seg => {
        for (let t = 0; t <= 1; t += 0.03) {
          const pt = seg.curve.getPoint(t);
          pathSamples.push({ x: pt.x, z: pt.z, w: (seg.mat.color ? 1.8 : 1.5) });
        }
      });

      const distFromPaths = (x, z) => {
        let min = Infinity;
        for (const s of pathSamples) {
          const dx = x - s.x, dz = z - s.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < min) min = d;
        }
        return min;
      };

      const distCenter = (x, z) => Math.sqrt(x * x + z * z);

      /* Generate tree positions */
      const positions = [];
      let tries = 0;
      while (positions.length < 1200 && tries < 8000) {
        tries++;
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        if (distCenter(x, z) < 2.5) continue;
        if (distFromPaths(x, z) < 1.6) continue;

        /* Minimum spacing */
        let ok = true;
        for (let j = positions.length - 1; j >= Math.max(0, positions.length - 20); j--) {
          const dx = x - positions[j].x, dz = z - positions[j].z;
          if (dx * dx + dz * dz < 2.2) { ok = false; break; }
        }
        if (!ok) continue;

        positions.push({
          x, z,
          scale: 0.5 + Math.random() * 0.8,
          rotY: Math.random() * Math.PI * 2,
          colorIdx: Math.floor(Math.random() * 6),
          type: Math.random() > 0.2 ? 'conifer' : 'round',
        });
      }

      const count = positions.length;

      /* TRUNK instances */
      const trunkGeo = new THREE.CylinderGeometry(0.06, 0.14, 1.2, 5);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.92, metalness: 0 });
      const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;

      /* CANOPY layer 1 (bottom cone — wide) */
      const canopy1Geo = new THREE.ConeGeometry(0.85, 1.6, 7);
      /* CANOPY layer 2 (middle cone) */
      const canopy2Geo = new THREE.ConeGeometry(0.65, 1.3, 7);
      /* CANOPY layer 3 (top cone — narrow) */
      const canopy3Geo = new THREE.ConeGeometry(0.4, 1.0, 6);
      /* Round crown */
      const crownGeo = new THREE.IcosahedronGeometry(0.75, 1);

      /* 6 green shades for color variation */
      const greenColors = [
        new THREE.Color(0x1a5218),
        new THREE.Color(0x226420),
        new THREE.Color(0x164612),
        new THREE.Color(0x2a6e26),
        new THREE.Color(0x1e5a1e),
        new THREE.Color(0x306830),
      ];

      /* Create instanced canopy with per-instance color */
      const canopy1Mat = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0 });
      const canopy1Mesh = new THREE.InstancedMesh(canopy1Geo, canopy1Mat, count);
      canopy1Mesh.castShadow = true;
      canopy1Mesh.receiveShadow = true;
      canopy1Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

      const canopy2Mat = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0 });
      const canopy2Mesh = new THREE.InstancedMesh(canopy2Geo, canopy2Mat, count);
      canopy2Mesh.castShadow = true;
      canopy2Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

      const canopy3Mat = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0 });
      const canopy3Mesh = new THREE.InstancedMesh(canopy3Geo, canopy3Mat, count);
      canopy3Mesh.castShadow = true;
      canopy3Mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

      /* Round crowns for deciduous trees — separate instanced mesh */
      const crownMat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 });
      const crownMesh = new THREE.InstancedMesh(crownGeo, crownMat, count);
      crownMesh.castShadow = true;
      crownMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

      const dummy = new THREE.Object3D();
      const colorObj = new THREE.Color();

      positions.forEach((p, i) => {
        const s = p.scale;
        const col = greenColors[p.colorIdx];
        /* Slight color variation per tree */
        colorObj.copy(col);
        colorObj.r += (Math.random() - 0.5) * 0.03;
        colorObj.g += (Math.random() - 0.5) * 0.04;
        colorObj.b += (Math.random() - 0.5) * 0.02;

        /* TRUNK */
        dummy.position.set(p.x, s * 0.6, p.z);
        dummy.scale.set(s, s, s);
        dummy.rotation.set(0, p.rotY, 0);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        if (p.type === 'conifer') {
          /* Canopy layer 1 */
          dummy.position.set(p.x, s * 1.6, p.z);
          dummy.scale.set(s, s * (0.8 + Math.random() * 0.4), s);
          dummy.updateMatrix();
          canopy1Mesh.setMatrixAt(i, dummy.matrix);
          canopy1Mesh.instanceColor.setXYZ(i, colorObj.r, colorObj.g, colorObj.b);

          /* Canopy layer 2 */
          dummy.position.set(p.x, s * 2.7, p.z);
          dummy.scale.set(s * 0.85, s * (0.7 + Math.random() * 0.4), s * 0.85);
          dummy.updateMatrix();
          canopy2Mesh.setMatrixAt(i, dummy.matrix);
          canopy2Mesh.instanceColor.setXYZ(i, colorObj.r * 0.95, colorObj.g * 1.05, colorObj.b * 0.95);

          /* Canopy layer 3 */
          dummy.position.set(p.x, s * 3.5, p.z);
          dummy.scale.set(s * 0.65, s * (0.6 + Math.random() * 0.3), s * 0.65);
          dummy.updateMatrix();
          canopy3Mesh.setMatrixAt(i, dummy.matrix);
          canopy3Mesh.instanceColor.setXYZ(i, colorObj.r * 0.9, colorObj.g * 1.1, colorObj.b * 0.9);

          /* Hide round crown */
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          crownMesh.setMatrixAt(i, dummy.matrix);
        } else {
          /* Round tree — use crown, hide cones */
          dummy.position.set(p.x, s * 1.5, p.z);
          dummy.scale.set(s * (1 + Math.random() * 0.3), s * (0.7 + Math.random() * 0.4), s * (1 + Math.random() * 0.3));
          dummy.updateMatrix();
          crownMesh.setMatrixAt(i, dummy.matrix);
          crownMesh.instanceColor.setXYZ(i, colorObj.r * 1.1, colorObj.g * 1.15, colorObj.b);

          /* Hide cones */
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          canopy1Mesh.setMatrixAt(i, dummy.matrix);
          canopy2Mesh.setMatrixAt(i, dummy.matrix);
          canopy3Mesh.setMatrixAt(i, dummy.matrix);
        }
      });

      this.scene.add(trunkMesh, canopy1Mesh, canopy2Mesh, canopy3Mesh, crownMesh);
    }

    /* ── CENTER GLOW ── */
    createCenterGlow() {
      /* Core bright sphere */
      this.centerCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff8e0, transparent: true, opacity: 0.95 })
      );
      this.centerCore.position.y = 0.4;
      this.scene.add(this.centerCore);

      /* Inner glow */
      this.centerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe880, transparent: true, opacity: 0.2, depthWrite: false })
      );
      this.centerGlow.position.y = 0.3;
      this.scene.add(this.centerGlow);

      /* Outer halo */
      this.centerHalo = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe880, transparent: true, opacity: 0.06, depthWrite: false })
      );
      this.centerHalo.position.y = 0.2;
      this.scene.add(this.centerHalo);

      /* Ground glow disc */
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(3.5, 32),
        new THREE.MeshBasicMaterial({ color: 0xffe880, transparent: true, opacity: 0.12, depthWrite: false })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.06;
      this.scene.add(disc);

      /* Strong point light */
      this.centerLight = new THREE.PointLight(0xffe080, 5, 25, 1.5);
      this.centerLight.position.set(0, 3, 0);
      this.centerLight.castShadow = true;
      this.scene.add(this.centerLight);
    }

    /* ── FIREFLIES ── */
    createFireflies() {
      const count = 100;
      const positions = new Float32Array(count * 3);
      this.fireflyData = [];

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = 2 + Math.random() * 5;
        const z = (Math.random() - 0.5) * 60;
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        this.fireflyData.push({
          baseX: x, baseY: y, baseZ: z,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.5,
          radius: 0.5 + Math.random() * 2,
        });
      }

      const gc = document.createElement('canvas');
      gc.width = 64; gc.height = 64;
      const gctx = gc.getContext('2d');
      const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,240,160,1)');
      grad.addColorStop(0.3, 'rgba(255,220,100,0.5)');
      grad.addColorStop(1, 'rgba(255,200,80,0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 64, 64);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      this.fireflies = new THREE.Points(geo, new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(gc),
        size: 0.7,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffe880,
      }));
      this.scene.add(this.fireflies);
    }

    /* ── LABELS ── */
    createLabels() {
      this.labelsContainer = document.createElement('div');
      this.labelsContainer.className = 'fp-labels';
      this.container.appendChild(this.labelsContainer);
      this.labelElements = [];

      PATH_DATA.forEach((path, i) => {
        const hotspot = document.createElement('div');
        hotspot.className = 'fp-hotspot';
        hotspot.innerHTML = `<div class="fp-label">
          <span class="fp-label-num">${path.num}</span>
          <span class="fp-label-name">${path.name}</span>
          <span class="fp-label-sub">${path.sub}</span>
        </div>`;
        this.labelsContainer.appendChild(hotspot);
        this.labelElements.push({ hotspot });
      });
    }

    /* ── EVENTS ── */
    setupEvents() {
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });

      window.addEventListener('mousemove', (e) => {
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      });

      this.labelElements.forEach((el, i) => {
        el.hotspot.addEventListener('mouseenter', () => {
          if (this.state !== 'exploring') return;
          this.hoveredPath = i;
          el.hotspot.classList.add('active');
          /* Highlight relevant path segments */
          this.pathSegments.forEach(seg => {
            if (seg.pathIndex === i) {
              gsap.to(seg.mat, { emissiveIntensity: 0.6, duration: 0.4 });
              seg.mat.emissive = new THREE.Color(0xffe880);
            }
          });
          if (window.playRustle) window.playRustle();
        });

        el.hotspot.addEventListener('mouseleave', () => {
          this.hoveredPath = -1;
          el.hotspot.classList.remove('active');
          this.pathSegments.forEach(seg => {
            if (seg.pathIndex === i) {
              gsap.to(seg.mat, { emissiveIntensity: 0, duration: 0.4 });
            }
          });
        });

        el.hotspot.addEventListener('click', () => {
          if (this.state !== 'exploring') return;
          this.navigateToPath(i);
        });
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
      const ep = this.pathEndpoints[index];
      if (!ep) return;
      if (window.playChime) window.playChime();

      gsap.to(this.camera.position, {
        x: ep.x * 0.4, y: 22, z: ep.z * 0.4 + 8,
        duration: 1.5, ease: 'power2.in',
      });
      gsap.to(this.lookTarget, {
        x: ep.x * 0.6, z: ep.z * 0.6,
        duration: 1.5, ease: 'power2.in',
      });

      this.labelElements.forEach((el, j) => {
        if (j !== index) gsap.to(el.hotspot, { opacity: 0, duration: 0.4 });
      });

      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(5,10,4,0);pointer-events:none;';
      document.body.appendChild(flash);
      gsap.to(flash, {
        background: 'rgba(5,10,4,1)', duration: 1.0, delay: 0.8, ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('leaf-transition', 'true');
          window.location.href = path.url;
        }
      });
    }

    /* ── RENDER LOOP ── */
    animate() {
      requestAnimationFrame(() => this.animate());
      const time = this.clock.getElapsedTime();

      /* Smooth camera parallax */
      if (this.state === 'exploring' && !gsap.isTweening(this.camera.position)) {
        const tx = this.baseCamPos.x + this.mouseX * 5;
        const tz = this.baseCamPos.z + this.mouseY * 3;
        this.camera.position.x += (tx - this.camera.position.x) * 0.025;
        this.camera.position.z += (tz - this.camera.position.z) * 0.025;
      }
      this.camera.lookAt(this.lookTarget);

      /* Center glow animation */
      if (this.centerCore) {
        this.centerCore.material.opacity = 0.8 + Math.sin(time * 1.5) * 0.15;
        this.centerCore.scale.setScalar(1 + Math.sin(time * 2) * 0.04);
      }
      if (this.centerGlow) {
        this.centerGlow.material.opacity = 0.15 + Math.sin(time * 1.2) * 0.05;
        this.centerGlow.scale.setScalar(1 + Math.sin(time * 0.8) * 0.06);
      }
      if (this.centerLight) {
        this.centerLight.intensity = 4 + Math.sin(time * 1.5) * 1.5;
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

      /* Label positions (3D → screen) */
      if (this.state === 'exploring') {
        const w = window.innerWidth, h = window.innerHeight;
        this.pathEndpoints.forEach((ep, i) => {
          if (!ep) return;
          const v = new THREE.Vector3(ep.x, 2.5, ep.z).project(this.camera);
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

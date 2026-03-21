/* ============================================
   FOREST PATHS — 3D Aerial Forest Experience
   Narrow winding dirt trails through dense forest
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

  /* 7 paths evenly distributed */
  const PATH_ANGLES = [];
  for (let i = 0; i < 7; i++) {
    PATH_ANGLES.push((i / 7) * Math.PI * 2 - Math.PI / 2);
  }

  class ForestPaths {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.state = 'loading';
      this.mouseX = 0;
      this.mouseY = 0;
      this.hoveredPath = -1;
      this.clock = new THREE.Clock();
      this.pathCurves = [];
      this.pathEndpoints = [];
      this.pathMeshes = [];

      this.init();
    }

    init() {
      this.setupRenderer();
      this.setupCamera();
      this.setupScene();
      this.createGround();
      this.buildPaths();
      this.plantForest();
      this.createCenterClearing();
      this.createFireflies();
      this.createLabels();
      this.setupEvents();
      this.animate();

      setTimeout(() => {
        this.state = 'splash';
        const ls = document.getElementById('loading-screen');
        if (ls) gsap.to(ls, { opacity: 0, duration: 0.8, onComplete: () => ls.style.display = 'none' });
      }, 600);
    }

    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.3;
      this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
      this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 250);
      this.camera.position.set(0, 55, 20);
      this.camera.lookAt(0, 0, 0);
      this.baseCamPos = this.camera.position.clone();
      this.lookTarget = new THREE.Vector3(0, 0, 0);
    }

    setupScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x060e06);
      this.scene.fog = new THREE.FogExp2(0x0a1a0d, 0.004);

      /* Ambient — green-tinted */
      this.scene.add(new THREE.AmbientLight(0x2a4a2a, 1.0));

      /* Sunlight from above */
      const sun = new THREE.DirectionalLight(0xfff4d0, 1.8);
      sun.position.set(-5, 50, 10);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -50;
      sun.shadow.camera.right = 50;
      sun.shadow.camera.top = 50;
      sun.shadow.camera.bottom = -50;
      this.scene.add(sun);

      /* Fill + hemisphere */
      this.scene.add(new THREE.DirectionalLight(0x3a6a3a, 0.5).translateX(10).translateY(20).translateZ(-10));
      this.scene.add(new THREE.HemisphereLight(0x5588aa, 0x1a3a10, 0.5));
    }

    createGround() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#162e12';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 6000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512;
        const g = 25 + Math.random() * 45;
        ctx.fillStyle = `rgba(${g * 0.4},${g},${8 + Math.random() * 12},${0.15 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 120),
        new THREE.MeshStandardMaterial({ map: tex, color: 0x1a3a14, roughness: 0.95 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    buildPaths() {
      /* Create narrow, winding dirt trails */

      /* Dirt trail texture */
      const dirtC = document.createElement('canvas');
      dirtC.width = 256; dirtC.height = 256;
      const dctx = dirtC.getContext('2d');
      dctx.fillStyle = '#5a4428';
      dctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 256, y = Math.random() * 256;
        dctx.fillStyle = `rgba(${60 + Math.random() * 40},${40 + Math.random() * 30},${20 + Math.random() * 15},${0.2 + Math.random() * 0.3})`;
        dctx.beginPath();
        dctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
        dctx.fill();
      }
      const dirtTex = new THREE.CanvasTexture(dirtC);
      dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping;
      dirtTex.repeat.set(1, 8);

      const dirtMat = new THREE.MeshStandardMaterial({
        map: dirtTex,
        color: 0x8a6a40,
        roughness: 0.9,
        metalness: 0,
      });

      /* Subtle golden edge glow material */
      const edgeMat = new THREE.MeshBasicMaterial({
        color: 0xffe880,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
      });

      PATH_ANGLES.forEach((baseAngle, i) => {
        const pathLen = 22 + Math.random() * 6;
        const controlPoints = [];
        const numControls = 8;

        /* Generate organic winding control points */
        for (let p = 0; p <= numControls; p++) {
          const t = p / numControls;
          const dist = t * pathLen;

          /* Increasing wander as path gets further from center */
          const wander = t * t * 3.5;
          const wobbleX = Math.sin(t * 4 + i * 2.3) * wander + (Math.random() - 0.5) * wander * 0.5;
          const wobbleZ = Math.cos(t * 3.5 + i * 1.7) * wander * 0.6 + (Math.random() - 0.5) * wander * 0.3;

          const x = Math.cos(baseAngle) * dist + Math.sin(baseAngle + Math.PI / 2) * wobbleX + wobbleZ * Math.cos(baseAngle);
          const z = Math.sin(baseAngle) * dist + Math.cos(baseAngle + Math.PI / 2) * wobbleX + wobbleZ * Math.sin(baseAngle);

          controlPoints.push(new THREE.Vector3(x, 0, z));
        }

        const curve = new THREE.CatmullRomCurve3(controlPoints);
        this.pathCurves.push(curve);

        const pts = curve.getPoints(100);
        const endpoint = pts[pts.length - 1];
        this.pathEndpoints.push(endpoint);

        /* Build narrow ribbon geometry */
        const trailWidth = 0.5 + Math.random() * 0.2; // narrow!
        const verts = [], uvs = [], indices = [];

        for (let p = 0; p < pts.length; p++) {
          const pt = pts[p];
          const t = p / (pts.length - 1);
          /* Slight width variation for natural look */
          const w = trailWidth * (0.8 + Math.sin(t * 12 + i) * 0.2);
          const tangent = curve.getTangent(Math.min(t, 0.999));
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

          verts.push(
            pt.x + perp.x * w, 0.06, pt.z + perp.z * w,
            pt.x - perp.x * w, 0.06, pt.z - perp.z * w
          );
          uvs.push(0, t * 10, 1, t * 10);
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

        const trail = new THREE.Mesh(geo, dirtMat.clone());
        trail.receiveShadow = true;
        this.scene.add(trail);

        /* Soft glow edges — slightly wider */
        const edgeVerts = [];
        for (let p = 0; p < pts.length; p++) {
          const pt = pts[p];
          const t = p / (pts.length - 1);
          const ew = trailWidth * 2.5 * (0.8 + Math.sin(t * 12 + i) * 0.2);
          const tangent = curve.getTangent(Math.min(t, 0.999));
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
          edgeVerts.push(
            pt.x + perp.x * ew, 0.03, pt.z + perp.z * ew,
            pt.x - perp.x * ew, 0.03, pt.z - perp.z * ew
          );
        }

        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));
        edgeGeo.setIndex(indices.slice());
        edgeGeo.computeVertexNormals();

        const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat.clone());
        this.scene.add(edgeMesh);

        this.pathMeshes.push({ trail, edge: edgeMesh });

        /* Small warm point lights along the path */
        for (let l = 0; l < 3; l++) {
          const lp = pts[Math.floor(pts.length * (0.25 + l * 0.25))];
          const pl = new THREE.PointLight(0xffe080, 0.4, 8, 2);
          pl.position.set(lp.x, 1, lp.z);
          this.scene.add(pl);
        }
      });
    }

    plantForest() {
      /* Dense forest that respects path corridors */
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.9 });

      const greenShades = [0x1a5218, 0x226420, 0x184816, 0x2a6e26, 0x1e5a1e, 0x306830, 0x145012, 0x266224];

      this.treeGroup = new THREE.Group();

      /* Distance from any path curve */
      const distFromPaths = (x, z) => {
        let minDist = Infinity;
        for (let i = 0; i < this.pathCurves.length; i++) {
          /* Sample curve at intervals */
          for (let t = 0; t <= 1; t += 0.05) {
            const pt = this.pathCurves[i].getPoint(t);
            const dx = x - pt.x, dz = z - pt.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < minDist) minDist = d;
          }
        }
        return minDist;
      };

      const distFromCenter = (x, z) => Math.sqrt(x * x + z * z);

      /* Shared geometries for instancing-like efficiency */
      const trunkGeo = new THREE.CylinderGeometry(0.06, 0.12, 1.0, 5);
      const cone1 = new THREE.ConeGeometry(0.7, 1.8, 6);
      const cone2 = new THREE.ConeGeometry(0.55, 1.4, 6);
      const cone3 = new THREE.ConeGeometry(0.4, 1.0, 6);
      const sphereGeo = new THREE.IcosahedronGeometry(0.7, 1);

      const treePositions = [];
      let attempts = 0;

      while (treePositions.length < 800 && attempts < 4000) {
        attempts++;
        const x = (Math.random() - 0.5) * 90;
        const z = (Math.random() - 0.5) * 90;

        /* Must be away from paths and center */
        const dCenter = distFromCenter(x, z);
        if (dCenter < 2.5) continue;

        const dPath = distFromPaths(x, z);
        if (dPath < 1.4) continue; // narrow corridor clearance

        /* Check not too close to other trees */
        let tooClose = false;
        for (let t = treePositions.length - 1; t >= Math.max(0, treePositions.length - 30); t--) {
          const dx = x - treePositions[t].x, dz = z - treePositions[t].z;
          if (dx * dx + dz * dz < 1.8) { tooClose = true; break; }
        }
        if (tooClose) continue;

        treePositions.push({ x, z });
      }

      treePositions.forEach(pos => {
        const tree = new THREE.Group();
        const scale = 0.6 + Math.random() * 0.9;
        const shade = greenShades[Math.floor(Math.random() * greenShades.length)];
        const foliageMat = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.82 });

        if (Math.random() > 0.2) {
          /* CONIFER — 3 stacked cones */
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 0.5;
          trunk.castShadow = true;
          tree.add(trunk);

          const c1 = new THREE.Mesh(cone1, foliageMat);
          c1.position.y = 1.5;
          c1.castShadow = true;
          tree.add(c1);

          const c2 = new THREE.Mesh(cone2, foliageMat);
          c2.position.y = 2.6;
          c2.castShadow = true;
          tree.add(c2);

          if (Math.random() > 0.4) {
            const c3 = new THREE.Mesh(cone3, foliageMat);
            c3.position.y = 3.4;
            c3.castShadow = true;
            tree.add(c3);
          }
        } else {
          /* DECIDUOUS — round crown */
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 0.5;
          trunk.castShadow = true;
          tree.add(trunk);

          const crown = new THREE.Mesh(sphereGeo, foliageMat);
          crown.position.y = 1.4;
          crown.scale.set(1 + Math.random() * 0.4, 0.7 + Math.random() * 0.4, 1 + Math.random() * 0.4);
          crown.castShadow = true;
          tree.add(crown);
        }

        tree.position.set(pos.x, 0, pos.z);
        tree.scale.setScalar(scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        this.treeGroup.add(tree);
      });

      this.scene.add(this.treeGroup);
    }

    createCenterClearing() {
      /* Glowing nexus where paths converge */
      this.centerSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.9 })
      );
      this.centerSphere.position.y = 0.5;
      this.scene.add(this.centerSphere);

      /* Warm ground glow */
      const glowGround = new THREE.Mesh(
        new THREE.CircleGeometry(3, 32),
        new THREE.MeshBasicMaterial({ color: 0xffe880, transparent: true, opacity: 0.15, depthWrite: false })
      );
      glowGround.rotation.x = -Math.PI / 2;
      glowGround.position.y = 0.07;
      this.scene.add(glowGround);

      /* Halo */
      this.centerHalo = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe880, transparent: true, opacity: 0.12, depthWrite: false })
      );
      this.centerHalo.position.y = 0.3;
      this.scene.add(this.centerHalo);

      /* Strong center light */
      this.centerLight = new THREE.PointLight(0xffe080, 4, 20, 1.5);
      this.centerLight.position.set(0, 2, 0);
      this.centerLight.castShadow = true;
      this.scene.add(this.centerLight);
    }

    createFireflies() {
      const count = 80;
      const positions = new Float32Array(count * 3);
      this.fireflyData = [];

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = 2 + Math.random() * 6;
        const z = (Math.random() - 0.5) * 60;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        this.fireflyData.push({
          baseX: x, baseY: y, baseZ: z,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.6,
          radius: 0.5 + Math.random() * 2,
        });
      }

      const gc = document.createElement('canvas');
      gc.width = 64; gc.height = 64;
      const gctx = gc.getContext('2d');
      const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,232,128,1)');
      grad.addColorStop(0.4, 'rgba(255,220,100,0.4)');
      grad.addColorStop(1, 'rgba(255,200,80,0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 64, 64);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      this.fireflies = new THREE.Points(geo, new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(gc),
        size: 0.8,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffe880,
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
        hotspot.innerHTML = `<div class="fp-label">
          <span class="fp-label-num">${path.num}</span>
          <span class="fp-label-name">${path.name}</span>
          <span class="fp-label-sub">${path.sub}</span>
        </div>`;
        this.labelsContainer.appendChild(hotspot);
        this.labelElements.push({ hotspot });
      });
    }

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
          /* Brighten path */
          const pm = this.pathMeshes[i];
          if (pm) {
            gsap.to(pm.trail.material, { emissive: new THREE.Color(0xffe880), emissiveIntensity: 0.5, duration: 0.3 });
            gsap.to(pm.edge.material, { opacity: 0.2, duration: 0.3 });
          }
          if (window.playRustle) window.playRustle();
        });

        el.hotspot.addEventListener('mouseleave', () => {
          this.hoveredPath = -1;
          el.hotspot.classList.remove('active');
          const pm = this.pathMeshes[i];
          if (pm) {
            gsap.to(pm.trail.material, { emissiveIntensity: 0, duration: 0.3 });
            gsap.to(pm.edge.material, { opacity: 0.06, duration: 0.3 });
          }
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
      if (window.playChime) window.playChime();

      gsap.to(this.camera.position, {
        x: ep.x * 0.4, y: 20, z: ep.z * 0.4 + 8,
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
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(10,26,13,0);pointer-events:none;';
      document.body.appendChild(flash);
      gsap.to(flash, {
        background: 'rgba(10,26,13,1)', duration: 1.0, delay: 0.8, ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('leaf-transition', 'true');
          window.location.href = path.url;
        }
      });
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      const time = this.clock.getElapsedTime();

      /* Camera parallax */
      if (this.state === 'exploring' && !gsap.isTweening(this.camera.position)) {
        const tx = this.baseCamPos.x + this.mouseX * 5;
        const tz = this.baseCamPos.z + this.mouseY * 3;
        this.camera.position.x += (tx - this.camera.position.x) * 0.03;
        this.camera.position.z += (tz - this.camera.position.z) * 0.03;
      }
      this.camera.lookAt(this.lookTarget);

      /* Center pulse */
      if (this.centerSphere) {
        this.centerSphere.material.opacity = 0.7 + Math.sin(time * 1.5) * 0.2;
        this.centerSphere.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      }
      if (this.centerHalo) {
        this.centerHalo.material.opacity = 0.08 + Math.sin(time * 1.2) * 0.04;
      }
      if (this.centerLight) {
        this.centerLight.intensity = 3.5 + Math.sin(time * 1.5) * 1;
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

      /* Label positions */
      if (this.state === 'exploring') {
        const w = window.innerWidth, h = window.innerHeight;
        this.pathEndpoints.forEach((ep, i) => {
          const v = new THREE.Vector3(ep.x, 2, ep.z).project(this.camera);
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

/* ============================================
   FOREST PATHS — Interactive aerial forest landing
   7 paths radiating from a glowing center
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

  /*
    Path hotspot positions (% from top-left of image).
    Mapped to the 7 visible trails in the forest-paths.png aerial image.
    Format: { cx, cy } = center of label, { angle } = direction the trail goes
    The image has paths radiating from center (~50%, ~38%):
      - Bottom (main wide path)        → Path I
      - Lower-left                     → Path II
      - Left                           → Path III
      - Upper-left                     → Path IV
      - Upper-center-left              → Path V
      - Upper-center-right             → Path VI
      - Upper-right                    → Path VII
  */
  const PATH_POSITIONS = [
    { cx: 50,  cy: 72,  angle: 180 },  // I   — bottom center (main path)
    { cx: 22,  cy: 62,  angle: 225 },  // II  — lower-left
    { cx: 12,  cy: 40,  angle: 260 },  // III — left
    { cx: 18,  cy: 18,  angle: 310 },  // IV  — upper-left
    { cx: 42,  cy: 8,   angle: 345 },  // V   — upper-center-left
    { cx: 62,  cy: 8,   angle: 15  },  // VI  — upper-center-right
    { cx: 82,  cy: 18,  angle: 50  },  // VII — upper-right
  ];

  class ForestPaths {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.state = 'loading'; // loading → splash → exploring
      this.hoveredPath = -1;
      this.mouseX = 0;
      this.mouseY = 0;
      this.parallaxX = 0;
      this.parallaxY = 0;

      this.init();
    }

    init() {
      /* Create the scene layers */
      this.createImageLayer();
      this.createGlowOverlay();
      this.createParticles();
      this.createPathLabels();
      this.setupEvents();
      this.animate();

      /* Image loaded → ready */
      this.bgImage.onload = () => {
        this.state = 'splash';
        const loadScreen = document.getElementById('loading-screen');
        if (loadScreen) {
          gsap.to(loadScreen, {
            opacity: 0, duration: 0.8,
            onComplete: () => loadScreen.style.display = 'none'
          });
        }
      };

      /* If image is cached, fire immediately */
      if (this.bgImage.complete) {
        this.bgImage.onload();
      }
    }

    createImageLayer() {
      /* Full-viewport forest image with parallax wrapper */
      this.imageWrap = document.createElement('div');
      this.imageWrap.className = 'fp-image-wrap';

      this.bgImage = document.createElement('img');
      this.bgImage.src = 'assets/images/forest-paths.png';
      this.bgImage.className = 'fp-image';
      this.bgImage.alt = 'Aerial forest with branching paths';
      this.bgImage.draggable = false;

      this.imageWrap.appendChild(this.bgImage);
      this.container.appendChild(this.imageWrap);
    }

    createGlowOverlay() {
      /* Central glow pulse */
      this.centerGlow = document.createElement('div');
      this.centerGlow.className = 'fp-center-glow';
      this.container.appendChild(this.centerGlow);
    }

    createParticles() {
      /* Floating pollen/firefly particles via canvas */
      this.particleCanvas = document.createElement('canvas');
      this.particleCanvas.className = 'fp-particles';
      this.container.appendChild(this.particleCanvas);

      this.particleCtx = this.particleCanvas.getContext('2d');
      this.particles = [];

      this.resizeCanvas();

      for (let i = 0; i < 60; i++) {
        this.particles.push({
          x: Math.random() * this.particleCanvas.width,
          y: Math.random() * this.particleCanvas.height,
          size: 1 + Math.random() * 2.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.2 - 0.1,
          opacity: Math.random(),
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.5 + Math.random() * 1.5,
          color: Math.random() > 0.6
            ? `rgba(255, 232, 128, OPACITY)` // golden fireflies
            : `rgba(180, 220, 160, OPACITY)`, // green pollen
        });
      }
    }

    createPathLabels() {
      this.labelsContainer = document.createElement('div');
      this.labelsContainer.className = 'fp-labels';
      this.container.appendChild(this.labelsContainer);

      this.pathElements = [];

      PATH_DATA.forEach((path, i) => {
        const pos = PATH_POSITIONS[i];

        /* Clickable hotspot area */
        const hotspot = document.createElement('div');
        hotspot.className = 'fp-hotspot';
        hotspot.style.left = pos.cx + '%';
        hotspot.style.top = pos.cy + '%';
        hotspot.dataset.index = i;

        /* Glowing trail line from center to label */
        const trail = document.createElement('div');
        trail.className = 'fp-trail';
        hotspot.appendChild(trail);

        /* Label card */
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
        this.pathElements.push({ hotspot, label, trail });
      });
    }

    setupEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());

      window.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });

      /* Hotspot hover & click */
      this.pathElements.forEach((el, i) => {
        el.hotspot.addEventListener('mouseenter', () => {
          if (this.state !== 'exploring') return;
          this.hoveredPath = i;
          el.hotspot.classList.add('active');
          if (window.playRustle) window.playRustle();
        });

        el.hotspot.addEventListener('mouseleave', () => {
          this.hoveredPath = -1;
          el.hotspot.classList.remove('active');
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

      /* Reveal labels with stagger */
      this.pathElements.forEach((el, i) => {
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
      const pos = PATH_POSITIONS[index];
      const el = this.pathElements[index];

      if (window.playChime) window.playChime();

      /* Zoom into the selected path */
      gsap.to(this.imageWrap, {
        scale: 2.5,
        x: -(pos.cx - 50) * window.innerWidth / 50 * 1.5,
        y: -(pos.cy - 50) * window.innerHeight / 50 * 1.5,
        duration: 1.2,
        ease: 'power2.in',
      });

      /* Fade out other labels */
      this.pathElements.forEach((other, i) => {
        if (i !== index) {
          gsap.to(other.hotspot, { opacity: 0, duration: 0.4 });
        }
      });

      /* Brighten selected label */
      gsap.to(el.label, {
        scale: 1.2,
        duration: 0.6,
        ease: 'power2.out',
      });

      /* Fade to white/green then navigate */
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(10,26,13,0);pointer-events:none;';
      document.body.appendChild(flash);

      gsap.to(flash, {
        background: 'rgba(10,26,13,1)',
        duration: 1.0,
        delay: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('leaf-transition', 'true');
          window.location.href = path.url;
        }
      });
    }

    resizeCanvas() {
      if (this.particleCanvas) {
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
      }
    }

    animate() {
      const time = performance.now() * 0.001;

      /* Parallax on mouse */
      if (this.state === 'exploring') {
        const targetX = (this.mouseX / window.innerWidth - 0.5) * -15;
        const targetY = (this.mouseY / window.innerHeight - 0.5) * -15;
        this.parallaxX += (targetX - this.parallaxX) * 0.05;
        this.parallaxY += (targetY - this.parallaxY) * 0.05;

        if (this.imageWrap && !gsap.isTweening(this.imageWrap)) {
          this.imageWrap.style.transform =
            `translate(${this.parallaxX}px, ${this.parallaxY}px) scale(1.08)`;
        }
      }

      /* Center glow pulse */
      if (this.centerGlow) {
        const pulse = 0.4 + Math.sin(time * 1.5) * 0.15;
        this.centerGlow.style.opacity = pulse;
      }

      /* Particles */
      this.drawParticles(time);

      requestAnimationFrame(() => this.animate());
    }

    drawParticles(time) {
      const ctx = this.particleCtx;
      const w = this.particleCanvas.width;
      const h = this.particleCanvas.height;
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        /* Wrap around */
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        /* Pulse opacity */
        const pulse = Math.sin(time * p.pulseSpeed + p.phase);
        const opacity = (0.3 + pulse * 0.4) * (this.state === 'exploring' ? 1 : 0.3);

        const color = p.color.replace('OPACITY', opacity.toFixed(2));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        /* Glow effect for fireflies */
        if (p.color.includes('255')) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          grad.addColorStop(0, color);
          grad.addColorStop(1, 'rgba(255, 232, 128, 0)');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });
    }
  }

  window.ForestPaths = ForestPaths;
})();

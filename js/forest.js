/* ============================================
   FOREST CANOPY — Real Photographic Foliage
   Multiple layers of real leaf/bush photographs
   that part like dense foliage to reveal content.
   Pure DOM + CSS transitions — zero canvas.
   ============================================ */

class ForestCanopy {
  constructor(containerId, mode) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.mode = mode || 'full'; // 'full' = splash, 'light' = inner pages
    this.isDispersed = false;
    this.layers = [];
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.rafId = null;

    /* Real foliage photographs (Unsplash CDN) */
    this.photos = {
      leaves: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1920&q=80',
      canopy: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&q=80',
      ferns:  'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1920&q=80',
      light:  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1920&q=80',
    };

    this.build();
    this.setupParallax();
    this.preload();
  }

  /* ---- Layer definitions per mode ---- */
  getLayerDefs() {
    if (this.mode === 'light') {
      /* Inner pages: fewer layers, faster disperse */
      return [
        {
          name: 'bg', isColor: true,
          css: 'background:radial-gradient(ellipse at 50% 40%,#0f2815,#070e08 60%,#030504 100%);',
          disperse: { opacity: 0, delay: 150, duration: 600 },
        },
        {
          name: 'left', photo: 'leaves',
          bgPos: 'center center', scale: 1.15, brightness: 0.4,
          mask: 'linear-gradient(to right, black 0%, black 35%, transparent 60%)',
          depth: 0.5,
          disperse: { transform: 'translate(-110%,5%) rotate(-5deg) scale(1.1)', opacity: 0, delay: 0, duration: 1000 },
        },
        {
          name: 'right', photo: 'leaves',
          bgPos: '25% center', scale: 1.15, flipX: true, brightness: 0.38,
          mask: 'linear-gradient(to left, black 0%, black 35%, transparent 60%)',
          depth: 0.5,
          disperse: { transform: 'translate(110%,5%) rotate(5deg) scale(1.1)', opacity: 0, delay: 50, duration: 1000 },
        },
        {
          name: 'vignette', isColor: true,
          css: 'background:radial-gradient(ellipse at 50% 50%,transparent 20%,rgba(3,5,4,0.5) 60%,rgba(3,5,4,0.85) 100%);',
          disperse: { opacity: 0, delay: 100, duration: 500 },
        },
      ];
    }

    /* Full splash canopy — 9 layered panels of real foliage
       Slower 2-second disperse for cinematic reveal */
    return [
      /* 0 — Deep forest darkness base */
      {
        name: 'bg', isColor: true,
        css: 'background:radial-gradient(ellipse at 50% 40%,#0f2815 0%,#070e08 60%,#030504 100%);',
        disperse: { opacity: 0, delay: 600, duration: 1400 },
      },
      /* 1 — Left bush panel */
      {
        name: 'left', photo: 'leaves',
        bgPos: 'center center', scale: 1.15, brightness: 0.4,
        mask: 'linear-gradient(to right, black 0%, black 35%, transparent 58%)',
        depth: 0.5,
        disperse: { transform: 'translate(-108%,4%) rotate(-4deg) scale(1.1)', opacity: 0, delay: 0, duration: 2200 },
      },
      /* 2 — Right bush panel (same photo, flipped) */
      {
        name: 'right', photo: 'leaves',
        bgPos: '25% center', scale: 1.15, flipX: true, brightness: 0.38,
        mask: 'linear-gradient(to left, black 0%, black 35%, transparent 58%)',
        depth: 0.5,
        disperse: { transform: 'translate(108%,4%) rotate(4deg) scale(1.1)', opacity: 0, delay: 100, duration: 2200 },
      },
      /* 3 — Top canopy overhead */
      {
        name: 'top', photo: 'canopy',
        bgPos: 'center 35%', scale: 1.2, brightness: 0.32,
        mask: 'linear-gradient(to bottom, black 0%, black 30%, transparent 52%)',
        depth: 0.35,
        disperse: { transform: 'translate(0,-108%) rotate(1.5deg) scale(1.08)', opacity: 0, delay: 200, duration: 2200 },
      },
      /* 4 — Bottom undergrowth / ferns */
      {
        name: 'bottom', photo: 'ferns',
        bgPos: 'center 55%', scale: 1.2, brightness: 0.28,
        mask: 'linear-gradient(to top, black 0%, black 28%, transparent 50%)',
        depth: 0.45,
        disperse: { transform: 'translate(0,108%) rotate(-1deg) scale(1.05)', opacity: 0, delay: 150, duration: 2200 },
      },
      /* 5 — Foreground left (close, blurred leaves — depth-of-field) */
      {
        name: 'fg-left', photo: 'leaves',
        bgPos: '75% center', scale: 1.6, brightness: 0.22, blur: 5,
        mask: 'linear-gradient(to right, black 0%, transparent 32%)',
        depth: 0.85,
        disperse: { transform: 'translate(-130%,-8%) rotate(-10deg) scale(1.4)', opacity: 0, delay: 0, duration: 2000 },
      },
      /* 6 — Foreground right (close, blurred ferns) */
      {
        name: 'fg-right', photo: 'ferns',
        bgPos: '20% center', scale: 1.6, flipX: true, brightness: 0.2, blur: 6,
        mask: 'linear-gradient(to left, black 0%, transparent 32%)',
        depth: 0.85,
        disperse: { transform: 'translate(130%,8%) rotate(10deg) scale(1.4)', opacity: 0, delay: 0, duration: 2000 },
      },
      /* 7 — Light rays overlay (screen blend — golden light filtering through) */
      {
        name: 'light', photo: 'light',
        bgPos: 'center 30%', scale: 1.1, brightness: 0.7,
        blend: 'screen', initialOpacity: 0.18,
        depth: 0.15,
        disperse: { transform: 'translate(0,-15%) scale(1.05)', opacity: 0, delay: 300, duration: 1600 },
      },
      /* 8 — Dark vignette (atmospheric edges) */
      {
        name: 'vignette', isColor: true,
        css: 'background:radial-gradient(ellipse at 50% 50%,transparent 15%,rgba(3,5,4,0.5) 60%,rgba(3,5,4,0.85) 100%);',
        disperse: { opacity: 0, delay: 400, duration: 1200 },
      },
    ];
  }

  /* ---- Build DOM layers ---- */
  build() {
    this.container.innerHTML = '';
    this.layers = [];
    const defs = this.getLayerDefs();

    defs.forEach(def => {
      const el = document.createElement('div');
      el.className = `leaf-layer leaf-${def.name}`;

      let s = 'position:absolute;top:0;left:0;width:100%;height:100%;';

      /* Background: either gradient or photo */
      if (def.isColor) {
        s += def.css;
      } else {
        s += `background-image:url('${this.photos[def.photo]}');`;
        s += `background-size:cover;`;
        s += `background-position:${def.bgPos || 'center center'};`;
        s += 'background-repeat:no-repeat;';
      }

      /* Transform (scale + optional flip) */
      const parts = [];
      if (def.scale) parts.push(`scale(${def.scale})`);
      if (def.flipX) parts.push('scaleX(-1)');
      const baseTransform = parts.join(' ');
      if (baseTransform) s += `transform:${baseTransform};`;

      /* Filters: brightness + optional blur for depth-of-field */
      const filters = [];
      if (def.brightness !== undefined) filters.push(`brightness(${def.brightness})`);
      if (def.blur) filters.push(`blur(${def.blur}px)`);
      if (filters.length) s += `filter:${filters.join(' ')};`;

      /* CSS mask for soft organic edges between panels */
      if (def.mask) {
        s += `-webkit-mask-image:${def.mask};`;
        s += `mask-image:${def.mask};`;
      }

      /* Blend mode for light overlay */
      if (def.blend) s += `mix-blend-mode:${def.blend};`;

      /* Opacity */
      if (def.initialOpacity !== undefined) s += `opacity:${def.initialOpacity};`;

      s += 'will-change:transform,opacity;';

      el.style.cssText = s;
      this.container.appendChild(el);
      this.layers.push({ el, def, baseTransform });
    });
  }

  /* ---- Preload images ---- */
  preload() {
    Object.values(this.photos).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  /* ---- Mouse parallax for subtle depth ---- */
  setupParallax() {
    window.addEventListener('mousemove', e => {
      if (this.isDispersed) return;
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.applyParallax();
          this.rafId = null;
        });
      }
    });
  }

  applyParallax() {
    const ox = (this.mouseX - 0.5) * 2;
    const oy = (this.mouseY - 0.5) * 2;
    this.layers.forEach(({ el, def, baseTransform }) => {
      if (!def.depth || def.isColor) return;
      const px = ox * def.depth * 18;
      const py = oy * def.depth * 12;
      el.style.transform = `translate(${px}px,${py}px) ${baseTransform}`;
    });
  }

  /* ---- Start (make visible) ---- */
  start() {
    this.container.style.opacity = '1';
    this.isDispersed = false;
  }

  /* ---- Disperse: foliage parts like real bushes ---- */
  disperse(callback) {
    this.isDispersed = true;
    let maxEnd = 0;

    this.layers.forEach(({ el, def }) => {
      const d = def.disperse;
      if (!d) return;
      const dur = d.duration || 1600;
      const del = d.delay || 0;
      if (del + dur > maxEnd) maxEnd = del + dur;

      setTimeout(() => {
        el.style.transition = [
          `transform ${dur}ms cubic-bezier(0.4,0,0.2,1)`,
          `opacity ${Math.round(dur * 0.85)}ms ease`,
        ].join(',');
        if (d.transform) el.style.transform = d.transform;
        if (d.opacity !== undefined) el.style.opacity = String(d.opacity);
      }, del);
    });

    /* Clean up after all layers have animated out */
    setTimeout(() => {
      this.container.style.display = 'none';
      if (callback) callback();
    }, maxEnd + 120);
  }
}


/* ============================================
   AMBIENT PARTICLES — CSS-only floating dots
   for inner pages (no canvas, pure DOM + CSS)
   ============================================ */

class AmbientParticles {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.container.innerHTML = '';

    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('span');
      dot.className = 'ambient-dot';
      const size = 1 + Math.random() * 2.5;
      dot.style.cssText = `
        left:${Math.random() * 100}%;
        top:${60 + Math.random() * 40}%;
        width:${size}px;
        height:${size}px;
        opacity:${0.03 + Math.random() * 0.08};
        animation-duration:${18 + Math.random() * 28}s;
        animation-delay:${-Math.random() * 25}s;
      `;
      this.container.appendChild(dot);
    }
  }
}


window.ForestCanopy = ForestCanopy;
window.AmbientParticles = AmbientParticles;

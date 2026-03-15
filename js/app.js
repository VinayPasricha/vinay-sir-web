/* ============================================
   FOREST APP — Core interactions & animations
   Dark forest, golden light, organic minimalism
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     LEAF COVER + NAVIGATE — Reusable transition for all links
     ============================================ */
  function leafNavigate(url) {
    const overlay = document.createElement('div');
    overlay.id = 'leaf-transition';
    document.body.appendChild(overlay);

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
    const leafShapes = [
      'polygon(50% 0%, 65% 8%, 75% 5%, 80% 18%, 95% 22%, 85% 35%, 98% 45%, 82% 52%, 90% 65%, 75% 68%, 78% 82%, 60% 78%, 50% 100%, 40% 78%, 22% 82%, 25% 68%, 10% 65%, 18% 52%, 2% 45%, 15% 35%, 5% 22%, 20% 18%, 25% 5%, 35% 8%)',
      'polygon(50% 0%, 60% 15%, 85% 5%, 72% 28%, 100% 35%, 75% 45%, 90% 65%, 65% 55%, 60% 80%, 50% 100%, 40% 80%, 35% 55%, 10% 65%, 25% 45%, 0% 35%, 28% 28%, 15% 5%, 40% 15%)',
      'polygon(50% 0%, 62% 12%, 70% 8%, 72% 22%, 82% 20%, 80% 35%, 90% 38%, 82% 50%, 88% 58%, 78% 65%, 80% 75%, 65% 78%, 62% 90%, 50% 100%, 38% 90%, 35% 78%, 20% 75%, 22% 65%, 12% 58%, 18% 50%, 10% 38%, 20% 35%, 18% 20%, 28% 22%, 30% 8%, 38% 12%)',
      'ellipse(42% 50% at 50% 50%)',
      'polygon(50% 0%, 75% 30%, 80% 55%, 70% 75%, 50% 100%, 30% 75%, 20% 55%, 25% 30%)',
      'polygon(50% 0%, 62% 15%, 68% 35%, 65% 55%, 60% 75%, 50% 100%, 40% 75%, 35% 55%, 32% 35%, 38% 15%)',
      'polygon(50% 0%, 58% 6%, 72% 4%, 68% 18%, 85% 25%, 78% 38%, 92% 48%, 80% 55%, 85% 70%, 72% 72%, 68% 88%, 55% 82%, 50% 100%, 45% 82%, 32% 88%, 28% 72%, 15% 70%, 20% 55%, 8% 48%, 22% 38%, 15% 25%, 32% 18%, 28% 4%, 42% 6%)',
      'polygon(50% 8%, 60% 0%, 75% 2%, 88% 15%, 92% 32%, 82% 52%, 68% 70%, 50% 100%, 32% 70%, 18% 52%, 8% 32%, 12% 15%, 25% 2%, 40% 0%)',
    ];

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cols = 16;
    const rows = Math.ceil(leafCount / cols);

    for (let i = 0; i < leafCount; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'transition-leaf';
      const size = 40 + Math.random() * 80;
      const color = greens[Math.floor(Math.random() * greens.length)];
      const shape = leafShapes[Math.floor(Math.random() * leafShapes.length)];
      leaf.style.width = size + 'px';
      leaf.style.height = size * (1.0 + Math.random() * 0.5) + 'px';
      leaf.style.background = color;
      leaf.style.clipPath = shape;

      const vein = document.createElement('div');
      vein.className = 'leaf-vein';
      leaf.appendChild(vein);

      /* Start from edges, converge to center */
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(W, H) * 0.9;
      const startX = W / 2 + Math.cos(angle) * dist;
      const startY = H / 2 + Math.sin(angle) * dist;

      /* End at grid position (covering the screen) */
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = W / (cols - 1);
      const cellH = H / (rows - 1);
      const endX = col * cellW + (Math.random() - 0.5) * cellW * 0.8;
      const endY = row * cellH + (Math.random() - 0.5) * cellH * 0.8;

      leaf.style.left = startX + 'px';
      leaf.style.top = startY + 'px';
      leaf.style.transform = 'rotate(' + (Math.random() * 360) + 'deg) scale(0.3)';
      leaf.style.opacity = '0';
      overlay.appendChild(leaf);

      gsap.to(leaf, {
        left: endX,
        top: endY,
        opacity: 1,
        rotation: Math.random() * 360,
        scale: 1 + Math.random() * 0.4,
        duration: 0.6 + Math.random() * 0.4,
        delay: Math.random() * 0.3,
        ease: 'power2.in',
      });
    }

    gsap.to(backdrop, { opacity: 1, duration: 0.8, delay: 0.3 });

    setTimeout(() => {
      sessionStorage.setItem('leaf-transition', 'true');
      window.location.href = url;
    }, 1000);
  }

  /* Make it globally accessible */
  window.leafNavigate = leafNavigate;

  /* Attach leaf transitions to bottom nav items and forest-btn links */
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    /* Capture href before removing onclick */
    const onclickStr = item.getAttribute('onclick') || '';
    const link = item.querySelector('a');
    const href = onclickStr.match(/'([^']+)'/)?.[1]
                 || (link ? link.getAttribute('href') : null);

    /* Remove inline onclick to prevent double navigation */
    item.removeAttribute('onclick');
    item.style.cursor = 'pointer';

    if (href && href !== '#') {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        leafNavigate(href);
      });
    }
  });

  document.querySelectorAll('.forest-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const href = btn.getAttribute('href');
      if (href) {
        /* For "Return to Tree", skip splash */
        if (href.includes('index.html') || href === '../index.html') {
          sessionStorage.setItem('skip-splash', 'true');
        }
        leafNavigate(href);
      }
    });
  });

  /* ============================================
     LEAF UNCOVER — Plays on pages entered via leaf transition
     ============================================ */
  const hasLeafTransition = sessionStorage.getItem('leaf-transition') === 'true';
  if (hasLeafTransition) {
    sessionStorage.removeItem('leaf-transition');
    leafUncover();
  }

  function leafUncover() {
    const overlay = document.createElement('div');
    overlay.id = 'leaf-transition';
    document.body.appendChild(overlay);

    /* Solid green backdrop (same as cover) */
    const backdrop = document.createElement('div');
    backdrop.className = 'leaf-backdrop';
    backdrop.style.opacity = '1';
    overlay.appendChild(backdrop);

    const leafCount = 280;
    const greens = [
      '#1a3a12', '#2a5a20', '#1e4a18', '#3a6a30', '#244a1e',
      '#1c3c14', '#2e5e28', '#3a7a30', '#1a4a1a', '#2c4c1c',
      '#1d4518', '#335d26', '#183a14', '#204820', '#2a5528',
      '#163210', '#284e1e', '#30602a', '#1a4020', '#224a18',
    ];

    /* Same 8 realistic leaf clip-path shapes */
    const leafShapes = [
      'polygon(50% 0%, 65% 8%, 75% 5%, 80% 18%, 95% 22%, 85% 35%, 98% 45%, 82% 52%, 90% 65%, 75% 68%, 78% 82%, 60% 78%, 50% 100%, 40% 78%, 22% 82%, 25% 68%, 10% 65%, 18% 52%, 2% 45%, 15% 35%, 5% 22%, 20% 18%, 25% 5%, 35% 8%)',
      'polygon(50% 0%, 60% 15%, 85% 5%, 72% 28%, 100% 35%, 75% 45%, 90% 65%, 65% 55%, 60% 80%, 50% 100%, 40% 80%, 35% 55%, 10% 65%, 25% 45%, 0% 35%, 28% 28%, 15% 5%, 40% 15%)',
      'polygon(50% 0%, 62% 12%, 70% 8%, 72% 22%, 82% 20%, 80% 35%, 90% 38%, 82% 50%, 88% 58%, 78% 65%, 80% 75%, 65% 78%, 62% 90%, 50% 100%, 38% 90%, 35% 78%, 20% 75%, 22% 65%, 12% 58%, 18% 50%, 10% 38%, 20% 35%, 18% 20%, 28% 22%, 30% 8%, 38% 12%)',
      'ellipse(42% 50% at 50% 50%)',
      'polygon(50% 0%, 75% 30%, 80% 55%, 70% 75%, 50% 100%, 30% 75%, 20% 55%, 25% 30%)',
      'polygon(50% 0%, 62% 15%, 68% 35%, 65% 55%, 60% 75%, 50% 100%, 40% 75%, 35% 55%, 32% 35%, 38% 15%)',
      'polygon(50% 0%, 58% 6%, 72% 4%, 68% 18%, 85% 25%, 78% 38%, 92% 48%, 80% 55%, 85% 70%, 72% 72%, 68% 88%, 55% 82%, 50% 100%, 45% 82%, 32% 88%, 28% 72%, 15% 70%, 20% 55%, 8% 48%, 22% 38%, 15% 25%, 32% 18%, 28% 4%, 42% 6%)',
      'polygon(50% 8%, 60% 0%, 75% 2%, 88% 15%, 92% 32%, 82% 52%, 68% 70%, 50% 100%, 32% 70%, 18% 52%, 8% 32%, 12% 15%, 25% 2%, 40% 0%)',
    ];

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cols = 16;
    const rows = Math.ceil(leafCount / cols);
    const leaves = [];

    /* Create leaves already covering the screen */
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

      /* Leaf vein */
      const vein = document.createElement('div');
      vein.className = 'leaf-vein';
      leaf.appendChild(vein);

      /* Dense grid positions */
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = W / (cols - 1);
      const cellH = H / (rows - 1);
      leaf.style.left = col * cellW + (Math.random() - 0.5) * cellW * 0.8 + 'px';
      leaf.style.top  = row * cellH + (Math.random() - 0.5) * cellH * 0.8 + 'px';
      leaf.style.transform = 'rotate(' + (Math.random() * 360) + 'deg) scale(' + (1 + Math.random() * 0.4) + ')';
      leaf.style.opacity = '1';

      overlay.appendChild(leaf);
      leaves.push(leaf);
    }

    /* After a brief pause, animate leaves blowing away like a bush parting */
    setTimeout(() => {
      /* Fade out backdrop */
      gsap.to(backdrop, { opacity: 0, duration: 1.0, delay: 0.2, ease: 'power1.out' });

      let doneCount = 0;
      leaves.forEach((leaf) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(W, H) * 0.9;
        const endX = W / 2 + Math.cos(angle) * dist;
        const endY = H / 2 + Math.sin(angle) * dist;

        gsap.to(leaf, {
          left: endX,
          top: endY,
          opacity: 0,
          rotation: Math.random() * 720,
          scale: 0.3,
          duration: 0.7 + Math.random() * 0.5,
          delay: Math.random() * 0.4,
          ease: 'power2.out',
          onComplete: () => {
            doneCount++;
            if (doneCount >= leaves.length) overlay.remove();
          }
        });
      });
    }, 350);
  }

  /* ============================================
     3D FOREST EXPERIENCE (index page only)
     ============================================ */
  const canvasContainer = document.getElementById('canvas-container');
  let forest3D = null;

  if (canvasContainer && typeof ForestExperience !== 'undefined') {
    /* Initialize Three.js scene */
    forest3D = new ForestExperience('canvas-container');

    /* Show audio toggle after entering the forest */
    function onForestEnter() {
      setTimeout(() => {
        if (window.showAudioToggle) window.showAudioToggle();
      }, 1500);
    }

    /* Check if returning from a path page — skip splash, go straight to tree */
    const skipSplash = sessionStorage.getItem('skip-splash') === 'true';
    if (skipSplash) {
      sessionStorage.removeItem('skip-splash');
      const waitForReady = setInterval(() => {
        if (forest3D && forest3D.state === 'splash') {
          clearInterval(waitForReady);
          forest3D.enter();
          onForestEnter();
        }
      }, 100);
      setTimeout(() => clearInterval(waitForReady), 10000);
    }

    /* Wire up ENTER button */
    const enterBtn = document.getElementById('enter-btn');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        if (forest3D) {
          forest3D.enter();
          onForestEnter();
        }
      });
    }
  }

  /* ============================================
     DOM-BASED FOREST CANOPY (inner pages)
     ============================================ */
  const splash = document.querySelector('.splash-screen');
  const mainContent = document.querySelector('.main-content');
  const header = document.querySelector('.site-header');

  if (!canvasContainer && typeof ForestCanopy !== 'undefined') {
    const forestAnim = new ForestCanopy('forest-canopy', splash ? 'full' : 'light');
    forestAnim.start();

    const splashText = document.querySelector('.splash-text');
    const splashDivider = document.querySelector('.splash-divider');
    const splashBtn = document.querySelector('.splash-enter');

    /* Animate splash elements in with stagger */
    if (splash) {
      setTimeout(() => {
        if (splashText) splashText.classList.add('visible');
        if (splashDivider) splashDivider.classList.add('visible');
        if (splashBtn) splashBtn.classList.add('visible');
      }, 1200);
    }

    /* Enter button — leaves disperse to reveal content */
    if (splashBtn) {
      splashBtn.addEventListener('click', () => {
        if (splashText) {
          splashText.style.opacity = '0';
          splashText.style.transform = 'translateY(-30px)';
          splashText.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        }
        if (splashDivider) {
          splashDivider.style.opacity = '0';
          splashDivider.style.transition = 'opacity 0.6s ease';
        }
        if (splashBtn) {
          splashBtn.style.opacity = '0';
          splashBtn.style.transform = 'translateY(-20px)';
          splashBtn.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }

        setTimeout(() => {
          forestAnim.disperse(() => {
            splash.style.display = 'none';
            if (mainContent) mainContent.classList.add('visible');
            if (header) header.classList.add('visible');

            const treeBranches = mainContent.querySelector('.tree-branches');
            if (treeBranches) {
              setTimeout(() => treeBranches.classList.add('visible'), 400);
            }

            const staggerEl = mainContent.querySelector('.stagger');
            if (staggerEl) {
              setTimeout(() => staggerEl.classList.add('visible'), 200);
            }
          });
        }, 700);
      });
    }

    /* Inner page forest entrance (no splash screen) */
    if (!splash && forestAnim) {
      const revealInnerPage = () => {
        if (mainContent) mainContent.classList.add('visible');
        if (header) header.classList.add('visible');
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) bottomNav.classList.add('visible');
      };

      if (hasLeafTransition) {
        /* Leaf transition active — reveal content immediately (leaves uncover it) */
        revealInnerPage();
        forestAnim.disperse(() => {}); /* disperse silently in background */
      } else {
        setTimeout(() => {
          forestAnim.disperse(revealInnerPage);
        }, 600);

        /* Safety fallback */
        setTimeout(revealInnerPage, 4000);
      }

      if (typeof AmbientParticles !== 'undefined') {
        new AmbientParticles('ambient-particles');
      }
    }
  }

  /* ============================================
     AMBIENT AUDIO PLAYER
     ============================================ */
  const audioToggle = document.querySelector('.audio-toggle');
  const ambientAudio = document.getElementById('ambient-audio');

  if (audioToggle && ambientAudio) {
    ambientAudio.volume = 0.3;
    ambientAudio.loop = true;

    const wasPlaying = localStorage.getItem('forest-audio') === 'playing';
    const isHomepage = !!document.getElementById('canvas-container');

    /* Show audio toggle — on homepage: after entering the forest; on inner pages: after 2s */
    window.showAudioToggle = function() {
      audioToggle.classList.add('visible');
      /* If user had music on, auto-play */
      if (wasPlaying) {
        ambientAudio.play().then(() => {
          audioToggle.classList.add('playing');
        }).catch(() => {});
      }
    };

    if (!isHomepage) {
      setTimeout(() => window.showAudioToggle(), 2000);
    }
    /* Homepage: showAudioToggle() is called after forest3D.enter() below */

    audioToggle.addEventListener('click', () => {
      if (ambientAudio.paused) {
        ambientAudio.play().then(() => {
          audioToggle.classList.add('playing');
          localStorage.setItem('forest-audio', 'playing');
        }).catch(() => {});
      } else {
        ambientAudio.pause();
        audioToggle.classList.remove('playing');
        localStorage.setItem('forest-audio', 'paused');
      }
    });

    /* Fade out audio during leaf transitions */
    const originalLeafNavigate = window.leafNavigate;
    if (originalLeafNavigate) {
      window.leafNavigate = function(url) {
        if (!ambientAudio.paused) {
          gsap.to(ambientAudio, { volume: 0, duration: 0.8 });
        }
        originalLeafNavigate(url);
      };
    }
  }

  /* ============================================
     MENU TOGGLE
     ============================================ */
  const menuBtn = document.querySelector('.menu-btn');
  const menuOverlay = document.querySelector('.menu-overlay');
  const menuClose = document.querySelector('.menu-close');

  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', () => {
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (menuClose && menuOverlay) {
    menuClose.addEventListener('click', () => {
      menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  /* ============================================
     SCROLL REVEAL OBSERVER
     ============================================ */
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');
  if (revealElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => observer.observe(el));
  }

  /* ============================================
     FAQ ACCORDION
     ============================================ */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(fi => fi.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ============================================
     DRAG TIMELINE
     ============================================ */
  const timelineTrack = document.querySelector('.timeline-track');
  if (timelineTrack) {
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;

    const getMaxScroll = () => {
      return -(timelineTrack.scrollWidth - window.innerWidth);
    };

    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    timelineTrack.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.pageX;
      lastX = e.pageX;
      lastTime = Date.now();
      prevTranslate = currentTranslate;
      timelineTrack.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const diff = e.pageX - startX;
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocity = (e.pageX - lastX) / dt;
      }
      lastX = e.pageX;
      lastTime = now;
      currentTranslate = clamp(prevTranslate + diff, getMaxScroll(), 0);
      timelineTrack.style.transform = `translateX(${currentTranslate}px)`;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      timelineTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      const momentum = velocity * 300;
      currentTranslate = clamp(currentTranslate + momentum, getMaxScroll(), 0);
      timelineTrack.style.transform = `translateX(${currentTranslate}px)`;
    });

    /* Touch support */
    timelineTrack.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].pageX;
      lastX = e.touches[0].pageX;
      lastTime = Date.now();
      prevTranslate = currentTranslate;
      timelineTrack.style.transition = 'none';
    }, { passive: true });

    timelineTrack.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const diff = e.touches[0].pageX - startX;
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (e.touches[0].pageX - lastX) / dt;
      lastX = e.touches[0].pageX;
      lastTime = now;
      currentTranslate = clamp(prevTranslate + diff, getMaxScroll(), 0);
      timelineTrack.style.transform = `translateX(${currentTranslate}px)`;
    }, { passive: true });

    timelineTrack.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      timelineTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      const momentum = velocity * 300;
      currentTranslate = clamp(currentTranslate + momentum, getMaxScroll(), 0);
      timelineTrack.style.transform = `translateX(${currentTranslate}px)`;
    }, { passive: true });

    /* Year marker clicks */
    document.querySelectorAll('.year-marker').forEach(marker => {
      marker.addEventListener('click', () => {
        const targetYear = marker.dataset.year;
        const targetCol = document.querySelector(`.timeline-col[data-year="${targetYear}"]`);
        if (targetCol) {
          currentTranslate = clamp(-targetCol.offsetLeft + 100, getMaxScroll(), 0);
          timelineTrack.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          timelineTrack.style.transform = `translateX(${currentTranslate}px)`;
        }
        document.querySelectorAll('.year-marker').forEach(m => m.classList.remove('active'));
        marker.classList.add('active');
      });
    });

    /* Wheel horizontal scroll */
    window.addEventListener('wheel', (e) => {
      if (!document.querySelector('.timeline-section')) return;
      e.preventDefault();
      currentTranslate = clamp(currentTranslate - e.deltaY * 2, getMaxScroll(), 0);
      timelineTrack.style.transition = 'transform 0.3s ease-out';
      timelineTrack.style.transform = `translateX(${currentTranslate}px)`;
    }, { passive: false });
  }

  /* ============================================
     HORIZONTAL SCROLL — Venture Cards
     ============================================ */
  const hScrollSection = document.querySelector('.h-scroll-section');
  if (hScrollSection) {
    const container = hScrollSection.querySelector('.h-scroll-container');
    if (container) {
      let hCurrentTranslate = 0;

      const getMaxH = () => -(container.scrollWidth - window.innerWidth);

      window.addEventListener('wheel', (e) => {
        if (!hScrollSection.getBoundingClientRect) return;
        const rect = hScrollSection.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;

        hCurrentTranslate = Math.min(0, Math.max(getMaxH(), hCurrentTranslate - e.deltaY * 1.5));
        container.style.transform = `translateX(${hCurrentTranslate}px)`;
        container.style.transition = 'transform 0.3s ease-out';
      }, { passive: true });
    }
  }
});

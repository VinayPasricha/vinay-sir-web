/* ================================================================
   FOREST UI — React 18 + Motion (framer-motion) overlay
   Uses: React UMD globals + Motion global for animations
   Inspired by 21st.dev hero patterns: glassmorphism, cinematic
   typography, staggered reveals, ambient micro-animations.
   ================================================================ */
(function () {
  'use strict';

  const { useState, useEffect, useCallback, useRef, Fragment } = React;
  const h = React.createElement;

  /* Motion.animate from framer-motion global */
  const animate = window.Motion ? Motion.animate : null;

  /* ── Glass style helper (21st.dev pattern) ── */
  const glass = (o, b) => ({
    background: `rgba(10,26,12,${o || 0.15})`,
    backdropFilter: `blur(${b || 16}px)`,
    WebkitBackdropFilter: `blur(${b || 16}px)`,
    border: '1px solid rgba(168,196,154,0.12)',
  });

  /* ── useMotion: hook to animate a ref with framer-motion ── */
  function useMotion(ref, keyframes, options) {
    useEffect(() => {
      if (!ref.current || !animate) return;
      const ctrl = animate(ref.current, keyframes, options);
      return () => ctrl && ctrl.stop && ctrl.stop();
    }, []);
  }

  /* ── Floating Particle (CSS animation via React) ── */
  function FloatingParticle({ i }) {
    const delay = (i * 0.7) % 8;
    const dur = 6 + (i * 1.3) % 8;
    const x = ((i * 37) % 100);
    const y = ((i * 53) % 100);
    const sz = 3 + (i % 6);

    return h('div', {
      style: {
        position: 'absolute', width: sz, height: sz,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,240,180,0.6) 0%, rgba(255,220,100,0) 70%)',
        pointerEvents: 'none',
        left: x + '%', top: y + '%',
        animation: `forestParticle ${dur}s ${delay}s ease-in-out infinite`,
      },
    });
  }

  /* ── Ambient Particles ── */
  function AmbientParticles() {
    const ps = [];
    for (let i = 0; i < 25; i++) ps.push(h(FloatingParticle, { key: i, i }));
    return h('div', {
      style: {
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 5, overflow: 'hidden',
      },
    }, ps);
  }

  /* ── Light Beam ── */
  function LightBeam({ i }) {
    const left = 10 + i * 20 + (i % 3) * 3;
    const w = 1.2 + (i % 3) * 0.8;
    const dur = 4 + (i % 3) * 2;
    const delay = i * 0.8;
    const angle = -6 + (i % 5) * 3;

    return h('div', {
      style: {
        position: 'absolute',
        left: left + '%', top: '-5%',
        width: w + '%', height: '110%',
        background: `linear-gradient(180deg, rgba(255,240,180,0.05) 0%, rgba(255,220,100,0.02) 40%, transparent 80%)`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'top center',
        pointerEvents: 'none',
        animation: `beamShimmer ${dur}s ${delay}s ease-in-out infinite`,
      },
    });
  }

  /* ── Light Beams ── */
  function LightBeams() {
    const beams = [];
    for (let i = 0; i < 5; i++) beams.push(h(LightBeam, { key: i, i }));
    return h('div', {
      style: {
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 2, overflow: 'hidden',
      },
    }, beams);
  }

  /* ── Typewriter Line ── */
  function TypewriterLine({ text, delay, onComplete }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
      let idx = 0, interval;
      const timer = setTimeout(() => {
        interval = setInterval(() => {
          if (idx < text.length) {
            idx++;
            setDisplayed(text.slice(0, idx));
          } else {
            clearInterval(interval);
            setDone(true);
            if (onComplete) setTimeout(onComplete, 200);
          }
        }, 40 + Math.random() * 25);
      }, delay);
      return () => { clearTimeout(timer); if (interval) clearInterval(interval); };
    }, []);

    return h('span', { style: { display: 'block' }, className: 'fm-fade-in' },
      displayed,
      !done ? h('span', {
        className: 'fm-cursor',
        style: {
          display: 'inline-block', width: '2px', height: '1.1em',
          background: '#e8d090', marginLeft: '3px', verticalAlign: 'text-bottom',
          animation: 'cursorBlink 0.6s step-end infinite',
        },
      }) : null
    );
  }

  /* ── Entry Overlay ── */
  function EntryOverlay({ onEnter }) {
    const [phase, setPhase] = useState(0);
    const [exiting, setExiting] = useState(false);
    const overlayRef = useRef(null);
    const btnRef = useRef(null);

    useEffect(() => { setTimeout(() => setPhase(1), 800); }, []);

    const handleEnter = useCallback(() => {
      setExiting(true);
      if (window.playWhoosh) window.playWhoosh();
      /* Animate exit with Motion */
      if (animate && overlayRef.current) {
        animate(overlayRef.current,
          { opacity: [1, 0], filter: ['blur(0px)', 'blur(16px)'], scale: [1, 1.06] },
          { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }
        );
      }
      setTimeout(() => onEnter(), 950);
    }, [onEnter]);

    /* Animate button entrance with Motion */
    useEffect(() => {
      if (phase >= 4 && btnRef.current && animate) {
        animate(btnRef.current,
          { opacity: [0, 1], y: [25, 0], filter: ['blur(6px)', 'blur(0px)'] },
          { duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
        );
      }
    }, [phase]);

    if (exiting && !overlayRef.current) return null;

    return h('div', {
      ref: overlayRef,
      style: {
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh', zIndex: 2000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(30,50,20,0.25) 0%, rgba(8,16,6,0.6) 60%, rgba(3,8,2,0.8) 100%)',
        opacity: exiting ? undefined : 1,
        transition: exiting ? 'none' : 'opacity 1.2s ease',
      },
    },
      /* Ambient glow */
      h('div', {
        style: {
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,230,140,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'glowPulse 5s ease-in-out infinite',
        },
      }),

      /* Content */
      h('div', {
        style: {
          textAlign: 'center', maxWidth: '650px', padding: '0 2rem',
          position: 'relative', zIndex: 1,
        },
      },
        /* Text */
        h('div', {
          style: {
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(1.5rem, 3.5vw, 2.6rem)',
            fontWeight: '300', lineHeight: '1.7', color: '#f2ece0',
            textShadow: '0 2px 40px rgba(0,0,0,0.6)',
          },
        },
          phase >= 1 ? h(TypewriterLine, { text: 'Welcome, dear traveler.', delay: 0, onComplete: () => setPhase(2) }) : null,
          phase >= 2 ? h(TypewriterLine, { text: 'Seven paths stretch before you.', delay: 300, onComplete: () => setPhase(3) }) : null,
          phase >= 3 ? h(TypewriterLine, { text: 'Choose the one that calls.', delay: 300, onComplete: () => setPhase(4) }) : null,
        ),

        /* Divider */
        phase >= 4 ? h('div', {
          className: 'fm-divider-grow',
          style: {
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #e8d090, transparent)',
            margin: '2rem auto',
          },
        }) : null,

        /* Button — animated by Motion.animate */
        phase >= 4 ? h('button', {
          ref: btnRef,
          onClick: handleEnter,
          className: 'fm-explore-btn',
          style: {
            marginTop: '1.5rem', padding: '16px 56px',
            color: '#f2ece0', opacity: 0,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            fontSize: '0.7rem', fontWeight: '500',
            letterSpacing: '4px', textTransform: 'uppercase',
            borderRadius: '2px', cursor: 'pointer', outline: 'none',
            ...glass(0.06, 14),
            transition: 'transform 0.2s, box-shadow 0.3s, border-color 0.3s',
          },
        }, 'Explore the Paths') : null,
      ),
    );
  }

  /* ── Path HUD ── */
  function PathHUD({ info }) {
    const ref = useRef(null);

    useEffect(() => {
      if (ref.current && animate) {
        animate(ref.current,
          { opacity: [0, 1], y: [25, 0], scale: [0.95, 1] },
          { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
        );
      }
    }, [info.name]);

    return h('div', {
      ref,
      style: {
        position: 'fixed', bottom: '12%', left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 50,
        pointerEvents: 'none',
        ...glass(0.3, 24),
        padding: '18px 40px', borderRadius: '10px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 0 60px rgba(232,208,144,0.05)',
        opacity: 0,
      },
    },
      h('div', {
        style: {
          fontFamily: "'Inter', sans-serif", fontSize: '0.6rem',
          letterSpacing: '3px', color: '#d4af37', marginBottom: '6px',
        },
      }, info.num),
      h('div', {
        style: {
          fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem',
          fontWeight: '400', color: '#f2ece0', letterSpacing: '1px',
        },
      }, info.name),
      h('div', {
        style: {
          fontFamily: "'Inter', sans-serif", fontSize: '0.55rem',
          letterSpacing: '2px', textTransform: 'uppercase',
          color: '#a0b898', marginTop: '6px', opacity: 0.6,
        },
      }, info.sub),
    );
  }

  /* ── Corner Ornaments ── */
  function CornerOrnaments() {
    const positions = [
      { top: '2rem', left: '2rem', borderTop: '1px solid rgba(200,190,150,0.2)', borderLeft: '1px solid rgba(200,190,150,0.2)' },
      { top: '2rem', right: '2rem', borderTop: '1px solid rgba(200,190,150,0.2)', borderRight: '1px solid rgba(200,190,150,0.2)' },
      { bottom: '2rem', left: '2rem', borderBottom: '1px solid rgba(200,190,150,0.2)', borderLeft: '1px solid rgba(200,190,150,0.2)' },
      { bottom: '2rem', right: '2rem', borderBottom: '1px solid rgba(200,190,150,0.2)', borderRight: '1px solid rgba(200,190,150,0.2)' },
    ];
    return h(Fragment, null, positions.map((s, i) =>
      h('div', {
        key: i,
        style: {
          position: 'fixed', width: '50px', height: '50px',
          pointerEvents: 'none', zIndex: 6,
          animation: `breathe 3.5s ${i * 0.3}s ease-in-out infinite`,
          ...s,
        },
      })
    ));
  }

  /* ── Controls Hint ── */
  function ControlsHint() {
    return h('div', {
      className: 'fm-fade-in',
      style: {
        position: 'fixed', bottom: '5%', left: '50%',
        transform: 'translateX(-50%)', zIndex: 50,
        fontFamily: "'Inter', sans-serif", fontSize: '0.6rem',
        letterSpacing: '3px', textTransform: 'uppercase',
        color: '#c0b898', pointerEvents: 'none', opacity: 0.5,
        textShadow: '0 2px 12px rgba(0,0,0,0.5)',
      },
    }, 'Click a path to explore');
  }

  /* ── Main App ── */
  function ForestUI() {
    const [entered, setEntered] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [pathInfo, setPathInfo] = useState(null);

    const handleEnter = useCallback(() => {
      setEntered(true);
      if (window._forestInstance) {
        window._forestInstance.enter();
        if (window.showAudioToggle) setTimeout(() => window.showAudioToggle(), 1500);
      }
      setTimeout(() => setShowHint(true), 2000);
    }, []);

    useEffect(() => {
      const handler = (e) => {
        setPathInfo(e.detail && e.detail.name ? e.detail : null);
      };
      window.addEventListener('forest-path-hover', handler);
      return () => window.removeEventListener('forest-path-hover', handler);
    }, []);

    return h(Fragment, null,
      h(AmbientParticles),
      entered ? h(LightBeams) : null,
      entered ? h(CornerOrnaments) : null,
      !entered ? h(EntryOverlay, { onEnter: handleEnter }) : null,
      pathInfo ? h(PathHUD, { info: pathInfo }) : null,
      entered && !pathInfo && showHint ? h(ControlsHint) : null,
    );
  }

  /* ── Inject CSS Animations ── */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes forestParticle {
      0%, 100% { transform: translate(0, 0) scale(0.5); opacity: 0; }
      25% { transform: translate(10px, -30px) scale(1); opacity: 0.8; }
      50% { transform: translate(-8px, -15px) scale(0.8); opacity: 0.5; }
      75% { transform: translate(15px, -40px) scale(1.1); opacity: 0.9; }
    }
    @keyframes beamShimmer {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes glowPulse {
      0%, 100% { transform: scale(1); opacity: 0.2; }
      50% { transform: scale(1.2); opacity: 0.45; }
    }
    @keyframes breathe {
      0%, 100% { opacity: 0.12; }
      50% { opacity: 0.28; }
    }
    .fm-fade-in {
      animation: fmFadeIn 0.8s ease forwards;
    }
    @keyframes fmFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fm-divider-grow {
      animation: divGrow 0.8s ease forwards;
      width: 0;
    }
    @keyframes divGrow {
      to { width: 80px; }
    }
    .fm-explore-btn:hover {
      transform: scale(1.05) !important;
      box-shadow: 0 0 50px rgba(232,208,144,0.2), inset 0 0 30px rgba(232,208,144,0.04) !important;
      border-color: rgba(232,208,144,0.4) !important;
    }
    .fm-explore-btn:active {
      transform: scale(0.96) !important;
    }
  `;
  document.head.appendChild(style);

  /* ── Mount ── */
  const root = document.getElementById('forest-ui-root');
  if (root) {
    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(root).render(h(ForestUI));
    } else {
      ReactDOM.render(h(ForestUI), root);
    }
  }

  window.ForestUI = { mounted: true };
})();

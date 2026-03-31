import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './Landing.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Star canvas — with occasional shooting stars
// ─────────────────────────────────────────────────────────────────────────────
function StarCanvas({ diving }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Regular stars — only in top 55% of screen
    const stars = Array.from({ length: 160 }, () => ({
      x:  Math.random(),
      y:  Math.random() * 0.55,
      r:  Math.random() * 1.4 + 0.2,
      a:  Math.random(),
      da: (Math.random() - 0.5) * 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Shooting stars pool
    const shooters = [];
    let shooterTimer = 0;

    const spawnShooter = () => {
      shooters.push({
        x:   Math.random() * 0.7 + 0.1,
        y:   Math.random() * 0.3,
        len: 0.06 + Math.random() * 0.09,
        spd: 0.003 + Math.random() * 0.004,
        ang: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.012,
      });
    };

    let t = 0;
    let running = true;

    const draw = () => {
      if (!running) return;
      const { width: W, height: H } = canvas;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        const pulse = Math.sin(t * 0.8 + s.twinkleOffset);
        s.a = Math.max(0.08, Math.min(1, s.a + s.da));
        if (s.a <= 0.08 || s.a >= 1) s.da *= -1;
        const alpha = s.a * (0.65 + pulse * 0.25);
        const grd = ctx.createRadialGradient(s.x*W, s.y*H, 0, s.x*W, s.y*H, s.r * 2.5);
        grd.addColorStop(0, `rgba(220,242,255,${alpha})`);
        grd.addColorStop(1, `rgba(140,210,255,0)`);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Shooting stars
      shooterTimer += 0.016;
      if (shooterTimer > 3.5 + Math.random() * 4) {
        spawnShooter();
        shooterTimer = 0;
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += Math.cos(sh.ang) * sh.spd;
        sh.y += Math.sin(sh.ang) * sh.spd;
        sh.life -= sh.decay;
        if (sh.life <= 0) { shooters.splice(i, 1); continue; }
        const tx = sh.x - Math.cos(sh.ang) * sh.len;
        const ty = sh.y - Math.sin(sh.ang) * sh.len;
        const grd = ctx.createLinearGradient(tx*W, ty*H, sh.x*W, sh.y*H);
        grd.addColorStop(0, `rgba(200,240,255,0)`);
        grd.addColorStop(1, `rgba(220,248,255,${sh.life * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(tx * W, ty * H);
        ctx.lineTo(sh.x * W, sh.y * H);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`${styles.stars} ${diving ? styles.starsFade : ''}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ripple canvas — cursor ripples on the water surface
// ─────────────────────────────────────────────────────────────────────────────
function RippleCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const ripplesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnRipple = (x, y) => {
      ripplesRef.current.push({ x, y, r: 0, life: 1.0 });
    };

    // Gentle ambient ripples along horizon
    let ambientTimer = 0;
    const spawnAmbient = () => {
      const { width: W, height: H } = canvas;
      const horizonY = H * 0.57;
      spawnRipple(Math.random() * W, horizonY + (Math.random() - 0.5) * H * 0.04);
    };

    const onMove = (e) => {
      const { height: H } = canvas;
      const horizonY = H * 0.57;
      if (e.clientY > horizonY - H * 0.06 && e.clientY < horizonY + H * 0.10) {
        if (Math.random() < 0.06) spawnRipple(e.clientX, e.clientY);
      }
    };
    window.addEventListener('mousemove', onMove);

    const onClick = (e) => {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => spawnRipple(
          e.clientX + (Math.random() - 0.5) * 60,
          e.clientY + (Math.random() - 0.5) * 20
        ), i * 80);
      }
    };
    window.addEventListener('click', onClick);

    let running = true;
    const draw = () => {
      if (!running) return;
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      ambientTimer += 0.016;
      if (ambientTimer > 1.8 + Math.random() * 2.4) {
        spawnAmbient();
        ambientTimer = 0;
      }

      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rp = ripplesRef.current[i];
        rp.r    += 2.2;
        rp.life -= 0.018;
        if (rp.life <= 0) { ripplesRef.current.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r * 1.8, rp.r * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(94,207,223,${rp.life * 0.22})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.rippleCanvas} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parallax layer wrapper
// ─────────────────────────────────────────────────────────────────────────────
function useParallax() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.05;
      smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.05;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return smoothRef;
}

// ─────────────────────────────────────────────────────────────────────────────
// Water surface — multi-layer SVG waves
// ─────────────────────────────────────────────────────────────────────────────
function WaterSurface() {
  return (
    <div className={styles.surface}>
      {[
        { color: '#0d5a7a', opacity: 0.95, delay: '0s',   dur: '9s',  top: '0px',  reverse: false },
        { color: '#082240', opacity: 0.90, delay: '0.4s', dur: '11s', top: '18px', reverse: true  },
        { color: '#041425', opacity: 0.92, delay: '0.8s', dur: '7s',  top: '32px', reverse: false },
        { color: '#020d1c', opacity: 0.96, delay: '0s',   dur: '14s', top: '48px', reverse: true  },
        { color: '#01060e', opacity: 1,    delay: '0s',   dur: '6s',  top: '68px', reverse: false },
      ].map((w, i) => (
        <svg
          key={i}
          className={styles.wave}
          style={{
            top: w.top,
            animationDuration: w.dur,
            animationDelay: w.delay,
            animationDirection: w.reverse ? 'reverse' : 'normal',
          }}
          width="200%" height="140"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
        >
          <path
            d={`M0,${50 + i*8} C240,${20+i*4} 480,${80+i*6} 720,${50+i*8} C960,${20+i*4} 1200,${80+i*6} 1440,${50+i*8} L1440,140 L0,140 Z`}
            fill={w.color}
            opacity={w.opacity}
          />
        </svg>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sonar dive hint — a precise, elegant pulse ring at the waterline
// ─────────────────────────────────────────────────────────────────────────────
function SonarHint({ diving }) {
  return (
    <div className={`${styles.sonar} ${diving ? styles.sonarFade : ''}`}>
      <div className={styles.sonarRings}>
        <span className={styles.sonarRing} style={{ '--delay': '0s',   '--size': '32px'  }} />
        <span className={styles.sonarRing} style={{ '--delay': '0.4s', '--size': '56px'  }} />
        <span className={styles.sonarRing} style={{ '--delay': '0.8s', '--size': '84px'  }} />
        <span className={styles.sonarRing} style={{ '--delay': '1.2s', '--size': '116px' }} />
      </div>
      <div className={styles.sonarDot} />
      <p className={styles.sonarText}>click anywhere to dive</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Landing component
// ─────────────────────────────────────────────────────────────────────────────
export default function Landing({ onDive }) {
  const [diving, setDiving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const parallaxRef = useParallax();
  const sunRef      = useRef(null);
  const haloRef     = useRef(null);
  const contentRef  = useRef(null);
  const rafRef      = useRef(null);

  // Staggered reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Parallax animation loop
  useEffect(() => {
    const tick = () => {
      const { x, y } = parallaxRef.current;
      if (sunRef.current) {
        sunRef.current.style.transform =
          `translate(calc(-50% + ${x * 14}px), calc(-50% + ${y * 8}px))`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform =
          `translate(calc(-50% + ${x * 20}px), calc(-50% + ${y * 12}px))`;
      }
      if (contentRef.current) {
        contentRef.current.style.transform =
          `translate(calc(-50% + ${x * 6}px), calc(-64% + ${y * 4}px))`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [parallaxRef]);

  const handleDive = useCallback(() => {
    if (diving) return;
    setDiving(true);
    setTimeout(onDive, 1100);
  }, [diving, onDive]);

  return (
    <div
      className={`${styles.landing} ${diving ? styles.diving : ''}`}
      onClick={handleDive}
    >
      {/* ── Sky ── */}
      <div className={styles.sky} />

      {/* ── Stars with occasional shooting stars ── */}
      <StarCanvas diving={diving} />

      {/* ── Atmospheric haze bands ── */}
      <div className={styles.hazeBand} style={{ '--hy': '18%', '--hopacity': '0.12' }} />
      <div className={styles.hazeBand} style={{ '--hy': '32%', '--hopacity': '0.08' }} />

      {/* ── Sun atmosphere ── */}
      <div ref={haloRef} className={styles.sunHalo} />
      <div ref={sunRef}  className={styles.sun}>
        <div className={styles.sunCore} />
        <div className={styles.sunCorona} />
      </div>

      {/* ── Light rays fanning down from sun ── */}
      <div className={styles.sunRays} />

      {/* ── Hero text — splits in from below waterline ── */}
      <div ref={contentRef} className={`${styles.content} ${revealed ? styles.contentVisible : ''}`}>

        {/* Eyebrow */}
        <p className={styles.eyebrow}>
          {'Portfolio'.split('').map((ch, i) => (
            <span key={i} className={styles.eyebrowChar} style={{ '--ci': i }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </p>

        {/* Name — large serif, split lines */}
        <h1 className={styles.name}>
          <span className={styles.nameLine} style={{ '--li': 0 }}>
            Sahib
          </span>
          <span className={`${styles.nameLine} ${styles.nameLineEm}`} style={{ '--li': 1 }}>
            <em>Singh</em>
          </span>
        </h1>

        {/* Sub — roles with a divider */}
        <div className={styles.subRow} style={{ '--li': 2 }}>
          <span className={styles.subDash} />
          <p className={styles.sub}>Systems · Games · Worlds</p>
          <span className={styles.subDash} />
        </div>

      </div>

      {/* ── Horizon shimmer ── */}
      <div className={styles.horizon} />

      {/* ── Ripple canvas (water surface interaction) ── */}
      <RippleCanvas />

      {/* ── Water ── */}
      <WaterSurface />

      {/* ── Sonar dive hint ── */}
      <SonarHint diving={diving} />

      {/* ── Flood overlay ── */}
      <div className={`${styles.flood} ${diving ? styles.flooding : ''}`} />
    </div>
  );
}
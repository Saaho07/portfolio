import { useRef, useEffect, useState } from 'react';
import styles from './Landing.module.css';

export default function Landing({ onDive }) {
  const [diving, setDiving] = useState(false);
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  // Animated star field on canvas
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

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.52,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.006,
    }));

    let running = true;
    const draw = () => {
      if (!running) return;
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      stars.forEach(s => {
        s.a = Math.max(0.1, Math.min(1, s.a + s.da));
        if (s.a <= 0.1 || s.a >= 1) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,240,255,${s.a * 0.8})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleDive = () => {
    if (diving) return;
    setDiving(true);
    setTimeout(onDive, 1100);
  };

  return (
    <div className={`${styles.landing} ${diving ? styles.diving : ''}`} onClick={handleDive}>
      {/* Sky */}
      <canvas ref={canvasRef} className={styles.stars} />
      <div className={styles.sky} />

      {/* Atmospheric glow behind sun */}
      <div className={styles.sunHalo} />
      <div className={styles.sun} />

      {/* Content */}
      <div className={styles.content}>
        <p className={styles.eyebrow}>Portfolio</p>
        <h1 className={styles.name}>
          Sahib
          <br />
          <em>Singh</em>
        </h1>
        <p className={styles.sub}>Systems · Games · Worlds</p>
      </div>

      {/* Horizon shimmer */}
      <div className={styles.horizon} />

      {/* Water surface */}
      <WaterSurface />

      {/* Dive hint */}
      <div className={`${styles.hint} ${diving ? styles.hintFade : ''}`}>
        <div className={styles.hintRings}>
          <span /><span /><span />
        </div>
        <span className={styles.hintText}>click to dive</span>
      </div>

      {/* Dive flood overlay */}
      <div className={`${styles.flood} ${diving ? styles.flooding : ''}`} />
    </div>
  );
}

function WaterSurface() {
  return (
    <div className={styles.surface}>
      {/* Multiple SVG wave layers — each a different water strata colour */}
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
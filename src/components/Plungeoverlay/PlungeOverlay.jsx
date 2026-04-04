import { useEffect, useRef, useState } from 'react';
import styles from './PlungeOverlay.module.css';

export default function PlungeOverlay({ origin }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('impact'); // impact → rush → dissolve

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('rush'), 180);
    const t2 = setTimeout(() => setPhase('dissolve'), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Bubble canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const W = canvas.width, H = canvas.height;
    const cx = origin.x * W;
    const cy = origin.y * H;

    // spawn bubbles from impact point
    const bubbles = Array.from({ length: 48 }, (_, i) => ({
      x: cx + (Math.random() - 0.5) * 120,
      y: cy + (Math.random() - 0.5) * 40,
      r: 2 + Math.random() * 7,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -(1.5 + Math.random() * 3.5),
      life: 0.7 + Math.random() * 0.3,
      delay: Math.random() * 0.3,
      t: 0,
    }));

    // impact rings
    const rings = [
      { r: 0, maxR: 180, life: 1 },
      { r: 0, maxR: 110, life: 1 },
      { r: 0, maxR: 70,  life: 1 },
    ];

    let running = true;
    let elapsed = 0;

    const draw = () => {
      if (!running) return;
      elapsed += 0.016;
      ctx.clearRect(0, 0, W, H);

      // impact rings
      rings.forEach((ring, i) => {
        const delay = i * 0.05;
        const t = Math.max(0, elapsed - delay);
        const progress = Math.min(t * 2, 1);
        const r = ring.maxR * progress;
        const alpha = (1 - progress) * 0.6;
        if (alpha <= 0) return;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.8, r * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(94,207,223,${alpha})`;
        ctx.lineWidth = 2 - progress;
        ctx.stroke();
      });

      // bubbles
      bubbles.forEach(b => {
        if (elapsed < b.delay) return;
        b.t += 0.016;
        b.x += b.vx + Math.sin(b.t * 2.4) * 0.3;
        b.y += b.vy * (0.85 + b.t * 0.08);
        b.life -= 0.012;
        if (b.life <= 0) return;
        const grd = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
        grd.addColorStop(0, `rgba(200,240,255,${b.life * 0.85})`);
        grd.addColorStop(0.6, `rgba(94,207,223,${b.life * 0.35})`);
        grd.addColorStop(1, `rgba(20,80,120,0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // specular highlight
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.life * 0.5})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    };

    draw();
    return () => { running = false; };
  }, [origin]);

  return (
    <div className={`${styles.overlay} ${styles[phase]}`}>
      <div className={styles.waterFill} />
      <div className={styles.causticFlash} />
      <div className={styles.surfaceRefraction} />
      <canvas ref={canvasRef} className={styles.bubbleCanvas} />
    </div>
  );
}
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './UnderwaterBg.module.css';

export default function UnderwaterBg() {
  const [bubbles, setBubbles] = useState([]);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Spawn bubbles periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const size = 4 + Math.random() * 12;
      const duration = 6 + Math.random() * 8;
      const left = Math.random() * 90;
      const delay = Math.random() * 2;
      const depth = Math.random() * 60 - 30; // random Z depth

      setBubbles(prev => [...prev, { id, size, left, duration, delay, depth }]);

      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== id));
      }, (duration + delay) * 1000);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Track mouse for light
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate caustic rays with random attributes
  const causticRays = useCallback(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      left: 5 + i * 4.5,
      height: 35 + Math.random() * 45,
      opacity: 0.2 + Math.random() * 0.5,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      depth: Math.random() * 40 - 20,
    }));
  }, []);

  const rays = causticRays();

  return (
    <>
      <div className={styles.bg} />
      <div className={styles.stage3d}>
        {/* Caustics layer */}
        <div className={styles.causticsLayer}>
          {rays.map((ray, idx) => (
            <div
              key={idx}
              className={styles.ray}
              style={{
                left: `${ray.left}%`,
                height: `${ray.height}%`,
                opacity: ray.opacity,
                animationDelay: `${ray.delay}s`,
                animationDuration: `${ray.duration}s`,
                transform: `translateZ(${ray.depth}px)`,
              }}
            />
          ))}
        </div>

        {/* Mouse light */}
        <div
          className={styles.mouseLight}
          style={{
            left: `${mousePosRef.current.x * 100}%`,
            top: `${mousePosRef.current.y * 100}%`,
          }}
        />

        {/* Water surface with dual shimmers */}
        <div className={styles.waterLine}>
          <div className={styles.shimmer} />
          <div className={styles.shimmerReverse} />
        </div>

        {/* Bubbles container */}
        <div className={styles.bubblesContainer}>
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className={styles.bubble}
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.left}%`,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                transform: `translateZ(${bubble.depth}px)`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
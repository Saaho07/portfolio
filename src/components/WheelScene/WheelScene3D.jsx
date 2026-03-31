import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { CARDS, N } from '../../data/cards';
import styles from './WheelScene3D.module.css';

// ── Layout constants ──────────────────────────────────────────────────────────
const WHEEL_R   = 3.2;   // spoke length (wheel radius)
const SPOKE_N   = N;     // one spoke per card
const CARD_W    = 1.6;
const CARD_H    = 2.1;
const WHEEL_X   = -3.5;  // wheel centre is left-of-screen
const FOCUS_ANGLE = 0;   // rightward horizontal spoke is FOCUS (angle 0 = +X axis)

// Shared mutable state (no re-render cost)
const S = {
  wheelAngle: 0,         // current rotation
  targetAngle: 0,        // where we want to be
  current: 0,
  cardWorldPos: [],      // Vector3[] updated every frame
  velocity: 0,
};

function spokeAngle(i) {
  return (i / SPOKE_N) * Math.PI * 2;
}

function targetForCard(i) {
  // Rotate wheel so card i lands on the focus angle (0 = right / +X)
  return -(i / SPOKE_N) * Math.PI * 2;
}

// ── Water particle layer ──────────────────────────────────────────────────────
function BubbleLayer({ z, count, color, speed, spread }) {
  const mesh = useRef();
  const { pos, spd } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * spread;
      pos[i*3+1] = (Math.random() - 0.5) * 14;
      pos[i*3+2] = z + (Math.random() - 0.5) * 0.8;
      spd[i]     = speed * (0.5 + Math.random());
    }
    return { pos, spd };
  }, []); // eslint-disable-line

  useFrame((_, dt) => {
    if (!mesh.current) return;
    const arr = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i*3+1] += spd[i] * dt;
      if (arr[i*3+1] > 7) arr[i*3+1] = -7;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Hub — ornate centre of wheel ──────────────────────────────────────────────
function Hub({ accent }) {
  const core = useRef();
  const ring1 = useRef();
  const ring2 = useRef();

  const ring1Pts = useMemo(() => {
    return Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return [Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0];
    });
  }, []);

  const ring2Pts = useMemo(() => {
    return Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return [Math.cos(a) * 0.60, Math.sin(a) * 0.60, Math.sin(a * 3) * 0.04];
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (core.current) {
      core.current.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.25;
    }
    if (ring1.current) ring1.current.rotation.z = t * 0.38;
    if (ring2.current) ring2.current.rotation.z = -t * 0.22;
  });

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#0d5a7a" emissive={accent} emissiveIntensity={0.6} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <group ref={ring1}>
        <Line points={ring1Pts} color={accent} lineWidth={1.0} transparent opacity={0.55} />
      </group>
      <group ref={ring2}>
        <Line points={ring2Pts} color="#5ecfdf" lineWidth={0.6} transparent opacity={0.35} />
      </group>
    </group>
  );
}

// ── Spoke ─────────────────────────────────────────────────────────────────────
function Spoke({ angle, active, accent, len }) {
  const ref = useRef();
  const end   = [Math.cos(angle) * len, Math.sin(angle) * len, 0];
  const start = [Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0];

  // Dashed spoke using multiple short segments
  const pts = useMemo(() => {
    const arr = [];
    const segs = 10;
    for (let s = 0; s < segs; s++) {
      const t0 = (s + 0.1) / segs;
      const t1 = (s + 0.72) / segs;
      arr.push([
        start[0] + (end[0] - start[0]) * t0,
        start[1] + (end[1] - start[1]) * t0,
        0,
      ]);
      arr.push([
        start[0] + (end[0] - start[0]) * t1,
        start[1] + (end[1] - start[1]) * t1,
        0,
      ]);
    }
    return arr;
  }, [angle, len]); // eslint-disable-line

  useFrame(({ clock }) => {
    const line = ref.current?.children[0];
    if (line?.material) {
      const t = clock.getElapsedTime();
      line.material.opacity = active
        ? 0.75 + Math.sin(t * 2.5) * 0.2
        : 0.18 + Math.sin(t * 0.8 + angle) * 0.05;
    }
  });

  return (
    <group ref={ref}>
      <Line
        points={[start, end]}
        color={active ? accent : '#2a6a8a'}
        lineWidth={active ? 1.8 : 0.6}
        transparent
        opacity={active ? 0.8 : 0.2}
      />
    </group>
  );
}

// ── Card plate (3D frame behind the HTML card) ────────────────────────────────
function CardPlate({ angle, active, accent }) {
  const grp   = useRef();
  const frame = useRef();
  const glow  = useRef();
  const x = Math.cos(angle) * WHEEL_R;
  const y = Math.sin(angle) * WHEEL_R;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!grp.current) return;
    // Counter-rotate so card always faces camera despite wheel spin
    grp.current.rotation.z = -S.wheelAngle - angle;

    if (frame.current?.material) {
      frame.current.material.opacity = active
        ? 0.85 + Math.sin(t * 2.2) * 0.08
        : 0.22;
    }
    if (glow.current?.material) {
      glow.current.material.opacity = active
        ? 0.18 + Math.sin(t * 1.5) * 0.07
        : 0.0;
    }
  });

  return (
    <group position={[x, y, 0]}>
      {/* glow behind */}
      <mesh ref={glow} position={[0, 0, -0.15]}>
        <planeGeometry args={[CARD_W + 1.2, CARD_H + 1.2]} />
        <meshBasicMaterial color={accent} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={grp}>
        {/* card backing */}
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[CARD_W, CARD_H, 0.05]} />
          <meshStandardMaterial
            color={active ? '#0a1e30' : '#061322'}
            metalness={0.5}
            roughness={0.25}
            transparent
            opacity={active ? 0.92 : 0.78}
          />
        </mesh>
        {/* edge frame */}
        <lineSegments ref={frame}>
          <edgesGeometry args={[new THREE.BoxGeometry(CARD_W + 0.02, CARD_H + 0.02, 0.06)]} />
          <lineBasicMaterial color={active ? accent : '#194a68'} transparent opacity={0.25} />
        </lineSegments>
      </group>
    </group>
  );
}

// ── WheelMesh — rotates, positions all 3D geometry ───────────────────────────
function WheelMesh({ current, accent }) {
  const grp     = useRef();
  const rimRef  = useRef();
  const tmp     = useMemo(() => new THREE.Vector3(), []);

  const rimPts = useMemo(() => {
    return Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2;
      return [Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0];
    });
  }, []);

  useFrame((_, dt) => {
    // Spring toward target
    const diff = S.targetAngle - S.wheelAngle;
    S.velocity += diff * 0.12;
    S.velocity *= 0.82;
    S.wheelAngle += S.velocity * dt * 60;

    if (grp.current) {
      grp.current.rotation.z = S.wheelAngle;

      // Record world positions for HtmlCards
      for (let i = 0; i < SPOKE_N; i++) {
        const a = spokeAngle(i);
        tmp.set(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0);
        tmp.applyEuler(grp.current.rotation);
        tmp.add(grp.current.position);
        S.cardWorldPos[i] = tmp.clone();
      }
    }
  });

  return (
    <group ref={grp} position={[WHEEL_X, 0, 0]}>
      <Hub accent={accent} />
      {/* Rim */}
      <Line points={rimPts} color="#1a6080" lineWidth={0.5} transparent opacity={0.22} />

      {/* Spokes & plates */}
      {Array.from({ length: SPOKE_N }, (_, i) => {
        const a = spokeAngle(i);
        const active = i === current;
        return (
          <group key={i}>
            <Spoke angle={a} active={active} accent={accent} len={WHEEL_R} />
            <CardPlate angle={a} active={active} accent={accent} />
          </group>
        );
      })}
    </group>
  );
}

// ── HtmlCard — positioned via world-space tracking ────────────────────────────
function HtmlCard({ card, idx, active, onClick }) {
  const grpRef = useRef();
  const divRef = useRef();

  useFrame(() => {
    const wp = S.cardWorldPos[idx];
    if (grpRef.current && wp) {
      grpRef.current.position.copy(wp);
    }

    if (divRef.current) {
      // Blur non-focused cards
      const wp2 = S.cardWorldPos[idx];
      if (wp2) {
        // Distance from focus spoke (world X near WHEEL_X + WHEEL_R)
        const focusX = WHEEL_X + WHEEL_R;
        const dist = Math.abs(wp2.x - focusX) + Math.abs(wp2.y) * 0.5;
        const blur = Math.max(0, dist * 1.1 - 0.6);
        const sc   = active ? 1 : Math.max(0.82, 1 - dist * 0.04);
        divRef.current.style.filter  = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : '';
        divRef.current.style.opacity = active ? '1' : `${Math.max(0.3, 1 - dist * 0.18)}`;
        divRef.current.style.transform = `scale(${sc})`;
      }
    }
  });

  return (
    <group ref={grpRef}>
      <Html center distanceFactor={8} zIndexRange={[15, 0]} style={{ pointerEvents: active ? 'auto' : 'none' }}>
        <div
          ref={divRef}
          className={`${styles.card} ${active ? styles.cardActive : ''}`}
          style={{ '--accent': card.accent }}
          onClick={active ? onClick : undefined}
        >
          <div className={styles.cardShimmer} />
          <p className={styles.cardTag}>{card.tag}</p>
          <h3 className={styles.cardTitle}>
            {card.title.map((line, i) => (
              <span key={i}>
                {i === card.titleEm ? <em>{line}</em> : line}
                {i < card.title.length - 1 && <br />}
              </span>
            ))}
          </h3>
          <p className={styles.cardBody}>{card.body}</p>
          <div className={styles.cardChips}>
            {card.chips.slice(0, 3).map(ch => (
              <span key={ch} className={styles.chip}>{ch}</span>
            ))}
          </div>
          {active && (
            <div className={styles.cardCta}>
              <span className={styles.ctaDot} />
              tap to explore
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ── Focus indicator — glowing line on the right-horizontal axis ───────────────
function FocusLine({ accent }) {
  const ref = useRef();
  const pts = [
    [WHEEL_X, 0, 0],
    [WHEEL_X + WHEEL_R + 0.4, 0, 0],
    [6, 0, 0],
  ];
  useFrame(({ clock }) => {
    const line = ref.current?.children[0];
    if (line?.material) {
      line.material.opacity = 0.18 + Math.sin(clock.getElapsedTime() * 1.4) * 0.08;
    }
  });
  return (
    <group ref={ref}>
      <Line points={pts} color={accent} lineWidth={0.7} transparent opacity={0.22} dashed dashSize={0.18} gapSize={0.10} />
    </group>
  );
}

// ── Scene root (inside Canvas) ────────────────────────────────────────────────
function Scene({ current, accent, onCardClick }) {
  return (
    <>
      <ambientLight intensity={0.5} color="#c8eeff" />
      <pointLight position={[WHEEL_X, 0, 6]} intensity={2.5} color={accent} distance={14} decay={2} />
      <pointLight position={[-8, 6, -2]}       intensity={1.2} color="#a78bfa" distance={20} decay={2} />
      <pointLight position={[4, -4, -1]}        intensity={1.0} color="#38bdf8" distance={18} decay={2} />

      {/* Bubble layers */}
      <BubbleLayer z={-8} count={60} color="#0d5a7a" speed={0.35} spread={20} />
      <BubbleLayer z={-4} count={55} color="#12899e" speed={0.60} spread={16} />
      <BubbleLayer z={-1} count={40} color="#5ecfdf" speed={0.95} spread={12} />
      <BubbleLayer z={ 2} count={25} color="#a8e6ef" speed={1.40} spread={8}  />

      {/* Focus axis dashed line */}
      <FocusLine accent={accent} />

      {/* The wheel */}
      <WheelMesh current={current} accent={accent} />

      {/* HTML cards overlay */}
      {CARDS.map((card, i) => (
        <HtmlCard
          key={i}
          card={card}
          idx={i}
          active={i === current}
          onClick={() => onCardClick(i)}
        />
      ))}
    </>
  );
}

// ── Content panel ─────────────────────────────────────────────────────────────
function ContentPanel({ card, open, onClose }) {
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (open && card) setShown(card);
    else if (!open) {
      const t = setTimeout(() => setShown(null), 600);
      return () => clearTimeout(t);
    }
  }, [open, card]);

  if (!shown) return null;

  return (
    <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
      {/* Ink leak rings */}
      <div className={styles.leakRings}>
        <span /><span /><span /><span />
      </div>

      <div className={styles.panelInner}>
        <button className={styles.panelClose} onClick={onClose} aria-label="Close">
          <span>×</span>
        </button>

        <p className={styles.panelTag} style={{ '--accent': shown.accent }}>{shown.tag}</p>

        <h2 className={styles.panelTitle} style={{ '--accent': shown.accent }}>
          {shown.title.map((line, i) => (
            <span key={i}>
              {i === shown.titleEm ? <em>{line}</em> : line}
              {i < shown.title.length - 1 && <br />}
            </span>
          ))}
        </h2>

        <div className={styles.panelRule} style={{ background: shown.accent }} />

        <p className={styles.panelBody}>{shown.body}</p>

        {/* Detail grid */}
        {shown.detail && (
          <div className={styles.panelDetails}>
            {shown.detail.map(d => (
              <div key={d.label} className={styles.detailRow}>
                <span className={styles.detailLabel}>{d.label}</span>
                <span className={styles.detailValue} style={{ color: shown.accent }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.panelChips}>
          {shown.chips.map(ch => (
            <span key={ch} className={styles.panelChip} style={{ '--accent': shown.accent }}>{ch}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Theatrical water background layers ───────────────────────────────────────
function WaterBackground() {
  return (
    <div className={styles.waterBg} aria-hidden="true">
      {/* Abyss floor */}
      <div className={styles.wLayer} data-layer="0" />
      {/* Deep strata */}
      <div className={styles.wLayer} data-layer="1" />
      <div className={styles.wLayer} data-layer="2" />
      <div className={styles.wLayer} data-layer="3" />
      {/* Caustic light shafts */}
      <div className={styles.wLayer} data-layer="4" />
      {/* Surface shimmer */}
      <div className={styles.wLayer} data-layer="5" />
      {/* Vignette overlay */}
      <div className={styles.waterVignette} />
    </div>
  );
}

// ── Nav UI ────────────────────────────────────────────────────────────────────
function NavUI({ current, total, onPrev, onNext }) {
  return (
    <div className={styles.navUi}>
      <div className={styles.counter}>
        <span className={styles.counterNum}>{String(current + 1).padStart(2, '0')}</span>
        <span className={styles.counterSep}> / </span>
        <span className={styles.counterTot}>{String(total).padStart(2, '0')}</span>
      </div>
      <div className={styles.navBtns}>
        <button className={styles.navBtn} onClick={onPrev} aria-label="Previous">↑</button>
        <button className={styles.navBtn} onClick={onNext} aria-label="Next">↓</button>
      </div>
      <div className={styles.scrollHint}>
        <span className={styles.hintLine} />
        <span className={styles.hintTxt}>scroll or click to navigate</span>
        <span className={styles.hintLine} />
      </div>
    </div>
  );
}

// ── Focus indicator dots (right side, shows which spoke is active) ────────────
function FocusDots({ current }) {
  return (
    <div className={styles.focusDots}>
      {CARDS.map((c, i) => (
        <div
          key={i}
          className={`${styles.focusDot} ${i === current ? styles.focusDotActive : ''}`}
          style={{ '--accent': c.accent }}
        />
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function WheelScene3D({ visible }) {
  const [current, setCurrent] = useState(0);
  const [panelCard, setPanelCard] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const accent = CARDS[current]?.accent ?? '#5ecfdf';

  // Navigation
  const goTo = useCallback((idx) => {
    const i = ((idx % N) + N) % N;
    setCurrent(i);
    S.current = i;
    S.targetAngle = targetForCard(i);
    setPanelOpen(false);
  }, []);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  const handleCardClick = useCallback((idx) => {
    if (idx !== current) { goTo(idx); return; }
    if (panelOpen) { setPanelOpen(false); }
    else           { setPanelCard(CARDS[idx]); requestAnimationFrame(() => setPanelOpen(true)); }
  }, [current, panelOpen, goTo]);

  // Scroll
  useEffect(() => {
    const acc = { v: 0, timer: null };
    const onWheel = (e) => {
      if (!visible) return;
      e.preventDefault();
      acc.v += e.deltaY;
      clearTimeout(acc.timer);
      acc.timer = setTimeout(() => {
        if (acc.v > 30) next();
        else if (acc.v < -30) prev();
        acc.v = 0;
      }, 80);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [visible, next, prev]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (!visible) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, next, prev]);

  // Sync S.wheelAngle init
  useEffect(() => {
    S.targetAngle = targetForCard(0);
    S.wheelAngle  = targetForCard(0);
    S.cardWorldPos = new Array(N).fill(null).map(() => new THREE.Vector3());
  }, []);

  return (
    <div className={`${styles.scene} ${visible ? styles.visible : ''}`}>
      {/* ── Theatrical layered water background ── */}
      <WaterBackground />

      {/* ── WebGL canvas — wheel lives here ── */}
      <Canvas
        className={styles.canvas}
        camera={{ position: [0, 0, 9], fov: 48, near: 0.1, far: 80 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Scene current={current} accent={accent} onCardClick={handleCardClick} />
      </Canvas>

      {/* ── Navigation UI ── */}
      <NavUI current={current} total={N} onPrev={prev} onNext={next} />

      {/* ── Focus dots ── */}
      <FocusDots current={current} />

      {/* ── Content panel — leaks in from right ── */}
      <ContentPanel card={panelCard} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
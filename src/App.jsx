import { useState, useEffect, useRef } from 'react';
import Landing from './components/Landing/Landing.jsx';
import WheelScene3D from './components/WheelScene/WheelScene3D.jsx';
import PlungeOverlay from './components/PlungeOverlay/PlungeOverlay.jsx';
import styles from './App.module.css';

// phases: 'landing' → 'plunging' → 'surfacing' → 'scene'
export default function App() {
  const [phase, setPhase] = useState('landing');
  const [plungeOrigin, setPlungeOrigin] = useState({ x: 0.5, y: 0.57 });

  const handleDive = (originFraction) => {
    if (originFraction) setPlungeOrigin(originFraction);
    setPhase('plunging');
    // after plunge anim plays, switch to surfacing (scene fades in)
    setTimeout(() => setPhase('surfacing'), 900);
    setTimeout(() => setPhase('scene'), 1800);
  };

  return (
    <div className={styles.root}>
      {phase === 'landing' && (
        <Landing onDive={handleDive} />
      )}
      {phase === 'plunging' && (
        <PlungeOverlay origin={plungeOrigin} />
      )}
      <WheelScene3D visible={phase === 'surfacing' || phase === 'scene'} settling={phase === 'surfacing'} />
    </div>
  );
}
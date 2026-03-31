import { useState } from 'react';
import Landing from './components/Landing/Landing.jsx';
import WheelScene3D from './components/WheelScene/WheelScene3D.jsx';
import styles from './App.module.css';

export default function App() {
  const [phase, setPhase] = useState('landing'); // 'landing' | 'transitioning' | 'scene'

  const handleDive = () => {
    setPhase('transitioning');
    // Landing animates for ~1.1s, then we show scene
    setTimeout(() => setPhase('scene'), 1100);
  };

  return (
    <div className={styles.root}>
      {phase !== 'scene' && (
        <Landing onDive={handleDive} />
      )}
      <WheelScene3D visible={phase === 'scene'} />
    </div>
  );
}
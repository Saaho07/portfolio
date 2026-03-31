import { useCallback, useEffect, useRef, useState } from 'react';
import { CARDS } from '../data/cards';

export const N = CARDS.length;
export const RADIUS = 300;
export const CARD_ANGLE = (2 * Math.PI) / N;

export function getTargetAngle(idx) {
  return -(idx * CARD_ANGLE) + Math.PI;
}

function easeOutBack(t) {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function getCardPosition(i, wheelAngle) {
  const angle = i * CARD_ANGLE + wheelAngle;
  const x = Math.cos(angle) * RADIUS;
  const y = Math.sin(angle) * RADIUS;

  const visible = x < 60;
  const distFromFocus = Math.sqrt((x + RADIUS) ** 2 + y ** 2);
  const maxDist = RADIUS * 1.8;
  const opacity = visible ? Math.max(0.18, 1 - distFromFocus / maxDist) : 0;
  const blur = visible ? Math.min(2.5, distFromFocus / 140) : 0;

  return { x, y, angle, visible, opacity, blur };
}

export function useWheelState() {
  const [current, setCurrent] = useState(0);
  const [wheelAngle, setWheelAngle] = useState(getTargetAngle(0));
  const [cardPositions, setCardPositions] = useState(() =>
    CARDS.map((_, i) => getCardPosition(i, getTargetAngle(0)))
  );

  const animRef = useRef(null);
  const wheelAngleRef = useRef(getTargetAngle(0));
  const animatingRef = useRef(false);
  const scrollCooldown = useRef(false);

  const recompute = useCallback((angle) => {
    setWheelAngle(angle);
    setCardPositions(CARDS.map((_, i) => getCardPosition(i, angle)));
  }, []);

  const goTo = useCallback((idx) => {
    if (animatingRef.current) return;

    const from = wheelAngleRef.current;
    let delta = getTargetAngle(idx) - from;
    while (delta >  Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const to = from + delta;
    if (Math.abs(delta) < 0.001) return;

    cancelAnimationFrame(animRef.current);
    animatingRef.current = true;
    setCurrent(idx);

    const startTime = performance.now();
    const DURATION = 850;

    function step(now) {
      const t = Math.min((now - startTime) / DURATION, 1);
      const eased = t < 0.7
        ? easeInOutQuart(t / 0.7) * 0.88
        : 0.88 + easeOutBack((t - 0.7) / 0.3) * 0.12;
      const angle = from + (to - from) * eased;
      wheelAngleRef.current = angle;
      recompute(angle);

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        wheelAngleRef.current = to;
        recompute(to);
        animatingRef.current = false;
      }
    }
    animRef.current = requestAnimationFrame(step);
  }, [recompute]);

  const prev = useCallback(() => goTo((current - 1 + N) % N), [current, goTo]);
  const next = useCallback(() => goTo((current + 1) % N), [current, goTo]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  const handleScroll = useCallback((e) => {
    e.preventDefault();
    if (scrollCooldown.current) return;
    if (e.deltaY > 20) {
      next();
      scrollCooldown.current = true;
      setTimeout(() => { scrollCooldown.current = false; }, 950);
    } else if (e.deltaY < -20) {
      prev();
      scrollCooldown.current = true;
      setTimeout(() => { scrollCooldown.current = false; }, 950);
    }
  }, [prev, next]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return { current, wheelAngle, cardPositions, goTo, prev, next, handleScroll };
}

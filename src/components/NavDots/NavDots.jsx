import styles from './NavDots.module.css';

export default function NavDots({ total, current, onDotClick }) {
  return (
    <div className={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={`${styles.dot} ${i === current ? styles.active : ''}`}
          onClick={() => onDotClick(i)}
          aria-label={`Go to card ${i + 1}`}
        />
      ))}
    </div>
  );
}

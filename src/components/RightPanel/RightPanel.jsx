import { useEffect, useState } from 'react';
import styles from './RightPanel.module.css';

export default function RightPanel({ card }) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(card);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setDisplayed(card);
      setVisible(true);
    }, 260);
    return () => clearTimeout(t);
  }, [card]);

  return (
    <div className={`${styles.panel} ${visible ? styles.visible : ''}`}>
      <p className={styles.eyebrow}>{displayed.tag}</p>

      <h2 className={styles.title}>
        {displayed.title.map((line, i) => (
          <span key={i}>
            {i === displayed.titleEm ? <em>{line}</em> : line}
            {i < displayed.title.length - 1 && <br />}
          </span>
        ))}
      </h2>

      <div className={styles.divider} />

      <p className={styles.body}>{displayed.body}</p>

      <div className={styles.tags}>
        {displayed.chips.map(ch => (
          <span key={ch} className={styles.tag}>{ch}</span>
        ))}
      </div>
    </div>
  );
}

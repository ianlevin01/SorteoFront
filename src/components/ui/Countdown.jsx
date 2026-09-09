import { useCountdown } from '../../hooks/useCountdown.js';
import styles from './Countdown.module.css';

const UNITS = [
  ['days', 'días'],
  ['hours', 'hs'],
  ['minutes', 'min'],
  ['seconds', 'seg'],
];

export function Countdown({ target, compact = false }) {
  const c = useCountdown(target);

  if (!target) return <span className={styles.tbd}>Fecha a confirmar</span>;
  if (!c || c.finished) return <span className={styles.done}>Sorteo realizado</span>;

  return (
    <div className={compact ? styles.rowCompact : styles.row}>
      {UNITS.map(([key, label]) => (
        <div key={key} className={styles.cell}>
          <span className={styles.num}>{String(c[key]).padStart(2, '0')}</span>
          <span className={styles.unit}>{label}</span>
        </div>
      ))}
    </div>
  );
}

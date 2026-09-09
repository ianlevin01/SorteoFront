import styles from './TicketFan.module.css';

/** Ilustración: 3 tickets en abanico. Decorativa. */
export function TicketFan() {
  return (
    <div className={styles.fan} aria-hidden="true">
      {[-1, 0, 1].map((i) => (
        <div key={i} className={styles.card} style={{ '--i': i }}>
          <span className={styles.perf} />
          <span className={styles.num}>{['0472', '1938', '5561'][i + 1]}</span>
        </div>
      ))}
    </div>
  );
}

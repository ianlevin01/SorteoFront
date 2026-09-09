import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketMini } from './TicketMini.jsx';
import styles from './TicketReveal.module.css';

/**
 * Revela una lista de números uno por uno (salteable).
 * numbers: number[], onDone opcional.
 */
export function TicketReveal({ numbers = [], status = 'pending', totalNumbers, raffleTitle, onDone }) {
  const total = numbers.length;
  const perTick = total > 20 ? 60 : total > 8 ? 140 : 260;
  const [shown, setShown] = useState(0);
  const done = shown >= total;

  const sorted = useMemo(() => [...numbers].sort((a, b) => a - b), [numbers]);

  useEffect(() => {
    if (done) {
      onDone?.();
      return undefined;
    }
    const id = setTimeout(() => setShown((n) => Math.min(total, n + 1)), perTick);
    return () => clearTimeout(id);
  }, [shown, done, total, perTick, onDone]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.count}>
          {Math.min(shown, total)} / {total}
        </span>
        <AnimatePresence>
          {!done && (
            <motion.button
              type="button"
              className={styles.skip}
              onClick={() => setShown(total)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Mostrar todos
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.grid}>
        {sorted.slice(0, shown).map((n, i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: done ? Math.min(i * 0.015, 0.3) : 0, ease: [0.16, 1, 0.3, 1] }}
          >
            <TicketMini number={n} status={status} totalNumbers={totalNumbers} raffleTitle={raffleTitle} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

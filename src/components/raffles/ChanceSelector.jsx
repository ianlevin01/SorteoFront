import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button.jsx';
import { formatMoney, formatInt } from '../../lib/format.js';
import styles from './ChanceSelector.module.css';

export function ChanceSelector({ tiers = [], onConfirm, busy = false, disabled = false }) {
  const ordered = [...tiers].sort((a, b) => a.chances - b.chances);
  const defaultTier = ordered.find((t) => t.popular) || ordered[Math.min(1, ordered.length - 1)] || ordered[0];
  const [selectedId, setSelectedId] = useState(defaultTier?.id);

  const selected = ordered.find((t) => t.id === selectedId) || defaultTier;

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Elegí cuántos números querés</p>

      <div className={styles.tiles}>
        {ordered.map((tier) => {
          const active = tier.id === selected?.id;
          const unit = tier.price / tier.chances;
          return (
            <button
              key={tier.id}
              type="button"
              className={clsx(styles.tile, active && styles.active)}
              onClick={() => setSelectedId(tier.id)}
              aria-pressed={active}
            >
              {tier.popular && <span className={styles.ribbon}>Más elegido</span>}
              <span className={styles.tileChances}>{formatInt(tier.chances)}</span>
              <span className={styles.tileUnit}>
                {tier.chances === 1 ? 'número' : 'números'}
              </span>
              <span className={styles.tilePrice}>{formatMoney(tier.price)}</span>
              {tier.chances > 1 && (
                <span className={styles.tilePerUnit}>{formatMoney(unit)} c/u</span>
              )}
            </button>
          );
        })}
      </div>

      <motion.div
        className={styles.summary}
        key={selected?.id}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className={styles.summaryLine}>
          <span>{formatInt(selected?.chances || 0)} {selected?.chances === 1 ? 'número' : 'números'}</span>
          <span className={styles.total}>{formatMoney(selected?.price || 0)}</span>
        </div>
        <p className={styles.summaryHint}>Total a transferir</p>
      </motion.div>

      <Button
        size="xl"
        block
        loading={busy}
        disabled={disabled || !selected}
        onClick={() => selected && onConfirm(selected)}
      >
        Participar
      </Button>

      <p className={styles.note}>
        Te vamos a mostrar el alias para transferir. Tus números quedan reservados al instante.
      </p>
    </div>
  );
}

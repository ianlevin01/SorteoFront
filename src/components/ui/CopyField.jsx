import { useState } from 'react';
import styles from './CopyField.module.css';

export function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* sin portapapeles */
    }
  };

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <button type="button" className={styles.btn} onClick={copy} aria-label={`Copiar ${label}`}>
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

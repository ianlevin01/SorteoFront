import clsx from 'clsx';
import styles from './Spinner.module.css';

export function Spinner({ size = 24, className }) {
  return (
    <span
      className={clsx(styles.spinner, className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function LoadingBlock({ label = 'Cargando…' }) {
  return (
    <div className={styles.block}>
      <Spinner size={28} />
      <span>{label}</span>
    </div>
  );
}

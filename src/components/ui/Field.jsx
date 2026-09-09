import { useId } from 'react';
import clsx from 'clsx';
import styles from './Field.module.css';

export function Field({
  label,
  hint,
  error,
  required,
  disabled,
  children, // render-prop: (props) => node
  className,
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');

  return (
    <div className={clsx(styles.field, disabled && styles.disabled, error && styles.hasError, className)}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.req} aria-hidden="true"> *</span>}
        </label>
      )}
      {children({
        id,
        disabled,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }) {
  return <input className={clsx(styles.input, className)} {...props} />;
}

export function SelectInput({ className, children, ...props }) {
  return (
    <div className={styles.selectWrap}>
      <select className={clsx(styles.input, styles.select, className)} {...props}>
        {children}
      </select>
      <span className={styles.caret} aria-hidden="true">▾</span>
    </div>
  );
}

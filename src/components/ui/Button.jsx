import clsx from 'clsx';
import styles from './Button.module.css';

/**
 * Botón polimórfico.
 * <Button variant="primary" size="lg">…</Button>
 * <Button as={Link} to="/sorteos">…</Button>
 */
export function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <Comp
      className={clsx(
        styles.btn,
        styles[variant],
        styles[size],
        block && styles.block,
        loading && styles.loading,
        className,
      )}
      aria-busy={loading || undefined}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      {...props}
    >
      <span className={styles.label}>{children}</span>
    </Comp>
  );
}

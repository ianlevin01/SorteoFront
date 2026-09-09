import clsx from 'clsx';
import styles from './EmptyState.module.css';

export function EmptyState({ icon, title, children, action, tone = 'default', className }) {
  return (
    <div className={clsx(styles.empty, className)} data-tone={tone}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <p className={styles.title}>{title}</p>}
      {children && <div className={styles.body}>{children}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

import clsx from 'clsx';
import styles from './Container.module.css';

export function Container({ narrow = false, as: Comp = 'div', className, ...props }) {
  return <Comp className={clsx(styles.container, narrow && styles.narrow, className)} {...props} />;
}

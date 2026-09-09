import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { BrandLogo } from '../brand/BrandLogo.jsx';
import styles from './AuthShell.module.css';

export function AuthShell({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className={styles.wrap}>
      <div className={clsx(styles.inner, wide && styles.wide)}>
        <Link to="/" className={styles.logo} aria-label="Inicio">
          <BrandLogo />
        </Link>
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.body}>{children}</div>
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

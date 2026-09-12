import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { BrandLogo } from '../brand/BrandLogo.jsx';
import styles from './Header.module.css';

const NAV = [
  { to: '/sorteos', label: 'Sorteos' },
  { to: '/como-participar', label: 'Cómo participar' },
  { to: '/ganadores', label: 'Ganadores' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  // cerrar el menú al navegar
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // bloquear scroll del body con el menú abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Importadora Precios Bajos — Inicio">
          <BrandLogo size={38} />
        </Link>

        <nav className={styles.navDesktop} aria-label="Principal">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(styles.navLink, isActive && styles.navLinkActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <Button
            as={Link}
            to="/mis-numeros"
            variant="secondary"
            size="sm"
            className={styles.myNumbers}
          >
            <TicketGlyph />
            Mis números
          </Button>

          <div className={styles.account}>
            {isAuthenticated ? (
              <>
                <span className={styles.userName}>{user?.firstName}</span>
                <button type="button" className={styles.linkBtn} onClick={logout}>
                  Salir
                </button>
              </>
            ) : (
              <Link to="/ingresar" className={styles.linkBtn}>
                Ingresar
              </Link>
            )}
          </div>

          <button
            type="button"
            className={styles.burger}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={clsx(styles.burgerBar, open && styles.burgerBarOpen)} />
            <span className={clsx(styles.burgerBar, open && styles.burgerBarOpen)} />
            <span className={clsx(styles.burgerBar, open && styles.burgerBarOpen)} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.scrim}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className={styles.mobileMenu}
              aria-label="Menú"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={styles.mobileLink}>
                  {item.label}
                </NavLink>
              ))}
              <div className={styles.mobileDivider} />
              <NavLink to="/mis-numeros" className={styles.mobileLink}>
                Mis números
              </NavLink>
              {isAuthenticated ? (
                <button type="button" className={styles.mobileLink} onClick={logout}>
                  Salir
                </button>
              ) : (
                <NavLink to="/ingresar" className={styles.mobileLink}>
                  Ingresar
                </NavLink>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function TicketGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M14 5v14" stroke="currentColor" strokeWidth="1.7" strokeDasharray="2 2.5" />
    </svg>
  );
}

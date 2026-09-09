import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Vuelve al tope de la página en cada cambio de ruta. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

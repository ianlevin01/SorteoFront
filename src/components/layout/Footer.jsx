import { Link } from 'react-router-dom';
import { Container } from '../ui/Container.jsx';
import { BrandLogo } from '../brand/BrandLogo.jsx';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.brandCol}>
          <BrandLogo />
          <p className={styles.tagline}>
            Sorteos transparentes. Elegí tus chances, participá y seguí tus números.
          </p>
        </div>

        <nav className={styles.col} aria-label="Sorteos">
          <h3 className={styles.colTitle}>Sorteos</h3>
          <Link to="/sorteos">Sorteos activos</Link>
          <Link to="/ganadores">Ganadores</Link>
          <Link to="/como-participar">Cómo participar</Link>
        </nav>

        <nav className={styles.col} aria-label="Tu cuenta">
          <h3 className={styles.colTitle}>Tu cuenta</h3>
          <Link to="/mis-numeros">Mis números</Link>
          <Link to="/ingresar">Ingresar</Link>
          <Link to="/registro">Registrarme</Link>
        </nav>

        <nav className={styles.col} aria-label="Información">
          <h3 className={styles.colTitle}>Información</h3>
          <Link to="/terminos">Términos y condiciones</Link>
          <Link to="/como-participar#faq">Preguntas frecuentes</Link>
          <a href="mailto:contacto@preciosbajos.com.ar">Contacto</a>
        </nav>
      </Container>

      <Container className={styles.bottom}>
        <span>© {year} Importadora Precios Bajos</span>
        <span className={styles.legal}>Sorteo autorizado. Prohibida su venta a menores de 18 años.</span>
      </Container>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container.jsx';
import { Button } from '../components/ui/Button.jsx';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <Container narrow className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>No encontramos esta página</h1>
      <p className={styles.text}>
        Puede que el enlace esté roto o que el sorteo ya no esté disponible.
      </p>
      <Button as={Link} to="/" size="lg">
        Volver al inicio
      </Button>
    </Container>
  );
}

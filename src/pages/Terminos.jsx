import { PageIntro } from '../components/util/PageIntro.jsx';
import { Container } from '../components/ui/Container.jsx';
import styles from './Terminos.module.css';

export default function Terminos() {
  return (
    <>
      <PageIntro title="Términos y condiciones" tone="plain" narrow>
        Bases y condiciones de los sorteos de Importadora Precios Bajos.
      </PageIntro>
      <Container narrow className={styles.body}>
        <p className={styles.note}>
          Estamos redactando la versión final de las bases y condiciones. Mientras tanto,
          ante cualquier duda escribinos a{' '}
          <a href="mailto:contacto@preciosbajos.com.ar">contacto@preciosbajos.com.ar</a>.
        </p>
      </Container>
    </>
  );
}

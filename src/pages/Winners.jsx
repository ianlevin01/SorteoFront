import { Link } from 'react-router-dom';
import { PageIntro } from '../components/util/PageIntro.jsx';
import { Container } from '../components/ui/Container.jsx';
import { Button } from '../components/ui/Button.jsx';
import { TicketFan } from '../components/tickets/TicketFan.jsx';
import styles from './Winners.module.css';

export default function Winners() {
  return (
    <>
      <PageIntro title="Ganadores">
        Acá vas a encontrar los resultados y las historias de quienes ganan nuestros sorteos.
      </PageIntro>

      <Container narrow className={styles.body}>
        <div className={styles.empty}>
          <TicketFan />
          <h2 className={styles.title}>Todavía no tenemos ganadores para mostrar</h2>
          <p className={styles.text}>
            Cuando se realice el primer sorteo vas a ver acá al ganador o ganadora, con su
            premio, el número ganador y la fecha. Todos los resultados quedan publicados.
          </p>
          <Button as={Link} to="/sorteos" size="lg">
            Ver sorteos activos
          </Button>
        </div>
      </Container>
    </>
  );
}

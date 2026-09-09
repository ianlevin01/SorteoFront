import { useRaffles } from '../hooks/useRaffles.js';
import { RaffleGrid } from '../components/raffles/RaffleGrid.jsx';
import { PageIntro } from '../components/util/PageIntro.jsx';
import { Container } from '../components/ui/Container.jsx';
import styles from './Raffles.module.css';

export default function Raffles() {
  const query = useRaffles({ all: true });

  return (
    <>
      <PageIntro title="Sorteos">
        Todos los sorteos: activos, próximos a sortearse y finalizados.
      </PageIntro>
      <Container className={styles.body}>
        <RaffleGrid
          query={query}
          emptyTitle="Todavía no hay sorteos publicados"
          emptyBody="Volvé pronto: estamos preparando los primeros."
        />
      </Container>
    </>
  );
}

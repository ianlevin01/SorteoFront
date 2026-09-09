import { Link } from 'react-router-dom';
import { useRaffles } from '../hooks/useRaffles.js';
import { RaffleHero } from '../components/raffles/RaffleHero.jsx';
import { RaffleGrid } from '../components/raffles/RaffleGrid.jsx';
import { Section } from '../components/ui/Section.jsx';
import { Container } from '../components/ui/Container.jsx';
import { HowItWorks } from '../components/marketing/HowItWorks.jsx';
import { Button } from '../components/ui/Button.jsx';
import styles from './Home.module.css';

export default function Home() {
  const query = useRaffles();
  const raffles = query.data || [];
  const featured = raffles.find((r) => r.featured) || raffles[0] || null;

  return (
    <>
      {featured && <RaffleHero raffle={featured} />}

      {!query.isLoading && !query.isError && !featured && (
        <section className={styles.introFallback}>
          <Container narrow>
            <h1 className={styles.introTitle}>Sorteos de Importadora Precios Bajos</h1>
            <p className={styles.introText}>
              Elegí tus chances, participá y seguí tus números desde donde estés. Sorteos
              transparentes, con ganadores reales.
            </p>
            <Button as={Link} to="/sorteos" size="lg">
              Ver sorteos
            </Button>
          </Container>
        </section>
      )}

      <Section
        title="Sorteos activos"
        subtitle="Elegí tu premio y participá en minutos."
        action={raffles.length > 3 ? { to: '/sorteos', label: 'Ver todos' } : undefined}
      >
        <RaffleGrid query={query} />
      </Section>

      <Section
        tone="surface"
        title="Cómo participar"
        subtitle="Cuatro pasos simples, sin vueltas."
        action={{ to: '/como-participar', label: 'Más info' }}
      >
        <HowItWorks />
      </Section>

      <Section
        tone="brand"
        title="Ganadores"
        subtitle="Detrás de cada número hay una persona real."
        action={{ to: '/ganadores', label: 'Ver ganadores' }}
      >
        <div className={styles.winnersTeaser}>
          Muy pronto vas a ver acá las fotos de los ganadores y ganadoras.
        </div>
      </Section>
    </>
  );
}

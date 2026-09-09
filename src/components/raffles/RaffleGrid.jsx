import { RaffleCard } from './RaffleCard.jsx';
import { LoadingBlock } from '../ui/Spinner.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import styles from './RaffleGrid.module.css';

export function RaffleGrid({ query, emptyTitle = 'No hay sorteos por ahora', emptyBody }) {
  if (query.isLoading) return <LoadingBlock label="Cargando sorteos…" />;

  if (query.isError) {
    return (
      <EmptyState
        tone="danger"
        title="No pudimos cargar los sorteos"
        icon={<AlertGlyph />}
      >
        {query.error?.message || 'Probá de nuevo en unos minutos.'}
      </EmptyState>
    );
  }

  const raffles = query.data || [];
  if (raffles.length === 0) {
    return (
      <EmptyState title={emptyTitle} icon={<BoxGlyph />}>
        {emptyBody || 'Muy pronto vas a ver acá los sorteos activos.'}
      </EmptyState>
    );
  }

  return (
    <div className={styles.grid}>
      {raffles.map((raffle) => (
        <RaffleCard key={raffle.raffleId} raffle={raffle} />
      ))}
    </div>
  );
}

function AlertGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 2 20h20L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 9v5M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BoxGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 3 8v8l9 5 9-5V8l-9-5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 8l9 5 9-5M12 13v8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

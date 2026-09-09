import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyNumberGroups } from '../hooks/useOrders.js';
import { Container } from '../components/ui/Container.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingBlock } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PrizeImage } from '../components/ui/PrizeImage.jsx';
import { RaffleStateBadge } from '../components/ui/Badge.jsx';
import { TicketFan } from '../components/tickets/TicketFan.jsx';
import { raffleState } from '../hooks/useRaffles.js';
import { formatDate, formatInt } from '../lib/format.js';
import styles from './MyNumbers.module.css';

export default function MyNumbers() {
  const { isAuthenticated, user } = useAuth();
  const groups = useMyNumberGroups();

  if (!isAuthenticated) {
    return (
      <div className={styles.pitch}>
        <Container narrow className={styles.pitchInner}>
          <TicketFan />
          <h1 className={styles.pitchTitle}>Tu billetera de participaciones</h1>
          <p className={styles.pitchText}>
            Acá vas a encontrar todas tus participaciones: tus números en cada sorteo, el
            estado de cada ticket y su código para verificarlo.
          </p>
          <Button as={Link} to="/ingresar?next=/mis-numeros" size="lg">
            Ingresar con mi DNI
          </Button>
          <p className={styles.pitchHint}>
            ¿Todavía no tenés cuenta? <Link to="/registro">Creala en un minuto</Link>
          </p>
        </Container>
      </div>
    );
  }

  return (
    <>
      <div className={styles.intro}>
        <Container>
          <h1 className={styles.title}>Mis números</h1>
          <p className={styles.subtitle}>
            {user?.firstName}, estas son tus participaciones.
          </p>
        </Container>
      </div>

      <Container className={styles.body}>
        {groups.isLoading && <LoadingBlock label="Cargando tus participaciones…" />}

        {groups.isError && (
          <EmptyState tone="danger" title="No pudimos cargar tus participaciones">
            {groups.error?.message}
          </EmptyState>
        )}

        {groups.data?.length === 0 && (
          <EmptyState
            icon={<TicketIcon />}
            title="Todavía no participaste en ningún sorteo"
            action={
              <Button as={Link} to="/sorteos">
                Ver sorteos activos
              </Button>
            }
          >
            Cuando compres tus primeros números los vas a ver acá, como tickets digitales.
          </EmptyState>
        )}

        {groups.data?.length > 0 && (
          <div className={styles.grid}>
            {groups.data.map(({ raffle, counts }) => (
              <Link
                key={raffle.raffleId}
                to={`/mis-numeros/${raffle.raffleId}`}
                className={styles.card}
              >
                <PrizeImage src={raffle.coverImage} alt="" ratio="16/9" className={styles.cardImg} />
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h2 className={styles.cardTitle}>{raffle.title}</h2>
                    <RaffleStateBadge state={raffleState(raffle)} />
                  </div>
                  {raffle.drawDate && (
                    <p className={styles.cardDate}>Se sortea el {formatDate(raffle.drawDate)}</p>
                  )}
                  <div className={styles.cardStats}>
                    <span className={styles.statMain}>{formatInt(counts.total)} números</span>
                    <span className={styles.statBreak}>
                      {counts.confirmed > 0 && (
                        <span className={styles.ok}>{formatInt(counts.confirmed)} confirmados</span>
                      )}
                      {counts.pending > 0 && (
                        <span className={styles.pend}>{formatInt(counts.pending)} pendientes</span>
                      )}
                    </span>
                  </div>
                  <span className={styles.cardCta}>Ver mis tickets →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

function TicketIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
      <path d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 5v14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2.5" />
    </svg>
  );
}

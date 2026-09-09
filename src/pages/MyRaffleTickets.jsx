import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMyRaffleTickets } from '../hooks/useOrders.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Container } from '../components/ui/Container.jsx';
import { LoadingBlock } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { TicketMini } from '../components/tickets/TicketMini.jsx';
import { TicketDetail } from '../components/tickets/TicketDetail.jsx';
import { formatDate, formatInt } from '../lib/format.js';
import styles from './MyRaffleTickets.module.css';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'pending', label: 'Pendientes' },
];

export default function MyRaffleTickets() {
  const { raffleId } = useParams();
  const { isAuthenticated } = useAuth();
  const q = useMyRaffleTickets(raffleId);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all');

  if (!isAuthenticated) {
    return (
      <Container narrow className={styles.pad}>
        <EmptyState
          title="Ingresá para ver tus tickets"
          action={<Button as={Link} to={`/ingresar?next=/mis-numeros/${raffleId}`}>Ingresar</Button>}
        />
      </Container>
    );
  }
  if (q.isLoading) {
    return (
      <Container>
        <LoadingBlock label="Cargando tus tickets…" />
      </Container>
    );
  }
  if (q.isError || !q.data) {
    return (
      <Container narrow className={styles.pad}>
        <EmptyState title="No pudimos cargar tus tickets" action={<Link to="/mis-numeros">Volver</Link>}>
          {q.error?.message}
        </EmptyState>
      </Container>
    );
  }

  const { raffle, tickets } = q.data;
  const counts = tickets.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }),
    {},
  );
  const visible =
    filter === 'all'
      ? tickets
      : tickets.filter((t) => (filter === 'pending' ? t.status !== 'confirmed' : t.status === 'confirmed'));

  return (
    <>
      <div className={styles.intro}>
        <Container>
          <Link to="/mis-numeros" className={styles.back}>
            ← Mis números
          </Link>
          <h1 className={styles.title}>{raffle?.title}</h1>
          <p className={styles.subtitle}>
            {formatInt(tickets.length)} números
            {raffle?.drawDate && ` · se sortea el ${formatDate(raffle.drawDate)}`}
          </p>
          {(counts.pending || counts.in_review) && (
            <p className={styles.pendNote}>
              Tenés {formatInt((counts.pending || 0) + (counts.in_review || 0))} números
              esperando la confirmación del pago.
            </p>
          )}
        </Container>
      </div>

      <Container className={styles.body}>
        {tickets.length === 0 ? (
          <EmptyState title="Todavía no tenés números en este sorteo">
            <Button as={Link} to={`/sorteos/${raffleId}`}>
              Participar
            </Button>
          </EmptyState>
        ) : (
          <>
            <div className={styles.controls}>
              <div className={styles.filters}>
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={filter === f.key ? styles.filterActive : styles.filter}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className={styles.legend}>
                <span><i className={styles.dotOk} /> Confirmado</span>
                <span><i className={styles.dotPend} /> Esperando pago</span>
              </div>
            </div>
            <p className={styles.tapHint}>Tocá un número para ver el ticket y su código.</p>

            <div className={styles.grid}>
              {visible.map((t) => (
                <TicketMini
                  key={t.number}
                  number={t.number}
                  status={t.status}
                  totalNumbers={raffle?.totalNumbers}
                  onClick={() => setOpen(t)}
                />
              ))}
            </div>
          </>
        )}
      </Container>

      <AnimatePresence>
        {open && (
          <TicketDetail ticket={open} raffle={raffle} onClose={() => setOpen(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

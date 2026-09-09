import { useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useRaffle, raffleState } from '../hooks/useRaffles.js';
import { useCreateOrder } from '../hooks/useOrders.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Container } from '../components/ui/Container.jsx';
import { LoadingBlock } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PrizeImage } from '../components/ui/PrizeImage.jsx';
import { Countdown } from '../components/ui/Countdown.jsx';
import { RaffleStateBadge } from '../components/ui/Badge.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { ChanceSelector } from '../components/raffles/ChanceSelector.jsx';
import { HowItWorks } from '../components/marketing/HowItWorks.jsx';
import { formatDate, formatInt } from '../lib/format.js';
import { raffleProgress } from '../hooks/useRaffles.js';
import styles from './RaffleDetail.module.css';

export default function RaffleDetail() {
  const { raffleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: raffle, isLoading, isError, error } = useRaffle(raffleId);
  const createOrder = useCreateOrder();

  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <Container>
        <LoadingBlock label="Cargando sorteo…" />
      </Container>
    );
  }
  if (isError || !raffle) {
    return (
      <Container narrow className={styles.pad}>
        <EmptyState
          icon={<GiftIcon />}
          title="No encontramos este sorteo"
          action={<Link to="/sorteos">Ver todos los sorteos</Link>}
        >
          {error?.message || 'Puede que ya no esté disponible.'}
        </EmptyState>
      </Container>
    );
  }

  const state = raffleState(raffle);
  const gallery = raffle.images?.length ? raffle.images : [raffle.coverImage].filter(Boolean);
  const progress = raffleProgress(raffle);
  const available =
    raffle.totalNumbers != null
      ? Math.max(0, raffle.totalNumbers - (raffle.numbersAssigned || 0))
      : null;

  const onConfirm = async (tier) => {
    if (!isAuthenticated) {
      navigate(`/ingresar?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const { order } = await createOrder.mutateAsync({ raffleId, tierId: tier.id });
      navigate(`/comprar/${order.orderId}`);
    } catch {
      /* el error se muestra abajo */
    }
  };

  return (
    <>
      <div className={styles.top}>
        <Container className={styles.topGrid}>
          <div className={styles.gallery}>
            <PrizeImage
              src={gallery[activeImage]}
              alt={raffle.prizeTitle || raffle.title}
              ratio="4/3"
              className={styles.cover}
            />
            {gallery.length > 1 && (
              <div className={styles.thumbs}>
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    className={i === activeImage ? styles.thumbActive : styles.thumb}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <PrizeImage src={img} alt="" ratio="1/1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <div className={styles.badges}>
              <RaffleStateBadge state={state} />
              {raffle.drawDate && (
                <span className={styles.dateInline}>Se sortea el {formatDate(raffle.drawDate)}</span>
              )}
            </div>
            <h1 className={styles.title}>{raffle.title}</h1>
            {(raffle.prizeDescription || raffle.description) && (
              <p className={styles.lead}>{raffle.prizeDescription || raffle.description}</p>
            )}

            <div className={styles.countdownBox}>
              <span className={styles.countdownLabel}>Tiempo restante</span>
              <Countdown target={raffle.drawDate} />
            </div>

            {available != null && (
              <div className={styles.availBox}>
                <div className={styles.availTop}>
                  <span>
                    <strong>{formatInt(available)}</strong> números disponibles
                  </span>
                  {progress > 0 && <span className={styles.availPct}>{progress}% adquiridos</span>}
                </div>
                {progress > 0 && <ProgressBar value={progress} />}
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className={styles.body}>
        <div className={styles.buyCol}>
          {state === 'active' ? (
            <div className={styles.buyCard}>
              <ChanceSelector
                tiers={raffle.chanceTiers}
                onConfirm={onConfirm}
                busy={createOrder.isPending}
              />
              {createOrder.isError && (
                <p className={styles.buyError}>{createOrder.error?.message}</p>
              )}
            </div>
          ) : (
            <div className={styles.buyCard}>
              <EmptyState
                icon={<GiftIcon />}
                title={
                  state === 'finished'
                    ? 'Este sorteo ya finalizó'
                    : state === 'soldout'
                      ? 'No quedan números'
                      : 'Este sorteo no está recibiendo compras'
                }
              >
                {state === 'finished' && raffle.winner
                  ? `Número ganador: ${raffle.winner.number}`
                  : 'Mirá los demás sorteos activos.'}
              </EmptyState>
            </div>
          )}
        </div>

        <div className={styles.aboutCol}>
          <section className={styles.section}>
            <h2 className={styles.h2}>Qué se sortea</h2>
            <p className={styles.prose}>{raffle.prizeDescription || raffle.description || '—'}</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>Cómo participar</h2>
            <HowItWorks />
          </section>
        </div>
      </Container>
    </>
  );
}

function GiftIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9.5 2 7 4s0 3 5 3M12 7s2.5-5 5-3-.5 3-5 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

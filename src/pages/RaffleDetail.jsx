import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useRaffle, raffleState } from '../hooks/useRaffles.js';
import { useCreateOrder } from '../hooks/useOrders.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Container } from '../components/ui/Container.jsx';
import { LoadingBlock } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PrizeImage } from '../components/ui/PrizeImage.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { ChanceSelector } from '../components/raffles/ChanceSelector.jsx';
import { NumberPicker } from '../components/raffles/NumberPicker.jsx';
import { HowItWorks } from '../components/marketing/HowItWorks.jsx';
import { formatDate, formatDateTime, formatInt, padTicket, daysUntilLabel } from '../lib/format.js';
import { raffleProgress } from '../hooks/useRaffles.js';
import styles from './RaffleDetail.module.css';

const KICKER_LABEL = {
  active: 'Sorteo activo',
  paused: 'Sorteo en pausa',
  finished: 'Sorteo finalizado',
  soldout: 'Números agotados',
  closed: 'Ventas cerradas',
};

export default function RaffleDetail() {
  const { raffleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: raffle, isLoading, isError, error } = useRaffle(raffleId);
  const createOrder = useCreateOrder();

  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);

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
  const isPick = raffle.mode === 'pick';
  const gallery = raffle.images?.length ? raffle.images : [raffle.coverImage].filter(Boolean);
  const progress = raffleProgress(raffle);
  const available =
    !isPick && raffle.totalNumbers != null
      ? Math.max(0, raffle.totalNumbers - (raffle.numbersAssigned || 0))
      : null;
  const hasDescription = Boolean(raffle.prizeDescription || raffle.description);

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

  const onConfirmNumbers = async (numbers) => {
    try {
      const { order } = await createOrder.mutateAsync({ raffleId, numbers });
      navigate(`/comprar/${order.orderId}`);
    } catch {
      // Probablemente alguno de los números elegidos venció justo ahora: la
      // grilla se resincroniza sola para mostrar qué sigue siendo tuyo.
      qc.invalidateQueries({ queryKey: ['raffle-numbers', raffleId] });
    }
  };

  return (
    <>
      <Container className={styles.page}>
        <div className={styles.grid}>
          <div className={styles.media}>
            <button
              type="button"
              className={styles.mainImageBtn}
              onClick={() => gallery[activeImage] && setLightbox(true)}
              aria-label="Ampliar imagen"
            >
              <PrizeImage
                src={gallery[activeImage]}
                alt={raffle.prizeTitle || raffle.title}
                ratio="auto"
                className={styles.cover}
              />
              {gallery[activeImage] && <span className={styles.zoomHint}>⤢ Ampliar</span>}
            </button>
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

          <aside className={styles.buy}>
            <span className={styles.kicker}>{KICKER_LABEL[state] || 'Sorteo'}</span>
            <h1 className={styles.title}>{raffle.title}</h1>
            {(raffle.prizeDescription || raffle.description) && (
              <p className={styles.lead}>{raffle.prizeDescription || raffle.description}</p>
            )}

            {raffle.drawDate && (
              <div className={styles.dateBox}>
                <span className={styles.dateBig}>{formatDate(raffle.drawDate)}</span>
                <span className={styles.dateRelative}>{daysUntilLabel(raffle.drawDate)}</span>
              </div>
            )}

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

            <div className={styles.buyCard}>
              {state === 'active' ? (
                <>
                  {isPick ? (
                    <NumberPicker
                      raffleId={raffleId}
                      totalNumbers={raffle.totalNumbers}
                      pricePerNumber={raffle.pricePerNumber}
                      onConfirm={onConfirmNumbers}
                      busy={createOrder.isPending}
                    />
                  ) : (
                    <ChanceSelector
                      tiers={raffle.chanceTiers}
                      onConfirm={onConfirm}
                      busy={createOrder.isPending}
                    />
                  )}
                  {createOrder.isError && (
                    <p className={styles.buyError}>{createOrder.error?.message}</p>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={raffle.winner ? <TrophyIcon /> : <GiftIcon />}
                  title={
                    raffle.winner
                      ? '¡Ya tenemos ganador!'
                      : state === 'finished'
                        ? 'Este sorteo ya finalizó'
                        : state === 'closed'
                          ? 'Se cerraron las ventas'
                          : state === 'soldout'
                            ? 'No quedan números'
                            : 'Este sorteo no está recibiendo compras'
                  }
                >
                  {raffle.winner
                    ? `🎉 ¡Felicitaciones al número ${padTicket(raffle.winner.number, raffle.totalNumbers)}, ganador de este sorteo!`
                    : state === 'closed' && raffle.closesAt
                      ? `Ya no hay números disponibles: las ventas cerraron. El sorteo se realiza el ${formatDateTime(raffle.closesAt)}.`
                      : 'Mirá los demás sorteos activos.'}
                </EmptyState>
              )}
            </div>
          </aside>

          {hasDescription && (
            <section className={styles.about}>
              <h2 className={styles.h2}>Qué se sortea</h2>
              <p className={styles.prose}>{raffle.prizeDescription || raffle.description}</p>
            </section>
          )}

          <section className={styles.participate}>
            <h2 className={styles.h2}>Cómo participar</h2>
            <HowItWorks />
          </section>
        </div>
      </Container>

      <AnimatePresence>
        {lightbox && (
          <Lightbox src={gallery[activeImage]} alt={raffle.title} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      className={styles.lightbox}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      <motion.img
        src={src}
        alt={alt}
        className={styles.lightboxImg}
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

function TrophyIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4h10v4a5 5 0 0 1-10 0V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9.5 17h5M11 13v3M13 13v3M8 21h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9.5 2 7 4s0 3 5 3M12 7s2.5-5 5-3-.5 3-5 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

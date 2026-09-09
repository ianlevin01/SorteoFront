import { Link } from 'react-router-dom';
import { PrizeImage } from '../ui/PrizeImage.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { RaffleStateBadge } from '../ui/Badge.jsx';
import { raffleState, raffleProgress } from '../../hooks/useRaffles.js';
import { formatMoney, formatDate, chancesLabel } from '../../lib/format.js';
import styles from './RaffleCard.module.css';

export function RaffleCard({ raffle }) {
  const state = raffleState(raffle);
  const progress = raffleProgress(raffle);
  const cheapest = [...(raffle.chanceTiers || [])].sort((a, b) => a.price - b.price)[0];
  const to = `/sorteos/${raffle.raffleId}`;

  return (
    <article className={styles.card}>
      <Link to={to} className={styles.media} aria-label={raffle.title}>
        <PrizeImage src={raffle.coverImage} alt={raffle.prizeTitle || raffle.title} ratio="4/3" />
        <span className={styles.badgeOnMedia}>
          <RaffleStateBadge state={state} />
        </span>
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={to}>{raffle.title}</Link>
        </h3>
        {raffle.description && <p className={styles.desc}>{raffle.description}</p>}

        <div className={styles.meta}>
          {raffle.drawDate && (
            <span className={styles.metaItem}>
              <CalendarGlyph />
              {formatDate(raffle.drawDate)}
            </span>
          )}
          {raffle.totalNumbers != null && progress > 0 && (
            <div className={styles.progress}>
              <ProgressBar value={progress} label={`${progress}% de los números adquiridos`} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.price}>
          {cheapest ? (
            <>
              <span className={styles.priceLabel}>Desde</span>
              <span className={styles.priceValue}>{formatMoney(cheapest.price)}</span>
              <span className={styles.priceHint}>· {chancesLabel(cheapest.chances)}</span>
            </>
          ) : (
            <span className={styles.priceLabel}>Ver opciones</span>
          )}
        </div>
        <Link to={to} className={styles.cta}>
          {state === 'finished' ? 'Ver resultado' : 'Participar'}
        </Link>
      </div>
    </article>
  );
}

function CalendarGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

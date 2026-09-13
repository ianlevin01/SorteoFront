import { Link } from 'react-router-dom';
import { Container } from '../ui/Container.jsx';
import { PrizeImage } from '../ui/PrizeImage.jsx';
import { Button } from '../ui/Button.jsx';
import { Countdown } from '../ui/Countdown.jsx';
import { RaffleStateBadge } from '../ui/Badge.jsx';
import { raffleState } from '../../hooks/useRaffles.js';
import { formatMoney, formatInt, chancesLabel } from '../../lib/format.js';
import styles from './RaffleHero.module.css';

export function RaffleHero({ raffle }) {
  const state = raffleState(raffle);
  const isPick = raffle.mode === 'pick';
  const cheapest = isPick
    ? null
    : [...(raffle.chanceTiers || [])].sort((a, b) => a.price - b.price)[0];
  const to = `/sorteos/${raffle.raffleId}`;
  const available =
    !isPick && raffle.totalNumbers != null
      ? Math.max(0, raffle.totalNumbers - (raffle.numbersAssigned || 0))
      : null;

  return (
    <section className={styles.hero}>
      <Container className={styles.grid}>
        <div className={styles.media}>
          <Link to={to} aria-label={raffle.title}>
            <PrizeImage src={raffle.coverImage} alt={raffle.prizeTitle || raffle.title} ratio="4/3" />
          </Link>
        </div>

        <div className={styles.content}>
          <div className={styles.badges}>
            <span className={styles.kicker}>Sorteo destacado</span>
            <RaffleStateBadge state={state} />
          </div>

          <h1 className={styles.title}>{raffle.title}</h1>
          {raffle.prizeDescription || raffle.description ? (
            <p className={styles.lead}>{raffle.prizeDescription || raffle.description}</p>
          ) : null}

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Sorteo</dt>
              <dd>
                {raffle.drawDate ? (
                  <Countdown target={raffle.drawDate} compact />
                ) : (
                  'Fecha a confirmar'
                )}
              </dd>
            </div>
            {available != null && (
              <div className={styles.fact}>
                <dt>Números disponibles</dt>
                <dd className={styles.factStrong}>{formatInt(available)}</dd>
              </div>
            )}
            {isPick && raffle.totalNumbers != null && (
              <div className={styles.fact}>
                <dt>Elegís tu número</dt>
                <dd className={styles.factStrong}>0 – {formatInt(raffle.totalNumbers - 1)}</dd>
              </div>
            )}
            {isPick && raffle.pricePerNumber ? (
              <div className={styles.fact}>
                <dt>Desde</dt>
                <dd className={styles.factStrong}>
                  {formatMoney(raffle.pricePerNumber)}
                  <span className={styles.factHint}> · por número</span>
                </dd>
              </div>
            ) : (
              cheapest && (
                <div className={styles.fact}>
                  <dt>Desde</dt>
                  <dd className={styles.factStrong}>
                    {formatMoney(cheapest.price)}
                    <span className={styles.factHint}> · {chancesLabel(cheapest.chances)}</span>
                  </dd>
                </div>
              )
            )}
          </dl>

          <div className={styles.actions}>
            <Button as={Link} to={to} size="lg">
              {state === 'finished' ? 'Ver resultado' : 'Participar ahora'}
            </Button>
            <Link to="/como-participar" className={styles.secondaryLink}>
              Cómo participar
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

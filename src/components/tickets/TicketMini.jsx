import clsx from 'clsx';
import { padTicket } from '../../lib/format.js';
import styles from './TicketMini.module.css';

const STATUS_TONE = {
  confirmed: styles.confirmed,
  pending: styles.pending,
  in_review: styles.review,
  void: styles.void,
};

/** Ticket compacto para grillas / revelado. */
export function TicketMini({ number, status = 'pending', totalNumbers, raffleTitle, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      className={clsx(styles.ticket, STATUS_TONE[status], onClick && styles.clickable)}
      onClick={onClick}
    >
      <span className={styles.perforation} aria-hidden="true" />
      <span className={styles.label}>Número</span>
      <span className={styles.number}>{padTicket(number, totalNumbers)}</span>
      {raffleTitle && <span className={styles.raffle}>{raffleTitle}</span>}
      <span className={styles.dot} aria-hidden="true" />
    </Comp>
  );
}

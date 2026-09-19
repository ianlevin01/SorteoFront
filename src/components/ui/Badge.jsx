import clsx from 'clsx';
import styles from './Badge.module.css';

/** tone: neutral | brand | success | warning | danger | accent */
export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={clsx(styles.badge, styles[tone], className)}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

const RAFFLE_STATE = {
  active: { tone: 'success', label: 'Activo', dot: true },
  upcoming: { tone: 'brand', label: 'Próximamente' },
  soldout: { tone: 'warning', label: 'Agotado' },
  closed: { tone: 'warning', label: 'Ventas cerradas' },
  finished: { tone: 'neutral', label: 'Finalizado' },
  paused: { tone: 'neutral', label: 'En pausa' },
  draft: { tone: 'neutral', label: 'Borrador' },
};

export function RaffleStateBadge({ state }) {
  const cfg = RAFFLE_STATE[state] || RAFFLE_STATE.finished;
  return (
    <Badge tone={cfg.tone} dot={cfg.dot}>
      {cfg.label}
    </Badge>
  );
}

const TICKET_STATUS = {
  confirmed: { tone: 'success', label: 'Confirmado' },
  pending: { tone: 'warning', label: 'Pago pendiente' },
  in_review: { tone: 'brand', label: 'En revisión' },
  rejected: { tone: 'danger', label: 'Rechazado' },
  void: { tone: 'danger', label: 'Anulado' },
};

export function TicketStatusBadge({ status }) {
  const cfg = TICKET_STATUS[status] || TICKET_STATUS.pending;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

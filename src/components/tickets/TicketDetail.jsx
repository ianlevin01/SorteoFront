import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { TicketStatusBadge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { padTicket, formatDate } from '../../lib/format.js';
import styles from './TicketDetail.module.css';

const PAY_CTA = {
  pending: 'Subir comprobante',
  in_review: 'Ver estado del pago',
  rejected: 'Ver qué pasó y reintentar',
};

export function TicketDetail({ ticket, raffle, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const hasCode = Boolean(ticket.verificationCode);
  const verifyUrl = hasCode ? `${window.location.origin}/verificar/${ticket.verificationCode}` : null;

  return (
    <motion.div
      className={styles.scrim}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.ticket}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        role="dialog"
        aria-label={`Ticket número ${ticket.number}`}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className={styles.stub}>
          <span className={styles.stubText}>PARTICIPACIÓN</span>
        </div>

        <div className={styles.main}>
          <p className={styles.raffle}>{raffle?.title || 'Sorteo'}</p>
          <span className={styles.numLabel}>Número</span>
          <p className={styles.number}>{padTicket(ticket.number, raffle?.totalNumbers)}</p>

          <div className={styles.statusRow}>
            <TicketStatusBadge status={ticket.status} />
          </div>

          <dl className={styles.meta}>
            {raffle?.drawDate && (
              <div>
                <dt>Sorteo</dt>
                <dd>{formatDate(raffle.drawDate)}</dd>
              </div>
            )}
            {hasCode && (
              <div>
                <dt>Código</dt>
                <dd className={styles.code}>{ticket.verificationCode}</dd>
              </div>
            )}
          </dl>

          {hasCode ? (
            <div className={styles.qrRow}>
              <div className={styles.qr}>
                <QRCodeSVG value={verifyUrl} size={96} bgColor="transparent" fgColor="#16233b" />
              </div>
              <p className={styles.qrText}>
                Escaneá para verificar esta participación, o entrá a{' '}
                <Link to={`/verificar/${ticket.verificationCode}`}>verificar ticket</Link>.
              </p>
            </div>
          ) : (
            <p className={styles.qrText}>Este número ya no tiene un código de verificación vigente.</p>
          )}

          {ticket.orderId && PAY_CTA[ticket.status] && (
            <Button as={Link} to={`/comprar/${ticket.orderId}`} size="lg" block className={styles.payCta}>
              {PAY_CTA[ticket.status]}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

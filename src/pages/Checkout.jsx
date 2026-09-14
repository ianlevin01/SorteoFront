import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useMyOrder,
  usePaymentInfo,
  useUploadReceipt,
  useRequestReview,
} from '../hooks/useOrders.js';
import { useRaffle } from '../hooks/useRaffles.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Container } from '../components/ui/Container.jsx';
import { LoadingBlock, Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PrizeImage } from '../components/ui/PrizeImage.jsx';
import { TicketReveal } from '../components/tickets/TicketReveal.jsx';
import { CopyField } from '../components/ui/CopyField.jsx';
import { formatMoney, formatInt } from '../lib/format.js';
import styles from './Checkout.module.css';

// El shape de `order.numbers` depende del modo del sorteo: correlativo
// ({start, end, count}) o "elegí tu número" ({list, count}).
const orderNumbers = (n) => {
  if (!n) return [];
  if (Array.isArray(n.list)) return n.list;
  return Array.from({ length: n.count }, (_, i) => n.start + i);
};

const formatNumbersSummary = (n, max = 10) => {
  const list = orderNumbers(n);
  if (!list.length) return '';
  if (!Array.isArray(n.list)) return `(${n.start}–${n.end})`;
  if (list.length <= max) return `(${list.join(', ')})`;
  return `(${list.slice(0, max).join(', ')}, +${list.length - max})`;
};

export default function Checkout() {
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const order = useMyOrder(orderId);
  const payment = usePaymentInfo();
  const raffle = useRaffle(order.data?.raffleId);
  const upload = useUploadReceipt();
  const review = useRequestReview();

  const [file, setFile] = useState(null);

  const o = upload.data && upload.data.orderId === orderId ? upload.data : order.data;
  const numbers = useMemo(() => orderNumbers(o?.numbers), [o]);
  const countdown = useCountdown(
    o?.mode === 'pick' && o?.status === 'pending_payment' ? o.reservedUntil : null,
  );

  if (!isAuthenticated) {
    return (
      <Container narrow className={styles.pad}>
        <EmptyState
          title="Ingresá para ver tu compra"
          action={<Button as={Link} to={`/ingresar?next=/comprar/${orderId}`}>Ingresar</Button>}
        />
      </Container>
    );
  }
  if (order.isLoading) {
    return (
      <Container>
        <LoadingBlock label="Cargando tu compra…" />
      </Container>
    );
  }
  if (order.isError || !o) {
    return (
      <Container narrow className={styles.pad}>
        <EmptyState title="No encontramos esta compra" action={<Link to="/sorteos">Ver sorteos</Link>}>
          {order.error?.message}
        </EmptyState>
      </Container>
    );
  }

  // ---- Verificando (mientras corre la subida + comprobación) ----
  if (upload.isPending) {
    return (
      <Container narrow className={styles.centerWrap}>
        <Verifying />
      </Container>
    );
  }

  // ---- Aprobada: celebración + revelado ----
  if (o.status === 'approved') {
    return (
      <Container narrow className={styles.doneWrap}>
        <Celebration
          title="¡Tu participación está confirmada!"
          text={
            <>
              Verificamos tu transferencia. Estos son tus{' '}
              <strong>{formatInt(o.chances)} números</strong> para <strong>{o.raffleTitle}</strong>.
            </>
          }
        />
        <div className={styles.revealCard}>
          <TicketReveal numbers={numbers} status="confirmed" totalNumbers={raffle.data?.totalNumbers} />
        </div>
        <DoneActions raffleId={o.raffleId} />
      </Container>
    );
  }

  // ---- En revisión manual ----
  if (o.status === 'receipt_submitted') {
    return (
      <Container narrow className={styles.doneWrap}>
        <div className={styles.reviewHead}>
          <span className={styles.clock}>⏳</span>
          <h1 className={styles.doneTitle}>Estamos revisando tu comprobante</h1>
          <p className={styles.doneText}>
            {o.verification?.reviewRequested
              ? 'Recibimos tu pedido de revisión. Te confirmamos apenas lo verifiquemos.'
              : 'Recibimos tu comprobante y lo estamos verificando. Te avisamos apenas esté listo.'}{' '}
            Tus <strong>{formatInt(o.chances)} números</strong> ya están reservados.
          </p>
        </div>
        <div className={styles.revealCard}>
          <TicketReveal numbers={numbers} status="in_review" totalNumbers={raffle.data?.totalNumbers} />
        </div>
        <DoneActions raffleId={o.raffleId} />
      </Container>
    );
  }

  // ---- Rechazada: mostramos el detalle y opciones ----
  if (o.status === 'receipt_rejected') {
    return (
      <Container narrow className={styles.doneWrap}>
        <div className={styles.rejectHead}>
          <span className={styles.warn}>!</span>
          <h1 className={styles.doneTitle}>No pudimos confirmar tu transferencia</h1>
          <p className={styles.doneText}>
            Revisá lo que encontramos. Podés subir otro comprobante o pedir que lo revise una
            persona.
          </p>
        </div>

        <Checklist checks={o.verification?.checks} issues={o.verification?.issues} />

        <div className={styles.rejectActions}>
          <UploadForm
            file={file}
            setFile={setFile}
            onSubmit={() => upload.mutate({ orderId, file })}
            error={upload.error?.message}
            label="Subir otro comprobante"
          />
          <div className={styles.orReview}>
            {o.canRequestReview ? (
              <>
                <span>¿Estás seguro de que la transferencia está bien?</span>
                <Button
                  variant="secondary"
                  onClick={() => !review.isPending && !review.isSuccess && review.mutate({ orderId })}
                  loading={review.isPending}
                  disabled={review.isPending || review.isSuccess}
                >
                  Pedir revisión
                </Button>
                {review.isError && !review.isSuccess && (
                  <p className={styles.error}>
                    Ya se había registrado tu pedido de revisión — no hace falta tocar de nuevo.
                  </p>
                )}
              </>
            ) : (
              <span>Ya pediste una revisión. Te vamos a responder pronto.</span>
            )}
          </div>
        </div>
      </Container>
    );
  }

  // ---- Vencida (solo "elegí tu número"): no se pagó a tiempo, número liberado ----
  if (o.status === 'expired') {
    return (
      <Container narrow className={styles.doneWrap}>
        <div className={styles.rejectHead}>
          <span className={styles.warn}>!</span>
          <h1 className={styles.doneTitle}>Se venció el tiempo para pagar</h1>
          <p className={styles.doneText}>
            Pasaron los 10 minutos para transferir y tu número volvió a estar disponible para
            cualquiera. Podés elegir de nuevo cuando quieras.
          </p>
        </div>
        <div className={styles.doneActions}>
          <Button as={Link} to={`/sorteos/${o.raffleId}`} size="lg">
            Elegir un número de nuevo
          </Button>
          <Link to="/sorteos" className={styles.secondary}>
            Ver otros sorteos
          </Link>
        </div>
      </Container>
    );
  }

  // ---- Pago (estado inicial) ----
  const p = payment.data || {};
  return (
    <Container narrow className={styles.payWrap}>
      <div className={styles.summary}>
        <PrizeImage src={raffle.data?.coverImage} alt="" ratio="1/1" className={styles.summaryImg} />
        <div>
          <p className={styles.summaryRaffle}>{o.raffleTitle}</p>
          <p className={styles.summaryChances}>{formatInt(o.chances)} números</p>
        </div>
        <p className={styles.summaryTotal}>{formatMoney(o.amount)}</p>
      </div>

      <div className={styles.warnBox}>
        <strong>Importante:</strong> transferí desde una cuenta bancaria o billetera{' '}
        <strong>a tu nombre</strong> (el mismo DNI con el que te registraste). Si la
        transferencia sale de la cuenta de otra persona, no vamos a poder confirmarla y tu
        compra va a quedar demorada.
      </div>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.stepNum}>1</span>
            <h2 className={styles.stepTitle}>Transferí el monto exacto</h2>
          </div>
          <div className={styles.transferBox}>
            <CopyField label="Alias" value={p.alias || '—'} />
            <CopyField label="CBU / CVU" value={p.cbu || '—'} />
            <div className={styles.transferRow}>
              <span>Titular</span>
              <strong>{p.holder || '—'}</strong>
            </div>
            {p.bank && (
              <div className={styles.transferRow}>
                <span>Banco</span>
                <strong>{p.bank}</strong>
              </div>
            )}
            <div className={styles.transferRow}>
              <span>Monto</span>
              <strong className={styles.amount}>{formatMoney(o.amount)}</strong>
            </div>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.stepNum}>2</span>
            <h2 className={styles.stepTitle}>Subí el comprobante</h2>
          </div>
          <UploadForm
            file={file}
            setFile={setFile}
            onSubmit={() => upload.mutate({ orderId, file })}
            error={upload.error?.message}
            label="Ya transferí, enviar comprobante"
          />
        </li>
      </ol>

      <p className={styles.reserved}>
        {o.mode === 'pick' ? (
          <>
            Tu selección {formatNumbersSummary(o.numbers)} ya está <strong>reservada</strong>.
          </>
        ) : (
          <>
            Tus {formatInt(o.chances)} números ({o.numbers.start}–{o.numbers.end}) ya están{' '}
            <strong>reservados</strong>. Se activan cuando confirmemos el pago.
          </>
        )}
      </p>
      {o.mode === 'pick' && countdown && !countdown.finished && (
        <p className={styles.reserved}>
          Tenés{' '}
          <strong>
            {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </strong>{' '}
          para transferir y subir el comprobante antes de perder{o.chances > 1 ? 'los' : 'lo'}.
        </p>
      )}
    </Container>
  );
}

function UploadForm({ file, setFile, onSubmit, error, label }) {
  return (
    <form
      className={styles.uploadForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (file) onSubmit();
      }}
    >
      <label className={styles.dropzone} data-has-file={Boolean(file) || undefined}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className={styles.fileInput}
        />
        <span className={styles.dropIcon}>{file ? '📄' : '⬆'}</span>
        <span className={styles.dropText}>
          {file ? file.name : 'Tocá para elegir una foto o PDF del comprobante'}
        </span>
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" size="lg" block disabled={!file}>
        {label}
      </Button>
    </form>
  );
}

const VERIFYING_STEPS = ['Recibimos tu comprobante', 'Verificando la transferencia', 'Casi listo'];

function Verifying() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => Math.min(VERIFYING_STEPS.length - 1, v + 1)), 3500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.verifying}>
      <Spinner size={40} />
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          className={styles.verifyingText}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {VERIFYING_STEPS[i]}…
        </motion.p>
      </AnimatePresence>
      <p className={styles.verifyingHint}>Puede tardar unos segundos. No cierres esta pantalla.</p>
    </div>
  );
}

function Celebration({ title, text }) {
  return (
    <motion.div
      className={styles.doneHead}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        className={styles.check}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
      >
        ✓
      </motion.span>
      <h1 className={styles.doneTitle}>{title}</h1>
      <p className={styles.doneText}>{text}</p>
    </motion.div>
  );
}

function Checklist({ checks = [], issues = [] }) {
  if (!checks.length) {
    return (
      <div className={styles.checklist}>
        {issues.map((msg) => (
          <p key={msg} className={styles.issueLine}>
            {msg}
          </p>
        ))}
      </div>
    );
  }
  return (
    <ul className={styles.checklist}>
      {checks.map((c) => (
        <li key={c.key} className={c.pass ? styles.checkOk : styles.checkBad}>
          <span className={styles.checkIcon}>{c.pass ? '✓' : '✕'}</span>
          <span>
            <strong>{c.label}.</strong> {c.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DoneActions({ raffleId }) {
  return (
    <div className={styles.doneActions}>
      <Button as={Link} to={`/mis-numeros/${raffleId}`} size="lg">
        Ver mis tickets
      </Button>
      <Link to="/sorteos" className={styles.secondary}>
        Ver otros sorteos
      </Link>
    </div>
  );
}

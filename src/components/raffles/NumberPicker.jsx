import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCountdown } from '../../hooks/useCountdown.js';
import {
  useNumberAvailability,
  useMySelection,
  useReserveNumber,
  useReleaseNumber,
} from '../../hooks/usePickNumbers.js';
import { formatMoney } from '../../lib/format.js';
import styles from './NumberPicker.module.css';

const PAGE_SIZE = 100;

const pad = (n, totalNumbers) => String(n).padStart(String(totalNumbers - 1).length, '0');

export function NumberPicker({ raffleId, totalNumbers, pricePerNumber, onConfirm, busy = false }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [jump, setJump] = useState('');
  const [pendingNumber, setPendingNumber] = useState(null);
  const [notice, setNotice] = useState('');

  const pageCount = Math.max(1, Math.ceil(totalNumbers / PAGE_SIZE));
  const from = page * PAGE_SIZE;
  const to = Math.min(totalNumbers - 1, from + PAGE_SIZE - 1);

  const avail = useNumberAvailability(raffleId, from, to);
  const mine = useMySelection(raffleId);
  const reserve = useReserveNumber(raffleId);
  const release = useReleaseNumber(raffleId);

  const selected = mine.data || [];
  const selectedNumbers = new Set(selected.map((s) => s.number));
  const soonest = selected.length
    ? selected.reduce((min, s) => (s.reservedUntil < min ? s.reservedUntil : min), selected[0].reservedUntil)
    : null;
  const countdown = useCountdown(soonest);

  const hadSelection = useRef(false);
  useEffect(() => {
    if (selected.length) hadSelection.current = true;
  }, [selected.length]);

  useEffect(() => {
    if (countdown?.finished && hadSelection.current) {
      hadSelection.current = false;
      setNotice('Se venció el tiempo para pagar y tus números quedaron libres. Elegí de nuevo.');
      mine.refetch();
      qc.invalidateQueries({ queryKey: ['raffle-numbers', raffleId] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown?.finished]);

  const unavailable = new Set(avail.data?.unavailable || []);

  const toggle = (n) => {
    if (busy || pendingNumber != null) return;
    if (!isAuthenticated) {
      navigate(`/ingresar?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setNotice('');
    setPendingNumber(n);
    if (selectedNumbers.has(n)) {
      release.mutate(n, { onSettled: () => setPendingNumber(null) });
    } else if (!unavailable.has(n)) {
      reserve.mutate(n, {
        onSettled: () => setPendingNumber(null),
        onError: (err) => {
          setNotice(err.message || 'Ese número ya no está disponible.');
          avail.refetch();
        },
      });
    } else {
      setPendingNumber(null);
    }
  };

  const goToNumber = (raw) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n >= totalNumbers) return;
    setPage(Math.floor(n / PAGE_SIZE));
  };

  const total = selected.length * (pricePerNumber || 0);
  const digits = String(totalNumbers - 1).length;
  const cells = [];
  for (let n = from; n <= to; n += 1) cells.push(n);

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Elegí tus números</p>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ‹
        </button>
        <span className={styles.navRange}>
          {pad(from, totalNumbers)}–{pad(to, totalNumbers)}
          <span className={styles.navMuted}> de {totalNumbers}</span>
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={page >= pageCount - 1}
        >
          ›
        </button>
        <form
          className={styles.jump}
          onSubmit={(e) => {
            e.preventDefault();
            goToNumber(jump);
            setJump('');
          }}
        >
          <input
            type="number"
            min="0"
            max={totalNumbers - 1}
            inputMode="numeric"
            placeholder="Ir al número"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            className={styles.jumpInput}
          />
        </form>
      </div>

      <div className={styles.gridWrap} aria-busy={avail.isLoading || undefined}>
        <div className={styles.grid}>
          {cells.map((n) => {
            const isMine = selectedNumbers.has(n);
            const isTaken = !isMine && unavailable.has(n);
            const isLoading = pendingNumber === n;
            return (
              <button
                key={n}
                type="button"
                className={clsx(
                  styles.cell,
                  isMine && styles.mine,
                  isTaken && styles.taken,
                  isLoading && styles.cellLoading,
                )}
                disabled={busy || isTaken || isLoading}
                onClick={() => toggle(n)}
                aria-pressed={isMine}
                title={isTaken ? 'No disponible' : isMine ? 'Tocá para quitar' : 'Tocá para elegir'}
              >
                {isLoading ? <Spinner size={14} /> : pad(n, totalNumbers)}
              </button>
            );
          })}
        </div>
        {avail.isLoading && !avail.data && (
          <div className={styles.gridOverlay}>
            <Spinner size={22} />
          </div>
        )}
      </div>

      <div className={styles.legend}>
        <span><i className={clsx(styles.dot, styles.dotFree)} /> Libre</span>
        <span><i className={clsx(styles.dot, styles.dotMine)} /> Elegido por vos</span>
        <span><i className={clsx(styles.dot, styles.dotTaken)} /> No disponible</span>
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}

      {selected.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.chips}>
            {selected
              .slice()
              .sort((a, b) => a.number - b.number)
              .map((s) => (
                <span key={s.number} className={styles.chip}>
                  {pad(s.number, totalNumbers)}
                  <button
                    type="button"
                    onClick={() => toggle(s.number)}
                    aria-label={`Quitar número ${s.number}`}
                    disabled={busy}
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
          <div className={styles.summaryLine}>
            <span>{selected.length} {selected.length === 1 ? 'número' : 'números'}</span>
            <span className={styles.total}>{formatMoney(total)}</span>
          </div>
          {countdown && !countdown.finished && (
            <p className={styles.timer}>
              Tenés {String(countdown.minutes).padStart(2, '0')}:
              {String(countdown.seconds).padStart(2, '0')} para pagar antes de perder estos números
            </p>
          )}
        </div>
      )}

      <Button
        size="xl"
        block
        loading={busy}
        disabled={!selected.length || busy}
        onClick={() => onConfirm(selected.map((s) => s.number))}
      >
        Continuar
      </Button>

      <p className={styles.note}>
        Tocá los números que quieras. Cada uno se reserva 30 minutos para que puedas pagarlo sin
        que te lo saquen.
      </p>
    </div>
  );
}

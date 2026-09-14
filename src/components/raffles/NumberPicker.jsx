import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
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
  useReserveRandomNumbers,
} from '../../hooks/usePickNumbers.js';
import { formatMoney, numbersLabel } from '../../lib/format.js';
import styles from './NumberPicker.module.css';

const PAGE_SIZE = 100;
const RANDOM_OPTIONS = [1, 2, 3, 5, 10, 20];

const pad = (n, totalNumbers) => String(n).padStart(String(totalNumbers - 1).length, '0');

export function NumberPicker({ raffleId, totalNumbers, pricePerNumber, onConfirm, busy = false }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [randomCount, setRandomCount] = useState(1);
  const [pendingNumber, setPendingNumber] = useState(null);
  const [notice, setNotice] = useState('');

  const pageCount = Math.max(1, Math.ceil(totalNumbers / PAGE_SIZE));
  const from = page * PAGE_SIZE;
  const to = Math.min(totalNumbers - 1, from + PAGE_SIZE - 1);

  const avail = useNumberAvailability(raffleId, from, to);
  const mine = useMySelection(raffleId);
  const reserve = useReserveNumber(raffleId);
  const release = useReleaseNumber(raffleId);
  const randomPick = useReserveRandomNumbers(raffleId);

  const selected = mine.data || [];
  const sortedSelected = selected.slice().sort((a, b) => a.number - b.number);
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
  const requireAuthOr = (fn) => {
    if (!isAuthenticated) {
      navigate(`/ingresar?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    fn();
  };

  const toggle = (n) => {
    if (busy || pendingNumber != null) return;
    requireAuthOr(() => {
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
    });
  };

  const goToNumber = (raw) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n >= totalNumbers) return false;
    setPage(Math.floor(n / PAGE_SIZE));
    return true;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (goToNumber(search)) setNotice('');
    else if (search.trim()) setNotice(`Ingresá un número entre 0 y ${totalNumbers - 1}.`);
  };

  const handleRandom = () => {
    if (busy || randomPick.isPending) return;
    requireAuthOr(() => {
      setNotice('');
      randomPick.mutate(randomCount, {
        onSuccess: (data) => {
          if (data.reserved.length < data.requested) {
            setNotice(
              `Conseguimos ${data.reserved.length} de ${data.requested} números al azar — quedan pocos libres.`,
            );
          }
        },
        onError: (err) => setNotice(err.message || 'No pudimos elegir números al azar.'),
      });
    });
  };

  const total = selected.length * (pricePerNumber || 0);
  const cells = [];
  for (let n = from; n <= to; n += 1) cells.push(n);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <p className={styles.label}>Elegí tus números</p>
        <p className={styles.subtitle}>
          Seleccioná uno o más números disponibles para participar del sorteo.
        </p>
      </div>

      <div className={styles.quickRow}>
        <div className={styles.randomPick}>
          <select
            className={styles.randomSelect}
            value={randomCount}
            onChange={(e) => setRandomCount(Number(e.target.value))}
            aria-label="Cantidad de números al azar"
          >
            {RANDOM_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            loading={randomPick.isPending}
            disabled={busy}
            onClick={handleRandom}
            className={styles.randomBtn}
          >
            🎲 Elegir al azar
          </Button>
        </div>

        <form className={styles.search} onSubmit={handleSearch}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="number"
            min="0"
            max={totalNumbers - 1}
            inputMode="numeric"
            placeholder="¿Qué número buscás?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn} aria-label="Buscar número">
            →
          </button>
        </form>
      </div>

      <div className={styles.nav}>
        <div className={styles.navHead}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Página anterior"
          >
            ‹
          </button>
          <span className={styles.navRange}>
            Números {pad(from, totalNumbers)}–{pad(to, totalNumbers)}
          </span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            aria-label="Página siguiente"
          >
            ›
          </button>
        </div>
        {pageCount > 1 && (
          <span className={styles.navPage}>
            Página {page + 1} de {pageCount}
          </span>
        )}
      </div>

      <div className={styles.legend}>
        <span className={clsx(styles.legendItem, styles.legendFree)}>
          <i className={styles.legendDot} /> Libre
        </span>
        <span className={clsx(styles.legendItem, styles.legendMine)}>
          <i className={styles.legendDot} /> Elegido por vos
        </span>
        <span className={clsx(styles.legendItem, styles.legendTaken)}>
          <i className={styles.legendDot} /> No disponible
        </span>
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

      {notice && <p className={styles.notice}>{notice}</p>}

      {selected.length > 0 && (
        <div className={styles.summary}>
          <p className={styles.summaryTitle}>Tu selección</p>
          <div className={styles.chips}>
            <AnimatePresence initial={false}>
              {sortedSelected.map((s) => (
                <motion.span
                  key={s.number}
                  className={styles.chip}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                >
                  {pad(s.number, totalNumbers)}
                  <button
                    type="button"
                    onClick={() => toggle(s.number)}
                    aria-label={`Quitar número ${s.number}`}
                    disabled={busy}
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className={styles.summaryLine}>
            <span>{numbersLabel(selected.length)}</span>
            <span className={styles.total}>{formatMoney(total)}</span>
          </div>
          <div className={styles.summaryMeta}>
            <span>Reservado durante 30:00</span>
            {countdown && !countdown.finished && (
              <span className={styles.timer}>
                Tu reserva vence en {String(countdown.minutes).padStart(2, '0')}:
                {String(countdown.seconds).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      )}

      <Button
        size="xl"
        block
        loading={busy}
        disabled={!selected.length || busy}
        onClick={() => onConfirm(selected.map((s) => s.number))}
      >
        {selected.length ? `Continuar con ${numbersLabel(selected.length)} · ${formatMoney(total)}` : 'Continuar'}
      </Button>

      <ul className={styles.trust}>
        <li>
          <CheckIcon /> Números únicos
        </li>
        <li>
          <CheckIcon /> Participación verificable
        </li>
        <li>
          <CheckIcon /> Resultado publicado
        </li>
      </ul>

      {selected.length > 0 && (
        <div className={styles.mobileBar}>
          <div className={styles.mobileBarInfo}>
            <span className={styles.mobileBarCount}>{numbersLabel(selected.length)}</span>
            <span className={styles.mobileBarPrice}>{formatMoney(total)}</span>
          </div>
          <Button
            size="lg"
            loading={busy}
            disabled={busy}
            onClick={() => onConfirm(selected.map((s) => s.number))}
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}

function SearchIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { maskBirthDate, parseBirthDate } from '../../lib/birthDate.js';
import styles from './BirthDateField.module.css';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/**
 * Fecha de nacimiento: un solo campo de texto "DD/MM/AAAA" (siempre en ESE
 * orden, tipiando solo números — las barras se insertan solas) más un
 * botoncito de calendario que abre un selector propio.
 *
 * A propósito NO es un <input type="date">: ese input nativo muestra/
 * interpreta día y mes en el orden que tenga configurado el SISTEMA del
 * celular o navegador de quien lo usa (no el idioma del sitio) — alguien
 * con el teléfono en inglés que escribe "19" pensando en el día puede
 * terminar escribiéndolo sin querer en el campo de MES, que lo rechaza
 * (no hay mes 19) y deja el valor vacío sin ningún aviso de por qué. Acá
 * el orden día/mes/año es siempre el mismo, lo arma este componente, no el
 * dispositivo.
 */
export function BirthDateField({ value, onChange, id, className, ...ariaProps }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null); // 0-indexado
  const wrapRef = useRef(null);

  const openPicker = () => {
    const parsed = parseBirthDate(value);
    const fallback = new Date();
    setViewYear(parsed?.y ?? fallback.getFullYear() - 30);
    setViewMonth(parsed ? parsed.mo - 1 : fallback.getMonth());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = parseBirthDate(value);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  const daysInMonth = viewYear != null ? new Date(viewYear, viewMonth + 1, 0).getDate() : 0;
  const firstWeekday = viewYear != null ? new Date(viewYear, viewMonth, 1).getDay() : 0;
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const pickDay = (day) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(viewMonth + 1).padStart(2, '0');
    onChange(`${dd}/${mm}/${viewYear}`);
    setOpen(false);
  };

  return (
    <div className={clsx(styles.wrap, className)} ref={wrapRef}>
      <input
        id={id}
        {...ariaProps}
        className={styles.input}
        value={value}
        onChange={(e) => {
          onChange(maskBirthDate(e.target.value));
          setOpen(false);
        }}
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        autoComplete="bday"
      />
      <button
        type="button"
        className={styles.calendarBtn}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-label="Elegir fecha de nacimiento con el calendario"
      >
        <CalendarIcon />
      </button>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Elegir fecha de nacimiento">
          <div className={styles.popoverHead}>
            <select
              className={styles.headSelect}
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              aria-label="Mes"
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className={styles.headSelect}
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              aria-label="Año"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={i} className={styles.weekday}>
                {w}
              </span>
            ))}
          </div>
          <div className={styles.daysGrid}>
            {cells.map((day, i) =>
              day == null ? (
                // eslint-disable-next-line react/no-array-index-key
                <span key={i} />
              ) : (
                <button
                  key={day}
                  type="button"
                  className={clsx(
                    styles.day,
                    selected &&
                      selected.d === day &&
                      selected.mo === viewMonth + 1 &&
                      selected.y === viewYear &&
                      styles.daySelected,
                  )}
                  onClick={() => pickDay(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

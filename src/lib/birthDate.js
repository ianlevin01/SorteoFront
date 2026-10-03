/** Deja solo dígitos y arma "DD/MM/AAAA" a medida que se tipea. */
export function maskBirthDate(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `/${digits.slice(4, 8)}`;
  return out;
}

/** "DD/MM/AAAA" -> { d, mo, y } si es una fecha completa y válida, si no null. */
export function parseBirthDate(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return { d, mo, y };
}

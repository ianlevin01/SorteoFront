import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell } from '../components/auth/AuthShell.jsx';
import { Field, TextInput, SelectInput } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PROVINCES, onlyDigits } from '../lib/argentina.js';
import styles from './Register.module.css';

const EMPTY = {
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  whatsapp: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
};

function ageFrom(ddmmyyyy) {
  const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  const birth = new Date(Date.UTC(y, mo - 1, d));
  if (birth.getUTCDate() !== d || birth.getUTCMonth() !== mo - 1) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age -= 1;
  return age;
}

function validate(form) {
  const e = {};
  if (form.firstName.trim().length < 2) e.firstName = 'Ingresá tu nombre';
  if (form.lastName.trim().length < 2) e.lastName = 'Ingresá tu apellido';
  const age = ageFrom(form.birthDate);
  if (age === null) e.birthDate = 'Fecha inválida. Usá DD/MM/AAAA';
  else if (age < 18) e.birthDate = 'Debés ser mayor de 18 años para participar';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email inválido';
  if (!/^\d{8,15}$/.test(onlyDigits(form.whatsapp))) e.whatsapp = 'Número inválido (con código de país)';
  if (form.address.trim().length < 3) e.address = 'Ingresá tu dirección';
  if (form.city.trim().length < 2) e.city = 'Ingresá tu localidad';
  if (!PROVINCES.includes(form.province)) e.province = 'Elegí una provincia';
  if (!/^([A-Za-z]\d{4}[A-Za-z]{3}|\d{4})$/.test(form.postalCode.trim())) e.postalCode = 'Código postal inválido';
  return e;
}

export default function Register() {
  const { checkDni, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/mis-numeros';

  const [dni, setDni] = useState(params.get('dni') || '');
  const [dniState, setDniState] = useState('idle'); // idle | checking | ok | exists | invalid
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const unlocked = dniState === 'ok';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const runCheck = async (value) => {
    const clean = onlyDigits(value);
    if (!/^\d{7,8}$/.test(clean)) {
      setDniState(value ? 'invalid' : 'idle');
      return;
    }
    setDniState('checking');
    try {
      const { exists } = await checkDni(clean);
      setDniState(exists ? 'exists' : 'ok');
    } catch {
      setDniState('ok'); // si falla el check, dejamos seguir; el submit valida
    }
  };

  useEffect(() => {
    if (params.get('dni')) runCheck(params.get('dni'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const eObj = validate(form);
    setErrors(eObj);
    if (Object.keys(eObj).length) return;

    const [d, mo, y] = form.birthDate.split('/');
    setBusy(true);
    setSubmitError('');
    try {
      await register({
        dni: onlyDigits(dni),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: `${y}-${mo}-${d}`,
        email: form.email.trim(),
        whatsapp: onlyDigits(form.whatsapp),
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province,
        postalCode: form.postalCode.trim().toUpperCase(),
      });
      navigate(next, { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'No pudimos crear tu cuenta.');
      if (err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((x) => [x.campo, x.mensaje])));
      }
      setBusy(false);
    }
  };

  return (
    <AuthShell
      wide
      title="Creá tu cuenta"
      subtitle="Cargás tus datos una sola vez y participás en todos los sorteos."
      footer={
        <>
          ¿Ya tenés cuenta? <Link to="/ingresar">Ingresá</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <Field
          label="DNI"
          required
          hint={
            dniState === 'checking'
              ? 'Verificando…'
              : dniState === 'idle' || dniState === 'invalid'
                ? 'Ingresá tu DNI para desbloquear el resto y agilizar la carga de datos'
                : undefined
          }
          error={
            dniState === 'invalid'
              ? 'DNI inválido (7 u 8 dígitos)'
              : dniState === 'exists'
                ? 'Ese DNI ya está registrado.'
                : undefined
          }
        >
          {(p) => (
            <TextInput
              {...p}
              value={dni}
              onChange={(e) => {
                setDni(e.target.value);
                setDniState('idle');
              }}
              onBlur={(e) => runCheck(e.target.value)}
              inputMode="numeric"
              placeholder="12345678"
              autoFocus
            />
          )}
        </Field>

        {dniState === 'exists' && (
          <p className={styles.existsCta}>
            <Link to={`/ingresar?next=${encodeURIComponent(next)}`}>Ingresá con tu DNI →</Link>
          </p>
        )}

        <div className={styles.divider}>
          <span>{unlocked ? 'Completá tus datos' : 'Ingresá tu DNI para continuar'}</span>
        </div>

        <fieldset className={styles.grid} disabled={!unlocked}>
          <Field label="Nombre" required error={errors.firstName} className={styles.col}>
            {(p) => <TextInput {...p} value={form.firstName} onChange={set('firstName')} placeholder="Tu nombre" autoComplete="given-name" />}
          </Field>
          <Field label="Apellido" required error={errors.lastName} className={styles.col}>
            {(p) => <TextInput {...p} value={form.lastName} onChange={set('lastName')} placeholder="Tu apellido" autoComplete="family-name" />}
          </Field>

          <Field
            label="Fecha de nacimiento"
            required
            error={errors.birthDate}
            hint={!errors.birthDate ? 'Debés ser mayor de 18 años para participar.' : undefined}
            className={styles.full}
          >
            {(p) => (
              <TextInput
                {...p}
                value={form.birthDate}
                onChange={set('birthDate')}
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
              />
            )}
          </Field>

          <Field label="Email" required error={errors.email} className={styles.col}>
            {(p) => <TextInput {...p} type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com" autoComplete="email" />}
          </Field>
          <Field label="WhatsApp" required error={errors.whatsapp} className={styles.col}>
            {(p) => <TextInput {...p} value={form.whatsapp} onChange={set('whatsapp')} inputMode="numeric" placeholder="5491112345678" />}
          </Field>

          <Field label="Dirección" required error={errors.address} className={styles.full}>
            {(p) => <TextInput {...p} value={form.address} onChange={set('address')} placeholder="Calle y número" autoComplete="street-address" />}
          </Field>

          <Field label="Localidad" required error={errors.city} className={styles.col}>
            {(p) => <TextInput {...p} value={form.city} onChange={set('city')} placeholder="Ciudad" />}
          </Field>
          <Field label="Provincia" required error={errors.province} className={styles.col}>
            {(p) => (
              <SelectInput {...p} value={form.province} onChange={set('province')}>
                <option value="">Seleccionar</option>
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
          <Field label="Código Postal" required error={errors.postalCode} className={styles.col}>
            {(p) => <TextInput {...p} value={form.postalCode} onChange={set('postalCode')} placeholder="1234" />}
          </Field>
        </fieldset>

        {submitError && <p className={styles.submitError}>{submitError}</p>}

        <Button type="submit" size="lg" block loading={busy} disabled={!unlocked}>
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  );
}

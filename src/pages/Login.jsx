import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell } from '../components/auth/AuthShell.jsx';
import { Field, TextInput } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';
import { onlyDigits } from '../lib/argentina.js';

export default function Login() {
  const { checkDni, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next') || location.state?.from || '/mis-numeros';

  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const clean = onlyDigits(dni);
    if (!/^\d{7,8}$/.test(clean)) {
      setError('Ingresá un DNI válido (7 u 8 dígitos)');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { exists } = await checkDni(clean);
      if (!exists) {
        navigate(`/registro?dni=${clean}${next ? `&next=${encodeURIComponent(next)}` : ''}`);
        return;
      }
      await login(clean);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || 'No pudimos ingresar. Probá de nuevo.');
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Ingresá a tu cuenta"
      subtitle="Con tu DNI accedés a tus participaciones y tus números."
      footer={
        <>
          ¿Primera vez? <Link to="/registro">Creá tu cuenta</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Field label="DNI" error={error} required>
          {(p) => (
            <TextInput
              {...p}
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              inputMode="numeric"
              autoComplete="username"
              placeholder="12345678"
              autoFocus
            />
          )}
        </Field>
        <Button type="submit" size="lg" block loading={busy}>
          Continuar
        </Button>
      </form>
    </AuthShell>
  );
}

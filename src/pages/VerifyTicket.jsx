import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PageIntro } from '../components/util/PageIntro.jsx';
import { Container } from '../components/ui/Container.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { formatDate, formatDateTime } from '../lib/format.js';
import styles from './VerifyTicket.module.css';

export default function VerifyTicket() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeParam || '');
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    if (!codeParam) return;
    let cancelled = false;
    setState({ status: 'loading' });
    api(`/verify/${encodeURIComponent(codeParam)}`, { auth: false })
      .then((data) => !cancelled && setState({ status: 'done', data }))
      .catch((err) => !cancelled && setState({ status: 'error', message: err.message }));
    return () => {
      cancelled = true;
    };
  }, [codeParam]);

  const onSubmit = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean) navigate(`/verificar/${clean}`);
  };

  return (
    <>
      <PageIntro title="Verificar ticket" narrow>
        Ingresá el código de un ticket para comprobar que la participación es válida.
      </PageIntro>

      <Container narrow className={styles.body}>
        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: ABCD234XYZ"
            autoCapitalize="characters"
            spellCheck="false"
            aria-label="Código de verificación"
          />
          <Button type="submit">Verificar</Button>
        </form>

        {state.status === 'loading' && (
          <div className={styles.center}>
            <Spinner size={28} />
          </div>
        )}

        {state.status === 'error' && (
          <div className={styles.resultError}>No pudimos verificar el código. {state.message}</div>
        )}

        {state.status === 'done' && <VerifyResult data={state.data} />}
      </Container>
    </>
  );
}

function VerifyResult({ data }) {
  if (!data?.found) {
    return (
      <div className={styles.resultError}>
        <strong>Código no encontrado.</strong> Revisá que esté bien escrito.
      </div>
    );
  }

  const valid = data.valid;
  return (
    <div className={styles.card} data-valid={valid || undefined}>
      <div className={styles.head}>
        <span className={styles.mark}>{valid ? '✓' : '!'}</span>
        <div>
          <p className={styles.verdict}>
            {valid ? 'Participación válida' : 'Participación no confirmada'}
          </p>
          {!valid && (
            <p className={styles.verdictNote}>
              El número existe pero el pago todavía no fue confirmado.
            </p>
          )}
        </div>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Número</dt>
          <dd className={styles.number}>{data.number}</dd>
        </div>
        <div>
          <dt>Sorteo</dt>
          <dd>{data.raffle?.title || '—'}</dd>
        </div>
        {data.raffle?.drawDate && (
          <div>
            <dt>Fecha del sorteo</dt>
            <dd>{formatDate(data.raffle.drawDate)}</dd>
          </div>
        )}
        {data.holder && (
          <div>
            <dt>Titular</dt>
            <dd>{data.holder}</dd>
          </div>
        )}
        {data.purchasedAt && (
          <div>
            <dt>Registrado</dt>
            <dd>{formatDateTime(data.purchasedAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

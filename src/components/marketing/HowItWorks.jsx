import styles from './HowItWorks.module.css';

export const STEPS = [
  {
    title: 'Elegí tus chances',
    text: 'Entrá al sorteo que te interesa y elegí cuántos números querés. Ves el total al instante.',
    icon: (
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ),
  },
  {
    title: 'Transferí y subí el comprobante',
    text: 'Te mostramos el alias para transferir. Subís el comprobante desde tu celular en un toque.',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Recibí tus números',
    text: 'Cuando confirmamos el pago, tus números quedan activos en “Mis números”, listos para el sorteo.',
    icon: (
      <>
        <path d="M12 3 3 8v8l9 5 9-5V8l-9-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m8.5 12 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: 'Esperá el sorteo',
    text: 'El día del sorteo publicamos el número ganador y la foto del ganador o ganadora.',
    icon: (
      <>
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 9v4l2.5 2.5M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
];

export function HowItWorks({ steps = STEPS }) {
  return (
    <ol className={styles.grid}>
      {steps.map((step, i) => (
        <li key={step.title} className={styles.step}>
          <div className={styles.top}>
            <span className={styles.num}>{i + 1}</span>
            <svg className={styles.icon} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {step.icon}
            </svg>
          </div>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.text}>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

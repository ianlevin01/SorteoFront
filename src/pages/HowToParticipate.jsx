import { Link } from 'react-router-dom';
import { PageIntro } from '../components/util/PageIntro.jsx';
import { Container } from '../components/ui/Container.jsx';
import { Section } from '../components/ui/Section.jsx';
import { HowItWorks } from '../components/marketing/HowItWorks.jsx';
import { Button } from '../components/ui/Button.jsx';
import styles from './HowToParticipate.module.css';

const FAQ = [
  {
    q: '¿Cómo elijo mis números?',
    a: 'Los números se asignan automáticamente al confirmar tu compra. Son correlativos y únicos para cada sorteo. Podés verlos en “Mis números”.',
  },
  {
    q: '¿Cuándo quedan activos mis números?',
    a: 'Apenas creás la orden ya te reservamos tus números. Quedan activos para el sorteo cuando confirmamos tu transferencia.',
  },
  {
    q: '¿Cómo pago?',
    a: 'Por transferencia bancaria. Te mostramos el alias, transferís y subís el comprobante desde la misma pantalla.',
  },
  {
    q: '¿Cómo sé si un número es auténtico?',
    a: 'Cada número tiene un código de verificación y un QR. Desde “Verificar ticket” cualquiera puede comprobar que la participación es válida.',
  },
  {
    q: '¿Quién puede participar?',
    a: 'Personas mayores de 18 años con domicilio en Argentina.',
  },
];

export default function HowToParticipate() {
  return (
    <>
      <PageIntro title="Cómo participar">
        Participar lleva un par de minutos. Así funciona de principio a fin.
      </PageIntro>

      <Section>
        <HowItWorks />
        <div className={styles.cta}>
          <Button as={Link} to="/sorteos" size="lg">
            Ver sorteos activos
          </Button>
        </div>
      </Section>

      <Section id="faq" tone="surface" title="Preguntas frecuentes">
        <div className={styles.faq}>
          {FAQ.map((item) => (
            <details key={item.q} className={styles.item}>
              <summary className={styles.q}>{item.q}</summary>
              <p className={styles.a}>{item.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

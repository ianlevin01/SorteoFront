import { Link } from 'react-router-dom';
import { Container } from './Container.jsx';
import styles from './Section.module.css';

export function Section({ id, title, subtitle, action, children, tone = 'default' }) {
  return (
    <section id={id} className={styles.section} data-tone={tone}>
      <Container>
        {(title || action) && (
          <header className={styles.head}>
            <div>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {action && (
              <Link to={action.to} className={styles.action}>
                {action.label} <span aria-hidden="true">→</span>
              </Link>
            )}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

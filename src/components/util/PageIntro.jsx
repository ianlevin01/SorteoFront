import { Container } from '../ui/Container.jsx';
import styles from './PageIntro.module.css';

export function PageIntro({ title, children, narrow = false, tone = 'brand' }) {
  return (
    <div className={styles.intro} data-tone={tone}>
      <Container narrow={narrow}>
        <h1 className={styles.title}>{title}</h1>
        {children && <p className={styles.lead}>{children}</p>}
      </Container>
    </div>
  );
}

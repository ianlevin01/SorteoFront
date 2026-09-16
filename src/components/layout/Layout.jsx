import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { ChatWidget } from '../chat/ChatWidget.jsx';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

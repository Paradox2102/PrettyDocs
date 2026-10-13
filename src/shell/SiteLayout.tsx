import { Suspense, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Loading } from '../components/Loading';
import { forget } from '../content/load';
import { ThemeButton } from './ThemeButton';
import styles from './Shell.module.css';

/** The shell of a page that belongs to no robot (the icon gallery): the mark and the theme, no page tabs. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link to="/" className={styles.mark} aria-label="Team 2102 Paradox docs, latest robot">
          <span className={styles.markWord}>PARADOX</span>
          <span className={styles.markNum}>2102</span>
        </Link>
        <div className={styles.tools}>
          <ThemeButton />
        </div>
      </header>
      <main className={styles.main} id="main">
        <ErrorBoundary key={pathname} title="The icon list did not load" onRetry={() => forget()}>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

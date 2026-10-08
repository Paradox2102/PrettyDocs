import { Suspense } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Loading } from '../components/Loading';
import { forget } from '../content/load';
import { PageIcon } from './icons';
import { formatBuilt, PAGE_LABELS, pagePath, type PageKind } from './paths';
import { RobotSelect } from './RobotSelect';
import { useRobot } from './robot-context';
import { ThemeButton } from './ThemeButton';
import styles from './Shell.module.css';

/** The app shell: a side rail on a wide screen; a top bar and a bottom tab bar on a phone. */
export function Layout() {
  const robot = useRobot();
  const { pathname } = useLocation();
  const pages: PageKind[] = ['overview', ...robot.docs];
  return (
    <div className={styles.shell}>
      <header className={styles.rail}>
        <Link to="/" className={styles.mark} aria-label="Team 2102 Paradox docs, latest robot">
          <span className={styles.markWord}>PARADOX</span>
          <span className={styles.markNum}>2102</span>
        </Link>
        <RobotSelect />
        <nav className={styles.nav} aria-label="Pages">
          {pages.map((p) => (
            <NavLink key={p} to={pagePath(robot.id, p)} end={p === 'overview'}
              className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
              <PageIcon page={p} />
              <span>{PAGE_LABELS[p]}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.foot}>
          <ThemeButton />
          <p className={styles.built}>Data built {formatBuilt(robot.built)}</p>
        </div>
      </header>
      <main className={styles.main} id="main">
        <ErrorBoundary key={pathname} title="This page's data did not load" onRetry={() => forget()}>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import { useScene } from '../content/hooks';
import { pagePath } from '../shell/paths';
import { hasWebGL } from '../three/webgl';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './RobotHero.module.css';

const RobotCanvas = lazy(() => import('../three/RobotCanvas'));

/** The overview's 3D robot: neutral colors, a slow turn, no input. It loads after the page text. */
export function RobotHero({ robot }: { robot: string }) {
  const [webgl] = useState(hasWebGL);
  const quiet = <Placeholder text={webgl ? undefined : '3D preview not available'} />;
  return (
    <figure className={styles.hero}>
      {webgl ? (
        <ErrorBoundary title="" fallback={<Placeholder text="3D preview not available" />}>
          <Suspense fallback={quiet}>
            <HeroScene robot={robot} />
          </Suspense>
        </ErrorBoundary>
      ) : quiet}
      <figcaption className={styles.caption}>
        <Link to={pagePath(robot, '3d')}>Open the 3D viewer</Link>
      </figcaption>
    </figure>
  );
}

function HeroScene({ robot }: { robot: string }) {
  const scene = useScene(robot);
  return <RobotCanvas scene={scene} mode="showcase" className={styles.canvas} />;
}

function Placeholder({ text }: { text?: string }) {
  return (
    <div className={styles.placeholder} aria-hidden={text ? undefined : true}>
      <svg viewBox="0 0 100 100" className={styles.outline} aria-hidden="true">
        <rect x="18" y="14" width="64" height="72" rx="3" />
        <path d="M18 30h64M18 70h64" />
      </svg>
      {text ? <p className={styles.note}>{text}</p> : null}
    </div>
  );
}

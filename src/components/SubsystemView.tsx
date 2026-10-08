import { lazy, Suspense, useState } from 'react';
import { useScene } from '../content/hooks';
import { hasWebGL } from '../three/webgl';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './SubsystemView.module.css';

const RobotCanvas = lazy(() => import('../three/RobotCanvas'));

interface Props {
  robot: string;
  groups: string[];
  /** Registry keys of the subsystem's devices. */
  devices: string[];
  label: string;
}

/** One subsystem in 3D for the mechanical page. Without WebGL it says so; the page's tables do not depend on it. */
export function SubsystemView({ robot, groups, devices, label }: Props) {
  const [webgl] = useState(hasWebGL);
  const note = (text: string) => <div className={styles.note}><p>{text}</p></div>;
  return (
    <figure className={styles.view} aria-label={label}>
      {webgl ? (
        <ErrorBoundary title="" fallback={note('The 3D view did not load.')}>
          <Suspense fallback={note('Loading the 3D model')}>
            <Scene robot={robot} groups={groups} devices={devices} />
          </Suspense>
        </ErrorBoundary>
      ) : note('This browser cannot show 3D.')}
      {webgl ? <figcaption className={styles.hint}>Drag to turn · scroll or pinch to zoom</figcaption> : null}
    </figure>
  );
}

function Scene({ robot, groups, devices }: Omit<Props, 'label'>) {
  const scene = useScene(robot);
  return <RobotCanvas scene={scene} mode="subsystem" subsystem={{ groups, devices }} className={styles.canvas} />;
}

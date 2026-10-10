import { lazy, Suspense, useState } from 'react';
import type { ControllerModel } from '../controllers/types';
import type { Binding } from '../content/types';
import type { ViewKey } from '../logic/controls';
import { useMediaQuery } from '../shell/media';
import { hasWebGL } from '../three/webgl';
import { ControllerSheet } from './ControllerSheet';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './ControllerView.module.css';

const ControllerCanvas = lazy(() => import('../three/ControllerCanvas'));

interface Props {
  model: ControllerModel;
  view: ViewKey;
  bindings: Map<string, Binding>;
  selected: string | null;
  onSelect: (input: string) => void;
}

/** The drawing panel: one 2D view, or the 3D model. Without WebGL the 3D view says so; the 2D views still work. */
export function ControllerView({ model, view, bindings, selected, onSelect }: Props) {
  const [webgl] = useState(hasWebGL);
  const compact = useMediaQuery('(max-width: 699px)');
  const note = (text: string) => <div className={styles.note}><p>{text}</p></div>;
  const labels = new Map([...bindings].map(([id, b]) => [id, b.label]));
  const names = new Map(model.inputs.map((n) => [n.id, n.short]));

  if (view === '3d') {
    return (
      <figure className={styles.view} aria-label={`${model.maker} ${model.name} in 3D`}>
        {webgl ? (
          <ErrorBoundary title="" fallback={note('The 3D view did not load.')}>
            <Suspense fallback={note('Loading the 3D model')}>
              <ControllerCanvas model={model.id} labels={labels} names={names} selected={selected} onSelect={onSelect}
                className={styles.canvas} />
            </Suspense>
          </ErrorBoundary>
        ) : note('This browser cannot show 3D.')}
        {webgl ? <figcaption className={styles.caption}>Drag to turn · scroll or pinch to zoom · click a button</figcaption> : null}
      </figure>
    );
  }
  const v = model.views[view];
  return (
    <figure className={styles.view} aria-label={`${model.maker} ${model.name}, ${v.title}`}>
      <div className={styles.sheet}>
        <ControllerSheet model={model} view={v} bindings={bindings} selected={selected} onSelect={onSelect} compact={compact} />
      </div>
      <figcaption className={styles.caption}>{v.caption}{compact ? ' Tap a button.' : ''}</figcaption>
    </figure>
  );
}

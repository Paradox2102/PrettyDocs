import { Suspense, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { DevicePanel } from '../components/DevicePanel';
import { Loading } from '../components/Loading';
import { useScene, useWiring } from '../content/hooks';
import type { SceneDevice, Vec3 } from '../content/types';
import { focusFor, toggleList } from '../logic/scene';
import { labelLines } from '../logic/viewer';
import { pagePath, pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import { useUrlState } from '../shell/url-state';
import { VIEW_LABELS, type ViewName } from '../three/cameraViews';
import RobotCanvas from '../three/RobotCanvas';
import { hasWebGL } from '../three/webgl';
import styles from './Viewer3D.module.css';

const VIEW_ORDER: ViewName[] = ['top', 'front', 'side', 'iso', 'under'];

export default function Viewer3D() {
  const robot = useRobot();
  const [webgl] = useState(hasWebGL);
  return (
    <>
      <title>{pageTitle('3D', robot.name)}</title>
      {webgl ? (
        <Suspense fallback={<Loading label="Loading the 3D model" />}>
          <ViewerPage />
        </Suspense>
      ) : (
        <section className={styles.nogl}>
          <h1>3D</h1>
          <p>This browser cannot show 3D.</p>
          <p><Link to={pagePath(robot.id, 'wiring')}>Open the wiring sheets</Link></p>
        </section>
      )}
    </>
  );
}

function ViewerPage() {
  const robot = useRobot();
  const scene = useScene(robot.id);
  const wiring = useWiring(robot.id);
  const { params, update } = useUrlState();
  const toggles = useMemo(() => toggleList(scene), [scene]);
  const key = params.get('device');
  const [initial] = useState(() => (key ? focusFor(scene, key) : null));
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial ? [initial.toggle] : []));
  const [ghost, setGhost] = useState(0.15);
  const [view, setView] = useState<{ name: ViewName; nonce: number }>({ name: 'iso', nonce: 0 });
  const [focus] = useState<Vec3 | null>(initial?.anchor ?? null);
  const [tip, setTip] = useState<{ lines: string[]; x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const device = key && Object.hasOwn(wiring.devices, key) ? wiring.devices[key] : null;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showTip(d: SceneDevice | null, x: number, y: number) {
    const rect = stage.current?.getBoundingClientRect();
    if (!d || !rect) {
      setTip(null);
      return;
    }
    setTip({ lines: labelLines(d), x: x - rect.left, y: y - rect.top });
  }

  function pick(d: SceneDevice | null, x: number, y: number) {
    showTip(d, x, y);
    if (d?.registry_key && Object.hasOwn(wiring.devices, d.registry_key)) update({ set: { device: d.registry_key } });
  }

  const warnings = scene.buses.filter((b) => selected.has(b.bus) && b.warning);
  const { meta } = scene;

  return (
    <div className={styles.page}>
      <section className={styles.controls} aria-label="3D controls">
        <header>
          <p className={styles.eyebrow}>{robot.name}</p>
          <h1 className={styles.h1}>3D</h1>
        </header>

        <div>
          <h2 className={styles.h2}>Loops and layers</h2>
          <div className={styles.toggles}>
            {toggles.map((t) => (
              <button key={t.id} type="button" role="switch" aria-checked={selected.has(t.id)} className={styles.toggle}
                style={{ '--chip': t.color } as CSSProperties} onClick={() => toggle(t.id)}>
                <span className={styles.chip} aria-hidden="true" />
                <span className={styles.toggleText}>
                  <span className={styles.toggleName}>{t.name}</span>
                  <span className={styles.toggleFn}>{t.fn}</span>
                </span>
                <span className={styles.toggleCount}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className={styles.row}>
            <button type="button" className={styles.btn} onClick={() => setSelected(new Set(toggles.map((t) => t.id)))}>All</button>
            <button type="button" className={styles.btn} onClick={() => setSelected(new Set())}>None</button>
          </div>
        </div>

        {warnings.length ? (
          <div className={styles.warnings} aria-live="polite">
            {warnings.map((b) => <p key={b.bus}><b className="mono">{b.bus}</b> {b.warning}</p>)}
          </div>
        ) : null}

        <div className={styles.slider}>
          <label htmlFor="ghost">
            Other parts <output htmlFor="ghost" className="mono">{Math.round(ghost * 100)}%</output>
          </label>
          <input id="ghost" type="range" min={0} max={0.6} step={0.05} value={ghost}
            onChange={(e) => setGhost(Number(e.target.value))} />
          <p className={styles.hint}>Opacity of everything that is not on a selected loop or layer.</p>
        </div>

        <div>
          <h2 className={styles.h2}>Camera</h2>
          <div className={styles.row}>
            {VIEW_ORDER.map((v) => (
              <button key={v} type="button" className={styles.btn}
                onClick={() => setView((s) => ({ name: v, nonce: s.nonce + 1 }))}>{VIEW_LABELS[v]}</button>
            ))}
          </div>
        </div>

        <footer className={styles.meta}>
          <div>CAD {meta.document.split(' (')[0]}</div>
          <div>microversion {meta.microversion.slice(0, 12)}</div>
          <div>{meta.triangles.toLocaleString('en-US')} triangles · {meta.cell_mm} mm cells</div>
        </footer>
      </section>

      <div className={styles.stage} ref={stage} onPointerLeave={() => setTip(null)}>
        <RobotCanvas scene={scene} mode="viewer" selected={selected} ghost={ghost} view={view.name} viewNonce={view.nonce}
          focus={focus} onHover={showTip} onPick={pick} className={styles.canvas} />
        <p className={styles.hint3d}>Drag to turn · right-drag to move · scroll or pinch to zoom</p>
        {tip ? (
          <div className={styles.tip} role="tooltip"
            style={{ left: Math.min(tip.x + 14, (stage.current?.clientWidth ?? 0) - 280), top: tip.y + 14 }}>
            {tip.lines.map((l, i) => <div key={i} className={i === 0 ? styles.tipFirst : i === 1 ? styles.tipSecond : styles.tipRest}>{l}</div>)}
          </div>
        ) : null}
        {device ? (
          <div className={styles.panel}>
            <DevicePanel device={device} from="3d" onClose={() => update({ set: { device: null } })} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

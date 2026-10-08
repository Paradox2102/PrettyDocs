import { Link } from 'react-router';
import type { Device, DocKind } from '../content/types';
import { panelRows } from '../logic/wiring';
import { pagePath } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import styles from './DevicePanel.module.css';
import { PdhTag } from './PdhTag';

interface Props {
  device: Device;
  from: DocKind;
  note?: string;
  onClose: () => void;
}

const LINKS: { page: DocKind; label: string }[] = [
  { page: 'wiring', label: 'Show on wiring' },
  { page: '3d', label: 'Show in 3D' },
  { page: 'devices', label: 'Show in table' },
];

/** Every registry fact about one device, with links to the same device on the other pages. */
export function DevicePanel({ device, from, note, onClose }: Props) {
  const robot = useRobot();
  const rows = panelRows(device);
  const links = LINKS.filter((l) => l.page !== from && robot.docs.includes(l.page));
  return (
    <aside className={styles.panel} aria-label="Device details">
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{device.role || device.key}</h2>
          <p className={styles.sub}>
            <span className="mono">{device.key}</span>
            {device.mechanism ? ` · ${device.mechanism}` : ''}
          </p>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close device details">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <dl className={styles.rows}>
        {rows.map((r) => (
          <div key={r.label} className={r.amber ? `${styles.row} ${styles.amber}` : styles.row}>
            <dt>{r.label}</dt>
            <dd>{r.label === 'PDH' ? <PdhTag text={r.value} /> : r.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className={styles.note}>{note}</p> : null}
      {links.length ? (
        <p className={styles.links}>
          {links.map((l) => (
            <Link key={l.page} to={`${pagePath(robot.id, l.page)}?device=${encodeURIComponent(device.key)}`}>
              {l.label}
            </Link>
          ))}
        </p>
      ) : null}
    </aside>
  );
}

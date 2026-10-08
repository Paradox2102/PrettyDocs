import { useMemo, useState } from 'react';
import { DevicePanel } from '../components/DevicePanel';
import { useWiring } from '../content/hooks';
import { chipCounts, deviceRows, filterRows, sortRows, type Chip, type SortCol, type SortDir } from '../logic/devices';
import { search } from '../logic/wiring';
import { pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import { useUrlState } from '../shell/url-state';
import styles from './Devices.module.css';

const CHIPS: { value: Chip; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'can', label: 'CAN' },
  { value: 'power', label: 'Power' },
  { value: 'network', label: 'Network' },
  { value: 'open', label: 'Open items' },
];

const COLUMNS: { col: SortCol; label: string; mono?: boolean }[] = [
  { col: 'role', label: 'Device' },
  { col: 'mechanism', label: 'Mechanism' },
  { col: 'type', label: 'Type' },
  { col: 'can', label: 'CAN', mono: true },
  { col: 'pdh', label: 'PDH', mono: true },
  { col: 'ip', label: 'IP', mono: true },
  { col: 'open', label: 'Open items' },
];

export default function Devices() {
  const robot = useRobot();
  const wiring = useWiring(robot.id);
  const { params, update } = useUrlState();
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<Chip>('all');
  const [sort, setSort] = useState<{ col: SortCol; dir: SortDir } | null>(null);

  const all = useMemo(() => deviceRows(wiring), [wiring]);
  const counts = useMemo(() => chipCounts(all), [all]);
  const keys = query.trim() ? search(wiring.devices, query) : null;
  const filtered = filterRows(all, chip, keys);
  const rows = sort ? sortRows(filtered, sort.col, sort.dir) : filtered;

  const key = params.get('device');
  const device = key && Object.hasOwn(wiring.devices, key) ? wiring.devices[key] : null;
  const select = (k: string | null) => update({ set: { device: k } });

  function sortBy(col: SortCol) {
    setSort((s) => (s?.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));
  }

  return (
    <div className={styles.page}>
      <title>{pageTitle('Devices', robot.name)}</title>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{robot.name}</p>
        <h1 className={styles.h1}>Devices</h1>
        <p className={styles.lead}>Every device on the robot with its CAN bus and ID, PDH channel and IP address.</p>
      </header>

      <div className={styles.tools}>
        <input type="search" className={styles.search} aria-label="Search devices" placeholder="CAN ID, role, IP…"
          autoComplete="off" spellCheck={false} value={query} onChange={(e) => setQuery(e.target.value)} />
        <fieldset className={styles.chips}>
          <legend className="visually-hidden">Show</legend>
          {CHIPS.map((c) => (
            <label key={c.value} className={styles.chip}>
              <input type="radio" name="device-chip" value={c.value} checked={chip === c.value}
                onChange={() => setChip(c.value)} />
              <span>{c.label} <span className={styles.chipCount}>{counts[c.value]}</span></span>
            </label>
          ))}
        </fieldset>
      </div>

      <p className={styles.count} aria-live="polite">
        {rows.length} of {all.length} devices
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.col} scope="col"
                  aria-sort={sort?.col === c.col ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button type="button" onClick={() => sortBy(c.col)}>
                    {c.label}
                    <span className={styles.arrow} aria-hidden="true">
                      {sort?.col === c.col ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} onClick={() => select(r.key)} data-selected={r.key === key || undefined}>
                <td data-label="Device" className={styles.role}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); select(r.key); }}>{r.role}</button>
                </td>
                <td data-label="Mechanism">{r.mechanism}</td>
                <td data-label="Type">{r.type}</td>
                <td data-label="CAN" className="mono">{r.can}</td>
                <td data-label="PDH" className={r.pdhStyle === 'amber' ? `mono ${styles.amber}` : 'mono'}>{r.pdh}</td>
                <td data-label="IP" className="mono">{r.ip}</td>
                <td data-label="Open items" className={styles.open}>
                  {r.open.length ? <span title={r.open.join(', ')}>{r.open.join(', ')}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className={styles.empty}>No device matches.</p> : null}
      </div>

      {device ? (
        <div className={styles.panel}>
          <DevicePanel device={device} from="devices" onClose={() => select(null)} />
        </div>
      ) : null}
    </div>
  );
}

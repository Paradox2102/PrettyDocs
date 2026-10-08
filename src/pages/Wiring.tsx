import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DevicePanel } from '../components/DevicePanel';
import { Segmented } from '../components/Segmented';
import { WiringSheet, type SheetHandle } from '../components/WiringSheet';
import { useSheetSvg, useWiring } from '../content/hooks';
import { contentUrl } from '../content/load';
import type { Bbox } from '../content/types';
import { hashFor, search, viewFromHash, type Mode, type Sheet } from '../logic/wiring';
import { pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import { useUrlState } from '../shell/url-state';
import '../styles/sheet.css';
import styles from './Wiring.module.css';

const SHEET_OPTIONS: { value: Sheet; label: string }[] = [
  { value: 'wiring', label: 'Wiring' },
  { value: 'top', label: 'Top view' },
];
const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'can', label: 'CAN' },
  { value: 'power', label: 'Power' },
  { value: 'network', label: 'Network' },
];
const MAX_RESULTS = 20;

export default function Wiring() {
  const robot = useRobot();
  const wiring = useWiring(robot.id);
  const { params, hash, update } = useUrlState();
  const { sheet, mode } = viewFromHash(hash);
  const svg = useSheetSvg(robot.id, sheet);
  const sheetRef = useRef<SheetHandle>(null);
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);

  const [vx, vy, vw, vh] = wiring.view;
  const full = useMemo(() => ({ x: vx, y: vy, w: vw, h: vh }), [vx, vy, vw, vh]);
  const key = params.get('device');
  const device = key && Object.hasOwn(wiring.devices, key) ? wiring.devices[key] : null;
  const openOnly = params.get('open') === '1';
  const matches = useMemo(() => search(wiring.devices, query), [wiring.devices, query]);

  const bboxOf = (k: string): Bbox | null => {
    const d = wiring.devices[k]?.derived;
    return (sheet === 'top' ? d?.top_bbox : d?.bbox) ?? null;
  };

  // A device named in the URL (a link, a reload, a sheet switch): zoom to it once the sheet is drawn.
  useEffect(() => {
    if (!device) return;
    const b = bboxOf(device.key);
    if (b) sheetRef.current?.focus(b);
    // Only on a new sheet or a new device from outside; clicks on the sheet do not move the view.
  }, [svg]);

  function choose(k: string | null, focus: boolean, keepList = false) {
    if (!keepList) setListOpen(false);
    update({ set: { device: k } });
    const b = k && focus ? bboxOf(k) : null;
    if (b) sheetRef.current?.focus(b);
  }

  function onQuery(q: string) {
    setQuery(q);
    setListOpen(true);
    const found = search(wiring.devices, q);
    if (found.length === 1) choose(found[0], true, true);  // the user is still typing: keep the list
  }

  return (
    <div className={styles.page}>
      <title>{pageTitle('Wiring', robot.name)}</title>
      <section className={styles.controls} aria-label="Wiring controls">
        <header>
          <p className={styles.eyebrow}>{robot.name}</p>
          <h1 className={styles.h1}>Wiring</h1>
        </header>

        <div className={styles.search} onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setListOpen(false);
        }}>
          <label htmlFor="device-search" className={styles.label}>Find a device</label>
          <input id="device-search" type="search" aria-label="Search devices" placeholder="CAN ID, role, IP…"
            autoComplete="off" spellCheck={false} value={query} onChange={(e) => onQuery(e.target.value)}
            onFocus={() => setListOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches[0]) choose(matches[0], true);
              if (e.key === 'Escape') setListOpen(false);
            }} />
          {listOpen && query.trim() ? (
            // preventDefault on mousedown keeps focus in the input. Safari does not focus a pressed button, so a blur
            // would close the list before the click reached the result.
            <div className={styles.results} onMouseDown={(e) => e.preventDefault()}>
              <p className={styles.count} aria-live="polite">
                {matches.length === 0 ? 'No match' : `${matches.length} match${matches.length === 1 ? '' : 'es'}`}
              </p>
              <ul>
                {matches.slice(0, MAX_RESULTS).map((k) => {
                  const d = wiring.devices[k];
                  return (
                    <li key={k}>
                      <button type="button" onClick={() => choose(k, true)} aria-current={k === key || undefined}>
                        <span>{d.role || k}</span>
                        {d.can?.id ? <span className="mono">{d.can.id}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <Segmented label="Show" name="mode" options={MODE_OPTIONS} value={mode}
          onChange={(m) => update({ hash: hashFor(sheet, m) })} />
        <Segmented label="Sheet" name="sheet" options={SHEET_OPTIONS} value={sheet}
          onChange={(s) => update({ hash: hashFor(s, mode) })} />

        <label className={styles.toggle}>
          <input type="checkbox" checked={openOnly} onChange={(e) => update({ set: { open: e.target.checked ? '1' : null } })} />
          <span>Show only open items</span>
        </label>
        <p className={styles.hint}>
          Open items: CAN IDs not confirmed, PDH channels not recorded, assumed ports and pairings.
        </p>

        <a className={styles.download} href={contentUrl(robot.id, 'poster.svg')} download={`${robot.id}-wiring-poster.svg`}>
          Download poster (SVG)
        </a>
        <p className={styles.hint}>11 × 17 in. Print at 100 %.</p>
      </section>

      <div className={styles.work}>
        <div className={styles.stage} style={{ '--sheet-ratio': `${vw} / ${vh}` } as CSSProperties}>
          <WiringSheet ref={sheetRef} svg={svg} full={full} mode={mode} openOnly={openOnly}
            selected={device?.key ?? null} onSelect={(k) => choose(k, false)}
            label={sheet === 'top' ? 'Top view sheet' : 'Wiring sheet'} />
          <div className={styles.zoom} role="group" aria-label="Zoom">
            <button type="button" onClick={() => sheetRef.current?.zoomBy(1.25)} aria-label="Zoom in">+</button>
            <button type="button" onClick={() => sheetRef.current?.zoomBy(1 / 1.25)} aria-label="Zoom out">−</button>
            <button type="button" onClick={() => sheetRef.current?.fit()}>Fit</button>
          </div>
        </div>
        {device ? (
          <div className={styles.panel}>
            <DevicePanel device={device} from="wiring" onClose={() => choose(null, false)}
              note={bboxOf(device.key) ? undefined : 'Not drawn on this sheet.'} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

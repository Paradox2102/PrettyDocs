// Rows, filters and sort for the device table.
import type { PdhStyle, WiringData } from '../content/types';
import { MOTOR } from './wiring';

export type System = 'can' | 'power' | 'network';
export type Chip = 'all' | System | 'open';
export type SortCol = 'role' | 'mechanism' | 'type' | 'can' | 'pdh' | 'ip' | 'open';
export type SortDir = 'asc' | 'desc';

export interface Row {
  key: string;
  role: string;
  /** The device's icon slug in the icon collection, or null. */
  icon: string | null;
  mechanism: string;
  type: string;
  can: string;
  canSort: [string, number];
  pdh: string;
  pdhStyle: PdhStyle;
  ip: string;
  open: string[];
  systems: Set<System>;
}

const firstNumber = (s: string) => {
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
};

export function deviceRows(w: WiringData): Row[] {
  return Object.values(w.devices).map((d) => {
    const systems = new Set<System>();
    if (d.can) systems.add('can');
    if (d.derived.pdh_tag[0] || d.power?.fed_by) systems.add('power');
    if (d.network) systems.add('network');
    return {
      key: d.key,
      role: d.role || d.key,
      icon: d.icon ?? null,
      mechanism: d.mechanism ?? '',
      type: [d.type, d.icon ? MOTOR[d.icon] : null].filter(Boolean).join(' · '),
      can: d.can ? `${d.can.bus} · ${d.can.id ?? '?'}` : '',
      canSort: d.can ? [d.can.bus, firstNumber(String(d.can.id ?? ''))] : ['', Number.POSITIVE_INFINITY],
      pdh: d.derived.pdh_tag[0],
      pdhStyle: d.derived.pdh_tag[1],
      ip: d.network?.ip ?? '',
      open: d.derived.open_reasons,
      systems,
    };
  });
}

/** Rows for one chip. `keys` is the search result (in its order), or null when there is no query. */
export function filterRows(rows: Row[], chip: Chip, keys: string[] | null): Row[] {
  const keep = (r: Row) => chip === 'all' || (chip === 'open' ? r.open.length > 0 : r.systems.has(chip));
  if (keys === null) return rows.filter(keep);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return keys.map((k) => byKey.get(k)).filter((r): r is Row => Boolean(r) && keep(r!));
}

export function chipCounts(rows: Row[]): Record<Chip, number> {
  const out: Record<Chip, number> = { all: rows.length, can: 0, power: 0, network: 0, open: 0 };
  for (const r of rows) {
    for (const s of r.systems) out[s] += 1;
    if (r.open.length) out.open += 1;
  }
  return out;
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function isEmpty(r: Row, col: SortCol): boolean {
  if (col === 'open') return r.open.length === 0;
  return r[col] === '';
}

function compare(a: Row, b: Row, col: SortCol): number {
  switch (col) {
    case 'can':
      return collator.compare(a.canSort[0], b.canSort[0]) || a.canSort[1] - b.canSort[1];
    case 'pdh':
      return firstNumber(a.pdh) - firstNumber(b.pdh) || collator.compare(a.pdh, b.pdh);
    case 'open':
      return a.open.length - b.open.length;
    default:
      return collator.compare(a[col], b[col]);
  }
}

/** A sorted copy. Empty cells stay at the end in both directions. */
export function sortRows(rows: Row[], col: SortCol, dir: SortDir): Row[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const ea = isEmpty(a, col);
    const eb = isEmpty(b, col);
    if (ea !== eb) return ea ? 1 : -1;
    return sign * compare(a, b, col) || collator.compare(a.role, b.role);
  });
}

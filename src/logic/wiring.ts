// Rules for the wiring page that need no browser: search, open items, panel rows, and view (viewBox) math.
// Port of ~/systemcore/wiring/page/page-logic.js; the behaviour and the tests are the same.
import type { Bbox, Device } from '../content/types';

export type Mode = 'all' | 'can' | 'power' | 'network';
export type Sheet = 'wiring' | 'top';

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanelRow {
  label: string;
  value: string;
  amber: boolean;
}

export const MAX_ZOOM = 12;
export const MODES: Mode[] = ['all', 'can', 'power', 'network'];
export const SHEETS: Sheet[] = ['wiring', 'top'];
export const MOTOR: Record<string, string> = { 'kraken-x60': 'Kraken X60', 'kraken-x44': 'Kraken X44' };

function textOf(device: Device): string[] {
  const can = device.can ?? null;
  const net = device.network ?? null;
  return [device.key, device.role, can?.code_name, net?.ip, net?.name]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
}

/**
 * Keys of the devices that match `query`: whole-number CAN ID matches first, then text matches, each in the
 * order of `devices`.
 * Text: a substring of key, role, code name, IP or network name (case ignored).
 * CAN ID: an all-digit query equal to one of the numbers in the ID ("43" in "42 / 43", not "4" in "44"), or any
 * query equal to the whole ID with the spaces removed ("42/43", "45?").
 */
export function search(devices: Record<string, Device>, query: string): string[] {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const digits = /^\d+$/.test(q);
  const squeezed = q.replace(/\s+/g, '');
  const byId: string[] = [];
  const byText: string[] = [];
  for (const key of Object.keys(devices)) {
    const d = devices[key];
    const id = d.can && d.can.id != null ? String(d.can.id) : '';
    const idHit = id && ((digits && (id.match(/\d+/g) ?? ([] as string[])).includes(q)) ||
      id.replace(/\s+/g, '').toLowerCase() === squeezed);
    if (idHit) byId.push(key);
    else if (textOf(d).some((t) => t.includes(q))) byText.push(key);
  }
  return byId.concat(byText);
}

export function isOpen(device: Device): boolean {
  return Boolean(device.derived && device.derived.open);
}

/** The rows of the device panel, in a fixed order; rows with no value are left out. */
export function panelRows(device: Device): PanelRow[] {
  const rows: PanelRow[] = [];
  const add = (label: string, value: string | null | undefined, amber = false) => {
    if (value) rows.push({ label, value, amber });
  };
  const can = device.can;
  const net = device.network;
  const der: Partial<Device['derived']> = device.derived ?? {};
  const power = device.power ?? {};
  add('Type', [device.type, device.icon ? MOTOR[device.icon] : null].filter(Boolean).join(' · '));
  if (can) add('CAN', `${can.bus} · ${can.id}${can.id_uncertain ? ' (not confirmed)' : ''}`, Boolean(can.id_uncertain));
  if (can) add('Code', can.code_name);
  add('Wire order', der.wire_order);
  const [tag, style] = der.pdh_tag ?? ['', 'none'];
  if (tag) add('PDH', tag + (style === 'amber' ? ' (not recorded)' : ''), style === 'amber' || Boolean(power.pdh_uncertain));
  if (der.fed_by_role) {
    add('Fed by', der.fed_by_role + (power.pdh_uncertain ? ' (assumed)' : ''), Boolean(power.pdh_uncertain));
  }
  add('Power note', power.note);
  if (net) {
    const port = net.radio_port ? net.radio_port + (net.radio_port_uncertain ? ' (assumed)' : '') : '';
    add('Network', [net.ip, net.name, net.mac || net.mac_note, port].filter(Boolean).join(' · '),
      Boolean(net.radio_port_uncertain));
    add('Host', net.host_note);
  }
  if (der.attached_to_role) {
    add('Attached to', der.attached_to_role + (device.attached_uncertain ? ' (assumed)' : ''),
      Boolean(device.attached_uncertain));
  }
  add('CAD', der.cad_comment ? `"${der.cad_comment}"` : '');
  add('Notes', (device.notes ?? []).join('; '));
  add('Open', (der.open_reasons ?? []).join(', '), true);
  return rows;
}

/**
 * Zoom factor for one wheel event: 100 px of wheel (one classic mouse notch) is one 1.2x step, so a trackpad's
 * many small events add up to the same zoom. deltaMode 1 = lines (16 px), 2 = pages (800 px).
 */
export function wheelFactor(deltaY: number, deltaMode: number): number {
  const px = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 800 : 1);
  return px === 0 ? 1 : 1.2 ** (-px / 100);
}

function clampView(vb: { x: number; y: number; w: number }, full: ViewBox): ViewBox {
  const w = Math.min(Math.max(vb.w, full.w / MAX_ZOOM), full.w);
  const h = (w * full.h) / full.w;
  const x = Math.min(Math.max(vb.x, full.x), full.x + full.w - w);
  const y = Math.min(Math.max(vb.y, full.y), full.y + full.h - h);
  return { x, y, w, h };
}

/** Zoom by `factor` (> 1 zooms in) and keep the sheet point (px, py) at the same place on screen. */
export function zoomAt(vb: ViewBox, factor: number, px: number, py: number, full: ViewBox): ViewBox {
  const w = Math.min(Math.max(vb.w / factor, full.w / MAX_ZOOM), full.w);
  const k = w / vb.w;
  return clampView({ x: px - (px - vb.x) * k, y: py - (py - vb.y) * k, w }, full);
}

export function panBy(vb: ViewBox, dx: number, dy: number, full: ViewBox): ViewBox {
  return clampView({ x: vb.x + dx, y: vb.y + dy, w: vb.w }, full);
}

/** Move the view so that bbox [x, y, w, h] is in the middle; the zoom does not change. */
export function centerOn(vb: ViewBox, bbox: Bbox, full: ViewBox): ViewBox {
  const [x, y, w, h] = bbox;
  return clampView({ x: x + w / 2 - vb.w / 2, y: y + h / 2 - vb.h / 2, w: vb.w }, full);
}

/**
 * The sheet and the view in a URL hash: "#can", "#top", "#top-can". The defaults (the wiring sheet, All) are
 * left out of the hash; anything the page does not know gives the defaults.
 */
export function viewFromHash(hash: string): { sheet: Sheet; mode: Mode } {
  const h = String(hash || '').replace(/^#/, '').toLowerCase();
  const [first, ...rest] = h.split('-');
  const sheet: Sheet = first === 'top' ? 'top' : 'wiring';
  const mode = sheet === 'top' ? rest.join('-') : h;
  return { sheet, mode: (MODES as string[]).includes(mode) ? (mode as Mode) : 'all' };
}

export function hashFor(sheet: Sheet, mode: Mode): string {
  const parts = [sheet === 'top' ? 'top' : '', mode !== 'all' ? mode : ''].filter(Boolean);
  return parts.length ? `#${parts.join('-')}` : '';
}

// Rules for the 3D viewer that need no WebGL: mesh decoding, highlight colors, device labels and cable points.
// Port of ~/systemcore/wiring/cad3d/viewer-logic.js; the behaviour and the tests are the same.
import type { MeshData, SceneDevice, Vec3 } from '../content/types';

export const BUS_COLORS: Record<string, string> = {
  can_s0: '#d98e04',
  can_s1: '#0f9d8a',
  can_s2: '#2f6fde',
  can_s3: '#c23b8f',
  can_s4: '#4f9d2a',
};
export const GROUP_COLORS: Record<string, string> = {
  chassis: '#8a8f98',
  swerve: '#6f7682',
  intake: '#9a8f7f',
  indexer: '#7f8f9a',
  hopper: '#9298a0',
  shooter: '#857f94',
  other: '#a0a4aa',
};
export const LAYER_COLORS: Record<string, string> = { electronics: '#d9412b', power: '#cf222e', network: '#0969da' };
/** A camera's USB cable in the Network layer; the 2D network map uses the same violet. */
export const USB_COLOR = '#8250df';
/** A power cable to a "ch ?" device (channel not recorded). */
export const AMBER = '#9a6700';
export const DEVICE_NEUTRAL = '#5b616b';

export const SYSTEMCORE_COLOR = '#e8e8e8';

export interface StyleItem {
  kind: string;
  group?: string;
  bus?: string | null;
  layers?: string[];
  /** The device's registry key, for the subsystem view. */
  registryKey?: string | null;
}

export interface Style {
  color: string;
  opacity: number;
  transparent: boolean;
}

export interface CableSpec {
  from: string;
  to: string;
  assumed?: boolean;
  main?: boolean;
  unknown?: boolean;
  usb?: boolean;
}

export interface Cable {
  a: Vec3;
  b: Vec3;
  assumed: boolean;
  main: boolean;
  unknown: boolean;
  usb: boolean;
}

function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function decodeMesh(md: MeshData): { positions: Float32Array; indices: Uint16Array | Uint32Array } {
  // b64ToBytes gives a fresh buffer, so the typed arrays start on an aligned offset.
  const q = new Uint16Array(b64ToBytes(md.pos).buffer);
  const positions = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) positions[i] = md.min[i % 3] + q[i] * md.scale[i % 3];
  const ib = b64ToBytes(md.idx).buffer;
  const indices = md.idx32 ? new Uint32Array(ib) : new Uint16Array(ib);
  return { positions, indices };
}

function neutralColor(item: StyleItem): string {
  if (item.kind === 'group') return GROUP_COLORS[item.group ?? ''] ?? GROUP_COLORS.other;
  if (item.kind === 'systemcore') return SYSTEMCORE_COLOR;
  return DEVICE_NEUTRAL;
}

/** A selected CAN loop wins over a selected layer; the SystemCore stays opaque as the start of every cable. */
export function styleFor(item: StyleItem, selected: Set<string>, ghost: number): Style {
  if (selected.size === 0) return { color: neutralColor(item), opacity: 1, transparent: false };
  if (item.kind !== 'group' && item.bus && selected.has(item.bus)) {
    return { color: BUS_COLORS[item.bus], opacity: 1, transparent: false };
  }
  const layer = (item.layers ?? []).find((l) => selected.has(l));
  if (layer) return { color: LAYER_COLORS[layer], opacity: 1, transparent: false };
  if (item.kind === 'systemcore') return { color: SYSTEMCORE_COLOR, opacity: 1, transparent: false };
  return { color: neutralColor(item), opacity: ghost, transparent: true };
}

/**
 * The power-transfer shade of a mechanism color (user, 2026-10-08): the same hue, darker and stronger, so gears,
 * pulleys, belts, shafts, wheels and rollers stand out from the structure and still read as their mechanism's.
 */
export function driveShade(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const s2 = Math.min(1, s * 2.2 + 0.12);
  const l2 = Math.max(0.12, l - 0.13);
  const c = (1 - Math.abs(2 * l2 - 1)) * s2;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const [r1, g1, b1] = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  const m = l2 - c / 2;
  return '#' + [r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

/** Power-transfer parts take their group's opacity, in the power-transfer shade of its color. */
export function driveStyle(s: Style): Style {
  return { ...s, color: driveShade(s.color) };
}

/**
 * Index ranges of a group mesh for its two materials: structure (0), then the last `driveTris` triangles, the
 * power-transfer parts (1). No power-transfer parts: no ranges, one material.
 */
export function meshParts(tris: number, driveTris: number | undefined): { start: number; count: number; material: number }[] {
  const drive = driveTris ?? 0;
  if (drive <= 0) return [];
  const parts = [{ start: 0, count: (tris - drive) * 3, material: 0 }, { start: (tris - drive) * 3, count: drive * 3, material: 1 }];
  return parts.filter((p) => p.count > 0);
}

/** The class of a layer tag in 3D: a power tag adds the lightning bolt (Labels.css) before its PDH channel. */
export function layerTagClass(layerId: string): string {
  return layerId === 'power' ? 'chain-num pdh' : 'chain-num';
}

/** The bubble on a CAN device: its CAN ID ("21/22" for an open pair). The wire order is in the hover label. */
export function canTag(device: { can_id?: string | null; chain_index?: number }): string {
  const id = (device.can_id ?? '').replace(/\s*\/\s*/g, '/');
  return id || String((device.chain_index ?? 0) + 1);
}

/**
 * The mechanical page's subsystem view: the subsystem's groups solid in their neutral color, other groups at
 * `ghost`, the subsystem's devices in their bus color (no bus: the device neutral color), every other device hidden.
 */
export function subsystemStyle(item: StyleItem, focus: { groups: Set<string>; devices: Set<string> }, ghost: number): Style {
  if (item.kind === 'group') {
    const color = neutralColor(item);
    return focus.groups.has(item.group ?? '') ? { color, opacity: 1, transparent: false } : { color, opacity: ghost, transparent: true };
  }
  if (item.registryKey && focus.devices.has(item.registryKey)) {
    return { color: item.bus ? BUS_COLORS[item.bus] ?? DEVICE_NEUTRAL : DEVICE_NEUTRAL, opacity: 1, transparent: false };
  }
  return { color: neutralColor(item), opacity: 0, transparent: true };
}

type LabelDevice = Pick<SceneDevice, 'bus' | 'role' | 'mechanism' | 'device_type' | 'status'> &
  Partial<Pick<SceneDevice, 'can_id' | 'motor' | 'pdh' | 'ip' | 'comment' | 'chain_index'>>;

/** The hover label. `chainLength` (the device count on its bus) adds the wire order line. */
export function labelLines(device: LabelDevice, chainLength?: number): string[] {
  if (!device.bus) {
    const lines = [device.role, `${device.mechanism} · ${device.device_type}`];
    if (device.pdh) lines.push(`PDH ${device.pdh}`);
    if (device.ip) lines.push(`IP ${device.ip}`);
    lines.push(`Status: ${device.status}`);
    return lines;
  }
  const lines = [
    `CAN ${device.can_id} · ${device.bus}`,
    device.role,
    `${device.mechanism} · ${device.motor || device.device_type}`,
    ...(device.pdh ? [`PDH ${device.pdh}`] : []),
    ...(chainLength && device.chain_index != null
      ? [`Wire order: ${device.chain_index + 1} of ${chainLength} on ${device.bus}`] : []),
    `Status: ${device.status}`,
  ];
  if (device.comment) lines.push(`CAD comment: ${device.comment}`);
  return lines;
}

export function cablePoints(
  bus: { chain: string[] },
  devicesByKey: Record<string, { anchor: Vec3 }>,
  systemcoreAnchor: Vec3,
): Vec3[] {
  return [systemcoreAnchor, ...bus.chain.map((key) => devicesByKey[key].anchor)];
}

/** The cables of a Power or Network layer as point pairs; `anchorOf(key)` gives a device's anchor or undefined. */
export function layerCables(layer: { cables?: CableSpec[] }, anchorOf: (key: string) => Vec3 | undefined): Cable[] {
  const out: Cable[] = [];
  for (const c of layer.cables ?? []) {
    const a = anchorOf(c.from);
    const b = anchorOf(c.to);
    if (a && b) {
      out.push({ a, b, assumed: Boolean(c.assumed), main: Boolean(c.main), unknown: Boolean(c.unknown),
        usb: Boolean(c.usb) });
    }
  }
  return out;
}

/** The label at the middle of a USB cable ("USB?" when the camera-to-Pi pairing is assumed), or null. */
export function cableLabel(c: Cable): { text: string; at: Vec3 } | null {
  if (!c.usb) return null;
  return { text: c.assumed ? 'USB?' : 'USB', at: c.a.map((v, i) => (v + c.b[i]) / 2) as Vec3 };
}

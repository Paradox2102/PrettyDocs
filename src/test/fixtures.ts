// Small content documents for tests. They follow the shapes in src/content/types.ts.
import type { Device, RobotIndex, WiringData } from '../content/types';

export function robotEntry(id: string, extra: Partial<RobotIndex['robots'][number]> = {}) {
  return { id, name: id === '2026-offseason' ? '2026 Offseason' : id.toUpperCase(), season: '2026',
    summary: 'Summary.', built: '2026-10-08T10:28:00-07:00', docs: ['wiring', '3d', 'devices'] as const, ...extra };
}

export const INDEX: RobotIndex = {
  latest: '2026-offseason',
  robots: [robotEntry('2026-offseason'), robotEntry('2025-robot', { name: '2025 Robot', docs: ['wiring', 'devices'] })]
    .map((r) => ({ ...r, docs: [...r.docs] })),
};

export function derived(extra: Partial<Device['derived']> = {}): Device['derived'] {
  return { wire_order: null, pdh_tag: ['', 'none'], cad_comment: null, open: false, open_reasons: [],
    fed_by_role: null, attached_to_role: null, bbox: [10, 10, 20, 20], top_bbox: null, ...extra };
}

export const WIRING: WiringData = {
  built: '2026-10-08T10:28:00-07:00',
  view: [0, 0, 431.8, 279.4],
  devices: {
    'flywheel-x44-side': {
      key: 'flywheel-x44-side', icon: 'kraken-x44', type: 'Talon FX', role: 'X44-side flywheel', mechanism: 'Shooter',
      can: { bus: 'can_s3', id: '42 / 43', id_uncertain: true, code_name: 'flywheelLeader' },
      power: { pdh_channel: 10, pdh_uncertain: false },
      derived: derived({ wire_order: '3 of 6 on can_s3', pdh_tag: ['ch 10', 'red'], open: true,
        open_reasons: ['CAN ID not confirmed'], top_bbox: [100, 100, 10, 10] }),
    },
    'camera-front-left': {
      key: 'camera-front-left', icon: 'arducam-ov9281-usb', type: 'innomaker OV9281 USB', role: 'front_left',
      mechanism: 'Vision', attached_to: 'left-pi', attached_uncertain: true, power: null,
      derived: derived({ attached_to_role: 'Orange Pi 5 Pro · left-pi', open: true,
        open_reasons: ['camera pairing assumed'], bbox: null }),
    },
    'left-pi': {
      key: 'left-pi', icon: 'orangepi-5-pro', type: 'Orange Pi 5 Pro', role: 'Orange Pi 5 Pro · left-pi',
      mechanism: 'Vision', network: { ip: '10.21.2.12', name: 'left-pi' },
      power: { pdh_channel: null, fed_by: 'zinc-v-1', pdh_uncertain: true },
      derived: derived({ pdh_tag: ['ch 21 via Zinc-V', 'red'], fed_by_role: 'Zinc-V #1' }),
    },
    'swerve-fl-drive': {
      key: 'swerve-fl-drive', icon: 'kraken-x60', type: 'Talon FX', role: 'FL drive', mechanism: 'Swerve',
      can: { bus: 'can_s2', id: '1', id_uncertain: false }, power: { pdh_channel: 2 },
      derived: derived({ pdh_tag: ['ch 2', 'red'] }),
    },
  },
};

export const POSTER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 431.8 279.4" width="431.8mm" height="279.4mm">'
  + '<g data-key="flywheel-x44-side" data-systems="can power"><rect x="10" y="10" width="20" height="20"/></g>'
  + '<g data-info="can"><text>42 / 43</text></g>'
  + '<g class="hl" data-key="flywheel-x44-side"><rect x="9" y="9" width="22" height="22"/></g>'
  + '</svg>';
export const TOP_SVG = POSTER_SVG.replace('data-info="can"', 'data-info="power"');

/** A fetch stub that serves `files` by URL path; anything else is a 404. */
export function fakeFetch(files: Record<string, unknown>) {
  return async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    if (!(path in files)) return new Response('not found', { status: 404, statusText: 'Not Found' });
    const body = files[path];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: 200 });
  };
}

export const SITE_FILES = {
  '/content/robots.json': INDEX,
  '/content/robots/2026-offseason/wiring.json': WIRING,
  '/content/robots/2026-offseason/poster.svg': POSTER_SVG,
  '/content/robots/2026-offseason/top-view.svg': TOP_SVG,
  '/content/robots/2025-robot/wiring.json': WIRING,
  '/content/robots/2025-robot/poster.svg': POSTER_SVG,
  '/content/robots/2025-robot/top-view.svg': TOP_SVG,
};

const MESH = { pos: '', min: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number], idx: '', idx32: false, tris: 0 };

/** A small 3D scene: one swerve group, a CAN motor, a camera, the PDH and the SystemCore. */
export const SCENE = {
  meta: { document: 'G0000 - Main', microversion: 'abc123', cell_mm: 4, built: '2026-10-08T17:25:52+00:00', triangles: 1234 },
  groups: [{ id: 'swerve', label: 'Swerve modules', box: [-0.3, -0.4, 0.3, 0.4, 0, 0.17], mesh: MESH }],
  devices: [
    { key: 'can_s2:0', kind: 'motor', bus: 'can_s2', chain_index: 0, can_id: '1', role: 'FL drive', mechanism: 'Swerve',
      device_type: 'Talon FX', motor: 'Kraken X60', status: 's', anchor: [0.2, 0.3, 0.1], box: [], registry_key: 'swerve-fl-drive',
      pdh: 'ch 2', mesh: MESH, layers: ['power'] },
    { key: 'electronics:camera-front-left', kind: 'electronics', bus: null, role: 'front_left', mechanism: 'Vision',
      device_type: 'OV9281', status: 's', anchor: [0.1, 0, 0.4], box: [], registry_key: 'camera-front-left', pdh: null,
      mesh: MESH, layers: ['network', 'electronics'] },
    { key: 'can_s0:0', kind: 'pdh', bus: 'can_s0', chain_index: 0, can_id: '21', role: 'Power Distribution Hub',
      mechanism: 'Power distribution', device_type: 'REV PDH', status: 's', anchor: [0, 0, 0.07], box: [], registry_key: 'pdh',
      pdh: null, mesh: MESH, layers: ['electronics', 'power'] },
  ],
  systemcore: { kind: 'systemcore', bus: null, role: 'SystemCore', mechanism: 'Control', device_type: 'SystemCore', status: 's',
    anchor: [0.05, 0.25, 0.08], box: [], registry_key: 'systemcore', pdh: null, mesh: MESH, layers: ['electronics'] },
  buses: [
    { bus: 'can_s0', function: 'PDH only', chain: ['can_s0:0'], warning: null },
    { bus: 'can_s2', function: 'Swerve and gyro', chain: ['can_s2:0'], warning: 'Check the FL drive.' },
  ],
  layers: [
    { id: 'electronics', label: 'Electronics', function: 'Radio, SystemCore, power, vision', members: ['a', 'b'], cables: [], tags: [] },
    { id: 'power', label: 'Power', function: 'PDH channels', members: ['a', 'b', 'c'], cables: [], tags: [] },
    { id: 'network', label: 'Network', function: 'Ethernet', members: ['a'], cables: [], tags: [] },
  ],
} satisfies import('../content/types').Scene;

// @ts-nocheck -- ported verbatim from ~/systemcore/wiring (node:test); only the imports changed.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { MODES, SHEETS, search, isOpen, panelRows, zoomAt, panBy, centerOn, wheelFactor, viewFromHash, hashFor } from './wiring';

const motor = (key, role, id, extra = {}) => ({
  key, role, type: 'Talon FX', icon: 'kraken-x60',
  can: { bus: 'can_s3', id, id_uncertain: id.includes('/') || id.includes('?') },
  power: { pdh_channel: null },
  derived: { wire_order: '1 of 6 on can_s3', pdh_tag: ['?', 'amber'], open: true, open_reasons: [] },
  ...extra,
});

const DEVICES = {
  'flywheel-x44-side': motor('flywheel-x44-side', 'X44-side flywheel', '42 / 43'),
  'flywheel-other-side': motor('flywheel-other-side', 'Other-side flywheel', '42 / 43'),
  hood: motor('hood', 'Hood (Kraken X44)?', '41?', { icon: 'kraken-x44' }),
  'turret-rotation': motor('turret-rotation', 'Turret rotation', '44'),
  'shooter-scotty-rollers': motor('shooter-scotty-rollers', 'Scotty rollers', '45?', {
    can: { bus: 'can_s3', id: '45?', id_uncertain: true, code_name: 'goUp' },
    derived: { wire_order: '2 of 6 on can_s3', pdh_tag: ['?', 'amber'], cad_comment: 'Motor Name: Scotty Rollers',
               open: true, open_reasons: ['CAN ID not confirmed', 'PDH channel not recorded'] },
  }),
  'left-pi': { key: 'left-pi', role: 'Orange Pi 5 Pro · left-pi', type: 'Orange Pi 5 Pro',
               network: { ip: '10.21.2.12', name: 'NT client left-pi', radio_port: 'eth_aux1', radio_port_uncertain: true },
               power: { pdh_channel: null, fed_by: 'zinc-v-1', pdh_uncertain: true },
               derived: { pdh_tag: ['21', 'red'], fed_by_role: 'Zinc-V #1', open: true,
                          open_reasons: ['PDH channel not sure'] } },
  'camera-front-left': { key: 'camera-front-left', role: 'front_left', type: 'OV9281 (B0332)', attached_to: 'left-pi',
                         attached_uncertain: true, power: null,
                         derived: { pdh_tag: ['', 'none'], attached_to_role: 'Orange Pi 5 Pro · left-pi', open: true,
                                    open_reasons: ['camera pairing assumed'] } },
  radio: { key: 'radio', role: 'VH-109 radio', type: 'VH-109 radio',
           power: { pdh_channel: null, note: 'WPILib: low-current channel, 10 A fuse' },
           network: { ip: '10.21.2.1', name: 'radio-2.local', mac: null, mac_note: 'not in the neighbour table',
                      host_note: 'VH-109 radio (radio-2.local)' },
           derived: { pdh_tag: ['?', 'amber'], open: true, open_reasons: ['PDH channel not recorded'] } },
  'swerve-fl-drive': motor('swerve-fl-drive', 'FL drive', '1', { can: { bus: 'can_s2', id: '1', id_uncertain: false } }),
  battery: { key: 'battery', role: '12 V battery', type: 'Battery', power: null,
             derived: { pdh_tag: ['', 'none'], open: false, open_reasons: [] } },
};

const FULL = { x: 0, y: 0, w: 431.8, h: 279.4 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('search by CAN ID number', () => {
  assert.deepEqual(search(DEVICES, '43'), ['flywheel-x44-side', 'flywheel-other-side']);
  assert.deepEqual(search(DEVICES, '45'), ['shooter-scotty-rollers']);
  assert.deepEqual(search(DEVICES, ' 43 '), search(DEVICES, '43'));
});

test('a digit matches whole numbers only, but text still matches', () => {
  assert.deepEqual(search(DEVICES, '4'), ['flywheel-x44-side', 'hood']);
});

test('search by text, case ignored, and by IP', () => {
  assert.deepEqual(search(DEVICES, 'FLYWHEEL'), ['flywheel-x44-side', 'flywheel-other-side']);
  assert.deepEqual(search(DEVICES, '10.21.2.12'), ['left-pi']);
});

test('search by the exact CAN ID text, spaces ignored', () => {
  assert.deepEqual(search(DEVICES, '42 / 43'), ['flywheel-x44-side', 'flywheel-other-side']);
  assert.deepEqual(search(DEVICES, '42/43'), ['flywheel-x44-side', 'flywheel-other-side']);
});

test('no match, empty and odd input', () => {
  assert.deepEqual(search(DEVICES, 'zzz'), []);
  assert.deepEqual(search(DEVICES, ''), []);
  assert.deepEqual(search(DEVICES, '   '), []);
  assert.deepEqual(search(DEVICES, '('), ['hood']);  // a plain substring: "Hood (Kraken X44)?"; no RegExp error
});

test('isOpen reads derived.open', () => {
  assert.equal(isOpen(DEVICES['shooter-scotty-rollers']), true);
  assert.equal(isOpen(DEVICES.battery), false);
});

test('panel rows for an uncertain device', () => {
  const rows = panelRows(DEVICES['shooter-scotty-rollers']);
  assert.deepEqual(rows.find((r) => r.label === 'CAN'), { label: 'CAN', value: 'can_s3 · 45? (not confirmed)', amber: true });
  assert.deepEqual(rows.find((r) => r.label === 'PDH'), { label: 'PDH', value: '? (not recorded)', amber: true });
  assert.deepEqual(rows.map((r) => r.label), ['Type', 'CAN', 'Code', 'Wire order', 'PDH', 'CAD', 'Open']);
});

test('panel rows for a device with no CAN and no network', () => {
  const labels = panelRows(DEVICES.battery).map((r) => r.label);
  assert.ok(labels.includes('Type'));
  for (const l of ['CAN', 'Network', 'PDH']) assert.ok(!labels.includes(l), l);
});

test('panel network row marks an assumed radio port', () => {
  const net = panelRows(DEVICES['left-pi']).find((r) => r.label === 'Network');
  assert.deepEqual(net, { label: 'Network', value: '10.21.2.12 · NT client left-pi · eth_aux1 (assumed)', amber: true });
});

test('zoom in keeps the point under the cursor', () => {
  const vb = zoomAt(FULL, 1.2, 100, 100, FULL);
  near(vb.w, 431.8 / 1.2);
  near((100 - vb.x) / vb.w, 100 / 431.8);
  near((100 - vb.y) / vb.h, 100 / 279.4);
  near(vb.h / vb.w, 279.4 / 431.8);
});

test('zoom is clamped between 1x and 12x', () => {
  let vb = FULL;
  for (let i = 0; i < 30; i++) vb = zoomAt(vb, 1.2, 200, 100, FULL);
  near(vb.w, 431.8 / 12);
  assert.deepEqual(zoomAt(FULL, 1 / 1.2, 100, 100, FULL), FULL);
});

test('pan stays inside the sheet', () => {
  const zoomed = zoomAt(FULL, 1.2, 200, 100, FULL);
  const a = panBy(zoomed, -1000, -1000, FULL);
  assert.equal(a.x, 0); assert.equal(a.y, 0);
  const b = panBy(zoomed, 1000, 1000, FULL);
  near(b.x + b.w, 431.8); near(b.y + b.h, 279.4);
});

test('centerOn puts a box in the middle of the view', () => {
  let vb = FULL;
  for (let i = 0; i < 4; i++) vb = zoomAt(vb, 1.2, 200, 100, FULL);
  const c = centerOn(vb, [200, 100, 20, 20], FULL);
  near(c.x + c.w / 2, 210); near(c.y + c.h / 2, 110); near(c.w, vb.w);
});

test('a whole-number CAN ID match comes before text matches', () => {
  const r = search(DEVICES, '1');
  assert.equal(r[0], 'swerve-fl-drive');
  assert.ok(r.includes('battery') && r.includes('radio'));  // "12 V battery", "10.21.2.1"
});

test('panel shows the feeding Zinc-V, the assumed camera pairing, power notes and host notes', () => {
  const pi = panelRows(DEVICES['left-pi']);
  assert.deepEqual(pi.find((r) => r.label === 'Fed by'), { label: 'Fed by', value: 'Zinc-V #1 (assumed)', amber: true });
  const cam = panelRows(DEVICES['camera-front-left']);
  assert.deepEqual(cam.find((r) => r.label === 'Attached to'),
                   { label: 'Attached to', value: 'Orange Pi 5 Pro · left-pi (assumed)', amber: true });
  const radio = panelRows(DEVICES.radio);
  assert.deepEqual(radio.find((r) => r.label === 'Power note'),
                   { label: 'Power note', value: 'WPILib: low-current channel, 10 A fuse', amber: false });
  assert.equal(radio.find((r) => r.label === 'Network').value, '10.21.2.1 · radio-2.local · not in the neighbour table');
  assert.equal(radio.find((r) => r.label === 'Host').value, 'VH-109 radio (radio-2.local)');
});

test('wheel factor follows the wheel distance', () => {
  near(wheelFactor(-100, 0), 1.2);
  near(wheelFactor(100, 0), 1 / 1.2);
  assert.equal(wheelFactor(0, 0), 1);
  near(wheelFactor(-4, 0), 1.2 ** 0.04);
  near(wheelFactor(-3, 1), 1.2 ** 0.48);  // deltaMode 1: lines of 16 px
});

test('the sheet and the view come from the URL hash; anything else gives the defaults', () => {
  assert.deepEqual(MODES, ['all', 'can', 'power', 'network']);
  assert.deepEqual(SHEETS, ['wiring', 'top']);
  const v = (sheet, mode) => ({ sheet, mode });
  assert.deepEqual(viewFromHash(''), v('wiring', 'all'));
  assert.deepEqual(viewFromHash(undefined), v('wiring', 'all'));
  assert.deepEqual(viewFromHash('#can'), v('wiring', 'can'));
  assert.deepEqual(viewFromHash('#CAN'), v('wiring', 'can'));
  assert.deepEqual(viewFromHash('#top'), v('top', 'all'));
  assert.deepEqual(viewFromHash('#top-network'), v('top', 'network'));
  assert.deepEqual(viewFromHash('#top-xyz'), v('top', 'all'));
  assert.deepEqual(viewFromHash('#foo'), v('wiring', 'all'));
  assert.deepEqual(viewFromHash('#wiring-can'), v('wiring', 'all'));
  assert.deepEqual(viewFromHash('#can_s3'), v('wiring', 'all'));
});

test('the hash leaves the defaults out', () => {
  assert.equal(hashFor('wiring', 'all'), '');
  assert.equal(hashFor('wiring', 'power'), '#power');
  assert.equal(hashFor('top', 'all'), '#top');
  assert.equal(hashFor('top', 'can'), '#top-can');
  for (const sheet of SHEETS) for (const mode of MODES) assert.deepEqual(viewFromHash(hashFor(sheet, mode)), { sheet, mode });
});

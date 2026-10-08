// @ts-nocheck -- ported verbatim from ~/systemcore/wiring (node:test); only the imports changed.
import { test } from 'vitest';
import * as L from './viewer';
import assert from 'node:assert/strict';

import { decodeMesh, styleFor, labelLines, cablePoints, layerCables, cableLabel, BUS_COLORS, LAYER_COLORS, USB_COLOR,
        DEVICE_NEUTRAL, SYSTEMCORE_COLOR } from './viewer';

const b64 = (typed) => Buffer.from(typed.buffer).toString('base64');

test('decodeMesh round trip', () => {
  const md = { pos: b64(new Uint16Array([0, 1, 2])), min: [0, 0, 0], scale: [1, 1, 1],
               idx: b64(new Uint16Array([0, 0, 0])), idx32: false, tris: 1 };
  const { positions, indices } = decodeMesh(md);
  assert.deepEqual(Array.from(positions), [0, 1, 2]);
  assert.ok(indices instanceof Uint16Array);
});

test('none selected: all opaque', () => {
  assert.equal(styleFor({ kind: 'motor', bus: 'can_s3' }, new Set(), 0.15).opacity, 1);
  assert.equal(styleFor({ kind: 'group', group: 'shooter' }, new Set(), 0.15).opacity, 1);
});

test('other bus selected: ghosted', () => {
  assert.deepEqual(styleFor({ kind: 'motor', bus: 'can_s3' }, new Set(['can_s2']), 0.15),
                   { color: DEVICE_NEUTRAL, opacity: 0.15, transparent: true });
});

test('own bus selected: bus color', () => {
  const s = styleFor({ kind: 'motor', bus: 'can_s3' }, new Set(['can_s3']), 0.15);
  assert.equal(s.color, BUS_COLORS.can_s3);
  assert.equal(s.opacity, 1);
});

test('all five selected: every device lit', () => {
  const all = new Set(Object.keys(BUS_COLORS));
  for (const bus of all) assert.equal(styleFor({ kind: 'motor', bus }, all, 0.15).opacity, 1);
  assert.equal(styleFor({ kind: 'group', group: 'chassis' }, all, 0.15).opacity, 0.15);
  assert.deepEqual(styleFor({ kind: 'systemcore' }, all, 0.15), { color: SYSTEMCORE_COLOR, opacity: 1, transparent: false });
});

test('open pair label', () => {
  const lines = labelLines({ can_id: '21 / 22', bus: 'can_s4', role: 'Turret-side rack',
    mechanism: 'Intake rack, turret side (left)', motor: 'Kraken X44', device_type: 'Talon FX',
    status: 'name confirmed, ID pair open', comment: 'Motor name: turret side rack' });
  assert.deepEqual(lines, ['CAN 21 / 22 · can_s4', 'Turret-side rack', 'Intake rack, turret side (left) · Kraken X44',
    'Status: name confirmed, ID pair open', 'CAD comment: Motor name: turret side rack']);
});

test('cable starts at SystemCore', () => {
  assert.deepEqual(cablePoints({ chain: ['a', 'b'] }, { a: { anchor: [1, 0, 0] }, b: { anchor: [2, 0, 0] } }, [0, 0, 0]),
                   [[0, 0, 0], [1, 0, 0], [2, 0, 0]]);
});

test('electronics layer lights its members', () => {
  assert.deepEqual(L.styleFor({ kind: 'electronics', layers: ['electronics'] }, new Set(['electronics']), 0.15),
    { color: L.LAYER_COLORS.electronics, opacity: 1, transparent: false });
  assert.equal(L.styleFor({ kind: 'electronics', layers: ['electronics'] }, new Set(['can_s2']), 0.15).opacity, 0.15);
});

test('a CAN device in the layer: its bus color wins when both are on', () => {
  const pdh = { kind: 'pdh', bus: 'can_s0', layers: ['electronics'] };
  assert.equal(L.styleFor(pdh, new Set(['electronics']), 0.15).color, L.LAYER_COLORS.electronics);
  assert.equal(L.styleFor(pdh, new Set(['electronics', 'can_s0']), 0.15).color, L.BUS_COLORS.can_s0);
});

test('SystemCore takes the layer color, else stays opaque as the cable start', () => {
  const sc = { kind: 'systemcore', layers: ['electronics'] };
  assert.equal(L.styleFor(sc, new Set(['electronics']), 0.15).color, L.LAYER_COLORS.electronics);
  assert.deepEqual(L.styleFor(sc, new Set(['can_s2']), 0.15), { color: L.SYSTEMCORE_COLOR, opacity: 1, transparent: false });
});

test('electronics label', () => {
  assert.deepEqual(L.labelLines({ kind: 'electronics', role: 'VH-109 radio', mechanism: 'Control',
    device_type: 'VH-109 radio', ip: '10.21.2.1', status: 'in the device registry' }),
    ['VH-109 radio', 'Control · VH-109 radio', 'IP 10.21.2.1', 'Status: in the device registry']);
});

test('layer cables join anchors; a cable with an end that has no anchor is left out', () => {
  const anchors = { a: [0, 0, 0], b: [1, 0, 0], systemcore: [0, 1, 0] };
  const layer = { cables: [
    { from: 'systemcore', to: 'a', assumed: false, main: true },
    { from: 'a', to: 'b', assumed: true, main: false, unknown: true },
    { from: 'a', to: 'nowhere', assumed: false, main: false },
  ] };
  assert.deepEqual(layerCables(layer, (k) => anchors[k]), [
    { a: [0, 1, 0], b: [0, 0, 0], assumed: false, main: true, unknown: false, usb: false },
    { a: [0, 0, 0], b: [1, 0, 0], assumed: true, main: false, unknown: true, usb: false },
  ]);
  assert.deepEqual(layerCables({ id: 'electronics' }, (k) => anchors[k]), []);
});

test('power and network layer colours', () => {
  assert.equal(LAYER_COLORS.power, '#cf222e');
  assert.equal(LAYER_COLORS.network, '#0969da');
  assert.ok(LAYER_COLORS.electronics);
});

test('the hover label shows the PDH channel', () => {
  const motor = { bus: 'can_s1', can_id: '30', role: 'Roller drive', mechanism: 'Indexer roller drive',
                  motor: 'Kraken X60', status: 's', comment: null, pdh: 'ch 13?' };
  assert.deepEqual(labelLines(motor).slice(2, 4), ['Indexer roller drive · Kraken X60', 'PDH ch 13?']);
  const radio = { bus: null, role: 'VH-109 radio', mechanism: 'Control', device_type: 'VH-109 radio', ip: '10.21.2.1',
                  status: 'in the device registry', pdh: 'ch ?' };
  assert.deepEqual(labelLines(radio), ['VH-109 radio', 'Control · VH-109 radio', 'PDH ch ?', 'IP 10.21.2.1',
                                       'Status: in the device registry']);
  assert.ok(!labelLines({ ...motor, pdh: null }).some((l) => l.startsWith('PDH')));
});

test('a USB cable is its own colour and says USB at its middle', () => {
  assert.equal(USB_COLOR, '#8250df');  // the 2D network map's USB colour
  assert.notEqual(USB_COLOR, LAYER_COLORS.network);
  const [c] = layerCables({ cables: [{ from: 'cam', to: 'pi', assumed: true, usb: true }] },
                          (k) => ({ cam: [0, 0, 0], pi: [2, 4, 0] })[k]);
  assert.equal(c.usb, true);
  assert.deepEqual(cableLabel(c), { text: 'USB?', at: [1, 2, 0] });  // assumed pairing
  assert.deepEqual(cableLabel({ ...c, assumed: false }).text, 'USB');
  assert.equal(cableLabel({ ...c, usb: false }), null);
});

test('the page loads no third-party font, script or stylesheet', async () => {
  // Replaces the old viewer's Google Fonts check: this site self-hosts its fonts and makes no third-party request.
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(`${process.cwd()}/index.html`, 'utf8');
  assert.doesNotMatch(html, /<(link|script)[^>]+(href|src)="https?:\/\//);
});

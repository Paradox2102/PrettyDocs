import { expect, test } from 'vitest';
import { WIRING } from '../test/fixtures';
import type { WiringData } from '../content/types';
import { deviceRows, filterRows, sortRows } from './devices';

const rows = deviceRows(WIRING);
const byKey = (k: string) => rows.find((r) => r.key === k)!;

test('a device with no CAN and power: null gives empty cells and no systems', () => {
  const cam = byKey('camera-front-left');
  expect(cam.can).toBe('');
  expect(cam.pdh).toBe('');
  expect(cam.ip).toBe('');
  expect(cam.systems.size).toBe(0);
  expect(cam.open).toEqual(['camera pairing assumed']);
});

test('a motor row has its bus, ID, channel and type', () => {
  const m = byKey('flywheel-x44-side');
  expect(m.can).toBe('can_s3 · 42 / 43');
  expect(m.pdh).toBe('10');
  expect(m.pdhStyle).toBe('red');
  expect(m.type).toBe('Talon FX · Kraken X44');
  expect([...m.systems].sort()).toEqual(['can', 'power']);
});

test('a device fed through a converter counts as power; an IP counts as network', () => {
  expect([...byKey('left-pi').systems].sort()).toEqual(['network', 'power']);
});

test('the power chip keeps only power rows', () => {
  expect(filterRows(rows, 'power', null).map((r) => r.key).sort())
    .toEqual(['flywheel-x44-side', 'left-pi', 'swerve-fl-drive']);
});

test('the open chip keeps rows with open items', () => {
  expect(filterRows(rows, 'open', null).map((r) => r.key).sort()).toEqual(['camera-front-left', 'flywheel-x44-side']);
});

test('search keys keep their order and their filter', () => {
  expect(filterRows(rows, 'all', ['left-pi', 'swerve-fl-drive']).map((r) => r.key)).toEqual(['left-pi', 'swerve-fl-drive']);
  expect(filterRows(rows, 'can', ['left-pi', 'swerve-fl-drive']).map((r) => r.key)).toEqual(['swerve-fl-drive']);
});

test('CAN sorts by bus, then by number, and empty cells go last', () => {
  const w: WiringData = structuredClone(WIRING);
  w.devices['swerve-fl-turn'] = { ...structuredClone(w.devices['swerve-fl-drive']), key: 'swerve-fl-turn',
    can: { bus: 'can_s2', id: '10' } };
  w.devices['swerve-fl-drive'].can = { bus: 'can_s2', id: '2' };
  const sorted = sortRows(deviceRows(w), 'can', 'asc').map((r) => r.key);
  expect(sorted.slice(0, 3)).toEqual(['swerve-fl-drive', 'swerve-fl-turn', 'flywheel-x44-side']);
  expect(sorted.slice(-2).sort()).toEqual(['camera-front-left', 'left-pi']);
  const desc = sortRows(deviceRows(w), 'can', 'desc').map((r) => r.key);
  expect(desc[0]).toBe('flywheel-x44-side');
  expect(desc.slice(-2).sort()).toEqual(['camera-front-left', 'left-pi']);
});

test('PDH sorts by channel number', () => {
  expect(sortRows(rows, 'pdh', 'asc').map((r) => r.pdh).filter(Boolean)).toEqual(['2', '10', '21 via Zinc-V']);
});

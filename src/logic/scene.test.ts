import { expect, test } from 'vitest';
import { SCENE } from '../test/fixtures';
import { focusFor, frame, sceneByRegistryKey, toggleList } from './scene';

test('sceneByRegistryKey finds devices and the SystemCore', () => {
  const m = sceneByRegistryKey(SCENE);
  expect(m.get('pdh')?.key).toBe('can_s0:0');
  expect(m.get('systemcore')?.kind).toBe('systemcore');
});

test('focusFor a CAN motor turns on its bus', () => {
  expect(focusFor(SCENE, 'swerve-fl-drive')).toEqual({ anchor: [0.2, 0.3, 0.1], toggle: 'can_s2' });
});

test('focusFor a camera turns on its first layer in the order power, network, electronics', () => {
  expect(focusFor(SCENE, 'camera-front-left')?.toggle).toBe('network');
});

test('focusFor the SystemCore turns on electronics', () => {
  expect(focusFor(SCENE, 'systemcore')?.toggle).toBe('electronics');
});

test('focusFor an unknown key is null', () => {
  expect(focusFor(SCENE, 'nope')).toBeNull();
});

test('toggleList gives the buses first, then the layers', () => {
  const t = toggleList(SCENE);
  expect(t.map((x) => x.id)).toEqual(['can_s0', 'can_s2', 'electronics', 'power', 'network']);
  expect(t[1]).toMatchObject({ name: 'can_s2', fn: 'Swerve and gyro', count: 1 });
  expect(t[3]).toMatchObject({ name: 'Power', count: 3 });
});

test('frame centres on the swerve footprint', () => {
  const f = frame(SCENE);
  expect(f.center[0]).toBeCloseTo(0);
  expect(f.center[1]).toBeCloseTo(0);
  expect(f.center[2]).toBe(0.25);
  expect(f.radius).toBeCloseTo(0.95 * 0.8);
});

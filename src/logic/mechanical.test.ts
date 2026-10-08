import { expect, test } from 'vitest';
import type { Subsystem } from '../content/types';
import { MECHANICAL, WIRING } from '../test/fixtures';
import { subsystemDevices } from './mechanical';

const sub = (mechanisms: string[]): Subsystem => ({ ...MECHANICAL.subsystems[0], mechanisms });

test('a subsystem gets the devices of its mechanisms', () => {
  expect(subsystemDevices(WIRING, sub(['Shooter'])).map((d) => d.key)).toEqual(['flywheel-x44-side']);
  expect(subsystemDevices(WIRING, sub(['Swerve', 'Shooter'])).map((d) => d.key))
    .toEqual(['flywheel-x44-side', 'swerve-fl-drive']);
});

test('devices keep registry order and may have no CAN', () => {
  const vision = subsystemDevices(WIRING, sub(['Vision']));
  expect(vision.map((d) => d.key)).toEqual(['camera-front-left', 'left-pi']);
  expect(vision[0].can).toBeUndefined();
});

test('a mechanism with no device gives an empty list', () => {
  expect(subsystemDevices(WIRING, sub(['Hopper']))).toEqual([]);
});

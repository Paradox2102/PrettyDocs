import { expect, test } from 'vitest';
import { controlSettings } from './controls';

test('the view stops when the pointer stops: no damping, so no momentum (user, 2026-10-08)', () => {
  // With damping, rotation left over from a drag kept turning the model during a right-drag pan or a zoom.
  expect(controlSettings(true, false).enableDamping).toBe(false);
  expect(controlSettings(false, true).enableDamping).toBe(false);
});

test('the showcase turns by itself and takes no input; the other views take input', () => {
  expect(controlSettings(false, true)).toMatchObject({ enabled: false, autoRotate: true });
  expect(controlSettings(true, false)).toMatchObject({ enabled: true, autoRotate: false });
});

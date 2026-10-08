import { expect, test } from 'vitest';
import { cameraPosition, VIEWS } from './cameraViews';

test('the top view sits above the centre', () => {
  const p = cameraPosition('top', [0, 0, 0.25], 1);
  expect(p[0]).toBeCloseTo(-0.02);
  expect(p[1]).toBeCloseTo(0);
  expect(p[2]).toBeCloseTo(2.85);
});

test('five presets', () => {
  expect(Object.keys(VIEWS).sort()).toEqual(['front', 'iso', 'side', 'top', 'under']);
});

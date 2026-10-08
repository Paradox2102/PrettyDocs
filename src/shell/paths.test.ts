import { afterEach, expect, test } from 'vitest';
import { formatBuilt } from './paths';

const original = process.env.TZ;
afterEach(() => { process.env.TZ = original; });

test('a date-only value shows the same day in a US time zone', () => {
  // Regression: "2026-10-08" parsed as UTC midnight printed "7 Oct 2026" in Los Angeles.
  process.env.TZ = 'America/Los_Angeles';
  expect(formatBuilt('2026-10-08')).toBe('8 Oct 2026');
});

test('a full timestamp keeps its local day', () => {
  process.env.TZ = 'America/Los_Angeles';
  expect(formatBuilt('2026-10-08T11:20:56-07:00')).toBe('8 Oct 2026');
});

test('text that is not a date comes back as it is', () => {
  expect(formatBuilt('soon')).toBe('soon');
});

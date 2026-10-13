import { expect, test } from 'vitest';
import { ICONS } from '../test/fixtures';
import type { IconIndex } from '../content/types';
import { groupBy, groupIcons } from './icons';

const index = ICONS as IconIndex;

test('by type: the types in index order, each with its icons', () => {
  const groups = groupIcons(index, 'type');
  expect(groups.map((g) => [g.id, g.name, g.icons.map((i) => i.slug)])).toEqual([
    ['power', 'Power', ['rev-pdh']],
    ['communication', 'Radio and CAN', ['canivore', 'vh-109']],
  ]);
});

test('by vendor: vendors in name order; icons in type order, then name order', () => {
  const groups = groupIcons(index, 'vendor');
  expect(groups.map((g) => [g.id, g.name, g.icons.map((i) => i.slug)])).toEqual([
    ['vendor-ctre', 'CTR Electronics', ['canivore']],
    ['vendor-rev', 'REV Robotics', ['rev-pdh']],
    ['vendor-vivid-hosting', 'Vivid-Hosting', ['vh-109']],
  ]);
});

test('by vendor, a vendor with icons of two types lists the earlier type first', () => {
  const two: IconIndex = { ...index, icons: [
    { ...index.icons[1], slug: 'z-radio', name: 'A radio', vendor: 'rev', vendor_name: 'REV Robotics' },
    ...index.icons,
  ] };
  expect(groupIcons(two, 'vendor').find((g) => g.id === 'vendor-rev')!.icons.map((i) => i.slug))
    .toEqual(['rev-pdh', 'z-radio']);
});

test('the ?by= value: vendor is vendor; anything else is type', () => {
  expect(groupBy('vendor')).toBe('vendor');
  expect(groupBy(null)).toBe('type');
  expect(groupBy('color')).toBe('type');
});

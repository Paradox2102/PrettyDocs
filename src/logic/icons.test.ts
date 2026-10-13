import { describe, expect, test } from 'vitest';
import { ICONS } from '../test/fixtures';
import type { IconIndex } from '../content/types';
import { filterIcons, groupBy, groupIcons } from './icons';

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

test('by vendor, the generic vendor (several makers) comes last', () => {
  const withGeneric: IconIndex = { ...index, icons: [
    ...index.icons,
    { ...index.icons[0], slug: 'frc-battery', name: 'FRC Robot Battery', vendor: 'generic', vendor_name: 'Several makers' },
    { ...index.icons[0], slug: 'z-dev', name: 'Z', vendor: 'zeta', vendor_name: 'Zeta Parts' },
  ] };
  expect(groupIcons(withGeneric, 'vendor').map((g) => g.id)).toEqual([
    'vendor-ctre', 'vendor-rev', 'vendor-vivid-hosting', 'vendor-zeta', 'vendor-generic',
  ]);
});

describe('filterIcons', () => {
  test('an empty query keeps every icon', () => {
    expect(filterIcons(index, '  ').icons).toHaveLength(index.icons.length);
  });
  test('matches the name, the vendor name, the part number and the slug, any case', () => {
    expect(filterIcons(index, 'canivore').icons.map((i) => i.slug)).toEqual(['canivore']);
    expect(filterIcons(index, 'rev robotics').icons.map((i) => i.slug)).toEqual(['rev-pdh']);
    expect(filterIcons(index, 'REV-11-1850').icons.map((i) => i.slug)).toEqual(['rev-pdh']);
    expect(filterIcons(index, 'vh-109').icons.map((i) => i.slug)).toEqual(['vh-109']);
  });
  test('every word must match (in any field)', () => {
    expect(filterIcons(index, 'ctr canivore').icons.map((i) => i.slug)).toEqual(['canivore']);
    expect(filterIcons(index, 'ctr radio').icons).toEqual([]);
  });
  test('an icon with no part number still matches by name', () => {
    expect(filterIcons(index, 'radio').icons.map((i) => i.slug)).toEqual(['vh-109']);
  });
});

test('groupIcons drops a group with no icons', () => {
  expect(groupIcons(filterIcons(index, 'canivore'), 'type').map((g) => g.id)).toEqual(['communication']);
});

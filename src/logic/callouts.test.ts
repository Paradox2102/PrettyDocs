import { expect, test } from 'vitest';
import { layoutCallouts } from './callouts';

const ys = (m: Map<string, number>, ids: string[]) => ids.map((id) => m.get(id));

test('labels with room stay level with their marks', () => {
  const m = layoutCallouts([{ id: 'a', y: 0 }, { id: 'b', y: 30 }], { top: -50, bottom: 50, gap: 10 });
  expect(ys(m, ['a', 'b'])).toEqual([0, 30]);
});

test('close labels keep the gap and the order of their marks', () => {
  const m = layoutCallouts([{ id: 'b', y: 2 }, { id: 'a', y: 0 }, { id: 'c', y: 3 }], { top: -50, bottom: 50, gap: 10 });
  expect(ys(m, ['a', 'b', 'c'])).toEqual([0, 10, 20]);
});

test('a crowded bottom pushes the labels up, inside the column', () => {
  const m = layoutCallouts([{ id: 'a', y: 40 }, { id: 'b', y: 45 }, { id: 'c', y: 48 }], { top: -50, bottom: 50, gap: 10 });
  expect(ys(m, ['a', 'b', 'c'])).toEqual([30, 40, 50]);
});

test('labels above the top move down to it', () => {
  const m = layoutCallouts([{ id: 'a', y: -80 }], { top: -50, bottom: 50, gap: 10 });
  expect(m.get('a')).toBe(-50);
});

test('more labels than fit spread evenly from top to bottom', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, y: 0 }));
  const m = layoutCallouts(items, { top: 0, bottom: 20, gap: 10 });
  expect(ys(m, ['a', 'b', 'c', 'd', 'e'])).toEqual([0, 5, 10, 15, 20]);
});

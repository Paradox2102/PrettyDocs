import { Object3D } from 'three';
import { describe, expect, test } from 'vitest';
import { BUILDERS } from '../three/controllers';
import { MODELS } from './models';
import { outlinePath } from './outline';

describe.each(Object.values(MODELS))('$id', (model) => {
  const ids = model.inputs.map((n) => n.id);
  const views = Object.values(model.views);

  test('input ids are unique', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('every input has a mark in at least one view', () => {
    const marked = new Set(views.flatMap((v) => v.marks.map((m) => m.input)));
    expect(ids.filter((id) => !marked.has(id))).toEqual([]);
  });
  test('every mark names an input of the model, once per view', () => {
    for (const v of views) {
      const marks = v.marks.map((m) => m.input);
      expect(marks.filter((id) => !ids.includes(id))).toEqual([]);
      expect(new Set(marks).size).toBe(marks.length);
    }
  });
  test('the 3D model has exactly one object for each input', () => {
    const found: string[] = [];
    BUILDERS[model.id]().traverse((o: Object3D) => {
      if (typeof o.userData.input === 'string') found.push(o.userData.input);
    });
    expect(found.sort()).toEqual([...ids].sort());
  });
  test('the outline has at least three points', () => {
    expect(model.outline.length).toBeGreaterThanOrEqual(3);
  });
});

test('outlinePath draws a closed smooth path through the points', () => {
  const d = outlinePath([[0, 0], [10, 0], [10, 10], [0, 10]]);
  expect(d.startsWith('M0 0')).toBe(true);
  expect(d.match(/C/g)).toHaveLength(4);
  expect(d.endsWith('Z')).toBe(true);
});

import { readFileSync } from 'node:fs';
import { Object3D, type Group } from 'three';
import { describe, expect, test } from 'vitest';
import { BUILT_IN } from '../three/controllers';
import { fromXboxGlb } from '../three/controllers/xbox-stand-in';
import { MODELS } from './models';
import { outlinePath } from './outline';

function inputsOf(g: Group): string[] {
  const found: string[] = [];
  g.traverse((o: Object3D) => {
    if (typeof o.userData.input === 'string') found.push(o.userData.input);
  });
  return found.sort();
}

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
  test('the built-in 3D model has exactly one object for each input', () => {
    expect(inputsOf(BUILT_IN[model.id]())).toEqual([...ids].sort());
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

test('the Xbox stand-in model has exactly one object for each Wolverine V2 input, with its own materials', async () => {
  const file = readFileSync(`${process.cwd()}/src/three/controllers/xbox-controller.glb`);
  // A copy made with this realm's ArrayBuffer: GLTFLoader checks `instanceof ArrayBuffer`.
  const bytes = new ArrayBuffer(file.byteLength);
  new Uint8Array(bytes).set(file);
  const g = await fromXboxGlb(bytes);
  expect(inputsOf(g)).toEqual(MODELS['razer-wolverine-v2'].inputs.map((n) => n.id).sort());
  // A bound input is recoloured, so no two inputs may share a material.
  const owner = new Map<unknown, string>();
  g.traverse((o) => {
    let id: string | undefined;
    for (let p: Object3D | null = o; p; p = p.parent) if (typeof p.userData.input === 'string') { id = p.userData.input; break; }
    const m = (o as { material?: unknown }).material;
    if (!id || !m) return;
    expect(owner.get(m) ?? id).toBe(id);
    owner.set(m, id);
  });
});

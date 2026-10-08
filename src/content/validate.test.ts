import { describe, expect, test } from 'vitest';
import { ContentError, validateIndex, validateScene, validateWiring } from './validate';
import { INDEX, WIRING } from '../test/fixtures';

const clone = <T,>(x: T): T => structuredClone(x);
const SCENE = { meta: { document: 'd', microversion: 'm', cell_mm: 4, built: 'b', triangles: 1 }, groups: [],
  devices: [], systemcore: { anchor: [0, 0, 0] }, buses: [], layers: [] };

describe('validateIndex', () => {
  test('a good index passes and comes back unchanged', () => {
    expect(validateIndex(clone(INDEX))).toEqual(INDEX);
  });
  test('latest must name a robot in the list', () => {
    expect(() => validateIndex({ ...clone(INDEX), latest: 'nope' })).toThrow(/latest/);
  });
  test('a robot id must be lowercase letters, digits and dashes', () => {
    const bad = clone(INDEX);
    bad.robots[0].id = 'Bad_ID';
    expect(() => validateIndex(bad)).toThrow(/robots\[0\]\.id/);
  });
  test('an unknown doc kind is refused', () => {
    const bad = clone(INDEX) as unknown as { robots: { docs: string[] }[] };
    bad.robots[1].docs = ['wiring', 'cad'];
    expect(() => validateIndex(bad)).toThrow(/robots\[1\]\.docs/);
  });
  test('an empty robot list is refused', () => {
    expect(() => validateIndex({ latest: 'a', robots: [] })).toThrow(/robots/);
  });
  test('the error is a ContentError', () => {
    expect(() => validateIndex(null)).toThrow(ContentError);
  });
});

describe('validateWiring', () => {
  test('a good wiring document passes', () => {
    expect(validateWiring(clone(WIRING))).toEqual(WIRING);
  });
  test('a device without derived facts is refused, by path', () => {
    const bad = clone(WIRING) as unknown as { devices: Record<string, { derived?: unknown }> };
    delete bad.devices['left-pi'].derived;
    expect(() => validateWiring(bad)).toThrow(/devices\.left-pi\.derived/);
  });
  test('view must be four numbers', () => {
    expect(() => validateWiring({ ...clone(WIRING), view: [0, 0, 1] })).toThrow(/view/);
  });
});

describe('validateScene', () => {
  test('a good scene passes', () => {
    expect(validateScene(clone(SCENE))).toEqual(SCENE);
  });
  test('a scene without buses is refused', () => {
    const { buses: _buses, ...bad } = clone(SCENE);
    expect(() => validateScene(bad)).toThrow(/buses/);
  });
});

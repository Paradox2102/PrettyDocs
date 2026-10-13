import { describe, expect, test } from 'vitest';
import { ContentError, validateControls, validateIcons, validateIndex, validateMechanical, validateScene, validateWiring } from './validate';
import { CONTROLS, ICONS, INDEX, MECHANICAL, WIRING } from '../test/fixtures';

const clone = <T,>(x: T): T => structuredClone(x);
const SCENE = { meta: { document: 'd', microversion: 'm', cell_mm: 4, built: 'b', triangles: 1 }, groups: [],
  devices: [], systemcore: { anchor: [0, 0, 0] }, buses: [], layers: [] };

const group = (tris: number, drive: unknown) => ({ id: 'shooter', label: 'Shooter', box: [0, 0, 1, 1, 0, 1],
  mesh: { pos: '', min: [0, 0, 0], scale: [1, 1, 1], idx: '', idx32: false, tris },
  ...(drive === undefined ? {} : { drive_tris: drive }) });

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
  test('a group may count its power-transfer triangles; an older scene without the count still passes', () => {
    const scene = { ...clone(SCENE), groups: [group(4, 2), group(4, undefined)] };
    expect(validateScene(scene)).toEqual(scene);
  });
  test('drive_tris must be a whole number no larger than the group mesh', () => {
    for (const bad of [5, -1, 1.5, '2']) {
      expect(() => validateScene({ ...clone(SCENE), groups: [group(4, bad)] })).toThrow(/groups\[0\]\.drive_tris/);
    }
  });
  test('a scene without buses is refused', () => {
    const { buses: _buses, ...bad } = clone(SCENE);
    expect(() => validateScene(bad)).toThrow(/buses/);
  });
});

describe('validateMechanical', () => {
  const good = () => structuredClone(MECHANICAL);
  test('a good file passes', () => {
    expect(validateMechanical(good())).toEqual(MECHANICAL);
  });
  test('a fact without a source is refused, by path', () => {
    const bad = good() as unknown as { subsystems: { facts: { source?: string }[] }[] };
    delete bad.subsystems[1].facts[1].source;
    expect(() => validateMechanical(bad)).toThrow(/subsystems\[1\]\.facts\[1\]\.source/);
  });
  test('subsystem ids must be unique', () => {
    const bad = good();
    bad.subsystems[1].id = 'swerve';
    expect(() => validateMechanical(bad)).toThrow(/subsystems.*unique/);
  });
  test('a bad subsystem id is refused', () => {
    const bad = good();
    bad.subsystems[0].id = 'Bad_ID';
    expect(() => validateMechanical(bad)).toThrow(/subsystems\[0\]\.id/);
  });
  test('an empty subsystem list is refused', () => {
    expect(() => validateMechanical({ updated: 'x', subsystems: [] })).toThrow(/subsystems/);
  });
});

describe('validateControls', () => {
  const MODELS = {
    'razer-wolverine-v2': { inputs: [{ id: 'ls' }, { id: 'rb' }, { id: 'lt' }] },
    'logitech-extreme-3d-pro': { inputs: [{ id: 'b1' }] },
  };
  type Doc = { controllers: { id: string; model: string; bindings: { input: string; how: string }[] }[] };
  const bad = (change: (c: Doc) => void) => {
    const c = clone(CONTROLS) as unknown as Doc;
    change(c);
    return () => validateControls(c, MODELS);
  };
  test('a good file passes and comes back unchanged', () => {
    expect(validateControls(clone(CONTROLS), MODELS)).toEqual(CONTROLS);
  });
  test('an unknown model is refused', () => {
    expect(bad((c) => { c.controllers[0].model = 'xbox-elite'; })).toThrow(/controllers\[0\]\.model/);
  });
  test('an input the model does not have is refused', () => {
    expect(bad((c) => { c.controllers[0].bindings[1].input = 'paddle'; })).toThrow(/controllers\[0\]\.bindings\[1\]\.input/);
  });
  test('two bindings on one input are refused', () => {
    expect(bad((c) => { c.controllers[0].bindings[1].input = 'ls'; })).toThrow(/controllers\[0\]\.bindings\[1\]\.input/);
  });
  test('an unknown how is refused', () => {
    expect(bad((c) => { c.controllers[0].bindings[0].how = 'toggle'; })).toThrow(/controllers\[0\]\.bindings\[0\]\.how/);
  });
  test('controller ids must be unique', () => {
    expect(bad((c) => { c.controllers[1].id = 'gamepad'; })).toThrow(/controllers/);
  });
  test('a controller with no bindings is valid', () => {
    expect(validateControls(clone(CONTROLS), MODELS).controllers[1].bindings).toEqual([]);
  });
});

describe('validateIcons', () => {
  test('a good icon index passes and comes back unchanged', () => {
    expect(validateIcons(clone(ICONS))).toEqual(ICONS);
  });
  test('an icon of a type that the types list does not name is refused', () => {
    const bad = clone(ICONS);
    bad.icons[0].type = 'motors';
    expect(() => validateIcons(bad)).toThrow(/icons\[0\]\.type/);
  });
  test('an icon path must be type/vendor/slug.svg', () => {
    const bad = clone(ICONS);
    bad.icons[1].path = '../../content/robots.json';
    expect(() => validateIcons(bad)).toThrow(/icons\[1\]\.path/);
  });
  test('the status is current or legacy', () => {
    const bad = clone(ICONS) as unknown as { icons: { status: string }[] };
    bad.icons[2].status = 'beta';
    expect(() => validateIcons(bad)).toThrow(/icons\[2\]\.status/);
  });
  test('size_mm is two numbers', () => {
    const bad = clone(ICONS) as unknown as { icons: { size_mm: unknown }[] };
    bad.icons[0].size_mm = [1];
    expect(() => validateIcons(bad)).toThrow(/icons\[0\]\.size_mm/);
  });
});

describe('validateIndex reserved ids', () => {
  test('a robot id that is a site path is refused', () => {
    const bad = clone(INDEX);
    bad.robots[0].id = 'icons';
    expect(() => validateIndex(bad)).toThrow(/robots\[0\]\.id/);
  });
});

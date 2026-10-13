// Checks the real exported content in public/content. This test fails the Docker build when an export is
// incomplete or does not match the shapes the site reads.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { MODELS } from '../controllers/models';
import { validateControls, validateIcons, validateIndex, validateMechanical, validateScene, validateWiring } from './validate';
import type { DocKind } from './types';

const CONTENT = join(process.cwd(), 'public', 'content');
const NEEDS: Record<DocKind, string[]> = {
  wiring: ['wiring.json', 'poster.svg', 'top-view.svg'],
  '3d': ['scene.json'],
  devices: ['wiring.json'],
  mechanical: ['mechanical.json', 'wiring.json'],
  controls: ['controls.json'],
};

const index = validateIndex(JSON.parse(readFileSync(join(CONTENT, 'robots.json'), 'utf8')));

describe.each(index.robots.map((r) => [r.id, r]))('robot %s', (_id, robot) => {
  const folder = join(CONTENT, 'robots', robot.id);
  const files = [...new Set(robot.docs.flatMap((d) => NEEDS[d]))];

  test.each(files)('%s exists and is valid', (file) => {
    const path = join(folder, file);
    expect(existsSync(path), `${path} is missing`).toBe(true);
    const text = readFileSync(path, 'utf8');
    if (file === 'wiring.json') validateWiring(JSON.parse(text));
    else if (file === 'scene.json') validateScene(JSON.parse(text));
    else if (file === 'mechanical.json') validateMechanical(JSON.parse(text));
    else if (file === 'controls.json') validateControls(JSON.parse(text), MODELS);
    else expect(text.startsWith('<svg')).toBe(true);
  });
});

// The mechanical file names registry mechanisms and scene groups by hand: a rename on either side must fail the
// build instead of leaving an empty devices table or a blank 3D view.
describe.each(index.robots.filter((r) => r.docs.includes('mechanical')).map((r) => [r.id, r]))(
  'mechanical file of %s', (_id, robot) => {
    const folder = join(CONTENT, 'robots', robot.id);
    const mech = validateMechanical(JSON.parse(readFileSync(join(folder, 'mechanical.json'), 'utf8')));
    const wiring = validateWiring(JSON.parse(readFileSync(join(folder, 'wiring.json'), 'utf8')));
    const mechanisms = new Set(Object.values(wiring.devices).map((d) => d.mechanism));

    test.each(mech.subsystems.flatMap((s) => s.mechanisms.map((m) => [s.id, m])))(
      '%s: mechanism "%s" matches a device', (_s, m) => {
        expect(mechanisms.has(m), `no device has mechanism "${m}"`).toBe(true);
      });

    if (robot.docs.includes('3d')) {
      const scene = validateScene(JSON.parse(readFileSync(join(folder, 'scene.json'), 'utf8')));
      const groups = new Set(scene.groups.map((g) => g.id));
      test.each(mech.subsystems.flatMap((s) => s.groups.map((g) => [s.id, g])))(
        '%s: group "%s" is in the scene', (_s, g) => {
          expect(groups.has(g), `scene has no group "${g}"`).toBe(true);
        });
    }
  });

describe('icon collection', () => {
  const ICONS = join(process.cwd(), 'public', 'icons');
  const icons = validateIcons(JSON.parse(readFileSync(join(ICONS, 'index.json'), 'utf8')));

  test('every icon in index.json exists', () => {
    const missing = icons.icons.filter((i) => !existsSync(join(ICONS, i.path))).map((i) => i.path);
    expect(missing).toEqual([]);
  });
  test('each type count matches its icons', () => {
    for (const t of icons.types) expect(icons.icons.filter((i) => i.type === t.id).length, t.id).toBe(t.count);
  });
});

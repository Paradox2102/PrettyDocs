// Checks the real exported content in public/content. This test fails the Docker build when an export is
// incomplete or does not match the shapes the site reads.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { validateIndex, validateScene, validateWiring } from './validate';
import type { DocKind } from './types';

const CONTENT = join(process.cwd(), 'public', 'content');
const NEEDS: Record<DocKind, string[]> = {
  wiring: ['wiring.json', 'poster.svg', 'top-view.svg'],
  '3d': ['scene.json'],
  devices: ['wiring.json'],
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
    else expect(text.startsWith('<svg')).toBe(true);
  });
});

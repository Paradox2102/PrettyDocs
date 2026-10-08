// Shape checks for the content files. They check the fields the pages read and name the path of the first bad
// field, so a broken export says where it broke.
import { DOC_KINDS, type RobotIndex, type Scene, type WiringData } from './types';

export class ContentError extends Error {
  name = 'ContentError';
}

const ROBOT_ID = /^[a-z0-9][a-z0-9-]*$/;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

function fail(path: string, what: string): never {
  throw new ContentError(`${path}: ${what}`);
}
function obj(x: unknown, path: string): Obj {
  return isObj(x) ? x : fail(path, 'must be an object');
}
function arr(x: unknown, path: string): unknown[] {
  return Array.isArray(x) ? x : fail(path, 'must be a list');
}
function str(x: unknown, path: string): string {
  return typeof x === 'string' ? x : fail(path, 'must be text');
}

export function validateIndex(x: unknown): RobotIndex {
  const index = obj(x, 'robots.json');
  const robots = arr(index.robots, 'robots');
  if (robots.length === 0) fail('robots', 'must list at least one robot');
  const ids = robots.map((r, i) => {
    const robot = obj(r, `robots[${i}]`);
    const id = str(robot.id, `robots[${i}].id`);
    if (!ROBOT_ID.test(id)) fail(`robots[${i}].id`, `"${id}" must match ${ROBOT_ID}`);
    for (const k of ['name', 'season', 'summary', 'built']) str(robot[k], `robots[${i}].${k}`);
    const docs = arr(robot.docs, `robots[${i}].docs`);
    for (const d of docs) {
      if (!(DOC_KINDS as unknown[]).includes(d)) fail(`robots[${i}].docs`, `unknown doc kind "${String(d)}"`);
    }
    return id;
  });
  if (new Set(ids).size !== ids.length) fail('robots', 'robot ids must be unique');
  const latest = str(index.latest, 'latest');
  if (!ids.includes(latest)) fail('latest', `"${latest}" is not in the robot list`);
  return x as RobotIndex;
}

export function validateWiring(x: unknown): WiringData {
  const w = obj(x, 'wiring.json');
  str(w.built, 'built');
  const view = arr(w.view, 'view');
  if (view.length !== 4 || !view.every((v) => typeof v === 'number')) fail('view', 'must be four numbers');
  const devices = obj(w.devices, 'devices');
  for (const [key, d] of Object.entries(devices)) {
    const dev = obj(d, `devices.${key}`);
    if (dev.key !== key) fail(`devices.${key}.key`, 'must equal the device key');
    const der = obj(dev.derived, `devices.${key}.derived`);
    const tag = arr(der.pdh_tag, `devices.${key}.derived.pdh_tag`);
    if (tag.length !== 2) fail(`devices.${key}.derived.pdh_tag`, 'must be [text, style]');
    arr(der.open_reasons, `devices.${key}.derived.open_reasons`);
  }
  return x as WiringData;
}

export function validateScene(x: unknown): Scene {
  const s = obj(x, 'scene.json');
  obj(s.meta, 'meta');
  for (const k of ['groups', 'devices', 'buses', 'layers']) arr(s[k], k);
  const sc = obj(s.systemcore, 'systemcore');
  arr(sc.anchor, 'systemcore.anchor');
  (s.devices as unknown[]).forEach((d, i) => {
    const dev = obj(d, `devices[${i}]`);
    arr(dev.anchor, `devices[${i}].anchor`);
    obj(dev.mesh, `devices[${i}].mesh`);
  });
  (s.buses as unknown[]).forEach((b, i) => arr(obj(b, `buses[${i}]`).chain, `buses[${i}].chain`));
  return x as Scene;
}

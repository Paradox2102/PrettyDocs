// Shape checks for the content files. They check the fields the pages read and name the path of the first bad
// field, so a broken export says where it broke.
import { DOC_KINDS, HOWS, type ControlsData, type IconIndex, type MechanicalData, type RobotIndex, type Scene, type WiringData } from './types';

export class ContentError extends Error {
  name = 'ContentError';
}

const ROBOT_ID = /^[a-z0-9][a-z0-9-]*$/;
/** Site paths: a robot with one of these ids could not be reached at /<id>. */
const RESERVED_IDS = ['icons', 'assets', 'content'];
const ICON_PATH = /^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\.svg$/;

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
    if (RESERVED_IDS.includes(id)) fail(`robots[${i}].id`, `"${id}" is a site path`);
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

const isNumList = (x: unknown, n: number) => Array.isArray(x) && x.length === n && x.every((v) => typeof v === 'number');

export function validateIcons(x: unknown): IconIndex {
  const index = obj(x, 'icons/index.json');
  str(index.license, 'license');
  str(index.attribution, 'attribution');
  const types = arr(index.types, 'types').map((t, i) => {
    const type = obj(t, `types[${i}]`);
    str(type.name, `types[${i}].name`);
    if (typeof type.count !== 'number') fail(`types[${i}].count`, 'must be a number');
    return str(type.id, `types[${i}].id`);
  });
  arr(index.icons, 'icons').forEach((ic, i) => {
    const p = `icons[${i}]`;
    const icon = obj(ic, p);
    for (const k of ['slug', 'name', 'vendor', 'vendor_name']) str(icon[k], `${p}.${k}`);
    const type = str(icon.type, `${p}.type`);
    if (!types.includes(type)) fail(`${p}.type`, `"${type}" is not in the types list`);
    const path = str(icon.path, `${p}.path`);
    if (!ICON_PATH.test(path)) fail(`${p}.path`, `"${path}" must be <type>/<vendor>/<slug>.svg`);
    if (icon.status !== 'current' && icon.status !== 'legacy') fail(`${p}.status`, 'must be "current" or "legacy"');
    if (!isNumList(icon.size_mm, 2)) fail(`${p}.size_mm`, 'must be two numbers');
    if (!isNumList(icon.view_box, 4)) fail(`${p}.view_box`, 'must be four numbers');
    arr(icon.anchors, `${p}.anchors`);
  });
  return x as IconIndex;
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
  (s.groups as unknown[]).forEach((g, i) => {
    const group = obj(g, `groups[${i}]`);
    const tris = obj(group.mesh, `groups[${i}].mesh`).tris;
    const drive = group.drive_tris;
    if (drive !== undefined && !(Number.isInteger(drive) && (drive as number) >= 0 && (drive as number) <= (tris as number))) {
      fail(`groups[${i}].drive_tris`, `must be a whole number from 0 to the mesh's ${String(tris)} triangles`);
    }
  });
  (s.devices as unknown[]).forEach((d, i) => {
    const dev = obj(d, `devices[${i}]`);
    arr(dev.anchor, `devices[${i}].anchor`);
    obj(dev.mesh, `devices[${i}].mesh`);
  });
  (s.buses as unknown[]).forEach((b, i) => arr(obj(b, `buses[${i}]`).chain, `buses[${i}].chain`));
  return x as Scene;
}

function strList(x: unknown, path: string): string[] {
  return arr(x, path).map((v, i) => str(v, `${path}[${i}]`));
}

export function validateMechanical(x: unknown): MechanicalData {
  const m = obj(x, 'mechanical.json');
  str(m.updated, 'updated');
  const subs = arr(m.subsystems, 'subsystems');
  if (subs.length === 0) fail('subsystems', 'must list at least one subsystem');
  const ids = subs.map((s, i) => {
    const sub = obj(s, `subsystems[${i}]`);
    const id = str(sub.id, `subsystems[${i}].id`);
    if (!ROBOT_ID.test(id)) fail(`subsystems[${i}].id`, `"${id}" must match ${ROBOT_ID}`);
    str(sub.name, `subsystems[${i}].name`);
    str(sub.summary, `subsystems[${i}].summary`);
    strList(sub.mechanisms, `subsystems[${i}].mechanisms`);
    strList(sub.groups, `subsystems[${i}].groups`);
    strList(sub.notes, `subsystems[${i}].notes`);
    arr(sub.facts, `subsystems[${i}].facts`).forEach((f, j) => {
      const path = `subsystems[${i}].facts[${j}]`;
      const fact = obj(f, path);
      for (const k of ['label', 'value', 'source']) str(fact[k], `${path}.${k}`);
      if (fact.uncertain !== undefined) str(fact.uncertain, `${path}.uncertain`);
    });
    return id;
  });
  if (new Set(ids).size !== ids.length) fail('subsystems', 'subsystem ids must be unique');
  return x as MechanicalData;
}

/** The part of a controller model the validator needs: its input ids. */
export type ModelInputs = Record<string, { inputs: { id: string }[] }>;

export function validateControls(x: unknown, models: ModelInputs): ControlsData {
  const c = obj(x, 'controls.json');
  str(c.updated, 'updated');
  str(c.source, 'source');
  const ctrls = arr(c.controllers, 'controllers');
  if (ctrls.length === 0) fail('controllers', 'must list at least one controller');
  const ids = ctrls.map((k, i) => {
    const path = `controllers[${i}]`;
    const ctrl = obj(k, path);
    const id = str(ctrl.id, `${path}.id`);
    if (!ROBOT_ID.test(id)) fail(`${path}.id`, `"${id}" must match ${ROBOT_ID}`);
    for (const f of ['name', 'code_name', 'summary']) str(ctrl[f], `${path}.${f}`);
    if (!Number.isInteger(ctrl.port) || (ctrl.port as number) < 0) fail(`${path}.port`, 'must be a whole number from 0');
    const modelId = str(ctrl.model, `${path}.model`);
    const model = Object.hasOwn(models, modelId) ? models[modelId] : fail(`${path}.model`, `unknown controller model "${modelId}"`);
    const known = new Set(model.inputs.map((n) => n.id));
    const used = new Set<string>();
    arr(ctrl.bindings, `${path}.bindings`).forEach((b, j) => {
      const bp = `${path}.bindings[${j}]`;
      const binding = obj(b, bp);
      const input = str(binding.input, `${bp}.input`);
      if (!known.has(input)) fail(`${bp}.input`, `"${input}" is not an input of ${modelId}`);
      if (used.has(input)) fail(`${bp}.input`, `"${input}" has two bindings`);
      used.add(input);
      for (const f of ['label', 'action', 'code']) str(binding[f], `${bp}.${f}`);
      if (!(HOWS as unknown[]).includes(binding.how)) fail(`${bp}.how`, `must be one of ${HOWS.join(', ')}`);
    });
    strList(ctrl.notes, `${path}.notes`);
    return id;
  });
  if (new Set(ids).size !== ids.length) fail('controllers', 'controller ids must be unique');
  return x as ControlsData;
}

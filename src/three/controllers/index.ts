import type { Group } from 'three';
import { buildExtreme3dPro } from './extreme-3d-pro';
import { buildWolverineV2 } from './wolverine-v2';
import { loadXboxStandIn } from './xbox-stand-in';

/** The 3D model built from shapes, for each controller model id in src/controllers/models.ts. */
export const BUILT_IN: Record<string, () => Group> = {
  'razer-wolverine-v2': buildWolverineV2,
  'logitech-extreme-3d-pro': buildExtreme3dPro,
};

/** Models drawn from a mesh file. If the file does not load, the built-in model is used. */
const FROM_FILE: Record<string, () => Promise<Group>> = {
  'razer-wolverine-v2': loadXboxStandIn,
};

const cache = new Map<string, Promise<Group>>();

/** The 3D model of a controller, loaded once per page load and kept (the canvas does not dispose it). */
export function loadModel(id: string): Promise<Group> {
  let p = cache.get(id);
  if (!p) {
    const file = FROM_FILE[id];
    p = file ? file().catch(() => BUILT_IN[id]()) : Promise.resolve().then(() => BUILT_IN[id]());
    cache.set(id, p);
  }
  return p;
}

import type { Group } from 'three';
import { buildExtreme3dPro } from './extreme-3d-pro';
import { buildWolverineV2 } from './wolverine-v2';

/** A 3D builder for each controller model id in src/controllers/models.ts. */
export const BUILDERS: Record<string, () => Group> = {
  'razer-wolverine-v2': buildWolverineV2,
  'logitech-extreme-3d-pro': buildExtreme3dPro,
};

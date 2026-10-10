import { EXTREME_3D_PRO } from './extreme-3d-pro';
import type { ControllerModel } from './types';
import { WOLVERINE_V2 } from './wolverine-v2';

/** Every controller model the site can draw, by id. A robot's controls.json names one per controller. */
export const MODELS: Record<string, ControllerModel> = {
  [WOLVERINE_V2.id]: WOLVERINE_V2,
  [EXTREME_3D_PRO.id]: EXTREME_3D_PRO,
};

import type { Vec3 } from '../content/types';

export type ViewName = 'top' | 'front' | 'side' | 'iso' | 'under';

/** Camera offsets in units of the frame radius (from the old robot-can-viewer.html). */
export const VIEWS: Record<ViewName, Vec3> = {
  top: [-0.02, 0, 2.6],
  under: [-0.02, 0, -2.4],
  front: [2.8, 0, 0.45],
  side: [0, 2.8, 0.45],
  iso: [1.9, 1.7, 1.3],
};

export const VIEW_LABELS: Record<ViewName, string> = { top: 'Top', front: 'Front', side: 'Side', iso: '3/4', under: 'Under' };

export function cameraPosition(view: ViewName, center: Vec3, radius: number): Vec3 {
  const o = VIEWS[view];
  return [center[0] + o[0] * radius, center[1] + o[1] * radius, center[2] + o[2] * radius];
}

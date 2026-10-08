// Scene rules that need no WebGL: the registry-to-scene key map, the device focus, the toggle list and the frame.
import type { Scene, SceneDevice, Vec3 } from '../content/types';
import { BUS_COLORS, LAYER_COLORS, labelLines } from './viewer';

export interface Toggle {
  id: string;
  name: string;
  fn: string;
  count: number;
  color: string;
}

const LAYER_ORDER = ['power', 'network', 'electronics'];

/** Scene devices (and the SystemCore) by registry key. */
export function sceneByRegistryKey(scene: Scene): Map<string, SceneDevice> {
  const m = new Map<string, SceneDevice>();
  for (const d of [...scene.devices, scene.systemcore]) if (d.registry_key) m.set(d.registry_key, d);
  return m;
}

/** Where a device is and which toggle shows it: its bus, else its first layer in the order power, network, electronics. */
export function focusFor(scene: Scene, registryKey: string): { anchor: Vec3; toggle: string } | null {
  const d = sceneByRegistryKey(scene).get(registryKey);
  if (!d) return null;
  const toggle = d.bus ?? LAYER_ORDER.find((l) => d.layers?.includes(l)) ?? d.layers?.[0];
  return toggle ? { anchor: d.anchor, toggle } : null;
}

/** One toggle per CAN loop, then one per layer, as in the old viewer. */
export function toggleList(scene: Scene): Toggle[] {
  return [
    ...scene.buses.map((b) => ({ id: b.bus, name: b.bus, fn: b.function, count: b.chain.length, color: BUS_COLORS[b.bus] })),
    ...scene.layers.map((l) => ({ id: l.id, name: l.label, fn: l.function, count: l.members.length, color: LAYER_COLORS[l.id] })),
  ];
}

/**
 * The view centre and radius: the swerve footprint, because the CAD has some parts far outside the robot.
 * Box order is [xmin, ymin, xmax, ymax, zmin, zmax]. Without a swerve group, all groups together.
 */
export function frame(scene: Scene): { center: Vec3; radius: number; foot: [number, number, number, number] } {
  const boxes = scene.groups.filter((g) => g.id === 'swerve').map((g) => g.box);
  const use = boxes.length ? boxes : scene.groups.map((g) => g.box);
  const x0 = Math.min(...use.map((b) => b[0]));
  const y0 = Math.min(...use.map((b) => b[1]));
  const x1 = Math.max(...use.map((b) => b[2]));
  const y1 = Math.max(...use.map((b) => b[3]));
  return {
    center: [(x0 + x1) / 2, (y0 + y1) / 2, 0.25],
    radius: Math.max(x1 - x0, y1 - y0) * 0.95,
    foot: [x0, y0, x1, y1],
  };
}

/** The hover label for a scene device, with its wire order when it is on a CAN bus. */
export function tipLines(scene: Scene, device: SceneDevice): string[] {
  const bus = device.bus ? scene.buses.find((b) => b.bus === device.bus) : undefined;
  return labelLines(device, bus?.chain.length);
}

/**
 * The view centre and radius for some groups (a subsystem): the union of their boxes, centred in all three axes.
 * Box order is [xmin, ymin, xmax, ymax, zmin, zmax]. No matching group: the whole-robot frame.
 */
export function frameGroups(scene: Scene, ids: string[]): { center: Vec3; radius: number } {
  const boxes = scene.groups.filter((g) => ids.includes(g.id)).map((g) => g.box);
  if (boxes.length === 0) {
    const f = frame(scene);
    return { center: f.center, radius: f.radius };
  }
  const lo = [0, 1, 4].map((i) => Math.min(...boxes.map((b) => b[i])));
  const hi = [2, 3, 5].map((i) => Math.max(...boxes.map((b) => b[i])));
  return {
    center: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2],
    radius: 0.95 * Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]),
  };
}

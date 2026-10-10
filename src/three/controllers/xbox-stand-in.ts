// The Wolverine V2 in 3D, from a free Xbox controller model (the same button layout). The GLB was split into one node
// per input by scripts/controllers/split_xbox_glb.py; the Xbox controller has no M1, M2 or Share, and its stick press
// is part of the stick, so those are added here as built-in parts.
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import glbUrl from './xbox-controller.glb?url';
import { box, disc, inputPart, labelOffset } from './parts';

// The credit line (CC BY 4.0) is WOLVERINE_V2.credit3d in src/controllers/wolverine-v2.ts.

/** Builds the model from the GLB bytes. Units in the file are millimetres; the group is in metres. */
export async function fromXboxGlb(data: ArrayBuffer): Promise<Group> {
  const gltf = await new GLTFLoader().parseAsync(data, '');
  const model = gltf.scene;
  const boxes = new Map<string, Box3>();
  model.updateMatrixWorld(true);
  for (const node of [...model.children]) {
    const id = node.userData.input;
    if (typeof id !== 'string') continue;
    boxes.set(id, new Box3().setFromObject(node));
    // Each input gets its own materials, so colouring a bound input does not colour its neighbours.
    node.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const m = (o.material as MeshStandardMaterial).clone();
      m.userData.base = m.color.clone();
      o.material = m;
    });
  }
  const at = (id: string) => boxes.get(id)!;
  const centre = (id: string) => at(id).getCenter(new Vector3());

  // Stick presses: a small disc in the dip of each stick cap.
  for (const id of ['ls', 'rs']) {
    const c = centre(id);
    model.add(withBase(inputPart(`${id}-press`, disc(3.2, 0.8, [c.x, c.y, at(id).max.z - 1.6]))));
  }
  // Share: under the Xbox button, between View and Menu, as on the Wolverine V2.
  const view = centre('view');
  model.add(withBase(inputPart('share', box([6, 3.5, 2], [0, view.y - 7, at('view').max.z - 1]))));
  // M1 and M2 sit on the top edge between the bumper and the trigger, inboard of both.
  for (const [id, b, t, s] of [['m1', 'lb', 'lt', -1], ['m2', 'rb', 'rt', 1]] as const) {
    const bc = centre(b);
    const tc = centre(t);
    const inner = Math.min(Math.abs(at(b).min.x), Math.abs(at(b).max.x)); // the bumper's end nearest the middle
    const x = s * (inner - 6);
    model.add(withBase(inputPart(id, box([9, 4, 5], [x, Math.max(at(b).max.y, at(t).max.y) - 3, (bc.z + tc.z) / 2]))));
  }
  for (const node of model.children) {
    const id = node.userData.input as string | undefined;
    if (id === 'lb' || id === 'rb') labelOffset(node as Group, [id === 'lb' ? -16 : 16, 8, 8]);
    if (id === 'lt' || id === 'rt') labelOffset(node as Group, [id === 'lt' ? -30 : 30, 2, -2]);
    if (id === 'y') labelOffset(node as Group, [0, 4, 0]);
    if (id === 'x') labelOffset(node as Group, [-8, -5, 0]);
    if (node.userData.labelOffset === undefined) node.userData.labelOffset = [0, 0, 0];
  }
  const g = new Group();
  g.add(model);
  g.scale.setScalar(0.001);
  return g;
}

/** Built-in parts keep the part color as their base. */
function withBase(g: Group): Group {
  g.traverse((o) => {
    if (o instanceof Mesh) (o.material as MeshStandardMaterial).userData.base = new Color((o.material as MeshStandardMaterial).color);
  });
  return g;
}

export async function loadXboxStandIn(): Promise<Group> {
  const r = await fetch(glbUrl);
  if (!r.ok) throw new Error(`${glbUrl} did not load (${r.status})`);
  return fromXboxGlb(await r.arrayBuffer());
}

// Shapes for the controller models. Model units are millimetres; 3D x = drawing x, 3D y = -drawing y, +z up.
import { BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape,
  SphereGeometry, TorusGeometry } from 'three';
import { smoothSegments } from '../../controllers/outline';
import type { Pt } from '../../controllers/types';

export const BODY_COLOR = 0x2b2f36;
export const PART_COLOR = 0x17191d;

export type V3 = [number, number, number];

export const material = (color: number) => new MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05 });

/** The front-view outline, extruded up from z = 0 with a rounded edge. */
export function extrudeOutline(points: Pt[], depth: number, bevel: number): Mesh {
  const flip = (p: Pt): Pt => [p[0], -p[1]];
  const shape = new Shape();
  shape.moveTo(...flip(points[0]));
  for (const [a, b, c] of smoothSegments(points)) shape.bezierCurveTo(...flip(a), ...flip(b), ...flip(c));
  const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8,
    bevelSegments: 4, curveSegments: 10 });
  geo.translate(0, 0, bevel);
  return new Mesh(geo, material(BODY_COLOR));
}

function placed(geo: BufferGeometry, at: V3, rot: V3 = [0, 0, 0]): Mesh {
  const m = new Mesh(geo);
  m.position.set(...at);
  m.rotation.set(...rot);
  return m;
}

/** An upright cylinder (axis +z) whose bottom sits at at[2]. */
export const disc = (r: number, h: number, at: V3, rTop = r) =>
  placed(new CylinderGeometry(rTop, r, h, 28).rotateX(Math.PI / 2), [at[0], at[1], at[2] + h / 2]);

export const box = (size: V3, at: V3, rot?: V3) => placed(new BoxGeometry(...size), at, rot);

export const blob = (radii: V3, at: V3) => placed(new SphereGeometry(1, 32, 20).scale(...radii), at);

export const ring = (r: number, tube: number, at: V3) => placed(new TorusGeometry(r, tube, 10, 48), at);

/** One input: its meshes share one material, so the page can colour the input as a whole. */
export function inputPart(id: string, ...meshes: Mesh[]): Group {
  const g = new Group();
  g.userData.input = id;
  g.name = id;
  const m = material(PART_COLOR);
  for (const mesh of meshes) {
    mesh.material = m;
    g.add(mesh);
  }
  return g;
}

/** The whole model in metres. */
export function inMetres(...children: (Mesh | Group)[]): Group {
  const g = new Group();
  g.add(...children);
  g.scale.setScalar(0.001);
  return g;
}

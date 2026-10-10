import { EXTREME_3D_PRO } from '../../controllers/extreme-3d-pro';
import { blob, box, disc, extrudeOutline, inMetres, inputPart, ring } from './parts';

const BASE_TOP = 24;
const GRIP = 110;
/** The head: an ellipsoid on top of the grip. */
const HEAD = { x: 0, y: 5, z: BASE_TOP + GRIP + 8, rx: 28, ry: 34, rz: 20 };

/** Height of the head's top surface over (x, y). */
function headTop(x: number, y: number): number {
  const u = (x - HEAD.x) / HEAD.rx;
  const v = (y - HEAD.y) / HEAD.ry;
  return HEAD.z + HEAD.rz * Math.sqrt(Math.max(0, 1 - u * u - v * v));
}

/** The Extreme 3D Pro on its base, the pilot at -y. Positions follow the top view (drawing y = -3D y). */
export function buildExtreme3dPro() {
  const top = EXTREME_3D_PRO.views.front.marks;
  const headButton = (n: number) => {
    const m = top.find((k) => k.input === `b${n}`)!;
    return inputPart(`b${n}`, disc(4.5, 3, [m.x, -m.y, headTop(m.x, -m.y) - 1.5]));
  };
  const baseButton = (n: number) => {
    const m = top.find((k) => k.input === `b${n}`)!;
    return inputPart(`b${n}`, disc(4.5, 3, [m.x, -m.y, BASE_TOP]));
  };
  return inMetres(
    extrudeOutline(EXTREME_3D_PRO.outline, 14, 5),
    inputPart('stick', disc(24, GRIP, [0, HEAD.y, BASE_TOP], 20), blob([HEAD.rx, HEAD.ry, HEAD.rz], [HEAD.x, HEAD.y, HEAD.z])),
    inputPart('twist', ring(27, 2.4, [0, HEAD.y, BASE_TOP + 24])),
    inputPart('hat', disc(3, 5, [0, 24, headTop(0, 24) - 1]), blob([5, 5, 3.5], [0, 24, headTop(0, 24) + 4])),
    inputPart('b1', box([9, 6, 18], [0, HEAD.y + HEAD.ry - 2, HEAD.z - 14], [0.35, 0, 0])),
    inputPart('b2', box([6, 10, 7], [-HEAD.rx + 1, 0, HEAD.z + 2])),
    headButton(3), headButton(4), headButton(5), headButton(6),
    ...[7, 8, 9, 10, 11, 12].map(baseButton),
    inputPart('throttle', box([12, 24, 10], [-64, 46, BASE_TOP + 4], [0.3, 0, 0])),
  );
}

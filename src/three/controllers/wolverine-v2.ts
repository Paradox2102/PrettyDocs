import { WOLVERINE_V2 } from '../../controllers/wolverine-v2';
import { box, disc, extrudeOutline, inMetres, inputPart, type V3 } from './parts';

const FACE = 26;

function stick(id: string, x: number, y: number) {
  return [
    inputPart(id, disc(5, 6, [x, y, FACE]), disc(10.5, 3, [x, y, FACE + 6], 9.5)),
    inputPart(`${id}-press`, disc(3.5, 0.8, [x, y, FACE + 9])),
  ];
}

/** The Wolverine V2 lying flat, face up, the bumpers away from the driver (+y). */
export function buildWolverineV2() {
  const face = (id: string, x: number, y: number) => inputPart(id, disc(5, 3, [x, y, FACE]));
  const small = (id: string, x: number, y: number, r = 3) => inputPart(id, disc(r, 2, [x, y, FACE]));
  const tilt = 0.21;
  const bumper = (id: string, s: number) => inputPart(id, box([40, 8, 8], [s * 50, 50, 18], [0, 0, -s * tilt]));
  const trigger = (id: string, s: number) => inputPart(id, box([22, 14, 16], [s * 52, 45, 4], [-0.45, 0, -s * tilt]));
  const mButton = (id: string, s: number) => inputPart(id, box([9, 4, 5] as V3, [s * 24, 48.5, 12]));
  return inMetres(
    extrudeOutline(WOLVERINE_V2.outline, 14, 6),
    ...stick('ls', -42, 18),
    ...stick('rs', 22, -12),
    face('y', 44, 29), face('x', 33, 18), face('b', 55, 18), face('a', 44, 7),
    inputPart('dpad', box([19, 6.5, 3], [-22, -12, FACE + 1.5]), box([6.5, 19, 3], [-22, -12, FACE + 1.5])),
    small('view', -13, 19), small('menu', 13, 19), small('xbox', 0, 36, 6.5),
    inputPart('share', box([6, 3.5, 2], [0, 12, FACE + 1])),
    bumper('lb', -1), bumper('rb', 1), trigger('lt', -1), trigger('rt', 1), mButton('m1', -1), mButton('m2', 1),
  );
}

// Razer Wolverine V2 (wired, Xbox layout). Positions are drawn to look right, not measured. M1 and M2 sit on the
// top edge between the bumpers and the triggers (hands-on reviews); M1 is drawn on the left.
import { outlinePath, roundRect } from './outline';
import type { ControllerModel, Pt } from './types';

const OUTLINE: Pt[] = [
  [-62, -44], [-34, -50], [0, -46], [34, -50], [62, -44], [76, -26], [80, 0], [77, 24], [71, 44], [61, 57],
  [48, 55], [38, 40], [20, 29], [0, 27], [-20, 29], [-38, 40], [-48, 55], [-61, 57], [-71, 44], [-77, 24],
  [-80, 0], [-76, -26],
];

/** The top edge seen from behind, turned toward you so that the left trigger stays on the left. */
const EDGE: Pt[] = [
  [-76, -16], [-46, -23], [0, -19], [46, -23], [76, -16], [81, 0], [75, 16], [50, 24], [24, 18], [0, 16],
  [-24, 18], [-50, 24], [-75, 16], [-81, 0],
];

const cross = (x: number, y: number, arm: number, w: number) => {
  const [a, h] = [arm / 2, w / 2];
  return `M${x - h} ${y - a}H${x + h}V${y - h}H${x + a}V${y + h}H${x + h}V${y + a}H${x - h}V${y + h}H${x - a}` +
    `V${y - h}H${x - h}Z`;
};

export const WOLVERINE_V2: ControllerModel = {
  id: 'razer-wolverine-v2',
  name: 'Wolverine V2',
  maker: 'Razer',
  link: 'https://www.amazon.com/dp/B09CKFSRK7',
  outline: OUTLINE,
  inputs: [
    { id: 'ls', name: 'Left stick', short: 'LS', kind: 'stick' },
    { id: 'rs', name: 'Right stick', short: 'RS', kind: 'stick' },
    { id: 'lb', name: 'Left bumper', short: 'LB', kind: 'button' },
    { id: 'lt', name: 'Left trigger', short: 'LT', kind: 'trigger' },
    { id: 'rb', name: 'Right bumper', short: 'RB', kind: 'button' },
    { id: 'rt', name: 'Right trigger', short: 'RT', kind: 'trigger' },
    { id: 'a', name: 'A (south face)', short: 'A', kind: 'button' },
    { id: 'b', name: 'B (east face)', short: 'B', kind: 'button' },
    { id: 'x', name: 'X (west face)', short: 'X', kind: 'button' },
    { id: 'y', name: 'Y (north face)', short: 'Y', kind: 'button' },
    { id: 'dpad', name: 'D-pad', short: 'D-pad', kind: 'hat' },
    { id: 'ls-press', name: 'Left stick press', short: 'LS press', kind: 'button' },
    { id: 'rs-press', name: 'Right stick press', short: 'RS press', kind: 'button' },
    { id: 'view', name: 'View (back)', short: 'View', kind: 'button' },
    { id: 'menu', name: 'Menu (start)', short: 'Menu', kind: 'button' },
    { id: 'share', name: 'Share', short: 'Share', kind: 'button' },
    { id: 'xbox', name: 'Xbox (guide)', short: 'Xbox', kind: 'button' },
    { id: 'm1', name: 'M1 multi-function', short: 'M1', kind: 'button' },
    { id: 'm2', name: 'M2 multi-function', short: 'M2', kind: 'button' },
  ],
  views: {
    front: {
      title: 'Front',
      caption: 'The face, as the driver holds it.',
      box: [-80, -50, 80, 57],
      paths: [
        { d: outlinePath(OUTLINE), tone: 'body' },
        // Stick wells and the face-button pad.
        { d: 'M-55 -18a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z', tone: 'part' },
        { d: 'M9 12a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z', tone: 'part' },
      ],
      marks: [
        { input: 'xbox', shape: 'circle', x: 0, y: -36, r: 6.5, side: 'left' },
        { input: 'ls', shape: 'circle', x: -42, y: -18, r: 10, side: 'left' },
        { input: 'ls-press', shape: 'circle', x: -42, y: -18, r: 3.5, side: 'left' },
        { input: 'view', shape: 'circle', x: -13, y: -19, r: 3, side: 'left' },
        { input: 'share', shape: 'rect', x: 0, y: -12, w: 6, h: 3.5, side: 'left' },
        { input: 'dpad', shape: 'path', x: -22, y: 12, d: cross(-22, 12, 19, 6.5), side: 'left' },
        { input: 'y', shape: 'circle', x: 44, y: -29, r: 5, glyph: 'Y', side: 'right' },
        { input: 'menu', shape: 'circle', x: 13, y: -19, r: 3, side: 'right' },
        { input: 'x', shape: 'circle', x: 33, y: -18, r: 5, glyph: 'X', side: 'right' },
        { input: 'b', shape: 'circle', x: 55, y: -18, r: 5, glyph: 'B', side: 'right' },
        { input: 'a', shape: 'circle', x: 44, y: -7, r: 5, glyph: 'A', side: 'right' },
        { input: 'rs', shape: 'circle', x: 22, y: 12, r: 10, side: 'right' },
        { input: 'rs-press', shape: 'circle', x: 22, y: 12, r: 3.5, side: 'right' },
      ],
    },
    back: {
      title: 'Back',
      caption: 'The top edge, turned toward you: the left trigger stays on the left.',
      box: [-81, -23, 81, 24],
      paths: [
        { d: outlinePath(EDGE), tone: 'body' },
        { d: roundRect(0, -4, 9, 4, 1), tone: 'part' }, // USB-C
      ],
      marks: [
        { input: 'lb', shape: 'path', x: -50, y: -14, d: roundRect(-50, -14, 40, 8, 3.5), side: 'left' },
        { input: 'm1', shape: 'rect', x: -24, y: -6, w: 9, h: 5, side: 'left' },
        { input: 'lt', shape: 'path', x: -52, y: 7, d: roundRect(-52, 7, 26, 15, 5), side: 'left' },
        { input: 'rb', shape: 'path', x: 50, y: -14, d: roundRect(50, -14, 40, 8, 3.5), side: 'right' },
        { input: 'm2', shape: 'rect', x: 24, y: -6, w: 9, h: 5, side: 'right' },
        { input: 'rt', shape: 'path', x: 52, y: 7, d: roundRect(52, 7, 26, 15, 5), side: 'right' },
      ],
    },
  },
};

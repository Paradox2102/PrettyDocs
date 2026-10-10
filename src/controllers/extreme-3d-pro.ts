// Logitech Extreme 3D Pro. Button numbers are the WPILib button numbers (the joystick's own numbers). Positions are
// drawn to look right, not measured. The top view has the pilot at the bottom; the side view is from the left.
import { outlinePath, roundRect } from './outline';
import type { ControllerModel, InputDef, Mark, Pt } from './types';

const BASE: Pt[] = [
  [-58, -72], [0, -76], [58, -72], [84, -42], [88, 20], [84, 62], [66, 94], [0, 98], [-66, 94], [-84, 62],
  [-88, 20], [-84, -42],
];

/** The head and grip seen from the left: front (trigger side) on the left, pilot on the right. */
const GRIP_SIDE: Pt[] = [
  [-26, -76], [4, -82], [24, -70], [26, -40], [18, -10], [16, 30], [20, 64], [-16, 64], [-12, 30], [-16, 0],
  [-30, -30], [-34, -58],
];

const button = (n: number, name?: string): InputDef => ({ id: `b${n}`, name: name ?? `Button ${n}`, short: String(n),
  kind: 'button' });

/** Base buttons 7 to 12: two columns, three rows, at the pilot's left (7 and 8 farthest from the pilot). */
const baseButtons: Mark[] = [7, 8, 9, 10, 11, 12].map((n) => {
  const i = n - 7;
  return { input: `b${n}`, shape: 'circle', x: i % 2 ? -50 : -67, y: 42 + Math.floor(i / 2) * 16, r: 4.5,
    glyph: String(n), side: i % 2 ? 'right' : 'left' };
});

const twist = 'M-26 -30A36 36 0 0 1 26 -30M26 -30l-1 -7M26 -30l-7 1';

export const EXTREME_3D_PRO: ControllerModel = {
  id: 'logitech-extreme-3d-pro',
  name: 'Extreme 3D Pro',
  maker: 'Logitech',
  link: 'https://www.logitechg.com/en-us/shop/p/extreme-3d-pro-joystick.963290-0403',
  outline: BASE,
  inputs: [
    { id: 'stick', name: 'Stick (X and Y)', short: 'Stick', kind: 'stick' },
    { id: 'twist', name: 'Twist (Z)', short: 'Twist', kind: 'axis' },
    { id: 'throttle', name: 'Throttle', short: 'Throttle', kind: 'axis' },
    { id: 'hat', name: 'Hat switch', short: 'Hat', kind: 'hat' },
    button(1, 'Trigger (button 1)'),
    button(2, 'Thumb button (2)'),
    ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => button(n)),
  ],
  views: {
    front: {
      title: 'Top',
      caption: 'From above, with the pilot at the bottom.',
      box: [-88, -76, 88, 98],
      paths: [
        { d: outlinePath(BASE), tone: 'body' },
        { d: 'M-28 -5a28 34 0 1 0 56 0a28 34 0 1 0 -56 0Z', tone: 'part' }, // the head
      ],
      marks: [
        { input: 'throttle', shape: 'path', x: -64, y: -46, d: roundRect(-64, -46, 14, 26, 4), side: 'left' },
        { input: 'twist', shape: 'path', x: 26, y: -30, d: twist, side: 'right' },
        { input: 'hat', shape: 'circle', x: 0, y: -24, r: 6, side: 'right' },
        { input: 'b5', shape: 'circle', x: -13, y: -8, r: 4.5, glyph: '5', side: 'left' },
        { input: 'b6', shape: 'circle', x: 13, y: -8, r: 4.5, glyph: '6', side: 'right' },
        { input: 'b3', shape: 'circle', x: -13, y: 8, r: 4.5, glyph: '3', side: 'left' },
        { input: 'b4', shape: 'circle', x: 13, y: 8, r: 4.5, glyph: '4', side: 'right' },
        { input: 'b2', shape: 'rect', x: -29, y: 0, w: 5, h: 10, side: 'left' },
        ...baseButtons,
      ],
    },
    back: {
      title: 'Side',
      caption: 'From the pilot’s left: the front of the stick is on the left.',
      box: [-96, -82, 96, 98],
      paths: [
        { d: roundRect(0, 80, 190, 34, 12), tone: 'body' },
        { d: outlinePath(GRIP_SIDE), tone: 'body' },
      ],
      marks: [
        { input: 'hat', shape: 'circle', x: -4, y: -80, r: 5, side: 'left' },
        { input: 'b1', shape: 'path', x: -36, y: -40, d: roundRect(-36, -40, 9, 18, 3), side: 'left' },
        { input: 'b2', shape: 'rect', x: 2, y: -52, w: 9, h: 6, side: 'right' },
        { input: 'stick', shape: 'path', x: 0, y: 20, d: 'M-14 20H14M-14 20l5 -4M-14 20l5 4M14 20l-5 -4M14 20l-5 4',
          side: 'right' },
      ],
    },
  },
};

import type { Pt } from './types';

/** One cubic segment: two control points and the end point. */
export type Cubic = [Pt, Pt, Pt];

/** A closed Catmull-Rom curve through the points, as cubic Bezier segments from points[0] back to it. */
export function smoothSegments(points: Pt[], tension = 0.5): Cubic[] {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  const k = tension / 3;
  return points.map((_, i) => {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    return [c1, c2, p2];
  });
}

const num = (v: number) => String(Math.round(v * 100) / 100);
const pt = (p: Pt) => `${num(p[0])} ${num(p[1])}`;

/** SVG path data for the closed smooth outline. */
export function outlinePath(points: Pt[]): string {
  const segs = smoothSegments(points).map(([a, b, c]) => `C${pt(a)} ${pt(b)} ${pt(c)}`);
  return `M${pt(points[0])}${segs.join('')}Z`;
}

/** A rounded rectangle centred on (x, y), as SVG path data. */
export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const [l, t, rr, b] = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
  return `M${num(l + r)} ${num(t)}H${num(rr - r)}A${r} ${r} 0 0 1 ${num(rr)} ${num(t + r)}V${num(b - r)}` +
    `A${r} ${r} 0 0 1 ${num(rr - r)} ${num(b)}H${num(l + r)}A${r} ${r} 0 0 1 ${num(l)} ${num(b - r)}V${num(t + r)}` +
    `A${r} ${r} 0 0 1 ${num(l + r)} ${num(t)}Z`;
}

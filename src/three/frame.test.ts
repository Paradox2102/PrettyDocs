import { expect, test } from 'vitest';
import { drawFrame } from './frame';

function parts(order: string[], withLabels = true, withControls = true) {
  const scene = { name: 'scene' };
  const camera = { name: 'camera' };
  return {
    scene,
    camera,
    controls: withControls ? { update: (d?: number) => { order.push(`controls.update(${d})`); } } : null,
    gl: { render: (s: unknown, c: unknown) => { order.push(s === scene && c === camera ? 'gl.render' : 'gl.render(wrong args)'); } },
    labels: withLabels
      ? { render: (s: unknown, c: unknown) => { order.push(s === scene && c === camera ? 'labels.render' : 'labels.render(wrong args)'); } }
      : null,
  };
}

test('a frame moves the camera first, then draws the scene, then the labels (as the local viewer does)', () => {
  // Regression: labels drawn before controls.update used last frame's camera and trailed the models while turning.
  const order: string[] = [];
  drawFrame(parts(order), 0.016);
  expect(order).toEqual(['controls.update(0.016)', 'gl.render', 'labels.render']);
});

test('a frame without labels or controls (the overview hero before controls exist) still draws', () => {
  const order: string[] = [];
  drawFrame(parts(order, false, false), 0.016);
  expect(order).toEqual(['gl.render']);
});

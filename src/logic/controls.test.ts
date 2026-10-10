import { expect, test } from 'vitest';
import { MODELS } from '../controllers/models';
import type { ControllerDoc } from '../content/types';
import { CONTROLS } from '../test/fixtures';
import { bindingRows, howLabel, pickView, unusedInputs } from './controls';

const [pad, stick] = CONTROLS.controllers as ControllerDoc[];
const wolverine = MODELS['razer-wolverine-v2'];

test('rows follow the model input order, not the file order', () => {
  expect(bindingRows(pad, wolverine).map((r) => r.input.id)).toEqual(['ls', 'lt', 'rb']);
});

test('unused inputs are the rest of the model, in model order', () => {
  const unused = unusedInputs(pad, wolverine).map((n) => n.id);
  expect(unused).toHaveLength(wolverine.inputs.length - 3);
  expect(unused.slice(0, 3)).toEqual(['rs', 'lb', 'rt']);
});

test('a controller with no bindings has every input unused', () => {
  expect(unusedInputs(stick, MODELS['logitech-extreme-3d-pro'])).toHaveLength(16);
});

test('how labels', () => {
  const [ls, , rb] = bindingRows(pad, wolverine);
  expect(howLabel(ls.binding, ls.input)).toBe('Stick');
  expect(howLabel(rb.binding, rb.input)).toBe('Hold');
});

test('an unknown view falls back to front', () => {
  expect(pickView('back')).toBe('back');
  expect(pickView('3d')).toBe('3d');
  expect(pickView('sideways')).toBe('front');
  expect(pickView(null)).toBe('front');
});

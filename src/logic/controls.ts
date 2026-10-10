// Rules for the controls page that need no browser.
import type { ControllerModel, InputDef } from '../controllers/types';
import type { Binding, ControllerDoc } from '../content/types';

export type ViewKey = 'front' | 'back' | '3d';

export interface Row {
  input: InputDef;
  binding: Binding;
}

/** The bound inputs, in the model's input order. */
export function bindingRows(doc: ControllerDoc, model: ControllerModel): Row[] {
  const byInput = new Map(doc.bindings.map((b) => [b.input, b]));
  return model.inputs.flatMap((input) => {
    const binding = byInput.get(input.id);
    return binding ? [{ input, binding }] : [];
  });
}

export function unusedInputs(doc: ControllerDoc, model: ControllerModel): InputDef[] {
  const bound = new Set(doc.bindings.map((b) => b.input));
  return model.inputs.filter((n) => !bound.has(n.id));
}

export function howLabel(b: Binding, input: InputDef): string {
  if (b.how === 'hold') return 'Hold';
  if (b.how === 'press') return 'Press';
  return input.kind === 'stick' ? 'Stick' : 'Axis';
}

export function pickView(v: string | null): ViewKey {
  return v === 'back' || v === '3d' ? v : 'front';
}

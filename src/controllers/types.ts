// Controller models: the inputs of a driver station controller and how to draw it. Data only, no three.js, so the
// page's main chunk stays small; the 3D builders are in src/three/controllers. Units are millimetres, SVG axes
// (y down). Spec: docs/specs/2026-10-10-controls-page-design.md, Section 2.

export type Pt = [number, number];

export type InputKind = 'button' | 'trigger' | 'stick' | 'hat' | 'axis';

export interface InputDef {
  id: string;
  /** "Right bumper" */
  name: string;
  /** "RB": the key cap in the list and the callout. */
  short: string;
  kind: InputKind;
}

/** One input drawn in a view. (x, y) is the centre and the start of the leader line. */
export interface Mark {
  input: string;
  shape: 'circle' | 'rect' | 'path';
  x: number;
  y: number;
  /** circle radius */
  r?: number;
  /** rect size, centred on (x, y) */
  w?: number;
  h?: number;
  /** path data, in view coordinates */
  d?: string;
  /** Text drawn on the mark, for example "A". */
  glyph?: string;
  side: 'left' | 'right';
}

export interface ViewDef {
  /** The view switch label: "Front", "Back", "Top", "Side". */
  title: string;
  /** One line under the drawing that says how the controller is seen. */
  caption: string;
  /** The body's bounds; the callout columns go outside them. */
  box: [number, number, number, number];
  paths: { d: string; tone: 'body' | 'part' }[];
  marks: Mark[];
}

export interface ControllerModel {
  id: string;
  name: string;
  maker: string;
  link: string;
  inputs: InputDef[];
  views: { front: ViewDef; back: ViewDef };
  /** Where the 3D model comes from, when it is not built in code. CC BY asks for all of these and a note of changes. */
  credit3d?: { note: string; title: string; author: string; link: string; license: string; licenseLink: string;
    changes: string };
  /** The body outline of the front (or top) view; the SVG path and the 3D extrusion both use it. */
  outline: Pt[];
}

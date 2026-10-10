# Controls Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/:robot/controls` page that maps each driver station controller input to its robot action, in a list, front and back SVG drawings and a 3D model.

**Architecture:** A hand-kept `controls.json` per robot names a controller model and its bindings. Controller geometry (inputs, 2D views, 3D builder) lives in `src/controllers/`. The page joins the two; the 3D view is a lazy R3F chunk.

**Tech Stack:** React 19.3, React Router 8, R3F 9 + three 0.186 (no drei), Vitest 5, TypeScript 7, CSS modules.

**Spec:** `docs/specs/2026-10-10-controls-page-design.md`

## Global Constraints

- Doc kind id `controls`; route `/:robot/controls`; nav label "Controls".
- `how` values: `hold`, `press`, `axis`; badges "Hold", "Press", "Stick".
- URL state: hash = controller id; `?view=front|back|3d` (default front); `?detail=code`; `?input=<id>`.
- Model ids: `razer-wolverine-v2`, `logitech-extreme-3d-pro`.
- 2D units are millimetres; 3D units are metres, +z up, the user at -y.
- Colors only from tokens (`--surface`, `--line`, `--ink`, `--muted`, `--accent`); 3D reads them through `useCssColor`.
- Under 700 px the callouts hide; under 1100 px the layout stacks.

## Review Focus

1. A stale `?input=` for an input of the other controller after a controller switch: the selection must clear (Task 5 test).
2. A binding on an input that has no mark in the current view (LT in the front view): the row still selects; no crash (Task 5 test).
3. A controller with zero bindings: the list says so and every input is under "Not used" (Task 5 test).
4. Callouts that crowd at the bottom of a column: no overlap, none outside the viewBox (Task 3 test).
5. Older robots without `controls` in `docs`: no nav link, and the route shows "Page not found" (Task 4 test).

---

### Task 1: Content type, validator, loader hook, data file

**Files:**
- Modify: `src/content/types.ts`, `src/content/validate.ts`, `src/content/hooks.ts`, `src/content/load.ts`
- Create: `public/content/robots/2026-offseason/controls.json`
- Test: `src/content/validate.test.ts`

**Interfaces:**
- Produces: `type How = 'hold' | 'press' | 'axis'`; `interface Binding { input; label; how: How; action; code }`; `interface ControllerDoc { id; name; model; port: number; code_name; summary; bindings: Binding[]; notes: string[] }`; `interface ControlsData { updated; source; controllers: ControllerDoc[] }`; `validateControls(x: unknown, models: Record<string, {inputs: {id: string}[]}>): ControlsData`; `useControls(robot): ControlsData`; `ContentFile` gains `'controls.json'`; `DocKind` and `DOC_KINDS` gain `'controls'`.

- [ ] Step 1: Tests: a good file passes; `controllers[0].model` unknown fails with `controllers[0].model`; an unknown input fails with `controllers[0].bindings[1].input`; a repeated input fails; `how: "toggle"` fails; repeated controller ids fail.
- [ ] Step 2: Run `npx vitest run src/content/validate.test.ts`; expect FAIL.
- [ ] Step 3: Implement. The validator takes the model registry as an argument so the test can pass a small one; the hook passes `MODELS` from Task 2.
- [ ] Step 4: Write `controls.json` with the spec Section 1 table and the joystick note; add `controls` to `robots.json` docs.
- [ ] Step 5: Run `npm run check`; expect PASS. Commit.

### Task 2: Controller models

**Files:**
- Create: `src/controllers/types.ts`, `src/controllers/wolverine-v2.ts`, `src/controllers/extreme-3d-pro.ts`, `src/controllers/models.ts`, `src/controllers/outline.ts`
- Test: `src/controllers/models.test.ts`

**Interfaces:**
- Produces: `interface InputDef { id; name; short; kind: 'button'|'trigger'|'stick'|'hat'|'axis' }`; `interface Mark { input; shape: 'circle'|'rect'|'path'; x; y; w?; h?; r?; d?; side: 'left'|'right' }`; `interface ViewDef { viewBox: [number,number,number,number]; paths: { d: string; tone?: 'body'|'part' }[]; marks: Mark[] }`; `interface ControllerModel { id; name; maker; link; inputs: InputDef[]; views: { front: ViewDef; back: ViewDef }; build3d(): Group }`; `MODELS: Record<string, ControllerModel>`; `outlinePath(points: [number,number][]): string` (smooth closed path) and `outlineShape(points): Shape`.

- [ ] Step 1: Tests per model: each input has a mark in front or back; each mark names a known input; `build3d()` has exactly one object with `userData.input === id` for each input; the front outline has at least 3 points.
- [ ] Step 2: Run; expect FAIL.
- [ ] Step 3: Implement both models from the spec Section 2 input lists. Body from `ExtrudeGeometry(outlineShape(...))` with bevel; parts from cylinders and boxes.
- [ ] Step 4: Run; expect PASS. Commit.

### Task 3: Callout layout

**Files:**
- Create: `src/logic/callouts.ts`; Test: `src/logic/callouts.test.ts`

**Interfaces:**
- Produces: `layoutCallouts(items: { id: string; y: number }[], opts: { top: number; bottom: number; gap: number }): Map<string, number>` (label y per id).

- [ ] Step 1: Tests: order by y kept; gap >= `gap`; a crowded bottom pushes labels up so the last <= `bottom` and the first >= `top`.
- [ ] Step 2-4: FAIL, implement (sort, forward pass with max(y, prev+gap), backward pass from bottom), PASS. Commit.

### Task 4: Route, nav, icon, overview card

**Files:**
- Modify: `src/App.tsx`, `src/shell/paths.ts`, `src/shell/icons.tsx`, `src/pages/Overview.tsx`, `src/test/fixtures.ts`, `src/shell/paths.test.ts`
- Create: `src/pages/Controls.tsx` (heading only in this task)

- [ ] Step 1: Tests: `pageOf('/r/controls')` is `controls`; a robot without `controls` gets "Page not found" at `/2025-robot/controls`.
- [ ] Step 2-4: FAIL, implement, PASS. Commit.

### Task 5: The page (list, switches, 2D drawing)

**Files:**
- Modify: `src/pages/Controls.tsx`; Create: `src/pages/Controls.module.css`, `src/components/ControllerSheet.tsx`, `src/components/ControllerSheet.module.css`, `src/logic/controls.ts`
- Test: `src/pages/Controls.test.tsx`, `src/logic/controls.test.ts`

**Interfaces:**
- Produces: `bindingRows(doc, model): { input: InputDef; binding: Binding }[]` (model input order); `unusedInputs(doc, model): InputDef[]`; `<ControllerSheet model view bindings selected onSelect compact />`.

- [ ] Step 1: Tests: page opens on the gamepad with "Shoot" and "Hold"; `#joystick` shows the note and "Not used" lists all 16 joystick inputs; `?detail=code` shows `rightBumper()`; a row click writes `?input=rb` and the RB mark has `aria-pressed="true"`; `?view=back` shows the LT mark; selecting LT in front view row works; switching controller drops `?input`.
- [ ] Step 2-4: FAIL, implement, PASS. Commit.

### Task 6: 3D view

**Files:**
- Create: `src/three/ControllerCanvas.tsx`, `src/components/ControllerView.tsx`
- Test: in `src/pages/Controls.test.tsx`: `?view=3d` without WebGL shows "This browser cannot show 3D."

- [ ] Steps: test, FAIL, implement (OrbitControls no damping, labels on bound inputs, raycast pick via R3F `onClick` with `userData.input`), PASS. Commit.

### Task 7: Browser check and review

- [ ] `npm run check` and `npm run build` pass.
- [ ] Preview: both controllers, Front/Back/3D, dark mode, 375 px. Screenshots.
- [ ] One whole-branch review; fix findings; commit.

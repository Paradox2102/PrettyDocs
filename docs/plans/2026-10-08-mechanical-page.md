# Mechanical Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/:robot/mechanical` page: per subsystem (swerve, intake, shooter) its facts with sources, its devices from the wiring export, service notes, and the subsystem alone in 3D.

**Architecture:** A new doc kind `mechanical` with a hand-kept `mechanical.json` per robot, loaded and validated like the other content. Devices come from `wiring.json` by registry mechanism. The 3D view is a new `subsystem` mode of `RobotCanvas` with pure style and framing rules.

**Tech Stack:** as the site (React 19.3, React Router 8, R3F 9, three 0.186, Vitest 5); Python + pytest for the export change.

**Spec:** `docs/specs/2026-10-08-mechanical-page-design.md`

## Global Constraints

- Every fact in `mechanical.json` has a `source`; uncertain facts carry an `uncertain` reason and render amber (`--warn-bg`/`--warn-fg`).
- Seed values exactly as spec Section 1 lists them, with source text naming the constant and `robot code main f1fdf68`.
- Doc kind order everywhere: `wiring`, `3d`, `devices`, `mechanical`.
- Subsystem hash: `#<subsystem id>`; unknown or empty hash shows the first subsystem.
- No new runtime dependency.
- No push to `main` without the user's yes (a push deploys docs.team2102.org).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A future export (`export_prettydocs.py`) must not drop `"mechanical"` from the robot's `docs`. Test in Task 1.
- A registry rename (for example `Shooter` to `Shooter assembly`) must fail the build, not silently empty a devices table. Test in Task 1 (content cross-check).
- A browser without WebGL must still show the facts, devices and notes. Test in Task 4.
- A subsystem with a device that has no CAN (a sensor on a different bus) must render without a bubble and without a crash. Test in Task 2 (`subsystemDevices` row with no `can`) and Task 3 (bubbles only for CAN devices).
- A long fact source or note must wrap on a 375 px phone, with no horizontal page scroll. Check in Task 4.

---

### Task 1: Content, validation and the export merge

**Files:**
- Modify: `src/content/types.ts` (`DocKind` adds `'mechanical'`, `DOC_KINDS`, new `MechanicalData`), `src/content/validate.ts` (`validateMechanical`), `src/content/load.ts` (`ContentFile` adds `'mechanical.json'`), `src/content/hooks.ts` (`useMechanical`), `src/content/content.test.ts` (needs + cross-checks), `src/content/validate.test.ts`, `src/test/fixtures.ts` (`MECHANICAL` fixture, `SITE_FILES` entry, `INDEX` docs)
- Create: `public/content/robots/2026-offseason/mechanical.json` (seed); modify `public/content/robots.json` (`docs` adds `"mechanical"`)
- Modify (systemcore, untracked): `wiring/tools/export_prettydocs.py` (`merge_index` keeps unmanaged doc kinds), `wiring/tests/test_export_prettydocs.py`

**Interfaces:**
- Produces: `interface Fact {label: string; value: string; source: string; uncertain?: string}`; `interface Subsystem {id: string; name: string; summary: string; mechanisms: string[]; groups: string[]; facts: Fact[]; notes: string[]}`; `interface MechanicalData {updated: string; subsystems: Subsystem[]}`; `validateMechanical(x: unknown): MechanicalData`; `useMechanical(robot: string): MechanicalData`.

- [ ] **Step 1: Failing tests.** `validate.test.ts`: good file passes; a fact without `source` throws `/subsystems\[0\]\.facts\[1\]\.source/`; duplicate ids throw `/subsystems.*unique/`; id `Bad_ID` throws `/subsystems\[0\]\.id/`; empty `subsystems` throws. `content.test.ts`: for a robot with `mechanical`: `mechanical.json` exists and validates; every `mechanisms` value matches a device `mechanism` in its `wiring.json`; every `groups` id is in its `scene.json` groups (when the robot has `3d`). `test_export_prettydocs.py`: `merge_index` of an entry over an existing one whose docs are `["wiring","3d","devices","mechanical"]` keeps `"mechanical"` last.
- [ ] **Step 2: Run** `npx vitest run src/content` and the pytest file — Expected: FAIL.
- [ ] **Step 3: Implement** types, validator, loader, hook; the seed file from spec Section 1; `robots.json` docs; `merge_index`: `docs = entry docs + [d for d in old docs if d not in entry docs]`.
- [ ] **Step 4: Run** `npm run check` and the full systemcore suite — Expected: PASS.
- [ ] **Step 5: Commit** `feat: mechanical content file and validation`.

### Task 2: Subsystem rules

**Files:**
- Create: `src/logic/mechanical.ts`, `src/logic/mechanical.test.ts`
- Modify: `src/logic/scene.ts` (`frameGroups`), `src/logic/scene.test.ts`, `src/logic/viewer.ts` (`subsystemStyle`), `src/logic/viewer.test.ts`

**Interfaces:**
- Produces: `subsystemDevices(w: WiringData, s: Subsystem): Device[]` (registry order); `subsystemStyle(item: StyleItem & {registryKey?: string | null}, focus: {groups: Set<string>; devices: Set<string>}, ghost: number): Style` — focus group: neutral, opaque; other group: neutral at `ghost`; focus device: bus color (no bus: `DEVICE_NEUTRAL`), opaque; other device or SystemCore not in focus: opacity 0; `frameGroups(scene: Scene, ids: string[]): {center: Vec3; radius: number}` — union box of those groups, center z = box middle, radius = 0.95 × max(dx, dy, dz); falls back to `frame(scene)` when no id matches.

- [ ] **Step 1: Failing tests** for each rule with the fixtures (a device with no `can` in the result; ids that match nothing fall back to `frame`).
- [ ] **Step 2: Run** — Expected: FAIL. **Step 3: Implement.** **Step 4: Run** `npm run check` — PASS.
- [ ] **Step 5: Commit** `feat: subsystem device, style and framing rules`.

### Task 3: 3D subsystem mode

**Files:**
- Modify: `src/three/RobotCanvas.tsx`, `src/three/RobotModel.tsx`, `src/three/Cables.tsx` (export a `DeviceTags` component: CAN bubbles for given scene devices)

**Interfaces:**
- Consumes: `subsystemStyle`, `frameGroups`, `canTag`, `sceneByRegistryKey`.
- Produces: `RobotCanvas` prop `mode: 'showcase' | 'viewer' | 'subsystem'` and `focus?: {groups: string[]; devices: string[]}` (registry keys). Subsystem mode: no floor, no cables, label layer on, bubbles on focus devices that have a bus, controls on, camera from `frameGroups` at the 3/4 preset, background `--surface`.

- [ ] **Step 1:** `RobotModel` takes an optional `styleOf(item) => Style`; the default stays `styleFor(item, selected, ghost)`. Each item passes its registry key.
- [ ] **Step 2:** Subsystem mode wiring in `RobotCanvas`; `CameraRig` takes the framing from props.
- [ ] **Step 3: Run** `npm run check` — PASS (no WebGL in jsdom; checked in the browser in Task 4).
- [ ] **Step 4: Commit** `feat: 3D subsystem mode`.

### Task 4: Mechanical page, nav and overview card

**Files:**
- Create: `src/pages/Mechanical.tsx` (+ `.module.css`), `src/pages/Mechanical.test.tsx`
- Modify: `src/App.tsx` (route, lazy page), `src/shell/paths.ts` (`PAGE_LABELS`, `pageOf`), `src/shell/icons.tsx` (gear icon), `src/pages/Overview.tsx` (card text), `README.md` (how to edit `mechanical.json`)

- [ ] **Step 1: Failing tests:** `/2026-offseason/mechanical` shows h1 "Mechanical" and the first subsystem; `#shooter` selects Shooter; choosing "Intake" writes `#intake`; a fact shows its value and source; an uncertain fact shows its reason; a device row links to `/2026-offseason/wiring?device=<key>`; empty notes say "No service notes yet."; without WebGL the facts and devices still render and the 3D area says "This browser cannot show 3D."; a robot without `mechanical` has no "Mechanical" nav link.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** (3D panel lazy, as the hero). **Step 4: Run** `npm run check` — PASS.
- [ ] **Step 5: Browser check:** desktop and 375 px, light and dark; each subsystem's 3D view; no horizontal scroll; axe on the page (no violations).
- [ ] **Step 6: Commit** `feat: mechanical page`.

### Task 5: Review and release

- [ ] **Step 1:** Fresh reviewer on the branch (code-reviewer template, opus); fix Critical/Important with a failing test first.
- [ ] **Step 2:** Merge `mechanical-page` into `main` (fast-forward). Ask the user, then push; watch the deploy; `scripts/check-headers.sh https://docs.team2102.org`; load `/2026-offseason/mechanical` live.

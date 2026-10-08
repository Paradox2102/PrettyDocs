# PrettyDocs Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public React site at `docs.team2102.org` that shows the wiring docs and the 3D views of each Team 2102 robot, latest robot first.

**Architecture:** A Vite single-page app. Content files (JSON, SVG) in `public/content/` are written by an export script in `~/systemcore` and fetched at run time through a promise cache and React 19 `use()`. The 3D code is a lazy chunk built on React Three Fiber. A Caddy container on Railway serves `dist/`.

**Tech Stack:** React 19.3.0, React DOM 19.3.0, React Router 8.4.0 (declarative mode), Vite 8.3.4, @vitejs/plugin-react 6.1.2, TypeScript 7.0.2 (fall back to the newest 6.x if `tsc` fails on the toolchain), three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.9, Vitest 5.0.3, @testing-library/react 16.3.3, @testing-library/jest-dom, jsdom 30.1.2, @fontsource/barlow, @fontsource/barlow-semi-condensed, @fontsource/jetbrains-mono. Python 3 + pytest (systemcore side). Docker: `node:24-alpine`, `caddy:2.11-alpine`.

**Spec:** `docs/specs/2026-10-08-prettydocs-site-design.md`

## Global Constraints

- Exact versions above, pinned in `package.json` (no `^`). `package-lock.json` is committed.
- No request to any third-party host at run time: fonts self-hosted, no CDN, no analytics.
- Colors only through the tokens in spec Section 1. CAN bus and layer colors come from `src/logic/viewer.ts`.
- The poster and top-view SVGs keep their white paper look in both themes.
- Phone layout: 16 px side gutter, no horizontal page scroll at 375 px.
- Every control is reachable by keyboard and has a visible focus ring (`--accent`, 2 px).
- `localStorage` access is wrapped in try/catch; the site works without it.
- `prefers-reduced-motion: reduce`: no hero turn, no transitions.
- Content folder: `public/content/robots.json` and `public/content/robots/<id>/{wiring.json, poster.svg, top-view.svg, scene.json}`.
- Robot ids match `^[a-z0-9][a-z0-9-]*$`.
- Page titles: `<page> · <robot name> · Team 2102` (Overview: `<robot name> · Team 2102`).
- Do not edit `~/systemcore/wiring/cad3d/*` (another session edits it). Re-read any systemcore file before an edit.
- No `git push`, no Railway change, no DNS change without the user's yes in chat.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A robot URL with a trailing slash or capitals (`/2026-offseason/`, `/2026-Offseason/wiring`) must open the robot page (capitals redirect to the lowercase id). Test in Task 4.
- A reload or a shared link on a deep path (`/2026-offseason/3d?device=pdh`) on the deployed server must return the app, not a 404. Test in Task 9 (Caddy `try_files`).
- A device with no `can`, `power: null` or no `network` (cameras, battery) must render in the table and the panel without a crash, with empty cells. Test in Task 6.
- After a new export and deploy, a returning visitor must get the new data within 5 minutes: `index.html` is `no-cache`, `/content/*` is `max-age=300`. Test in Task 9 (response headers).
- On a phone, a one-finger drag or a pinch on the wiring sheet must pan or zoom the sheet, not scroll or zoom the page (`touch-action: none` on the sheet). Check in Task 5 (mobile preset).

---

### Task 1: Scaffold and logic ports

**Files:**
- Create: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `public/favicon.svg`, `src/main.tsx`, `src/App.tsx` (placeholder `<h1>PrettyDocs</h1>`), `src/test/setup.ts`, `.gitignore` (`node_modules`, `dist`, `.DS_Store`)
- Create: `src/logic/wiring.ts`, `src/logic/wiring.test.ts`, `src/logic/viewer.ts`, `src/logic/viewer.test.ts`
- Create: `src/styles/tokens.css`, `src/styles/base.css`

**Interfaces:**
- Produces (`src/logic/wiring.ts`): `type Mode = 'all'|'can'|'power'|'network'`, `type Sheet = 'wiring'|'top'`, `interface ViewBox {x:number;y:number;w:number;h:number}`, `MAX_ZOOM = 12`, `MODES: Mode[]`, `SHEETS: Sheet[]`, `MOTOR: Record<string,string>`, `search(devices: Record<string, Device>, query: string): string[]`, `isOpen(d: Device): boolean`, `panelRows(d: Device): {label:string; value:string; amber:boolean}[]`, `wheelFactor(deltaY:number, deltaMode:number): number`, `zoomAt(vb, factor, px, py, full): ViewBox`, `panBy(vb, dx, dy, full): ViewBox`, `centerOn(vb, bbox:[number,number,number,number], full): ViewBox`, `viewFromHash(hash:string): {sheet:Sheet; mode:Mode}`, `hashFor(sheet:Sheet, mode:Mode): string`.
- Produces (`src/logic/viewer.ts`): `BUS_COLORS`, `GROUP_COLORS`, `LAYER_COLORS`, `USB_COLOR`, `AMBER = '#9a6700'`, `DEVICE_NEUTRAL`, `SYSTEMCORE_COLOR`, `decodeMesh(md: MeshData): {positions: Float32Array; indices: Uint16Array|Uint32Array}`, `styleFor(item: StyleItem, selected: Set<string>, ghost: number): {color:string; opacity:number; transparent:boolean}`, `labelLines(d: SceneDevice): string[]`, `cablePoints(bus, devicesByKey, systemcoreAnchor): Vec3[]`, `layerCables(layer, anchorOf): Cable[]`, `cableLabel(c: Cable): {text:string; at:Vec3}|null`.
- `Device`, `SceneDevice`, `MeshData`, `Vec3` are declared in `src/content/types.ts` in this task (Task 3 adds the rest), with the fields used by the two ports.

- [ ] **Step 1: Scaffold.** Write the files by hand. `vite.config.ts` uses `@vitejs/plugin-react` and `test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'], css: true }`. `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`. Scripts: `dev` (`vite`), `build` (`vite build`), `preview` (`vite preview`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `check` (`npm run typecheck && npm run test`). `tsconfig.json`: `strict: true`, `jsx: react-jsx`, `moduleResolution: bundler`, `types: ["vite/client", "vitest/globals"]`.
- [ ] **Step 2: Tokens and base CSS.** `tokens.css` holds every token from spec Section 1 (light on `:root`, dark under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` and `:root[data-theme="dark"]`), plus `--font-display`, `--font-body`, `--font-mono`, `--radius: 8px`. `base.css`: box-sizing, `body { background: var(--bg); color: var(--ink); font: 16px/1.5 var(--font-body) }`, `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`, reduced-motion rule. `main.tsx` imports `@fontsource/barlow/{400,500,600}.css`, `@fontsource/barlow-semi-condensed/600.css`, `@fontsource/jetbrains-mono/{400,600}.css`, then the two CSS files. `favicon.svg`: navy (`#14213d`) rounded square, gold (`#f0b429`) "P".
- [ ] **Step 3: Port the tests.** Copy `~/systemcore/wiring/page/page-logic.test.mjs` to `src/logic/wiring.test.ts` and `~/systemcore/wiring/cad3d/tests/viewer-logic.test.mjs` to `src/logic/viewer.test.ts`. Change only the imports: `import { test } from 'vitest'`, keep `node:assert/strict`, import the named functions from `./wiring` and `./viewer`. Keep every case (18 + 18).
- [ ] **Step 4: Run** `npx vitest run src/logic` — Expected: FAIL (modules missing).
- [ ] **Step 5: Port the code.** `wiring.ts` from `page-logic.js` and `viewer.ts` from `viewer-logic.js`, same behavior, typed, as ES modules. `b64ToBytes` uses `atob` only. Drop `startupMessage` (the React pages own their messages).
- [ ] **Step 6: Run** `npm run check` — Expected: typecheck clean, 36 tests PASS. Run `npm run build` — Expected: `dist/index.html` written.
- [ ] **Step 7: Commit** `feat: scaffold Vite + React 19 app and port the wiring and viewer logic`.

### Task 2: Export script (systemcore) and the first export

**Files (in `~/systemcore`):**
- Create: `wiring/tools/export_prettydocs.py`, `wiring/tests/test_export_prettydocs.py`
- Output (in `~/PrettyDocs`): `public/content/robots.json`, `public/content/robots/2026-offseason/{wiring.json, poster.svg, top-view.svg, scene.json}`

**Interfaces:**
- Consumes: `wiring_model.load()`, `make_poster.poster_svg(model) -> (svg, layout)`, `make_top_view.top_view_svg(model, positions) -> (svg, layout)`, `make_page.page_data(model, pl, tl) -> dict`, `top_layout.load_positions(path=POSITIONS)`.
- Produces: `export(out: Path, robot: str, name: str, season: str, summary: str, latest: bool, robot_data: Path = CAD3D/"robot-data.js", positions: Path = POSITIONS) -> list[Path]`; `scene_from_js(text: str) -> dict`; `merge_index(index: dict | None, entry: dict, latest: bool) -> dict`; `main(argv=None)`. Exit code 1 with a one-line message on stderr for every error in spec Section 3.

- [ ] **Step 1: Write the failing tests** in `wiring/tests/test_export_prettydocs.py`:
  - `test_scene_from_js_strips_wrapper`: `scene_from_js('window.ROBOT = {"meta":{},"groups":[],"devices":[],"systemcore":{},"buses":[],"layers":[]};\n')` returns the dict.
  - `test_scene_from_js_rejects_missing_keys`: a JSON without `layers` raises `ValueError` naming `layers`.
  - `test_merge_index_new_robot_appends_and_sets_latest`: index with robot `a`; merge `b` with `latest=True` gives order `[a, b]`, `latest == "b"`.
  - `test_merge_index_replaces_same_id_in_place`: index `[a, b]`, merge new `a` gives `[a', b]`.
  - `test_merge_index_no_latest_keeps_latest`: `latest` stays `"a"` when `latest=False`.
  - `test_merge_index_none_creates`: `merge_index(None, entry, True) == {"latest": id, "robots": [entry]}`.
  - `test_export_writes_all_files(tmp_path)`: `tmp_path/"public"` exists; after `export(...)` the five files exist, `wiring.json` has `built`, `view`, 40 `devices`, each with `derived`; both SVG files start with `<svg`; `robots.json` entry has `id, name, season, summary, built, docs == ["wiring","3d","devices"]`. Uses the live registry, like the other wiring tests.
  - `test_main_without_public_dir_exits_1(tmp_path, capsys)`: exit code 1, stderr names `public/`.
  - `test_main_missing_robot_data_exits_1(tmp_path)`: `--robot-data tmp_path/"none.js"` gives exit code 1.
  - `test_bad_robot_id_exits_1(tmp_path)`: `--robot "Bad_ID"` gives exit code 1.
- [ ] **Step 2: Run** `uv run --directory ~/systemcore pytest wiring/tests/test_export_prettydocs.py -q` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `export_prettydocs.py`. CLI flags: `--out` (required), `--robot` (default `2026-offseason`), `--name` (`2026 Offseason`), `--season` (`2026`), `--summary` (`Wiring and 3D views of the 2026 offseason robot.`), `--no-latest`, `--robot-data`, `--positions`. Write each file to `<name>.tmp` and `os.replace` it. JSON: `wiring.json` and `robots.json` with `indent=1`, `scene.json` compact. `built` in the index entry = `wiring.json` `built`. After the write, print the files and the lines `cd <out> && git add public/content && git commit -m "content: export <robot>" && git push`.
- [ ] **Step 4: Run** the new tests, then the full suite `uv run --directory ~/systemcore pytest tests wiring/tests wiring/cad3d/tests -q` — Expected: all PASS.
- [ ] **Step 5: First export.** `cd ~/systemcore && python3 -I wiring/tools/export_prettydocs.py --out ~/PrettyDocs` — Expected: five files listed; `scene.json` about 4.4 MB.
- [ ] **Step 6: Commit** in systemcore: `feat: export the wiring docs and 3D scene to PrettyDocs`. Commit in PrettyDocs: `content: export 2026-offseason`.

### Task 3: Content layer

**Files:**
- Modify: `src/content/types.ts`
- Create: `src/content/validate.ts`, `src/content/load.ts`, `src/content/hooks.ts`, `src/content/validate.test.ts`, `src/content/content.test.ts`

**Interfaces:**
- Produces (`types.ts`): `DocKind = 'wiring'|'3d'|'devices'`; `RobotEntry {id; name; season; summary; built; docs: DocKind[]}`; `RobotIndex {latest: string; robots: RobotEntry[]}`; `Device` (registry fields: `key`, `icon?`, `type?`, `role?`, `mechanism?`, `module?`, `can?: {bus; id: string|null; id_uncertain?; code_name?} | null`, `power?: {pdh_channel?: number|null; pdh_uncertain?; fed_by?; note?} | null`, `network?: {ip?; name?; mac?; mac_note?; radio_port?; radio_port_uncertain?; host_note?} | null`, `attached_to?`, `attached_uncertain?`, `notes?: string[]`, `derived: Derived`); `Derived {wire_order: string|null; pdh_tag: [string, 'red'|'amber'|'none']; cad_comment: string|null; open: boolean; open_reasons: string[]; fed_by_role: string|null; attached_to_role: string|null; bbox: Bbox|null; top_bbox: Bbox|null}`; `WiringData {built: string; view: [number,number,number,number]; devices: Record<string, Device>}`; `Scene {meta: {document; microversion; cell_mm; built; triangles}; groups: {id; label; box; mesh: MeshData}[]; devices: SceneDevice[]; systemcore: SceneDevice; buses: {bus; function; chain: string[]; warning: string|null}[]; layers: {id; label; function; members: string[]; cables: CableSpec[]; tags: {device; text; style?}[]}[]}`.
- Produces (`validate.ts`): `validateIndex(x: unknown): RobotIndex`, `validateWiring(x: unknown): WiringData`, `validateScene(x: unknown): Scene`. Each throws `ContentError` with a message that names the path of the bad field (for example `robots[0].id`).
- Produces (`load.ts`): `contentUrl(robot: string, file: 'wiring.json'|'poster.svg'|'top-view.svg'|'scene.json'): string` (`/content/robots/<robot>/<file>`); `INDEX_URL = '/content/robots.json'`; `loadJson<T>(url, validate: (x: unknown) => T): Promise<T>`; `loadText(url): Promise<string>`; `forget(url?: string): void` (clears one entry or all, for Retry). One promise per URL; a rejected promise is removed from the cache.
- Produces (`hooks.ts`): `useIndex(): RobotIndex`, `useWiring(robot): WiringData`, `useSheetSvg(robot, sheet: Sheet): string`, `useScene(robot): Scene`. Each calls `use()` on the cached promise; callers wrap them in `<Suspense>` and `ErrorBoundary`.

- [ ] **Step 1: Write the failing tests.** `validate.test.ts`: a good index passes; `latest` not in `robots` throws `/latest/`; id `Bad_ID` throws `/robots\[0\]\.id/`; an unknown doc kind throws `/docs/`; a wiring doc without `derived` on a device throws `/devices\.<key>\.derived/`; a scene without `buses` throws `/buses/`. `content.test.ts` (Node fs, no fetch): reads `public/content/robots.json`, runs `validateIndex`; for every robot, every file that its `docs` need exists (`wiring` → `wiring.json`, `poster.svg`, `top-view.svg`; `3d` → `scene.json`; `devices` → `wiring.json`), JSON files pass their validators, SVG files start with `<svg`. `load.test.ts`: two `loadJson` calls for one URL call `fetch` once (mock `globalThis.fetch`); a 404 rejects with an error that names the URL and the status, and the next call fetches again; `forget(url)` makes the next call fetch again.
- [ ] **Step 2: Run** `npx vitest run src/content` — Expected: FAIL.
- [ ] **Step 3: Implement** the four files. Validators check shape only (types of the fields that the UI reads), not every optional field.
- [ ] **Step 4: Run** `npm run check` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: content types, validators and loaders`.

### Task 4: Shell, routing and theme

**Files:**
- Create: `src/theme.ts`, `src/theme.test.ts`, `src/shell/{Layout,Rail,TabBar,RobotSelect,ThemeButton,RobotRoute}.tsx` with CSS modules, `src/components/ErrorBoundary.tsx`, `src/components/Loading.tsx`, `src/pages/NotFound.tsx`, `src/App.test.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `useIndex()`, `forget()`.
- Produces: `type ThemeChoice = 'system'|'light'|'dark'`; `nextTheme(t): ThemeChoice` (system → light → dark → system); `readTheme(): ThemeChoice`; `applyTheme(t): void` (sets or removes `data-theme` on `<html>`, stores in `localStorage` key `prettydocs-theme`). `useRobot(): RobotEntry` (context set by `RobotRoute`). `pagePath(robot: string, page: 'overview'|DocKind): string` (`/r`, `/r/wiring`, `/r/3d`, `/r/devices`). `<ErrorBoundary onRetry?: () => void>` shows the message from spec Section 6 and a Retry button. Page components for Task 5 to 8 are placeholders here (`<h1>` with the page name).

- [ ] **Step 1: Write the failing tests.** `theme.test.ts`: the cycle order; `applyTheme('dark')` sets `data-theme="dark"`; `applyTheme('system')` removes it; with `localStorage.setItem` that throws, `applyTheme` does not throw. `App.test.tsx` (mock `fetch` for `robots.json` with two robots, `latest: "2026-offseason"`; render `<App/>` in a `MemoryRouter`):
  - `/` shows the heading "2026 Offseason" (redirect to `/2026-offseason`).
  - `/2026-offseason/` (trailing slash) shows "2026 Offseason".
  - `/2026-Offseason/wiring` ends at `/2026-offseason/wiring`.
  - `/nope` shows "Robot not found" and a link per robot.
  - `/2026-offseason/nope` shows "Page not found".
  - Change the robot select on `/2026-offseason/3d` to the other robot: location becomes `/<other>/3d`.
  - A robot whose `docs` lacks `3d`: no "3D" nav link, and `/<it>/3d` shows "Page not found".
  - `robots.json` fetch fails: "The docs index did not load" and a Retry button; Retry with a good fetch shows the robot.
- [ ] **Step 2: Run** `npx vitest run src/App.test.tsx src/theme.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Routes: `<Route index element={<Navigate to={latest} replace/>}/>`, `<Route path=":robot" element={<RobotRoute/>}>` with `index`, `wiring`, `3d`, `devices`, `*`. `RobotRoute` lowercases a mixed-case id with `<Navigate replace>`, renders `NotFound kind="robot"` for an unknown id, otherwise `<Layout>` with `<Outlet>` inside `<Suspense fallback={<Loading/>}>` and `ErrorBoundary`. Rail: team mark ("PARADOX" in display font + "2102" in mono), `RobotSelect`, `NavLink`s for the robot's pages, `ThemeButton`, "Data built <date>" from `robot.built` (format `8 Oct 2026`). Below 900 px: `TabBar` fixed at the bottom with safe-area padding; the rail becomes a top bar with the mark and the select. Each page sets `<title>` (Global Constraints).
- [ ] **Step 4: Run** `npm run check` — Expected: PASS.
- [ ] **Step 5: Check in the preview.** Add `.claude/launch.json` entry `prettydocs` (`npm run dev -- --port 5173 --strictPort`, port 5173). Open at desktop and the `mobile` preset, light and dark: rail, tab bar, select, theme button, focus rings.
- [ ] **Step 6: Commit** `feat: app shell, robot routes and theme`.

### Task 5: Wiring page

**Files:**
- Create: `src/components/WiringSheet.tsx` (+ `.module.css`), `src/components/DevicePanel.tsx` (+ css), `src/components/Segmented.tsx` (+ css), `src/pages/Wiring.tsx` (+ css), `src/components/WiringSheet.test.tsx`, `src/pages/Wiring.test.tsx`
- Create: `src/styles/sheet.css` (global rules for the injected SVG: the `mode-*`, `open-only` and `g.hl.on` rules from `page-template.html` lines 52 to 65, scoped under `.wiring-sheet`)

**Interfaces:**
- Consumes: `useWiring`, `useSheetSvg`, `useRobot`, `pagePath`, logic from Task 1.
- Produces: `<WiringSheet svg: string; full: ViewBox; mode: Mode; openOnly: boolean; selected: string|null; onSelect(key: string|null): void; ref?: Ref<SheetHandle>>` with `SheetHandle {fit(): void; zoomBy(f: number): void; centerOn(bbox: Bbox): void}`. `<DevicePanel device: Device; robot: string; from: 'wiring'|'3d'|'devices'; note?: string; onClose(): void>` renders `panelRows` and links to the two other pages with `?device=<key>`. `<Segmented<T> label: string; options: {value: T; label: string}[]; value: T; onChange(v: T)>` (radio group, arrow keys move).

- [ ] **Step 1: Write the failing tests.** `WiringSheet.test.tsx` with a small SVG fixture (`<svg><g data-key="a" data-info="can"/><g class="hl" data-key="a"/></svg>`): mode `can` puts class `mode-can` on the root `<svg>`; `openOnly` puts `open-only`; `selected="a"` puts `on` on `g.hl[data-key="a"]`; a click on `[data-key="a"]` calls `onSelect("a")`; a click on empty sheet calls `onSelect(null)`. `Wiring.test.tsx` (mock fetch with a 2-device `wiring.json` and fixture SVGs): the search box with "43" lists the device with CAN ID "42 / 43"; `?device=<key>` opens the panel with that role; hash `#top-power` checks "Top view" and "Power"; choosing "Network" sets the hash to `#network`; `?open=1` checks "Show only open items"; the panel of a device without a top-view bbox, on the top sheet, says "Not drawn on this sheet."; `?device=nope` opens no panel and does not throw
- [ ] **Step 2: Run** `npx vitest run src/components/WiringSheet.test.tsx src/pages/Wiring.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** `WiringSheet` sets the SVG with `dangerouslySetInnerHTML` (memoized on `svg`), then in effects: removes `width`/`height`, sets `preserveAspectRatio="xMidYMid meet"` and the `viewBox`, toggles classes. Wheel zoom with `wheelFactor` + `zoomAt` (non-passive listener), drag pan with `panBy` (3 px threshold, as in the old page), pinch with two pointers (factor = new distance / old distance, at the midpoint), `touch-action: none`. Wiring page layout: controls column (search with result list of max 20, Sheet, Show, Open items, zoom buttons, "Download poster (SVG)" link to `contentUrl(robot,'poster.svg')` with `download`), sheet, `DevicePanel` (right column on desktop; bottom sheet under 900 px, max 60 vh, close button). Hash ↔ state through `viewFromHash`/`hashFor` with `history.replaceState`; `hashchange` listener.
- [ ] **Step 4: Run** `npm run check` — Expected: PASS.
- [ ] **Step 5: Check in the preview** on the real export: all four views and both sheets match the old page (`robot-wiring-page` launch entry, port 8766) side by side; search "43", "10.21.2.12", "hood"; click devices; zoom, pan, Fit; mobile preset: pinch and drag move the sheet, the page does not scroll; dark mode keeps the white sheet.
- [ ] **Step 6: Commit** `feat: wiring page with views, search and device panel`.

### Task 6: Devices page

**Files:**
- Create: `src/logic/devices.ts`, `src/logic/devices.test.ts`, `src/pages/Devices.tsx` (+ css), `src/pages/Devices.test.tsx`

**Interfaces:**
- Consumes: `search`, `MOTOR` (Task 1), `DevicePanel` (Task 5).
- Produces: `type Chip = 'all'|'can'|'power'|'network'|'open'`; `interface Row {key; role; mechanism; type; can: string; canSort: [string, number]; pdh: string; pdhStyle: 'red'|'amber'|'none'; ip: string; open: string[]; systems: Set<'can'|'power'|'network'>}`; `deviceRows(w: WiringData): Row[]`; `filterRows(rows: Row[], chip: Chip, keys: string[]|null): Row[]` (`keys` = result of `search`, `null` = no query; keeps the `search` order when given); `sortRows(rows, col: keyof Row, dir: 'asc'|'desc'): Row[]` (CAN sorts by bus then first number in the ID).
- Systems rule: `can` when `device.can`; `power` when `derived.pdh_tag[0]` is not empty or `power.fed_by` is set; `network` when `device.network`.

- [ ] **Step 1: Write the failing tests.** `devices.test.ts`: a camera with `power: null` and no `can` gives a row with `can == ""`, `pdh == ""`, an empty `systems` set, no throw; chip `power` keeps only rows with `power` in `systems`; chip `open` keeps rows with `open.length > 0`; sort by CAN puts `can_s2 · 2` before `can_s2 · 10`; `filterRows(rows, 'all', ['b','a'])` returns `b` then `a`. `Devices.test.tsx`: typing "43" shows only the matching rows; the "Open items" chip shows the open count in its label; a click on a row opens the panel; `?device=<key>` opens the panel on load.
- [ ] **Step 2: Run** `npx vitest run src/logic/devices.test.ts src/pages/Devices.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Table with `<th scope="col"><button>` sort headers and `aria-sort`; mono font for CAN, PDH, IP; amber text for `pdhStyle == 'amber'` and for open reasons. Under 700 px each row is a card (CSS grid on `<tr>`).
- [ ] **Step 4: Run** `npm run check` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: device table with search, filters and sort`.

### Task 7: 3D viewer

**Files:**
- Create: `src/three/RobotCanvas.tsx`, `src/three/RobotModel.tsx`, `src/three/CanLoops.tsx`, `src/three/LayerCables.tsx`, `src/three/Labels.css`, `src/three/cameraViews.ts`, `src/three/webgl.ts`, `src/pages/Viewer3D.tsx` (+ css), `src/logic/scene.ts`, `src/logic/scene.test.ts`, `src/pages/Viewer3D.test.tsx`

**Interfaces:**
- Consumes: `useScene`, `useWiring`, viewer logic (Task 1), `DevicePanel`.
- Produces (`logic/scene.ts`): `sceneByRegistryKey(scene: Scene): Map<string, SceneDevice>` (includes `systemcore`); `focusFor(scene, registryKey): {anchor: Vec3; toggle: string} | null` (`toggle` = the device's bus, else the first of its layers in the order `power`, `network`, `electronics`); `toggleList(scene): {id; name; fn; count; color}[]` (buses, then layers, as in the old viewer).
- Produces (`cameraViews.ts`): `type ViewName = 'top'|'front'|'side'|'iso'|'under'`; `VIEWS` (values from `robot-can-viewer.html` lines 458 to 464); `cameraPosition(view, center: Vec3, radius: number): Vec3`; `frame(scene): {center: Vec3; radius: number}` (swerve footprint, `center.z = 0.25`, radius = 0.95 × max footprint side; whole box when no `swerve` group).
- Produces (`webgl.ts`): `hasWebGL(): boolean`.
- Produces (`RobotCanvas`): props `{scene: Scene; mode: 'showcase'|'viewer'; selected?: Set<string>; ghost?: number; view?: ViewName; viewNonce?: number; focus?: Vec3|null; onPick?(key: string|null, at: {x:number; y:number}): void}`. `showcase`: neutral colors, no cables or labels, `autoRotate` at speed 0.6 (about 0.3 rad/s) unless reduced motion, no pointer input, transparent background. `viewer`: everything from the old viewer.

- [ ] **Step 1: Write the failing tests.** `scene.test.ts` on a small scene fixture: `sceneByRegistryKey` finds `pdh` and `systemcore`; `focusFor` of a CAN motor returns its bus; of a camera (layers `["network","electronics"]`) returns `network`; of an unknown key returns `null`; `toggleList` returns buses first with their chain counts. `cameraViews` test: `cameraPosition('top', [0,0,0.25], 1)` equals `[-0.02, 0, 0.25 + 2.6]`. `Viewer3D.test.tsx`: in jsdom (`hasWebGL()` is false) the page shows "This browser cannot show 3D" and a link to the wiring page.
- [ ] **Step 2: Run** `npx vitest run src/logic/scene.test.ts src/three src/pages/Viewer3D.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Geometry per mesh from `decodeMesh` in `useMemo`, `computeVertexNormals`, `MeshStandardMaterial({roughness: 0.72, metalness: 0.08, flatShading: true, side: DoubleSide})`; material color, opacity, transparency and `depthWrite` from `styleFor` on every change of `selected` or `ghost`. Z-up camera (`camera.up = [0,0,1]`, fov 38, near 0.01, far 50), lights as in the old viewer, floor grids 48 in with 16 and 4 divisions from `--line`/`--muted`, front arrow + "FRONT · INTAKE" label. Cables: `TubeGeometry` radii from the old viewer (bus 3 mm; layer main 5 mm, normal 3 mm, unknown and USB 2 mm), opacity 0.45 for assumed, 0.6 for unknown. Labels: drei `<Html>` with the `.chain-num` style, chain number = `chain_index + 1`, tags lifted 0.03 m (power) and 0.055 m (network). Picking: R3F `onPointerMove` (mouse) and `onClick` on device meshes; tooltip from `labelLines`; click opens `DevicePanel` for the `registry_key`. Viewer3D: controls panel (toggles with count and color chip, All, None, "Other parts" slider 0 to 0.6 step 0.05, camera buttons, bus warnings, CAD meta). `?device=` → `focusFor`, add the toggle, aim the camera at the anchor from the `iso` direction at half the radius. `Viewer3D` is `React.lazy` in `App.tsx`.
- [ ] **Step 4: Run** `npm run check` — Expected: PASS.
- [ ] **Step 5: Check in the preview** against the old viewer (`robot-can-viewer`, port 8765): each loop and layer, All/None, slider, five presets, hover tooltip, tap on the mobile preset, `?device=turret-rotation`, `?device=left-pi`, dark mode grid colors. `npm run build`: the main chunk has no three.js (check `dist/assets` sizes; three in a separate chunk).
- [ ] **Step 6: Commit** `feat: 3D viewer with CAN loops, layers and device focus`.

### Task 8: Overview page and hero

**Files:**
- Create: `src/logic/facts.ts`, `src/logic/facts.test.ts`, `src/pages/Overview.tsx` (+ css), `src/components/RobotHero.tsx` (+ css), `src/pages/Overview.test.tsx`

**Interfaces:**
- Consumes: `useWiring`, `useRobot`, `RobotCanvas` (lazy, `mode="showcase"`), `hasWebGL`.
- Produces: `robotFacts(w: WiringData): {label: string; value: number}[]` in this order: Devices (all), Motors (`icon` in `MOTOR`), CAN buses (distinct `can.bus`), PDH channels (distinct non-null `power.pdh_channel`), Network devices (with `network.ip`), Open items (`derived.open`). On the current export: 40, 20, 5, 8, 5, 33.

- [ ] **Step 1: Write the failing tests.** `facts.test.ts` on a fixture with known counts, including a device with `power: null`. `Overview.test.tsx` (mock fetch, mock `RobotHero` with `vi.mock`): heading is the robot name; eyebrow "TEAM 2102 · PARADOX"; facts strip shows "Devices" with its number; cards link to `wiring`, `3d`, `devices`; the open items card links to `wiring?open=1`; a robot without `3d` shows no 3D card and no hero.
- [ ] **Step 2: Run** `npx vitest run src/logic/facts.test.ts src/pages/Overview.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Layout: text block first (eyebrow, name in display font at `clamp(2.75rem, 8vw, 5.5rem)`, season, summary), hero beside it on desktop (≥ 1100 px) and under it on a phone, height `min(56vh, 560px)`. `RobotHero` renders a same-size placeholder (thin outline of the robot footprint in `--line`) until the scene and the chunk arrive; no WebGL → the placeholder stays with the text "3D preview not available". Facts strip: numbers in mono, `--accent` color, labels in muted small caps. Cards: one per doc page and the open items card.
- [ ] **Step 4: Run** `npm run check` — Expected: PASS.
- [ ] **Step 5: Check in the preview**: desktop and mobile, light and dark, reduced motion (no turn). Load the overview with a cold cache and confirm the text shows before the hero.
- [ ] **Step 6: Commit** `feat: overview page with 3D hero and facts`.

### Task 9: Container and Railway config

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `Caddyfile`, `railway.json`, `scripts/check-headers.sh`
- Modify: `README.md` (what the site is, `npm run dev`, `npm run check`, how to export content, how deploy works, the DNS records)

**Interfaces:**
- Consumes: `npm run check`, `npm run build`.
- Produces: an image that serves the site on `$PORT` (default 8080).

- [ ] **Step 1: Write the check script** `scripts/check-headers.sh <base-url>`: `curl -sI` checks, each prints PASS or FAIL and the script exits 1 on any FAIL:
  - `/` → 200, `Cache-Control` contains `no-cache`, `Content-Security-Policy` present, `X-Content-Type-Options: nosniff`.
  - `/2026-offseason/3d?device=pdh` → 200 and the body contains `<div id="root">`.
  - `/content/robots.json` → 200, `Cache-Control: public, max-age=300`.
  - one file under `/assets/` (read its name from `/`) → `max-age=31536000, immutable`.
  - `/content/robots/2026-offseason/scene.json` with `Accept-Encoding: gzip, zstd` → `Content-Encoding` present.
- [ ] **Step 2: Write** `Dockerfile` (stages from spec Section 5; stage 1 copies `package*.json` first for the layer cache, then the rest), `.dockerignore` (`node_modules`, `dist`, `.git`, `docs`, `.claude`), `Caddyfile` (spec Section 5; `index.html` gets `no-cache` through a `@html` matcher on `path / *.html` plus the fallback), `railway.json` (`{"$schema": "https://railway.com/railway.schema.json", "build": {"builder": "DOCKERFILE", "dockerfilePath": "Dockerfile"}, "deploy": {"healthcheckPath": "/", "restartPolicyType": "ON_FAILURE"}}`).
- [ ] **Step 3: Run locally.** Docker is not installed on this Mac. If `caddy` is on PATH (ask the user before `brew install caddy`): `npm run build && PORT=8090 caddy run --config Caddyfile` with `root` pointed at `dist` through an env var `SITE_ROOT` (default `/srv`), then `scripts/check-headers.sh http://127.0.0.1:8090` — Expected: all PASS. Without caddy: run the script against the first Railway deploy (Task 10).
- [ ] **Step 4: Commit** `build: Dockerfile, Caddy config and Railway config`.

### Task 10: Final review and go-live (each step waits for the user)

- [ ] **Step 1: Whole-branch review** with `superpowers:requesting-code-review`; fix the findings; `npm run check` and `npm run build` PASS.
- [ ] **Step 2: Manual checks**: 375 px and desktop, light and dark, keyboard only on every page, Lighthouse accessibility ≥ 90 on Overview and Devices (`npx lighthouse <url> --only-categories=accessibility --quiet --chrome-flags=--headless`).
- [ ] **Step 3: Ask the user**, then `git push origin main`.
- [ ] **Step 4: Ask the user** to run `railway login`; then, with their yes, create the project and service from the repo (`railway init`, link the GitHub repo in the dashboard, or `railway add --repo Paradox2102/PrettyDocs`), and wait for the first deploy. Run `scripts/check-headers.sh https://<service>.up.railway.app` — Expected: all PASS.
- [ ] **Step 5: Ask the user**, then `railway domain docs.team2102.org`; give the user the CNAME and TXT records for Cloudflare (CNAME "DNS only"). After they add them, check `dig +short docs.team2102.org`, `railway domain status docs.team2102.org`, and `scripts/check-headers.sh https://docs.team2102.org`.

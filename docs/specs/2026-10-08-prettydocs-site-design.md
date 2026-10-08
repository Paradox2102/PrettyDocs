# PrettyDocs site: design

Date: 2026-10-08
Status: approved in conversation 2026-10-08 (approach 1, look and feel, pages, content flow, hosting)
Repo: `Paradox2102/PrettyDocs` (private), local clone `~/PrettyDocs`

## Purpose

A public documentation site for Team 2102 (Paradox) robots at `docs.team2102.org`. Version 1 shows
the wiring docs and the 3D robot views that today exist only as local pages in `~/systemcore/wiring`.

Audience: team members, mentors and other teams, on a phone in the pit or a laptop at home.

Success:

- A visitor opens `docs.team2102.org` and sees the latest robot.
- The visitor can use the wiring views (All / CAN / Power / Network, Wiring / Top view, search,
  device details, open items) and the 3D viewer (CAN loops, power, network and electronics layers,
  camera presets) as well as the local pages allow today.
- The visitor finds "what is on PDH channel 7?" or "which device is CAN ID 43?" in under 10 seconds.
- A robot selector shows every documented robot. The latest robot is the default.
- After a wiring change, one export command and one `git push` update the live site.

## Decisions made in the conversation

| Question | Decision |
|---|---|
| Stack | Approach 1: Vite 8 + React 19.3 single-page app, static files |
| 3D | React Three Fiber 9 (React renderer for three.js) + drei helpers |
| Content flow | Export script in `~/systemcore` writes built files into the PrettyDocs clone |
| Hosting | Railway, Docker image with Caddy, auto-deploy from `main` |
| Domain | `docs.team2102.org` (zone on Cloudflare) |
| Login | None. Public site. |
| Public data | All of it: CAD mesh, CAN IDs, PDH channels, IPs (user, 2026-10-08) |
| Robot name | "2026 Offseason" (user, 2026-10-08); one field, easy to change |
| Look | Own identity; reference for the general feel only: 2026.team4414.com |

## Scope

In scope:

- The PrettyDocs repo: app code, tests, Dockerfile, Caddyfile, `railway.json`, README.
- `~/systemcore/wiring/tools/export_prettydocs.py` and its tests (local repo, no remote).
- The first content export for robot `2026-offseason`.

Out of scope (YAGNI):

- Login, edit forms, a database, a server API.
- Mechanical, software or prototype write-ups (later doc types; the content model leaves room).
- Live robot data.
- Analytics.
- A GitHub Actions workflow. The Docker build runs the tests.

Steps that need the user (the build stops and asks):

- The first `git push` to `Paradox2102/PrettyDocs`.
- `railway login`, the Railway project and service, and the custom domain.
- The two DNS records in Cloudflare.

## Section 1: Look and feel

The reference site (Team 4414) gives the general feel: light, calm, technical, one accent color, a
large robot name, generous space. This site must not copy it. Differences by design:

| Element | 4414 | PrettyDocs |
|---|---|---|
| Colors | warm cream, teal | from the Paradox griffin logo: navy ink, gold accent, red only for power |
| Background | warm off-white | cool paper (`#f4f6f9`) in light mode, navy-black (`#0b1220`) in dark mode |
| Headings | Roboto Black italic | Barlow Semi Condensed 600, upright, tight tracking |
| Hero | still CAD render with callout lines | the live 3D robot, slow turn, with a strip of facts |
| Structure | one long scroll page | app shell: side rail (desktop), bottom tab bar (phone) |

Type: Barlow Semi Condensed (display), Barlow (body), JetBrains Mono (CAN IDs, channels, IPs, keys).
These match the pit poster and the 3D viewer. Fonts are self-hosted through `@fontsource` packages,
so the site makes no request to Google.

Tokens (CSS custom properties on `:root`, dark values under `prefers-color-scheme: dark` and
`[data-theme="dark"]`):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f4f6f9` | `#0b1220` | page |
| `--surface` | `#ffffff` | `#121a2b` | rail, cards, panels |
| `--ink` | `#14213d` | `#e6ebf3` | text |
| `--muted` | `#5b6578` | `#93a0b5` | secondary text |
| `--line` | `#d8dee8` | `#243049` | borders |
| `--accent` | `#a67c00` | `#f0b429` | gold marks: active nav bar, focus ring, underlines |
| `--accent-ink` | `#7a5b00` | `#f0b429` | gold text (4.5:1) |
| `--power` | `#cf222e` | `#ff6b6b` | power layer only |
| `--warn-bg` / `--warn-fg` | `#fff4dc` / `#6b4a00` | `#3a2e12` / `#f3d58c` | open items, warnings |

The CAN bus colors (`can_s0` to `can_s4`) and the layer colors stay as in `viewer-logic.js`, so the
site, the poster and the old viewer agree.

The wiring poster and top view keep their white paper look in both themes. They are print sheets.

A theme button in the rail cycles System / Light / Dark. The choice is kept in `localStorage`
(wrapped in try/catch).

Motion: the hero turns at about 0.3 rad/s. With `prefers-reduced-motion: reduce`, it does not turn
and transitions are off.

## Section 2: Pages and navigation

Routes (React Router 8, declarative mode):

| Path | Page |
|---|---|
| `/` | redirect to `/<latest>` |
| `/:robot` | Overview |
| `/:robot/wiring` | Wiring (hash keeps sheet and view: `#can`, `#top`, `#top-power`) |
| `/:robot/3d` | 3D viewer |
| `/:robot/devices` | Device table |
| any path with an unknown robot | "Robot not found" with the robot list |
| any other path | "Page not found" with a link to the latest robot |

A device link adds `?device=<registry key>` to the Wiring, 3D or Devices path. The page selects that
device on load.

Shell:

- Desktop (min-width 900 px): a left rail 248 px wide with the team mark ("PARADOX 2102"), the robot
  selector, nav links (Overview, Wiring, 3D, Devices), the theme button and the data build date.
- Phone: a top bar with the team mark and the robot selector, and a bottom tab bar with the four
  pages. 16 px side gutter, no horizontal page scroll.
- The robot selector is a native `<select>`. A change keeps the current page type
  (`/2026-offseason/3d` to `/<other>/3d`).

Overview:

- Eyebrow "TEAM 2102 · PARADOX", the robot name (large), the season and a one-line summary.
- The hero: the 3D robot in neutral colors, turning, no labels. It loads after the text shows. Until
  then, a quiet placeholder with the same height shows. The hero takes no pointer input.
- A facts strip computed from the data: devices, motors, CAN buses, PDH channels in use,
  network devices, open items.
- Cards: Wiring, 3D viewer, Devices. Each card has one line of text and a link.
- An "Open items" card when the count is above 0: the count and a link to `wiring` with the
  "Show only open items" switch on (`?open=1`).

Wiring (port of `robot-wiring.html`):

- The sheet area shows the poster SVG or the top-view SVG inline, with zoom (wheel, buttons, pinch),
  pan (drag) and Fit.
- Controls: Sheet (Wiring / Top view), Show (All / CAN / Power / Network), "Show only open items",
  search (CAN ID, role, IP, code name).
- A click on a device selects it and opens the device panel. On desktop the panel is a right column;
  on a phone it is a bottom sheet.
- Device panel: title (role), key and mechanism, the rows from `panelRows`, links "Show in 3D" and
  "Show in table".
- A "Download poster (SVG)" link for print.

3D (port of `robot-can-viewer.html`):

- Full-height canvas. Controls in a side panel (desktop) or a bottom drawer (phone).
- Toggles: one per CAN loop and one per layer (Electronics, Power, Network), All, None.
- "Other parts" opacity slider (0 to 60 %, default 15 %).
- Camera presets: Top, Front, Side, 3/4, Under.
- Bus warnings show for a selected bus.
- Hover (mouse) or tap (touch) on a device shows the label lines from `labelLines`. A click opens the
  device panel with "Show on wiring".
- `?device=` lights the device, turns on its bus or layer, and aims the camera at it.
- The "FRONT · INTAKE" arrow and the floor grid stay.
- CAD facts (microversion, build date, triangles) at the foot of the panel.

Devices:

- A table of all registry devices: Device (role), Mechanism, Type, CAN (bus · ID), PDH, IP, Status.
- Filter chips: All, CAN, Power, Network, Open items. A search box uses the same `search` rule as the
  wiring page.
- Sort by any column (click the header).
- A click on a row opens the device panel.
- On a phone, each row becomes a compact card.

## Section 3: Content model and export

Content lives in `public/content/` and is fetched at run time:

```
public/content/
  robots.json
  robots/<robot id>/
    wiring.json      # page_data(): built, view, devices{key: registry device + derived}
    poster.svg       # tagged poster (make_poster.poster_svg)
    top-view.svg     # tagged top view (make_top_view.top_view_svg)
    scene.json       # the window.ROBOT object from cad3d/robot-data.js
```

`robots.json`:

```json
{
  "latest": "2026-offseason",
  "robots": [
    { "id": "2026-offseason", "name": "2026 Offseason", "season": "2026",
      "summary": "Wiring and 3D views of the 2026 offseason robot.",
      "built": "2026-10-08T10:28:00-07:00", "docs": ["wiring", "3d", "devices"] }
  ]
}
```

Rules:

- `id` matches `^[a-z0-9][a-z0-9-]*$`. The list order is the selector order. `latest` names one id.
- `docs` lists the pages that robot has. A robot without `3d` gets no 3D page, hero or link.

Export script `~/systemcore/wiring/tools/export_prettydocs.py`:

```
python3 -I wiring/tools/export_prettydocs.py --out ~/PrettyDocs \
  [--robot 2026-offseason] [--name "2026 Offseason"] [--season 2026] [--summary "..."] [--no-latest]
```

- Loads the registry with `wiring_model.load()` and positions with `top_layout.load_positions()`.
- Writes `poster.svg`, `top-view.svg` and `wiring.json` with the same functions that `make_page.py`
  uses (`poster_svg`, `top_view_svg`, `page_data`).
- Reads `cad3d/robot-data.js`, strips `window.ROBOT = ` and the final `;`, checks that the rest is
  JSON with `meta`, `groups`, `devices`, `systemcore`, `buses`, `layers`, and writes `scene.json`.
- Merges the robot into `robots.json`: it replaces the entry with the same id, keeps the others and
  their order, appends a new id at the end, and sets `latest` unless `--no-latest`.
- Writes each file to a temp name and renames it, so a failed run leaves the old files.
- Stops with a message and exit code 1 when `--out` has no `public/` folder, `robot-data.js` is
  missing, or the registry or a layout fails (`RegistryError`, `FitError`).
- Does not commit or push. It prints the `git` commands to run.

The export does not touch `build_scene.py` or the other cad3d files (another session edits them).

## Section 4: App architecture

```
src/
  main.tsx                 # createRoot, BrowserRouter, theme init
  App.tsx                  # Routes
  content/
    types.ts               # RobotIndex, RobotEntry, WiringData, Device, Scene types
    validate.ts            # validateIndex(), validateWiring(), validateScene(): throw with a clear message
    load.ts                # fetchJson/fetchText with a promise cache keyed by URL
    hooks.ts               # useIndex(), useWiring(id), useSvg(id, sheet), useScene(id): React 19 use()
  logic/
    wiring.ts              # port of page-logic.js (search, panelRows, zoomAt, panBy, centerOn,
                           # wheelFactor, viewFromHash, hashFor, isOpen)
    viewer.ts              # port of viewer-logic.js (colors, decodeMesh, styleFor, labelLines,
                           # cablePoints, layerCables, cableLabel)
    facts.ts               # robotFacts(wiring, scene?) for the overview strip
    devices.ts             # device table rows, filters, sort
  shell/
    Layout.tsx  Rail.tsx  TabBar.tsx  RobotSelect.tsx  ThemeButton.tsx  RobotRoute.tsx
  pages/
    Overview.tsx  Wiring.tsx  Viewer3D.tsx  Devices.tsx  NotFound.tsx
  components/
    WiringSheet.tsx        # inline SVG + zoom/pan + classes for mode/open-only/highlight
    DevicePanel.tsx        # rows + links; side column or bottom sheet
    Segmented.tsx          # radio group control
    ErrorBoundary.tsx
  three/
    RobotCanvas.tsx        # <Canvas> + lights + controls + floor + front arrow
    RobotModel.tsx         # group and device meshes; styles from styleFor
    CanLoops.tsx  LayerCables.tsx  Labels.tsx
    cameraViews.ts         # preset positions (from the old viewer)
  styles/
    tokens.css  base.css   # plus one CSS module per component
```

Data flow: a page calls a hook (for example `useWiring(robotId)`). The hook calls `use()` on a
cached promise. A `<Suspense>` boundary shows a skeleton; an `ErrorBoundary` shows the failure. The
3D code is a lazy chunk (`React.lazy`), so the Overview text and the Wiring page do not download
three.js before they need it.

The SVG text is trusted content from this repo. `WiringSheet` sets it once with
`dangerouslySetInnerHTML` and then changes only classes and the `viewBox` through a ref.

The scene mesh keys (`can_s2:4`) differ from registry keys. The 3D page maps them through each scene
device's `registry_key` (and `systemcore.registry_key`).

## Section 5: Hosting and deploy

- `Dockerfile`: stage 1 `node:24-alpine` runs `npm ci`, `npm run check` (typecheck + tests, including
  the content test) and `npm run build`. Stage 2 `caddy:2.11-alpine` copies `dist/` and the
  `Caddyfile`.
- `Caddyfile`: listens on `:{$PORT:8080}`; `encode zstd gzip`; `try_files {path} /index.html`;
  `Cache-Control: public, max-age=31536000, immutable` on `/assets/*`; `max-age=300` on
  `/content/*`; `no-cache` on `index.html`. Headers: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a Content Security Policy:
  `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self';
  connect-src 'self'; font-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'`.
- `railway.json`: builder `DOCKERFILE`, healthcheck path `/`, restart policy `ON_FAILURE`.
- Railway: one project "PrettyDocs", one service from the GitHub repo, auto-deploy on push to
  `main`.
- Domain: `railway domain docs.team2102.org` prints a CNAME target and a TXT record. The user adds
  both in Cloudflare. The CNAME stays "DNS only" (grey cloud), so the zone SSL mode of
  `team2102.org` (which also serves the main site) does not change. Railway issues the certificate.

## Section 6: Errors

| Case | Behaviour |
|---|---|
| Unknown robot id | "Robot not found" page with the robot list |
| `robots.json` fails to load or is invalid | full-page message "The docs index did not load" and a Retry button |
| A robot file fails to load | the page shows "This page's data did not load" with Retry; other pages still work |
| No WebGL | 3D page and hero show "This browser cannot show 3D" with a link to Wiring |
| `?device=` names an unknown device | the page ignores it |
| The 3D chunk fails to load | ErrorBoundary message with Retry |

## Section 7: Tests

PrettyDocs (Vitest 5, React Testing Library, jsdom):

- `logic/wiring.test.ts`: every case of `page-logic.test.mjs`, ported.
- `logic/viewer.test.ts`: every case of `viewer-logic.test.mjs`, ported.
- `logic/facts.test.ts`, `logic/devices.test.ts`: counts, filters, sort.
- `content/validate.test.ts`: good and bad documents.
- `content/content.test.ts`: reads the real `public/content/`, validates `robots.json`, and checks
  that every robot has every file its `docs` need and that the JSON passes the validators. This test
  fails the Docker build when an export is incomplete.
- `App.test.tsx`: `/` redirects to the latest robot; an unknown robot shows "Robot not found"; the
  robot selector keeps the page type.
- `Devices.test.tsx`: search "43" shows the matching rows; the Open items chip filters.
- WebGL is not tested in jsdom. The 3D page is checked by hand in the browser preview (layers,
  presets, hover, `?device=`).

systemcore (pytest):

- `wiring/tests/test_export_prettydocs.py`: writes all files into a temp `public/content`; merges
  `robots.json` (keeps other robots, replaces the same id, sets `latest`, honours `--no-latest`);
  strips the `window.ROBOT` wrapper; stops with exit code 1 on a missing `public/`, a missing
  `robot-data.js` and bad JSON.

Manual checks before the first push: phone width (375 px) and desktop, light and dark, keyboard
focus on every control, Lighthouse accessibility score of 90 or more on Overview and Devices.

# PrettyDocs v1: rulings and deferred items

Decisions made during the build (2026-10-08) where the plan or spec left a choice, each with its cost if wrong.
Source: the execution ledger. Spec: `docs/specs/2026-10-08-prettydocs-site-design.md`. Plan: `docs/plans/2026-10-08-prettydocs-site.md`.

## Rulings

- systemcore wiring/ is untracked by design (memory: "not committed"), so Task 2 makes no systemcore commit; the export script stays a local file like the rest of wiring/. cost if wrong: the user commits it later by hand.
- **Task 1**: dropped 3 of the 18 viewer tests (two startupMessage tests, the old HTML Google Fonts test). the plan drops startupMessage and the old HTML is not in this repo; added "the page loads no third-party font, script or stylesheet" against index.html in their place. cost if wrong: none, the dropped code does not exist here.
- **Task 1**: fonts import the latin subsets only (latin-400.css etc.). CSS 28.8 kB -> 3.2 kB; the site text is English. cost if wrong: accented names fall back to the system font.
- **Task 4**: one <nav> restyled by CSS into the bottom tab bar under 900 px; no separate TabBar.tsx. one link list, no duplicate links for screen readers. cost if wrong: none.
- **Task 4**: tests render through act() (src/test/render.tsx renderRouted/settle). React 19 use() suspensions do not resolve under RTL findBy alone in this setup. cost if wrong: none, the tests still assert the loaded page.
- **Task 4**: light --accent #c8960c -> #a67c00 (spec table updated). #c8960c is ~2.6:1 on white, below 3:1 for a focus ring. cost if wrong: a slightly darker gold.
- **Task 4**: the prettydocs preview entry lives in ~/systemcore/.claude/launch.json (npm --prefix). the preview tool reads the session root's launch.json. cost if wrong: none.
- **Task 5**: SheetHandle gains focus(bbox) (zoom to at least 2.5x, then center) used for search and ?device=. centerOn alone does nothing at full zoom. cost if wrong: none, centerOn stays.
- **Task 5**: phone layout puts the device panel below the sheet in the page flow (spec said bottom sheet). a fixed bottom sheet covered the whole short sheet at 375 px. cost if wrong: the user scrolls a little to read details.
- **Task 5**: phone stage uses the sheet's aspect ratio (no empty band); zoom buttons float on the sheet in both layouts. cost if wrong: none.
- **Task 5**: a typed single match selects the device but keeps the result list open; a click on a result, Escape or blur closes it. cost if wrong: none.
- **Task 6**: added chipCounts(rows) to logic/devices.ts for the chip labels; filter chips and sort stay in component state (not the URL). the spec asks only for ?device=. cost if wrong: a shared link does not keep the filter.
- **Task 7**: labels use three's CSS2DRenderer (src/three/Labels.tsx) in place of drei <Html>. drei Html made one React root per label and logged "Attempted to synchronously unmount a root" 67 times; CSS2D is what the old viewer used. cost if wrong: none.
- **Task 7**: drei removed; three's OrbitControls wrapped in a small Controls component registered as state.controls. only OrbitControls was used; bundle size unchanged (drei was tree-shaken). cost if wrong: none.
- **Task 7**: autoRotateSpeed 2.8 (plan said 0.6). three r186 turns 2π/60 × speed rad/s with delta time, so 2.8 ≈ 0.3 rad/s as the spec says. cost if wrong: a faster or slower hero turn.
- **Task 7**: camera presets move back by max(1, 1.3 / aspect). the old offsets were tuned for a wide view and cropped the robot on a 872x900 stage. cost if wrong: none.
- **Task 7**: chunkSizeWarningLimit 1000 kB in vite.config.ts. the lazy 3D chunk is three.js (948 kB, 252 kB gzip). cost if wrong: a later size jump is not warned below 1 MB.
- **Task 8**: ErrorBoundary gains an optional fallback prop; the hero falls back to its placeholder ("3D preview not available") when the scene or the 3D chunk fails, so the overview text stays. cost if wrong: a hero failure is quiet (no Retry).
- **Task 8**: the hero sits on a 24 px engineering-paper grid in --line (a deliberate drawing-sheet look, not a gradient) and has an "Open the 3D viewer" link. cost if wrong: a style change.
- **Task 8**: CameraRig runs in showcase mode too, so the hero fits a narrow phone stage. cost if wrong: none.
- **Task 9**: Caddy applies try_files and no-cache only to paths outside /assets and /content (@app matcher). header matchers run before the rewrite, and a missing content file must stay a 404, not the app with 200. cost if wrong: none.
- **Task 9**: no local Caddy run. Caddy and Docker are not installed and installing them needs the user's yes; check-headers.sh ran RED against vite preview (5 failed: CSP, nosniff, /content cache, missing-content 404, asset cache) and runs GREEN against the first Railway deploy in Task 10. cost if wrong: a Caddyfile error shows at the first deploy (the deploy fails its health check; nothing was live before).
- **Task 10**: accessibility audit with axe-core 4.14.0 in the browser pane (installed --no-save) in place of Lighthouse. Chrome is not installed; Lighthouse's accessibility score is axe-based. cost if wrong: no numeric Lighthouse score.
- **Final**: phone 3D controls sit below the canvas, not in a bottom drawer. the canvas stays 62vh and the controls scroll; a drawer would cover the model. cost if wrong: a scroll on a phone.
- **Final**: the device table column is "Open items" (spec said "Status"). the data has open reasons, not a status. cost if wrong: a label.
- **Final**: the 3D footer omits the CAD build date (meta.built). the rail shows the data build date. cost if wrong: one line of metadata.

## Deferred minor findings (final review)

- OrbitControls made in useMemo; StrictMode dev keeps an orphan listener instance (production fine).
- LabelRenderer useFrame runs before Controls.update: labels trail one frame while turning.
- page Retry forgets every cached URL, not only the failed one.
- top-level boundary calls any render error "The docs index did not load".
- hero renders at 60 fps under reduced motion and off-screen (frameloop="demand" when not turning).
- export_prettydocs.py: no encoding="utf-8"; a corrupt robots.json gives a traceback; a leftover *.tmp could be committed.
- test gaps: no test for bad JSON inside the window.ROBOT wrapper (code handles it: JSONDecodeError is a ValueError -> exit 1); no WiringSheet pointer/pinch test; export test hard-codes 40 devices.
- CSP could add base-uri 'none'; form-action 'none' and try dropping style-src 'unsafe-inline'.
- one viewBox for both sheets (both are 431.8 x 279.4 today); panelRows shows "null" for a null CAN id.

# PrettyDocs

Robot documentation for Team 2102 Paradox, published at **https://docs.team2102.org**.

The site shows each robot's wiring (CAN, power and network sheets), a 3D model with every CAN loop, power cable and network link, and a searchable device table. It opens on the latest robot; the selector in the side rail (or the top bar on a phone) switches robots.

## Run it

```bash
npm ci
npm run dev          # http://localhost:5173
npm run check        # typecheck, unit tests and the content test
npm run build        # static site in dist/
```

Node 24 or newer.

## Update a robot's docs

The content in `public/content/` is generated. Do not edit it by hand.

1. Rebuild the wiring outputs in the wiring tools (`~/systemcore/wiring`): after a change to `devices.json`, or after a new CAD export (`build_scene.py`).
2. Export into this repo:

   ```bash
   python3 -I wiring/tools/export_prettydocs.py --out ~/PrettyDocs
   ```

   Options: `--robot <id>` (lowercase, digits and dashes), `--name`, `--season`, `--summary`, and `--no-latest` to add an older robot without making it the default.
3. Run `npm run check`, then commit `public/content` and push to `main`.

Each robot has a folder `public/content/robots/<id>/` with `wiring.json`, `poster.svg`, `top-view.svg` and `scene.json`.

### Mechanical page

`public/content/robots/<id>/mechanical.json` is kept by hand (the export does not write it). Each subsystem lists:

- `mechanisms`: registry `mechanism` values; the page's devices table comes from `wiring.json` by these.
- `groups`: `scene.json` group ids shown solid in the 3D view.
- `facts`: each with a `source` (where the value comes from); add `uncertain` with the reason when a value is not sure.
- `notes`: service steps, one sentence each.

Change `updated` when you edit it, and add `"mechanical"` to the robot's `docs` in `robots.json`. `npm run check` fails if a mechanism or group name does not exist in the export. `public/content/robots.json` lists the robots in selector order and names the latest one.

## Deploy

Railway builds the `Dockerfile` on every push to `main`: Node 24 runs `npm run check` and `npm run build`, then Caddy serves `dist/`. A failed check stops the deploy, and the old version stays live.

- `Caddyfile`: single-page fallback, compression, cache headers (`/assets` one year, `/content` five minutes, pages no-cache) and security headers.
- `.railway/railway.ts`: Railway service settings as code (Dockerfile builder, health check on `/`, restart on failure, source `main`, the `docs.team2102.org` domain). Railway does not read it on deploy. After an edit, run `railway config plan`, check that the plan destroys nothing, then run `railway config apply`. `npm run check` typechecks it.
- `scripts/check-headers.sh <url>`: checks a running server (fallback, caching, compression, headers).

### Domain

`docs.team2102.org` is a custom domain on the Railway service. Cloudflare (the `team2102.org` zone) holds two records that Railway gives with `railway domain docs.team2102.org`:

- a CNAME `docs` to the Railway target, **DNS only** (grey cloud), so the zone's SSL setting for the main site does not change;
- a TXT record for the Railway domain check.

Railway issues the TLS certificate.

## Layout

```
src/
  content/   types, validators, loaders and hooks for public/content
  logic/     rules with no browser dependency (search, panel rows, view math, 3D styles, facts, table)
  shell/     side rail, tab bar, robot selector, routes, theme
  pages/     Overview, Wiring, 3D, Devices, Not found
  components/ wiring sheet, device panel, segmented control, hero, error boundary
  three/     React Three Fiber scene: model, cables, labels, camera
docs/        design spec and implementation plan
```

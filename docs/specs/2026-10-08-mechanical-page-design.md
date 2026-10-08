# Mechanical page: design

Date: 2026-10-08
Status: approach 1 chosen in conversation 2026-10-08 (hand-kept facts file, seeded from code and CAD)
Parent: `2026-10-08-prettydocs-site-design.md` (adds a doc kind to that site)

## Purpose

A pit and repair reference for each mechanical subsystem of a robot. Version 1 covers the 2026 Offseason
robot's swerve, intake and shooter.

Audience: the team, in the pit or at home (user, 2026-10-08). Not a showcase for judges.

Success:

- In under 10 seconds a team member finds a subsystem's gear ratio, current limits and the CAN ID, PDH
  channel and status of each of its devices.
- The subsystem shows alone in 3D, with the rest of the robot faint, and each CAN device carries its
  CAN ID bubble.
- Every fact names its source, and an uncertain fact looks uncertain (amber, as open items do).
- A new wiring export never makes the device list disagree with the wiring page.

## Decisions

| Question | Decision |
|---|---|
| Audience | Our team, pit and repair (user) |
| Content source | Approach 1: `mechanical.json` per robot, kept by hand in PrettyDocs, seeded once from the robot code and CAD (user) |
| Device list | Not stored in `mechanical.json`. Built from `wiring.json` by registry mechanism, so it follows each export |
| 3D | The existing `scene.json` groups and devices; no new export |
| Subsystems in v1 | Swerve, Intake, Shooter (user). The file format allows more |

Out of scope (YAGNI): design story and award text, part lists and BOM, CAD photos, editing in the page,
reading the robot code on each export (approach 2), the indexer and hopper in v1.

## Section 1: Content

`public/content/robots/<id>/mechanical.json`, edited by hand:

```json
{
  "updated": "2026-10-08",
  "subsystems": [
    {
      "id": "swerve",
      "name": "Swerve",
      "summary": "One sentence of plain fact.",
      "mechanisms": ["Swerve"],
      "groups": ["swerve"],
      "facts": [
        { "label": "Drive gear ratio", "value": "7.36:1",
          "source": "TunerConstants.kDriveGearRatio = 7.3636 (robot code main f1fdf68)" },
        { "label": "Gear reduction", "value": "67.86:1", "source": "...", "uncertain": "Mechanism not named in the code" }
      ],
      "notes": []
    }
  ]
}
```

Rules:

- `id` matches `^[a-z0-9][a-z0-9-]*$` and is unique. List order is page order.
- `mechanisms`: registry `mechanism` values; the subsystem's devices are the `wiring.json` devices with one
  of these values.
- `groups`: `scene.json` group ids drawn solid in the subsystem's 3D view.
- `facts[].source` is required. `facts[].uncertain` (text, optional) says why the value is not sure.
- `notes`: plain sentences for service steps. Empty is allowed; the page then says "No service notes yet."
- The robot's `docs` in `robots.json` gains `"mechanical"`.

Seed (from the robot code at `main` f1fdf68 and the registry):

- Swerve: drive 7.36:1 (`kDriveGearRatio` 7.3636), steer 5.68:1 (`kSteerGearRatio`), coupling 3.82
  (`kCoupleRatio`), wheel diameter 4.33 in (`kWheelRadius` 2.167 in), top speed 4.54 m/s at 12 V
  (`kSpeedAt12Volts`), drive supply limit 60 A, steer stator limit 60 A, slip current 120 A
  (`TunerConstants`); encoders WCP ThroughBore with a CANcoder inside (registry).
- Intake: roller supply limit 25 A, extension supply limit 30 A, roller speed 40 rps in and 30 rps out
  (`IntakeConstants`).
- Shooter: supply limits flywheel 37 A, turret aim 29 A, hood 26 A, kicker 23 A, secondary kicker 23 A
  (`ShooterConstants`); gear reduction 67.86:1 (`k_shooterGearReduction`, uncertain: the code does not say
  which mechanism).
- Notes: empty. The team adds them.

The export script must keep `"mechanical"` in a robot's `docs`: `merge_index` keeps the doc kinds it does
not manage (it manages `wiring`, `3d`, `devices`).

## Section 2: Page

Route `/:robot/mechanical`, nav label "Mechanical", a gear icon, an Overview card. The hash keeps the
subsystem: `#shooter`; no hash or an unknown one shows the first subsystem.

Layout (desktop): a subsystem switch (segmented control) under the page title, then two columns.

- Left: the summary, the facts table (label, value, source in small muted text; an uncertain value in
  amber with its reason), the devices table (role, CAN bus · ID, type, PDH, open items; a row links to
  the same device on the wiring page), and the service notes.
- Right: the 3D view, sticky, about 70 vh.

Phone: one column; the 3D view first at 50 vh.

3D view (RobotCanvas mode `subsystem`):

- The subsystem's groups solid in their neutral color; other groups at 6 % opacity.
- The subsystem's devices in their bus color (no bus: the device neutral color); other devices hidden.
- A CAN ID bubble (`canTag`) on each of the subsystem's CAN devices.
- The camera frames the union of the subsystem's group boxes from the 3/4 direction; drag to turn.
- No WebGL: the 3D view is replaced by "This browser cannot show 3D." The rest of the page works.

## Section 3: Errors

| Case | Behaviour |
|---|---|
| `mechanical.json` missing or invalid | the page boundary: "This page's data did not load" with Retry |
| A `mechanisms` value matches no device | the devices table says "No devices found for this subsystem."; the content test fails the build |
| A `groups` id is not in the scene | the content test fails the build |
| A robot without `mechanical` in `docs` | no nav link, no card, "Page not found" at the URL |

## Section 4: Tests

- `validateMechanical`: good file passes; a missing `source`, a duplicate `id` and a bad `id` fail by path.
- `content.test.ts`: a robot with `mechanical` has a valid `mechanical.json`; every `mechanisms` value
  matches at least one device in its `wiring.json`; every `groups` id exists in its `scene.json`.
- Logic: `subsystemDevices(wiring, subsystem)` (registry order kept), `subsystemStyle(item, focus, ghost)`,
  `frameGroups(scene, ids)`.
- Page: the switch and the hash select the subsystem; facts show their source; an uncertain fact is amber
  with its reason; device rows link to the wiring page; empty notes say so; no WebGL keeps the tables.
- systemcore: `merge_index` keeps `"mechanical"` in `docs`.
- Browser: desktop and phone, light and dark, each subsystem's 3D view frames and colors the right parts.

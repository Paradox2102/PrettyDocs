# Controls page: design

Date: 2026-10-10
Status: direction chosen by the user 2026-10-10 (answers below); built without more review stops
Parent: `2026-10-08-prettydocs-site-design.md` (adds a doc kind to that site)

## Purpose

A drive control map: which button on each driver station controller does what. Version 1 covers the 2026
Offseason robot's two controllers: a Razer Wolverine V2 gamepad (port 0) and a Logitech Extreme 3D Pro
joystick (port 1).

Readers: the drive team and new drivers first, programmers second (user: "Both, with layers"). The plain
view says what each input does; a Code switch adds the command and the code that binds it.

Success:

- A new driver finds what a button does in under 10 seconds, from the list or from the drawing.
- Front and back drawings of each controller label every bound input with a leader line to its callout.
- A 3D model of each controller turns under the mouse; bound inputs show in the accent color with a label.
- Selecting an input in the list, the drawing or the 3D model selects it in the other two.
- Every binding names the code it comes from and the commit the map was checked at.

## Decisions

| Question | Decision |
|---|---|
| Readers | Both, with layers: plain by default, code on a switch (user) |
| Joystick | Drawn with every input marked "not used", until the code binds it (user) |
| Wolverine M1, M2 | Drawn as "not mapped" (user: not used or not known) |
| 3D model | Built in code from three.js shapes; no downloaded mesh (user) |
| Content source | `controls.json` per robot, kept by hand in PrettyDocs, as `mechanical.json` is |
| Controller geometry | In the site code, one module per controller model; a robot's file names the model |

Out of scope (YAGNI): a print sheet, editing in the page, reading the robot code on each export, the Razer
app's remaps, operator presets, sticks' dead bands as a picture, other controller models.

## Section 1: Content

`public/content/robots/<id>/controls.json`, edited by hand:

```json
{
  "updated": "2026-10-10",
  "source": "RobotContainer.java, robot code main 1ae9dacd (2026-10-10)",
  "controllers": [
    {
      "id": "gamepad",
      "name": "Driver gamepad",
      "model": "razer-wolverine-v2",
      "port": 0,
      "code_name": "m_controller (CommandGamepad)",
      "summary": "One sentence of plain fact.",
      "bindings": [
        { "input": "rb", "label": "Shoot", "how": "hold",
          "action": "Spins the flywheel; feeds when it is at speed.",
          "code": "rightBumper().whileTrue(parallel(staticShoot(), ...))" }
      ],
      "notes": []
    }
  ]
}
```

- `how` is `hold` (whileTrue), `press` (onTrue) or `axis` (a stick or trigger read as a number).
- `input` must be an input id of the model. One binding per input.
- `label` is one to three words for the callout. `action` is one plain sentence. `code` is the binding as
  written, shortened with `...` where long.
- A controller with no bindings is valid. Its `notes` say why.

Validation (`validateControls`) checks the shape, unique controller ids, a known `model`, known and unique
`input` ids, and the `how` values. A bad file names the path of the first bad field, as the other
validators do.

Version 1 data (robot code main `1ae9dacd`, `RobotContainer.java` and the subsystems it calls):

| Input | Label | How | Action |
|---|---|---|---|
| Left stick | Drive | axis | Moves the robot, field-relative; push is squared for fine control; 10 % dead band |
| Right stick (X) | Turn | axis | Turns the robot, up to 0.75 turn/s; squared; 10 % dead band |
| LB | Extend intake | press | Drives the intake out until it stalls |
| LT | Intake | hold | Runs the intake roller in |
| RT | Reverse rollers | hold | Runs the intake roller and indexer roller out |
| RB | Shoot | hold | Spins the flywheel; while it is at speed, runs the conveyor, kickers and indexer roller to feed |
| X (west face) | Indexer in | hold | Runs the indexer roller in |
| Y (north face) | Reset pose | press | Sets the field pose to the origin with the heading for the alliance color |

The joystick has no bindings. Its note: "The code declares m_joystick on port 1 but binds nothing yet."

## Section 2: Controller models

`src/controllers/` holds one module per model and a registry (`models.ts`). A model gives:

- `id`, `name`, `maker`, `link` (the product page).
- `inputs`: id, name ("Right bumper"), short name ("RB"), kind (`button`, `trigger`, `stick`, `hat`,
  `axis`).
- `views.front` and `views.back`: an SVG drawing in millimetres. Each has a `viewBox`, body `paths` and
  `marks`. A mark places one input: shape (circle, rounded rectangle or path), position, and the callout
  side (left or right).
- `build3d()`: a three.js `Group` of the controller in metres, +z up, the user at -y. Each input is one
  mesh (or a group) with `userData.input` set to the input id.

Wolverine V2 (Xbox layout): A, B, X, Y, LB, RB, LT, RT, left and right sticks and their clicks, D-pad
(one `hat` input), View, Menu, Xbox, Share, M1, M2. Front view: the face. Back view: the top edge, seen
from behind, with the triggers, bumpers, M1 and M2 between them (reviews place M1 and M2 on the top edge
between the triggers and bumpers), and the USB-C port.

Extreme 3D Pro: buttons 1 (trigger) to 12, the hat, stick X and Y, twist and throttle. Its two views are
titled Top and Side (changed in the build: a straight front view hides the head buttons). Top: from above,
pilot at the bottom, with the head (buttons 3 to 6, hat, thumb button 2), base buttons 7 to 12 and the
throttle. Side: from the pilot's left, with the trigger, the thumb button and the stick.

The body outline of each front view is one list of points; the SVG path and the 3D extrusion both use it.

## Section 3: The page

Route `/:robot/controls`, doc kind `controls`, nav label "Controls", a gamepad icon, an Overview card.

Layout, as the Mechanical page: a reading column on the left and the drawing on the right, held in place
while the list scrolls. Under 1280 px (the callouts need the width): heading, drawing, list.

Left column:

1. Eyebrow (robot name), H1 "Controls", lead sentence.
2. Controller switch (Segmented): one option per controller. The hash keeps it (`#joystick`).
3. View switch: Front, Back, 3D (`?view=`). Detail switch: Plain, Code (`?detail=code`).
4. Controller heading: name, model with a link to the product page, port; the code name only with Code on.
5. Binding list: one row per binding, ordered as the model's inputs. A row: the short input name in a
   key cap, the label, the action, and a How badge (Hold, Press, Stick). With Code on, the code line in
   mono under the action.
6. "Not used": the short names of the unbound inputs on one line.
7. Notes, then "Checked against <source> · updated <date>".

Right column: the drawing for the view. Front and Back are inline SVG, built by React from the model
and the bindings:

- Body in `--surface` with a `--line` outline. Bound marks fill with `--accent`; unbound marks are an
  outline only.
- Callouts in two columns, left and right of the body. A bound input's callout is its label in ink with
  the short name and How in muted mono; an unbound one is the short name in muted text and "not used".
- Leader lines go from the mark to an elbow at the column edge, then to the text. Callouts keep a minimum
  gap; `layoutCallouts()` moves a label down to keep the gap and moves the column up if it runs off the
  bottom.
- Under 700 px the callouts hide and the viewBox crops to the body; tap a mark to select it.

3D is a lazy chunk (`ControllerCanvas`), as RobotCanvas is: orbit controls without damping, the same
lights, the background token, CSS2D labels on bound inputs. Without WebGL it says so, and the 2D views
still work.

Selection: `?input=<id>`. A click on a row, a mark or a 3D input selects it; a second click clears it. The
selected input shows an `--ink` ring in 2D, an emissive accent in 3D, and an accent border on its row.

## Section 4: Error handling

- A bad `controls.json` throws a ContentError; the page ErrorBoundary shows it with Retry, as on the
  other pages.
- An unknown `?input=`, `?view=` or hash falls back to no selection, Front and the first controller.
- The robot has the page only when `robots.json` lists `controls`. The export keeps hand-kept doc kinds.

## Section 5: Tests

- `validate.test.ts`: a good file passes; an unknown model, an unknown input, a repeated input and a bad
  `how` fail with the path.
- `controllers/models.test.ts`: every input of each model has a mark in at least one view and exactly one
  3D mesh; every mark names a known input; the outline has at least three points.
- `logic/callouts.test.ts`: the minimum gap, the push-up at the bottom, the order by y.
- `pages/Controls.test.tsx`: the page opens on the first controller with its bindings; the hash picks the
  joystick and its note; Code shows the code lines; a row click writes `?input=` and marks the drawing;
  Back shows the triggers; 3D without WebGL shows the note.
- Browser check in the preview: both controllers, three views each, light and dark, 375 px width.

## Robot code findings (for the user, not for the page)

Per the rule to document the intended robot, these go to the user and not into `controls.json`:

1. `RobotContainer.java` Y binding: `onTrue(Commands.run(...resetPose...))`. `run` never ends and has no
   requirement, so after one press it resets the pose every loop. `runOnce` is the likely intent.
2. Same line: `new Rotation2d(isRedAlliance() ? 0 : 180)` takes radians; 180 rad is not 180 degrees.
3. `ShooterSubsystem.m_isAtSpeed()`: `abs(avg) - target < 3` is true below the target speed too, so the
   shoot binding feeds before the flywheel is at speed. Also the follower is Opposed, so the average of
   the two velocities can be near zero.
4. `IntakeExtensionSubsystem.retractIntake()` sets the same +0.5 throttle as `extendIntake()`.

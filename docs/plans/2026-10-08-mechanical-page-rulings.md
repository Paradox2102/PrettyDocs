# Mechanical page: rulings and deferred items

Decisions made during the build (2026-10-08) where the plan or spec left a choice, each with its cost if wrong.
Spec: `docs/specs/2026-10-08-mechanical-page-design.md`. Plan: `docs/plans/2026-10-08-mechanical-page.md`.

## Rulings

- **Task 1**: the paths/icons/Overview card entries for 'mechanical' land in Task 1, not Task 4. Record<DocKind,...> types do not compile without them. cost if wrong: none (the route lands in Task 4).
- **Task 1**: added "Hood max angle 90°" to the shooter seed (ShooterConstants.k_hoodMaxAngle). a pit-useful limit in the same constants block. cost if wrong: one row.
- **Task 3**: the subsystem view takes no hover or click (interactive only in viewer mode). the page's devices table carries the details. cost if wrong: no tooltip on the mechanical page.
- **Task 4**: the Mechanical page module loads normally (not React.lazy); its 3D part stays lazy in SubsystemView. the page is small, and a lazy page added a round trip. cost if wrong: about 6 kB more in the main chunk.
- **Task 4**: device rows become cards under 700 px, as on the Devices page (plan did not say). the 5-column table was 460 px wide on a 375 px phone. cost if wrong: none.
- **Final**: re-graded Minor 6 (3D box over the text in phone landscape) to Important and fixed. a rotated phone showed broken layout. browser DOM check 844x390: figure bottom 585, h2 top 610.
- **Final**: re-graded Minor 11 (README says all content is generated) to Important and fixed. it told the team not to edit the one hand-kept file. cost if wrong: none.
- **Final**: Minor 7 (gear reduction label) resolved by the CAD work: "Turret reduction 67.86:1", certain (CAD chain equals the code constant).

## Deferred minor findings (final review)

- latent camera reset from new subsystem prop identities on re-render.
- fact labels use code names (kicker, secondary kicker) that the devices table does not show.
- validateMechanical accepts empty mechanisms/groups lists.
- React keys from fact labels and note text may repeat.
- Overview card text names swerve, intake and shooter for every robot.
- weak no-3D state on a phone; the drag hint shows while loading.
- summaries repeat export-owned facts (motor models, CAN 20, bus names).
- Mechanical.tsx repeats the device row string logic from logic/devices.ts.

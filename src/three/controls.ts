// Orbit control settings, apart from the canvas so a test can read them without WebGL.

/** 2π/60 × speed rad/s: 2.8 is about 0.3 rad/s, one turn in 21 s. */
const AUTO_ROTATE_SPEED = 2.8;

/**
 * No damping: the view stops when the pointer stops (user, 2026-10-08). With damping, rotation left over from a drag
 * also kept turning the model during a right-drag pan or a zoom.
 */
export function controlSettings(enabled: boolean, autoRotate: boolean) {
  return { enableDamping: false, enabled, autoRotate, autoRotateSpeed: AUTO_ROTATE_SPEED };
}

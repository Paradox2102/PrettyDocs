// One frame of the 3D view, in the old viewer's order: move the camera, draw the scene, then place the labels.
// Labels placed before the camera update use last frame's camera and trail the models while the view turns.

interface Renders<S, C> {
  render(scene: S, camera: C): void;
}

export interface FrameParts<S, C> {
  scene: S;
  camera: C;
  controls: { update(delta?: number): unknown } | null;
  gl: Renders<S, C>;
  labels: Renders<S, C> | null;
}

export function drawFrame<S, C>(p: FrameParts<S, C>, delta: number): void {
  p.controls?.update(delta);
  p.gl.render(p.scene, p.camera);
  p.labels?.render(p.scene, p.camera);
}

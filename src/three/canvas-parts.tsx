// Parts every 3D canvas on the site shares: orbit controls, the frame loop and the background color.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Vec3 } from '../content/types';
import { controlSettings } from './controls';
import { drawFrame } from './frame';
import { useCssColor } from './theme-color';

/** three's OrbitControls, registered as the canvas's default controls so CameraRig can reach them. */
export function Controls({ target, enabled, autoRotate }: { target: Vec3; enabled: boolean; autoRotate: boolean }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const set = useThree((s) => s.set);
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);
  useEffect(() => {
    set({ controls });
    return () => {
      set({ controls: null });
      controls.dispose();
    };
  }, [controls, set]);
  useLayoutEffect(() => {
    Object.assign(controls, controlSettings(enabled, autoRotate));
  }, [controls, enabled, autoRotate]);
  useEffect(() => {
    controls.target.set(...target);
    controls.update();
  }, [controls, target]);
  return null;
}

/**
 * Owns the frame: priority 1 turns off R3F's own render, so the order is fixed (drawFrame: camera, scene, labels).
 * Controls come from the canvas state, because the Controls component registers them there.
 */
export function FrameLoop({ labels }: { labels: CSS2DRenderer | null }) {
  useFrame((state, delta) => drawFrame({ scene: state.scene, camera: state.camera,
    controls: state.controls as OrbitControls | null, gl: state.gl, labels }, delta), 1);
  return null;
}

export function Background({ token }: { token: string }) {
  const bg = useCssColor(token);
  return <color attach="background" args={[bg || '#f4f6f9']} />;
}

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Vec3 } from '../content/types';
import './Labels.css';

/**
 * Draws every Label in the scene as plain DOM over the canvas (three's CSS2DRenderer). One renderer per canvas;
 * no React root per label, so 70 labels cost little and unmount cleanly.
 */
export function LabelRenderer() {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const renderer = useMemo(() => new CSS2DRenderer(), []);
  useEffect(() => {
    const el = renderer.domElement;
    el.className = 'label-layer';
    const host = gl.domElement.parentElement?.parentElement;
    host?.appendChild(el);
    return () => el.remove();
  }, [gl, renderer]);
  useEffect(() => renderer.setSize(size.width, size.height), [renderer, size.width, size.height]);
  useFrame(({ scene, camera }) => renderer.render(scene, camera));
  return null;
}

/** A small text badge at a point in the scene. `color` sets the border (the --bus custom property). */
export function Label({ at, text, color, className = 'chain-num' }: { at: Vec3; text: string; color?: string;
  className?: string }) {
  const obj = useMemo(() => {
    const div = document.createElement('div');
    div.className = className;
    return new CSS2DObject(div);
  }, [className]);
  useLayoutEffect(() => {
    obj.element.textContent = text;
    if (color) obj.element.style.setProperty('--bus', color);
  }, [obj, text, color]);
  return <primitive object={obj} position={at} />;
}

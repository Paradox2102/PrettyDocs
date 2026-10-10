import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { use, useEffect, useMemo, useState } from 'react';
import { Box3, Color, Mesh, MeshStandardMaterial, Object3D, Sphere, Vector3 } from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Vec3 } from '../content/types';
import { Background, Controls, FrameLoop } from './canvas-parts';
import { loadModel } from './controllers';
import { PART_COLOR } from './controllers/parts';
import { Label, LabelLayer } from './Labels';
import { useCssColor } from './theme-color';

export interface ControllerCanvasProps {
  model: string;
  /** Callout text of each bound input, by input id. */
  labels: Map<string, string>;
  /** Input names, for the hover label. */
  names: Map<string, string>;
  selected: string | null;
  onSelect: (input: string) => void;
  className?: string;
}

/** Where the camera starts, as a direction from the model's centre: in front of and above the driver's hands. */
const START_DIR: Record<string, Vec3> = {
  'razer-wolverine-v2': [0.25, -0.75, 1.4],
  'logitech-extreme-3d-pro': [0.55, -1, 0.7],
};
const FOV = 32;

/** The input id of a picked mesh: the nearest parent with userData.input. */
function inputOf(o: Object3D | null): string | null {
  for (let p = o; p; p = p.parent) if (typeof p.userData.input === 'string') return p.userData.input;
  return null;
}

/**
 * One controller model in 3D. Bound inputs are in the accent color with their label; a click selects an input. The
 * model is loaded once per page load and kept (loadModel), so it is not disposed here.
 */
export default function ControllerCanvas({ model: modelId, labels, names, selected, onSelect, className }:
  ControllerCanvasProps) {
  const model = use(loadModel(modelId));
  const parts = useMemo(() => {
    model.updateMatrixWorld(true);
    const out = new Map<string, { obj: Object3D; top: Vec3 }>();
    model.traverse((o) => {
      const id = o.userData.input;
      if (typeof id !== 'string') return;
      const b = new Box3().setFromObject(o);
      const [dx, dy, dz] = (o.userData.labelOffset as Vec3).map((mm) => mm / 1000);
      out.set(id, { obj: o, top: [(b.min.x + b.max.x) / 2 + dx, (b.min.y + b.max.y) / 2 + dy, b.max.z + 0.005 + dz] });
    });
    return out;
  }, [model]);
  const frame = useMemo(() => {
    const s = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
    return { center: s.center.toArray() as Vec3, radius: s.radius };
  }, [model]);
  const [hover, setHover] = useState<string | null>(null);
  const accent = useCssColor('--accent') || '#a67c00';
  const renderer = useMemo(() => new CSS2DRenderer(), []);

  useEffect(() => {
    const on = new Color(accent);
    for (const [id, { obj }] of parts) {
      obj.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        const m = o.material as MeshStandardMaterial;
        const bound = labels.has(id);
        m.color.copy(bound ? on : ((m.userData.base as Color | undefined) ?? new Color(PART_COLOR)));
        // A glow as well as the color: under a dark clear cap (the Xbox face buttons) the color alone reads dim.
        const glow = id === selected ? 0.55 : bound ? 0.22 : 0;
        if (glow) m.emissive.copy(bound ? on : new Color(0x8a929b)).multiplyScalar(glow);
        else m.emissive.setScalar(id === hover ? 0.12 : 0);
      });
    }
  }, [parts, labels, selected, hover, accent]);

  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 4) return; // a drag to turn the model, not a click
    const id = inputOf(e.object);
    if (id) onSelect(id);
  };
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHover(inputOf(e.object));
  };

  const shown = [...labels].filter(([id]) => parts.has(id));
  const hoverTop = hover && !labels.has(hover) ? parts.get(hover)?.top : undefined;

  return (
    <Canvas className={className} dpr={[1, 2]} gl={{ antialias: true }} style={{ touchAction: 'none', cursor: hover ? 'pointer' : 'grab' }}
      camera={{ fov: FOV, near: 0.005, far: 5, up: [0, 0, 1] }}>
      <Background token="--surface" />
      <hemisphereLight args={[0xffffff, 0x50555c, 1.6]} />
      <directionalLight position={[0.4, -0.6, 1]} intensity={1.8} />
      <directionalLight position={[-0.6, 0.8, 0.3]} intensity={0.6} />
      <primitive object={model} onClick={pick} onPointerOver={over} onPointerOut={() => setHover(null)} />
      <LabelLayer renderer={renderer} />
      {shown.map(([id, text]) => (
        <Label key={id} at={parts.get(id)!.top} text={text} className={id === selected ? 'ctl-label on' : 'ctl-label'} />
      ))}
      {hoverTop && hover ? <Label at={hoverTop} text={`${names.get(hover) ?? hover} · not used`} className="ctl-label off" /> : null}
      <Controls target={frame.center} enabled autoRotate={false} />
      <FrameLoop labels={renderer} />
      <StartCamera dir={START_DIR[modelId] ?? [0, -1, 1]} center={frame.center} radius={frame.radius} />
    </Canvas>
  );
}

/** Puts the camera at the start direction, far enough back that the whole model fits the view. */
function StartCamera({ dir, center, radius }: { dir: Vec3; center: Vec3; radius: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: Vector3; update(): void } | null;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useEffect(() => {
    if (!controls) return;
    const dist = (radius / Math.sin((FOV / 2) * (Math.PI / 180))) * Math.max(1, 1 / aspect) * 1.05;
    const d = new Vector3(...dir).normalize().multiplyScalar(dist);
    camera.position.set(center[0] + d.x, center[1] + d.y, center[2] + d.z);
    controls.target.set(...center);
    controls.update();
    // Only a new model moves the camera; a resize must not undo the user's turn.
  }, [controls, camera, dir, center, radius]);
  return null;
}

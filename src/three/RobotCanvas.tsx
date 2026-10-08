import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useEffectEvent, useLayoutEffect, useMemo } from 'react';
import { Object3D, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Scene, Vec3 } from '../content/types';
import { frame, frameGroups, sceneByRegistryKey } from '../logic/scene';
import { subsystemStyle, type StyleItem } from '../logic/viewer';
import { CanLoops, DeviceTags, LayerCables } from './Cables';
import { cameraPosition, VIEWS, type ViewName } from './cameraViews';
import { RobotModel, type DeviceEvent } from './RobotModel';
import { useCssColor, useReducedMotion } from './theme-color';
import { drawFrame } from './frame';
import { Label, LabelLayer } from './Labels';

// The CAD and the robot code use +z up.
Object3D.DEFAULT_UP.set(0, 0, 1);

const INCH = 0.0254;
/** The width / height of the old viewer's 3D area, where the camera presets were tuned. */
const ASPECT_TUNED = 1.3;

/** 2π/60 × speed rad/s: 2.8 is about 0.3 rad/s, one turn in 21 s. */
const AUTO_ROTATE_SPEED = 2.8;
const NO_SELECTION = new Set<string>();

export interface RobotCanvasProps {
  scene: Scene;
  /**
   * showcase: neutral colors, slow turn, no input (the overview hero). viewer: the full 3D page. subsystem: one
   * subsystem solid with its devices in bus color and CAN ID bubbles, the rest faint (the mechanical page).
   */
  mode: 'showcase' | 'viewer' | 'subsystem';
  /** subsystem mode: scene group ids drawn solid and registry keys of the subsystem's devices. */
  subsystem?: { groups: string[]; devices: string[] };
  selected?: Set<string>;
  ghost?: number;
  view?: ViewName;
  /** Bump to move the camera to `view` again. */
  viewNonce?: number;
  /** A device anchor to aim at (a ?device= link). */
  focus?: Vec3 | null;
  onHover?: DeviceEvent;
  onPick?: DeviceEvent;
  className?: string;
}

/** Other groups in the subsystem view: faint enough that the subsystem reads first. */
const SUBSYSTEM_GHOST = 0.06;

export default function RobotCanvas({ scene, mode, selected = NO_SELECTION, ghost = 0.15, view = 'iso', viewNonce = 0,
  focus = null, onHover, onPick, className, subsystem }: RobotCanvasProps) {
  const f = useMemo(() => frame(scene), [scene]);
  const showcase = mode === 'showcase';
  const sub = useMemo(() => {
    if (mode !== 'subsystem' || !subsystem) return null;
    const byKey = sceneByRegistryKey(scene);
    const focusSets = { groups: new Set(subsystem.groups), devices: new Set(subsystem.devices) };
    return {
      frame: frameGroups(scene, subsystem.groups),
      devices: subsystem.devices.map((k) => byKey.get(k)).filter((d) => d !== undefined),
      styleOf: (item: StyleItem) => subsystemStyle(item, focusSets, SUBSYSTEM_GHOST),
    };
  }, [mode, scene, subsystem]);
  const center = sub ? sub.frame.center : f.center;
  const radius = sub ? sub.frame.radius : f.radius;
  const reduced = useReducedMotion();
  const start = cameraPosition('iso', f.center, f.radius);
  const labels = useMemo(() => (showcase ? null : new CSS2DRenderer()), [showcase]);

  return (
    <Canvas className={className} dpr={[1, 2]} gl={{ antialias: true, alpha: showcase }}
      camera={{ fov: 38, near: 0.01, far: 50, position: start }}
      style={showcase ? { pointerEvents: 'none' } : { touchAction: 'none' }}>
      {showcase ? null : <Background token={sub ? '--surface' : '--bg'} />}
      <hemisphereLight args={[0xffffff, 0x50555c, 1.7]} />
      <directionalLight position={[2, 1.2, 3]} intensity={1.6} />
      <directionalLight position={[-2, -1.5, 1]} intensity={0.5} />
      <RobotModel scene={scene} selected={selected} ghost={ghost} interactive={mode === 'viewer'} onHover={onHover} onPick={onPick}
        styleOf={sub?.styleOf} />
      {sub ? (
        <>
          {labels ? <LabelLayer renderer={labels} /> : null}
          <DeviceTags devices={sub.devices} />
        </>
      ) : null}
      {mode !== 'viewer' ? null : (
        <>
          {labels ? <LabelLayer renderer={labels} /> : null}
          <Floor center={f.center} />
          <FrontArrow x={f.foot[2] + 0.06} y={f.center[1]} />
          <CanLoops scene={scene} selected={selected} />
          <LayerCables scene={scene} selected={selected} />
        </>
      )}
      <Controls target={center} enabled={!showcase} autoRotate={showcase && !reduced} />
      <FrameLoop labels={labels} />
      <CameraRig view={view} nonce={viewNonce} focus={focus} center={center} radius={radius} />
    </Canvas>
  );
}

/** three's OrbitControls, registered as the canvas's default controls so CameraRig can reach them. */
function Controls({ target, enabled, autoRotate }: { target: Vec3; enabled: boolean; autoRotate: boolean }) {
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
    controls.enableDamping = true;
    controls.enabled = enabled;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
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
function FrameLoop({ labels }: { labels: CSS2DRenderer | null }) {
  useFrame((state, delta) => drawFrame({ scene: state.scene, camera: state.camera,
    controls: state.controls as OrbitControls | null, gl: state.gl, labels }, delta), 1);
  return null;
}

function Background({ token }: { token: string }) {
  const bg = useCssColor(token);
  return <color attach="background" args={[bg || '#f4f6f9']} />;
}

/** A 48 in square floor on z = 0: 3 in minor and 12 in major lines. GridHelper lies in XZ, so it is turned. */
function Floor({ center }: { center: Vec3 }) {
  const minor = useCssColor('--line') || '#d8dee8';
  const major = useCssColor('--muted') || '#5b6578';
  return (
    <group key={minor + major} position={[center[0], center[1], 0]} rotation-x={Math.PI / 2}>
      <gridHelper args={[48 * INCH, 16, minor, minor]} />
      <gridHelper args={[48 * INCH, 4, major, major]} />
    </group>
  );
}

function FrontArrow({ x, y }: { x: number; y: number }) {
  const args = useMemo(() => [new Vector3(1, 0, 0), new Vector3(x, y, 0.002), 0.22, 0x8a929b, 0.06, 0.045] as const, [x, y]);
  return (
    <>
      <arrowHelper args={args} />
      {/* The code's front; the CAD calls the intake side the back. */}
      <Label at={[x + 0.28, y, 0.01]} text="FRONT · INTAKE" className="front-label" />
    </>
  );
}

/** Moves the camera to a preset when `nonce` changes, or aims at `focus` from the 3/4 direction. */
function CameraRig({ view, nonce, focus, center, radius }: { view: ViewName; nonce: number; focus: Vec3 | null;
  center: Vec3; radius: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControls | null;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  // The presets were tuned for a wide view; a narrow or tall view moves the camera back so the robot still fits.
  const fit = radius * Math.max(1, ASPECT_TUNED / aspect);
  // A resize alone must not move a camera the user has turned, so `fit` is read here but not watched.
  const place = useEffectEvent(() => {
    if (!controls) return;
    if (focus && nonce === 0) {
      const o = VIEWS.iso;
      const r = fit * 0.5;
      camera.position.set(focus[0] + o[0] * r, focus[1] + o[1] * r, focus[2] + o[2] * r);
      controls.target.set(...focus);
    } else {
      camera.position.set(...cameraPosition(view, center, fit));
      controls.target.set(...center);
    }
    controls.update();
  });
  useEffect(() => place(), [controls, view, nonce, focus, center]);
  return null;
}

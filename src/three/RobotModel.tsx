import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, MeshStandardMaterial } from 'three';
import type { MeshData, Scene, SceneDevice } from '../content/types';
import { decodeMesh, driveStyle, meshParts, styleFor, type Style, type StyleItem } from '../logic/viewer';

export type DeviceEvent = (device: SceneDevice | null, x: number, y: number) => void;

interface Item {
  key: string;
  geometry: BufferGeometry;
  style: StyleItem;
  device?: SceneDevice;
  renderOrder: number;
  /** The mesh has power-transfer parts, drawn with a second material. */
  drive: boolean;
}

function geometry(md: MeshData, driveTris?: number): BufferGeometry {
  const { positions, indices } = decodeMesh(md);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(positions, 3));
  g.setIndex(new BufferAttribute(indices, 1));
  g.computeVertexNormals();
  for (const p of meshParts(md.tris, driveTris)) g.addGroup(p.start, p.count, p.material);
  return g;
}

function newMaterial() {
  return new MeshStandardMaterial({ roughness: 0.72, metalness: 0.08, flatShading: true, side: DoubleSide });
}

function applyStyle(material: MeshStandardMaterial, s: Style) {
  material.color.set(s.color);
  material.opacity = s.opacity;
  if (material.transparent !== s.transparent) {
    material.transparent = s.transparent;
    material.needsUpdate = true;
  }
  material.depthWrite = !s.transparent;
}

interface Props {
  scene: Scene;
  selected: Set<string>;
  ghost: number;
  interactive: boolean;
  onHover?: DeviceEvent;
  onPick?: DeviceEvent;
  /** A different color rule (the mechanical page's subsystem view); the default is styleFor(selected, ghost). */
  styleOf?: (item: StyleItem) => Style;
}

/** The mechanism groups (their power-transfer parts in a darker shade), the devices and the SystemCore, colored by styleFor(). */
export function RobotModel({ scene, selected, ghost, interactive, onHover, onPick, styleOf }: Props) {
  const items = useMemo<Item[]>(() => [
    ...scene.groups.map((g) => ({ key: `group:${g.id}`, geometry: geometry(g.mesh, g.drive_tris),
      style: { kind: 'group', group: g.id }, renderOrder: 0, drive: meshParts(g.mesh.tris, g.drive_tris).length > 0 })),
    ...scene.devices.map((d) => ({ key: d.key ?? d.role, geometry: geometry(d.mesh),
      style: { kind: d.kind, bus: d.bus, layers: d.layers ?? [], registryKey: d.registry_key }, device: d, renderOrder: 2,
      drive: false })),
    { key: 'systemcore', geometry: geometry(scene.systemcore.mesh),
      style: { kind: 'systemcore', layers: scene.systemcore.layers ?? [], registryKey: scene.systemcore.registry_key },
      device: scene.systemcore, renderOrder: 2, drive: false },
  ], [scene]);

  useEffect(() => () => items.forEach((i) => i.geometry.dispose()), [items]);

  return (
    <group>
      {items.map((it) => (
        <ItemMesh key={it.key} item={it} selected={selected} ghost={ghost} interactive={interactive}
          onHover={onHover} onPick={onPick} styleOf={styleOf} />
      ))}
    </group>
  );
}

function ItemMesh({ item, selected, ghost, interactive, onHover, onPick, styleOf }: { item: Item } & Omit<Props, 'scene'>) {
  const material = useMemo(newMaterial, []);
  const driveMaterial = useMemo(() => (item.drive ? newMaterial() : null), [item.drive]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => driveMaterial?.dispose(), [driveMaterial]);
  const s = styleOf ? styleOf(item.style) : styleFor(item.style, selected, ghost);
  useLayoutEffect(() => {
    applyStyle(material, s);
    if (driveMaterial) applyStyle(driveMaterial, driveStyle(s));
  }, [material, driveMaterial, s.color, s.opacity, s.transparent]);

  const device = item.device;
  const handlers = interactive && device ? {
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== 'mouse' || !e.object.visible) return;
      e.stopPropagation();
      onHover?.(device, e.nativeEvent.clientX, e.nativeEvent.clientY);
    },
    onPointerOut: () => onHover?.(null, 0, 0),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!e.object.visible) return;
      e.stopPropagation();
      onPick?.(device, e.nativeEvent.clientX, e.nativeEvent.clientY);
    },
  } : {};

  return <mesh geometry={item.geometry} material={driveMaterial ? [material, driveMaterial] : material}
    renderOrder={item.renderOrder} visible={s.opacity > 0}
    {...handlers} />;
}

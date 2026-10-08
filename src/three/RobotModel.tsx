import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, MeshStandardMaterial } from 'three';
import type { MeshData, Scene, SceneDevice } from '../content/types';
import { decodeMesh, styleFor, type StyleItem } from '../logic/viewer';

export type DeviceEvent = (device: SceneDevice | null, x: number, y: number) => void;

interface Item {
  key: string;
  geometry: BufferGeometry;
  style: StyleItem;
  device?: SceneDevice;
  renderOrder: number;
}

function geometry(md: MeshData): BufferGeometry {
  const { positions, indices } = decodeMesh(md);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(positions, 3));
  g.setIndex(new BufferAttribute(indices, 1));
  g.computeVertexNormals();
  return g;
}

interface Props {
  scene: Scene;
  selected: Set<string>;
  ghost: number;
  interactive: boolean;
  onHover?: DeviceEvent;
  onPick?: DeviceEvent;
}

/** The mechanism groups, the devices and the SystemCore, colored by styleFor(). */
export function RobotModel({ scene, selected, ghost, interactive, onHover, onPick }: Props) {
  const items = useMemo<Item[]>(() => [
    ...scene.groups.map((g) => ({ key: `group:${g.id}`, geometry: geometry(g.mesh), style: { kind: 'group', group: g.id },
      renderOrder: 0 })),
    ...scene.devices.map((d) => ({ key: d.key ?? d.role, geometry: geometry(d.mesh),
      style: { kind: d.kind, bus: d.bus, layers: d.layers ?? [] }, device: d, renderOrder: 2 })),
    { key: 'systemcore', geometry: geometry(scene.systemcore.mesh),
      style: { kind: 'systemcore', layers: scene.systemcore.layers ?? [] }, device: scene.systemcore, renderOrder: 2 },
  ], [scene]);

  useEffect(() => () => items.forEach((i) => i.geometry.dispose()), [items]);

  return (
    <group>
      {items.map((it) => (
        <ItemMesh key={it.key} item={it} selected={selected} ghost={ghost} interactive={interactive}
          onHover={onHover} onPick={onPick} />
      ))}
    </group>
  );
}

function ItemMesh({ item, selected, ghost, interactive, onHover, onPick }: { item: Item } & Omit<Props, 'scene'>) {
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.72, metalness: 0.08, flatShading: true,
    side: DoubleSide }), []);
  useEffect(() => () => material.dispose(), [material]);
  const s = styleFor(item.style, selected, ghost);
  useLayoutEffect(() => {
    material.color.set(s.color);
    material.opacity = s.opacity;
    if (material.transparent !== s.transparent) {
      material.transparent = s.transparent;
      material.needsUpdate = true;
    }
    material.depthWrite = !s.transparent;
  }, [material, s.color, s.opacity, s.transparent]);

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

  return <mesh geometry={item.geometry} material={material} renderOrder={item.renderOrder} visible={s.opacity > 0}
    {...handlers} />;
}

import { useEffect, useMemo } from 'react';
import { CurvePath, LineCurve3, TubeGeometry, Vector3 } from 'three';
import type { Scene, SceneBus, SceneDevice, SceneLayer, Vec3 } from '../content/types';
import { Label } from './Labels';
import { AMBER, BUS_COLORS, cableLabel, canTag, cablePoints, LAYER_COLORS, layerCables, layerTagClass, USB_COLOR } from '../logic/viewer';

/** Metres above the anchor, so a layer tag does not cover a chain number. */
const TAG_LIFT: Record<string, number> = { power: 0.03, network: 0.055 };

function useDevicesByKey(scene: Scene) {
  return useMemo(() => Object.fromEntries(scene.devices.map((d) => [d.key ?? '', d])) as Record<string, SceneDevice>, [scene]);
}

/** Every CAN loop: a tube from the SystemCore through the chain, and the CAN ID at each device (canTag). */
export function CanLoops({ scene, selected }: { scene: Scene; selected: Set<string> }) {
  const byKey = useDevicesByKey(scene);
  return (
    <>
      {scene.buses.map((b) => selected.has(b.bus)
        ? <BusLoop key={b.bus} bus={b} byKey={byKey} start={scene.systemcore.anchor} /> : null)}
    </>
  );
}

function BusLoop({ bus, byKey, start }: { bus: SceneBus; byKey: Record<string, SceneDevice>; start: Vec3 }) {
  const color = BUS_COLORS[bus.bus];
  const chain = useMemo(() => bus.chain.filter((k) => byKey[k]), [bus, byKey]);
  const tube = useMemo(() => {
    const pts = cablePoints({ chain }, byKey, start).map((p) => new Vector3(...p));
    if (pts.length < 2) return null;
    const path = new CurvePath<Vector3>();
    for (let i = 1; i < pts.length; i++) path.add(new LineCurve3(pts[i - 1], pts[i]));
    return new TubeGeometry(path, Math.max(8, (pts.length - 1) * 8), 0.003, 8, false);
  }, [chain, byKey, start]);
  useEffect(() => () => tube?.dispose(), [tube]);
  return (
    <group>
      {tube ? <mesh geometry={tube} renderOrder={3}><meshBasicMaterial color={color} /></mesh> : null}
      {chain.map((k) => (
        <Label key={k} at={byKey[k].anchor} color={color} text={canTag(byKey[k])} />
      ))}
    </group>
  );
}

/** The Power and Network layers: a tube per cable, a USB label on camera cables, and a tag at each device. */
export function LayerCables({ scene, selected }: { scene: Scene; selected: Set<string> }) {
  const byKey = useDevicesByKey(scene);
  return (
    <>
      {scene.layers.map((l) => selected.has(l.id)
        ? <Layer key={l.id} layer={l} byKey={byKey} systemcore={scene.systemcore.anchor} /> : null)}
    </>
  );
}

function Layer({ layer, byKey, systemcore }: { layer: SceneLayer; byKey: Record<string, SceneDevice>; systemcore: Vec3 }) {
  const color = LAYER_COLORS[layer.id];
  const anchorOf = useMemo(() => (k: string): Vec3 | undefined => (k === 'systemcore' ? systemcore : byKey[k]?.anchor),
    [byKey, systemcore]);
  const cables = useMemo(() => layerCables(layer, anchorOf).map((c) => ({
    c,
    geo: new TubeGeometry(new LineCurve3(new Vector3(...c.a), new Vector3(...c.b)), 8,
      c.main ? 0.005 : c.unknown || c.usb ? 0.002 : 0.003, 8, false),
  })), [layer, anchorOf]);
  useEffect(() => () => cables.forEach((x) => x.geo.dispose()), [cables]);

  return (
    <group>
      {cables.map(({ c, geo }, i) => {
        const tint = c.usb ? USB_COLOR : c.unknown ? AMBER : color;
        const label = cableLabel(c);
        return (
          <group key={i}>
            <mesh geometry={geo} renderOrder={3}>
              <meshBasicMaterial color={tint} transparent={c.assumed || c.unknown}
                opacity={c.assumed ? 0.45 : c.unknown ? 0.6 : 1} />
            </mesh>
            {label ? <Label at={label.at} color={USB_COLOR} text={label.text} /> : null}
          </group>
        );
      })}
      {(layer.tags ?? []).map((t, i) => {
        const p = anchorOf(t.device);
        if (!p) return null;
        return <Label key={`t${i}`} at={[p[0], p[1], p[2] + (TAG_LIFT[layer.id] ?? 0)]}
          color={t.style === 'amber' ? AMBER : color} text={t.text} className={layerTagClass(layer.id)} />;
      })}
    </group>
  );
}

/** A CAN ID bubble (canTag) on each given scene device that is on a CAN bus: the mechanical page's subsystem view. */
export function DeviceTags({ devices }: { devices: SceneDevice[] }) {
  return (
    <>
      {devices.filter((d) => d.bus).map((d) => (
        <Label key={d.key ?? d.role} at={d.anchor} color={BUS_COLORS[d.bus as string]} text={canTag(d)} />
      ))}
    </>
  );
}

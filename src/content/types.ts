// Shapes of the content files in public/content/. The export script in ~/systemcore writes them;
// src/content/validate.ts checks them at load time.

export type Vec3 = [number, number, number];
export type Bbox = [number, number, number, number];

export interface CanInfo {
  bus: string;
  id: string | null;
  id_uncertain?: boolean;
  code_name?: string | null;
}

export interface PowerInfo {
  pdh_channel?: number | null;
  pdh_uncertain?: boolean;
  fed_by?: string | null;
  note?: string | null;
}

export interface NetworkInfo {
  ip?: string | null;
  name?: string | null;
  mac?: string | null;
  mac_note?: string | null;
  radio_port?: string | null;
  radio_port_uncertain?: boolean;
  host_note?: string | null;
}

export type PdhStyle = 'red' | 'amber' | 'none';

export interface Derived {
  wire_order: string | null;
  pdh_tag: [string, PdhStyle];
  cad_comment: string | null;
  open: boolean;
  open_reasons: string[];
  fed_by_role: string | null;
  attached_to_role: string | null;
  bbox: Bbox | null;
  top_bbox: Bbox | null;
}

/** One registry device as the wiring page sees it: devices.json plus the derived facts. */
export interface Device {
  key: string;
  icon?: string | null;
  type?: string | null;
  role?: string | null;
  mechanism?: string | null;
  module?: string | null;
  can?: CanInfo | null;
  power?: PowerInfo | null;
  network?: NetworkInfo | null;
  attached_to?: string | null;
  attached_uncertain?: boolean;
  notes?: string[];
  derived: Derived;
}

/** A mesh packed by build_scene.py: uint16 positions quantized over a box, base64. */
export interface MeshData {
  pos: string;
  min: Vec3;
  scale: Vec3;
  idx: string;
  idx32: boolean;
  tris: number;
}

/** A device in the 3D scene. `key` is the scene key (for example "can_s2:4"); `registry_key` links to devices. */
export interface SceneDevice {
  key?: string;
  kind: string;
  bus: string | null;
  chain_index?: number;
  can_id?: string | null;
  role: string;
  mechanism: string;
  device_type: string;
  motor?: string | null;
  status: string;
  comment?: string | null;
  ip?: string | null;
  anchor: Vec3;
  box: number[];
  registry_key: string | null;
  pdh: string | null;
  on_robot?: boolean;
  mesh: MeshData;
  layers?: string[];
}

export type DocKind = 'wiring' | '3d' | 'devices';
export const DOC_KINDS: DocKind[] = ['wiring', '3d', 'devices'];

export interface RobotEntry {
  id: string;
  name: string;
  season: string;
  summary: string;
  built: string;
  docs: DocKind[];
}

export interface RobotIndex {
  latest: string;
  robots: RobotEntry[];
}

export interface WiringData {
  built: string;
  view: [number, number, number, number];
  devices: Record<string, Device>;
}

export interface SceneGroup {
  id: string;
  label: string;
  box: number[];
  mesh: MeshData;
}

export interface SceneBus {
  bus: string;
  function: string;
  chain: string[];
  warning: string | null;
}

export interface SceneLayer {
  id: string;
  label: string;
  function: string;
  members: string[];
  cables?: { from: string; to: string; assumed?: boolean; main?: boolean; unknown?: boolean; usb?: boolean }[];
  tags?: { device: string; text: string; style?: string }[];
}

export interface Scene {
  meta: { document: string; microversion: string; cell_mm: number; built: string; triangles: number };
  groups: SceneGroup[];
  devices: SceneDevice[];
  systemcore: SceneDevice;
  buses: SceneBus[];
  layers: SceneLayer[];
}

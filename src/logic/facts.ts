import type { WiringData } from '../content/types';
import { MOTOR } from './wiring';

export interface Fact {
  label: string;
  value: number;
}

/** The overview's facts strip, counted from the wiring data. */
export function robotFacts(w: WiringData): Fact[] {
  const devices = Object.values(w.devices);
  const distinct = <T,>(xs: (T | null | undefined)[]) => new Set(xs.filter((x) => x !== null && x !== undefined)).size;
  return [
    { label: 'Devices', value: devices.length },
    { label: 'Motors', value: devices.filter((d) => d.icon && d.icon in MOTOR).length },
    { label: 'CAN buses', value: distinct(devices.map((d) => d.can?.bus)) },
    { label: 'PDH channels', value: distinct(devices.map((d) => d.power?.pdh_channel)) },
    { label: 'Network devices', value: devices.filter((d) => d.network?.ip).length },
    { label: 'Open items', value: devices.filter((d) => d.derived.open).length },
  ];
}

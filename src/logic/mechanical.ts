// Rules for the mechanical page that need no browser.
import type { Device, Subsystem, WiringData } from '../content/types';

/** The subsystem's devices: wiring devices whose registry mechanism the subsystem names, in registry order. */
export function subsystemDevices(w: WiringData, s: Subsystem): Device[] {
  const names = new Set(s.mechanisms);
  return Object.values(w.devices).filter((d) => d.mechanism != null && names.has(d.mechanism));
}

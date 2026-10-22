// Groups of the icon gallery: by type (the index's own order) or by vendor (vendor name order).
import type { IconIndex, IconRecord } from '../content/types';

export type GroupBy = 'type' | 'vendor';

export interface IconGroup {
  /** The section id, also the #hash of its jump link. Vendor ids get a "vendor-" prefix so they never clash with a type. */
  id: string;
  name: string;
  icons: IconRecord[];
}

/** The ?by= value of the URL: "vendor" groups by vendor; anything else groups by type. */
export function groupBy(param: string | null): GroupBy {
  return param === 'vendor' ? 'vendor' : 'type';
}

const byName = (a: IconRecord, b: IconRecord) => a.name.localeCompare(b.name);

/** The icons whose name, vendor name, part number or slug contain every word of `query` (any case). */
export function filterIcons(index: IconIndex, query: string): IconIndex {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return index;
  const icons = index.icons.filter((i) => {
    const text = [i.name, i.vendor_name, i.part_number ?? '', i.slug].join(' ').toLowerCase();
    return words.every((w) => text.includes(w));
  });
  return { ...index, icons };
}

/** The icons to show: legacy icons (no longer sold) only when `showLegacy` is on. */
export function hideLegacy(index: IconIndex, showLegacy: boolean): IconIndex {
  return showLegacy ? index : { ...index, icons: index.icons.filter((i) => i.status !== 'legacy') };
}

/** The groups that have icons: by type in the index's type order, or by vendor in vendor name order. */
export function groupIcons(index: IconIndex, by: GroupBy): IconGroup[] {
  if (by === 'type') {
    return index.types
      .map((t) => ({ id: t.id, name: t.name, icons: index.icons.filter((i) => i.type === t.id) }))
      .filter((g) => g.icons.length > 0);
  }
  const typeOrder = new Map(index.types.map((t, n) => [t.id, n]));
  const vendors = new Map<string, IconGroup>();
  for (const icon of index.icons) {
    const group = vendors.get(icon.vendor) ?? { id: `vendor-${icon.vendor}`, name: icon.vendor_name, icons: [] };
    group.icons.push(icon);
    vendors.set(icon.vendor, group);
  }
  for (const g of vendors.values()) {
    g.icons.sort((a, b) => (typeOrder.get(a.type) ?? 0) - (typeOrder.get(b.type) ?? 0) || byName(a, b));
  }
  // "generic" (several makers, such as the FRC battery) is not a vendor name: it goes after the named vendors.
  const last = (g: IconGroup) => (g.id === 'vendor-generic' ? 1 : 0);
  return [...vendors.values()].sort((a, b) => last(a) - last(b) || a.name.localeCompare(b.name));
}

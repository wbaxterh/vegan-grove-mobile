/**
 * Place type vocabulary (SCAFFOLD-SPEC sections 4 and 9), in display order.
 *
 * Sanctuaries and gardens come first because visiting either is an action in
 * its own right; the rest is where to eat and shop. The two action types carry
 * a one-line blurb for the place sheet and a marker glyph for the map.
 */

import type { PlaceType, VeganLevel } from '@/lib/api/types';

export interface PlaceTypeInfo {
  value: PlaceType;
  label: string;
  /** One line of context on the place sheet. Only the action types need it. */
  blurb?: string;
  /** Single monospace letter drawn inside the map marker. */
  glyph?: string;
}

export const PLACE_TYPES: ReadonlyArray<PlaceTypeInfo> = [
  {
    value: 'sanctuary',
    label: 'sanctuary',
    blurb: 'Rescued animals living out their lives. Visit, volunteer, or give.',
    glyph: 'S',
  },
  {
    value: 'garden',
    label: 'garden',
    blurb: 'A community garden or allotment. Grow food, meet your neighbors.',
    glyph: 'G',
  },
  { value: 'restaurant', label: 'restaurant' },
  { value: 'cafe', label: 'cafe' },
  { value: 'grocery', label: 'grocery' },
  { value: 'shop', label: 'shop' },
  { value: 'organization', label: 'organization' },
  { value: 'venue', label: 'venue' },
];

export function placeTypeInfo(type: PlaceType): PlaceTypeInfo {
  return PLACE_TYPES.find((entry) => entry.value === type) ?? { value: type, label: type };
}

export function placeTypeLabel(type: PlaceType): string {
  return placeTypeInfo(type).label;
}

export const VEGAN_LEVEL_LABEL: Record<VeganLevel, string> = {
  full: 'fully vegan',
  options: 'vegan options',
};

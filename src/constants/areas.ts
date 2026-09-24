/**
 * The fixed `homeArea` list from SCAFFOLD-SPEC section 4. A member picks one;
 * it is the only location-shaped field on a user and it is never shown to
 * anyone else.
 */

import type { HomeArea } from '@/lib/api/types';

export const HOME_AREAS: ReadonlyArray<{ value: HomeArea; label: string }> = [
  { value: 'la_westside', label: 'LA Westside' },
  { value: 'la_eastside', label: 'LA Eastside' },
  { value: 'south_bay', label: 'South Bay' },
  { value: 'long_beach', label: 'Long Beach' },
  { value: 'sgv', label: 'San Gabriel Valley' },
  { value: 'sfv', label: 'San Fernando Valley' },
  { value: 'orange_county', label: 'Orange County' },
  { value: 'inland_empire', label: 'Inland Empire' },
  { value: 'san_diego', label: 'San Diego' },
  { value: 'ventura', label: 'Ventura' },
  { value: 'other', label: 'Somewhere else' },
];

export function areaLabel(area: HomeArea | undefined | null): string {
  return HOME_AREAS.find((a) => a.value === area)?.label ?? 'Not set';
}

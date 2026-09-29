/**
 * Places tab filters (zustand).
 *
 * Not in the URL: the Places tab is one screen and the filters are a member's
 * working state, not something to deep-link. Defaults follow SCAFFOLD-SPEC
 * section 9: fully vegan only, chains hidden, every type. Nothing here is
 * persisted or sent anywhere except as query parameters on the places calls.
 */

import { create } from 'zustand';
import type { PlaceFilters, PlaceType, VeganLevel, VeganLevelFilter } from '@/lib/api/types';

export const DEFAULT_PLACE_FILTERS: PlaceFilters = {
  veganLevel: 'full',
  types: [],
  includeChains: false,
};

export function levelIncluded(filter: VeganLevelFilter, level: VeganLevel): boolean {
  return filter === 'all' || filter === level;
}

function toggleLevel(filter: VeganLevelFilter, level: VeganLevel): VeganLevelFilter {
  if (filter === 'all') return level === 'full' ? 'options' : 'full';
  // The last level on stays on, so the query never asks for nothing.
  if (filter === level) return filter;
  return 'all';
}

export interface PlaceFiltersState {
  filters: PlaceFilters;
  toggleVeganLevel: (level: VeganLevel) => void;
  toggleChains: () => void;
  /** An empty `types` list means every type. */
  toggleType: (type: PlaceType) => void;
  reset: () => void;
}

export const usePlaceFiltersStore = create<PlaceFiltersState>((set) => ({
  filters: DEFAULT_PLACE_FILTERS,

  toggleVeganLevel: (level) =>
    set(({ filters }) => ({
      filters: { ...filters, veganLevel: toggleLevel(filters.veganLevel, level) },
    })),

  toggleChains: () =>
    set(({ filters }) => ({ filters: { ...filters, includeChains: !filters.includeChains } })),

  toggleType: (type) =>
    set(({ filters }) => ({
      filters: {
        ...filters,
        types: filters.types.includes(type)
          ? filters.types.filter((entry) => entry !== type)
          : [...filters.types, type],
      },
    })),

  reset: () => set({ filters: DEFAULT_PLACE_FILTERS }),
}));

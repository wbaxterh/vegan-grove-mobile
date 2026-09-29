/**
 * Places routes. Every read takes a bounding box, which is the only location
 * shape the app ever sends (privacy rule 3), plus the shared filters.
 *
 * Two reads back the Places tab: `map-pins` is the small record for markers
 * and refetches on every pan; `places` is the full page for the list and the
 * sheet. Same bbox, same filters, so the two never disagree.
 */

import { ENDPOINTS } from '@/constants/api';
import { api } from './client';
import type {
  Bbox,
  MapPinsResponse,
  Page,
  Place,
  PlaceFilters,
  PlaceInput,
  PlaceReview,
  PlaceReviewInput,
  PlacesQuery,
} from './types';

/** `w,s,e,n` with 5 decimals (about 1 m), enough for a map query, nothing more. */
export function bboxParam(bbox: Bbox): string {
  return [bbox.west, bbox.south, bbox.east, bbox.north].map((n) => n.toFixed(5)).join(',');
}

/** Query-string form of the shared filters. `types` is left off when it means every type. */
export function filterParams(filters: PlaceFilters) {
  return {
    veganLevel: filters.veganLevel,
    types: filters.types.length > 0 ? filters.types.join(',') : undefined,
    includeChains: filters.includeChains,
  };
}

/** Stable cache-key fragment for the filters, independent of chip tap order. */
export function filtersKey(filters: PlaceFilters): string {
  return [
    filters.veganLevel,
    [...filters.types].sort().join(','),
    filters.includeChains ? 'chains' : 'nochains',
  ].join('|');
}

export function listPlaces(query: PlacesQuery, signal?: AbortSignal): Promise<Page<Place>> {
  return api.get<Page<Place>>(ENDPOINTS.places.list, {
    query: {
      bbox: bboxParam(query.bbox),
      ...filterParams(query.filters),
      q: query.q,
      cursor: query.cursor,
    },
    skipAuth: true,
    signal,
  });
}

/** Markers only. Same bbox and filters as the list, a fraction of the payload. */
export function fetchMapPins(
  bbox: Bbox,
  filters: PlaceFilters,
  signal?: AbortSignal,
): Promise<MapPinsResponse> {
  return api.get<MapPinsResponse>(ENDPOINTS.places.mapPins, {
    query: { bbox: bboxParam(bbox), ...filterParams(filters) },
    skipAuth: true,
    signal,
  });
}

export function getPlace(slug: string): Promise<Place> {
  return api.get<Place>(ENDPOINTS.places.detail(slug), { skipAuth: true });
}

/** Creates a place in `pending` state for admin review. */
export function createPlace(input: PlaceInput): Promise<Place> {
  return api.post<Place>(ENDPOINTS.places.create, input);
}

export function listPlaceReviews(placeId: string, cursor?: string): Promise<Page<PlaceReview>> {
  return api.get<Page<PlaceReview>>(ENDPOINTS.places.reviews(placeId), {
    query: { cursor },
    skipAuth: true,
  });
}

export function createPlaceReview(placeId: string, input: PlaceReviewInput): Promise<PlaceReview> {
  return api.post<PlaceReview>(ENDPOINTS.places.reviews(placeId), input);
}

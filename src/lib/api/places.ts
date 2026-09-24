/**
 * Places routes. The list query takes a bounding box, which is the only
 * location shape the app ever sends (privacy rule 3).
 */

import { ENDPOINTS } from '@/constants/api';
import { api } from './client';
import type {
  Bbox,
  Page,
  Place,
  PlaceInput,
  PlaceReview,
  PlaceReviewInput,
  PlacesQuery,
} from './types';

/** `w,s,e,n` with 5 decimals (about 1 m), enough for a map query, nothing more. */
export function bboxParam(bbox: Bbox): string {
  return [bbox.west, bbox.south, bbox.east, bbox.north].map((n) => n.toFixed(5)).join(',');
}

export function listPlaces(query: PlacesQuery, signal?: AbortSignal): Promise<Page<Place>> {
  return api.get<Page<Place>>(ENDPOINTS.places.list, {
    query: { bbox: bboxParam(query.bbox), type: query.type, q: query.q, cursor: query.cursor },
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

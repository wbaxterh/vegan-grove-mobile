/**
 * Media library routes (MEDIA-CONTRACT section 10.2).
 *
 * Public reads skip the session header so the CDN can cache them. The detail
 * read keeps it: with a session the answer carries `viewer` (saved,
 * reactions), the only per-member state the library has. Nothing here reports
 * a view, a play or a watch position; the contract forbids all three.
 *
 * `api.get` returns envelopes as they arrive, so `{ collection }` and
 * `{ items }` are unwrapped here, once, and `{ media, viewer? }` is typed
 * whole because both halves matter to the screen.
 */

import { ENDPOINTS } from '@/constants/api';
import { api } from './client';
import type {
  MediaCollection,
  MediaDetailResponse,
  MediaHomeResponse,
  MediaItem,
  MediaQuery,
  MediaReactionResponse,
  MediaReactionType,
  Page,
} from './types';

export const MEDIA_QUERY_MIN = 2;
export const MEDIA_QUERY_MAX = 80;

/** Trimmed and clamped to the contract's 2 to 80 characters; undefined when too short to send. */
export function searchTerm(raw: string): string | undefined {
  const trimmed = raw.trim().slice(0, MEDIA_QUERY_MAX);
  return trimmed.length >= MEDIA_QUERY_MIN ? trimmed : undefined;
}

export function getMediaHome(signal?: AbortSignal): Promise<MediaHomeResponse> {
  return api.get<MediaHomeResponse>(ENDPOINTS.media.home, { skipAuth: true, signal });
}

export function listMedia(query: MediaQuery = {}, signal?: AbortSignal): Promise<Page<MediaItem>> {
  return api.get<Page<MediaItem>>(ENDPOINTS.media.list, {
    query: {
      q: query.q,
      kind: query.kind,
      tag: query.tag,
      year: query.year,
      free: query.free ? 1 : undefined,
      maxRuntime: query.maxRuntime,
      sort: query.sort,
      cursor: query.cursor,
      limit: query.limit,
    },
    skipAuth: true,
    signal,
  });
}

export async function getMediaCollection(
  slug: string,
  signal?: AbortSignal,
): Promise<MediaCollection> {
  const body = await api.get<{ collection: MediaCollection }>(ENDPOINTS.media.collection(slug), {
    skipAuth: true,
    signal,
  });
  return body.collection;
}

/** With a session the answer includes `viewer`; without one it is the public record only. */
export function getMedia(slug: string, signal?: AbortSignal): Promise<MediaDetailResponse> {
  return api.get<MediaDetailResponse>(ENDPOINTS.media.detail(slug), { signal });
}

export async function listRelatedMedia(slug: string, signal?: AbortSignal): Promise<MediaItem[]> {
  const body = await api.get<{ items: MediaItem[] }>(ENDPOINTS.media.related(slug), {
    skipAuth: true,
    signal,
  });
  return body.items ?? [];
}

export function saveMedia(id: string): Promise<{ saved: boolean }> {
  return api.post<{ saved: boolean }>(ENDPOINTS.media.save(id));
}

export function unsaveMedia(id: string): Promise<{ saved: boolean }> {
  return api.delete<{ saved: boolean }>(ENDPOINTS.media.save(id));
}

export function addMediaReaction(
  id: string,
  type: MediaReactionType,
): Promise<MediaReactionResponse> {
  return api.post<MediaReactionResponse>(ENDPOINTS.media.reactions(id), { type });
}

export function removeMediaReaction(
  id: string,
  type: MediaReactionType,
): Promise<MediaReactionResponse> {
  return api.delete<MediaReactionResponse>(ENDPOINTS.media.reaction(id, type));
}

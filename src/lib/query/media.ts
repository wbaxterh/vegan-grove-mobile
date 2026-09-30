/**
 * Query keys and the engagement mutations for the media library.
 *
 * Keys are hierarchical so one invalidation of `['media']` refreshes
 * everything. Save and the two reactions update the detail cache
 * optimistically and roll back on error: the member's own tap lands at once,
 * the count moves with it, and the server's answer replaces the guess.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMediaReaction, removeMediaReaction, saveMedia, unsaveMedia } from '@/lib/api/media';
import type {
  MediaDetailResponse,
  MediaReactionType,
  MediaStats,
  MediaViewer,
} from '@/lib/api/types';

export const mediaKeys = {
  all: ['media'] as const,
  home: () => ['media', 'home'] as const,
  homeFallback: () => ['media', 'home-fallback'] as const,
  list: (params: Record<string, string | number | boolean | undefined>) =>
    ['media', 'list', params] as const,
  detail: (slug: string) => ['media', 'detail', slug] as const,
  related: (slug: string) => ['media', 'related', slug] as const,
  collection: (slug: string) => ['media', 'collection', slug] as const,
};

export const EMPTY_VIEWER: MediaViewer = { saved: false, reactions: [] };
const EMPTY_STATS: MediaStats = { saves: 0, moved: 0, acted: 0 };

type Patch = (viewer: MediaViewer, stats: MediaStats) => { viewer: MediaViewer; stats: MediaStats };

function patched(current: MediaDetailResponse, patch: Patch): MediaDetailResponse {
  const next = patch(current.viewer ?? EMPTY_VIEWER, current.media.stats ?? EMPTY_STATS);
  return { media: { ...current.media, stats: next.stats }, viewer: next.viewer };
}

export interface ReactionInput {
  type: MediaReactionType;
  on: boolean;
}

/** The member's guess at the server's answer: one row per (media, user, type), count moves with it. */
function toggleReaction(
  viewer: MediaViewer,
  stats: MediaStats,
  type: MediaReactionType,
  on: boolean,
): { viewer: MediaViewer; stats: MediaStats } {
  const had = viewer.reactions.includes(type);
  const without = viewer.reactions.filter((entry) => entry !== type);
  const reactions = on ? [...without, type] : without;
  const delta = on === had ? 0 : on ? 1 : -1;
  return {
    viewer: { ...viewer, reactions },
    stats: { ...stats, [type]: Math.max(0, stats[type] + delta) },
  };
}

export function useMediaEngagement(slug: string, mediaId: string | undefined) {
  const queryClient = useQueryClient();
  const key = mediaKeys.detail(slug);

  async function snapshot() {
    await queryClient.cancelQueries({ queryKey: key });
    return queryClient.getQueryData<MediaDetailResponse>(key);
  }

  const save = useMutation({
    mutationFn: (next: boolean) => {
      if (!mediaId) throw new Error('This title has not loaded yet.');
      return next ? saveMedia(mediaId) : unsaveMedia(mediaId);
    },
    onMutate: async (next) => {
      const previous = await snapshot();
      if (previous) {
        queryClient.setQueryData<MediaDetailResponse>(
          key,
          patched(previous, (viewer, stats) => {
            const delta = next === viewer.saved ? 0 : next ? 1 : -1;
            return {
              viewer: { ...viewer, saved: next },
              stats: { ...stats, saves: Math.max(0, stats.saves + delta) },
            };
          }),
        );
      }
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      // The save answer carries only `{ saved }`; the refetch brings the real count.
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const react = useMutation({
    mutationFn: ({ type, on }: ReactionInput) => {
      if (!mediaId) throw new Error('This title has not loaded yet.');
      return on ? addMediaReaction(mediaId, type) : removeMediaReaction(mediaId, type);
    },
    onMutate: async ({ type, on }) => {
      const previous = await snapshot();
      if (previous) {
        queryClient.setQueryData<MediaDetailResponse>(
          key,
          patched(previous, (viewer, stats) => toggleReaction(viewer, stats, type, on)),
        );
      }
      return { previous };
    },
    onSuccess: (response) => {
      const current = queryClient.getQueryData<MediaDetailResponse>(key);
      if (current) {
        queryClient.setQueryData<MediaDetailResponse>(key, {
          media: { ...current.media, stats: response.stats ?? current.media.stats },
          viewer: response.viewer ?? current.viewer,
        });
      }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });

  return { save, react };
}

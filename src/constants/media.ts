/**
 * Media library vocabulary (MEDIA-CONTRACT section 10.1) in display order,
 * plus the formatters every media screen shares. Labels live here so no
 * screen ever shows a raw enum, and every lookup has a fallback because the
 * values come from ingest bots, not from this codebase.
 */

import type {
  MediaActionType,
  MediaItem,
  MediaKind,
  MediaSort,
  WatchAccess,
} from '@/lib/api/types';

export interface MediaKindInfo {
  value: MediaKind;
  label: string;
  /** Short monospace code drawn on a generated poster. */
  glyph: string;
}

export const MEDIA_KINDS: ReadonlyArray<MediaKindInfo> = [
  { value: 'documentary', label: 'documentary', glyph: 'DOC' },
  { value: 'film', label: 'film', glyph: 'FILM' },
  { value: 'series', label: 'series', glyph: 'SER' },
  { value: 'talk', label: 'talk', glyph: 'TALK' },
  { value: 'short', label: 'short', glyph: 'SHRT' },
];

export function mediaKindInfo(kind: MediaKind | string): MediaKindInfo {
  return (
    MEDIA_KINDS.find((entry) => entry.value === kind) ?? {
      value: kind as MediaKind,
      label: String(kind),
      glyph: '?',
    }
  );
}

export function isMediaKind(value: unknown): value is MediaKind {
  return MEDIA_KINDS.some((entry) => entry.value === value);
}

/** The sorts the Explore toggle cycles through, in order. */
export const EXPLORE_SORTS: ReadonlyArray<{ value: MediaSort; label: string }> = [
  { value: 'featured', label: 'featured' },
  { value: 'release', label: 'newest' },
  { value: 'title', label: 'a to z' },
];

const WATCH_ACCESS_LABEL: Record<WatchAccess, string> = {
  free: 'free',
  subscription: 'subscription',
  rent: 'rent',
  buy: 'buy',
  unknown: 'see site',
};

export function watchAccessLabel(access: WatchAccess | string | null | undefined): string {
  if (!access) return WATCH_ACCESS_LABEL.unknown;
  return WATCH_ACCESS_LABEL[access as WatchAccess] ?? String(access);
}

const ACTION_TYPE_LABEL: Record<MediaActionType, string> = {
  petition: 'petition',
  donate: 'donate',
  pledge: 'pledge',
  volunteer: 'volunteer',
  guide: 'guide',
  learn: 'learn',
};

export function actionTypeLabel(type: MediaActionType | string | null | undefined): string {
  if (!type) return 'act';
  return ACTION_TYPE_LABEL[type as MediaActionType] ?? String(type);
}

/** Attribution tags render as text, never as chips (contract 10.1). */
export const TMDB_TAG = 'tmdb';
export const JUSTWATCH_TAG = 'Watch providers data by JustWatch';
/** TMDB's required wording for API consumers. */
export const TMDB_ATTRIBUTION =
  'This product uses the TMDB API but is not endorsed or certified by TMDB.';

export const HOST_NOTE = 'Vegan Grove does not host films; links open the provider.';

export function visibleTags(tags: string[] | null | undefined): string[] {
  return (tags ?? []).filter((tag) => tag !== TMDB_TAG && tag !== JUSTWATCH_TAG);
}

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** "documentary · 2018 · 1h 37m · PG-13", skipping whatever is unknown. */
export function kickerLine(item: MediaItem): string {
  return [
    mediaKindInfo(item.kind).label,
    item.year,
    formatRuntime(item.runtimeMinutes),
    item.contentRating,
  ]
    .filter((part) => part !== null && part !== undefined && part !== '')
    .join(' · ');
}

export function formatReleaseDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  // A date-only string parses as UTC; anchoring it to local midnight keeps the day right.
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** "en" to "English" where the runtime can; the code itself otherwise. */
export function languageName(code: string | null | undefined): string | null {
  if (!code) return null;
  try {
    const names = new Intl.DisplayNames(undefined, { type: 'language' });
    return names.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/**
 * Library home: today's hero, the shelves the API built, and the way into
 * Explore. One read (`/media/home`). When that route is missing or down the
 * screen falls back to a single shelf from `/media`, so the library works
 * before the API deploy lands and degrades to "still useful" after it.
 */

import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaHeader } from '@/components/media/MediaHeader';
import { MediaHero } from '@/components/media/MediaHero';
import { MediaShelf } from '@/components/media/MediaShelf';
import { openExplore } from '@/components/media/navigation';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { HOST_NOTE } from '@/constants/media';
import { errorMessage } from '@/lib/api/client';
import { getMediaHome, listMedia } from '@/lib/api/media';
import type { MediaHomeResponse, MediaItem, MediaRow } from '@/lib/api/types';
import { mediaKeys } from '@/lib/query/media';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

/** One shelf from the plain list, used only while `/media/home` is unavailable. */
function fallbackRows(items: MediaItem[]): MediaRow[] {
  if (items.length === 0) return [];
  return [
    {
      key: 'fallback:library',
      name: 'In the library',
      description: null,
      kind: 'auto',
      slug: null,
      items,
    },
  ];
}

/** Today's hero, or the first thing on a shelf when nothing is featured. */
function pickHero(
  home: MediaHomeResponse | undefined,
  fallbackItems: MediaItem[],
  rows: MediaRow[],
): MediaItem | undefined {
  return (
    home?.hero?.[0] ??
    fallbackItems.find((item) => item.featured) ??
    fallbackItems[0] ??
    rows[0]?.items[0]
  );
}

interface Notice {
  text: string;
  tone: 'muted' | 'danger';
}

function notice(loading: boolean, error: string | null, empty: boolean): Notice | null {
  if (loading) return null;
  if (error) return { text: error, tone: 'danger' };
  if (empty) {
    return {
      text: 'Nothing in the library yet. Titles land here as the editors publish them.',
      tone: 'muted',
    };
  }
  return null;
}

export default function MediaHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const homeQuery = useQuery({
    queryKey: mediaKeys.home(),
    queryFn: ({ signal }) => getMediaHome(signal),
  });
  // Any failure (404 or 501 before the deploy, or no network) switches to the plain list.
  const fallbackQuery = useQuery({
    queryKey: mediaKeys.homeFallback(),
    queryFn: ({ signal }) => listMedia({ sort: 'featured', limit: 24 }, signal),
    enabled: homeQuery.isError,
  });

  const home = homeQuery.data;
  const fallbackItems = fallbackQuery.data?.items ?? [];
  const rows = home?.rows ?? fallbackRows(fallbackItems);
  const hero = pickHero(home, fallbackItems, rows);
  const loading = homeQuery.isPending || (homeQuery.isError && fallbackQuery.isPending);
  const error =
    homeQuery.isError && fallbackQuery.isError ? errorMessage(fallbackQuery.error) : null;
  const status = notice(loading, error, rows.length === 0);
  const refreshing = homeQuery.isRefetching || fallbackQuery.isRefetching;
  const refresh = () => {
    homeQuery.refetch();
    if (homeQuery.isError) fallbackQuery.refetch();
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <View style={{ paddingTop: insets.top + space.sm }}>
        <MediaHeader
          kicker="learn // library"
          right={
            <Button
              label="Explore"
              variant="ghost"
              mono
              onPress={openExplore}
              style={styles.headerButton}
              accessibilityHint="Search and browse every title"
            />
          }
        />
      </View>

      {hero ? <MediaHero item={hero} /> : null}

      {loading ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {status ? (
        <Text style={[styles.empty, { color: colors[status.tone] }]}>{status.text}</Text>
      ) : null}

      <View style={styles.shelves}>
        {rows.map((row) => (
          <MediaShelf
            key={row.key}
            name={row.name}
            description={row.description}
            slug={row.slug}
            items={row.items}
          />
        ))}
      </View>

      {rows.length > 0 ? (
        <View style={styles.padded}>
          <Button
            label="Explore all titles"
            variant="secondary"
            onPress={openExplore}
            accessibilityHint="Search and browse every title"
          />
        </View>
      ) : null}

      <View style={[styles.padded, styles.support]}>
        <SectionLabel>support</SectionLabel>
        <Text style={[styles.supportText, { color: colors.muted }]}>
          {HOST_NOTE} Your saved list is private, and nothing here records what you watch.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerButton: { minHeight: 36, paddingVertical: space.xs },
  spinner: { paddingVertical: space.xl },
  empty: {
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
  },
  shelves: { gap: space.xl, paddingTop: space.md },
  padded: { paddingHorizontal: space.lg, paddingTop: space.xl },
  support: { gap: space.sm },
  supportText: { fontSize: fontSize.small, lineHeight: 18 },
});

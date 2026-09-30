/**
 * Explore: search, kind chips, a sort toggle and the 3-column grid with
 * cursor paging. Filter state is local; every change becomes a new query
 * key, so a slow answer to an old search can never land in the new grid, and
 * the request it belongs to is aborted through the query's signal.
 */

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaHeader } from '@/components/media/MediaHeader';
import { openMedia } from '@/components/media/navigation';
import { PosterCard } from '@/components/media/PosterCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { EXPLORE_SORTS, isMediaKind, MEDIA_KINDS } from '@/constants/media';
import { errorMessage } from '@/lib/api/client';
import { listMedia, MEDIA_QUERY_MAX, MEDIA_QUERY_MIN, searchTerm } from '@/lib/api/media';
import type { MediaItem, MediaKind } from '@/lib/api/types';
import { mediaKeys } from '@/lib/query/media';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

const COLUMNS = 3;
const GAP = space.sm;
const PAGE_SIZE = 30;
const DEBOUNCE_MS = 250;

/** Cursor pages can overlap when items are added mid-scroll; one card per id. */
function dedupe(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ q?: string; kind?: string }>();

  const [input, setInput] = useState(params.q ?? '');
  const [term, setTerm] = useState(() => searchTerm(params.q ?? ''));
  const [kind, setKind] = useState<MediaKind | undefined>(() =>
    isMediaKind(params.kind) ? params.kind : undefined,
  );
  const [sortIndex, setSortIndex] = useState(0);
  const sort = EXPLORE_SORTS[sortIndex] ?? EXPLORE_SORTS[0];

  useEffect(() => {
    const timer = setTimeout(() => setTerm(searchTerm(input)), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const query = useInfiniteQuery({
    queryKey: mediaKeys.list({ q: term, kind, sort: sort.value }),
    queryFn: ({ pageParam, signal }) =>
      listMedia({ q: term, kind, sort: sort.value, cursor: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
  const items = useMemo(
    () => dedupe(query.data?.pages.flatMap((page) => page.items ?? []) ?? []),
    [query.data],
  );

  const posterWidth = Math.floor((width - space.lg * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isPlaceholderData) {
      query.fetchNextPage();
    }
  };

  let emptyText = 'No titles match these filters.';
  if (query.isPending) emptyText = 'loading';
  else if (query.isError) emptyText = errorMessage(query.error);
  else if (term) emptyText = `No titles match "${term}".`;

  return (
    <Screen scroll={false} padded={false} contentStyle={styles.fill}>
      <View style={styles.controls}>
        <MediaHeader
          kicker="learn // explore"
          right={
            <Button
              label={`sort: ${sort.label}`}
              variant="secondary"
              mono
              onPress={() => setSortIndex((index) => (index + 1) % EXPLORE_SORTS.length)}
              style={styles.sortButton}
              accessibilityHint="Cycles featured, newest, and A to Z"
            />
          }
        />
        <View style={styles.search}>
          <TextField
            label="search"
            value={input}
            onChangeText={setInput}
            placeholder="Title, person, topic"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            maxLength={MEDIA_QUERY_MAX}
            hint={
              input.trim().length > 0 && input.trim().length < MEDIA_QUERY_MIN
                ? `Type at least ${MEDIA_QUERY_MIN} characters`
                : undefined
            }
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipBar}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          <Chip label="All" selected={kind === undefined} onPress={() => setKind(undefined)} />
          {MEDIA_KINDS.map((entry) => (
            <Chip
              key={entry.value}
              label={entry.label}
              selected={kind === entry.value}
              onPress={() => setKind(kind === entry.value ? undefined : entry.value)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        renderItem={({ item }) => (
          <PosterCard item={item} width={posterWidth} onPress={() => openMedia(item.slug)} />
        )}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + space.xxl }]}
        style={query.isPlaceholderData ? styles.stale : undefined}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <Text style={[styles.empty, { color: query.isError ? colors.danger : colors.muted }]}>
            {emptyText}
          </Text>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  controls: { gap: space.sm, paddingTop: space.sm },
  sortButton: { minHeight: 36, paddingVertical: space.xs },
  search: { paddingHorizontal: space.lg },
  chipBar: { flexGrow: 0 },
  chips: { paddingHorizontal: space.lg, gap: space.sm },
  grid: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: GAP },
  gridRow: { gap: GAP },
  stale: { opacity: 0.6 },
  empty: { fontSize: fontSize.body, lineHeight: 22, textAlign: 'center', paddingTop: space.xl },
  footer: { paddingVertical: space.lg },
});

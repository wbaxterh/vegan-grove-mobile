/**
 * Shelf: a named horizontal row of poster cards. A collection row gets a
 * tappable header that opens the collection; an automatic row has no
 * `slug` (contract 10.1) and so no link. Posters are fixed-width, which lets
 * the list skip measuring and keeps the home screen cheap with a dozen rows.
 */

import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MediaItem } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';
import { openCollection, openMedia } from './navigation';
import { POSTER_WIDTH, PosterCard } from './PosterCard';

const GAP = space.sm;
const STRIDE = POSTER_WIDTH + GAP;

export interface MediaShelfProps {
  name: string;
  description?: string | null;
  /** Collection slug; when set the header opens the collection. */
  slug?: string | null;
  items: MediaItem[];
}

function renderPoster({ item }: { item: MediaItem }) {
  return <PosterCard item={item} onPress={() => openMedia(item.slug)} />;
}

function keyExtractor(item: MediaItem) {
  return item.id;
}

function getItemLayout(_: ArrayLike<MediaItem> | null | undefined, index: number) {
  return { length: STRIDE, offset: STRIDE * index, index };
}

export function MediaShelf({ name, description, slug, items }: MediaShelfProps) {
  const { colors } = useTheme();
  if (!items || items.length === 0) return null;

  const heading = (
    <View style={styles.headingText}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.shelf}>
      {slug ? (
        <Pressable
          onPress={() => openCollection(slug)}
          accessibilityRole="button"
          accessibilityLabel={`${name}, see all`}
          style={({ pressed }) => [styles.heading, pressed && styles.pressed]}
        >
          {heading}
          <Text style={[styles.seeAll, { color: colors.accent2 }]}>{'SEE ALL >'}</Text>
        </Pressable>
      ) : (
        <View style={styles.heading}>{heading}</View>
      )}
      <FlatList
        horizontal
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderPoster}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.row}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: { gap: space.sm },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  headingText: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.h2, fontWeight: '600' },
  description: { fontSize: fontSize.small, lineHeight: 18 },
  seeAll: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1, paddingBottom: 3 },
  pressed: { opacity: 0.8 },
  row: { paddingHorizontal: space.lg, gap: GAP },
});

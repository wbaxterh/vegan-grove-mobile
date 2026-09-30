/**
 * Poster art and the 2:3 card built on it.
 *
 * `PosterArt` draws the poster image when the API has one and a generated
 * poster otherwise: the title on the dark poster surface, the primary color
 * as an accent bar and kind glyph. Never a blank box, so the library reads
 * well before the media CDN exists (contract 10.3 and 10.4).
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { kickerLine, mediaKindInfo } from '@/constants/media';
import type { MediaItem } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

/** Shelf poster width. The Explore grid computes its own from the screen width. */
export const POSTER_WIDTH = 130;
/** Height over width for every poster in the app: 2:3. */
export const POSTER_RATIO = 1.5;

export interface PosterArtProps {
  item: Pick<MediaItem, 'title' | 'kind' | 'posterUrl' | 'year'>;
  width: number;
}

export function PosterArt({ item, width }: PosterArtProps) {
  const { colors } = useTheme();
  const height = Math.round(width * POSTER_RATIO);
  const frame = [
    styles.frame,
    { width, height, backgroundColor: colors.posterBg, borderColor: colors.border },
  ];

  if (item.posterUrl) {
    return (
      <View style={frame}>
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  const kind = mediaKindInfo(item.kind);
  const compact = width < 110;
  const meta = [kind.label, item.year].filter(Boolean).join(' · ').toUpperCase();
  return (
    <View style={frame}>
      <View style={[styles.accentBar, { backgroundColor: colors.posterAccent }]} />
      <View style={[styles.generated, compact && styles.generatedCompact]}>
        <Text style={[styles.glyph, { color: colors.posterAccent }]}>{kind.glyph}</Text>
        <Text
          style={[styles.title, compact && styles.titleCompact, { color: colors.posterText }]}
          numberOfLines={compact ? 3 : 4}
        >
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: colors.posterAccent }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </View>
  );
}

export interface PosterCardProps {
  item: MediaItem;
  width?: number;
  onPress: () => void;
}

export function PosterCard({ item, width = POSTER_WIDTH, onPress }: PosterCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={kickerLine(item)}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <PosterArt item={item} width={width} />
      <Text style={[styles.caption, { color: colors.text }]} numberOfLines={1}>
        {item.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.sm, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  generated: {
    flex: 1,
    padding: space.md,
    paddingLeft: space.md + 3,
    justifyContent: 'space-between',
  },
  generatedCompact: { padding: space.sm, paddingLeft: space.sm + 3 },
  glyph: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1.5 },
  title: { fontSize: fontSize.body, fontWeight: '700', lineHeight: 20, letterSpacing: -0.2 },
  titleCompact: { fontSize: fontSize.small, lineHeight: 16 },
  meta: { fontFamily: fonts.mono, fontSize: fontSize.mono - 2, letterSpacing: 1 },
  card: { gap: space.xs },
  pressed: { opacity: 0.8 },
  caption: { fontSize: fontSize.small },
});

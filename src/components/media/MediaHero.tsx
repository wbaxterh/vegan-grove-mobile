/**
 * Hero: the billboard at the top of the library. Backdrop or brand gradient,
 * kicker, title, tagline or two lines of synopsis, then Details and, when
 * there is one, Trailer. The text sits on the fade into the screen
 * background, so it uses the screen's text colors and reads in both schemes.
 */

import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { kickerLine } from '@/constants/media';
import type { MediaItem } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';
import { Backdrop } from './Backdrop';
import { openMedia } from './navigation';

export function MediaHero({ item }: { item: MediaItem }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const height = Math.min(Math.round(width * 1.05), 460);
  const kicker = kickerLine(item).toUpperCase();
  const blurb = item.tagline || item.synopsis;

  return (
    <Backdrop uri={item.backdropUrl} height={height}>
      <View style={styles.content}>
        <Text style={[styles.kicker, { color: colors.primary }]}>
          {item.featured ? `FEATURED // ${kicker}` : kicker}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {blurb ? (
          <Text style={[styles.blurb, { color: colors.muted }]} numberOfLines={2}>
            {blurb}
          </Text>
        ) : null}
        <View style={styles.buttons}>
          <Button
            label="Details"
            onPress={() => openMedia(item.slug)}
            style={styles.button}
            accessibilityHint={`Opens ${item.title}`}
          />
          {item.trailerYoutubeId ? (
            <Button
              label="Trailer"
              variant="secondary"
              onPress={() => openMedia(item.slug, { trailer: true })}
              style={styles.button}
              accessibilityHint="Opens the title with the trailer ready to play"
            />
          ) : null}
        </View>
      </View>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.sm },
  kicker: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1.2 },
  title: { fontSize: fontSize.title, fontWeight: '700', letterSpacing: -0.5 },
  blurb: { fontSize: fontSize.body, lineHeight: 22 },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  button: { flex: 1 },
});

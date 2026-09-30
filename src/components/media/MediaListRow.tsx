/** A vertical list row for a collection page: small poster, kicker, title, one line of blurb. */

import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { kickerLine } from '@/constants/media';
import type { MediaItem } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';
import { PosterArt } from './PosterCard';

const THUMB_WIDTH = 64;

export function MediaListRow({ item, onPress }: { item: MediaItem; onPress: () => void }) {
  const { colors } = useTheme();
  const blurb = item.tagline || item.synopsis;
  return (
    <Card onPress={onPress} accessibilityLabel={item.title}>
      <View style={styles.row}>
        <PosterArt item={item} width={THUMB_WIDTH} />
        <View style={styles.text}>
          <Text style={[styles.kicker, { color: colors.muted }]} numberOfLines={1}>
            {kickerLine(item).toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {blurb ? (
            <Text style={[styles.blurb, { color: colors.muted }]} numberOfLines={2}>
              {blurb}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  text: { flex: 1, gap: space.xs },
  kicker: { fontFamily: fonts.mono, fontSize: fontSize.mono - 1, letterSpacing: 1 },
  title: { fontSize: fontSize.h2, fontWeight: '600', lineHeight: 26 },
  blurb: { fontSize: fontSize.small, lineHeight: 18 },
});

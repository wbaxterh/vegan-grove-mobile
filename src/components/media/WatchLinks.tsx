/**
 * Where to watch: every provider the API lists, an access badge each, and
 * each link opens the system browser. Free gets the primary tone so it reads
 * first. The JustWatch line appears only when the row carries its tag.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { JUSTWATCH_TAG, watchAccessLabel } from '@/constants/media';
import type { MediaItem } from '@/lib/api/types';
import { openExternal } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

export function WatchLinks({ item }: { item: MediaItem }) {
  const { colors } = useTheme();
  const links = item.watchLinks ?? [];
  const justwatch = (item.tags ?? []).includes(JUSTWATCH_TAG);

  return (
    <View style={styles.section}>
      <SectionLabel>where to watch</SectionLabel>
      {links.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>
          {item.officialSite
            ? 'No provider listed yet. The official site below may know.'
            : 'No provider listed yet.'}
        </Text>
      ) : (
        links.map((link) => {
          const access = watchAccessLabel(link.access);
          return (
            <Pressable
              key={`${link.provider}|${link.access}|${link.url}`}
              onPress={() => openExternal(link.url)}
              accessibilityRole="link"
              accessibilityLabel={`${link.provider}, ${access}`}
              accessibilityHint="Opens in your browser"
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.provider, { color: colors.text }]} numberOfLines={1}>
                {link.provider}
              </Text>
              <Badge label={access} tone={link.access === 'free' ? 'primary' : 'muted'} />
              <Text style={[styles.arrow, { color: colors.accent2 }]}>{'>'}</Text>
            </Pressable>
          );
        })
      )}
      {justwatch ? (
        <Text style={[styles.attribution, { color: colors.muted }]}>{JUSTWATCH_TAG}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  empty: { fontSize: fontSize.small, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.8 },
  provider: { flex: 1, fontSize: fontSize.body, fontWeight: '600' },
  arrow: { fontFamily: fonts.mono, fontSize: fontSize.small },
  attribution: { fontSize: fontSize.mono, fontStyle: 'italic' },
});

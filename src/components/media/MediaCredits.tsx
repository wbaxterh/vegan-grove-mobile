/**
 * Credits card: who made it, what it is, when, and where else it lives.
 * Rows with nothing to say are skipped; external ids become links.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import {
  formatReleaseDate,
  languageName,
  TMDB_ATTRIBUTION,
  TMDB_TAG,
  visibleTags,
} from '@/constants/media';
import type { MediaItem } from '@/lib/api/types';
import { isWebUrl, openExternal } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

interface LinkEntry {
  label: string;
  url: string;
}

function externalLinks(item: MediaItem): LinkEntry[] {
  const ids = item.externalIds ?? {};
  const links: LinkEntry[] = [];
  if (isWebUrl(item.officialSite)) links.push({ label: 'Official site', url: item.officialSite });
  if (ids.tmdb) {
    const section = item.kind === 'series' ? 'tv' : 'movie';
    links.push({
      label: 'TMDB',
      url: `https://www.themoviedb.org/${section}/${encodeURIComponent(ids.tmdb)}`,
    });
  }
  if (ids.imdb) {
    links.push({
      label: 'IMDb',
      url: `https://www.imdb.com/title/${encodeURIComponent(ids.imdb)}/`,
    });
  }
  if (ids.wikidata) {
    links.push({
      label: 'Wikidata',
      url: `https://www.wikidata.org/wiki/${encodeURIComponent(ids.wikidata)}`,
    });
  }
  return links;
}

function ratingLine(item: MediaItem): string | null {
  if (typeof item.rating !== 'number') return null;
  const count = item.ratingCount ? ` from ${item.ratingCount.toLocaleString()} ratings` : '';
  return `${item.rating.toFixed(1)} / 10${count}`;
}

function creditRows(item: MediaItem): Array<[string, string]> {
  const rows: Array<[string, string | null | undefined]> = [
    ['directed by', (item.directors ?? []).join(', ')],
    ['featuring', (item.featuring ?? []).join(', ')],
    ['genres', (item.genres ?? []).join(', ')],
    ['language', languageName(item.originalLanguage)],
    ['released', formatReleaseDate(item.releaseDate) ?? (item.year ? String(item.year) : null)],
    ['tmdb rating', ratingLine(item)],
    ['tags', visibleTags(item.tags).join(' / ')],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}

export function MediaCredits({ item }: { item: MediaItem }) {
  const { colors } = useTheme();
  const rows = creditRows(item);
  const links = externalLinks(item);
  const tmdb = (item.tags ?? []).includes(TMDB_TAG);
  if (rows.length === 0 && links.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionLabel>credits</SectionLabel>
      <Card>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
          </View>
        ))}
        {links.length ? (
          <View style={styles.links}>
            {links.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => openExternal(link.url)}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                accessibilityHint="Opens in your browser"
                hitSlop={8}
              >
                <Text style={[styles.link, { color: colors.accent2 }]}>
                  {`${link.label.toUpperCase()} >`}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {tmdb ? (
          <Text style={[styles.attribution, { color: colors.muted }]}>{TMDB_ATTRIBUTION}</Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { gap: 2 },
  label: { fontFamily: fonts.mono, fontSize: fontSize.mono - 1, letterSpacing: 1 },
  value: { fontSize: fontSize.body, lineHeight: 22 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xs },
  link: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1 },
  attribution: { fontSize: fontSize.mono, fontStyle: 'italic', marginTop: space.xs },
});

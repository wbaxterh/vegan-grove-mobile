/**
 * Title detail. Context (backdrop, poster, kicker, title, tagline), Action
 * (save, reactions, where to watch, trailer, take action), Support (credits,
 * warnings, related, the hosting note). The trailer never loads until it is
 * tapped, or until the hero's Trailer button arrives with `?trailer=1`.
 */

import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop } from '@/components/media/Backdrop';
import { ContentWarnings } from '@/components/media/ContentWarnings';
import { EngagementRow } from '@/components/media/EngagementRow';
import { MediaCredits } from '@/components/media/MediaCredits';
import { BackButton, MediaHeader } from '@/components/media/MediaHeader';
import { MediaShelf } from '@/components/media/MediaShelf';
import { PosterArt } from '@/components/media/PosterCard';
import { TakeAction } from '@/components/media/TakeAction';
import { TrailerPlayer } from '@/components/media/TrailerPlayer';
import { WatchLinks } from '@/components/media/WatchLinks';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { HOST_NOTE, kickerLine } from '@/constants/media';
import { errorMessage, isApiError } from '@/lib/api/client';
import { getMedia, listRelatedMedia } from '@/lib/api/media';
import { mediaKeys } from '@/lib/query/media';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

const POSTER_WIDTH = 96;

export default function MediaDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { slug = '', trailer } = useLocalSearchParams<{ slug: string; trailer?: string }>();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');

  const detailQuery = useQuery({
    queryKey: mediaKeys.detail(slug),
    queryFn: ({ signal }) => getMedia(slug, signal),
    enabled: slug.length > 0,
  });
  const relatedQuery = useQuery({
    queryKey: mediaKeys.related(slug),
    queryFn: ({ signal }) => listRelatedMedia(slug, signal),
    enabled: slug.length > 0,
  });

  const media = detailQuery.data?.media;

  if (!media) {
    const notFound = isApiError(detailQuery.error) && detailQuery.error.status === 404;
    return (
      <View
        style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + space.sm }]}
      >
        <MediaHeader kicker="learn // title" />
        <View style={styles.center}>
          {detailQuery.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.empty, { color: notFound ? colors.muted : colors.danger }]}>
              {notFound ? 'This title is not in the library.' : errorMessage(detailQuery.error)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const viewer = detailQuery.data?.viewer;
  const backdropHeight = Math.round(width * 0.62);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        <Backdrop uri={media.backdropUrl} height={backdropHeight} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <PosterArt item={media} width={POSTER_WIDTH} />
            <View style={styles.titleText}>
              <Text style={[styles.kicker, { color: colors.muted }]}>
                {kickerLine(media).toUpperCase()}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>{media.title}</Text>
              {media.tagline ? (
                <Text style={[styles.tagline, { color: colors.muted }]}>{media.tagline}</Text>
              ) : null}
            </View>
          </View>

          <EngagementRow slug={slug} media={media} viewer={viewer} signedIn={signedIn} />

          {media.synopsis ? (
            <Text style={[styles.synopsis, { color: colors.text }]}>{media.synopsis}</Text>
          ) : null}

          <ContentWarnings warnings={media.contentWarnings} />

          <WatchLinks item={media} />

          {media.trailerYoutubeId ? (
            <View style={styles.section}>
              <SectionLabel>trailer</SectionLabel>
              <TrailerPlayer
                youtubeId={media.trailerYoutubeId}
                backdropUrl={media.backdropUrl}
                title={media.title}
                autoOpen={trailer === '1'}
              />
            </View>
          ) : null}

          <MediaCredits item={media} />

          <TakeAction actions={media.actions} />
        </View>

        <View style={styles.related}>
          <MediaShelf name="Related" items={relatedQuery.data ?? []} />
        </View>

        <View style={[styles.body, styles.support]}>
          <SectionLabel>support</SectionLabel>
          <Text style={[styles.supportText, { color: colors.muted }]}>{HOST_NOTE}</Text>
        </View>
      </ScrollView>

      <View style={[styles.back, { top: insets.top + space.sm }]}>
        <BackButton floating />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  empty: { fontSize: fontSize.body, lineHeight: 22, textAlign: 'center' },
  back: { position: 'absolute', left: space.lg },
  body: { paddingHorizontal: space.lg, gap: space.lg },
  titleRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-end', marginTop: -space.xxl },
  titleText: { flex: 1, gap: space.xs },
  kicker: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1.2 },
  title: { fontSize: fontSize.title, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
  tagline: { fontSize: fontSize.body, lineHeight: 22, fontStyle: 'italic' },
  synopsis: { fontSize: fontSize.body, lineHeight: 24 },
  section: { gap: space.sm },
  related: { paddingTop: space.xl },
  support: { paddingTop: space.xl, gap: space.sm },
  supportText: { fontSize: fontSize.small, lineHeight: 18 },
});

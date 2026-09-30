/**
 * Save and the two reactions. Only the signed-in member gets the toggles;
 * signed out, one line says why. Counts are shown, identities never are
 * (checklist section 5), and nothing here records a view or a play.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { errorMessage } from '@/lib/api/client';
import type { MediaItem, MediaViewer } from '@/lib/api/types';
import { EMPTY_VIEWER, useMediaEngagement } from '@/lib/query/media';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

export interface EngagementRowProps {
  slug: string;
  media: MediaItem;
  viewer: MediaViewer | undefined;
  signedIn: boolean;
}

export function EngagementRow({ slug, media, viewer, signedIn }: EngagementRowProps) {
  const { colors } = useTheme();
  const { save, react } = useMediaEngagement(slug, media.id);

  if (!signedIn) {
    return (
      <Text style={[styles.hint, { color: colors.muted }]}>
        Sign in to save this title and react.
      </Text>
    );
  }

  const state = viewer ?? EMPTY_VIEWER;
  const reactions = state.reactions ?? [];
  const moved = reactions.includes('moved');
  const acted = reactions.includes('acted');
  const stats = media.stats;
  const error = save.error ?? react.error;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Chip
          label={state.saved ? 'saved' : 'save'}
          selected={state.saved}
          onPress={() => save.mutate(!state.saved)}
          accessibilityHint="Keeps this title on your private saved list"
        />
        <Chip
          label={`This moved me · ${stats?.moved ?? 0}`}
          selected={moved}
          onPress={() => react.mutate({ type: 'moved', on: !moved })}
          accessibilityHint="Counts you among the members this title moved"
        />
        <Chip
          label={`I took action · ${stats?.acted ?? 0}`}
          selected={acted}
          onPress={() => react.mutate({ type: 'acted', on: !acted })}
          accessibilityHint="Counts you among the members who acted after watching"
        />
      </View>
      {error ? (
        <Text style={[styles.hint, { color: colors.danger }]}>
          {errorMessage(error, 'That did not save. Try again.')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hint: { fontSize: fontSize.small, lineHeight: 18 },
});

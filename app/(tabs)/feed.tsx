/**
 * Feed: friends by default. The list is a stub until `/api/feed` is wired
 * (TODO(m2)); the composer's EXIF-stripping path is real today.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PostComposer } from '@/components/composer/PostComposer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

type FeedScope = 'friends' | 'public';

export default function FeedScreen() {
  const { colors } = useTheme();
  const [scope, setScope] = useState<FeedScope>('friends');

  return (
    <Screen
      kicker={`feed :: ${scope}`}
      title="Your grove"
      lede="Posts from friends by default. Love reactions only, no counts on people."
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Posting publicly is off until you turn it on in Privacy, and then it is per post.
        </Text>
      }
    >
      <View style={styles.scopeRow}>
        <Button
          label="Friends"
          mono
          variant={scope === 'friends' ? 'primary' : 'secondary'}
          onPress={() => setScope('friends')}
          style={styles.grow}
        />
        <Button
          label="Public"
          mono
          variant={scope === 'public' ? 'primary' : 'secondary'}
          onPress={() => setScope('public')}
          style={styles.grow}
        />
      </View>

      <PostComposer />

      <Card>
        <SectionLabel>posts</SectionLabel>
        <Text style={[styles.empty, { color: colors.muted }]}>
          Nothing here yet. Add a friend with an invite code and their posts show up.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scopeRow: { flexDirection: 'row', gap: space.sm },
  grow: { flex: 1 },
  empty: { fontSize: fontSize.body, lineHeight: 22 },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

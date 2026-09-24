/**
 * Messages: direct messages, encrypted at rest on the server, 90-day retention.
 * Conversation list and the Socket.IO `/messages` namespace are TODO(m2).
 */

import { StyleSheet, Text } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize } from '@/theme/tokens';

export default function MessagesScreen() {
  const { colors } = useTheme();

  return (
    <Screen
      kicker="messages"
      title="Direct messages"
      lede="Friends only. Encrypted at rest, gone after 90 days."
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Nobody outside a friendship can start a conversation with you, and there is no way to look
          you up.
        </Text>
      }
    >
      <Card>
        <SectionLabel>conversations</SectionLabel>
        <Text style={[styles.empty, { color: colors.muted }]}>
          No conversations yet. Start one from a friend's profile.
        </Text>
        <Badge label="realtime: todo m2" />
      </Card>
      <Button label="Find friends by invite code" variant="secondary" disabled onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: fontSize.body, lineHeight: 22 },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

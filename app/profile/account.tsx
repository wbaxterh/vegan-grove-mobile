/**
 * Account: sessions and the hard delete (privacy rule 10).
 * Delete asks twice, calls `DELETE /api/me`, then clears local state.
 */

import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { errorMessage } from '@/lib/api/client';
import { deleteMe, listSessions, revokeSession } from '@/lib/api/me';
import type { Session } from '@/lib/api/types';
import { queryClient } from '@/lib/query/queryClient';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

function formatSeen(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
}

interface SessionRowProps {
  session: Session;
  onRevoke: () => void;
}

function SessionRow({ session, onRevoke }: SessionRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionText}>
        <View style={styles.badges}>
          <Badge label={session.client} />
          {session.current ? <Badge label="this device" tone="primary" /> : null}
        </View>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Last seen {formatSeen(session.lastSeenAt)}
        </Text>
      </View>
      {!session.current ? <Button label="Revoke" variant="ghost" mono onPress={onRevoke} /> : null}
    </View>
  );
}

export default function AccountScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const sessionsQuery = useQuery({ queryKey: ['me', 'sessions'], queryFn: listSessions });

  const revoke = async (id: string) => {
    try {
      await revokeSession(id);
      await queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] });
    } catch (e) {
      Alert.alert('Could not revoke', errorMessage(e));
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This removes your account, sessions, friendships, RSVPs, posts, comments, reactions, messages, action log, and companion chats. Places and reviews you submitted stay, with your name detached. This cannot be undone.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Last check', `Delete @${user?.handle ?? 'your account'} for good?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteMe();
                    queryClient.clear();
                    await logout();
                  } catch (e) {
                    Alert.alert('Delete failed', errorMessage(e));
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <Screen
      title="Account"
      support={
        <Text style={[styles.meta, { color: colors.muted }]}>
          Deletion is a hard delete on the server, not a hide. Export is not built yet; ask via the
          support email in the app store listing.
        </Text>
      }
    >
      <Card>
        <SectionLabel>login</SectionLabel>
        <Text style={[styles.mono, { color: colors.text }]}>{user?.email ?? ''}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>Only you can see this.</Text>
      </Card>

      <Card>
        <SectionLabel>sessions</SectionLabel>
        {sessionsQuery.isLoading ? (
          <Text style={[styles.meta, { color: colors.muted }]}>Loading</Text>
        ) : sessionsQuery.isError ? (
          <Text style={[styles.meta, { color: colors.danger }]}>
            {errorMessage(sessionsQuery.error)}
          </Text>
        ) : (
          (sessionsQuery.data?.items ?? []).map((session) => (
            <SessionRow key={session.id} session={session} onRevoke={() => revoke(session.id)} />
          ))
        )}
      </Card>

      <Card edge="danger">
        <SectionLabel>danger zone</SectionLabel>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Deleting removes everything tied to you. It takes effect immediately.
        </Text>
        <Button label="Delete my account" variant="danger" onPress={confirmDelete} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
  },
  sessionText: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', gap: space.xs },
  mono: { fontFamily: fonts.mono, fontSize: fontSize.body },
  meta: { fontSize: fontSize.small, lineHeight: 18 },
});

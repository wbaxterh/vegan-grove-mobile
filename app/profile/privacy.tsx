/** Privacy: the two opt-in switches (privacy rule 5) and the data inventory in plain words. */

import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { errorMessage } from '@/lib/api/client';
import { updateMe } from '@/lib/api/me';
import type { UpdateMeInput } from '@/lib/api/types';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

interface ToggleRowProps {
  label: string;
  detail: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, detail, value, onValueChange, disabled }: ToggleRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
        accessibilityLabel={label}
      />
    </View>
  );
}

const INVENTORY: ReadonlyArray<{ field: string; why: string }> = [
  { field: 'email', why: 'login only, never shown to anyone' },
  { field: 'handle', why: 'what friends see' },
  { field: 'avatar', why: 'optional, EXIF stripped on your phone' },
  { field: 'home area', why: 'suggests events, never shown' },
  { field: 'interests', why: 'shared with Ivy only' },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = async (input: UpdateMeInput) => {
    setError(null);
    setBusy(true);
    try {
      setUser(await updateMe(input));
    } catch (e) {
      setError(errorMessage(e, 'Could not save.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Privacy"
      lede="Everything defaults to friends. These are the only two switches."
      support={
        <Text style={[styles.detail, { color: colors.muted }]}>
          Location never reaches our servers: the map asks for a bounding box, not where you are.
          Companion chats expire after 24 hours unless you pin them.
        </Text>
      }
    >
      <Card>
        <ToggleRow
          label="Allow public posts"
          detail="Off means every post is friends-only. On lets you choose per post."
          value={user?.publicPostsEnabled ?? false}
          onValueChange={(v) => patch({ publicPostsEnabled: v })}
          disabled={busy || !user}
        />
        <ToggleRow
          label="Discoverable by handle"
          detail="Lets a friend-of-a-friend find your handle to send an invite. Nothing else."
          value={user?.discoverable ?? false}
          onValueChange={(v) => patch({ discoverable: v })}
          disabled={busy || !user}
        />
        {error ? <Text style={[styles.detail, { color: colors.danger }]}>{error}</Text> : null}
      </Card>

      <Card>
        <SectionLabel>what we store about you</SectionLabel>
        {INVENTORY.map((row) => (
          <View key={row.field} style={styles.inventoryRow}>
            <Text style={[styles.inventoryField, { color: colors.primary }]}>{row.field}</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>{row.why}</Text>
          </View>
        ))}
        <Text style={[styles.detail, { color: colors.muted }]}>
          No real name, phone number, birthdate, or GPS. No analytics of any kind.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
  },
  toggleText: { flex: 1, gap: 2 },
  label: { fontSize: fontSize.body, fontWeight: '600' },
  detail: { fontSize: fontSize.small, lineHeight: 18 },
  inventoryRow: { gap: 2, paddingVertical: 2 },
  inventoryField: { fontSize: fontSize.small, fontWeight: '700' },
});

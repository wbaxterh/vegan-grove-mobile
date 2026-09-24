/** Settings: appearance, notifications, log out. */

import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { enablePush, getOsPermission, type OsPermission } from '@/lib/notifications';
import { useAuthStore } from '@/lib/stores/authStore';
import { type ThemePreference, useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const [push, setPush] = useState<OsPermission | 'unknown'>('unknown');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOsPermission()
      .then(setPush)
      .catch(() => setPush('unknown'));
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      setPush(await enablePush());
    } finally {
      setBusy(false);
    }
  };

  const pushLine =
    push === 'granted' || push === 'provisional'
      ? 'On. Event reminders and friend requests.'
      : push === 'denied'
        ? 'Off at the system level. Turn it on in your phone settings.'
        : 'Off.';

  return (
    <Screen
      title="Settings"
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Logging out forgets this phone's push token on the server too.
        </Text>
      }
    >
      <Card>
        <SectionLabel>appearance</SectionLabel>
        <View style={styles.row}>
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              mono
              variant={preference === option.value ? 'primary' : 'secondary'}
              onPress={() => setPreference(option.value)}
              style={styles.grow}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionLabel>notifications</SectionLabel>
        <Text style={[styles.body, { color: colors.text }]}>{pushLine}</Text>
        {push === 'denied' ? (
          <Button
            label="Open phone settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
          />
        ) : push === 'undetermined' ? (
          <Button label="Turn on" variant="secondary" onPress={turnOn} loading={busy} />
        ) : null}
      </Card>

      <Button label="Log out" variant="danger" onPress={() => logout()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.xs },
  grow: { flex: 1 },
  body: { fontSize: fontSize.body, lineHeight: 22 },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

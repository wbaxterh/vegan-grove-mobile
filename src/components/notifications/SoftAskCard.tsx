/**
 * In-app notification ask. Renders only when `shouldShowSoftAsk` says so, and
 * the OS prompt fires only after the member taps "Turn on".
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { enablePush, markSoftAskDeferred, shouldShowSoftAsk } from '@/lib/notifications';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionLabel } from '../ui/SectionLabel';

export interface SoftAskCardProps {
  /** Gate rendering until the member is inside the app. */
  ready: boolean;
}

export function SoftAskCard({ ready }: SoftAskCardProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    shouldShowSoftAsk()
      .then((show) => {
        if (!cancelled) setVisible(show);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!visible) return null;

  const onEnable = async () => {
    setBusy(true);
    try {
      await enablePush();
    } finally {
      setBusy(false);
      setVisible(false);
    }
  };

  const onLater = async () => {
    await markSoftAskDeferred();
    setVisible(false);
  };

  return (
    <Card edge="primary">
      <SectionLabel tone="primary">notifications</SectionLabel>
      <Text style={[styles.body, { color: colors.text }]}>
        Event reminders and friend requests, nothing else. You can change this any time in Settings.
      </Text>
      <View style={styles.row}>
        <Button label="Turn on" onPress={onEnable} loading={busy} style={styles.grow} />
        <Button label="Not now" variant="secondary" onPress={onLater} style={styles.grow} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, lineHeight: 22 },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  grow: { flex: 1 },
});

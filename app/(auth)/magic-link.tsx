/**
 * Magic link: request one by email, or land here from `vegangrove://magic-link?token=...`
 * and verify it. The request always reports success (no account enumeration).
 */

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { requestMagicLink } from '@/lib/api/auth';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize } from '@/theme/tokens';

type MagicLinkParams = { token?: string };

export default function MagicLinkScreen() {
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<MagicLinkParams>();
  const loginWithMagicLink = useAuthStore((s) => s.loginWithMagicLink);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deep-link path: a token in the URL means verify, not request.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setBusy(true);
    loginWithMagicLink(token)
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'That link has expired. Request a new one.'));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, loginWithMagicLink]);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestMagicLink(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(errorMessage(e, 'Could not send the link.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      kicker="auth :: magic link"
      title="Sign in from your inbox"
      lede="We email a one-time link. It works for 15 minutes."
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Opening the link on this phone brings you straight back here, signed in.
        </Text>
      }
    >
      {sent ? (
        <Card edge="primary">
          <Text style={[styles.body, { color: colors.text }]}>
            If that address has an account, a link is on its way. Check your inbox.
          </Text>
        </Card>
      ) : (
        <>
          <TextField
            label="email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={error}
            onSubmitEditing={submit}
          />
          <Button label="Send magic link" onPress={submit} loading={busy} disabled={!email} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, lineHeight: 22 },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

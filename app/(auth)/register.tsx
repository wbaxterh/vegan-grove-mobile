/** Register: email, handle, password. That is the whole form on purpose (privacy rule 2). */

import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize } from '@/theme/tokens';

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValid = HANDLE_RE.test(handle);
  const canSubmit = email.length > 3 && handleValid && password.length >= 8;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await register({ email: email.trim().toLowerCase(), handle, password });
    } catch (e) {
      setError(errorMessage(e, 'Could not create your account.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      kicker="auth :: register"
      title="Join the grove"
      lede="Email for login, a handle for friends. No real name, no phone, no birthday."
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          You pick your home area after signing up. It is used to suggest events and is never shown
          to anyone.
        </Text>
      }
    >
      <TextField
        label="email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="handle"
        value={handle}
        onChangeText={(v) => setHandle(v.toLowerCase())}
        autoCapitalize="none"
        autoCorrect={false}
        mono
        hint="3 to 24 characters: a-z, 0-9, underscore"
        error={handle.length > 0 && !handleValid ? 'That handle is not valid yet.' : null}
      />
      <TextField
        label="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint="At least 8 characters"
        error={error}
        onSubmitEditing={canSubmit ? submit : undefined}
      />
      <Button label="Create account" onPress={submit} loading={busy} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

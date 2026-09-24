/** Email + password login. Success is handled by AuthGate's redirect. */

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize } from '@/theme/tokens';

export default function LoginScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      setError(errorMessage(e, 'Login failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      kicker="auth :: login"
      title="Welcome back"
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Forgot your password? Use a magic link instead; it signs you in from your inbox.
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
        label="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        error={error}
        onSubmitEditing={submit}
      />
      <Button label="Log in" onPress={submit} loading={busy} disabled={!email || !password} />
      <Button
        label="Magic link"
        variant="ghost"
        onPress={() => router.push('/(auth)/magic-link')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

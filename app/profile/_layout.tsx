/** Hidden profile stack (not a tab): index, edit, settings, privacy, account. */

import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function ProfileLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontFamily: fonts.mono, fontSize: 14 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: '// PROFILE' }} />
      <Stack.Screen name="edit" options={{ title: '// EDIT' }} />
      <Stack.Screen name="settings" options={{ title: '// SETTINGS' }} />
      <Stack.Screen name="privacy" options={{ title: '// PRIVACY' }} />
      <Stack.Screen name="account" options={{ title: '// ACCOUNT' }} />
    </Stack>
  );
}

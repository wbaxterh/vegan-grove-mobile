/** Media library stack, reached from Home's Learn step, not a tab. Headers off; each screen draws its own. */

import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function MediaLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="[slug]" />
      <Stack.Screen name="collections/[slug]" />
    </Stack>
  );
}

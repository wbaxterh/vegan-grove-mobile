/**
 * Root layout: SafeAreaProvider > QueryClientProvider > ThemeProvider >
 * AuthGate > Stack.
 *
 * AuthGate restores the session once, re-checks it when the app returns to
 * the foreground (iOS drops the JS context under memory pressure), keeps the
 * push token fresh, and routes between the `(auth)` and `(tabs)` groups.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, type AppStateStatus, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installForegroundHandler, registerPushToken } from '@/lib/notifications';
import { queryClient } from '@/lib/query/queryClient';
import { useAuthStore } from '@/lib/stores/authStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function AuthGate({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Restore the session once on mount.
  useEffect(() => {
    useAuthStore
      .getState()
      .loadStoredAuth()
      .catch(() => {});
  }, []);

  // Foreground re-check: re-validate auth if it was lost, refresh the push token if not.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const wasBackground = /inactive|background/.test(appState.current);
      appState.current = next;
      if (!wasBackground || next !== 'active') return;
      const { status: current, loadStoredAuth } = useAuthStore.getState();
      if (current === 'authenticated') {
        registerPushToken().catch(() => {});
      } else {
        loadStoredAuth().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  // Push handlers and token registration once the member is inside the app.
  useEffect(() => {
    if (status !== 'authenticated') return;
    installForegroundHandler();
    registerPushToken().catch(() => {});
  }, [status]);

  // Route by auth state. Waits for the navigator to exist and for the session check to settle.
  useEffect(() => {
    if (!navigationState?.key || status === 'loading') return;
    const inAuthGroup = segments[0] === '(auth)';
    const timer = setTimeout(() => {
      if (status === 'anonymous' && !inAuthGroup) router.replace('/(auth)/welcome');
      else if (status === 'authenticated' && inAuthGroup) router.replace('/(tabs)');
    }, 0);
    return () => clearTimeout(timer);
  }, [status, segments, navigationState?.key]);

  if (status === 'loading') {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function ThemedStack() {
  const { colors, scheme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen
          name="companion"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthGate>
            <ThemedStack />
          </AuthGate>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

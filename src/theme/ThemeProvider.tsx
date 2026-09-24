/**
 * Theme provider: dark by default, light supported, follows the system unless
 * the member picks a scheme in Settings.
 *
 * The preference is a single short string persisted in SecureStore only because
 * it is the one key-value store already in the dependency set. It is not a
 * secret; it just does not deserve another dependency.
 */

import * as SecureStore from 'expo-secure-store';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { type ColorScheme, type ThemeColors, themes } from './tokens';

export type ThemePreference = 'system' | ColorScheme;

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => Promise<void>;
}

const PREFERENCE_KEY = 'vg_theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isPreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(PREFERENCE_KEY)
      .then((stored) => {
        if (!cancelled && isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => {
        // Unreadable preference: stay on `system`.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await SecureStore.setItemAsync(PREFERENCE_KEY, next);
    } catch {
      // Persisting is best effort; the in-memory value already applied.
    }
  }, []);

  // Dark is the default: an unknown system scheme resolves to dark.
  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  return (
    <ThemeContext.Provider value={{ scheme, colors: themes[scheme], preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

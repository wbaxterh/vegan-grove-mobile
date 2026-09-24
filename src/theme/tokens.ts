/**
 * Vegan Grove design tokens.
 *
 * The `brand` block is the `--vg-*` set from SCAFFOLD-SPEC section 2 and is the
 * source of truth shared with the web and docs repos. Everything else here is
 * derived from it.
 *
 * ============================================================================
 * THEME POLICY FOR AGENTS AND HUMANS
 * ============================================================================
 *
 * 1. Components never contain a hex value. They read `useTheme().colors` or the
 *    exports below. If a color is missing, add it HERE and say why in the PR.
 * 2. Dark mode is the default and the design target. Light mode must work, so
 *    every color has a value in both `themes.dark` and `themes.light`.
 * 3. `primary` is neon green (#3DFF8A) in dark mode and deep green (#0E7C3A) in
 *    light mode. Neon green text is only legible on dark surfaces, so in light
 *    mode `primary` is already the deep green; do not reach for `brand.primaryDark`
 *    directly in a component.
 * 4. `accent` (magenta) is for one emphasis per screen at most: a live badge, a
 *    highlighted count, a "new" marker. Never for buttons or body text.
 * 5. `accent2` (cyan) is for links and focus rings only.
 * 6. `danger` is for errors and destructive actions only.
 * 7. Monospace is a system font (Menlo on iOS, `monospace` on Android). No font
 *    files, no font CDNs, no `expo-font`.
 * 8. The light palette values marked "proposed" are not yet in the spec. Change
 *    them here only, and update SCAFFOLD-SPEC section 2 when they are ratified.
 */

import { Platform } from 'react-native';

/** The `--vg-*` tokens, verbatim from the spec. */
export const brand = {
  bg: '#0B0F0C',
  surface: '#121A15',
  text: '#E6F2EA',
  muted: '#8FA89A',
  primaryDark: '#3DFF8A',
  primaryLight: '#0E7C3A',
  accent: '#FF2BD6',
  accent2: '#22E5FF',
  danger: '#FF4D4D',
} as const;

export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  /** Screen background. */
  bg: string;
  /** Cards and panels. */
  surface: string;
  /** Body text. */
  text: string;
  /** Secondary text, placeholders, disabled labels. */
  muted: string;
  /** Primary action color for the active scheme. */
  primary: string;
  /** Text drawn on top of `primary`. */
  onPrimary: string;
  /** Magenta emphasis, sparingly. */
  accent: string;
  /** Cyan for links and focus rings. */
  accent2: string;
  /** Errors and destructive actions. */
  danger: string;
  /** Hairline borders and dividers. */
  border: string;
}

export const themes: Record<ColorScheme, ThemeColors> = {
  dark: {
    bg: brand.bg,
    surface: brand.surface,
    text: brand.text,
    muted: brand.muted,
    primary: brand.primaryDark,
    onPrimary: brand.bg,
    accent: brand.accent,
    accent2: brand.accent2,
    danger: brand.danger,
    // Derived from --vg-text at 14% so it tracks the text color, not a new hex.
    border: 'rgba(230, 242, 234, 0.14)',
  },
  light: {
    // Proposed light palette (see policy item 8). Text and border reuse dark
    // tokens so the two schemes share a hue.
    bg: '#F3F8F4',
    surface: '#FFFFFF',
    text: brand.bg,
    muted: '#4F6657',
    primary: brand.primaryLight,
    onPrimary: '#FFFFFF',
    accent: brand.accent,
    accent2: brand.accent2,
    danger: brand.danger,
    border: 'rgba(11, 15, 12, 0.12)',
  },
};

/** System font stacks only. See policy item 7. */
export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
  /** `undefined` lets React Native pick the platform UI font. */
  body: undefined,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  title: 28,
  h2: 20,
  body: 16,
  small: 13,
  mono: 12,
} as const;

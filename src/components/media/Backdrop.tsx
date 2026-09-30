/**
 * Backdrop: a photo under a scrim that fades into the screen background, or
 * the brand gradient panel when there is no photo. `expo-linear-gradient` is
 * not a dependency, so the gradient and the fade are stacks of translucent
 * bands: a handful of Views, theme colors only, no native module.
 */

import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/** Top to bottom: the accent's opacity per band of the gradient panel. */
const GRADIENT_BANDS = [0.3, 0.22, 0.15, 0.09, 0.05, 0.02] as const;
/** Top to bottom: how far the lower part fades into the screen background. */
const FADE_BANDS = [0.08, 0.2, 0.38, 0.6, 0.82, 1] as const;

export interface BackdropProps {
  uri: string | null | undefined;
  height: number;
  /** Fade the bottom into the screen background (default true). Off inside a framed player. */
  fade?: boolean;
  children?: ReactNode;
}

export function BrandGradient() {
  const { colors } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.posterBg }]}>
      {GRADIENT_BANDS.map((opacity) => (
        <View
          key={opacity}
          style={[styles.band, { backgroundColor: colors.posterAccent, opacity }]}
        />
      ))}
    </View>
  );
}

function Fade() {
  const { colors } = useTheme();
  return (
    <View style={styles.fade}>
      {FADE_BANDS.map((opacity) => (
        <View key={opacity} style={[styles.band, { backgroundColor: colors.bg, opacity }]} />
      ))}
    </View>
  );
}

export function Backdrop({ uri, height, fade = true, children }: BackdropProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { height, backgroundColor: colors.posterBg }]}>
      {uri ? (
        <ImageBackground
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        >
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: 0.35 }]}
          />
        </ImageBackground>
      ) : (
        <BrandGradient />
      )}
      {fade ? <Fade /> : null}
      {children ? <View style={styles.overlay}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  band: { flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '45%', pointerEvents: 'none' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
});

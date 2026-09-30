/**
 * Header for the media stack: back, a monospace kicker, an optional right
 * action. `BackButton` alone floats over a backdrop on a dark pill so it
 * reads on any photo.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';
import { goBack } from './navigation';

export function BackButton({ floating = false }: { floating?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      style={({ pressed }) => [
        styles.back,
        floating && [
          styles.floating,
          { backgroundColor: colors.posterBg, borderColor: colors.border },
        ],
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.glyph, { color: floating ? colors.posterText : colors.text }]}>
        {'[<]'}
      </Text>
    </Pressable>
  );
}

export interface MediaHeaderProps {
  kicker: string;
  right?: ReactNode;
}

export function MediaHeader({ kicker, right }: MediaHeaderProps) {
  return (
    <View style={styles.row}>
      <BackButton />
      <SectionLabel>{kicker}</SectionLabel>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    minHeight: 44,
  },
  right: { marginLeft: 'auto' },
  back: { minHeight: 32, justifyContent: 'center' },
  floating: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    opacity: 0.92,
  },
  pressed: { opacity: 0.7 },
  glyph: { fontFamily: fonts.mono, fontSize: fontSize.small, letterSpacing: 1 },
});

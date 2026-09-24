/** Card: a surface with a hairline border and an optional neon edge. */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export interface CardProps {
  children: ReactNode;
  /** Left edge color role. Use `accent` at most once per screen. */
  edge?: 'none' | 'primary' | 'accent' | 'accent2' | 'danger';
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({ children, edge = 'none', onPress, style, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const edgeColor = {
    none: 'transparent',
    primary: colors.primary,
    accent: colors.accent,
    accent2: colors.accent2,
    danger: colors.danger,
  }[edge];

  const surface = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    edge !== 'none' && { borderLeftWidth: 3, borderLeftColor: edgeColor },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [surface, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={surface}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  pressed: { opacity: 0.85 },
});

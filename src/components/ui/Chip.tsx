/** Chip: a pressable monospace pill for filters. Selected is the neon fill. */

import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}

export function Chip({ label, selected, onPress, accessibilityHint }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? colors.primary : 'transparent',
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, { color: selected ? colors.onPrimary : colors.muted }]}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  pressed: { opacity: 0.8 },
  text: {
    fontFamily: fonts.mono,
    fontSize: fontSize.mono,
    letterSpacing: 1,
  },
});

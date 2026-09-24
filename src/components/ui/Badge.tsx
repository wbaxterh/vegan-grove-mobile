/** Badge: a small monospace pill for vegan level, event type, status. */

import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

export interface BadgeProps {
  label: string;
  tone?: 'muted' | 'primary' | 'accent' | 'accent2' | 'danger';
}

export function Badge({ label, tone = 'muted' }: BadgeProps) {
  const { colors } = useTheme();
  const color = {
    muted: colors.muted,
    primary: colors.primary,
    accent: colors.accent,
    accent2: colors.accent2,
    danger: colors.danger,
  }[tone];

  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: fontSize.mono - 1,
    letterSpacing: 1,
  },
});

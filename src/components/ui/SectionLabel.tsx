/** Monospace, uppercase section label. The terminal voice of the UI. */

import { StyleSheet, Text, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts } from '@/theme/tokens';

export interface SectionLabelProps {
  children: string;
  /** Color role. `primary` is for the one label that should glow. */
  tone?: 'muted' | 'primary' | 'accent';
  style?: TextStyle;
}

export function SectionLabel({ children, tone = 'muted', style }: SectionLabelProps) {
  const { colors } = useTheme();
  const color =
    tone === 'primary' ? colors.primary : tone === 'accent' ? colors.accent : colors.muted;
  return (
    <Text style={[styles.label, { color }, style]} accessibilityRole="header">
      {`// ${children.toUpperCase()}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.mono,
    letterSpacing: 1.2,
  },
});

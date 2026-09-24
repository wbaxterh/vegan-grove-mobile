/**
 * Tab bar glyph: a two-to-four letter monospace code in a bordered box.
 * No icon font, no icon CDN (privacy rule 8 and the checklist's aesthetic
 * section), and it reads like a terminal prompt, which is the brand.
 */

import { type ColorValue, StyleSheet, Text, View } from 'react-native';
import { fonts, radius } from '@/theme/tokens';

export interface TabGlyphProps {
  code: string;
  /** Tint from the tab navigator (a theme color, already resolved for the scheme). */
  color: ColorValue;
  focused: boolean;
}

export function TabGlyph({ code, color, focused }: TabGlyphProps) {
  return (
    <View style={[styles.box, { borderColor: focused ? color : 'transparent' }]}>
      <Text style={[styles.text, { color }]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
});

/**
 * Screen: the Context / Action / Support frame every screen uses.
 *
 * - Context: `kicker` (monospace, e.g. "PLACES // MAP") and `title` say what
 *   this screen is.
 * - Action: `children` is what the member can do here.
 * - Support: `support` renders last, muted, and explains what helps.
 */

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';
import { SectionLabel } from './SectionLabel';

export interface ScreenProps {
  title?: string;
  kicker?: string;
  /** Short line under the title. */
  lede?: string;
  children?: ReactNode;
  /** Support content, rendered after the action area. */
  support?: ReactNode;
  /** Wrap in a ScrollView (default true). Pass false for full-bleed screens like the map. */
  scroll?: boolean;
  /** Apply horizontal padding (default true). */
  padded?: boolean;
  /** Extra style on the content container. */
  contentStyle?: ViewStyle;
}

export function Screen({
  title,
  kicker,
  lede,
  children,
  support,
  scroll = true,
  padded = true,
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const header =
    title || kicker || lede ? (
      <View style={[styles.header, padded && styles.padded]}>
        {kicker ? <SectionLabel>{kicker}</SectionLabel> : null}
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        {lede ? <Text style={[styles.lede, { color: colors.muted }]}>{lede}</Text> : null}
      </View>
    ) : null;

  const supportBlock = support ? (
    <View style={[styles.support, padded && styles.padded]}>
      <SectionLabel>support</SectionLabel>
      {support}
    </View>
  ) : null;

  const body = (
    <>
      {header}
      <View style={[styles.action, padded && styles.padded, contentStyle]}>{children}</View>
      {supportBlock}
    </>
  );

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        {body}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        paddingTop: insets.top + space.md,
        paddingBottom: insets.bottom + space.xxl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { paddingHorizontal: space.lg },
  header: { gap: space.xs, marginBottom: space.lg },
  title: { fontSize: fontSize.title, fontWeight: '700', letterSpacing: -0.5 },
  lede: { fontSize: fontSize.body, lineHeight: 22, fontFamily: fonts.body },
  action: { gap: space.md },
  support: { marginTop: space.xl, gap: space.sm },
});

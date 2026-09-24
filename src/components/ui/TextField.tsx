/** Labeled text input with an error line. Focus ring is cyan (accent2). */

import { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  hint?: string;
  /** Monospace input, for handles and codes. */
  mono?: boolean;
}

export function TextField({ label, error, hint, mono = false, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.accent2 : colors.border;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          mono && styles.mono,
          { color: colors.text, backgroundColor: colors.surface, borderColor },
        ]}
        accessibilityLabel={label}
      />
      {error ? (
        <Text style={[styles.meta, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.meta, { color: colors.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  label: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: fontSize.body,
  },
  mono: { fontFamily: fonts.mono },
  meta: { fontSize: fontSize.small },
});

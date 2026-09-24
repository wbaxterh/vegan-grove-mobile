/** Welcome: the brand, one line of what this is, three ways in. */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Profiles are never public. We keep an email, a handle, and the area you pick. Nothing
          else.
        </Text>
      }
    >
      <View style={styles.hero}>
        <SectionLabel tone="primary">vegan grove :: socal</SectionLabel>
        <Text style={[styles.title, { color: colors.text }]}>Find your people.{'\n'}Go act.</Text>
        <Text style={[styles.lede, { color: colors.muted }]}>
          Sanctuaries, vegan spots, and every action this month, for Southern California's vegan
          community.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Create account" onPress={() => router.push('/(auth)/register')} />
        <Button label="Log in" variant="secondary" onPress={() => router.push('/(auth)/login')} />
        <Button
          label="Email me a magic link"
          variant="ghost"
          onPress={() => router.push('/(auth)/magic-link')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.md, paddingTop: space.xxl, paddingBottom: space.xl },
  title: { fontSize: 40, lineHeight: 44, fontWeight: '800', fontFamily: fonts.mono },
  lede: { fontSize: fontSize.body, lineHeight: 24 },
  actions: { gap: space.sm },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

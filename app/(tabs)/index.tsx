/**
 * Home: the loop in one screen. Learn, Plan, Act, Share, Improve.
 * Real today: the notification soft-ask and navigation. Counts are placeholders
 * until `/api/stats` and the action log land (TODO(m2)).
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SoftAskCard } from '@/components/notifications/SoftAskCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

interface LoopStepProps {
  step: string;
  label: string;
  onPress: () => void;
}

function LoopStep({ step, label, onPress }: LoopStepProps) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${step}: ${label}`}>
      <Text style={[styles.step, { color: colors.primary }]}>{step.toUpperCase()}</Text>
      <Text style={[styles.stepLabel, { color: colors.text }]}>{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  return (
    <Screen
      kicker="home"
      title={user ? `@${user.handle}` : 'Vegan Grove'}
      lede="Learn, plan, act, share, improve."
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Your action log is private. Counts on this screen are yours alone.
        </Text>
      }
    >
      <SoftAskCard ready={status === 'authenticated'} />

      <View style={styles.grid}>
        <LoopStep
          step="plan"
          label="Places near you"
          onPress={() => router.push('/(tabs)/places')}
        />
        <LoopStep
          step="act"
          label="Actions this month"
          onPress={() => router.push('/(tabs)/events')}
        />
        <LoopStep
          step="share"
          label="Your grove feed"
          onPress={() => router.push('/(tabs)/feed')}
        />
        <LoopStep step="learn" label="Ask Ivy" onPress={() => router.push('/companion')} />
      </View>

      <Card>
        <SectionLabel>improve</SectionLabel>
        <Text style={[styles.body, { color: colors.text }]}>No actions logged yet.</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          RSVP to an event and log it afterwards. Your first entry starts the log.
        </Text>
      </Card>

      <Button
        label="Profile and settings"
        variant="secondary"
        onPress={() => router.push('/profile')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.sm },
  step: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1.2 },
  stepLabel: { fontSize: fontSize.h2, fontWeight: '600' },
  body: { fontSize: fontSize.body },
  hint: { fontSize: fontSize.small, lineHeight: 18 },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

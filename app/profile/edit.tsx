/** Edit profile: handle, home area, interests. PATCH /api/me. */

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { TextField } from '@/components/ui/TextField';
import { HOME_AREAS } from '@/constants/areas';
import { errorMessage } from '@/lib/api/client';
import { updateMe } from '@/lib/api/me';
import type { HomeArea } from '@/lib/api/types';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

interface AreaChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function AreaChip({ label, selected, onPress }: AreaChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.surface,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [homeArea, setHomeArea] = useState<HomeArea>(user?.homeArea ?? 'other');
  const [interests, setInterests] = useState((user?.interests ?? []).join(', '));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const updated = await updateMe({
        handle,
        homeArea,
        interests: interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setUser(updated);
      router.back();
    } catch (e) {
      setError(errorMessage(e, 'Could not save.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Edit profile"
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Interests go to Ivy along with your handle, and nothing else. Your area never leaves your
          own record.
        </Text>
      }
    >
      <TextField
        label="handle"
        value={handle}
        onChangeText={(v) => setHandle(v.toLowerCase())}
        autoCapitalize="none"
        autoCorrect={false}
        mono
        hint="3 to 24 characters: a-z, 0-9, underscore"
      />

      <View style={styles.group}>
        <SectionLabel>home area</SectionLabel>
        <View style={styles.chips}>
          {HOME_AREAS.map((area) => (
            <AreaChip
              key={area.value}
              label={area.label}
              selected={area.value === homeArea}
              onPress={() => setHomeArea(area.value)}
            />
          ))}
        </View>
      </View>

      <TextField
        label="interests"
        value={interests}
        onChangeText={setInterests}
        hint="Comma separated: outreach, sanctuaries, cooking"
        error={error}
      />

      <Button label="Save" onPress={save} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.mono, fontSize: fontSize.small },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

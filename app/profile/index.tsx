/** Profile: what the member looks like to themselves. There is no other view of it. */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { areaLabel } from '@/constants/areas';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <Screen
      support={
        <Text style={[styles.support, { color: colors.muted }]}>
          Friends see your handle and avatar. Nobody sees your email or area. There is no public
          profile page.
        </Text>
      }
    >
      <Card>
        <View style={styles.identity}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.avatarGlyph, { color: colors.primary }]}>
              {user?.handle?.slice(0, 2).toUpperCase() ?? '??'}
            </Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.handle, { color: colors.text }]}>
              @{user?.handle ?? 'loading'}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{areaLabel(user?.homeArea)}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <Badge
            label={user?.publicPostsEnabled ? 'public posts on' : 'friends only'}
            tone="primary"
          />
          {user?.role === 'admin' ? <Badge label="admin" tone="accent" /> : null}
        </View>
      </Card>

      <Card>
        <SectionLabel>interests</SectionLabel>
        <Text
          style={[styles.body, { color: user?.interests?.length ? colors.text : colors.muted }]}
        >
          {user?.interests?.length
            ? user.interests.join(', ')
            : 'None yet. Ivy uses these to help.'}
        </Text>
      </Card>

      <Button
        label="Edit profile"
        variant="secondary"
        onPress={() => router.push('/profile/edit')}
      />
      <Button
        label="Settings"
        variant="secondary"
        onPress={() => router.push('/profile/settings')}
      />
      <Button label="Privacy" variant="secondary" onPress={() => router.push('/profile/privacy')} />
      <Button label="Account" variant="secondary" onPress={() => router.push('/profile/account')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { fontFamily: fonts.mono, fontSize: fontSize.h2, fontWeight: '700' },
  identityText: { gap: 2 },
  handle: { fontSize: fontSize.h2, fontWeight: '700', fontFamily: fonts.mono },
  meta: { fontSize: fontSize.small },
  badges: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
  body: { fontSize: fontSize.body, lineHeight: 22 },
  support: { fontSize: fontSize.small, lineHeight: 18 },
});

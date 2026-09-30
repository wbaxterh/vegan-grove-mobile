/**
 * Take action: the links that turn a film into something done. Each is a
 * neon-edged card with the action type, the label as the editor wrote it,
 * and the organisation. Every link opens the system browser.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { actionTypeLabel } from '@/constants/media';
import type { MediaAction } from '@/lib/api/types';
import { openExternal } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

export function TakeAction({ actions }: { actions: MediaAction[] | null | undefined }) {
  const { colors } = useTheme();
  if (!actions || actions.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionLabel tone="primary">take action</SectionLabel>
      {actions.map((action) => (
        <Card
          key={`${action.type}|${action.url}`}
          edge="primary"
          onPress={() => openExternal(action.url)}
          accessibilityLabel={action.org ? `${action.label}, ${action.org}` : action.label}
        >
          <Badge label={actionTypeLabel(action.type)} tone="primary" />
          <Text style={[styles.label, { color: colors.text }]}>{action.label}</Text>
          {action.org ? (
            <Text style={[styles.org, { color: colors.muted }]}>{action.org}</Text>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  label: { fontSize: fontSize.body, fontWeight: '600', lineHeight: 22 },
  org: { fontSize: fontSize.small },
});

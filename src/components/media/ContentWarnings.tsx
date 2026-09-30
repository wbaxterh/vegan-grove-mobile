/**
 * Content warnings: visible before the watch links, quiet in tone. Muted
 * monospace pills say what to expect without shouting it.
 */

import { StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { space } from '@/theme/tokens';

export function ContentWarnings({ warnings }: { warnings: string[] | null | undefined }) {
  const unique = Array.from(new Set((warnings ?? []).filter(Boolean)));
  if (unique.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionLabel>content warnings</SectionLabel>
      <View style={styles.badges}>
        {unique.map((warning) => (
          <Badge key={warning} label={warning} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});

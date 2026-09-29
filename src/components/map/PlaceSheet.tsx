/**
 * Place sheet: the selected place, anchored over the bottom of the map.
 *
 * Context (level, type, name), Action (call, website), Support (hours, tags,
 * attribution). The pin alone is enough for the header, so the sheet opens
 * instantly and fills in when the full record arrives.
 */

import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { placeTypeInfo, VEGAN_LEVEL_LABEL } from '@/constants/places';
import type { MapPin, Place } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

/** ODbL attribution, required wording (docs: features/places/data-sources). */
const OSM_ATTRIBUTION = 'Data from OpenStreetMap contributors';

function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^+0-9]/g, '')}`;
}

/** Provenance is shown as the attribution line, not as a tag. */
function visibleTags(tags: string[]): string[] {
  return tags.filter((tag) => tag !== 'osm' && !tag.startsWith('osm:'));
}

function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

interface PlaceActionsProps {
  phone?: string | null;
  website?: string | null;
}

function PlaceActions({ phone, website }: PlaceActionsProps) {
  if (!phone && !website) return null;
  return (
    <View style={styles.actions}>
      {phone ? (
        <Button
          label="Call"
          variant="secondary"
          mono
          onPress={() => open(telUrl(phone))}
          accessibilityHint={phone}
          style={styles.action}
        />
      ) : null}
      {website ? (
        <Button
          label="Website"
          variant="secondary"
          mono
          onPress={() => open(website)}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

interface PlaceDetailsProps {
  place: Place;
}

function PlaceDetails({ place }: PlaceDetailsProps) {
  const { colors } = useTheme();
  const where = [place.city, place.postcode].filter(Boolean).join(' ');
  const tags = visibleTags(place.tags);
  return (
    <>
      {where ? <Text style={[styles.meta, { color: colors.muted }]}>{where}</Text> : null}
      {place.description ? (
        <Text style={[styles.body, { color: colors.text }]} numberOfLines={3}>
          {place.description}
        </Text>
      ) : null}
      {place.hours ? (
        <Text style={[styles.mono, { color: colors.muted }]}>{place.hours}</Text>
      ) : null}
      <PlaceActions phone={place.phone} website={place.website} />
      {tags.length ? (
        <Text style={[styles.mono, { color: colors.muted }]}>{tags.join(' / ')}</Text>
      ) : null}
      {place.source === 'osm' ? (
        <Text style={[styles.attribution, { color: colors.muted }]}>{OSM_ATTRIBUTION}</Text>
      ) : null}
    </>
  );
}

export interface PlaceSheetProps {
  pin: MapPin;
  /** Full record once loaded. */
  place?: Place;
  loading?: boolean;
  error?: string;
  onClose: () => void;
}

export function PlaceSheet({ pin, place, loading, error, onClose }: PlaceSheetProps) {
  const { colors } = useTheme();
  const full = pin.veganLevel === 'full';
  const type = placeTypeInfo(pin.type);

  return (
    <Card edge={full ? 'primary' : 'accent2'} accessibilityLabel={pin.name}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <Badge label={VEGAN_LEVEL_LABEL[pin.veganLevel]} tone={full ? 'primary' : 'accent2'} />
          <Badge label={type.label} />
          {pin.chain ? <Badge label="chain" /> : null}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
        >
          <Text style={[styles.close, { color: colors.muted }]}>[x]</Text>
        </Pressable>
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{pin.name}</Text>
      {type.blurb ? (
        <Text style={[styles.blurb, { color: colors.muted }]}>{type.blurb}</Text>
      ) : null}
      {place ? <PlaceDetails place={place} /> : null}
      {loading ? <Text style={[styles.mono, { color: colors.muted }]}>loading</Text> : null}
      {error ? <Text style={[styles.mono, { color: colors.danger }]}>{error}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  close: { fontFamily: fonts.mono, fontSize: fontSize.small, letterSpacing: 1 },
  name: { fontSize: fontSize.h2, fontWeight: '600' },
  blurb: { fontSize: fontSize.small, lineHeight: 18 },
  meta: { fontSize: fontSize.small },
  body: { fontSize: fontSize.body, lineHeight: 22 },
  mono: { fontFamily: fonts.mono, fontSize: fontSize.mono, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1, minHeight: 40, paddingVertical: space.sm },
  attribution: { fontSize: fontSize.mono, fontStyle: 'italic' },
});

/**
 * Places: MapLibre map with markers from a bbox query, a list toggle, and a
 * "center on me" action.
 *
 * Needs a development build: MapLibre is a native module and is not in Expo Go.
 *
 * Privacy rule 3: device location only moves the camera. The API only ever
 * sees the visible bounding box.
 */

import type { CameraRef } from '@maplibre/maplibre-react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlacesMap } from '@/components/map/PlacesMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { errorMessage } from '@/lib/api/client';
import { bboxParam, listPlaces } from '@/lib/api/places';
import type { Bbox, Place } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, space } from '@/theme/tokens';

/** Greater Los Angeles, the starting viewport before the map reports its own bounds. */
const INITIAL_BBOX: Bbox = { west: -118.95, south: 33.65, east: -117.55, north: 34.45 };

interface PlaceRowProps {
  place: Place;
  selected: boolean;
  onPress: () => void;
}

function PlaceRow({ place, selected, onPress }: PlaceRowProps) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} edge={selected ? 'primary' : 'none'} accessibilityLabel={place.name}>
      <View style={styles.badges}>
        <Badge
          label={place.veganLevel === 'full' ? 'fully vegan' : 'vegan options'}
          tone="primary"
        />
        <Badge label={place.type} />
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{place.name}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{place.city}</Text>
    </Card>
  );
}

export default function PlacesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const [bbox, setBbox] = useState<Bbox>(INITIAL_BBOX);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const placesQuery = useQuery({
    queryKey: ['places', bboxParam(bbox)],
    queryFn: ({ signal }) => listPlaces({ bbox }, signal),
    placeholderData: (previous) => previous,
  });
  const places = placesQuery.data?.items ?? [];

  const centerOnMe = async () => {
    setLocationNote(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationNote('Location is off. The map still works; pan to your area.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      cameraRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 12,
        duration: 1200,
      });
    } catch (e) {
      setLocationNote(errorMessage(e, 'Could not read your location.'));
    } finally {
      setLocating(false);
    }
  };

  const toolbar = (
    <View
      style={[styles.toolbar, { paddingTop: insets.top + space.sm, backgroundColor: colors.bg }]}
    >
      <Button
        label={view === 'map' ? 'List' : 'Map'}
        variant="secondary"
        mono
        onPress={() => setView(view === 'map' ? 'list' : 'map')}
        style={styles.toolbarButton}
      />
      <Button
        label="Center on me"
        variant="secondary"
        mono
        onPress={centerOnMe}
        loading={locating}
        style={styles.toolbarButton}
      />
      <Text style={[styles.count, { color: colors.muted }]}>
        {placesQuery.isFetching ? 'loading' : `${places.length} in view`}
      </Text>
    </View>
  );

  if (view === 'list') {
    return (
      <Screen scroll={false} padded={false}>
        {toolbar}
        <FlatList
          data={places}
          keyExtractor={(place) => place.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PlaceRow
              place={item}
              selected={item.id === selectedId}
              onPress={() => {
                setSelectedId(item.id);
                setView('map');
                cameraRef.current?.flyTo({ center: item.location.coordinates, zoom: 14 });
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              {placesQuery.isError
                ? errorMessage(placesQuery.error)
                : 'No approved places in this area yet. Pan the map or add one.'}
            </Text>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false} contentStyle={styles.fill}>
      {toolbar}
      <PlacesMap
        places={places}
        selectedId={selectedId}
        cameraRef={cameraRef}
        onRegionChange={setBbox}
        onSelect={(place) => setSelectedId(place.id)}
      />
      {locationNote || placesQuery.isError ? (
        <View
          style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.noteText, { color: colors.muted }]}>
            {locationNote ?? errorMessage(placesQuery.error)}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  toolbarButton: { minHeight: 40, paddingVertical: space.sm },
  count: { marginLeft: 'auto', fontSize: fontSize.small },
  list: { padding: space.lg, gap: space.sm },
  badges: { flexDirection: 'row', gap: space.xs },
  name: { fontSize: fontSize.h2, fontWeight: '600' },
  meta: { fontSize: fontSize.small },
  empty: { fontSize: fontSize.body, lineHeight: 22, textAlign: 'center', paddingTop: space.xl },
  note: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    borderWidth: 1,
    borderRadius: 10,
    padding: space.md,
  },
  noteText: { fontSize: fontSize.small },
});

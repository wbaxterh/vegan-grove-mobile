/**
 * Places: MapLibre markers from the map-pins query, a list from the places
 * query, both under the same filters, plus a "center on me" action.
 *
 * Needs a development build: MapLibre is a native module and is not in Expo Go.
 *
 * Privacy rule 3: device location only moves the camera. The API only ever
 * sees the visible bounding box and the filters.
 */

import type { CameraRef } from '@maplibre/maplibre-react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceSheet } from '@/components/map/PlaceSheet';
import { PlacesMap } from '@/components/map/PlacesMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { PLACE_TYPES, placeTypeLabel, VEGAN_LEVEL_LABEL } from '@/constants/places';
import { errorMessage } from '@/lib/api/client';
import { bboxParam, fetchMapPins, filtersKey, getPlace, listPlaces } from '@/lib/api/places';
import type { Bbox, MapPin, Place } from '@/lib/api/types';
import { levelIncluded, usePlaceFiltersStore } from '@/lib/stores/placeFiltersStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, space } from '@/theme/tokens';

/** Greater Los Angeles, the starting viewport before the map reports its own bounds. */
const INITIAL_BBOX: Bbox = { west: -118.95, south: 33.65, east: -117.55, north: 34.45 };

/** Fully vegan first; API order otherwise (sort is stable). */
function fullFirst(places: Place[]): Place[] {
  return [...places].sort(
    (a, b) => Number(a.veganLevel !== 'full') - Number(b.veganLevel !== 'full'),
  );
}

interface PlaceRowProps {
  place: Place;
  selected: boolean;
  onPress: () => void;
}

function PlaceRow({ place, selected, onPress }: PlaceRowProps) {
  const { colors } = useTheme();
  const full = place.veganLevel === 'full';
  return (
    <Card onPress={onPress} edge={selected ? 'primary' : 'none'} accessibilityLabel={place.name}>
      <View style={styles.badges}>
        <Badge label={VEGAN_LEVEL_LABEL[place.veganLevel]} tone={full ? 'primary' : 'accent2'} />
        <Badge label={placeTypeLabel(place.type)} />
        {place.chain ? <Badge label="chain" /> : null}
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{place.name}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {[place.city, place.postcode].filter(Boolean).join(' ')}
      </Text>
    </Card>
  );
}

function FilterBar() {
  const { colors } = useTheme();
  const filters = usePlaceFiltersStore((state) => state.filters);
  const toggleVeganLevel = usePlaceFiltersStore((state) => state.toggleVeganLevel);
  const toggleChains = usePlaceFiltersStore((state) => state.toggleChains);
  const toggleType = usePlaceFiltersStore((state) => state.toggleType);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterBar}
      contentContainerStyle={styles.filters}
    >
      <Chip
        label="Fully vegan"
        selected={levelIncluded(filters.veganLevel, 'full')}
        onPress={() => toggleVeganLevel('full')}
        accessibilityHint="Places with nothing but vegan food"
      />
      <Chip
        label="Vegan options"
        selected={levelIncluded(filters.veganLevel, 'options')}
        onPress={() => toggleVeganLevel('options')}
        accessibilityHint="Places with a vegan menu among other food"
      />
      <Chip
        label="Show chains"
        selected={filters.includeChains}
        onPress={toggleChains}
        accessibilityHint="Include chain and franchise locations"
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      {PLACE_TYPES.map((type) => (
        <Chip
          key={type.value}
          label={type.label}
          selected={filters.types.includes(type.value)}
          onPress={() => toggleType(type.value)}
          accessibilityHint={type.blurb}
        />
      ))}
    </ScrollView>
  );
}

/** The full record for the selected pin: from the list page when it is there, else by slug. */
function useSelectedPlace(selected: MapPin | null, places: Place[]) {
  const listed = selected ? places.find((place) => place.id === selected.id) : undefined;
  const slug = selected?.slug ?? '';
  const detailQuery = useQuery({
    queryKey: ['places', 'detail', slug],
    queryFn: () => getPlace(slug),
    enabled: selected !== null && listed === undefined,
  });
  return {
    place: listed ?? detailQuery.data,
    loading: detailQuery.isFetching,
    error: detailQuery.isError ? errorMessage(detailQuery.error) : undefined,
  };
}

export default function PlacesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const filters = usePlaceFiltersStore((state) => state.filters);
  const [bbox, setBbox] = useState<Bbox>(INITIAL_BBOX);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const scope = [bboxParam(bbox), filtersKey(filters)];

  const pinsQuery = useQuery({
    queryKey: ['places', 'pins', ...scope],
    queryFn: ({ signal }) => fetchMapPins(bbox, filters, signal),
    placeholderData: (previous) => previous,
  });
  const pins = pinsQuery.data?.items ?? [];

  const listQuery = useQuery({
    queryKey: ['places', 'list', ...scope],
    queryFn: ({ signal }) => listPlaces({ bbox, filters }, signal),
    placeholderData: (previous) => previous,
    enabled: view === 'list',
  });
  const places = useMemo(() => fullFirst(listQuery.data?.items ?? []), [listQuery.data]);

  const selection = useSelectedPlace(selected, places);

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

  const selectFromList = (place: Place) => {
    setSelected(place);
    setView('map');
    cameraRef.current?.flyTo({ center: [place.location.lng, place.location.lat], zoom: 14 });
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
        {pinsQuery.isFetching ? 'loading' : `${pins.length} in view`}
      </Text>
    </View>
  );

  if (view === 'list') {
    let emptyText = 'No places match here yet. Widen the filters, pan the map, or add one.';
    if (listQuery.isError) emptyText = errorMessage(listQuery.error);
    else if (listQuery.isPending) emptyText = 'loading';
    return (
      <Screen scroll={false} padded={false} contentStyle={styles.fill}>
        {toolbar}
        <FilterBar />
        <FlatList
          data={places}
          keyExtractor={(place) => place.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PlaceRow
              place={item}
              selected={item.id === selected?.id}
              onPress={() => selectFromList(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>{emptyText}</Text>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false} contentStyle={styles.fill}>
      {toolbar}
      <FilterBar />
      <PlacesMap
        pins={pins}
        selectedId={selected?.id ?? null}
        cameraRef={cameraRef}
        onRegionChange={setBbox}
        onSelect={setSelected}
      />
      <View style={styles.overlay}>
        {locationNote || pinsQuery.isError ? (
          <View
            style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.noteText, { color: colors.muted }]}>
              {locationNote ?? errorMessage(pinsQuery.error)}
            </Text>
          </View>
        ) : null}
        {selected ? (
          <PlaceSheet
            pin={selected}
            place={selection.place}
            loading={selection.loading}
            error={selection.error}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </View>
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
  filterBar: { flexGrow: 0 },
  filters: { paddingHorizontal: space.lg, gap: space.sm, alignItems: 'center' },
  divider: { width: 1, height: 20, marginHorizontal: space.xs },
  list: { padding: space.lg, gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  name: { fontSize: fontSize.h2, fontWeight: '600' },
  meta: { fontSize: fontSize.small },
  empty: { fontSize: fontSize.body, lineHeight: 22, textAlign: 'center', paddingTop: space.xl },
  overlay: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    gap: space.sm,
    pointerEvents: 'box-none',
  },
  note: { borderWidth: 1, borderRadius: radius.md, padding: space.md },
  noteText: { fontSize: fontSize.small },
});

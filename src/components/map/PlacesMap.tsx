/**
 * Places map on MapLibre with the OpenFreeMap `liberty` style.
 *
 * NATIVE MODULE: `@maplibre/maplibre-react-native` is not in Expo Go. Run the
 * app in a development build (`eas build --profile development`, then
 * `npx expo start --dev-client`).
 *
 * Privacy rule 3: the only thing this component reports upward is the visible
 * bounding box, debounced, so the places query can refetch. Device location
 * is handled by the screen and only ever moves the camera.
 */

import {
  Camera,
  type CameraRef,
  type LngLat,
  type LngLatBounds,
  Map as MapLibreMap,
  Marker,
} from '@maplibre/maplibre-react-native';
import { type Ref, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Bbox, Place } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';

export const OPENFREEMAP_LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';

/** Downtown Los Angeles. The map starts here until the member centers it. */
export const DEFAULT_CENTER: LngLat = [-118.2437, 34.0522];
export const DEFAULT_ZOOM = 10;

const REGION_DEBOUNCE_MS = 400;

export function boundsToBbox(bounds: LngLatBounds): Bbox {
  const [west, south, east, north] = bounds;
  return { west, south, east, north };
}

export interface PlacesMapProps {
  places: Place[];
  selectedId?: string | null;
  onRegionChange: (bbox: Bbox) => void;
  onSelect: (place: Place) => void;
  cameraRef?: Ref<CameraRef>;
}

export function PlacesMap({
  places,
  selectedId,
  onRegionChange,
  onSelect,
  cameraRef,
}: PlacesMapProps) {
  const { colors } = useTheme();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  return (
    <MapLibreMap
      style={styles.map}
      mapStyle={OPENFREEMAP_LIBERTY}
      attribution
      attributionPosition={{ bottom: 8, right: 8 }}
      logo={false}
      compass={false}
      touchPitch={false}
      onRegionDidChange={(event) => {
        const bounds = event.nativeEvent.bounds;
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(
          () => onRegionChange(boundsToBbox(bounds)),
          REGION_DEBOUNCE_MS,
        );
      }}
    >
      <Camera ref={cameraRef} initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }} />
      {places.map((place) => {
        const selected = place.id === selectedId;
        return (
          <Marker
            key={place.id}
            id={place.id}
            lngLat={place.location.coordinates}
            anchor="center"
            selected={selected}
            onPress={() => onSelect(place)}
          >
            <View
              accessibilityLabel={place.name}
              style={[
                styles.dot,
                {
                  backgroundColor: place.veganLevel === 'full' ? colors.primary : colors.surface,
                  borderColor: selected ? colors.accent : colors.primary,
                },
                selected && styles.dotSelected,
              ]}
            />
          </Marker>
        );
      })}
    </MapLibreMap>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  dotSelected: { width: 20, height: 20, borderRadius: 10 },
});

/**
 * Places map on MapLibre with the OpenFreeMap `liberty` style.
 *
 * NATIVE MODULE: `@maplibre/maplibre-react-native` is not in Expo Go. Run the
 * app in a development build (`eas build --profile development`, then
 * `npx expo start --dev-client`).
 *
 * Privacy rule 3: the only thing this component reports upward is the visible
 * bounding box, debounced, so the places queries can refetch. Device location
 * is handled by the screen and only ever moves the camera.
 *
 * Markers are `MapPin`s from the map-pins route, not full places. Fully vegan
 * is green, vegan options is cyan, and sanctuaries and gardens get a lettered
 * square (the same monospace glyph idea as the tab bar, no icon font) so a
 * place to act stands apart from a place to eat.
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
import { StyleSheet, Text, View } from 'react-native';
import { placeTypeInfo } from '@/constants/places';
import type { Bbox, MapPin } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

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
  pins: MapPin[];
  selectedId?: string | null;
  onRegionChange: (bbox: Bbox) => void;
  onSelect: (pin: MapPin) => void;
  cameraRef?: Ref<CameraRef>;
}

interface PinGlyphProps {
  pin: MapPin;
  selected: boolean;
}

function PinGlyph({ pin, selected }: PinGlyphProps) {
  const { colors } = useTheme();
  const fill = pin.veganLevel === 'full' ? colors.primary : colors.accent2;
  const ring = selected ? colors.accent : colors.bg;
  const glyph = placeTypeInfo(pin.type).glyph;

  if (glyph) {
    return (
      <View
        accessibilityLabel={pin.name}
        style={[
          styles.square,
          { backgroundColor: fill, borderColor: ring },
          selected && styles.squareSelected,
        ]}
      >
        <Text style={[styles.glyph, { color: colors.onPrimary }]}>{glyph}</Text>
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={pin.name}
      style={[
        styles.dot,
        { backgroundColor: fill, borderColor: ring },
        selected && styles.dotSelected,
      ]}
    />
  );
}

export function PlacesMap({
  pins,
  selectedId,
  onRegionChange,
  onSelect,
  cameraRef,
}: PlacesMapProps) {
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
      {pins.map((pin) => {
        const selected = pin.id === selectedId;
        return (
          <Marker
            key={pin.id}
            id={pin.id}
            lngLat={[pin.location.lng, pin.location.lat]}
            anchor="center"
            selected={selected}
            onPress={() => onSelect(pin)}
          >
            <PinGlyph pin={pin} selected={selected} />
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
  square: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareSelected: { width: 28, height: 28 },
  glyph: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '700' },
});

/**
 * Click-to-load trailer. Nothing leaves the device until the member taps the
 * poster button; then a WebView loads the youtube-nocookie embed (no tracking
 * cookies before playback, `rel=0` keeps suggestions to the same channel,
 * `incognito` drops whatever the player stores when the view unmounts). A
 * navigation away from the embed opens in the system browser instead of
 * wandering inside the WebView.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { openExternal } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';
import { Backdrop } from './Backdrop';

const EMBED_BASE = 'https://www.youtube-nocookie.com/embed/';

export function trailerUrl(youtubeId: string): string {
  return `${EMBED_BASE}${encodeURIComponent(youtubeId)}?rel=0&playsinline=1`;
}

export interface TrailerPlayerProps {
  youtubeId: string;
  backdropUrl: string | null;
  title: string;
  /** Start with the player loaded, for the hero's Trailer button. */
  autoOpen?: boolean;
}

export function TrailerPlayer({
  youtubeId,
  backdropUrl,
  title,
  autoOpen = false,
}: TrailerPlayerProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [loaded, setLoaded] = useState(autoOpen);
  const height = Math.round(((width - space.lg * 2) * 9) / 16);
  const url = trailerUrl(youtubeId);

  const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
    const inside = request.url.startsWith(EMBED_BASE) || request.url === 'about:blank';
    if (!request.isTopFrame || inside) return true;
    openExternal(request.url);
    return false;
  };

  if (!loaded) {
    return (
      <Pressable
        onPress={() => setLoaded(true)}
        accessibilityRole="button"
        accessibilityLabel={`Play the trailer for ${title}`}
        accessibilityHint="Loads the trailer from YouTube"
        style={({ pressed }) => [
          styles.frame,
          { borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Backdrop uri={backdropUrl} height={height} fade={false}>
          <View style={styles.center}>
            <View style={[styles.play, { backgroundColor: colors.primary }]}>
              <Text style={[styles.playLabel, { color: colors.onPrimary }]}>PLAY</Text>
            </View>
            <Text style={[styles.note, { color: colors.posterText }]}>
              Trailer loads from YouTube when you tap
            </Text>
          </View>
        </Backdrop>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.frame,
        { height, borderColor: colors.border, backgroundColor: colors.posterBg },
      ]}
    >
      <WebView
        source={{ uri: url }}
        style={[styles.web, { backgroundColor: colors.posterBg }]}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        domStorageEnabled
        incognito
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        accessibilityLabel={`Trailer for ${title}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  play: {
    minWidth: 72,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  playLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.small,
    letterSpacing: 2,
    fontWeight: '700',
  },
  note: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 0.5 },
  web: { flex: 1 },
});

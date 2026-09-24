/**
 * Post composer (stub). The real upload flow (presign, PUT, POST /posts) is
 * TODO(m2). What is real today is the privacy path: every picked image goes
 * through `stripExif` before it could ever leave the device.
 */

import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/lib/api/client';
import { type StrippedImage, stripExif } from '@/lib/images/stripExif';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, space } from '@/theme/tokens';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionLabel } from '../ui/SectionLabel';

export interface PostComposerProps {
  /** Called with the EXIF-free JPEG. Upload is the caller's job. */
  onReady?: (image: StrippedImage) => void;
}

export function PostComposer({ onReady }: PostComposerProps) {
  const { colors } = useTheme();
  const [image, setImage] = useState<StrippedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is off. Allow it in Settings to post a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: false,
    });
    if (result.canceled || !result.assets[0]) return;

    setBusy(true);
    try {
      const clean = await stripExif(result.assets[0].uri);
      setImage(clean);
      onReady?.(clean);
    } catch (e) {
      setError(errorMessage(e, 'Could not prepare that image.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <SectionLabel>new post</SectionLabel>
      {image ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: image.uri }}
            style={[styles.preview, { borderColor: colors.border }]}
            accessibilityLabel="Selected photo, metadata removed"
          />
          <View style={styles.row}>
            <Badge label="exif stripped" tone="primary" />
            <Badge label={`${image.width}x${image.height}`} />
          </View>
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Photos are re-encoded on your phone before upload, so location and camera data never leave
          it.
        </Text>
      )}
      {error ? <Text style={[styles.hint, { color: colors.danger }]}>{error}</Text> : null}
      <View style={styles.row}>
        <Button
          label={image ? 'Choose another' : 'Choose photo'}
          variant="secondary"
          onPress={pick}
          loading={busy}
          style={styles.grow}
        />
        <Button label="Post" disabled={!image} onPress={() => {}} style={styles.grow} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  previewWrap: { gap: space.sm },
  preview: { width: '100%', aspectRatio: 1, borderRadius: radius.md, borderWidth: 1 },
  hint: { fontSize: fontSize.small, lineHeight: 18 },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  grow: { flex: 1 },
});

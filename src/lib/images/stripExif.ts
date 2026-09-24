/**
 * Strip EXIF before upload (privacy rule 4).
 *
 * Re-encoding through expo-image-manipulator writes a fresh JPEG with no
 * metadata block, which drops GPS, device model, and capture time. Every image
 * that leaves the device goes through here first: avatars, post images, place
 * photos. Video goes through Bunny Stream, which transcodes on its side.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface StrippedImage {
  uri: string;
  width: number;
  height: number;
}

export interface StripExifOptions {
  /** Downscale so the longest edge is at most this many pixels. Default 2048. */
  maxEdge?: number;
  /** JPEG quality 0..1. Default 0.9. */
  quality?: number;
}

export async function stripExif(
  uri: string,
  options: StripExifOptions = {},
): Promise<StrippedImage> {
  const { maxEdge = 2048, quality = 0.9 } = options;
  const context = ImageManipulator.manipulate(uri);
  const probe = await context.renderAsync();
  try {
    const longest = Math.max(probe.width, probe.height);
    if (longest > maxEdge) {
      const scale = maxEdge / longest;
      context.resize({
        width: Math.round(probe.width * scale),
        height: Math.round(probe.height * scale),
      });
    }
    const rendered = longest > maxEdge ? await context.renderAsync() : probe;
    try {
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality });
      return { uri: saved.uri, width: saved.width, height: saved.height };
    } finally {
      if (rendered !== probe) rendered.release();
    }
  } finally {
    probe.release();
    context.release();
  }
}

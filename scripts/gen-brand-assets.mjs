#!/usr/bin/env node

/**
 * Generates the placeholder brand PNGs in assets/images from the spec tokens.
 * Zero dependencies: a minimal PNG encoder over zlib, and pixel math for a
 * green disc with a dark crescent cut (a leaf-ish mark). Re-run with
 * `npm run assets:brand` after changing anything here. Replace these with real
 * artwork when it exists; keep the file names.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');

const BG = hex('#0B0F0C');
const PRIMARY = hex('#3DFF8A');
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

function hex(value) {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

// CRC32 for PNG chunks.
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, pixelAt) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * The mark: a disc of `fill` with a crescent cut out (revealing `cut`), scaled
 * so the disc diameter is `scale` of the canvas. `background` fills the rest.
 */
function mark({ size, scale, fill, cut, background }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size * scale) / 2;
  const cutR = r * 0.62;
  const cutX = cx + r * 0.28;
  const cutY = cy - r * 0.28;
  return (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    if (dx * dx + dy * dy > r * r) return background;
    const ex = x + 0.5 - cutX;
    const ey = y + 0.5 - cutY;
    if (ex * ex + ey * ey < cutR * cutR) return cut;
    return fill;
  };
}

const files = [
  ['icon.png', 1024, mark({ size: 1024, scale: 0.68, fill: PRIMARY, cut: BG, background: BG })],
  ['favicon.png', 48, mark({ size: 48, scale: 0.8, fill: PRIMARY, cut: BG, background: BG })],
  [
    'splash-icon.png',
    512,
    mark({ size: 512, scale: 0.9, fill: PRIMARY, cut: CLEAR, background: CLEAR }),
  ],
  [
    'android-icon-foreground.png',
    1024,
    mark({ size: 1024, scale: 0.5, fill: PRIMARY, cut: CLEAR, background: CLEAR }),
  ],
  ['android-icon-background.png', 1024, () => BG],
  [
    'android-icon-monochrome.png',
    1024,
    mark({ size: 1024, scale: 0.5, fill: WHITE, cut: CLEAR, background: CLEAR }),
  ],
  [
    'notification-icon.png',
    96,
    mark({ size: 96, scale: 0.9, fill: WHITE, cut: CLEAR, background: CLEAR }),
  ],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size, pixelAt] of files) {
  writeFileSync(join(OUT, name), encodePng(size, pixelAt));
  process.stdout.write(`wrote ${name} (${size}x${size})\n`);
}

// Compress template bg PNGs >1MB to <500KB
// Strategy: PNG palette quantization + progressive resize until <500KB.

import sharp from 'sharp';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = 'public/templates';
const MAX_BYTES = 500 * 1024;
const TRIGGER_BYTES = 1024 * 1024;

async function compress(file) {
  const path = join(DIR, file);
  const original = (await stat(path)).size;
  if (original <= TRIGGER_BYTES) return { file, original, skipped: true };

  const meta = await sharp(path).metadata();
  let width = meta.width;
  let attempt = 0;
  let bestBuf = null;

  while (true) {
    attempt++;
    const buf = await sharp(path)
      .resize({ width, withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9, palette: true, effort: 10 })
      .toBuffer();

    bestBuf = buf;
    if (buf.length <= MAX_BYTES || width < 600) break;
    width = Math.round(width * 0.85);
    if (attempt > 8) break;
  }

  await writeFile(path, bestBuf);
  return { file, original, compressed: bestBuf.length, finalWidth: width };
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.png'));
for (const f of files) {
  try {
    const r = await compress(f);
    if (r.skipped) {
      console.log(`SKIP  ${f}  (${(r.original / 1024).toFixed(0)} KB)`);
    } else {
      console.log(
        `OK    ${f}  ${(r.original / 1024).toFixed(0)} KB → ${(r.compressed / 1024).toFixed(0)} KB  (w=${r.finalWidth})`
      );
    }
  } catch (e) {
    console.error(`FAIL  ${f}:`, e.message);
  }
}

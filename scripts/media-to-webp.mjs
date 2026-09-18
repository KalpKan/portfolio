#!/usr/bin/env node
// Convert one image (PNG/JPEG/HEIC-as-PNG/WebP) into a WebP that fits the
// hub's showcase rule: longest side 1600 px, 300 KB or less. Quality steps
// down until the file fits, so the output is always publishable.
//
// Usage:
//   node scripts/media-to-webp.mjs <input> <output.webp> [maxSide=1600]
//
// Sharp ships with Next.js, so nothing extra to install. HEIC from an iPhone
// is not readable by sharp on macOS; open it in Preview and export as PNG
// first (File -> Export -> PNG), then run this.
import sharp from "sharp";
import { statSync } from "node:fs";
import path from "node:path";

const LIMIT = 300 * 1024;
const [input, output, maxSideArg] = process.argv.slice(2);
if (!input || !output || path.extname(output) !== ".webp") {
  console.error("usage: node scripts/media-to-webp.mjs <input> <output.webp> [maxSide]");
  process.exit(2);
}
const maxSide = Number(maxSideArg ?? 1600);

let quality = 82;
for (;;) {
  await sharp(input)
    .rotate() // honour EXIF orientation from phones
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(output);
  const size = statSync(output).size;
  if (size <= LIMIT || quality <= 40) {
    const meta = await sharp(output).metadata();
    console.log(`${output}: ${meta.width}x${meta.height}, ${(size / 1024).toFixed(0)} KB, quality ${quality}`);
    if (size > LIMIT) {
      console.error(`still over ${LIMIT / 1024} KB at quality ${quality}; pass a smaller maxSide`);
      process.exit(1);
    }
    break;
  }
  quality -= 6;
}

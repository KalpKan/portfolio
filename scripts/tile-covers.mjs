#!/usr/bin/env node
// Make the Projects window's tile covers: public/images/covers/<slug>.webp,
// 480x360 (the 4:3 art box at 2x of its ~240 px width), WebP, ~40 KB or less.
// Sources are the registry heroes (app screenshots), the case studies' own
// photos, or a simulation plot (eeg).
//
// Usage: node scripts/tile-covers.mjs [slug ...]
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const img = (...p) => path.join(root, "public", "images", "projects", ...p);
const outDir = path.join(root, "public", "images", "covers");
const W = 480;
const H = 360;
const LIMIT = 40 * 1024;

/** slug -> source file and, optionally, a crop (source pixels) or a cover position. */
const COVERS = {
  promptflip: { src: img("promptflip", "hero.webp") },
  basketball: { src: img("basketball", "hero.webp") },
  plato: { src: img("plato", "hero.webp") },
  plantit: { src: img("plantit", "hero.webp") },
  microtubules: { src: img("microtubules", "hero.webp") },
  pushups: { src: img("pushups", "hero.webp") },
  emotes: { src: img("emotes", "hero.webp"), crop: { left: 160, top: 0, width: 960, height: 720 } },
  sift: { src: img("sift", "hero.webp"), crop: { left: 100, top: 0, width: 960, height: 720 } },
  unpark: { src: img("unpark", "enclosure-render.webp"), crop: { left: 140, top: 0, width: 960, height: 720 } },
  "rc-car": { src: img("rc-car", "front.webp"), crop: { left: 0, top: 290, width: 608, height: 456 } },
  eeg: { src: img("eeg", "simulation.webp") },
  "porsche-pcb-keychain": { src: img("porsche-pcb-keychain", "render-both.webp"), crop: { left: 240, top: 60, width: 1120, height: 840 } },
};

const only = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
for (const [slug, c] of Object.entries(COVERS)) {
  if (only.length && !only.includes(slug)) continue;
  const out = path.join(outDir, `${slug}.webp`);
  let q = 80;
  for (;;) {
    let p = sharp(c.src);
    if (c.crop) p = p.extract(c.crop);
    await p.resize(W, H, { fit: "cover", position: "top" }).webp({ quality: q, effort: 6 }).toFile(out);
    const size = statSync(out).size;
    if (size <= LIMIT || q <= 40) {
      console.log(`${slug}: ${(size / 1024).toFixed(1)} KB, q${q}`);
      break;
    }
    q -= 6;
  }
}

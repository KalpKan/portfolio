/**
 * Project tile covers (2026-11-18). Every tile in the Projects window shows a
 * picture of the project: a 480 x 360 WebP rendition under /images/covers/
 * (made by scripts/tile-covers.mjs from the registry hero, the case study's own
 * photo, a simulation plot or a fresh landing-page screenshot).
 */
export const COVER_W = 480;
export const COVER_H = 360;

/** Slugs whose cover is a raster rendition at /images/covers/<slug>.webp. */
export const RASTER_COVERS = new Set([
  "promptflip",
  "basketball",
  "plato",
  "plantit",
  "pushups",
  "emotes",
  "microtubules",
  "sift",
  "unpark",
  "rc-car",
  "porsche-pcb-keychain",
  "eeg",
]);

export type Cover = { kind: "image"; src: string };

export function coverFor(slug: string): Cover | null {
  return RASTER_COVERS.has(slug) ? { kind: "image", src: `/images/covers/${slug}.webp` } : null;
}

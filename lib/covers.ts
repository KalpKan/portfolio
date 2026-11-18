/**
 * Project tile covers (2026-11-18). Every tile in the Projects window shows a
 * picture of the project: a 480 x 360 WebP rendition under /images/covers/
 * (made by scripts/tile-covers.mjs from the registry hero, the case study's own
 * photo, or a fresh landing-page screenshot), or, for a project with nothing to
 * photograph yet, a drawn cover (components/kalpos/CoverArt.tsx).
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
]);

/** Slugs with a drawn SVG cover instead (nothing to photograph yet). */
export const DRAWN_COVERS = { flashcards: "cards", eeg: "eeg" } as const;
export type DrawnCover = (typeof DRAWN_COVERS)[keyof typeof DRAWN_COVERS];

export type Cover = { kind: "image"; src: string } | { kind: "drawn"; id: DrawnCover };

export function coverFor(slug: string): Cover | null {
  if (RASTER_COVERS.has(slug)) return { kind: "image", src: `/images/covers/${slug}.webp` };
  const id = (DRAWN_COVERS as Record<string, DrawnCover>)[slug];
  return id ? { kind: "drawn", id } : null;
}

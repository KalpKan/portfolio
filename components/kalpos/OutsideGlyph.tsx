import { OUTSIDE_GLYPH_IDS, type OutsideGlyphId } from "@/lib/outside";

/*
 * The Outside class window's marks (2026-11-18): original 26 x 26 line drawings
 * in the ResearchGlyph / HobbyGlyph idiom (stroke, currentColor, no emoji) on
 * the same chip (.kos-research-glyph). Unknown or missing id draws the neutral mark.
 *
 * dna:         a double helix with rungs (iGEM).
 * ribbon:      an awareness ribbon with crossed tails (Parkinson's club).
 * chess:       a knight's head on a base.
 * heart-hand:  a heart held in an open hand (hospice).
 * hospital:    a building with a cross over the door.
 * chalkboard:  a board on a tray with a chalk line and a sum.
 * pencil-book: an open book with a pencil laid across it.
 * neutral:     a plain rounded square with a dot.
 */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function isOutsideGlyph(id: string | undefined): id is OutsideGlyphId {
  return !!id && (OUTSIDE_GLYPH_IDS as readonly string[]).includes(id) && id !== "neutral";
}

function Drawing({ id }: { id: OutsideGlyphId }) {
  switch (id) {
    case "dna":
      return (
        <>
          <path d="M7.5 2.6 C7.5 9 18.5 9.6 18.5 13 C18.5 16.4 7.5 17 7.5 23.4" {...S} />
          <path d="M18.5 2.6 C18.5 9 7.5 9.6 7.5 13 C7.5 16.4 18.5 17 18.5 23.4" {...S} />
          <path d="M9.4 5.6 H16.6 M9.4 20.4 H16.6" {...S} strokeWidth={1.4} opacity={0.6} />
          <path d="M10.2 10.6 H15.8 M10.2 15.4 H15.8" {...S} strokeWidth={1.4} opacity={0.6} />
        </>
      );
    case "ribbon":
      return (
        <>
          <path d="M13 3 C8.4 3 6.6 6.4 7.6 9.4 C8.6 12.2 11.4 13.6 13 13.6 C14.6 13.6 17.4 12.2 18.4 9.4 C19.4 6.4 17.6 3 13 3 Z" {...S} />
          <path d="M10.4 12.4 L6.8 23 L10.6 20.6 L12.6 23.4 L13 14" {...S} />
          <path d="M15.6 12.4 L19.2 23 L15.4 20.6" {...S} />
        </>
      );
    case "chess":
      return (
        <>
          <path d="M6 23 H20 M7.4 20 H18.6" {...S} />
          <path d="M8.2 20 C8.6 15.6 12.6 14.4 12.4 11 C10.4 11.6 9 12.6 7.4 14.2 L4.6 12.6 C6.2 8.6 8.2 5 13.4 3.6 L14.6 5.4 C19 6 20.6 11 19.2 15.4 C18.8 17 18.4 18.6 18.6 20" {...S} />
          <circle cx="12.6" cy="8.2" r="1" fill="currentColor" />
        </>
      );
    case "heart-hand":
      return (
        <>
          <path d="M13 12.6 C8.6 9.6 8.6 5 11 4.4 C12.2 4.1 12.9 4.9 13 5.6 C13.1 4.9 13.8 4.1 15 4.4 C17.4 5 17.4 9.6 13 12.6 Z" {...S} strokeWidth={1.6} />
          <path d="M2.8 15.6 H6.4 L10 17 H15 C16.2 17 16.4 18.6 15 18.8 L11.6 18.8" {...S} />
          <path d="M6.4 15.6 V22 H9.4 L17.6 19.4 L23 15.2 C23.4 14.4 22.4 13.4 21.4 14 L17.4 16.6" {...S} />
        </>
      );
    case "hospital":
      return (
        <>
          <path d="M4 23 V8.4 L13 4 L22 8.4 V23 Z" {...S} />
          <path d="M13 9 V15 M10 12 H16" {...S} strokeWidth={2} />
          <path d="M10.6 23 V19.4 a2.4 2.4 0 0 1 4.8 0 V23" {...S} strokeWidth={1.5} />
        </>
      );
    case "chalkboard":
      return (
        <>
          <rect x="3" y="4" width="20" height="14" rx="1.8" {...S} />
          <path d="M6.6 9 H12 M6.6 12.4 H9" {...S} strokeWidth={1.4} opacity={0.7} />
          <path d="M14.4 9.4 L16.6 12.6 L19.4 8.6" {...S} strokeWidth={1.5} />
          <path d="M2.4 21.4 H23.6 M9 21.4 V19 M13 21.4 V19.4" {...S} strokeWidth={1.5} />
        </>
      );
    case "pencil-book":
      return (
        <>
          <path d="M2.8 6 C6.4 5.2 10.4 5.4 13 7.6 C15.6 5.4 19.6 5.2 23.2 6 V19.6 C19.6 18.8 15.6 19 13 21 C10.4 19 6.4 18.8 2.8 19.6 Z" {...S} />
          <path d="M13 7.6 V21" {...S} strokeWidth={1.4} opacity={0.6} />
          <path d="M17.6 15.2 L22.6 3.6 L24.4 4.4 L19.6 16 Z" {...S} strokeWidth={1.4} fill="var(--card)" />
        </>
      );
    case "neutral":
      return (
        <>
          <rect x="4.6" y="4.6" width="16.8" height="16.8" rx="5" {...S} />
          <circle cx="13" cy="13" r="2" fill="currentColor" />
        </>
      );
  }
}

/** One entry's chip. Unknown or missing ids draw the neutral mark. */
export default function OutsideGlyph({ id }: { id?: string }) {
  const drawing: OutsideGlyphId = isOutsideGlyph(id) ? id : "neutral";
  return (
    <span className="kos-research-glyph" data-glyph={drawing} aria-hidden>
      <svg viewBox="0 0 26 26" width="28" height="28" focusable="false">
        <Drawing id={drawing} />
      </svg>
    </span>
  );
}

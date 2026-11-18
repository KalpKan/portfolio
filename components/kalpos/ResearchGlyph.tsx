import { RESEARCH_GLYPH_IDS, type ResearchGlyphId } from "@/lib/research";

/*
 * The Research window's marks (2026-11-18): original 26 x 26 line drawings in
 * the HobbyGlyph idiom (stroke icons, currentColor, no emoji, no borrowed
 * asset) on a chip. An unknown or missing id draws the neutral document.
 *
 * brain:          two cerebral lobes with the cerebellum drawn in, for the ataxia review.
 * mri-lead:       a scanner bore seen end-on with a DBS lead and its contacts crossing it.
 * mri-electrode:  the same bore with a straight depth electrode entering from the side.
 * molecule:       a protein ring with a ligand docked on it and a small bond to it.
 * ultrasound:     a transducer arc whose beams converge to a focal point.
 * molecule-chain: two ring heads joined by a flexible linker (a PROTAC's shape).
 * document:       a page with a folded corner and three lines.
 */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function isResearchGlyph(id: string | undefined): id is ResearchGlyphId {
  return !!id && (RESEARCH_GLYPH_IDS as readonly string[]).includes(id) && id !== "document";
}

function Drawing({ id }: { id: ResearchGlyphId }) {
  switch (id) {
    case "brain":
      return (
        <>
          <path d="M13 3.4 C8 2.4 3.6 5.6 3.8 10 C2.4 11.6 2.6 14.2 4.4 15.4 C4.6 18 6.8 19.4 9 18.6" {...S} />
          <path d="M13 3.4 C18 2.4 22.4 5.6 22.2 10 C23.6 11.6 23.4 14.2 21.6 15.4 C21.4 18 19.2 19.4 17 18.6" {...S} />
          <path d="M13 3.6 V13" {...S} strokeWidth={1.4} opacity={0.55} />
          <path d="M9 18.6 q4 2.6 8 0 M10.4 21.8 q2.6 1.4 5.2 0" {...S} strokeWidth={1.5} />
        </>
      );
    case "mri-lead":
      return (
        <>
          <circle cx="13" cy="13" r="10" {...S} />
          <circle cx="13" cy="13" r="6.4" {...S} strokeWidth={1.3} opacity={0.55} />
          <path d="M13 2.8 V10.6" {...S} />
          <circle cx="13" cy="12.6" r="1.1" fill="currentColor" />
          <circle cx="13" cy="15.4" r="1.1" fill="currentColor" />
          <circle cx="13" cy="18.2" r="1.1" fill="currentColor" />
        </>
      );
    case "mri-electrode":
      return (
        <>
          <circle cx="13" cy="13" r="10" {...S} />
          <circle cx="13" cy="13" r="6.4" {...S} strokeWidth={1.3} opacity={0.55} />
          <path d="M1.6 13 H14.2" {...S} />
          <path d="M16 13 h1 M18.8 13 h1" {...S} strokeWidth={2.6} />
        </>
      );
    case "molecule":
      return (
        <>
          <path d="M8.6 4.2 L14.2 5.4 L16.6 10.4 L12.8 14.6 L7.2 13.4 L4.8 8.6 Z" {...S} />
          <circle cx="8.6" cy="4.2" r="1.5" fill="currentColor" />
          <circle cx="16.6" cy="10.4" r="1.5" fill="currentColor" />
          <circle cx="7.2" cy="13.4" r="1.5" fill="currentColor" />
          <path d="M16.6 10.4 L20.4 16.4" {...S} strokeWidth={1.5} />
          <circle cx="21" cy="19.6" r="3" {...S} strokeWidth={1.5} />
        </>
      );
    case "ultrasound":
      return (
        <>
          <path d="M3.2 4.6 Q13 -0.4 22.8 4.6" {...S} />
          <path d="M6 5.4 L13 18.6 M13 6 V18.6 M20 5.4 L13 18.6" {...S} strokeWidth={1.4} opacity={0.7} />
          <circle cx="13" cy="19.4" r="2" fill="currentColor" />
          <circle cx="13" cy="19.4" r="4.4" {...S} strokeWidth={1.2} opacity={0.4} />
        </>
      );
    case "molecule-chain":
      return (
        <>
          <path d="M6.4 6.2 L9.2 7.8 V11 L6.4 12.6 L3.6 11 V7.8 Z" {...S} strokeWidth={1.6} />
          <path d="M19.6 13.4 L22.4 15 V18.2 L19.6 19.8 L16.8 18.2 V15 Z" {...S} strokeWidth={1.6} />
          <path d="M9.2 9.4 C12 9.4 11.4 13 13 13 C14.6 13 14 16.6 16.8 16.6" {...S} />
          <circle cx="13" cy="13" r="1.3" fill="currentColor" />
        </>
      );
    case "document":
      return (
        <>
          <path d="M6 2.8 H15 L20.4 8.2 V22.4 a1 1 0 0 1 -1 1 H6 a1 1 0 0 1 -1 -1 V3.8 a1 1 0 0 1 1 -1 Z" {...S} />
          <path d="M15 2.8 V8.2 H20.4" {...S} strokeWidth={1.5} />
          <path d="M8.6 13 H17 M8.6 16.4 H17 M8.6 19.6 H13.4" {...S} strokeWidth={1.4} opacity={0.6} />
        </>
      );
  }
}

/** One entry's chip. Unknown or missing ids draw the neutral document. */
export default function ResearchGlyph({ id }: { id?: string }) {
  const drawing: ResearchGlyphId = isResearchGlyph(id) ? id : "document";
  return (
    <span className="kos-research-glyph" data-glyph={drawing} aria-hidden>
      <svg viewBox="0 0 26 26" width="28" height="28" focusable="false">
        <Drawing id={drawing} />
      </svg>
    </span>
  );
}

import type { HobbyGlyphId } from "@/lib/site";

/*
 * The Hobbies list's mini-glyphs (2026-09-21, "start populating hobbies"):
 * one original line drawing per hobby, never an emoji and never a borrowed
 * asset. Each is a 26 × 26 stroke drawing on a 34 px chip (the CSS class
 * .kos-hobby-glyph), in the desk's cyan over the pad grey, so the list reads
 * as one family with the Trash basket and the Contact envelope: drawn, not
 * iconography from a set.
 *
 * Swimming: a head over a windmilling arm with two water lines under it.
 * Tennis:   a strung racket at an angle with the ball leaving it.
 * Sim racing: a wheel seen head-on, flat-bottomed, with a hub and three spokes.
 * Clash Royale: a crown of three points on a band (the trophy road's mark,
 *               drawn here from scratch: no Supercell art is used).
 * Reselling: a price tag with its eyelet and a fold, hanging from a thread.
 */

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Drawing({ id }: { id: HobbyGlyphId }) {
  switch (id) {
    case "swimming":
      return (
        <>
          <circle cx="8.6" cy="7.4" r="2.9" fill="currentColor" />
          <path d="M3.4 16.2 L9.6 12.4 L14.2 14.6 L19.4 9.2" {...S} />
          <path d="M2.4 20.2 q3 -1.9 6 0 t6 0 t6 0" {...S} strokeWidth={1.6} />
          <path d="M2.4 23.8 q3 -1.9 6 0 t6 0 t6 0" {...S} strokeWidth={1.4} opacity={0.55} />
        </>
      );
    case "tennis":
      return (
        <>
          {/* head and strings share the rotation, so no string runs outside the frame */}
          <g transform="rotate(-34 10.6 10.2)">
            <ellipse cx="10.6" cy="10.2" rx="6.3" ry="7.4" {...S} />
            <path d="M10.6 3.4 v13.6 M4.5 10.2 h12.2" {...S} strokeWidth={1} opacity={0.55} />
          </g>
          {/* the throat and handle continue along the head's long axis */}
          <path d="M14.8 16.4 L19.3 23" {...S} />
          <circle cx="20.7" cy="7.2" r="2.5" {...S} strokeWidth={1.5} />
        </>
      );
    case "sim-racing":
      return (
        <>
          <path d="M13 2.6 a10.4 10.4 0 1 1 -0.001 0 Z" {...S} />
          <path d="M3.2 10.4 h19.6" {...S} strokeWidth={1.5} />
          <circle cx="13" cy="13.6" r="2.6" {...S} strokeWidth={1.5} />
          <path d="M13 16.2 v6.8 M10.5 11 L5.4 7.2 M15.5 11 L20.6 7.2" {...S} strokeWidth={1.5} />
        </>
      );
    case "clash-royale":
      return (
        <>
          <path d="M3.6 18.4 L2.4 6.6 L8 11.4 L13 4.4 L18 11.4 L23.6 6.6 L22.4 18.4 Z" {...S} />
          <path d="M4.4 21.8 h17.2" {...S} />
          <circle cx="13" cy="14.2" r="1.5" fill="currentColor" />
        </>
      );
    case "reselling":
      return (
        <>
          <path d="M12.4 2.8 L23.2 13.6 a2.2 2.2 0 0 1 0 3.1 l-6.5 6.5 a2.2 2.2 0 0 1 -3.1 0 L2.8 12.4 V4.6 a1.8 1.8 0 0 1 1.8 -1.8 Z" {...S} />
          <circle cx="8.2" cy="8.2" r="2.1" {...S} strokeWidth={1.5} />
          <path d="M13.8 17.4 L17.8 13.4" {...S} strokeWidth={1.4} opacity={0.6} />
        </>
      );
  }
}

/** One hobby's chip: the drawing on the pad-grey rounded square. */
export default function HobbyGlyph({ id }: { id: HobbyGlyphId }) {
  return (
    <span className="kos-hobby-glyph" aria-hidden>
      <svg viewBox="0 0 26 26" width="26" height="26" focusable="false">
        <Drawing id={id} />
      </svg>
    </span>
  );
}

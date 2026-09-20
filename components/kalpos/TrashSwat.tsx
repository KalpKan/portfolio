"use client";

import type { Rect } from "@/lib/windows";
import type { SwatPhase } from "@/lib/swat";
import { SWAT_TOAST } from "@/lib/swat";

/*
 * The Trash swat's own drawings (lib/swat.ts runs the beats, Desk.tsx wires
 * them): the paper-crumple SVG filter the held icon takes on over the trash
 * (feTurbulence noise through feDisplacementMap, a little stronger than a
 * fold), the hand that pops out of the basket and swats the icon back, and
 * the one-line toast under the trash. The hand is an original cartoon: an
 * open palm with four fingers and a thumb, a sleeve cuff, drawn in the
 * desk's warm greys with a cyan cuff so it reads as KalpOS's, not a
 * platform glyph and never an emoji. It rises out of a slot clipped at the
 * basket's rim (the slot's top is the rim line) so the wrist is never seen
 * below the opening.
 */

export function CrumpleFilter() {
  return (
    <svg className="kos-defs" width="0" height="0" aria-hidden focusable="false">
      <defs>
        <filter id="kos-crumple" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.09" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/** An open palm, fingers up and spread, a thumb out to the left, a cuff. 64 × 84 viewBox; the wrist runs off the bottom. */
export function HandGlyph() {
  const skin = { fill: "#f4e2d0", stroke: "#b98f74", strokeWidth: 1.8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 64 84" width="52" height="68" aria-hidden focusable="false">
      {/* cuff */}
      <rect x="15" y="67" width="34" height="17" rx="4" fill="#0088b0" />
      <rect x="15" y="67" width="34" height="5" rx="2" fill="#ffffff" fillOpacity="0.55" />
      {/* fingers (drawn first: the palm covers their roots) */}
      <path d="M19 40 L19 12 A4.5 4.5 0 0 1 28 12 L28 40 Z" {...skin} />
      <path d="M29.5 38 L29.5 6 A4.5 4.5 0 0 1 38.5 6 L38.5 38 Z" {...skin} />
      <path d="M40 40 L40 10 A4.5 4.5 0 0 1 49 10 L49 40 Z" {...skin} />
      <path d="M50 44 L50 20 A4 4 0 0 1 58 20 L58 44 Z" {...skin} />
      {/* thumb, out to the left and a little up */}
      <path d="M21 50 C13 46 5 48 4 55 C3 61 9 65 17 64 L22 63" {...skin} />
      {/* palm + wrist */}
      <path d="M19 38 C19 34 22 32 27 32 L52 32 C56 32 58 36 58 44 L58 58 C58 66 52 71 43 71 L22 71 C20 71 19 69 19 66 Z" {...skin} />
      {/* creases */}
      <path d="M27 48 C33 54 43 56 52 52 M26 58 C32 62 40 63 47 61" fill="none" stroke="#d3ad92" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The hand at the basket and the toast under it. `phase` "swatted" pops the
 * hand out (data-hand="out": rise, then the flick); "home" withdraws it.
 */
export function TrashSwat({ phase, bin, toast }: { phase: SwatPhase; bin: Rect | null; toast: Rect | null }) {
  const showHand = bin && (phase === "swatted" || phase === "home");
  return (
    <>
      {showHand ? (
        <div
          className="kos-hand-slot"
          style={{ left: bin.x + bin.w / 2 - 26, top: bin.y + bin.h * 0.2 - 74, width: 52, height: 74 }}
          aria-hidden
        >
          <div className="kos-hand" data-hand={phase === "swatted" ? "out" : "in"}>
            <HandGlyph />
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="kos-toast" role="status" style={{ left: toast.x + toast.w / 2, top: toast.y + toast.h + 10 }}>
          {SWAT_TOAST}
        </div>
      ) : null}
    </>
  );
}

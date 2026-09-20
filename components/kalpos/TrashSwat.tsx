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

/** An open palm, fingers up, with a cuff. 64 × 84 viewBox; the wrist runs off the bottom. */
export function HandGlyph() {
  return (
    <svg viewBox="0 0 64 84" width="48" height="63" aria-hidden focusable="false">
      {/* cuff */}
      <rect x="14" y="66" width="36" height="18" rx="4" fill="#0088b0" />
      <rect x="14" y="66" width="36" height="5" rx="2" fill="#ffffff" fillOpacity="0.55" />
      {/* wrist + palm */}
      <path
        d="M20 70 L20 44 C20 36 24 32 30 32 L44 32 C50 32 54 36 54 44 L54 58 C54 66 48 71 40 71 Z"
        fill="#f4e6d8"
        stroke="#c9a88e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* four fingers */}
      <rect x="21" y="8" width="8" height="30" rx="4" fill="#f4e6d8" stroke="#c9a88e" strokeWidth="1.6" />
      <rect x="30" y="2" width="8" height="36" rx="4" fill="#f4e6d8" stroke="#c9a88e" strokeWidth="1.6" />
      <rect x="39" y="5" width="8" height="33" rx="4" fill="#f4e6d8" stroke="#c9a88e" strokeWidth="1.6" />
      <rect x="47.5" y="14" width="7.5" height="26" rx="3.75" fill="#f4e6d8" stroke="#c9a88e" strokeWidth="1.6" />
      {/* thumb, out to the left */}
      <path d="M21 46 C14 44 8 48 8 54 C8 59 12 62 18 62 L22 62" fill="#f4e6d8" stroke="#c9a88e" strokeWidth="1.6" strokeLinejoin="round" />
      {/* palm creases */}
      <path d="M27 50 C31 56 39 58 47 54 M25 58 C30 61 36 62 42 61" fill="none" stroke="#d9b9a1" strokeWidth="1.2" strokeLinecap="round" />
      {/* the palm's front edge over the finger roots */}
      <path d="M21 38 C28 42 44 42 54 40" fill="none" stroke="#c9a88e" strokeWidth="1.2" strokeLinecap="round" />
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
          style={{ left: bin.x + bin.w / 2 - 24, top: bin.y + bin.h * 0.2 - 70, width: 48, height: 70 }}
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

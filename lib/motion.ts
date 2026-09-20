/**
 * Card 2e: "Everything is one spring". One curve for all geometry; opacity
 * and blur use a plain ease. The CSS in app/kalpos.css carries the same
 * numbers; these are the JS timers that must agree with them.
 */
export const EASE = "cubic-bezier(.2,.8,.2,1)";

export const MS = {
  /** Dots pop in 120 ms apart while typing (3b). */
  dotStagger: 120,
  /** The field pulses once to confirm (3b, `ok` keyframes). */
  pulse: 400,
  /** Lock blurs out / desk breathes in: the longest of the 3c transitions (transform .9s). */
  unlock: 900,
  /** Returning visitor / reduced motion: a 400 ms crossfade to the desk. */
  crossfade: 400,
  /** Lock Screen: the unlock in reverse, the desk blurs out and scales to 1.06 (CSS agrees). */
  lock: 320,
  /** Restart: fade to black, then the boot replays. */
  restart: 300,
  /** The KalpOS menu drops in. */
  menu: 140,
  /** Menubar drops in, dock rises last, icons pop 40 ms apart (2a/2e). */
  iconStagger: 40,
  /** A window grows from its icon or tile (FLIP). */
  open: 380,
  /** Close is in place, like macOS: scale 1 → .96, opacity 1 → 0, then the unmount. */
  winClose: 160,
  /** Minimise travels into the window's own dock tile (its own keyframes: never the open ones reversed). */
  minimize: 320,
  focus: 180,
  /** The phone sheet slides (CSS transition on --sheet-y); a close slides it off first, then the Projects sheet peeks back. */
  sheet: 380,
  dock: 160,
  trace: 1600,
  trash: 220,
} as const;

export function reducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

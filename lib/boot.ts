import type { Signal } from "./signal";

/**
 * The boot before the lock, in the macOS idiom (Kalp, 2026-09-20: "make the
 * starting-up animation look more like macOS", "make the chime play on the
 * starting-up animation"). A Mac starts from its power button, and a browser
 * will not start audio before a gesture, so a fresh visit first shows pure
 * black with a faint power glyph and "press any key to start"; the key (or
 * click, or tap) creates the AudioContext, plays the chime inside that
 * gesture, and starts the boot: the KK mark fades in as a solid white
 * silhouette (400 ms), a thin rounded bar appears 300 ms later and fills
 * with real readiness (one step for the registry, one per health check the
 * desk runs on load), holds 250 ms at 100 %, and the whole layer fades to the
 * lock over 600 ms. A Restart (KalpOS menu, terminal `reboot`) already had
 * its gesture: no power screen, the chime sounds at once.
 *
 * Visit policy (2026-09-20): a plain visit to "/" always boots and locks.
 * Only a deep link (/projects/<slug>) or ?desk goes straight to the desk,
 * so shared links land on their content. There is no localStorage skip.
 */

/** The logo's fade-in, from the power button. */
export const BOOT_LOGO_MS = 400;
/** The bar appears this long after the logo has faded in. */
export const BOOT_BAR_DELAY_MS = 300;
/** The bar is visible at least this long; below it the fill is not readable. */
export const BOOT_BAR_MIN_MS = 1400;
/** The boot never ends sooner than this after the power button (logo + delay + bar). */
export const BOOT_MIN_MS = BOOT_LOGO_MS + BOOT_BAR_DELAY_MS + BOOT_BAR_MIN_MS;
/** A slow health endpoint must not hold the site: the boot ends here regardless. */
export const BOOT_MAX_MS = 4000;
/** The bar rests at 100 % before the layer leaves. */
export const BOOT_HOLD_MS = 250;
/** The boot layer fades while the lock's date and clock fade up (CSS agrees). */
export const BOOT_EXIT_MS = 600;
/** One readiness step of the bar: `cubic-bezier(.4,0,.2,1)` over this long (CSS agrees). */
export const BOOT_STEP_MS = 400;
/** Reduced motion: logo and full bar, static, for this long, then a 400 ms crossfade. */
export const BOOT_REDUCED_HOLD_MS = 800;

export function bootProgress(signals: Record<string, Signal>, hydrated: boolean): number {
  const checks = Object.values(signals).filter((s) => s !== "none");
  const answered = checks.filter((s) => s !== "checking").length;
  const steps = 1 + checks.length;
  return ((hydrated ? 1 : 0) + answered) / steps;
}

/** What the bar draws: the highest readiness seen so far, in 0..1. It never moves backwards. */
export function bootFill(shown: number, progress: number): number {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.max(shown, p);
}

/**
 * How long the fill takes to reach `fill`. Ordinary steps take BOOT_STEP_MS;
 * the step to 100 % is one glide of BOOT_BAR_MIN_MS, so the bar is seen
 * filling for at least that long and arrives at the end exactly as the boot
 * ends (health checks usually answer before the bar is even shown).
 */
export function fillDuration(fill: number): number {
  return fill >= 1 ? BOOT_BAR_MIN_MS : BOOT_STEP_MS;
}

/**
 * Whether the boot may end. `elapsed` counts from the power button;
 * `fullFor` is how long the bar has been gliding to 100 % (null while
 * readiness is still short of it; the glide cannot start before the bar is
 * shown, so BOOT_MIN_MS is implied).
 */
export function bootDone({ elapsed, fullFor, reduced = false }: { elapsed: number; fullFor: number | null; reduced?: boolean }): boolean {
  if (reduced) return elapsed >= BOOT_REDUCED_HOLD_MS;
  if (elapsed >= BOOT_MAX_MS) return true;
  return fullFor !== null && fullFor >= BOOT_BAR_MIN_MS;
}

/** Keys that are not "any key": a lone modifier, or Escape (which browsers do not count as a gesture either). */
const NOT_A_KEY = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Escape", "Fn", "FnLock", "Dead", "Unidentified", "NumLock", "ScrollLock", "Hyper", "Super", "Symbol", "AltGraph"]);
/** Events browsers count as a user activation (audio may start inside them). */
const POWER_EVENTS = new Set(["click", "mousedown", "touchend", "pointerup"]);

/**
 * Whether a DOM event on the power screen is the power button. A ⌘ or Ctrl
 * chord is the browser's (⌘L, ⌘R, ⌘T…) and is left alone, never counted.
 */
export function startsBoot(e: { type: string; key?: string; metaKey?: boolean; ctrlKey?: boolean }): boolean {
  if (e.type === "keydown") return !e.metaKey && !e.ctrlKey && !NOT_A_KEY.has(e.key ?? "Unidentified");
  return POWER_EVENTS.has(e.type);
}

const DESK_QUERY = /(^|[?&])desk(=|&|$)/;

export function wantsDesk({ pathname, search }: { pathname: string; search: string }): boolean {
  return pathname.startsWith("/projects/") || DESK_QUERY.test(search);
}

/**
 * Runs in <head> before the first paint (app/layout.tsx): a deep link or
 * ?desk gets the desk with no flash of the boot or the lock. It also drops
 * the retired kalpos:visited flag. Everything is guarded: storage may be
 * missing or throw, and a failure just means the normal boot.
 */
export const BOOT_SCRIPT =
  `try{localStorage.removeItem("kalpos:visited")}catch(e){}` +
  `try{if(location.pathname.indexOf("/projects/")===0||${DESK_QUERY.toString()}` +
  `.test(location.search))document.documentElement.setAttribute("data-kos-boot","desk")}catch(e){}`;

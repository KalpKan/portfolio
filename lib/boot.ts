import type { Signal } from "./signal";

/**
 * The boot before the lock (cards 2a + 3b "Try next"): the KK mark resolves
 * from a 16 px blur on black while one hairline fills with real readiness,
 * then the lock screen fades in. Readiness has one step for the registry
 * (the desk is hydrated) and one per health check the desk runs on load.
 *
 * Visit policy (2026-09-20): a plain visit to "/" always boots and locks.
 * Only a deep link (/projects/<slug>) or ?desk goes straight to the desk,
 * so shared links land on their content. There is no localStorage skip.
 */

/** Below this the hairline is not legible; the boot never ends sooner. */
export const BOOT_MIN_MS = 900;
/** A slow health endpoint must not hold the site: the boot ends here regardless. */
export const BOOT_MAX_MS = 3000;
/** The mark blurs out and the boot layer fades while the lock fades in (CSS agrees). */
export const BOOT_EXIT_MS = 600;

export function bootProgress(signals: Record<string, Signal>, hydrated: boolean): number {
  const checks = Object.values(signals).filter((s) => s !== "none");
  const answered = checks.filter((s) => s !== "checking").length;
  const steps = 1 + checks.length;
  return ((hydrated ? 1 : 0) + answered) / steps;
}

export function bootDone({ elapsed, progress, reduced = false }: { elapsed: number; progress: number; reduced?: boolean }): boolean {
  if (reduced) return true;
  if (elapsed >= BOOT_MAX_MS) return true;
  return progress >= 1 && elapsed >= BOOT_MIN_MS;
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

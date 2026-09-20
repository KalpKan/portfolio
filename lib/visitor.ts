/**
 * Returning-visitor flag (spec: "Returning visitors (localStorage) skip the
 * lock and get a 400 ms crossfade to the desk"). Storage may be missing or
 * throw (private mode, blocked site data), so every access is guarded and a
 * failure just means "first visit".
 */
export const VISITED_KEY = "kalpos:visited";

function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function hasVisited(storage: Storage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(VISITED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markVisited(storage: Storage | null = defaultStorage()): void {
  try {
    storage?.setItem(VISITED_KEY, "1");
  } catch {
    // private mode: the lock will simply show again next time
  }
}

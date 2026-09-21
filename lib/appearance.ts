/**
 * Appearance (T6.10, Kalp 2026-09-21: "implement a dark mode to the portfolio
 * website"). KalpOS gets the macOS System Settings idiom: Light, Dark, or
 * Auto (follow the machine). This module is the whole state machine; the
 * colours themselves live in app/globals.css as tokens.
 *
 * How it reaches the page:
 *
 *   <html data-appearance="light | dark | auto">
 *
 * is written by APPEARANCE_SCRIPT while the HTML is parsed, before the first
 * paint, so a dark visitor never sees a white flash (Next's "preventing flash
 * before hydration"). The attribute carries the *choice*, not the resolved
 * value: `auto` is resolved by CSS through `prefers-color-scheme`, so the desk
 * follows the machine live, with no listener and no re-render.
 *
 * The script also sets `color-scheme` on the same element, which is what makes
 * the scrollbars, form controls and the page's own canvas dark. globals.css
 * sets it too; the inline copy exists so it is right for the very first paint.
 *
 * Nothing here throws: localStorage is missing in private mode and in some
 * embedded browsers, and a failure just means the default appearance.
 */

import { reducedMotion } from "./motion";

export const APPEARANCE_KEY = "kalpos:appearance";

export const APPEARANCES = ["light", "dark", "auto"] as const;
export type Appearance = (typeof APPEARANCES)[number];

/**
 * What a visitor with nothing stored gets.
 *
 * Light, deliberately (overnight supervisor ruling 2026-09-21, logged in
 * docs/overnight-supervisor-log.md): Kalp asked for a dark mode, which adds a
 * capability; he did not ask to change what visitors see, and he has never
 * seen the dark desk. Dark and Auto are one click away in the KalpOS menu and
 * are remembered. Flipping this single constant to "auto" makes the desk
 * follow the visitor's machine; STATUS.md "Needs Kalp" asks him to decide.
 */
export const DEFAULT_APPEARANCE: Appearance = "light";

/** The attribute the pre-paint script writes and the CSS reads. */
export const APPEARANCE_ATTR = "data-appearance";

/** Human labels for the menu row, in menu order. */
export const APPEARANCE_LABELS: Record<Appearance, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function isAppearance(value: unknown): value is Appearance {
  return typeof value === "string" && (APPEARANCES as readonly string[]).includes(value);
}

/** What `appearance` actually paints as, given the machine's preference. */
export function resolveAppearance(appearance: Appearance, prefersDark: boolean): "light" | "dark" {
  if (appearance === "auto") return prefersDark ? "dark" : "light";
  return appearance;
}

/** The `color-scheme` value for a choice: `auto` defers to the machine. */
export function colorScheme(appearance: Appearance): string {
  if (appearance === "auto") return "light dark";
  return appearance;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The stored choice, or the default. Never throws. */
export function readAppearance(): Appearance {
  try {
    const raw = storage()?.getItem(APPEARANCE_KEY);
    return isAppearance(raw) ? raw : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

/** Write the attribute and `color-scheme` onto a document element. */
export function applyAppearance(appearance: Appearance, root?: HTMLElement | null): void {
  const el = root ?? (typeof document === "undefined" ? null : document.documentElement);
  if (!el) return;
  el.setAttribute(APPEARANCE_ATTR, appearance);
  el.style.colorScheme = colorScheme(appearance);
}

const listeners = new Set<() => void>();

/**
 * Choose an appearance: persisted, applied to <html>, and announced to every
 * subscriber. The default is stored like any other choice so that flipping
 * DEFAULT_APPEARANCE later never silently moves a visitor who picked it.
 */
export function setAppearance(appearance: Appearance): void {
  try {
    storage()?.setItem(APPEARANCE_KEY, appearance);
  } catch {
    // private mode: the choice still applies to this page through the listeners
  }
  applyAppearance(appearance);
  listeners.forEach((l) => l());
}

/** The crossfade on an appearance change (globals.css agrees; DESIGN.md "Motion"). */
export const APPEARANCE_SHIFT_MS = 160;
export const APPEARANCE_SHIFT_CLASS = "kos-appearance-shift";

let shiftTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Choose an appearance and let the desk cross-fade into it over 160 ms: the
 * class carries one transition list for every painted property in the chrome
 * (globals.css), and is taken off again when it is over so nothing else the
 * desk animates is slowed down. Under reduced motion the swap is instant.
 */
export function setAppearanceWithCrossfade(appearance: Appearance, reduced = reducedMotion()): void {
  const el = typeof document === "undefined" ? null : document.documentElement;
  if (el && !reduced) {
    el.classList.add(APPEARANCE_SHIFT_CLASS);
    if (shiftTimer) clearTimeout(shiftTimer);
    shiftTimer = setTimeout(() => {
      el.classList.remove(APPEARANCE_SHIFT_CLASS);
      shiftTimer = null;
    }, APPEARANCE_SHIFT_MS);
  }
  setAppearance(appearance);
}

export function subscribeAppearance(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Whether the machine asks for dark right now (used only where JS must know). */
export function prefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

/**
 * Runs in <head> before the first paint (app/layout.tsx), beside BOOT_SCRIPT.
 * Kept to one guarded statement with no dependencies: it is inlined into every
 * HTML response, so every byte is paid for on every visit.
 */
export const APPEARANCE_SCRIPT =
  `try{var a=localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)});` +
  `if(${JSON.stringify(APPEARANCES)}.indexOf(a)<0)a=${JSON.stringify(DEFAULT_APPEARANCE)};` +
  `var e=document.documentElement;` +
  `e.setAttribute(${JSON.stringify(APPEARANCE_ATTR)},a);` +
  `e.style.colorScheme=a==="auto"?"light dark":a}` +
  `catch(e){document.documentElement.setAttribute(${JSON.stringify(APPEARANCE_ATTR)},${JSON.stringify(DEFAULT_APPEARANCE)})}`;

export function _resetAppearanceForTests(): void {
  listeners.clear();
  if (shiftTimer) clearTimeout(shiftTimer);
  shiftTimer = null;
}

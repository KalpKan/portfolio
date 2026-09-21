import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  APPEARANCE_ATTR,
  APPEARANCE_KEY,
  APPEARANCE_LABELS,
  APPEARANCE_SCRIPT,
  APPEARANCE_SHIFT_CLASS,
  APPEARANCE_SHIFT_MS,
  APPEARANCES,
  applyAppearance,
  colorScheme,
  DEFAULT_APPEARANCE,
  isAppearance,
  readAppearance,
  resolveAppearance,
  setAppearance,
  setAppearanceWithCrossfade,
  subscribeAppearance,
  _resetAppearanceForTests,
} from "./appearance";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute(APPEARANCE_ATTR);
  document.documentElement.style.colorScheme = "";
  document.documentElement.classList.remove(APPEARANCE_SHIFT_CLASS);
  _resetAppearanceForTests();
});

describe("the appearance choice", () => {
  it("is one of exactly three, and defaults to light so no visitor's site changes under them", () => {
    expect(APPEARANCES).toEqual(["light", "dark", "auto"]);
    expect(DEFAULT_APPEARANCE).toBe("light");
    expect(Object.values(APPEARANCE_LABELS)).toEqual(["Light", "Dark", "Auto"]);
    expect(isAppearance("dark")).toBe(true);
    expect(isAppearance("Dark")).toBe(false);
    expect(isAppearance(null)).toBe(false);
    expect(isAppearance("system")).toBe(false);
  });

  it("resolves auto against the machine, and light / dark against nothing", () => {
    expect(resolveAppearance("auto", true)).toBe("dark");
    expect(resolveAppearance("auto", false)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
    expect(resolveAppearance("light", true)).toBe("light");
  });

  it("maps to the color-scheme that dresses the scrollbars and form controls", () => {
    expect(colorScheme("light")).toBe("light");
    expect(colorScheme("dark")).toBe("dark");
    expect(colorScheme("auto")).toBe("light dark");
  });
});

describe("persistence", () => {
  it("reads the default when nothing is stored and when the stored value is junk", () => {
    expect(readAppearance()).toBe("light");
    localStorage.setItem(APPEARANCE_KEY, "midnight");
    expect(readAppearance()).toBe("light");
  });

  it("round-trips a choice through localStorage under kalpos:appearance", () => {
    setAppearance("dark");
    expect(localStorage.getItem(APPEARANCE_KEY)).toBe("dark");
    expect(readAppearance()).toBe("dark");
    setAppearance("auto");
    expect(localStorage.getItem(APPEARANCE_KEY)).toBe("auto");
    expect(readAppearance()).toBe("auto");
  });

  it("applies the choice to <html> as the attribute the CSS reads, plus color-scheme", () => {
    setAppearance("dark");
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    setAppearance("auto");
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("auto");
    expect(document.documentElement.style.colorScheme).toBe("light dark");
  });

  it("announces the change to every subscriber, and stops when they unsubscribe", () => {
    const seen: string[] = [];
    const off = subscribeAppearance(() => seen.push(readAppearance()));
    setAppearance("dark");
    setAppearance("light");
    off();
    setAppearance("auto");
    expect(seen).toEqual(["dark", "light"]);
  });

  it("still applies the choice to this page when localStorage throws (private mode)", () => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
    try {
      expect(() => setAppearance("dark")).not.toThrow();
      expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("dark");
    } finally {
      Storage.prototype.setItem = setItem;
    }
  });
});

describe("the 160 ms crossfade", () => {
  it("puts the shift class on <html> for exactly the transition and takes it off again", () => {
    vi.useFakeTimers();
    try {
      setAppearanceWithCrossfade("dark", false);
      expect(document.documentElement.classList.contains(APPEARANCE_SHIFT_CLASS)).toBe(true);
      expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("dark");
      vi.advanceTimersByTime(APPEARANCE_SHIFT_MS - 1);
      expect(document.documentElement.classList.contains(APPEARANCE_SHIFT_CLASS)).toBe(true);
      vi.advanceTimersByTime(2);
      expect(document.documentElement.classList.contains(APPEARANCE_SHIFT_CLASS)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not cross-fade under reduced motion: the swap is instant", () => {
    setAppearanceWithCrossfade("dark", true);
    expect(document.documentElement.classList.contains(APPEARANCE_SHIFT_CLASS)).toBe(false);
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("dark");
  });
});

/*
 * The pre-paint script is what keeps a dark visitor from seeing a white
 * frame, so it is tested as the browser runs it: as source text, against a
 * real documentElement, before anything else exists.
 */
describe("the pre-paint script", () => {
  const run = () => new Function(APPEARANCE_SCRIPT)();

  it("writes the stored choice onto <html> before the first paint", () => {
    localStorage.setItem(APPEARANCE_KEY, "dark");
    run();
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("writes auto as auto, leaving the resolving to prefers-color-scheme in CSS", () => {
    localStorage.setItem(APPEARANCE_KEY, "auto");
    run();
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe("auto");
    expect(document.documentElement.style.colorScheme).toBe("light dark");
  });

  it("falls back to the default for nothing stored and for a junk value", () => {
    run();
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe(DEFAULT_APPEARANCE);
    localStorage.setItem(APPEARANCE_KEY, "🌙");
    run();
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe(DEFAULT_APPEARANCE);
  });

  it("never throws when storage is unavailable, and still sets the default", () => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new DOMException("SecurityError");
    };
    try {
      expect(run).not.toThrow();
      expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBe(DEFAULT_APPEARANCE);
    } finally {
      Storage.prototype.getItem = getItem;
    }
  });

  it("is small enough to inline on every response and mentions no framework", () => {
    expect(APPEARANCE_SCRIPT.length).toBeLessThan(420);
    expect(APPEARANCE_SCRIPT).toContain(APPEARANCE_KEY);
    expect(APPEARANCE_SCRIPT).toContain(APPEARANCE_ATTR);
  });
});

describe("applyAppearance", () => {
  it("can dress an element other than the document, for tests and for SSR safety", () => {
    const el = document.createElement("html");
    applyAppearance("dark", el);
    expect(el.getAttribute(APPEARANCE_ATTR)).toBe("dark");
    expect(document.documentElement.getAttribute(APPEARANCE_ATTR)).toBeNull();
  });
});

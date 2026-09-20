import { describe, it, expect } from "vitest";
import {
  BOOT_BAR_DELAY_MS,
  BOOT_BAR_MIN_MS,
  BOOT_EXIT_MS,
  BOOT_HOLD_MS,
  BOOT_LOGO_MS,
  BOOT_MAX_MS,
  BOOT_MIN_MS,
  BOOT_REDUCED_HOLD_MS,
  BOOT_SCRIPT,
  BOOT_STEP_MS,
  bootDone,
  bootFill,
  bootProgress,
  fillDuration,
  startsBoot,
  wantsDesk,
} from "./boot";

describe("boot progress (the macOS-style bar is real readiness)", () => {
  it("counts the registry as the first step and each health check as one more", () => {
    expect(bootProgress({}, false)).toBe(0);
    expect(bootProgress({}, true)).toBe(1);
    expect(bootProgress({ a: "checking", b: "checking", c: "none" }, true)).toBeCloseTo(1 / 3);
    expect(bootProgress({ a: "ok", b: "checking", c: "none" }, true)).toBeCloseTo(2 / 3);
    expect(bootProgress({ a: "ok", b: "down", c: "none" }, true)).toBe(1);
  });

  it("the bar never moves backwards: bootFill keeps the highest value seen and clamps to 0..1", () => {
    expect(bootFill(0, 0.3)).toBeCloseTo(0.3);
    expect(bootFill(0.6, 0.3)).toBeCloseTo(0.6);
    expect(bootFill(0.6, 0.9)).toBeCloseTo(0.9);
    expect(bootFill(0.9, Number.NaN)).toBeCloseTo(0.9);
    expect(bootFill(0, -1)).toBe(0);
    expect(bootFill(0, 7)).toBe(1);
    // A run of readiness samples that dips (a check re-armed mid-boot) still renders monotonically.
    let shown = 0;
    const rendered = [0.125, 0.5, 0.375, 0.75, 1, 0.875].map((p) => (shown = bootFill(shown, p)));
    for (let i = 1; i < rendered.length; i++) expect(rendered[i]).toBeGreaterThanOrEqual(rendered[i - 1]);
  });

  it("timings: logo 400 ms, bar 300 ms later, bar visible ≥ 1.4 s (min 2.1 s from power-on), cap 4 s, hold 250 ms, exit 600 ms", () => {
    expect(BOOT_LOGO_MS).toBe(400);
    expect(BOOT_BAR_DELAY_MS).toBe(300);
    expect(BOOT_BAR_MIN_MS).toBe(1400);
    expect(BOOT_MIN_MS).toBe(2100);
    expect(BOOT_MAX_MS).toBe(4000);
    expect(BOOT_HOLD_MS).toBe(250);
    expect(BOOT_EXIT_MS).toBe(600);
    expect(BOOT_REDUCED_HOLD_MS).toBe(800);
    expect(BOOT_STEP_MS).toBe(400);
  });

  it("ends once the bar has glided to 100 % for 1.4 s (so never before 2.1 s from the power button), or at the 4 s cap", () => {
    expect(bootDone({ elapsed: 1000, fullFor: 300 })).toBe(false);
    expect(bootDone({ elapsed: 2100, fullFor: 1399 })).toBe(false);
    expect(bootDone({ elapsed: 2100, fullFor: 1400 })).toBe(true);
    expect(bootDone({ elapsed: 2900, fullFor: 1400 })).toBe(true);
    expect(bootDone({ elapsed: 3500, fullFor: null })).toBe(false);
    expect(bootDone({ elapsed: 4000, fullFor: null })).toBe(true);
    expect(bootDone({ elapsed: 4000, fullFor: 100 })).toBe(true);
  });

  it("with reduced motion the logo and the full bar hold for 800 ms, then it ends", () => {
    expect(bootDone({ elapsed: 0, fullFor: null, reduced: true })).toBe(false);
    expect(bootDone({ elapsed: 799, fullFor: 799, reduced: true })).toBe(false);
    expect(bootDone({ elapsed: 800, fullFor: null, reduced: true })).toBe(true);
  });

  it("the last step is one 1.4 s glide to 100 % (never a 400 ms snap); earlier steps take 400 ms", () => {
    expect(fillDuration(0.125)).toBe(BOOT_STEP_MS);
    expect(fillDuration(0.875)).toBe(BOOT_STEP_MS);
    expect(fillDuration(1)).toBe(BOOT_BAR_MIN_MS);
  });
});

describe("the power screen (the boot starts from a gesture, like a Mac from its power button)", () => {
  it("any printable key, Enter, Space or an arrow starts the boot; lone modifiers and Escape do not", () => {
    for (const key of ["a", "K", "1", " ", "Enter", "ArrowDown", "Tab", "/"]) expect(startsBoot({ type: "keydown", key })).toBe(true);
    for (const key of ["Shift", "Control", "Alt", "Meta", "CapsLock", "Escape", "Fn", "Dead"]) expect(startsBoot({ type: "keydown", key })).toBe(false);
  });

  it("a ⌘ or Ctrl chord is the browser's shortcut (⌘L, ⌘R, ⌘T), never the power button", () => {
    expect(startsBoot({ type: "keydown", key: "l", metaKey: true })).toBe(false);
    expect(startsBoot({ type: "keydown", key: "r", ctrlKey: true })).toBe(false);
    expect(startsBoot({ type: "keydown", key: "e", metaKey: false, ctrlKey: false })).toBe(true);
  });

  it("a click, a mouse press or a touch ends the wait; other events do not", () => {
    for (const type of ["click", "mousedown", "touchend", "pointerup"]) expect(startsBoot({ type })).toBe(true);
    for (const type of ["mousemove", "scroll", "focus", "keyup"]) expect(startsBoot({ type })).toBe(false);
  });
});

describe("what skips the boot and the lock", () => {
  it("a plain visit to / never skips (no localStorage flag)", () => {
    expect(wantsDesk({ pathname: "/", search: "" })).toBe(false);
    expect(wantsDesk({ pathname: "/", search: "?utm=x" })).toBe(false);
  });

  it("a deep link or ?desk goes straight to the desk", () => {
    expect(wantsDesk({ pathname: "/projects/rc-car", search: "" })).toBe(true);
    expect(wantsDesk({ pathname: "/", search: "?desk" })).toBe(true);
    expect(wantsDesk({ pathname: "/", search: "?desk=1&x=2" })).toBe(true);
    expect(wantsDesk({ pathname: "/", search: "?x=2&desk" })).toBe(true);
    expect(wantsDesk({ pathname: "/", search: "?desktop" })).toBe(false);
  });
});

describe("the pre-paint script", () => {
  function run(pathname: string, search: string, storage: Record<string, string> = {}) {
    const attrs: Record<string, string> = {};
    const fn = new Function("document", "location", "localStorage", BOOT_SCRIPT);
    fn(
      { documentElement: { setAttribute: (k: string, v: string) => void (attrs[k] = v) } },
      { pathname, search },
      { removeItem: (k: string) => void delete storage[k], getItem: (k: string) => storage[k] ?? null },
    );
    return { attrs, storage };
  }

  it("marks the desk for a deep link or ?desk only, and never for a plain visit", () => {
    expect(run("/", "").attrs["data-kos-boot"]).toBeUndefined();
    expect(run("/projects/rc-car", "").attrs["data-kos-boot"]).toBe("desk");
    expect(run("/", "?desk").attrs["data-kos-boot"]).toBe("desk");
  });

  it("forgets the old kalpos:visited flag and does not need localStorage", () => {
    const { storage } = run("/", "", { "kalpos:visited": "1" });
    expect(storage["kalpos:visited"]).toBeUndefined();
    const fn = new Function("document", "location", "localStorage", BOOT_SCRIPT);
    const attrs: Record<string, string> = {};
    expect(() =>
      fn(
        { documentElement: { setAttribute: (k: string, v: string) => void (attrs[k] = v) } },
        { pathname: "/", search: "?desk" },
        undefined,
      ),
    ).not.toThrow();
    expect(attrs["data-kos-boot"]).toBe("desk");
  });
});

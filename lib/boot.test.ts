import { describe, it, expect } from "vitest";
import { BOOT_MAX_MS, BOOT_MIN_MS, BOOT_SCRIPT, bootDone, bootProgress, wantsDesk } from "./boot";

describe("boot progress (card 2a: the hairline is real readiness)", () => {
  it("counts the registry as the first step and each health check as one more", () => {
    expect(bootProgress({}, false)).toBe(0);
    expect(bootProgress({}, true)).toBe(1);
    expect(bootProgress({ a: "checking", b: "checking", c: "none" }, true)).toBeCloseTo(1 / 3);
    expect(bootProgress({ a: "ok", b: "checking", c: "none" }, true)).toBeCloseTo(2 / 3);
    expect(bootProgress({ a: "ok", b: "down", c: "none" }, true)).toBe(1);
  });

  it("ends when everything answered and at least 900 ms have passed, or at the 3 s cap", () => {
    expect(BOOT_MIN_MS).toBe(900);
    expect(BOOT_MAX_MS).toBe(3000);
    expect(bootDone({ elapsed: 300, progress: 1 })).toBe(false);
    expect(bootDone({ elapsed: 900, progress: 1 })).toBe(true);
    expect(bootDone({ elapsed: 2500, progress: 0.5 })).toBe(false);
    expect(bootDone({ elapsed: 3000, progress: 0.5 })).toBe(true);
  });

  it("with reduced motion the boot ends at once", () => {
    expect(bootDone({ elapsed: 0, progress: 0, reduced: true })).toBe(true);
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

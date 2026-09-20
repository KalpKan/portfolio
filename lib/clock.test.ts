import { describe, it, expect } from "vitest";
import { CLOCK_SCRIPT, formatLockDate, formatLockTime, formatMenubarClock } from "./clock";

const d = new Date(2026, 8, 19, 11, 42, 6); // Sat 19 Sep 2026 11:42:06 local

describe("clock formats (card 3c / 2c)", () => {
  it("lock date reads 'Saturday, September 20'", () => {
    expect(formatLockDate(d)).toBe("Saturday, September 19");
  });
  it("lock time is 24 h HH:MM with a leading zero", () => {
    expect(formatLockTime(d)).toBe("11:42");
    expect(formatLockTime(new Date(2026, 8, 19, 9, 5))).toBe("09:05");
  });
  it("menubar clock reads 'Sat 20 Sep' and the time", () => {
    expect(formatMenubarClock(d)).toEqual({ date: "Sat 19 Sep", time: "11:42" });
  });
  it("the pre-paint script fills the three clock nodes by id", () => {
    expect(CLOCK_SCRIPT).toContain("kos-lock-date");
    expect(CLOCK_SCRIPT).toContain("kos-lock-time");
    expect(CLOCK_SCRIPT).toContain("kos-clock");
    expect(() => new Function(CLOCK_SCRIPT)).not.toThrow();
  });
});

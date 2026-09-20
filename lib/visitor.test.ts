import { describe, it, expect } from "vitest";
import { VISITED_KEY, hasVisited, markVisited } from "./visitor";

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  };
}

describe("returning visitor", () => {
  it("is false on the first visit and true after markVisited", () => {
    const s = fakeStorage();
    expect(hasVisited(s)).toBe(false);
    markVisited(s);
    expect(s.getItem(VISITED_KEY)).toBe("1");
    expect(hasVisited(s)).toBe(true);
  });

  it("is false and does not throw when storage is missing or throws", () => {
    expect(hasVisited(null)).toBe(false);
    const broken = { getItem: () => { throw new Error("private"); }, setItem: () => { throw new Error("private"); } } as unknown as Storage;
    expect(hasVisited(broken)).toBe(false);
    expect(() => markVisited(broken)).not.toThrow();
  });
});

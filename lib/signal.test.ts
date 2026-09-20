import { describe, it, expect, vi } from "vitest";
import { initialSignals, okCount, runHealthChecks, signalFromBody, statusWord, tileMark } from "./signal";
import type { Tile } from "./tiles";

const tile = (over: Partial<Tile> = {}): Tile => ({
  slug: "a",
  name: "A",
  tagline: "",
  kind: "live",
  hardware: false,
  href: "https://a",
  external: true,
  repo: null,
  healthUrl: "https://a/api/health",
  tags: [],
  archived: false,
  ...over,
});

describe("initialSignals", () => {
  it("starts live tiles with a health url at checking and everything else at none", () => {
    const s = initialSignals([tile(), tile({ slug: "b", healthUrl: null }), tile({ slug: "c", kind: "case", healthUrl: null })]);
    expect(s).toEqual({ a: "checking", b: "none", c: "none" });
  });
});

describe("signalFromBody", () => {
  it("is ok only for a body whose ok is literally true", () => {
    expect(signalFromBody({ ok: true })).toBe("ok");
    expect(signalFromBody({ ok: "true" })).toBe("down");
    expect(signalFromBody(null)).toBe("down");
  });
});

describe("tileMark and statusWord", () => {
  it("draws the trace only for a live tile that answered ok", () => {
    expect(tileMark(tile(), "ok")).toBe("trace");
    expect(statusWord(tile(), "ok")).toBe("Live signal");
  });
  it("shows checking while the check is in flight", () => {
    expect(tileMark(tile(), "checking")).toBe("checking");
    expect(statusWord(tile(), "checking")).toBe("Checking…");
  });
  it("shows no signal when the check failed, and 'live' without a check when there is no health url", () => {
    expect(tileMark(tile(), "down")).toBe("down");
    expect(statusWord(tile(), "down")).toBe("No signal");
    expect(tileMark(tile({ healthUrl: null }), "none")).toBe("checking");
    expect(statusWord(tile({ healthUrl: null }), "none")).toBe("Live");
  });
  it("marks archived, case and coming tiles by kind regardless of signal", () => {
    expect(statusWord(tile({ archived: true }), "none")).toBe("Archived");
    expect(tileMark(tile({ kind: "case" }), "none")).toBe("case");
    expect(statusWord(tile({ kind: "case" }), "none")).toBe("Case study");
    expect(tileMark(tile({ kind: "coming" }), "none")).toBe("coming");
    expect(statusWord(tile({ kind: "coming" }), "none")).toBe("Coming");
  });
});

describe("runHealthChecks", () => {
  it("asks /api/status/<slug> for every live tile with a health url and reports the signal", async () => {
    const fetcher = vi.fn(async (url: string) =>
      new Response(JSON.stringify({ ok: url.endsWith("/a") }), { status: 200 }),
    );
    const seen: Record<string, string> = {};
    runHealthChecks([tile(), tile({ slug: "b" }), tile({ slug: "c", healthUrl: null })], (slug, sig) => (seen[slug] = sig), { fetcher });
    await vi.waitFor(() => expect(Object.keys(seen).length).toBe(2));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map((c) => c[0])).toEqual(["/api/status/a", "/api/status/b"]);
    expect(seen).toEqual({ a: "ok", b: "down" });
  });

  it("reports down on a network error and stops reporting after cancel", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("offline");
    });
    const seen: string[] = [];
    runHealthChecks([tile()], (slug) => seen.push(slug), { fetcher });
    await vi.waitFor(() => expect(seen).toEqual(["a"]));
    const cancel = runHealthChecks([tile({ slug: "z" })], (slug) => seen.push(slug), { fetcher });
    cancel();
    await new Promise((r) => setTimeout(r, 10));
    expect(seen).toEqual(["a"]);
  });
});

describe("okCount", () => {
  it("counts ok signals", () => {
    expect(okCount({ a: "ok", b: "down", c: "ok", d: "none" })).toBe(2);
  });
});

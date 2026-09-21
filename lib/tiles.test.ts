import { describe, it, expect } from "vitest";
import type { Project } from "./projects";
import { loadProjects } from "./projects";
import { FILTERS, filterCounts, filterTiles, searchTiles, tileFor, tilesFor } from "./tiles";

const app = (over: Partial<Extract<Project, { type: "app" }>> = {}): Project => ({
  slug: "a",
  name: "App A",
  tagline: "does a thing",
  type: "app",
  status: "live",
  url: "https://a.kalpkan.com",
  repo: "https://github.com/KalpKan/a",
  healthUrl: "https://a.kalpkan.com/api/health",
  tags: ["Next.js"],
  hero: null,
  ...over,
});

const showcase = (over: Partial<Extract<Project, { type: "showcase" }>> = {}): Project => ({
  slug: "s",
  name: "Show S",
  tagline: "a case study",
  type: "showcase",
  status: "live",
  repo: null,
  tags: ["KiCad"],
  hero: null,
  ...over,
});

describe("tileFor", () => {
  it("maps a live app to a live tile that opens its url in a new tab", () => {
    const t = tileFor(app());
    expect(t.kind).toBe("live");
    expect(t.href).toBe("https://a.kalpkan.com");
    expect(t.external).toBe(true);
    expect(t.healthUrl).toBe("https://a.kalpkan.com/api/health");
  });

  it("maps a coming app to a coming tile whose only link is its repo", () => {
    const t = tileFor(app({ status: "coming", url: undefined, healthUrl: null }));
    expect(t.kind).toBe("coming");
    expect(t.href).toBe("https://github.com/KalpKan/a");
    expect(t.healthUrl).toBeNull();
  });

  it("maps an archived app to a live-kind tile flagged archived (it still opens)", () => {
    const t = tileFor(app({ status: "archived" }));
    expect(t.kind).toBe("live");
    expect(t.archived).toBe(true);
    expect(t.href).toBe("https://a.kalpkan.com");
  });

  it("maps a written showcase to a case tile on the hub and a coming showcase to a coming tile", () => {
    expect(tileFor(showcase())).toMatchObject({ kind: "case", href: "/projects/s", external: false });
    expect(tileFor(showcase({ status: "coming" }))).toMatchObject({ kind: "coming", href: null });
  });

  it("flags hardware from the tags, case-insensitively", () => {
    expect(tileFor(showcase({ tags: ["KiCad", "PCB"] })).hardware).toBe(true);
    expect(tileFor(app({ tags: ["esp8266"] })).hardware).toBe(true);
    expect(tileFor(app({ tags: ["Next.js", "Supabase"] })).hardware).toBe(false);
  });
});

describe("filters", () => {
  const tiles = tilesFor([
    app(),
    app({ slug: "b", name: "B", tags: ["ESP8266"] }),
    app({ slug: "c", name: "C", status: "coming", url: undefined, healthUrl: null }),
    showcase(),
    showcase({ slug: "t", name: "T", status: "coming", tags: [] }),
  ]);

  it("counts every filter from the tiles, not from claims", () => {
    expect(filterCounts(tiles)).toEqual({ all: 5, live: 2, hardware: 2, case: 2, coming: 2 });
  });

  it("filters to the matching tiles and keeps registry order", () => {
    expect(filterTiles(tiles, "all").map((t) => t.slug)).toEqual(["a", "b", "c", "s", "t"]);
    expect(filterTiles(tiles, "live").map((t) => t.slug)).toEqual(["a", "b"]);
    expect(filterTiles(tiles, "hardware").map((t) => t.slug)).toEqual(["b", "s"]);
    expect(filterTiles(tiles, "case").map((t) => t.slug)).toEqual(["s", "t"]);
    expect(filterTiles(tiles, "coming").map((t) => t.slug)).toEqual(["c", "t"]);
  });

  it("searches name, tagline and tags without case", () => {
    expect(searchTiles(tiles, "esp").map((t) => t.slug)).toEqual(["b"]);
    expect(searchTiles(tiles, "CASE STUDY").map((t) => t.slug)).toEqual(["s", "t"]);
    expect(searchTiles(tiles, "  ").length).toBe(5);
  });

  it("lists the five sidebar filters in the mock's order", () => {
    expect([...FILTERS]).toEqual(["all", "live", "hardware", "case", "coming"]);
  });
});

describe("the committed registry", () => {
  it("has 13 tiles, 8 live and 2 coming (the counts the desk shows)", () => {
    const c = filterCounts(tilesFor(loadProjects()));
    expect(c.all).toBe(13);
    expect(c.live).toBe(8);
    expect(c.coming).toBe(2);
    expect(c.case).toBe(5);
  });
});

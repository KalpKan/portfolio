import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadProjects } from "./projects";
import { tilesFor } from "./tiles";

describe("tile covers", () => {
  const tiles = tilesFor(loadProjects());
  it("every project has a cover", () => {
    for (const t of tiles) expect(t.cover, t.slug).not.toBeNull();
  });
  it("every raster cover exists, is a small WebP rendition", () => {
    for (const t of tiles) {
      if (t.cover?.kind !== "image") continue;
      const file = path.join(process.cwd(), "public", t.cover.src);
      expect(existsSync(file), t.cover.src).toBe(true);
      expect(statSync(file).size, t.cover.src).toBeLessThanOrEqual(45 * 1024);
    }
  });
  it("only projects with nothing to photograph are drawn", () => {
    expect(tiles.filter((t) => t.cover?.kind === "drawn").map((t) => t.slug).sort()).toEqual(["eeg"]);
  });
});

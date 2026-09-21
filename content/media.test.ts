import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

// Showcase images are committed to the repo and served through next/image,
// so every one of them must be WebP and 300 KB or less (docs/hosting-plan.md
// §6). Videos are never committed at all.

const root = path.resolve(__dirname, "..", "public", "images", "projects");
const kalp = path.resolve(__dirname, "..", "public", "images", "kalp");
const LIMIT = 300 * 1024;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

describe("showcase media", () => {
  const files = walk(root).filter((f) => !f.endsWith(".DS_Store"));

  it("has at least one image", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("is all WebP, 300 KB or less, and no video slipped in", () => {
    for (const f of files) {
      expect(path.extname(f), f).toBe(".webp");
      expect(statSync(f).size, `${path.relative(root, f)} is over 300 KB`).toBeLessThanOrEqual(LIMIT);
    }
  });

  it("the photos of Kalp (public/images/kalp) follow the same rule", () => {
    const photos = walk(kalp).filter((f) => !f.endsWith(".DS_Store"));
    expect(photos.length).toBeGreaterThan(0);
    for (const f of photos) {
      expect(path.extname(f), f).toBe(".webp");
      expect(statSync(f).size, `${path.relative(kalp, f)} is over 300 KB`).toBeLessThanOrEqual(LIMIT);
    }
  });
});

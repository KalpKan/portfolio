import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT,
  GRID,
  ICON_CELL,
  ICON_ORIGIN,
  ICONS_KEY,
  cellBounds,
  fitLayout,
  loadLayout,
  moveIcon,
  overlaps,
  placeIcon,
  saveLayout,
  toCell,
  toPx,
  type IconLayout,
} from "./icons";

const bounds = cellBounds(1440, 800);

describe("the desk's icon grid (card 2c, free layout 2026-09-20)", () => {
  it("cells are 22 px from the card's origin (38, 64); the default layout is the 2c two-column grid", () => {
    expect(GRID).toBe(22);
    expect(ICON_ORIGIN).toEqual({ x: 38, y: 64 });
    expect(ICON_CELL).toEqual({ w: 5, h: 5 });
    expect(toPx({ c: 0, r: 0 })).toEqual({ x: 38, y: 64 });
    expect(toPx({ c: 5, r: 5 })).toEqual({ x: 148, y: 174 });
    expect(toCell({ x: 150, y: 170 })).toEqual({ c: 5, r: 5 });
    expect(DEFAULT_LAYOUT).toEqual({
      projects: { c: 0, r: 0 },
      hobbies: { c: 5, r: 0 },
      about: { c: 0, r: 5 },
      contact: { c: 5, r: 5 },
      music: { c: 0, r: 10 },
      trash: { c: 5, r: 10 },
    });
  });

  it("bounds keep an icon off the menubar (top ≥ 44), off the dock (bottom ≤ vh − 106) and inside the sides", () => {
    expect(bounds.rMin).toBe(0); // y = 64 (the row above would sit at 42, under the 44 px line)
    expect(bounds.cMin).toBe(-1); // x = 16
    expect(toPx({ c: bounds.cMax, r: 0 }).x + 96).toBeLessThanOrEqual(1440 - 12);
    expect(toPx({ c: bounds.cMax + 1, r: 0 }).x + 96).toBeGreaterThan(1440 - 12);
    expect(toPx({ c: 0, r: bounds.rMax }).y + 89).toBeLessThanOrEqual(800 - 106);
    expect(toPx({ c: 0, r: bounds.rMax + 1 }).y + 89).toBeGreaterThan(800 - 106);
  });

  it("two icons overlap when their 5×5 footprints intersect", () => {
    expect(overlaps({ c: 0, r: 0 }, { c: 4, r: 4 })).toBe(true);
    expect(overlaps({ c: 0, r: 0 }, { c: 5, r: 0 })).toBe(false);
    expect(overlaps({ c: 0, r: 0 }, { c: 0, r: 5 })).toBe(false);
    expect(overlaps({ c: 3, r: 3 }, { c: 0, r: 0 })).toBe(true);
  });

  it("placeIcon: a free cell is kept; a cell on another icon is nudged to the nearest free one; off-desk cells are clamped", () => {
    const layout: IconLayout = { ...DEFAULT_LAYOUT };
    expect(placeIcon(layout, "hobbies", { c: 40, r: 12 }, bounds)).toEqual({ c: 40, r: 12 });
    // dropped right on Projects: the nearest free cell that clears every other icon
    const nudged = placeIcon(layout, "hobbies", { c: 1, r: 1 }, bounds);
    expect(overlaps(nudged, layout.projects)).toBe(false);
    expect(overlaps(nudged, layout.about)).toBe(false);
    expect(overlaps(nudged, layout.contact)).toBe(false);
    expect(Math.max(Math.abs(nudged.c - 1), Math.abs(nudged.r - 1))).toBeLessThanOrEqual(5);
    // its own old cell never counts as an obstacle
    expect(placeIcon(layout, "hobbies", { c: 5, r: 0 }, bounds)).toEqual({ c: 5, r: 0 });
    // off the right edge / under the dock: clamped into bounds first
    const far = placeIcon(layout, "hobbies", { c: 999, r: 999 }, bounds);
    expect(far).toEqual({ c: bounds.cMax, r: bounds.rMax });
    const up = placeIcon(layout, "trash", { c: 20, r: -9 }, bounds);
    expect(up).toEqual({ c: 20, r: 0 });
  });

  it("moveIcon: an arrow key moves one cell; through a neighbour it lands on the far side; at the edge it stays", () => {
    const layout: IconLayout = { ...DEFAULT_LAYOUT };
    expect(moveIcon(layout, "hobbies", "right", bounds)).toEqual({ c: 6, r: 0 });
    // Projects sits at c=0..4: moving Hobbies left from c=5 would overlap, so it steps through to the far side (c=-1 is in bounds but still overlaps) → stays
    expect(moveIcon(layout, "hobbies", "left", bounds)).toEqual({ c: 5, r: 0 });
    expect(moveIcon(layout, "projects", "up", bounds)).toEqual({ c: 0, r: 0 });
    expect(moveIcon(layout, "projects", "left", bounds)).toEqual({ c: -1, r: 0 });
    // down from Projects: About is at r=5..9, so the first free row is 10... which is Now playing; then 15
    expect(moveIcon({ projects: { c: 0, r: 0 }, about: { c: 0, r: 5 } }, "projects", "down", bounds)).toEqual({ c: 0, r: 10 });
  });

  it("fitLayout re-places every icon inside a smaller viewport without overlaps, keeping the ones that already fit", () => {
    const layout: IconLayout = { ...DEFAULT_LAYOUT, hobbies: { c: 60, r: 0 }, contact: { c: 5, r: 30 } };
    const small = cellBounds(900, 600);
    const fitted = fitLayout(layout, small);
    expect(fitted.projects).toEqual({ c: 0, r: 0 });
    expect(fitted.hobbies!.c).toBeLessThanOrEqual(small.cMax);
    expect(fitted.contact!.r).toBeLessThanOrEqual(small.rMax);
    const ids = Object.keys(fitted) as (keyof IconLayout)[];
    expect(ids).toEqual(Object.keys(layout));
    for (const a of ids) for (const b of ids) if (a !== b) expect(overlaps(fitted[a]!, fitted[b]!), `${a} vs ${b}`).toBe(false);
    // only the icons given are placed (a hidden Now playing keeps its saved cell elsewhere)
    expect(Object.keys(fitLayout({ projects: { c: 0, r: 0 } }, small))).toEqual(["projects"]);
  });

  it("persists per icon in localStorage kalpos:icons and restores it, ignoring junk", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(loadLayout(storage)).toEqual(DEFAULT_LAYOUT);
    saveLayout(storage, { ...DEFAULT_LAYOUT, hobbies: { c: 40, r: 12 } });
    expect(JSON.parse(store.get(ICONS_KEY)!).hobbies).toEqual({ c: 40, r: 12 });
    expect(loadLayout(storage).hobbies).toEqual({ c: 40, r: 12 });
    store.set(ICONS_KEY, '{"hobbies":{"c":"x","r":1},"about":[1,2],"nope":{"c":1,"r":1}}');
    expect(loadLayout(storage)).toEqual(DEFAULT_LAYOUT);
    store.set(ICONS_KEY, "not json");
    expect(loadLayout(storage)).toEqual(DEFAULT_LAYOUT);
    const throwing = { getItem: () => { throw new Error("private mode"); }, setItem: () => { throw new Error("private mode"); } };
    expect(loadLayout(throwing)).toEqual(DEFAULT_LAYOUT);
    expect(() => saveLayout(throwing, DEFAULT_LAYOUT)).not.toThrow();
  });
});

/**
 * The desk's icon layout (2026-09-20, "make it so you can move the folders
 * anywhere you want on the desktop"), as pure functions so it can be tested
 * without the DOM. Positions are cells of the 22 px dot grid (card 2c/2e:
 * "icons snap to the dots") measured from the card's icon origin (38, 64);
 * every icon owns a 5×5-cell footprint (110 × 110 px, the icon is 96 × ≤ 89)
 * and no two footprints may intersect. The default layout is the card's
 * two-column grid. Bounds keep an icon off the menubar (top ≥ 44), off the
 * dock's band (bottom ≤ vh − 106) and 12 px inside the sides. Persisted per
 * icon in localStorage `kalpos:icons`; "Clean Up" in the KalpOS menu (⌥⌘1)
 * restores the default.
 */

export const GRID = 22;
export const ICON_ORIGIN = { x: 38, y: 64 } as const;
/** Footprint in cells. */
export const ICON_CELL = { w: 5, h: 5 } as const;
/** The icon's own box in px (the tallest is About me at 89). */
export const ICON_BOX = { w: 96, h: 89 } as const;
export const ICONS_KEY = "kalpos:icons";

export type IconId = "projects" | "hobbies" | "about" | "contact" | "music" | "trash";
export const ICON_IDS: IconId[] = ["projects", "hobbies", "about", "contact", "music", "trash"];

export interface Cell {
  c: number;
  r: number;
}
export type IconLayout = Record<IconId, Cell>;
export type Bounds = { cMin: number; cMax: number; rMin: number; rMax: number };
export type Dir = "up" | "down" | "left" | "right";

export const DEFAULT_LAYOUT: IconLayout = {
  projects: { c: 0, r: 0 },
  hobbies: { c: 5, r: 0 },
  about: { c: 0, r: 5 },
  contact: { c: 5, r: 5 },
  music: { c: 0, r: 10 },
  trash: { c: 5, r: 10 },
};

export function toPx(cell: Cell): { x: number; y: number } {
  return { x: ICON_ORIGIN.x + cell.c * GRID, y: ICON_ORIGIN.y + cell.r * GRID };
}

export function toCell(px: { x: number; y: number }): Cell {
  return { c: Math.round((px.x - ICON_ORIGIN.x) / GRID), r: Math.round((px.y - ICON_ORIGIN.y) / GRID) };
}

/** Menubar 32 + 12; dock band 90 + 16; 12 px at the sides. */
const AREA = { top: 44, bottom: 106, side: 12 } as const;

export function cellBounds(vw: number, vh: number): Bounds {
  return {
    cMin: Math.ceil((AREA.side - ICON_ORIGIN.x) / GRID) + 0,
    cMax: Math.max(0, Math.floor((vw - AREA.side - ICON_BOX.w - ICON_ORIGIN.x) / GRID)),
    rMin: Math.ceil((AREA.top - ICON_ORIGIN.y) / GRID) + 0, // + 0: never -0
    rMax: Math.max(0, Math.floor((vh - AREA.bottom - ICON_BOX.h - ICON_ORIGIN.y) / GRID)),
  };
}

export function overlaps(a: Cell, b: Cell): boolean {
  return Math.abs(a.c - b.c) < ICON_CELL.w && Math.abs(a.r - b.r) < ICON_CELL.h;
}

function clampCell(cell: Cell, b: Bounds): Cell {
  return { c: Math.min(Math.max(cell.c, b.cMin), b.cMax), r: Math.min(Math.max(cell.r, b.rMin), b.rMax) };
}

function inBounds(cell: Cell, b: Bounds): boolean {
  return cell.c >= b.cMin && cell.c <= b.cMax && cell.r >= b.rMin && cell.r <= b.rMax;
}

function free(cell: Cell, others: Cell[]): boolean {
  return !others.some((o) => overlaps(cell, o));
}

function othersOf(layout: Partial<IconLayout>, id: IconId): Cell[] {
  return (Object.keys(layout) as IconId[]).filter((k) => k !== id).map((k) => layout[k]!);
}

/**
 * Where `id` lands when dropped on `wanted`: clamped into the desk, then the
 * nearest free cell (rings outward, nearest first) that clears every other icon.
 */
export function placeIcon(layout: Partial<IconLayout>, id: IconId, wanted: Cell, b: Bounds): Cell {
  const others = othersOf(layout, id);
  const start = clampCell(wanted, b);
  if (free(start, others)) return start;
  const maxD = Math.max(b.cMax - b.cMin, b.rMax - b.rMin) + 1;
  for (let d = 1; d <= maxD; d++) {
    const ring: Cell[] = [];
    for (let dc = -d; dc <= d; dc++) {
      for (let dr = -d; dr <= d; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
        ring.push({ c: start.c + dc, r: start.r + dr });
      }
    }
    ring.sort((p, q) => (p.c - start.c) ** 2 + (p.r - start.r) ** 2 - ((q.c - start.c) ** 2 + (q.r - start.r) ** 2));
    for (const cell of ring) if (inBounds(cell, b) && free(cell, others)) return cell;
  }
  return layout[id] ?? start;
}

/** An arrow key: one cell in `dir`; through a neighbour it keeps stepping to the far side; blocked at the edge it stays. */
export function moveIcon(layout: Partial<IconLayout>, id: IconId, dir: Dir, b: Bounds): Cell {
  const from = layout[id] ?? DEFAULT_LAYOUT[id];
  const others = othersOf(layout, id);
  const step = dir === "left" ? { c: -1, r: 0 } : dir === "right" ? { c: 1, r: 0 } : dir === "up" ? { c: 0, r: -1 } : { c: 0, r: 1 };
  let cell = from;
  for (;;) {
    cell = { c: cell.c + step.c, r: cell.r + step.r };
    if (!inBounds(cell, b)) return from;
    if (free(cell, others)) return cell;
  }
}

/** A restored layout on a different viewport: every icon given re-placed in default order, nearest free cell each. */
export function fitLayout(layout: Partial<IconLayout>, b: Bounds): Partial<IconLayout> {
  const out: Partial<IconLayout> = {};
  for (const id of ICON_IDS) {
    if (!layout[id]) continue;
    out[id] = placeIcon(out, id, layout[id]!, b);
  }
  return out;
}

/** The entries of `layout` for `ids` only (the icons on the desk right now: Now playing hides without a track). */
export function pick(layout: IconLayout, ids: IconId[]): Partial<IconLayout> {
  const out: Partial<IconLayout> = {};
  for (const id of ids) out[id] = layout[id];
  return out;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isCell(v: unknown): v is Cell {
  return !!v && typeof v === "object" && !Array.isArray(v) && Number.isInteger((v as Cell).c) && Number.isInteger((v as Cell).r);
}

/** The saved layout over the default; anything that is not {id: {c, r}} for a known id is ignored. */
export function loadLayout(storage: StorageLike | undefined): IconLayout {
  const out: IconLayout = { ...DEFAULT_LAYOUT };
  try {
    const raw = storage?.getItem(ICONS_KEY);
    if (!raw) return out;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return out;
    for (const id of ICON_IDS) {
      const v = (parsed as Record<string, unknown>)[id];
      if (isCell(v)) out[id] = { c: v.c, r: v.r };
    }
  } catch {
    // no storage (private mode) or junk: the default layout
  }
  return out;
}

export function saveLayout(storage: StorageLike | undefined, layout: IconLayout): void {
  try {
    storage?.setItem(ICONS_KEY, JSON.stringify(layout));
  } catch {
    // storage full or blocked: the layout lives for this page only
  }
}

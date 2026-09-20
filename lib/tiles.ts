import type { Project } from "./projects";
import { projectKind } from "./projects";

/**
 * Registry → Projects-window tiles (card 2d). Three tile kinds:
 *  - live:   an app with a url (status live/demo/archived). The tile is cyan
 *            with the spike trace once its health check answers ok.
 *  - case:   a showcase whose case study is written; opens inside a window.
 *  - coming: a coming app or an unwritten showcase; dashed tile, "Coming".
 * `hardware` is derived from the tags so the sidebar's Hardware filter is a
 * measured count, never a claim.
 */
export type TileKind = "live" | "case" | "coming";

export interface Tile {
  slug: string;
  name: string;
  tagline: string;
  kind: TileKind;
  hardware: boolean;
  /** Where the tile goes: the app url, the case study path, a repo, or nowhere. */
  href: string | null;
  /** True when href leaves the hub (new tab, rel=noreferrer). */
  external: boolean;
  repo: string | null;
  healthUrl: string | null;
  tags: string[];
  archived: boolean;
  /** True for a registry `type: "showcase"` entry (written or not): the "Case studies" filter. */
  showcase: boolean;
}

export const HARDWARE_TAGS = new Set(
  ["hardware", "kicad", "pcb", "raspberry pi", "robotics", "esp8266", "mpu6050", "ltspice", "arduino"],
);

export const FILTERS = ["all", "live", "hardware", "case", "coming"] as const;
export type Filter = (typeof FILTERS)[number];

export const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  live: "Live signal",
  hardware: "Hardware",
  case: "Case studies",
  coming: "Coming",
};

export function tileFor(p: Project): Tile {
  const kind = projectKind(p);
  const hardware = p.tags.some((t) => HARDWARE_TAGS.has(t.toLowerCase()));
  const base = {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    hardware,
    repo: p.repo,
    tags: p.tags,
    showcase: p.type === "showcase",
  };
  switch (kind) {
    case "live":
    case "archived":
      return {
        ...base,
        kind: "live",
        href: p.type === "app" && p.url ? p.url : null,
        external: true,
        healthUrl: p.type === "app" && p.healthUrl ? p.healthUrl : null,
        archived: kind === "archived",
      };
    case "coming":
    case "showcase-soon":
      return { ...base, kind: "coming", href: p.repo, external: true, healthUrl: null, archived: false };
    case "showcase":
      return { ...base, kind: "case", href: `/projects/${p.slug}`, external: false, healthUrl: null, archived: false };
  }
}

export function tilesFor(projects: Project[]): Tile[] {
  return projects.map(tileFor);
}

function matches(t: Tile, f: Filter): boolean {
  switch (f) {
    case "all":
      return true;
    case "live":
      return t.kind === "live";
    case "hardware":
      return t.hardware;
    case "case":
      // Every showcase entry, written or not: the mock counts "Case studies 5 · Coming 2".
      return t.showcase;
    case "coming":
      return t.kind === "coming";
  }
}

export function filterTiles(tiles: Tile[], f: Filter): Tile[] {
  return tiles.filter((t) => matches(t, f));
}

export function filterCounts(tiles: Tile[]): Record<Filter, number> {
  const out = { all: 0, live: 0, hardware: 0, case: 0, coming: 0 };
  for (const f of FILTERS) out[f] = filterTiles(tiles, f).length;
  return out;
}

export function searchTiles(tiles: Tile[], query: string): Tile[] {
  const q = query.trim().toLowerCase();
  if (!q) return tiles;
  return tiles.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.tagline.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}

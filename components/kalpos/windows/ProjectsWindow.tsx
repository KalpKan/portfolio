"use client";

import { useMemo, useState } from "react";
import type { Signal } from "@/lib/signal";
import { checksDone, hasCheck, okCount } from "@/lib/signal";
import { FILTERS, FILTER_LABELS, filterCounts, filterTiles, searchTiles, type Filter, type Tile as TileT } from "@/lib/tiles";
import type { Rect } from "@/lib/windows";
import Tile from "../Tile";
import { Lights, useWindowDrag } from "../Window";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Card 2d: frosted sidebar "REGISTRY" with the five filters and their real
 * counts, the header "Projects · N items, M live", a search field, the tile
 * grid and the footer hint. The sidebar foot reports the health round once
 * every check has answered ("pinged 11:42:06 · 7/7 ok").
 */
export default function ProjectsWindow({
  tiles,
  signals,
  onOpenCase,
  checkedAt,
}: {
  tiles: TileT[];
  signals: Record<string, Signal>;
  onOpenCase: (slug: string, origin?: Rect) => void;
  checkedAt: Date | null;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const drag = useWindowDrag();
  const counts = useMemo(() => filterCounts(tiles), [tiles]);
  const shown = useMemo(() => searchTiles(filterTiles(tiles, filter), query), [tiles, filter, query]);
  const checks = tiles.filter(hasCheck).length;
  const done = checksDone(signals);
  const foot =
    done && checkedAt
      ? `pinged ${pad(checkedAt.getHours())}:${pad(checkedAt.getMinutes())}:${pad(checkedAt.getSeconds())} · ${okCount(signals)}/${checks} ok`
      : `checking ${checks} health endpoints…`;

  return (
    <>
      <aside className="kos-sidebar">
        <div {...drag}>
          <Lights />
        </div>
        <span className="kos-label">Registry</span>
        <ul className="kos-filters">
          {FILTERS.map((f) => (
            <li key={f}>
              <button
                type="button"
                className={`kos-filter${f === "coming" ? " kos-filter--coming" : ""}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABELS[f]}
                <span>{counts[f]}</span>
              </button>
            </li>
          ))}
        </ul>
        <span className="kos-sidebar-foot" aria-live="polite">
          {foot}
        </span>
      </aside>
      <div className="kos-main">
        <div className="kos-main-head" {...drag}>
          <span className="kos-nav-stubs" aria-hidden><i /><i /></span>
          <h2 className="kos-main-title">Projects</h2>
          <span className="kos-main-count">
            {counts.all} items, {counts.live} live
          </span>
          <input
            className="kos-search"
            type="search"
            placeholder="Search"
            aria-label="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
        <ul className="kos-grid" aria-label="Projects">
          {shown.map((t) => (
            <li key={t.slug}>
              <Tile tile={t} signal={signals[t.slug] ?? "none"} onOpenCase={onOpenCase} />
            </li>
          ))}
          {shown.length === 0 ? <li className="kos-empty">Nothing matches.</li> : null}
        </ul>
        <div className="kos-main-foot">
          Click a live tile → the app opens in a new tab · a case study opens here, in a window
        </div>
      </div>
    </>
  );
}

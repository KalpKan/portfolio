"use client";

import { useMemo, useRef, useState } from "react";
import type { Signal } from "@/lib/signal";
import { checksDone, hasCheck, okCount } from "@/lib/signal";
import { FILTERS, FILTER_LABELS, filterCounts, filterTiles, searchTiles, type Filter, type Tile as TileT } from "@/lib/tiles";
import type { Rect } from "@/lib/windows";
import { track } from "@/lib/track";
import Tile from "../Tile";
import { Lights, useWindowDrag } from "../Window";
import QuickLook, { moveIndex } from "./QuickLook";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Card 2d: frosted sidebar "REGISTRY" with the five filters and their real
 * counts, the header "Projects · N items, M live", a search field, the tile
 * grid and the footer hint. The sidebar foot reports the health round once
 * every check has answered ("pinged 11:42:06 · 7/7 ok").
 *
 * Quick Look (T6.6): Space with a tile focused, or the ⓘ that appears at the
 * top-right of a tile on hover (and in the tab order), opens a frosted panel
 * inside the window for that tile (QuickLook.tsx). While it is open the
 * arrow keys move focus between tiles and the panel follows; Space or Esc
 * closes it (Esc is swallowed here so the window itself stays open). Focus
 * never leaves the tile that opened it, so closing needs no restore.
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
  const [quickLook, setQuickLook] = useState<string | null>(null);
  const grid = useRef<HTMLUListElement>(null);
  const drag = useWindowDrag();
  const counts = useMemo(() => filterCounts(tiles), [tiles]);
  const shown = useMemo(() => searchTiles(filterTiles(tiles, filter), query), [tiles, filter, query]);
  const checks = tiles.filter(hasCheck).length;
  const done = checksDone(signals);
  const foot =
    done && checkedAt
      ? `pinged ${pad(checkedAt.getHours())}:${pad(checkedAt.getMinutes())}:${pad(checkedAt.getSeconds())} · ${okCount(signals)}/${checks} ok`
      : `checking ${checks} health endpoints…`;

  // The panel follows the grid: a filter or search that hides its tile hides the panel too.
  const previewed = quickLook ? shown.find((t) => t.slug === quickLook) ?? null : null;

  // One event per project shown, whether the panel was opened for it or arrowed to it.
  const openQuickLook = (slug: string) => {
    if (previewed?.slug !== slug) track("quicklook_opened", { slug });
    setQuickLook(slug);
  };

  /** The tile cell (li[data-slug]) that holds the focused element, if any. */
  const cellOf = (el: EventTarget | null): HTMLElement | null =>
    (el as Element | null)?.closest?.("li[data-slug]") as HTMLElement | null;

  /** Move DOM focus to the tile in cell `i`: its link/button, or the cell itself when it has neither. */
  const focusCell = (i: number) => {
    const cell = grid.current?.querySelectorAll<HTMLElement>("li[data-slug]")[i];
    if (!cell) return;
    const target = cell.querySelector<HTMLElement>("a.kos-tile, button.kos-tile") ?? cell;
    target.focus({ preventScroll: false });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && previewed) {
      e.preventDefault();
      e.stopPropagation();
      setQuickLook(null);
      return;
    }
    const cell = cellOf(e.target);
    if (!cell) return; // inside the panel or the header, keys keep their native meaning
    if (e.key === " ") {
      // Space toggles; keydown is cancelled so a button tile is not "clicked"
      // on keyup and a link tile does not scroll the grid.
      e.preventDefault();
      e.stopPropagation();
      if (previewed) setQuickLook(null);
      else if (cell.dataset.slug) openQuickLook(cell.dataset.slug);
      return;
    }
    const cells = [...(grid.current?.querySelectorAll<HTMLElement>("li[data-slug]") ?? [])];
    const next = moveIndex(e.key, cells.indexOf(cell), cells.length);
    if (next === null) return;
    e.preventDefault();
    focusCell(next);
    const slug = cells[next]?.dataset.slug;
    if (previewed && slug) openQuickLook(slug);
  };

  // A button tile fires click on Space keyup as well; the keydown above is
  // cancelled, but Firefox still wants the keyup cancelled to be sure.
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === " " && cellOf(e.target)) e.preventDefault();
  };

  return (
    <>
      <aside className="kos-sidebar" onKeyDown={onKeyDown}>
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
      <div className="kos-main" onKeyDown={onKeyDown} onKeyUp={onKeyUp} data-quicklook={previewed ? "open" : undefined}>
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
        <ul className="kos-grid" aria-label="Projects" ref={grid}>
          {shown.map((t) => (
            <li
              key={t.slug}
              data-slug={t.slug}
              data-previewed={previewed?.slug === t.slug ? "true" : undefined}
              // A tile with nowhere to go (coming, no repo) is a <div>: the cell itself takes the focus so Space still works.
              tabIndex={t.href || t.kind === "case" ? undefined : 0}
              aria-label={t.href || t.kind === "case" ? undefined : t.name}
            >
              <Tile tile={t} signal={signals[t.slug] ?? "none"} onOpenCase={onOpenCase} />
              <button
                type="button"
                className="kos-ql-btn"
                aria-label={`Quick Look: ${t.name}`}
                aria-pressed={previewed?.slug === t.slug}
                onClick={() => (previewed?.slug === t.slug ? setQuickLook(null) : openQuickLook(t.slug))}
              >
                <span aria-hidden>i</span>
              </button>
            </li>
          ))}
          {shown.length === 0 ? <li className="kos-empty">Nothing matches.</li> : null}
        </ul>
        <div className="kos-main-foot">
          Click a live tile → the app opens in a new tab · a case study opens here, in a window · Space for Quick Look
        </div>
        {previewed ? (
          <QuickLook tile={previewed} signal={signals[previewed.slug] ?? "none"} onOpenCase={onOpenCase} onClose={() => setQuickLook(null)} />
        ) : null}
      </div>
    </>
  );
}

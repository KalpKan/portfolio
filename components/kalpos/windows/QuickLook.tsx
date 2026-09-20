"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { MediaItem, Placeholder } from "@/content/case-study";
import type { Signal } from "@/lib/signal";
import { statusWord, tileMark } from "@/lib/signal";
import type { Tile } from "@/lib/tiles";
import type { Rect } from "@/lib/windows";
import { track } from "@/lib/track";
import { rectOf } from "../DeskIcons";
import { TraceMark } from "../Tile";

/*
 * Quick Look: the Space-bar preview of the Projects window (macOS Finder's
 * idiom). A frosted panel inside the window shows one tile at a time: its
 * hero screenshot in a rounded frame, the name, the tagline, the tags and one
 * button that does what clicking the tile does ("Open" an app in a new tab,
 * "Read" a case study in a window, "Coming" for what is not there yet).
 *
 * Pictures: an app's hero is the registry's `hero` path (a real screenshot of
 * the live app, scripts/app-screenshots.mjs); a case study's is the hero of
 * its content file, fetched on demand so the desk's first load still carries
 * no case-study content. No picture yet: the tile's own art, drawn large.
 * Pictures are next/image, lazy (nothing loads until the panel opens).
 *
 * The keyboard model (Space / Esc / arrows) lives in ProjectsWindow, which
 * owns which tile is focused; this component is the panel only.
 */

type CaseHero = MediaItem | Placeholder | null;

export function isPlaceholder(h: MediaItem | Placeholder): h is Placeholder {
  return "kind" in h && h.kind === "placeholder";
}

/** The grid is `repeat(3, ...)` in app/kalpos.css (.kos-grid); Up/Down step by this. */
export const GRID_COLUMNS = 3;

/**
 * Where an arrow key moves the focused tile: Left/Right step one, Up/Down a
 * row, and the edges stop (Finder does not wrap). null = not an arrow key.
 */
export function moveIndex(key: string, index: number, count: number, columns = GRID_COLUMNS): number | null {
  let next: number;
  switch (key) {
    case "ArrowRight":
      next = index + 1;
      break;
    case "ArrowLeft":
      next = index - 1;
      break;
    case "ArrowDown":
      next = index + columns;
      break;
    case "ArrowUp":
      next = index - columns;
      break;
    default:
      return null;
  }
  if (count === 0) return null;
  return Math.min(Math.max(next, 0), count - 1);
}

export function quickLookVerb(tile: Tile): "Open" | "Read" | "Coming" {
  if (tile.kind === "case") return "Read";
  if (tile.kind === "live" && tile.href) return "Open";
  return "Coming";
}

export default function QuickLook({
  tile,
  signal,
  onOpenCase,
  onClose,
}: {
  tile: Tile;
  signal: Signal;
  onOpenCase: (slug: string, origin?: Rect) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [caseHero, setCaseHero] = useState<{ slug: string; hero: CaseHero } | null>(null);

  // A case study's picture is in its content file: load it when the panel shows that tile.
  useEffect(() => {
    if (!tile.showcase) return;
    let alive = true;
    import("@/content/projects").then((m) => {
      if (!alive) return;
      const study = m.getCaseStudy(tile.slug);
      setCaseHero({ slug: tile.slug, hero: study && !study.draft ? study.hero : null });
    });
    return () => {
      alive = false;
    };
  }, [tile.slug, tile.showcase]);

  const verb = quickLookVerb(tile);
  const mark = tileMark(tile, signal);
  const artClass =
    mark === "trace" ? "kos-tile-art--live" : mark === "coming" ? "kos-tile-art--coming" : "kos-tile-art--grey";
  const clicked = () => track("project_card_clicked", { slug: tile.slug, type: tile.showcase ? "showcase" : "app", kind: tile.kind });

  // next/image (as the showcase pages use it): `fill` inside the 16:10 frame,
  // lazy by default, and its `sizes` matches the panel's two widths.
  const SIZES = "(min-width: 1024px) 300px, 100vw";
  let picture: React.ReactNode;
  if (tile.showcase) {
    const h = caseHero?.slug === tile.slug ? caseHero.hero : null;
    picture =
      h && !isPlaceholder(h) ? (
        <Image
          className="kos-ql-img"
          src={h.src}
          alt={h.alt}
          fill
          sizes={SIZES}
          style={h.position ? { objectPosition: h.position } : undefined}
        />
      ) : (
        <div className={`kos-tile-art ${artClass}`} aria-hidden>
          {mark === "case" ? <i className="kos-mark-case" /> : null}
        </div>
      );
  } else if (tile.hero) {
    picture = <Image className="kos-ql-img" src={tile.hero} alt={`${tile.name}, in use`} fill sizes={SIZES} />;
  } else {
    picture = (
      <div className={`kos-tile-art ${artClass}`} aria-hidden>
        {mark === "trace" ? <TraceMark /> : null}
        {mark === "checking" ? <i className="kos-mark-check" /> : null}
        {mark === "down" ? <i className="kos-mark-down" /> : null}
      </div>
    );
  }

  let action: React.ReactNode;
  if (verb === "Open") {
    action = (
      <a className="kos-alert-btn kos-alert-btn--primary kos-ql-action" href={tile.href!} target="_blank" rel="noreferrer" onClick={clicked}>
        Open
      </a>
    );
  } else if (verb === "Read") {
    action = (
      <button
        type="button"
        className="kos-alert-btn kos-alert-btn--primary kos-ql-action"
        onClick={(e) => {
          clicked();
          const frame = e.currentTarget.closest(".kos-ql")?.querySelector(".kos-ql-frame") ?? null;
          onOpenCase(tile.slug, rectOf(frame));
        }}
      >
        Read
      </button>
    );
  } else {
    action = (
      <span className="kos-alert-btn kos-ql-action" aria-disabled="true">
        Coming
      </span>
    );
  }

  return (
    <aside className="kos-ql" role="region" aria-labelledby={titleId} data-slug={tile.slug}>
      <div className="kos-ql-head">
        <span className="kos-label">Quick Look</span>
        <button type="button" className="kos-ql-close" aria-label="Close Quick Look" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="kos-ql-frame">{picture}</div>
      <h3 className="kos-ql-name" id={titleId}>
        {tile.name}
      </h3>
      <p className="kos-ql-status">{statusWord(tile, signal)}</p>
      <p className="kos-ql-tagline">{tile.tagline}</p>
      {tile.tags.length > 0 ? (
        <ul className="kos-ql-tags" aria-label="Tags">
          {tile.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
      <div className="kos-ql-actions">{action}</div>
      <p className="kos-ql-hint">Space or Esc closes · ← → move between projects</p>
    </aside>
  );
}

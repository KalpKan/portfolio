"use client";

import type { Signal } from "@/lib/signal";
import { statusWord, tileMark } from "@/lib/signal";
import type { Tile as TileT } from "@/lib/tiles";
import type { Rect } from "@/lib/windows";
import { track } from "@/lib/track";
import { COVER_H, COVER_W } from "@/lib/covers";
import { rectOf } from "./DeskIcons";
import CoverArt from "./CoverArt";

/** The spike trace the current hub draws on a live pad; drawn once (1.6 s) when the check answers ok. */
export const TRACE = "M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18";

export function TraceMark() {
  return (
    <svg viewBox="0 0 64 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path className="trace" d={TRACE} />
    </svg>
  );
}

/**
 * Card 2d's tile: 4:3 picture + name + status word. The picture is the
 * project's cover (lib/covers.ts); the live status is a pill over it: a live
 * tile that answered ok gets the cyan pill with the trace, checking / no
 * signal ○ / —, case studies ▲ (and open inside a window), coming a dashed
 * dot on a dimmed, dashed-outline picture.
 * A live tile is an <a> to the app in a new tab (project_card_clicked).
 */
export default function Tile({
  tile,
  signal,
  onOpenCase,
}: {
  tile: TileT;
  signal: Signal;
  onOpenCase: (slug: string, origin?: Rect) => void;
}) {
  const mark = tileMark(tile, signal);
  const word = statusWord(tile, signal);
  // The picture fills the art box; the status is a pill laid over it. A
  // coming tile keeps its dashed outline and its picture is dimmed.
  const art = (
    <div className={`kos-tile-art kos-tile-art--pic${mark === "coming" ? " kos-tile-art--coming" : ""}`} aria-hidden>
      {tile.cover?.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a 480 px rendition made for the tile; fixed size, no optimiser round trip
        <img className="kos-pic" src={tile.cover.src} alt="" width={COVER_W} height={COVER_H} loading="lazy" decoding="async" draggable={false} />
      ) : tile.cover?.kind === "drawn" ? (
        <CoverArt id={tile.cover.id} />
      ) : null}
      <span className={`kos-pill kos-pill--${mark}`}>
        {mark === "trace" ? <TraceMark /> : null}
        {mark === "checking" ? <i className="kos-mark-check" /> : null}
        {mark === "down" ? <i className="kos-mark-down" /> : null}
        {mark === "case" ? <i className="kos-mark-case" /> : null}
        {mark === "coming" ? <i className="kos-mark-coming" /> : null}
      </span>
    </div>
  );
  const text = (
    <div>
      <p className="kos-tile-name">{tile.name}</p>
      <p className={`kos-tile-status${mark === "trace" ? " kos-tile-status--live" : ""}`}>{word}</p>
    </div>
  );
  const cls = `kos-tile kos-tile--${tile.kind}`;
  const clicked = () => track("project_card_clicked", { slug: tile.slug, type: tile.showcase ? "showcase" : "app", kind: tile.kind });

  if (tile.kind === "case") {
    return (
      <button
        type="button"
        className={cls}
        title={tile.tagline}
        onClick={(e) => {
          clicked();
          onOpenCase(tile.slug, rectOf(e.currentTarget.querySelector(".kos-tile-art")));
        }}
      >
        {art}
        {text}
      </button>
    );
  }
  if (tile.href) {
    return (
      <a className={cls} href={tile.href} target="_blank" rel="noreferrer" title={tile.tagline} onClick={clicked}>
        {art}
        {text}
      </a>
    );
  }
  return (
    <div className={cls} title={tile.tagline}>
      {art}
      {text}
    </div>
  );
}

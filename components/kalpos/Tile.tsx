"use client";

import type { Signal } from "@/lib/signal";
import { statusWord, tileMark } from "@/lib/signal";
import type { Tile as TileT } from "@/lib/tiles";
import type { Rect } from "@/lib/windows";
import { track } from "@/lib/track";
import { rectOf } from "./DeskIcons";

/** The spike trace the current hub draws on a live pad; drawn once (1.6 s) when the check answers ok. */
export const TRACE = "M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18";

export function TraceMark() {
  return (
    <svg viewBox="0 0 64 24" aria-hidden fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path className="trace" d={TRACE} />
    </svg>
  );
}

/**
 * Card 2d's tile: 4:3 art + name + status word. Live tiles that answered ok
 * are cyan with the trace; checking / no signal are grey with ○ / —; case
 * studies are grey with ▲ and open inside a window; coming are dashed.
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
  const artClass =
    mark === "trace" ? "kos-tile-art--live" : mark === "coming" ? "kos-tile-art--coming" : "kos-tile-art--grey";
  const art = (
    <div className={`kos-tile-art ${artClass}`} aria-hidden>
      {mark === "trace" ? <TraceMark /> : null}
      {mark === "checking" ? <i className="kos-mark-check" /> : null}
      {mark === "down" ? <i className="kos-mark-down" /> : null}
      {mark === "case" ? <i className="kos-mark-case" /> : null}
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

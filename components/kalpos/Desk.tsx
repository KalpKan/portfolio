"use client";

import { useCallback } from "react";
import type { Signal } from "@/lib/signal";
import type { SiteConfig } from "@/lib/site";
import type { Tile } from "@/lib/tiles";
import type { Rect, WindowId, WindowsAction, WindowsState } from "@/lib/windows";
import { topWindow } from "@/lib/windows";
import { AppGlyph, DeskIcon, DocGlyph, FolderGlyph, TrashGlyph } from "./DeskIcons";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import Widgets from "./Widgets";
import Window from "./Window";
import AboutWindow from "./windows/AboutWindow";
import CaseStudyWindow from "./windows/CaseStudyWindow";
import ContactWindow from "./windows/ContactWindow";
import HobbiesWindow from "./windows/HobbiesWindow";
import MusicWindow from "./windows/MusicWindow";
import ProjectsWindow from "./windows/ProjectsWindow";
import TerminalWindow from "./windows/TerminalWindow";
import TrashWindow from "./windows/TrashWindow";

/*
 * Card 2c, the desk: frosted menubar, dotted ground, the icon grid at
 * top-left, the widgets at top-right, the dock at the bottom, and the
 * windows layer in between. Window state lives in the parent (lib/windows.ts
 * reducer); this component only renders it and dispatches.
 */

const WIDTH: Record<string, number> = {
  projects: 760,
  about: 520,
  contact: 520,
  hobbies: 460,
  trash: 520,
  music: 420,
  terminal: 560,
  case: 760,
};

const TITLES: Record<string, string> = {
  projects: "Projects",
  about: "About me",
  contact: "Contact",
  hobbies: "Hobbies",
  trash: "Trash",
  music: "Now playing",
  terminal: "Terminal",
};

export function windowTitle(id: WindowId, tiles: Tile[]): string {
  if (id.startsWith("case:")) return tiles.find((t) => t.slug === id.slice(5))?.name ?? "Case study";
  return TITLES[id] ?? id;
}

function widthFor(id: WindowId): number {
  const w = WIDTH[id.startsWith("case:") ? "case" : id];
  if (typeof window === "undefined") return w;
  return Math.min(w, window.innerWidth - 24);
}

/** 2d places the Projects window at left 150 / top 86 in a 1040 desk; later windows cascade by 28 px. */
function positionFor(id: WindowId, index: number): { x: number; y: number } {
  const w = widthFor(id);
  const vw = typeof window === "undefined" ? 1040 : window.innerWidth;
  const x = Math.max(24, Math.round((vw - w) / 2)) + (index % 6) * 28;
  const y = 86 + (index % 6) * 28;
  return { x: Math.min(x, Math.max(24, vw - w - 12)), y };
}

export default function Desk({
  tiles,
  signals,
  windows,
  dispatch,
  site,
  checkedAt,
  caseBodies = {},
  onOpenWindow,
}: {
  tiles: Tile[];
  signals: Record<string, Signal>;
  windows: WindowsState;
  dispatch: (a: WindowsAction) => void;
  site: SiteConfig;
  checkedAt: Date | null;
  /** Server-rendered case-study bodies by slug (the deep-linked one). */
  caseBodies?: Record<string, React.ReactNode>;
  /** Hook for analytics / URL sync; the dispatch itself happens here. */
  onOpenWindow?: (id: WindowId) => void;
}) {
  const open = useCallback(
    (id: WindowId, origin?: Rect) => {
      dispatch({ type: "open", id, origin });
      onOpenWindow?.(id);
    },
    [dispatch, onOpenWindow],
  );
  const openCase = useCallback((slug: string, origin?: Rect) => open(`case:${slug}`, origin), [open]);
  const top = topWindow(windows);
  const playing = !!site.nowPlaying.title;

  const body = (id: WindowId): React.ReactNode => {
    switch (id) {
      case "projects":
        return <ProjectsWindow tiles={tiles} signals={signals} onOpenCase={openCase} checkedAt={checkedAt} />;
      case "about":
        return <AboutWindow site={site} />;
      case "contact":
        return <ContactWindow contact={site.contact} name={site.name} />;
      case "hobbies":
        return <HobbiesWindow />;
      case "trash":
        return <TrashWindow />;
      case "music":
        return <MusicWindow nowPlaying={site.nowPlaying} />;
      case "terminal":
        return <TerminalWindow lines={tiles.filter((t) => t.kind === "live").map((t) => ({ slug: t.slug, signal: signals[t.slug] ?? "none" }))} />;
      default: {
        const slug = id.slice(5);
        const tile = tiles.find((t) => t.slug === slug);
        if (!tile) return <div className="kos-body kos-muted">Not on the desk.</div>;
        return <CaseStudyWindow tile={tile} body={caseBodies[slug]} />;
      }
    }
  };

  return (
    <div className="kos-desk">
      <div className="kos-dots" aria-hidden />
      <div className="kos-sheen" aria-hidden />
      <MenuBar resumeUrl={site.resumeUrl} activeTitle={top ? windowTitle(top, tiles) : undefined} />

      <div className="kos-icons" id="kos-main" tabIndex={-1} aria-label="Desktop">
        <DeskIcon label="Projects" index={0} onOpen={(o) => open("projects", o)}>
          <FolderGlyph tint="projects" badge={String(tiles.length).padStart(2, "0")} />
        </DeskIcon>
        <DeskIcon label="Hobbies" index={1} onOpen={(o) => open("hobbies", o)}>
          <FolderGlyph tint="hobbies" />
        </DeskIcon>
        <DeskIcon label="About me" index={2} onOpen={(o) => open("about", o)}>
          <DocGlyph />
        </DeskIcon>
        <DeskIcon label="Contact" index={3} onOpen={(o) => open("contact", o)}>
          <AppGlyph kind="contact" />
        </DeskIcon>
        {playing ? (
          <DeskIcon label="Now playing" index={4} onOpen={(o) => open("music", o)}>
            <AppGlyph kind="music" />
          </DeskIcon>
        ) : null}
        <DeskIcon label="Trash" index={5} quiet onOpen={(o) => open("trash", o)}>
          <TrashGlyph />
        </DeskIcon>
      </div>

      <Widgets site={site} />

      <div className="kos-windows">
        {windows.windows.map((w, i) =>
          w.minimized ? null : (
            <Window
              key={w.id}
              id={w.id}
              title={windowTitle(w.id, tiles)}
              focused={w.id === top}
              z={w.z}
              origin={w.origin}
              width={widthFor(w.id)}
              defaultPos={positionFor(w.id, i)}
              chrome={w.id === "projects" ? "sidebar" : "titlebar"}
              onClose={() => dispatch({ type: "close", id: w.id })}
              onFocus={() => dispatch({ type: "focus", id: w.id })}
              onMinimize={() => dispatch({ type: "minimize", id: w.id })}
            >
              {body(w.id)}
            </Window>
          ),
        )}
      </div>

      <Dock windows={windows} onOpen={open} resumeUrl={site.resumeUrl} />
    </div>
  );
}

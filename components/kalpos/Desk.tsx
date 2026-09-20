"use client";

import { useCallback, useEffect, useState } from "react";
import type { Signal } from "@/lib/signal";
import { playlistOf, type SiteConfig } from "@/lib/site";
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
  music: 520,
  terminal: 560,
  case: 760,
};

const TITLES: Record<string, string> = {
  projects: "Projects",
  about: "About me",
  contact: "Contact",
  hobbies: "Hobbies",
  trash: "Trash",
  music: "Music",
  terminal: "Terminal",
};

export function windowTitle(id: WindowId, tiles: Tile[]): string {
  if (id.startsWith("case:")) return tiles.find((t) => t.slug === id.slice(5))?.name ?? "Case study";
  return TITLES[id] ?? id;
}

function widthFor(id: WindowId): number {
  return WIDTH[id.startsWith("case:") ? "case" : id];
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
  onLock,
  onRestart,
  onReboot,
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
  /** The KalpOS menu's Lock Screen (also the terminal's `lock`). */
  onLock?: () => void;
  /** The KalpOS menu's Restart… (asks first) and the terminal's `reboot` (does not). */
  onRestart?: () => void;
  onReboot?: () => void;
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
  const playlist = playlistOf(site);
  const playing = playlist.length > 0;

  // Esc anywhere on the desk (outside a window, which handles its own) closes the top window.
  const [closeReq, setCloseReq] = useState<{ id: WindowId | null; n: number }>({ id: null, n: 0 });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !top) return;
      if ((e.target as Element | null)?.closest?.('[role="dialog"]')) return;
      setCloseReq((c) => ({ id: top, n: c.n + 1 }));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [top]);

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
        return <MusicWindow playlist={playlist} title={site.musicTitle} />;
      case "terminal":
        return (
          <TerminalWindow
            tiles={tiles}
            signals={signals}
            onOpenCase={(slug) => openCase(slug)}
            onClose={() => dispatch({ type: "close", id: "terminal" })}
            onLock={onLock}
            onRestart={onReboot}
          />
        );
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
      <MenuBar
        resumeUrl={site.resumeUrl}
        activeTitle={top ? windowTitle(top, tiles) : undefined}
        onAbout={() => open("about")}
        onLock={onLock}
        onRestart={onRestart}
      />

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

      <Widgets site={site} onOpenMusic={(o) => open("music", o)} />

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
              cascade={i}
              closeRequest={closeReq.id === w.id ? closeReq.n : 0}
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

      <Dock windows={windows} onOpen={open} resumeUrl={site.resumeUrl} hasMusic={playing} />
    </div>
  );
}

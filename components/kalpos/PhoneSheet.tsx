"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLOCK_IDS, formatLockTime } from "@/lib/clock";
import type { Signal } from "@/lib/signal";
import { checksDone, okCount, statusWord } from "@/lib/signal";
import type { SiteConfig } from "@/lib/site";
import type { Tile } from "@/lib/tiles";
import { track } from "@/lib/track";
import { AppGlyph, DeskIcon, DocGlyph, FolderGlyph, TrashGlyph } from "./DeskIcons";
import KalpOSMenu from "./KalpOSMenu";
import { useDrag } from "./useDrag";
import AboutWindow from "./windows/AboutWindow";
import CaseStudyWindow from "./windows/CaseStudyWindow";
import ContactWindow from "./windows/ContactWindow";
import HobbiesWindow from "./windows/HobbiesWindow";
import MusicWindow from "./windows/MusicWindow";
import TerminalWindow from "./windows/TerminalWindow";
import TrashWindow from "./windows/TrashWindow";

/*
 * Card 1e restyled with the turn-2 chrome: the desk folds to one sheet on a
 * phone (≤ 768 px). Compact frosted top bar (■ KalpOS · résumé ↓ · time),
 * name + one line, the 3-column folder grid with the tinted 2c icons (plus a
 * Terminal tile, since the phone has no dock), the yellow
 * note, and the Projects bottom sheet (drag handle, "Projects · 12 items ·
 * 7 live", close) listing one row per tile. Other folders open as
 * full-height sheets, never floating windows.
 */

type SheetId = "projects" | "hobbies" | "about" | "contact" | "music" | "trash" | "terminal" | `case:${string}`;
type Level = "peek" | "full" | "closed";

const PEEK_PX = 230;

const TITLES: Record<string, string> = {
  projects: "Projects",
  hobbies: "Hobbies",
  about: "About",
  contact: "Contact",
  music: "Now playing",
  trash: "Trash",
  terminal: "Terminal",
};

export default function PhoneSheet({
  tiles,
  signals,
  site,
  onOpenCase,
  onCloseCase,
  checkedAt,
  initialCase,
  caseBodies = {},
  onLock = () => {},
  onRestart = () => {},
  onReboot = () => {},
}: {
  tiles: Tile[];
  signals: Record<string, Signal>;
  site: SiteConfig;
  onOpenCase: (slug: string) => void;
  onCloseCase?: () => void;
  checkedAt: Date | null;
  initialCase?: string;
  caseBodies?: Record<string, React.ReactNode>;
  /** The KalpOS menu in the top bar: Lock Screen, Restart… (asks first); the terminal's `lock` and `reboot` (no confirm). */
  onLock?: () => void;
  onRestart?: () => void;
  onReboot?: () => void;
}) {
  const [sheet, setSheet] = useState<SheetId>(initialCase ? `case:${initialCase}` : "projects");
  const [level, setLevel] = useState<Level>(initialCase ? "full" : "peek");
  const [dragY, setDragY] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const clockEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tick = () => {
      const text = formatLockTime(new Date());
      if (clockEl.current && clockEl.current.textContent !== text) clockEl.current.textContent = text;
    };
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  const live = tiles.filter((t) => t.kind === "live").length;
  const done = checksDone(signals) && checkedAt;
  const line = done
    ? `Tap a folder. ${tiles.length} projects, ${okCount(signals)} with a live signal right now.`
    : `Tap a folder. ${tiles.length} projects, checking for live signals…`;

  const openSheet = useCallback(
    (id: SheetId) => {
      setSheet(id);
      setLevel("full");
      track("window_opened", { slug: id });
      if (id.startsWith("case:")) onOpenCase(id.slice(5));
      setTimeout(() => sheetRef.current?.focus({ preventScroll: true }), 0);
    },
    [onOpenCase],
  );
  const close = useCallback(() => {
    // The Projects sheet is the desk's main content on a phone: it peeks back rather than vanishing.
    if (sheet.startsWith("case:")) onCloseCase?.();
    if (sheet === "projects") setLevel("peek");
    else {
      setSheet("projects");
      setLevel("peek");
    }
  }, [sheet, onCloseCase]);

  const drag = useDrag({
    onMove: (_dx, dy) => setDragY(dy),
    onEnd: ({ dy, click }) => {
      setDragY(null);
      if (click) {
        setLevel((l) => (l === "full" ? (sheet === "projects" ? "peek" : "full") : "full"));
        return;
      }
      if (dy < -40) setLevel("full");
      else if (dy > 40) close();
    },
  });

  const title = sheet.startsWith("case:")
    ? tiles.find((t) => t.slug === sheet.slice(5))?.name ?? "Case study"
    : TITLES[sheet] ?? sheet;

  const restY = level === "full" ? "30px" : level === "peek" ? `calc(100% - ${PEEK_PX}px)` : "100%";
  const y = dragY === null ? restY : `calc(${restY} + ${Math.max(dragY, level === "full" ? -0 : -400)}px)`;

  const body = () => {
    switch (sheet) {
      case "projects":
        return (
          <ul className="kos-rows">
            {tiles.map((t) => {
              const s = signals[t.slug] ?? "none";
              const word = statusWord(t, s).toLowerCase();
              const isLive = s === "ok";
              const inner = (
                <>
                  <i className={`kos-row--icon${isLive ? " live" : ""}`} aria-hidden />
                  <span style={{ minWidth: 0 }}>
                    <b>{t.name}</b>
                    <small className={isLive ? "live" : undefined}>{word}</small>
                  </span>
                  <span className="arrow" aria-hidden>
                    →
                  </span>
                </>
              );
              if (t.kind === "case")
                return (
                  <li key={t.slug}>
                    <button type="button" className="kos-row" onClick={() => openSheet(`case:${t.slug}`)}>
                      {inner}
                    </button>
                  </li>
                );
              if (t.href)
                return (
                  <li key={t.slug}>
                    <a className="kos-row" href={t.href} target="_blank" rel="noreferrer" onClick={() => track("project_card_clicked", { slug: t.slug, type: "app", kind: t.kind })}>
                      {inner}
                    </a>
                  </li>
                );
              return (
                <li key={t.slug}>
                  <div className="kos-row">{inner}</div>
                </li>
              );
            })}
          </ul>
        );
      case "hobbies":
        return <HobbiesWindow />;
      case "about":
        return <AboutWindow site={site} />;
      case "contact":
        return <ContactWindow contact={site.contact} name={site.name} />;
      case "music":
        return <MusicWindow nowPlaying={site.nowPlaying} />;
      case "trash":
        return <TrashWindow />;
      case "terminal":
        return <TerminalWindow tiles={tiles} signals={signals} onOpenCase={(slug) => openSheet(`case:${slug}`)} onClose={close} onLock={onLock} onRestart={onReboot} />;
      default: {
        const tile = tiles.find((t) => t.slug === sheet.slice(5));
        return tile ? <CaseStudyWindow tile={tile} body={caseBodies[tile.slug]} /> : null;
      }
    }
  };

  return (
    <div className="kos-phone">
      <div className="kos-dots" aria-hidden />
      <header className="kos-phone-bar">
        <span>
          <i className="mark" aria-hidden />
          <KalpOSMenu className="kos-brand kos-brand--phone" onAbout={() => openSheet("about")} onLock={onLock} onRestart={onRestart} />
        </span>
        <span>
          {site.resumeUrl ? (
            <a href={site.resumeUrl} target="_blank" rel="noreferrer" aria-label="Résumé">
              ↓
            </a>
          ) : null}
          <span ref={clockEl} id={CLOCK_IDS.phone} className="kos-clock" suppressHydrationWarning>
            {"\u00a0"}
          </span>
        </span>
      </header>

      <div className="kos-phone-scroll" id="kos-main" tabIndex={-1}>
        <p className="kos-phone-name">{site.name}</p>
        <p className="kos-phone-line">{line}</p>
        <ul className="kos-phone-grid" aria-label="Folders">
          <li><DeskIcon label="Projects" draggable={false} onOpen={() => openSheet("projects")}><FolderGlyph tint="projects" badge={String(tiles.length).padStart(2, "0")} /></DeskIcon></li>
          <li><DeskIcon label="Hobbies" draggable={false} onOpen={() => openSheet("hobbies")}><FolderGlyph tint="hobbies" /></DeskIcon></li>
          <li><DeskIcon label="About" draggable={false} onOpen={() => openSheet("about")}><DocGlyph /></DeskIcon></li>
          <li><DeskIcon label="Contact" draggable={false} onOpen={() => openSheet("contact")}><AppGlyph kind="contact" /></DeskIcon></li>
          {site.nowPlaying?.title ? (
            <li><DeskIcon label="Music" draggable={false} onOpen={() => openSheet("music")}><AppGlyph kind="music" /></DeskIcon></li>
          ) : null}
          <li><DeskIcon label="Terminal" draggable={false} onOpen={() => openSheet("terminal")}><AppGlyph kind="terminal" /></DeskIcon></li>
          <li><DeskIcon label="Trash" quiet draggable={false} onOpen={() => openSheet("trash")}><TrashGlyph /></DeskIcon></li>
        </ul>
        <div className="kos-phone-note">{site.note}</div>
      </div>

      <div
        ref={sheetRef}
        className="kos-sheet"
        role="dialog"
        aria-label={title}
        aria-modal="false"
        tabIndex={-1}
        data-dragging={dragY !== null ? "true" : undefined}
        style={{ ["--sheet-y" as string]: y }}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        <button type="button" className="kos-sheet-handle" aria-label={level === "full" ? "Collapse sheet" : "Expand sheet"} {...drag}>
          <i />
        </button>
        <div className="kos-sheet-head">
          <b>{title}</b>
          {sheet === "projects" ? (
            <small>
              {tiles.length} items · {live} live
            </small>
          ) : null}
          <button type="button" className="kos-sheet-close" onClick={close}>
            close
          </button>
        </div>
        <div className="kos-sheet-body">{body()}</div>
      </div>
    </div>
  );
}

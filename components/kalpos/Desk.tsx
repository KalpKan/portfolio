"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { isMuted } from "@/lib/chime";
import { toPx, type IconId } from "@/lib/icons";
import { EASE, reducedMotion } from "@/lib/motion";
import { arcFrames, hitIndex, IDLE_SWAT, playSwat, SWAT_MS, swatReducer, swatTimeline, type Bin } from "@/lib/swat";
import type { Signal } from "@/lib/signal";
import type { SiteConfig } from "@/lib/site";
import type { Tile } from "@/lib/tiles";
import type { Rect, WindowId, WindowsAction, WindowsState } from "@/lib/windows";
import { track } from "@/lib/track";
import { topWindow } from "@/lib/windows";
import { AppGlyph, DeskIcon, DocGlyph, FolderGlyph, rectOf, TrashGlyph } from "./DeskIcons";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import { CrumpleFilter, TrashSwat } from "./TrashSwat";
import { useIconLayout } from "./useIconLayout";
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
 * Card 2c, the desk: frosted menubar, dotted ground, the icons (the card's
 * two-column grid by default, but each one can be dragged anywhere on the
 * desk and snaps to the dots: useIconLayout / lib/icons.ts, persisted in
 * localStorage), the widgets at top-right (fixed), the dock at the bottom,
 * and the windows layer in between. Window state lives in the parent
 * (lib/windows.ts reducer); this component only renders it and dispatches.
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
  const playing = !!site.nowPlaying.title;

  const present: IconId[] = playing ? ["projects", "hobbies", "about", "contact", "music", "trash"] : ["projects", "hobbies", "about", "contact", "trash"];
  const icons = useIconLayout(present);
  const cleanUp = useCallback(() => {
    track("menu_action", { item: "cleanup" });
    icons.cleanUp();
  }, [icons]);

  // ⌥⌘1 is Clean Up (the KalpOS menu's own shortcut).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === "1" || e.code === "Digit1")) {
        e.preventDefault();
        cleanUp();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cleanUp]);

  /*
   * The Trash swat (lib/swat.ts). While an icon is held, every pointer move is
   * hit-tested against the desk Trash and the dock's Trash tile; over one the
   * lid lifts and the icon crumples. A release inside starts the beats:
   * dropped (the icon sinks, 200 ms) → swatted (the hand pops, 260 ms, then
   * the icon flies home along the arc, 520 ms) → home (the hand withdraws,
   * 200 ms) → idle. The icon never moves cells: the drop is not committed.
   */
  const [swat, swatDispatch] = useReducer(swatReducer, IDLE_SWAT);
  /** The toast outlives the beats (1.6 s): it keeps its own copy of the trash rect. */
  const [toast, setToast] = useState<Rect | null>(null);
  const toastTimer = useRef(0);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const deskRef = useRef<HTMLDivElement>(null);
  const flight = useRef<Animation | null>(null);
  const bins = useCallback((): { where: Bin; rect: Rect }[] => {
    const out: { where: Bin; rect: Rect }[] = [];
    const desk = deskRef.current?.querySelector('.kos-icons .kos-icon[data-icon="trash"]');
    const dock = deskRef.current?.querySelector(".kos-dock-item--trash");
    for (const [where, el] of [["desk", desk], ["dock", dock]] as const) {
      const r = rectOf(el ?? null);
      if (r && (r.w || r.h)) out.push({ where, rect: r });
    }
    return out;
  }, []);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const onDragMove = useCallback(
    (id: IconId, at: { x: number; y: number }) => {
      pointer.current = at;
      if (id === "trash") return;
      const all = bins();
      const i = hitIndex(at, all.map((b) => b.rect));
      swatDispatch({ type: "hover", icon: id, over: i >= 0, where: all[i]?.where });
    },
    [bins],
  );
  const onDrop = useCallback(
    (id: IconId, px: { x: number; y: number }) => {
      const all = bins();
      const at = pointer.current;
      const i = at && id !== "trash" ? hitIndex(at, all.map((b) => b.rect)) : -1;
      pointer.current = null;
      if (i < 0) {
        swatDispatch({ type: "hover", icon: id, over: false });
        icons.drop(id, px);
        return;
      }
      track("trash_swat", { icon: id });
      swatDispatch({ type: "drop", icon: id, inside: true, at: px, bin: all[i].rect, home: toPx(icons.layout[id]), where: all[i].where });
    },
    [bins, icons],
  );

  /** The flight is running (the icon's data-state is "fly" for its z-order). */
  const [flying, setFlying] = useState(false);

  // The phase clock, and what each phase does to the icon element.
  const iconEl = (id: IconId | null) => (id ? deskRef.current?.querySelector<HTMLElement>(`.kos-icons .kos-icon[data-icon="${id}"]`) ?? null : null);
  useLayoutEffect(() => {
    const { phase, icon, at, bin, home } = swat;
    if (phase === "idle" || phase === "over") return;
    const reduced = reducedMotion();
    const times = swatTimeline(reduced);
    const timers: number[] = [];
    const el = iconEl(icon);
    const animate = (frames: Keyframe[], duration: number) => {
      flight.current?.cancel();
      flight.current = el?.animate?.(frames, { duration, easing: EASE, fill: "both" }) ?? null;
    };
    if (phase === "dropped" && at && bin && home && !reduced) {
      // From where the hand let go into the basket's opening (relative to the home cell the element sits at).
      const from = { x: at.x - home.x, y: at.y - home.y };
      const to = { x: bin.x + bin.w / 2 - 48 - home.x, y: bin.y + bin.h * 0.25 - 40 - home.y };
      animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px) rotate(6deg) scale(0.85)`, opacity: 1 },
          { transform: `translate(${to.x}px, ${to.y}px) rotate(14deg) scale(0.25)`, opacity: 0 },
        ],
        SWAT_MS.sink,
      );
    }
    if (phase === "swatted") {
      timers.push(
        window.setTimeout(() => {
          void playSwat({ muted: isMuted() });
          if (reduced || !bin || !home) return;
          const from = { x: bin.x + bin.w / 2 - 48 - home.x, y: bin.y + bin.h * 0.25 - 40 - home.y };
          animate(arcFrames(from, { x: 0, y: 0 }), SWAT_MS.fly);
          setFlying(true);
        }, SWAT_MS.hand),
      );
    }
    if (phase === "home") {
      flight.current?.cancel();
      flight.current = null;
    }
    timers.push(
      window.setTimeout(() => {
        swatDispatch({ type: "next" });
        if (phase === "swatted") setFlying(false);
        if (phase === "dropped") {
          // The toast comes up with the hand and outlives the beats.
          setToast(bin);
          clearTimeout(toastTimer.current);
          toastTimer.current = window.setTimeout(() => setToast(null), SWAT_MS.toast);
        }
      }, times[phase]),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per phase
  }, [swat.phase]);
  useEffect(() => () => flight.current?.cancel(), []);

  const iconState = (id: IconId): string | undefined => {
    if (swat.icon !== id) return undefined;
    switch (swat.phase) {
      case "over":
        return "crumple";
      case "dropped":
        return "sink";
      case "swatted":
        return reducedMotion() ? "return" : flying ? "fly" : "hidden";
      default:
        return undefined;
    }
  };
  const busy = swat.phase !== "idle";

  const iconProps = (id: IconId) => ({
    iconId: id,
    pos: toPx(icons.layout[id]),
    onDrop: (px: { x: number; y: number }) => onDrop(id, px),
    onDragMove: (at: { x: number; y: number }) => onDragMove(id, at),
    onArrow: (dir: Parameters<typeof icons.arrow>[1]) => icons.arrow(id, dir),
    state: iconState(id),
  });

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
        return <MusicWindow nowPlaying={site.nowPlaying} />;
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
    <div className="kos-desk" ref={deskRef} data-swat={busy ? swat.phase : undefined}>
      <div className="kos-dots" aria-hidden />
      <CrumpleFilter />
      <div className="kos-sheen" aria-hidden />
      <MenuBar
        resumeUrl={site.resumeUrl}
        activeTitle={top ? windowTitle(top, tiles) : undefined}
        onAbout={() => open("about")}
        onLock={onLock}
        onRestart={onRestart}
        onCleanUp={cleanUp}
      />

      <div className="kos-icons" id="kos-main" tabIndex={-1} aria-label="Desktop">
        <DeskIcon label="Projects" index={0} onOpen={(o) => open("projects", o)} {...iconProps("projects")}>
          <FolderGlyph tint="projects" badge={String(tiles.length).padStart(2, "0")} />
        </DeskIcon>
        <DeskIcon label="Hobbies" index={1} onOpen={(o) => open("hobbies", o)} {...iconProps("hobbies")}>
          <FolderGlyph tint="hobbies" />
        </DeskIcon>
        <DeskIcon label="About me" index={2} onOpen={(o) => open("about", o)} {...iconProps("about")}>
          <DocGlyph />
        </DeskIcon>
        <DeskIcon label="Contact" index={3} onOpen={(o) => open("contact", o)} {...iconProps("contact")}>
          <AppGlyph kind="contact" />
        </DeskIcon>
        {playing ? (
          <DeskIcon label="Now playing" index={4} onOpen={(o) => open("music", o)} {...iconProps("music")}>
            <AppGlyph kind="music" />
          </DeskIcon>
        ) : null}
        <DeskIcon label="Trash" index={5} quiet onOpen={(o) => open("trash", o)} {...iconProps("trash")} lid={busy && swat.where === "desk"}>
          <TrashGlyph />
        </DeskIcon>
      </div>
      <TrashSwat phase={swat.phase} bin={swat.bin} toast={toast} />

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

      <Dock windows={windows} onOpen={open} resumeUrl={site.resumeUrl} trashLid={busy && swat.where === "dock"} />
    </div>
  );
}

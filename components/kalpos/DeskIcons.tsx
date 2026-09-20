"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { Dir } from "@/lib/icons";
import { SCRAPPED } from "@/lib/scrapped";
import "@/app/kalpos-extras.css";
import type { Rect } from "@/lib/windows";
import { useDrag } from "./useDrag";

/*
 * The desk's icons, drawn in CSS exactly as card 2c draws them: the two
 * tinted folders (Projects with its count badge, Hobbies), the About me
 * document, the @ Contact tile, the ♪ Now playing tile and the mesh Trash
 * basket. Each is a <button>; a click (or Enter/Space) opens the
 * matching window from the icon's own rect. On the desk each icon sits at
 * an absolute `pos` (lib/icons.ts cells, owned by Desk through
 * useIconLayout): a drag moves it 1:1 anywhere on the desk and the release
 * hands the top-left to `onDrop`, which snaps it to the 22 px dot grid (2e:
 * "icons snap to the dots"), off the menubar, the dock and the other icons;
 * arrow keys hand `onArrow` one cell. `onDragMove` reports the pointer while
 * the hand holds it (the Trash hit-test). Positions are left/top, never a
 * transform: the boot's kos-pop fill holds the icon's transform after an
 * animated unlock, which silently defeated the first translate-based drag.
 * Windows open on a single click (spec), so the second click of a
 * double-click (inside DOUBLE_CLICK_MS) is ignored rather than re-sent.
 * The Trash is the one drawing that is an SVG (TrashGlyph below); its CSS
 * and the terminal's live in app/kalpos-extras.css, imported here.
 */

export const GRID = 22;
export const DOUBLE_CLICK_MS = 400;

export function FolderGlyph({ tint, badge }: { tint: "projects" | "hobbies"; badge?: string }) {
  return (
    <div className={`kos-folder kos-folder--${tint}`} aria-hidden>
      <span className="tab" />
      <span className="back" />
      <span className="slip" />
      <span className="front" />
      {badge ? <span className="badge">{badge}</span> : null}
    </div>
  );
}

export function DocGlyph() {
  return (
    <div className="kos-doc" aria-hidden>
      <i /><i /><i /><i /><i />
    </div>
  );
}

export function AppGlyph({ kind }: { kind: "contact" | "music" | "terminal" }) {
  return (
    <div className={`kos-app kos-app--${kind}`} aria-hidden>
      {kind === "contact" ? "@" : kind === "music" ? "♪" : ">_"}
    </div>
  );
}

/**
 * The Trash: an original drawing in the macOS idiom (not Apple's asset), a
 * slightly tapered wire-mesh basket in brushed silver with a thick top rim.
 * `full` shows crumpled paper above the rim; the desk derives it from
 * lib/scrapped.ts (the Trash window's list), so the icon and the window
 * always agree. Hover lifts the rim 220 ms (2e), in CSS on `.kos-bin-lid`.
 * `size="dock"` is the same drawing at the dock's tile size.
 */
export function TrashGlyph({
  state = SCRAPPED.length > 0 ? "full" : "empty",
  size = "desk",
}: {
  state?: "empty" | "full";
  size?: "desk" | "dock";
}) {
  const uid = `kbin${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (k: string) => `${uid}-${k}`;
  const px = size === "dock" ? { width: 26, height: 30 } : { width: 48, height: 56 };
  // Outer rim ellipse (24,11) 17×4.2; inner opening 14.6×3.1; body tapers to (24,49) 13.5×3.4.
  const body = "M7 11 L10.5 49 A13.5 3.4 0 0 0 37.5 49 L41 11 A17 4.2 0 0 1 7 11 Z";
  const rimFront = "M7 11 A17 4.2 0 0 0 41 11 L38.6 11 A14.6 3.1 0 0 1 9.4 11 Z";
  return (
    <svg
      className={`kos-bin kos-bin--${size}`}
      viewBox="0 0 48 56"
      {...px}
      aria-hidden
      focusable="false"
      data-state={state}
    >
      <defs>
        <linearGradient id={id("steel")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9a9aa0" />
          <stop offset="0.14" stopColor="#d9d9dd" />
          <stop offset="0.32" stopColor="#f3f3f5" />
          <stop offset="0.56" stopColor="#cbcbd0" />
          <stop offset="0.82" stopColor="#a4a4aa" />
          <stop offset="1" stopColor="#85858b" />
        </linearGradient>
        <linearGradient id={id("rim")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f7f7f9" />
          <stop offset="0.5" stopColor="#d3d3d8" />
          <stop offset="1" stopColor="#a6a6ac" />
        </linearGradient>
        <linearGradient id={id("base")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={id("hole")} cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#5a5a60" />
          <stop offset="1" stopColor="#232326" />
        </radialGradient>
        <pattern id={id("mesh")} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="translate(0.4 0.6)">
          <circle cx="1.6" cy="1.6" r="0.66" fill="#2c2c30" fillOpacity="0.42" />
        </pattern>
        <clipPath id={id("clip")}>
          <path d={body} />
        </clipPath>
      </defs>
      {/* ground shadow */}
      <ellipse cx="24" cy="52.6" rx="15" ry="2.3" fill="#2d2b2b" opacity="0.14" />
      {/* basket body: brushed steel, perforated mesh, inner shading, darker base */}
      <path d={body} fill={`url(#${id("steel")})`} />
      <path d={body} fill={`url(#${id("mesh")})`} clipPath={`url(#${id("clip")})`} />
      <path d={body} fill={`url(#${id("base")})`} />
      {/* mid rib and the base ring */}
      <path d="M8.9 31.6 A14.9 3.8 0 0 0 39.1 31.6" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.1" />
      <path d="M8.9 32.9 A14.9 3.8 0 0 0 39.1 32.9" fill="none" stroke="#3a3a3e" strokeOpacity="0.28" strokeWidth="0.9" />
      <path d="M10.5 49 A13.5 3.4 0 0 0 37.5 49" fill="none" stroke="#f4f4f6" strokeOpacity="0.7" strokeWidth="1.4" />
      {/* the rim, the opening and (when full) the paper: this group lifts on hover */}
      <g className="kos-bin-lid">
        <ellipse cx="24" cy="11" rx="17" ry="4.2" fill={`url(#${id("rim")})`} />
        <ellipse cx="24" cy="11" rx="14.6" ry="3.1" fill={`url(#${id("hole")})`} />
        {state === "full" ? (
          <g className="kos-bin-paper">
            <path d="M14.5 12.4 L16.2 6.2 L21.5 2.6 L27.8 3.4 L32.6 6.8 L33.4 12.4 Z" fill="#fbfbfc" stroke="#bdbdc3" strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M16.2 6.2 L21 8.4 L27.8 3.4 M21 8.4 L20.4 12.4 M21 8.4 L27.2 9.6 L32.6 6.8 M27.2 9.6 L28.6 12.4" fill="none" stroke="#d2d2d7" strokeWidth="0.7" strokeLinejoin="round" />
            <path d="M29.6 12.4 L31.4 6.4 L36.8 5.2 L39.4 9 L38.6 12.4 Z" fill="#f4efe0" stroke="#c9c2ad" strokeWidth="0.7" strokeLinejoin="round" />
            <path d="M31.4 6.4 L35.2 8.2 L39.4 9 M35.2 8.2 L34.4 12.4" fill="none" stroke="#dcd5c0" strokeWidth="0.6" />
          </g>
        ) : null}
        <path d={rimFront} fill={`url(#${id("rim")})`} />
        <path d="M9.4 11 A14.6 3.1 0 0 1 38.6 11" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.9" />
        <path d="M7 11 A17 4.2 0 0 0 41 11" fill="none" stroke="#6f6f75" strokeOpacity="0.5" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

export function rectOf(el: Element | null): Rect | undefined {
  if (!el || typeof el.getBoundingClientRect !== "function") return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/**
 * One desk icon. `onOpen` receives the icon's rect so the window can grow
 * from it. Dragging is optional (the phone grid does not drag).
 */
export function DeskIcon({
  label,
  onOpen,
  children,
  quiet = false,
  draggable = true,
  index = 0,
  pos,
  onDrop,
  onDragMove,
  onDragEnd,
  onArrow,
  state,
  iconId,
  lid = false,
}: {
  label: string;
  onOpen: (origin?: Rect) => void;
  children: React.ReactNode;
  quiet?: boolean;
  draggable?: boolean;
  index?: number;
  /** Absolute top-left on the desk (px). Without it the icon flows in its parent (the phone grid). */
  pos?: { x: number; y: number };
  /** The release: the icon's unsnapped top-left. */
  onDrop?: (px: { x: number; y: number }) => void;
  /** Every move while held: the pointer's client position. */
  onDragMove?: (at: { x: number; y: number }) => void;
  /** The pointer let go (before onDrop) or the drag was cancelled. */
  onDragEnd?: () => void;
  onArrow?: (dir: Dir) => void;
  /** Extra data-state on the button (the Trash swat's crumple / sink / fly / return beats). */
  state?: string;
  /** data-icon, so the desk can find the element for the swat's flight. */
  iconId?: string;
  /** The Trash: its lid lifts while another icon is held over it. */
  lid?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [delta, setDelta] = useState<{ x: number; y: number } | null>(null);
  const [dip, setDip] = useState(false);
  const lastOpen = useRef(0);
  /** The click the browser sends after a drag's release is not an open. */
  const dragged = useRef(false);

  const open = useCallback(() => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastOpen.current < DOUBLE_CLICK_MS) return;
    lastOpen.current = now;
    // 2e: the icon dips to .94 for 90 ms before the window grows out of it.
    setDip(true);
    setTimeout(() => setDip(false), 90);
    onOpen(rectOf(ref.current));
  }, [onOpen]);

  const drag = useDrag({
    // The icon is its own only click target, so it may hold the pointer from the press (a fast flick still drags).
    capture: "down",
    onMove: (dx, dy, at) => {
      setDelta({ x: dx, y: dy });
      onDragMove?.(at);
    },
    onEnd: ({ dx, dy, click }) => {
      setDelta(null);
      if (click) return;
      dragged.current = true;
      // A pointer that sends no click after the release (some touch paths) must not swallow the next tap.
      setTimeout(() => (dragged.current = false), 300);
      onDragEnd?.();
      if (pos) onDrop?.({ x: pos.x + dx, y: pos.y + dy });
    },
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!onArrow || e.metaKey || e.ctrlKey || e.altKey) return;
    const dir: Dir | null = e.key === "ArrowUp" ? "up" : e.key === "ArrowDown" ? "down" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowRight" ? "right" : null;
    if (!dir) return;
    e.preventDefault();
    onArrow(dir);
  };

  const style: React.CSSProperties = { ["--i" as string]: index };
  if (pos) {
    style.left = pos.x + (delta?.x ?? 0);
    style.top = pos.y + (delta?.y ?? 0);
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`kos-icon${quiet ? " kos-icon--quiet" : ""}`}
      style={style}
      data-dragging={delta ? "true" : undefined}
      data-dip={dip ? "true" : undefined}
      data-state={state}
      data-icon={iconId}
      data-lid={lid ? "up" : undefined}
      onClick={open}
      onKeyDown={onKeyDown}
      {...(draggable && pos ? drag : {})}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

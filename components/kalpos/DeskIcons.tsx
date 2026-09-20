"use client";

import { useCallback, useId, useRef, useState } from "react";
import { SCRAPPED } from "@/lib/scrapped";
import "@/app/kalpos-extras.css";
import type { Rect } from "@/lib/windows";
import { useDrag } from "./useDrag";

/*
 * The desk's icons, drawn in CSS exactly as card 2c draws them: the two
 * tinted folders (Projects with its count badge, Hobbies), the About me
 * document, the @ Contact tile, the ♪ Now playing tile and the mesh Trash
 * basket. Each is a <button>; a click (or Enter/Space) opens the
 * matching window from the icon's own rect, a drag moves it and, on
 * release, snaps it to the 22 px dot grid (2e: "icons snap to the dots").
 * The Trash is the one drawing that is an SVG (TrashGlyph below); its CSS
 * and the terminal's live in app/kalpos-extras.css, imported here.
 */

export const GRID = 22;

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
          <circle cx="1.6" cy="1.6" r="0.72" fill="#2c2c30" fillOpacity="0.5" />
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
}: {
  label: string;
  onOpen: (origin?: Rect) => void;
  children: React.ReactNode;
  quiet?: boolean;
  draggable?: boolean;
  index?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dip, setDip] = useState(false);
  const base = useRef({ x: 0, y: 0 });

  const open = useCallback(() => {
    // 2e: the icon dips to .94 for 90 ms before the window grows out of it.
    setDip(true);
    setTimeout(() => setDip(false), 90);
    onOpen(rectOf(ref.current));
  }, [onOpen]);

  const drag = useDrag({
    onStart: () => {
      base.current = pos;
    },
    onMove: (dx, dy) => {
      setDragging(true);
      setPos({ x: base.current.x + dx, y: base.current.y + dy });
    },
    onEnd: ({ dx, dy, click }) => {
      setDragging(false);
      if (click) {
        setPos(base.current);
        return;
      }
      setPos({
        x: Math.round((base.current.x + dx) / GRID) * GRID,
        y: Math.round((base.current.y + dy) / GRID) * GRID,
      });
    },
  });

  return (
    <button
      ref={ref}
      type="button"
      className={`kos-icon${quiet ? " kos-icon--quiet" : ""}`}
      style={{ transform: pos.x || pos.y ? `translate(${pos.x}px, ${pos.y}px)` : undefined, ["--i" as string]: index }}
      data-dragging={dragging ? "true" : undefined}
      data-dip={dip ? "true" : undefined}
      onClick={open}
      {...(draggable ? drag : {})}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

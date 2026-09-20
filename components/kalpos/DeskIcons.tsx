"use client";

import { useCallback, useRef, useState } from "react";
import type { Rect } from "@/lib/windows";
import { useDrag } from "./useDrag";

/*
 * The desk's icons, drawn in CSS exactly as card 2c draws them: the two
 * tinted folders (Projects with its count badge, Hobbies), the About me
 * document, the @ Contact tile, the ♪ Now playing tile and the frosted Trash
 * with its lid. Each is a <button>; a click (or Enter/Space) opens the
 * matching window from the icon's own rect, a drag moves it and, on
 * release, snaps it to the 22 px dot grid (2e: "icons snap to the dots").
 * Windows open on a single click (spec), so the second click of a
 * double-click (inside DOUBLE_CLICK_MS) is ignored rather than re-sent.
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

export function AppGlyph({ kind }: { kind: "contact" | "music" }) {
  return (
    <div className={`kos-app kos-app--${kind}`} aria-hidden>
      {kind === "contact" ? "@" : "♪"}
    </div>
  );
}

export function TrashGlyph() {
  return (
    <div className="kos-trash" aria-hidden>
      <span />
    </div>
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
  const lastOpen = useRef(0);

  const open = useCallback(() => {
    const now = Date.now();
    if (now - lastOpen.current < DOUBLE_CLICK_MS) return;
    lastOpen.current = now;
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

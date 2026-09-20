"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MS, reducedMotion } from "@/lib/motion";
import type { Rect, WindowId } from "@/lib/windows";
import { useDrag } from "./useDrag";

/*
 * Card 2d's window: #f8f4f4, radius 12, the lg shadow when focused and the
 * sm shadow + grey traffic lights behind (the "stacked windows" effect). Two
 * chromes: "titlebar" (38 px bar, lights left, title centred: the About me
 * window in 2d) and "sidebar" (no bar; the Projects window draws its lights
 * inside its frosted sidebar through <Lights/> and drags by the sidebar's top
 * and the main header through useWindowDrag()).
 *
 * Motion (2e): open grows from the origin rect in 380 ms, content fades in
 * 120 ms behind the frame; close is in place (scale 1 → .96, opacity 1 → 0,
 * 160 ms, like macOS); minimise travels into the window's own dock tile over
 * 320 ms; focus is 180 ms (CSS). Drag is 1:1 and coasts with the release
 * velocity. Reduced motion: appear and vanish in place.
 *
 * Each beat has its own keyframes (kos-win-open / kos-win-close / kos-win-min)
 * and data-anim runs open → close | min exactly once. CSS restarts an
 * animation only when its NAME changes: the first version played the close as
 * `kos-win-open … reverse`, which merely edited the finished open animation,
 * whose fill then jumped the frame to the origin rect for 320 ms before the
 * unmount ("goes to the folder, minimises, then closes"; incidents.md
 * 2026-09-20). A running open animation is cancelled before a close, and a
 * leaving window ignores every further close / minimise.
 *
 * Accessibility: role=dialog with aria-label, Esc closes the focused window,
 * Tab wraps inside the window, the dialog itself takes focus when it opens.
 */

type Ctx = {
  focused: boolean;
  close: () => void;
  minimize: () => void;
  zoom: () => void;
  drag: ReturnType<typeof useDrag>;
};
const WindowCtx = createContext<Ctx | null>(null);

export function useWindowDrag() {
  return useContext(WindowCtx)?.drag;
}

/** The three traffic lights. Rendered by the frame (titlebar chrome) or by a sidebar. */
export function Lights() {
  const ctx = useContext(WindowCtx);
  if (!ctx) return null;
  return (
    <span className="kos-lights">
      <button type="button" className="kos-light kos-light--close" aria-label="Close" onClick={ctx.close} />
      <button type="button" className="kos-light kos-light--min" aria-label="Minimise" onClick={ctx.minimize} />
      <button type="button" className="kos-light kos-light--zoom" aria-label="Zoom" onClick={ctx.zoom} />
    </span>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export default function Window({
  id,
  title,
  focused,
  z,
  origin,
  onClose,
  onFocus,
  onMinimize,
  width,
  height,
  cascade = 0,
  closeRequest = 0,
  chrome = "titlebar",
  className = "",
  children,
}: {
  id: WindowId;
  title: string;
  focused: boolean;
  z: number;
  origin?: Rect;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  width: number;
  height?: number;
  /** Nth open window: 2d places the first at top 86, centred; later ones step 28 px down and right. */
  cascade?: number;
  /** Bumped by the parent when Esc is pressed outside the window: close with the usual animation. */
  closeRequest?: number;
  chrome?: "titlebar" | "sidebar";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The server cannot know the viewport, so the first render places the
  // window with CSS (clamp around the centre); the layout effect below reads
  // the resulting rect into numbers so dragging can take over. No hidden
  // frame: a deep-linked case study is visible from the first paint.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [anim, setAnim] = useState<"open" | "close" | "min" | "place" | null>(null);
  const [dragging, setDragging] = useState(false);
  const base = useRef({ x: 24, y: 86 });
  const raf = useRef(0);
  const leaving = useRef(false);

  // Place, then open: FLIP from the origin rect (the icon or tile) to the window's own rect.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const placedRect = el.getBoundingClientRect();
    setPos({ x: Math.round(placedRect.left), y: Math.round(placedRect.top) });
    if (reducedMotion() || !origin || typeof el.getBoundingClientRect !== "function") {
      setAnim("place");
      return;
    }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) {
      setAnim("place");
      return;
    }
    el.style.setProperty("--from-x", `${origin.x - r.left}px`);
    el.style.setProperty("--from-y", `${origin.y - r.top}px`);
    el.style.setProperty("--from-sx", `${Math.max(0.05, origin.w / r.width)}`);
    el.style.setProperty("--from-sy", `${Math.max(0.05, origin.h / r.height)}`);
    setAnim("open");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (focused) {
      const el = ref.current;
      if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    }
  }, [focused]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /** One exit per window: the first close or minimise wins; the rest are ignored until it is done. */
  const leave = useCallback((run: (el: HTMLElement) => number | null, done: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    const finish = () => {
      leaving.current = false;
      done();
    };
    const el = ref.current;
    if (reducedMotion() || !el || typeof el.getBoundingClientRect !== "function") {
      finish();
      return;
    }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) {
      finish();
      return;
    }
    // Whatever is still playing (the open FLIP, a place fade) is cancelled so only this beat runs.
    el.getAnimations?.().forEach((a) => a.cancel());
    const ms = run(el);
    if (ms === null) finish();
    else setTimeout(finish, ms);
  }, []);

  /** Close: in place, scale 1 → .96 and opacity 1 → 0 over MS.winClose, then the unmount. */
  const close = useCallback(
    () =>
      leave(() => {
        setAnim("close");
        return MS.winClose;
      }, onClose),
    [leave, onClose],
  );
  const lastRequest = useRef(closeRequest);
  useEffect(() => {
    if (closeRequest !== lastRequest.current) {
      lastRequest.current = closeRequest;
      close();
    }
  }, [closeRequest, close]);

  /** Minimise: the frame travels into its own dock tile (data-window), or the dock's centre when it has none. */
  const minimize = useCallback(
    () =>
      leave(
        (el) => {
          const key = id.startsWith("case:") ? "projects" : id;
          const tile = document.querySelector(`.kos-dock-item[data-window="${key}"]`) ?? document.querySelector(".kos-dock");
          const t = tile?.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          if (!t || !r.width || !r.height) return null;
          const target = tile?.classList.contains("kos-dock-item") ? t : { left: t.left + t.width / 2 - 27, top: t.top, width: 54, height: 54 };
          el.style.setProperty("--from-x", `${target.left - r.left}px`);
          el.style.setProperty("--from-y", `${target.top - r.top}px`);
          el.style.setProperty("--from-sx", `${Math.max(0.05, target.width / r.width)}`);
          el.style.setProperty("--from-sy", `${Math.max(0.05, target.height / r.height)}`);
          setAnim("min");
          return MS.minimize;
        },
        () => {
          setAnim(null);
          onMinimize();
        },
      ),
    [leave, id, onMinimize],
  );
  const zoom = useCallback(() => setZoomed((v) => !v), []);

  const drag = useDrag({
    onStart: () => {
      base.current = pos ?? { x: ref.current?.offsetLeft ?? 24, y: ref.current?.offsetTop ?? 86 };
      cancelAnimationFrame(raf.current);
      onFocus();
    },
    onMove: (dx, dy) => {
      setDragging(true);
      setZoomed(false);
      setPos({ x: base.current.x + dx, y: base.current.y + dy });
    },
    onEnd: ({ dx, dy, vx, vy, click }) => {
      setDragging(false);
      if (click) return;
      let x = base.current.x + dx;
      let y = base.current.y + dy;
      // Coast with the throw velocity and settle (2e), clamped to the desk.
      const bounds = () => {
        const w = ref.current?.offsetWidth ?? width;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return { minX: 160 - w, maxX: vw - 160, minY: 34, maxY: vh - 120 };
      };
      // A throw faster than 2.5 px/ms is a synthetic jump, not a hand; cap it.
      const cap = (v: number) => Math.max(-2.5, Math.min(2.5, v));
      let velX = reducedMotion() ? 0 : cap(vx);
      let velY = reducedMotion() ? 0 : cap(vy);
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(32, now - last);
        last = now;
        x += velX * dt;
        y += velY * dt;
        velX *= Math.pow(0.92, dt / 16);
        velY *= Math.pow(0.92, dt / 16);
        const b = bounds();
        x = clamp(x, b.minX, b.maxX);
        y = clamp(y, b.minY, b.maxY);
        setPos({ x, y });
        if (Math.abs(velX) > 0.02 || Math.abs(velY) > 0.02) raf.current = requestAnimationFrame(step);
      };
      const b = bounds();
      x = clamp(x, b.minX, b.maxX);
      y = clamp(y, b.minY, b.maxY);
      setPos({ x, y });
      if (velX || velY) raf.current = requestAnimationFrame(step);
    },
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !n.hasAttribute("disabled"));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const ctx: Ctx = { focused, close, minimize, zoom, drag };
  const step = (cascade % 6) * 28;
  const style: React.CSSProperties = zoomed
    ? { left: 12, top: 44, width: "calc(100vw - 24px)", height: "calc(100vh - 140px)", zIndex: z }
    : pos
      ? { left: pos.x, top: pos.y, width, height, zIndex: z }
      : {
          left: `clamp(24px, calc(50% - ${width / 2}px + ${step}px), calc(100vw - ${width}px - 12px))`,
          top: 86 + step,
          width,
          height,
          zIndex: z,
        };

  return (
    <WindowCtx.Provider value={ctx}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        tabIndex={-1}
        data-window={id}
        data-focused={focused ? "true" : "false"}
        data-anim={anim ?? undefined}
        data-dragging={dragging ? "true" : undefined}
        className={`kos-window kos-window--${chrome} ${className}`.trim()}
        style={style}
        onPointerDownCapture={() => {
          if (!focused) onFocus();
        }}
        onKeyDown={onKeyDown}
      >
        {chrome === "titlebar" ? (
          <div className="kos-window-titlebar" {...drag} onDoubleClick={zoom}>
            <Lights />
            <span className="kos-window-title">{title}</span>
            <span className="kos-window-spacer" aria-hidden />
          </div>
        ) : null}
        <div className="kos-window-content">{children}</div>
      </div>
    </WindowCtx.Provider>
  );
}

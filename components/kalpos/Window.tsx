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
 * 120 ms behind the frame; close is the 320 ms reverse; minimise runs the
 * reverse toward the dock; focus is 180 ms (CSS). Drag is 1:1 and coasts
 * with the release velocity. Reduced motion: appear and vanish in place.
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
  defaultPos,
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
  defaultPos?: { x: number; y: number };
  chrome?: "titlebar" | "sidebar";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => defaultPos ?? { x: 24, y: 60 });
  const [zoomed, setZoomed] = useState(false);
  const [anim, setAnim] = useState<"open" | "close" | "place" | null>(null);
  const [dragging, setDragging] = useState(false);
  const base = useRef(pos);
  const raf = useRef(0);
  const leaving = useRef(false);

  // Open: FLIP from the origin rect (the icon or tile) to the window's own rect.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
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

  const leave = useCallback(
    (toward: Rect | undefined, done: () => void) => {
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
      const t = toward ?? origin;
      if (t && r.width && r.height) {
        el.style.setProperty("--from-x", `${t.x - r.left}px`);
        el.style.setProperty("--from-y", `${t.y - r.top}px`);
        el.style.setProperty("--from-sx", `${Math.max(0.05, t.w / r.width)}`);
        el.style.setProperty("--from-sy", `${Math.max(0.05, t.h / r.height)}`);
        setAnim("close");
        setTimeout(finish, MS.close);
      } else {
        finish();
      }
    },
    [origin],
  );

  const close = useCallback(() => leave(undefined, onClose), [leave, onClose]);
  const minimize = useCallback(() => {
    const dock = typeof document !== "undefined" ? document.querySelector(".kos-dock") : null;
    const r = dock?.getBoundingClientRect();
    leave(r ? { x: r.left + r.width / 2 - 27, y: r.top, w: 54, h: 54 } : undefined, () => {
      setAnim(null);
      onMinimize();
    });
  }, [leave, onMinimize]);
  const zoom = useCallback(() => setZoomed((v) => !v), []);

  const drag = useDrag({
    onStart: () => {
      base.current = pos;
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
        return { minX: 12 - w + 80, maxX: vw - 80, minY: 34, maxY: vh - 60 };
      };
      let velX = reducedMotion() ? 0 : vx;
      let velY = reducedMotion() ? 0 : vy;
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
  const style: React.CSSProperties = zoomed
    ? { left: 12, top: 44, width: "calc(100vw - 24px)", height: "calc(100vh - 140px)", zIndex: z }
    : { left: pos.x, top: pos.y, width, height, zIndex: z };

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

"use client";

import { useCallback, useRef } from "react";

export interface DragEnd {
  /** Total movement since pointerdown. */
  dx: number;
  dy: number;
  /** Release velocity in px/ms (for inertia, 2e "Drag"). */
  vx: number;
  vy: number;
  /** True when the pointer moved less than the click threshold: treat as a click. */
  click: boolean;
}

/**
 * Pointer drag that follows the cursor 1:1 (no easing) and reports the
 * throw velocity on release. Mouse, touch and pen through pointer events;
 * capture keeps the drag alive when the pointer leaves the element.
 *
 * The pointer is captured only once the drag threshold is crossed, never on
 * pointerdown. Capturing on pointerdown retargets pointerup, mouseup and the
 * click to the handle (Chrome applies the pending capture before the next
 * pointer event, and a click goes to the common ancestor of its mousedown and
 * mouseup targets), so a held click on a <button> inside the handle, the
 * window's traffic lights, never reached the button (incidents.md, 2026-09-20).
 */
export function useDrag({
  onStart,
  onMove,
  onEnd,
  threshold = 4,
}: {
  onStart?: () => void;
  onMove: (dx: number, dy: number) => void;
  onEnd: (end: DragEnd) => void;
  threshold?: number;
}) {
  const state = useRef<{
    id: number;
    x0: number;
    y0: number;
    lastX: number;
    lastY: number;
    lastT: number;
    vx: number;
    vy: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      state.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastY: e.clientY, lastT: e.timeStamp, vx: 0, vy: 0, moved: false };
      onStart?.();
    },
    [onStart],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = state.current;
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.x0;
      const dy = e.clientY - s.y0;
      if (!s.moved && Math.hypot(dx, dy) < threshold) return;
      if (!s.moved) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // jsdom / unsupported: the drag still works while the pointer stays over the element
        }
      }
      s.moved = true;
      const dt = Math.max(1, e.timeStamp - s.lastT);
      // Exponential smoothing keeps the velocity honest on a jittery release.
      s.vx = 0.6 * ((e.clientX - s.lastX) / dt) + 0.4 * s.vx;
      s.vy = 0.6 * ((e.clientY - s.lastY) / dt) + 0.4 * s.vy;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.lastT = e.timeStamp;
      onMove(dx, dy);
    },
    [onMove, threshold],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = state.current;
      if (!s || e.pointerId !== s.id) return;
      state.current = null;
      if (s.moved) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // see above
        }
      }
      // A stale velocity (pointer held still before release) should not throw the window.
      const stale = e.timeStamp - s.lastT > 80;
      onEnd({ dx: e.clientX - s.x0, dy: e.clientY - s.y0, vx: stale ? 0 : s.vx, vy: stale ? 0 : s.vy, click: !s.moved });
    },
    [onEnd],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

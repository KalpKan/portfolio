"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  cellBounds,
  DEFAULT_LAYOUT,
  fitLayout,
  loadLayout,
  moveIcon,
  pick,
  placeIcon,
  saveLayout,
  toCell,
  type Dir,
  type IconId,
  type IconLayout,
} from "@/lib/icons";

/**
 * The desk's icon layout: restored from localStorage `kalpos:icons` before
 * the first paint (re-fitted to this viewport, and again on resize), every
 * change persisted per icon. Only the icons on the desk right now (`present`)
 * count as obstacles: a hidden Now playing keeps its saved cell. Lock and
 * Restart leave it alone (the desk stays mounted and the storage holds it);
 * Clean Up puts the default card 2c grid back.
 */
export function useIconLayout(present: IconId[]) {
  const [layout, setLayout] = useState<IconLayout>(DEFAULT_LAYOUT);
  const presentRef = useRef(present);
  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  const bounds = () => cellBounds(window.innerWidth, window.innerHeight);
  const storage = () => (typeof localStorage === "undefined" ? undefined : localStorage);

  const commit = useCallback((next: IconLayout) => {
    setLayout(next);
    saveLayout(storage(), next);
  }, []);

  useLayoutEffect(() => {
    const loaded = loadLayout(storage());
    setLayout({ ...loaded, ...fitLayout(pick(loaded, presentRef.current), bounds()) });
  }, []);

  useEffect(() => {
    const onResize = () => setLayout((l) => ({ ...l, ...fitLayout(pick(l, presentRef.current), bounds()) }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /** A drop at `px` (the icon's top-left): snapped to the grid, nudged off any other icon, kept on the desk. */
  const drop = useCallback(
    (id: IconId, px: { x: number; y: number }) => {
      const cell = placeIcon(pick(layout, presentRef.current), id, toCell(px), bounds());
      commit({ ...layout, [id]: cell });
      return cell;
    },
    [layout, commit],
  );

  const arrow = useCallback(
    (id: IconId, dir: Dir) => {
      const cell = moveIcon(pick(layout, presentRef.current), id, dir, bounds());
      if (cell.c === layout[id].c && cell.r === layout[id].r) return;
      commit({ ...layout, [id]: cell });
    },
    [layout, commit],
  );

  const cleanUp = useCallback(() => commit({ ...DEFAULT_LAYOUT, ...fitLayout(pick(DEFAULT_LAYOUT, presentRef.current), bounds()) }), [commit]);

  return { layout, drop, arrow, cleanUp };
}

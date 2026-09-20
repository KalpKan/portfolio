"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ended, initialPlayer, playerReducer, positionMs, type PlayerInput, type PlayerState } from "@/lib/player";

/*
 * One player for the whole desk: the NOW PLAYING widget and the Music window
 * (and the phone sheet) read the same song and the same progress, so pressing
 * ⏭ in the window moves the widget too. A module-level store rather than
 * state lifted into Desk.tsx keeps the desk's own component untouched.
 *
 * The store ticks every 250 ms while something is playing (nothing while
 * paused) and advances to the next song when the fake loop runs out.
 */

type Snapshot = { state: PlayerState; now: number };

const listeners = new Set<() => void>();
let snapshot: Snapshot = { state: initialPlayer(0), now: 0 };
let count = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let booted = false;

function emit() {
  for (const l of listeners) l();
}

function tick() {
  const now = Date.now();
  let state = snapshot.state;
  if (ended(state, now)) state = playerReducer(state, { type: "next", now }, count);
  snapshot = { state, now };
  emit();
}

function syncTimer() {
  const shouldRun = listeners.size > 0 && !snapshot.state.paused && count > 0;
  if (shouldRun && timer === null) timer = setInterval(tick, 250);
  if (!shouldRun && timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  syncTimer();
  return () => {
    listeners.delete(l);
    syncTimer();
  };
}

function getSnapshot() {
  return snapshot;
}

/** The server snapshot: song 0, position 0, playing (matches the first client paint). */
const SERVER: Snapshot = { state: initialPlayer(0), now: 0 };
function getServerSnapshot() {
  return SERVER;
}

export function dispatchPlayer(action: PlayerInput & { now?: number }) {
  const now = action.now ?? Date.now();
  const next = playerReducer(snapshot.state, { ...action, now }, count);
  if (next === snapshot.state) return;
  snapshot = { state: next, now };
  emit();
  syncTimer();
}

/** Tests: put the player back to song 0 at position 0, playing. */
export function resetPlayer(now = Date.now()) {
  snapshot = { state: initialPlayer(now), now };
  booted = false;
  emit();
  syncTimer();
}

/**
 * Subscribe to the player. `length` is the playlist length (the reducer's
 * wrap point). Returns the state, the position in ms and a dispatch bound to
 * the wall clock.
 */
export function usePlayer(length: number) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    count = length;
    // The first mount starts the clock from a real timestamp (the module
    // initialised with 0, which would otherwise read as hours elapsed).
    if (!booted) {
      booted = true;
      snapshot = { state: initialPlayer(Date.now()), now: Date.now() };
      emit();
    }
    syncTimer();
  }, [length]);
  const dispatch = useCallback((action: PlayerInput) => dispatchPlayer(action), []);
  return { state: snap.state, position: positionMs(snap.state, snap.now), dispatch };
}

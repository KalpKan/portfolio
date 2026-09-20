/**
 * The Music app's transport, pure and clock-free: a reducer over
 * { index, paused, offset, since } where `offset` is the position (ms) into
 * the current song when it was last resumed and `since` the wall-clock time
 * of that resume. Every action carries `now` so the tests never wait. There
 * is no audio: every song is a fake TRACK_MS loop drawn as a progress line.
 *
 * The cover art is generated, never fetched: a two-tone gradient from a hash
 * of "title — artist" plus the song's initials (no copyrighted art on the
 * desk).
 */

/** Every song "lasts" 3:20; the progress line loops on it. */
export const TRACK_MS = 200_000;

export type PlayerState = {
  index: number;
  paused: boolean;
  /** Position into the song when it was last resumed (or paused). */
  offset: number;
  /** Wall-clock time of the last resume; meaningless while paused. */
  since: number;
};

/** What a button asks for; the store stamps `now` on it. */
export type PlayerInput = { type: "next" | "prev" | "toggle" | "pause" | "play" } | { type: "select"; index: number };
export type PlayerAction = PlayerInput & { now: number };

export function initialPlayer(now: number): PlayerState {
  return { index: 0, paused: false, offset: 0, since: now };
}

/** Milliseconds into the current song at `now`, clamped to the loop length. */
export function positionMs(state: PlayerState, now: number): number {
  const pos = state.paused ? state.offset : state.offset + Math.max(0, now - state.since);
  return Math.min(TRACK_MS, Math.max(0, pos));
}

/** True once the fake loop has run out; the store then advances. */
export function ended(state: PlayerState, now: number): boolean {
  return !state.paused && positionMs(state, now) >= TRACK_MS;
}

function restart(state: PlayerState, index: number, now: number): PlayerState {
  return { ...state, index, offset: 0, since: now };
}

/**
 * `count` is the playlist length; next/prev wrap around it, select clamps to
 * it. Skipping keeps the paused/playing state (as a real player does); a
 * select always plays.
 */
export function playerReducer(state: PlayerState, action: PlayerAction, count: number): PlayerState {
  if (count <= 0) return state;
  switch (action.type) {
    case "next":
      return restart(state, (state.index + 1) % count, action.now);
    case "prev":
      return restart(state, (state.index - 1 + count) % count, action.now);
    case "select": {
      const index = Math.min(count - 1, Math.max(0, action.index));
      return { ...restart(state, index, action.now), paused: false };
    }
    case "pause":
      if (state.paused) return state;
      return { ...state, paused: true, offset: positionMs(state, action.now) };
    case "play":
      if (!state.paused) return state;
      return { ...state, paused: false, since: action.now };
    case "toggle":
      return playerReducer(state, { type: state.paused ? "play" : "pause", now: action.now }, count);
  }
}

/** "m:ss" for a position or a length in milliseconds. */
export function formatMs(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ---------------------------------------------------------------- cover */

export type Cover = {
  /** CSS background for the square. */
  background: string;
  /** Up to two letters drawn over it. */
  initials: string;
  /** For tests and the alt text: the hash the colours came from. */
  hash: number;
};

/** FNV-1a over the UTF-16 code units; deterministic across runs and engines. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The first letter of the first two words of the title, upper-cased. */
export function initialsOf(title: string): string {
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * A smooth two-tone gradient from the hash: the first hue anywhere on the
 * wheel (the hash is remixed by the golden-ratio constant first, Fibonacci
 * hashing, so similar titles land far apart), the second 40–100° along it,
 * both kept saturated and mid-dark so white initials read on top; the angle
 * is taken from the hash too so no two covers lean the same way.
 */
export function coverFor(title: string, artist: string): Cover {
  const hash = hashString(`${title} — ${artist}`);
  const h1 = (Math.imul(hash, 0x9e3779b1) >>> 0) % 360;
  const h2 = (h1 + 40 + ((hash >>> 9) % 60)) % 360;
  const angle = 115 + ((hash >>> 15) % 90);
  const l1 = 48 + ((hash >>> 21) % 10);
  const background = `linear-gradient(${angle}deg, hsl(${h1} 70% ${l1}%) 0%, hsl(${h2} 72% ${l1 - 18}%) 100%)`;
  return { background, initials: initialsOf(title), hash };
}

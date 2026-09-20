import type { IconId } from "./icons";
import type { Rect } from "./windows";

/**
 * The Trash swat (2026-09-20, Kalp: "if you try to drag and drop things into
 * the trash can, the folder crumples up, and if it goes in the trash can,
 * there's a hand that swats it out, and it ends up back on the desktop").
 *
 * Pure parts, tested without the DOM: the hit test (the pointer over the desk
 * Trash or the dock's Trash tile), the state machine
 * idle → over → dropped → swatted → home → idle, the timings, the flight
 * (a quadratic arc from the basket up and back to the icon's home) and the
 * whoosh (Web Audio, an original noise burst). Desk.tsx runs it: while an
 * icon is held over the trash the lid lifts and the icon crumples (CSS,
 * 240 ms); on a drop inside it sinks (200 ms), the hand pops out (260 ms),
 * swats it along the arc (520 ms, un-crumpling), the hand withdraws (200 ms)
 * and the lid closes; a toast under the trash for 1.6 s; PostHog
 * `trash_swat {icon}`. Reduced motion: the icon returns with a 200 ms fade
 * and the hand still shows briefly.
 */

export const SWAT_MS = {
  crumple: 240,
  sink: 200,
  hand: 260,
  fly: 520,
  withdraw: 200,
  toast: 1600,
  /** Reduced motion: the return fade. */
  fade: 200,
} as const;

export const SWAT_TOAST = "Nice try — everything on this desk shipped.";

/** Slop around a trash rect so a hand that lets go just beside the rim still counts. */
const SLOP = 6;

export function hitTrash(at: { x: number; y: number }, bins: Rect[]): boolean {
  return hitIndex(at, bins) >= 0;
}

/** Which of `bins` the pointer is over (-1 for none). */
export function hitIndex(at: { x: number; y: number }, bins: Rect[]): number {
  return bins.findIndex((b) => at.x >= b.x - SLOP && at.x <= b.x + b.w + SLOP && at.y >= b.y - SLOP && at.y <= b.y + b.h + SLOP);
}

export type SwatPhase = "idle" | "over" | "dropped" | "swatted" | "home";

export type Bin = "desk" | "dock";

export interface SwatState {
  phase: SwatPhase;
  icon: IconId | null;
  /** Which trash: the desk icon or the dock tile (its lid lifts). */
  where: Bin | null;
  /** The icon's top-left where the hand let go. */
  at: { x: number; y: number } | null;
  /** The trash it went into (desk icon or dock tile). */
  bin: Rect | null;
  /** The icon's home top-left (its grid cell before the drag). */
  home: { x: number; y: number } | null;
}

export const IDLE_SWAT: SwatState = { phase: "idle", icon: null, where: null, at: null, bin: null, home: null };

export type SwatAction =
  | { type: "hover"; icon: IconId; over: boolean; where?: Bin }
  | { type: "drop"; icon: IconId; inside: boolean; at: { x: number; y: number }; bin: Rect; home: { x: number; y: number }; where?: Bin }
  /** The current phase's timer elapsed. */
  | { type: "next" }
  | { type: "reset" };

const busy = (p: SwatPhase) => p === "dropped" || p === "swatted" || p === "home";

export function swatReducer(state: SwatState, action: SwatAction): SwatState {
  switch (action.type) {
    case "hover":
      if (busy(state.phase)) return state;
      if (!action.over) return state.phase === "idle" ? state : IDLE_SWAT;
      if (state.phase === "over" && state.icon === action.icon && state.where === (action.where ?? "desk")) return state;
      return { ...IDLE_SWAT, phase: "over", icon: action.icon, where: action.where ?? "desk" };
    case "drop":
      if (busy(state.phase)) return state;
      // The Trash cannot be thrown into itself.
      if (!action.inside || action.icon === "trash") return IDLE_SWAT;
      return { phase: "dropped", icon: action.icon, where: action.where ?? "desk", at: action.at, bin: action.bin, home: action.home };
    case "next":
      switch (state.phase) {
        case "dropped":
          return { ...state, phase: "swatted" };
        case "swatted":
          return { ...state, phase: "home" };
        case "home":
          return IDLE_SWAT;
        default:
          return state;
      }
    case "reset":
      return IDLE_SWAT;
  }
}

/** How long each busy phase lasts before `next`. swatted = the hand's pop, then the flight. */
export function swatTimeline(reduced: boolean): Record<"dropped" | "swatted" | "home", number> {
  return reduced
    ? { dropped: 0, swatted: SWAT_MS.hand + SWAT_MS.fade, home: SWAT_MS.withdraw }
    : { dropped: SWAT_MS.sink, swatted: SWAT_MS.hand + SWAT_MS.fly, home: SWAT_MS.withdraw };
}

/** How high the arc rises above the higher of its two ends. */
const ARC_RISE = 140;

/** A quadratic Bézier from the basket to home whose midpoint sits ARC_RISE above the higher end (the control point is placed so). */
export function arcPoint(from: { x: number; y: number }, to: { x: number; y: number }, t: number): { x: number; y: number } {
  const apex = Math.min(from.y, to.y) - ARC_RISE;
  const ctrl = { x: (from.x + to.x) / 2, y: 2 * apex - (from.y + to.y) / 2 };
  const u = 1 - t;
  return { x: u * u * from.x + 2 * u * t * ctrl.x + t * t * to.x, y: u * u * from.y + 2 * u * t * ctrl.y + t * t * to.y };
}

/**
 * Keyframes for element.animate(): translate offsets relative to the icon's
 * home (so `to` is usually 0,0), sampled along the arc, un-crumpling from
 * rotate(6deg) scale(.85) to upright, at full opacity. The spring easing is
 * applied to the whole timeline by the caller.
 */
export function arcFrames(from: { x: number; y: number }, to: { x: number; y: number }, samples = 13): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const p = arcPoint(from, to, t);
    const rot = 6 * (1 - t);
    const scale = 0.85 + 0.15 * t;
    frames.push({ transform: `translate(${round(p.x)}px, ${round(p.y)}px) rotate(${round(rot)}deg) scale(${round(scale)})`, opacity: 1, offset: t });
  }
  return frames;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/* ---------------------------------------------------------------- sound */

interface ParamLike {
  value: number;
  setValueAtTime(v: number, t: number): unknown;
  linearRampToValueAtTime(v: number, t: number): unknown;
  exponentialRampToValueAtTime(v: number, t: number): unknown;
}
interface NodeLike {
  connect(n: NodeLike): unknown;
}
export interface SwatContextLike {
  state: string;
  currentTime: number;
  sampleRate: number;
  destination: NodeLike;
  createBuffer(channels: number, length: number, rate: number): { getChannelData(c: number): Float32Array };
  createBufferSource(): NodeLike & { buffer: unknown; start(t: number): void; stop(t: number): void };
  createBiquadFilter(): NodeLike & { type: string; frequency: ParamLike; Q: ParamLike };
  createGain(): NodeLike & { gain: ParamLike };
  resume(): Promise<unknown>;
}

const SWAT_S = 0.22;

/**
 * The whoosh: 220 ms of white noise through a band-pass that sweeps
 * 2200 → 380 Hz (the hand passing), a fast attack and an exponential tail,
 * master 0.35. Nothing recorded, nothing trademarked.
 */
export function scheduleSwat(ctx: SwatContextLike, at: number = ctx.currentTime): { endsAt: number } {
  const len = Math.max(1, Math.floor(ctx.sampleRate * SWAT_S));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(2200, at);
  filter.frequency.exponentialRampToValueAtTime(380, at + SWAT_S);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.35, at + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + SWAT_S);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(at);
  src.stop(at + SWAT_S);
  return { endsAt: at + SWAT_S };
}

let ctx: SwatContextLike | null = null;

function defaultFactory(): SwatContextLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? (new Ctor() as unknown as SwatContextLike) : null;
}

/** Play the whoosh now (inside or right after a gesture). Silent when muted or when audio cannot start; never throws. */
export async function playSwat({ muted, factory = defaultFactory }: { muted: boolean; factory?: () => SwatContextLike | null }): Promise<boolean> {
  if (muted) return false;
  try {
    ctx ??= factory();
    if (!ctx) return false;
    if (ctx.state !== "running") await ctx.resume();
    if (ctx.state !== "running") return false;
    scheduleSwat(ctx);
    return true;
  } catch {
    return false;
  }
}

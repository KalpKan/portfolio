import { track } from "./track";

/**
 * The startup chime: an original chord synthesised with the Web Audio API
 * (Apple's chime is a trademark, so nothing here is a recording). Four warm
 * voices on a G major spread (G3 · D4 · G4 · B4), each slightly detuned so
 * they beat gently, a soft 120 ms attack into a short swell, a 1.8 s release,
 * a light low-pass and a master gain of 0.3: pleasant on laptop speakers
 * and it cannot clip (the per-voice peaks sum to 1 before the master).
 *
 * Browsers block audio until the visitor has interacted with the page, so
 * playChime() never assumes it may play: it resumes the context, checks the
 * state and gives up quietly. It plays at most once per page load: at the
 * boot mark when a prior gesture in this tab lets the context run, otherwise
 * on the unlock gesture (KalpOS.tsx), timed with the desk breathing in.
 */

export const MUTE_KEY = "kalpos:mute";

export const CHIME = {
  voices: [
    { hz: 196.0, type: "triangle", detune: -4 },
    { hz: 293.66, type: "sine", detune: 3 },
    { hz: 392.0, type: "triangle", detune: 4 },
    { hz: 493.88, type: "sine", detune: -3 },
  ] as const,
  /** Each voice enters this much after the last: the chord blooms. */
  staggerS: 0.03,
  attackS: 0.12,
  swellS: 0.5,
  releaseS: 1.8,
  lowpassHz: 2200,
  master: 0.3,
} as const;

export const CHIME_DURATION_S = CHIME.attackS + CHIME.swellS + CHIME.releaseS + CHIME.staggerS * (CHIME.voices.length - 1);

/* The subset of AudioContext the chime needs (typed so a fake can stand in). */
interface ParamLike {
  value: number;
  setValueAtTime(v: number, t: number): unknown;
  linearRampToValueAtTime(v: number, t: number): unknown;
  exponentialRampToValueAtTime(v: number, t: number): unknown;
}
interface NodeLike {
  connect(n: NodeLike): unknown;
}
export interface ContextLike {
  state: string;
  currentTime: number;
  destination: NodeLike;
  createOscillator(): NodeLike & { type: string; frequency: ParamLike; detune: ParamLike; start(t: number): void; stop(t: number): void };
  createGain(): NodeLike & { gain: ParamLike };
  createBiquadFilter(): NodeLike & { type: string; frequency: ParamLike };
  resume(): Promise<unknown>;
}

/** Schedule the chime on `ctx` starting at `at` (context seconds). */
export function scheduleChime(ctx: ContextLike, at: number = ctx.currentTime): { endsAt: number } {
  const master = ctx.createGain();
  master.gain.value = CHIME.master;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = CHIME.lowpassHz;
  master.connect(filter);
  filter.connect(ctx.destination);

  const peak = 1 / CHIME.voices.length;
  let endsAt = at;
  CHIME.voices.forEach((v, i) => {
    const t0 = at + i * CHIME.staggerS;
    const osc = ctx.createOscillator();
    osc.type = v.type;
    osc.frequency.value = v.hz;
    osc.detune.value = v.detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak * 0.7, t0 + CHIME.attackS);
    g.gain.linearRampToValueAtTime(peak, t0 + CHIME.attackS + CHIME.swellS);
    const end = t0 + CHIME.attackS + CHIME.swellS + CHIME.releaseS;
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(end + 0.05);
    endsAt = Math.max(endsAt, end);
  });
  return { endsAt };
}

function defaultFactory(): ContextLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

let ctx: ContextLike | null = null;
let played = false;

/**
 * Try to play the chime once per page load. Resolves true when it was
 * scheduled; false (never a throw) when muted, already played, unsupported,
 * or the browser will not start audio without a gesture yet.
 */
export async function playChime(
  at: "boot" | "unlock",
  {
    delayS = 0,
    muted = isMuted(),
    factory = defaultFactory,
    onPlayed = track,
  }: { delayS?: number; muted?: boolean; factory?: () => ContextLike | null; onPlayed?: (event: string, props: Record<string, unknown>) => void } = {},
): Promise<boolean> {
  if (muted || played) return false;
  try {
    ctx ??= factory();
    if (!ctx) return false;
    if (ctx.state !== "running") await ctx.resume();
    if (ctx.state !== "running" || played) return false;
    played = true;
    scheduleChime(ctx, ctx.currentTime + delayS);
    onPlayed("chime_played", { at });
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------- mute store */

const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return storage()?.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    if (muted) storage()?.setItem(MUTE_KEY, "1");
    else storage()?.removeItem(MUTE_KEY);
  } catch {
    // private mode: the toggle still works for this page through the listeners
  }
  listeners.forEach((l) => l());
}

export function subscribeMute(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function _resetChimeForTests(): void {
  ctx = null;
  played = false;
  listeners.clear();
}

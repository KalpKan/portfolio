import { describe, it, expect, vi, beforeEach } from "vitest";
import { CHIME, CHIME_DURATION_S, MUTE_KEY, isMuted, playChime, scheduleChime, setMuted, subscribeMute, _resetChimeForTests } from "./chime";

/* A fake AudioContext that records the graph and every gain ramp. */
type Ramp = { kind: string; value: number; time: number };
class FakeParam {
  value = 1;
  ramps: Ramp[] = [];
  setValueAtTime(v: number, t: number) { this.ramps.push({ kind: "set", value: v, time: t }); return this; }
  linearRampToValueAtTime(v: number, t: number) { this.ramps.push({ kind: "linear", value: v, time: t }); return this; }
  exponentialRampToValueAtTime(v: number, t: number) { this.ramps.push({ kind: "exp", value: v, time: t }); return this; }
}
class FakeNode {
  out: FakeNode[] = [];
  constructor(public kind: string) {}
  connect(n: FakeNode) { this.out.push(n); return n; }
}
class FakeOsc extends FakeNode {
  type = "sine";
  frequency = new FakeParam();
  detune = new FakeParam();
  started: number | null = null;
  stopped: number | null = null;
  constructor() { super("osc"); }
  start(t: number) { this.started = t; }
  stop(t: number) { this.stopped = t; }
}
class FakeGain extends FakeNode {
  gain = new FakeParam();
  constructor() { super("gain"); }
}
class FakeFilter extends FakeNode {
  type = "lowpass";
  frequency = new FakeParam();
  Q = new FakeParam();
  constructor() { super("filter"); }
}
function fakeContext(state: "running" | "suspended" = "running", resumeTo: "running" | "suspended" = state) {
  const ctx = {
    state,
    currentTime: 2,
    destination: new FakeNode("destination"),
    oscs: [] as FakeOsc[],
    gains: [] as FakeGain[],
    filters: [] as FakeFilter[],
    resumed: 0,
    createOscillator() { const o = new FakeOsc(); this.oscs.push(o); return o; },
    createGain() { const g = new FakeGain(); this.gains.push(g); return g; },
    createBiquadFilter() { const f = new FakeFilter(); this.filters.push(f); return f; },
    async resume() { this.resumed += 1; this.state = resumeTo; },
  };
  return ctx;
}

beforeEach(() => {
  localStorage.clear();
  _resetChimeForTests();
});

describe("scheduleChime (an original startup chord, never a recording)", () => {
  it("builds voices → own gain → master gain → lowpass → destination, with the master at or under 0.35", () => {
    const ctx = fakeContext();
    const { endsAt } = scheduleChime(ctx as never, 5);
    expect(ctx.oscs.length).toBe(CHIME.voices.length);
    expect(ctx.oscs.length).toBeGreaterThanOrEqual(3);
    const master = ctx.gains.find((g) => g.out[0]?.kind === "filter")!;
    expect(master).toBeDefined();
    expect(master.gain.value).toBeLessThanOrEqual(0.35);
    expect(ctx.filters[0].type).toBe("lowpass");
    expect(ctx.filters[0].out[0]).toBe(ctx.destination);
    for (const o of ctx.oscs) {
      const g = o.out[0] as FakeGain;
      expect(g.kind).toBe("gain");
      expect(g.out[0]).toBe(master);
    }
    // A major chord: every voice a whole-number ratio of the root (within the detune).
    const root = Math.min(...ctx.oscs.map((o) => o.frequency.value));
    for (const o of ctx.oscs) expect([1, 1.25, 1.5, 2, 2.5, 3].some((r) => Math.abs(o.frequency.value / root / r - 1) < 0.01)).toBe(true);
    expect(endsAt).toBeCloseTo(5 + CHIME_DURATION_S, 2);
  });

  it("each voice starts at 0, reaches its peak after the soft attack and swell, then releases over ~1.8 s; the sum of peaks never clips", () => {
    const ctx = fakeContext();
    scheduleChime(ctx as never, 5);
    let peakSum = 0;
    for (const o of ctx.oscs) {
      const g = o.out[0] as FakeGain;
      const [zero, attack, swell, release] = g.gain.ramps;
      expect(zero).toMatchObject({ kind: "set", value: 0 });
      expect(attack.kind).toBe("linear");
      expect(attack.time - zero.time).toBeCloseTo(CHIME.attackS, 3);
      expect(CHIME.attackS).toBeGreaterThanOrEqual(0.1);
      expect(swell.kind).toBe("linear");
      expect(swell.value).toBeGreaterThan(attack.value);
      expect(release.kind).toBe("exp");
      expect(release.time - swell.time).toBeCloseTo(CHIME.releaseS, 3);
      expect(CHIME.releaseS).toBeCloseTo(1.8, 1);
      expect(o.started).toBeGreaterThanOrEqual(5);
      expect(o.stopped).toBeGreaterThanOrEqual(release.time);
      peakSum += swell.value;
    }
    expect(peakSum).toBeLessThanOrEqual(1.0001);
  });
});

describe("playChime", () => {
  it("plays once the context is running, reports chime_played with where it played, and never twice per page", async () => {
    const ctx = fakeContext("suspended", "running");
    const played = vi.fn();
    expect(await playChime("unlock", { factory: () => ctx as never, onPlayed: played })).toBe(true);
    expect(ctx.resumed).toBe(1);
    expect(ctx.oscs.length).toBe(CHIME.voices.length);
    expect(played).toHaveBeenCalledWith("chime_played", { at: "unlock" });
    expect(await playChime("unlock", { factory: () => ctx as never, onPlayed: played })).toBe(false);
    expect(played).toHaveBeenCalledTimes(1);
  });

  it("schedules at the requested delay (the unlock beat is 400 ms after the gesture)", async () => {
    const ctx = fakeContext();
    await playChime("unlock", { factory: () => ctx as never, onPlayed: () => {}, delayS: 0.4 });
    expect(ctx.oscs[0].started).toBeCloseTo(2.4, 3);
  });

  it("is silent, resolves false and does not throw when the context cannot start without a gesture", async () => {
    const ctx = fakeContext("suspended", "suspended");
    expect(await playChime("boot", { factory: () => ctx as never, onPlayed: () => {} })).toBe(false);
    expect(ctx.oscs.length).toBe(0);
    const throwing = { ...fakeContext("suspended"), resume: async () => { throw new Error("NotAllowedError"); } };
    expect(await playChime("boot", { factory: () => throwing as never, onPlayed: () => {} })).toBe(false);
    expect(await playChime("boot", { factory: () => null, onPlayed: () => {} })).toBe(false);
    expect(await playChime("boot", { factory: () => { throw new Error("no audio"); }, onPlayed: () => {} })).toBe(false);
  });

  it("does nothing while muted", async () => {
    setMuted(true);
    const ctx = fakeContext();
    expect(await playChime("unlock", { factory: () => ctx as never, onPlayed: () => {} })).toBe(false);
    expect(ctx.oscs.length).toBe(0);
  });
});

describe("mute", () => {
  it("persists in localStorage under kalpos:mute and notifies subscribers", () => {
    expect(isMuted()).toBe(false);
    const cb = vi.fn();
    const off = subscribeMute(cb);
    setMuted(true);
    expect(localStorage.getItem(MUTE_KEY)).toBe("1");
    expect(isMuted()).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
    setMuted(false);
    expect(localStorage.getItem(MUTE_KEY)).toBeNull();
    off();
    setMuted(true);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

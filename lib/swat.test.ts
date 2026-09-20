import { describe, expect, it, vi } from "vitest";
import { arcPoint, arcFrames, hitTrash, IDLE_SWAT, scheduleSwat, SWAT_MS, swatReducer, swatTimeline, type SwatState } from "./swat";

const trash = [{ x: 148, y: 284, w: 96, h: 89 }];

describe("the Trash swat (2026-09-20: drag an icon into the trash, a hand swats it back)", () => {
  it("hit-testing: the pointer inside a trash rect (desk icon or dock tile), with 6 px of slop, never its own rect", () => {
    expect(hitTrash({ x: 190, y: 320 }, trash)).toBe(true);
    expect(hitTrash({ x: 145, y: 320 }, trash)).toBe(true); // 3 px outside: slop
    expect(hitTrash({ x: 140, y: 320 }, trash)).toBe(false);
    expect(hitTrash({ x: 190, y: 400 }, trash)).toBe(false);
    expect(hitTrash({ x: 190, y: 320 }, [])).toBe(false);
    expect(hitTrash({ x: 700, y: 740 }, [...trash, { x: 690, y: 730, w: 54, h: 54 }])).toBe(true);
  });

  it("state machine: idle → over → dropped → swatted → home → idle; leaving the trash goes back to idle; a drop outside never starts it", () => {
    let s: SwatState = IDLE_SWAT;
    expect(s.phase).toBe("idle");
    s = swatReducer(s, { type: "hover", icon: "hobbies", over: true });
    expect(s).toMatchObject({ phase: "over", icon: "hobbies" });
    s = swatReducer(s, { type: "hover", icon: "hobbies", over: false });
    expect(s.phase).toBe("idle");
    s = swatReducer(s, { type: "hover", icon: "hobbies", over: true });
    s = swatReducer(s, { type: "drop", icon: "hobbies", inside: false, at: { x: 1, y: 1 }, bin: trash[0], home: { x: 148, y: 64 } });
    expect(s.phase).toBe("idle");
    s = swatReducer(s, { type: "hover", icon: "hobbies", over: true });
    s = swatReducer(s, { type: "drop", icon: "hobbies", inside: true, at: { x: 160, y: 300 }, bin: trash[0], home: { x: 148, y: 64 } });
    expect(s).toMatchObject({ phase: "dropped", icon: "hobbies", at: { x: 160, y: 300 }, bin: trash[0], home: { x: 148, y: 64 } });
    // a second icon cannot start while one is mid-swat
    expect(swatReducer(s, { type: "hover", icon: "about", over: true })).toBe(s);
    s = swatReducer(s, { type: "next" });
    expect(s.phase).toBe("swatted");
    s = swatReducer(s, { type: "next" });
    expect(s.phase).toBe("home");
    s = swatReducer(s, { type: "next" });
    expect(s).toBe(IDLE_SWAT);
    expect(swatReducer(IDLE_SWAT, { type: "next" })).toBe(IDLE_SWAT);
    // a drop with no hover first (fast hand) still starts it
    expect(swatReducer(IDLE_SWAT, { type: "drop", icon: "trash", inside: true, at: { x: 1, y: 1 }, bin: trash[0], home: { x: 0, y: 0 } }).phase).toBe("idle");
    expect(swatReducer(IDLE_SWAT, { type: "drop", icon: "about", inside: true, at: { x: 1, y: 1 }, bin: trash[0], home: { x: 0, y: 0 } }).phase).toBe("dropped");
  });

  it("timings: crumple 240, sink 200, hand 260, fly 520, withdraw 200, toast 1600; the timeline per phase, and the reduced-motion one", () => {
    expect(SWAT_MS).toEqual({ crumple: 240, sink: 200, hand: 260, fly: 520, withdraw: 200, toast: 1600, fade: 200 });
    expect(swatTimeline(false)).toEqual({ dropped: 200, swatted: 780, home: 200 });
    // reduced motion: the icon simply returns with a 200 ms fade; the hand still shows briefly
    expect(swatTimeline(true)).toEqual({ dropped: 0, swatted: 460, home: 200 });
  });

  it("the flight is a quadratic arc from the basket up and back to the icon's home, un-crumpling on the way", () => {
    const bin = { x: 100, y: 300 };
    const home = { x: 0, y: 0 };
    expect(arcPoint(bin, home, 0)).toEqual(bin);
    expect(arcPoint(bin, home, 1)).toEqual(home);
    const mid = arcPoint(bin, home, 0.5);
    expect(mid.y).toBeLessThan(Math.min(bin.y, home.y)); // above both ends: it goes up first
    const frames = arcFrames(bin, home);
    expect(frames.length).toBeGreaterThanOrEqual(9);
    expect(frames[0]).toMatchObject({ transform: expect.stringContaining("translate(100px, 300px)"), opacity: 1 });
    expect(frames[frames.length - 1].transform).toContain("translate(0px, 0px) rotate(0deg) scale(1)");
    expect(frames[0].transform).toContain("rotate(6deg) scale(0.85)");
  });

  it("the swat whoosh: a short original noise burst through a sweeping band-pass, skipped when muted", () => {
    const calls: string[] = [];
    const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
    const ctx = {
      state: "running",
      currentTime: 10,
      destination: { connect() {} },
      sampleRate: 48000,
      createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
      createBufferSource: () => ({ buffer: null, connect: () => calls.push("src"), start: (t: number) => calls.push(`start@${t}`), stop: (t: number) => calls.push(`stop@${t.toFixed(2)}`) }),
      createBiquadFilter: () => ({ type: "", frequency: param(), Q: param(), connect: () => calls.push("filter") }),
      createGain: () => ({ gain: param(), connect: () => calls.push("gain") }),
      resume: async () => {},
    };
    const r = scheduleSwat(ctx as never);
    expect(r.endsAt).toBeCloseTo(10.22, 2);
    expect(calls).toContain("start@10");
    expect(calls).toContain("stop@10.22");
  });
});

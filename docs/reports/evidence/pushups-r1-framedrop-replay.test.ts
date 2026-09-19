// Offline metrics on the Python traces: frame-drop invariance, per-rep verdict vs label at the bottom,
// single-frame vs 3-frame-majority verdicts. Report only.
import { it } from "vitest";
import { readFileSync } from "node:fs";
import { createRepCounter } from "/Users/kalp/projects/pushups/src/repCounter";

const root = "/Users/kalp/projects/pushups";
const gt = JSON.parse(readFileSync(`${root}/tests/fixtures/clips/ground_truth.json`, "utf8"));

function replay(frames: any[], keep: (i: number) => boolean) {
  const c = createRepCounter();
  const ev: string[] = [];
  frames.forEach((f, i) => {
    if (!keep(i) || f.shoulderY == null || f.prob == null) return;
    const e = c.push({ shoulderY: f.shoulderY, good: f.prob > 0.5 });
    if (e) ev.push(`${f.t.toFixed(1)}${e.good ? "g" : "b"}`);
  });
  return { ...c.state(), ev };
}

it("frame-drop and verdict metrics", () => {
  const rows: string[] = [];
  let changed = 0, n = 0, verdictSingle = 0, verdictMaj = 0, verdictN = 0, badGood = 0, badN = 0;
  for (const clip of gt.clips) {
    const tr = JSON.parse(readFileSync(`${root}/tests/fixtures/traces/${clip.id}.json`, "utf8"));
    const full = replay(tr.frames, () => true);
    const drop3 = replay(tr.frames, (i) => i % 3 !== 2);   // every third frame dropped (20 fps)
    const half = replay(tr.frames, (i) => i % 2 === 0);    // 15 fps
    const third = replay(tr.frames, (i) => i % 3 === 0);   // 10 fps
    n++;
    if (full.totalReps !== drop3.totalReps || full.goodReps !== drop3.goodReps) changed++;
    // per-rep verdict at the labelled bottom: single frame and 3-frame majority
    const byT = (t: number) => tr.frames.reduce((a: any, f: any) => (Math.abs(f.t - t) < Math.abs(a.t - t) ? f : a));
    const perRep: string[] = [];
    for (const r of clip.reps) {
      const f = byT(r.bottom_s);
      const i = tr.frames.indexOf(f);
      const win = tr.frames.slice(Math.max(0, i - 1), i + 2).filter((x: any) => x.prob != null);
      const single = f.prob != null ? (f.prob > 0.5 ? "good" : "bad") : "none";
      const maj = win.length ? (win.filter((x: any) => x.prob > 0.5).length * 2 > win.length ? "good" : "bad") : "none";
      if (r.confidence === "high") { verdictN++; if (single === r.form) verdictSingle++; if (maj === r.form) verdictMaj++; }
      if (r.form === "bad") { badN++; if (single === "good") badGood++; }
      perRep.push(`${r.bottom_s}s:${r.form[0]}/${single[0]}${maj[0]}`);
    }
    rows.push(`${clip.id.padEnd(14)} 30fps ${full.totalReps}/${full.goodReps}  20fps ${drop3.totalReps}/${drop3.goodReps}  15fps ${half.totalReps}/${half.goodReps}  10fps ${third.totalReps}/${third.goodReps}  truth ${clip.total}/${clip.good_min}-${clip.good_max}  | bottoms label/single,maj: ${perRep.join(" ")}`);
  }
  console.log(rows.join("\n"));
  console.log(`clips whose count changes when every 3rd frame is dropped: ${changed}/${n}`);
  console.log(`high-confidence reps: single-frame verdict at bottom matches label ${verdictSingle}/${verdictN}; 3-frame majority ${verdictMaj}/${verdictN}`);
  console.log(`bad-labelled reps where the single bottom frame says good: ${badGood}/${badN}`);
});

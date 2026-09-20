// TEST r4 one-off (not committed): frame-drop replay at every phase, 30/20/15/10 fps, per trace set.
import { it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { createTracker } from "../src/tracker";

const ASPECT = 16 / 9;
const gt = JSON.parse(readFileSync(new URL("./fixtures/clips/ground_truth.json", import.meta.url), "utf8"));
function replay(tr: any, keep: (i: number) => boolean) {
  const t = createTracker();
  const ev: string[] = [];
  tr.frames.forEach((f: any, i: number) => { if (!keep(i) || !f.features) return; const e = t.push({ t: f.t, vector: f.features, aspect: ASPECT }); if (e?.kind === "rep") ev.push(`${e.t.toFixed(1)}${e.good ? "g" : "b"}`); });
  const s = t.state();
  return { total: s.totalReps, good: s.goodReps, ev };
}
it("phase sweep", () => {
  const lines: string[] = [];
  for (const [set, dir] of [["python", "traces"], ["browser", "traces-browser"], ["mirrored", "traces-browser-mirrored"]]) {
    for (const clip of gt.clips) {
      const tr = JSON.parse(readFileSync(new URL(`./fixtures/${dir}/${clip.id}.json`, import.meta.url), "utf8"));
      const full = replay(tr, () => true);
      const variants: Record<string, ReturnType<typeof replay>> = {};
      for (let k = 0; k < 3; k++) variants[`20fps/p${k}`] = replay(tr, (i) => i % 3 !== k);
      for (let k = 0; k < 2; k++) variants[`15fps/p${k}`] = replay(tr, (i) => i % 2 === k);
      for (let k = 0; k < 3; k++) variants[`10fps/p${k}`] = replay(tr, (i) => i % 3 === k);
      for (let k = 0; k < 4; k++) variants[`7.5fps/p${k}`] = replay(tr, (i) => i % 4 === k);
      const diffs = Object.entries(variants).filter(([, v]) => v.total !== full.total || v.good !== full.good).map(([n, v]) => `${n}=${v.total}/${v.good}`);
      if (diffs.length) lines.push(`${set.padEnd(9)} ${clip.id.padEnd(14)} 30fps ${full.total}/${full.good}  differs: ${diffs.join(" ")}`);
    }
  }
  writeFileSync(process.env.R4_OUT ?? "/tmp/r4-phase.txt", lines.join("\n") || "no differences");
});

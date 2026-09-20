// TEST r4 one-off analysis (not committed): per-rep ascent features on every labelled rep, to check the
// FIX r3 claim that a chest-first "worm"/collapse is indistinguishable from a clean rep in 2D landmarks.
import { it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { createRepCounter } from "../src/repCounter";
import { assessFrame, bottomFaults, bottomMetrics, geometry } from "../src/form";

const ASPECT = 16 / 9;
const gt = JSON.parse(readFileSync(new URL("./fixtures/clips/ground_truth.json", import.meta.url), "utf8"));
const out = process.env.R4_OUT ?? "/tmp/r4-ascent.json";

it("ascent features", () => {
  const rows: any[] = [];
  for (const set of ["traces", "traces-browser", "traces-browser-mirrored"]) {
    for (const clip of gt.clips) {
      const tr = JSON.parse(readFileSync(new URL(`./fixtures/${set}/${clip.id}.json`, import.meta.url), "utf8"));
      const frames = tr.frames.filter((f: any) => f.features);
      const geos = frames.map((f: any) => ({ t: f.t, g: geometry(f.features, ASPECT), y: (f.features[13] + f.features[16]) / 2, hipY: (f.features[19] + f.features[22]) / 2, wristY: (f.features[1] + f.features[4]) / 2 }));
      const counter = createRepCounter({ judgeBottom: (m) => bottomFaults(m as any) });
      const events: { t: number; good: boolean; reason: string | null; bottomT: number; topY: number; bottomY: number }[] = [];
      let lastBottom = { bottomT: 0, topY: 0, bottomY: 0 };
      for (const fr of geos) {
        const form = assessFrame(fr.g);
        const ev = counter.push({ t: fr.t, shoulderY: fr.y, scale: fr.g.torso, plank: form.plank || form.kneePlank, faults: form.faults, bottomFaults: [], bottomMetrics: bottomMetrics(fr.g) });
        const d = counter.debug();
        if (ev?.kind === "rep") events.push({ t: fr.t, good: ev.good, reason: ev.reason, ...lastBottom });
        lastBottom = { bottomT: d.bottomT, topY: d.topY, bottomY: d.bottomY };
      }
      for (const rep of clip.reps) {
        // match event by the nearest bottom time
        const ev = events.filter((e) => Math.abs(e.bottomT - rep.bottom_s) < 1.0).sort((a, b) => Math.abs(a.bottomT - rep.bottom_s) - Math.abs(b.bottomT - rep.bottom_s))[0];
        if (!ev) { rows.push({ set, clip: clip.id, rep: rep.n, label: rep.form, conf: rep.confidence, matched: false }); continue; }
        const asc = geos.filter((f: any) => f.t >= ev.bottomT && f.t <= ev.t);
        const depth = ev.bottomY - ev.topY;
        const scale = asc.length ? asc[0].g.torso : 1;
        // features over the ascent
        const maxHipDev = Math.max(...asc.map((f: any) => f.g.hipDev));
        const meanHipDev = asc.reduce((a: number, f: any) => a + f.g.hipDev, 0) / asc.length;
        // hip lag: when the shoulders have risen 40 % of the depth, how much have the hips risen (torso units, relative to their bottom level)?
        const hipBottom = Math.max(...asc.map((f: any) => f.hipY));
        const hipTop = Math.min(...asc.map((f: any) => f.hipY));
        const at40 = asc.find((f: any) => ev.bottomY - f.y >= 0.4 * depth);
        const hipRiseAt40 = at40 ? (hipBottom - at40.hipY) / scale : null;
        const shoulderRiseAt40 = at40 ? (ev.bottomY - at40.y) / scale : null;
        const hipRange = (hipBottom - hipTop) / scale;
        // hipDev at the point where shoulders are at 40 % / 60 %
        const at60 = asc.find((f: any) => ev.bottomY - f.y >= 0.6 * depth);
        // bottom-window mean elbowAhead / wristBelow
        const bot = asc.filter((f: any) => f.y >= ev.bottomY - 0.2 * depth);
        const meanWristBelowBottom = bot.reduce((a: number, f: any) => a + f.g.wristBelow, 0) / (bot.length || 1);
        const meanElbowAheadBottom = bot.reduce((a: number, f: any) => a + f.g.elbowAhead, 0) / (bot.length || 1);
        const minElbowAngleBottom = Math.min(...bot.map((f: any) => f.g.elbowAngle));
        const maxHipBelowShoulder = Math.max(...asc.map((f: any) => f.g.hipBelowShoulder));
        rows.push({ set, clip: clip.id, rep: rep.n, label: rep.form, conf: rep.confidence, matched: true, got: ev.good ? "good" : ev.reason, depth: depth / scale, n: asc.length,
          maxHipDev: +maxHipDev.toFixed(3), meanHipDev: +meanHipDev.toFixed(3), hipDev40: at40 ? +at40.g.hipDev.toFixed(3) : null, hipDev60: at60 ? +at60.g.hipDev.toFixed(3) : null,
          hipRiseAt40: hipRiseAt40 == null ? null : +hipRiseAt40.toFixed(3), shoulderRiseAt40: shoulderRiseAt40 == null ? null : +shoulderRiseAt40.toFixed(3), hipRange: +hipRange.toFixed(3),
          wristBelowBot: +meanWristBelowBottom.toFixed(3), elbowAheadBot: +meanElbowAheadBottom.toFixed(3), minElbowAngleBot: +minElbowAngleBottom.toFixed(1), maxHipBelowShoulder: +maxHipBelowShoulder.toFixed(3) });
      }
    }
  }
  writeFileSync(out, JSON.stringify(rows, null, 1));
});

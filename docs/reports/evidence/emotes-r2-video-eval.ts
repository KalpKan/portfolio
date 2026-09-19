// Feed VIDEO-mode landmarks (python, same .task models) through the page's engine + gate; print cue trajectory and fires.
import { readFileSync } from "node:fs";
import { faceMetrics } from "./src/gestures/face";
import { GestureEngine, fuseScores } from "./src/gestures/engine";
import { EmoteGate, COOLDOWN_MS } from "./src/emotes";
const d = JSON.parse(readFileSync(process.argv[2], "utf8"));
const toPts = (a: number[][]) => a.map(([x, y]) => ({ x, y }));
const engine = new GestureEngine(); const gate = new EmoteGate(COOLDOWN_MS);
const verbose = process.argv.includes("--verbose");
for (const f of d.frames) {
  const input = { pose: f.pose ? toPts(f.pose) : null, hands: f.hands.map(toPts), face: faceMetrics(f.face ? toPts(f.face) : null, d.aspect), aspect: d.aspect };
  const r = engine.update(input, f.ms);
  const c = r.cues;
  const line = `${String(f.ms).padStart(6)} flex=${r.scores.flex.toFixed(2)} tu=${r.scores.thumbs_up.toFixed(2)} yawn=${r.scores.yawn.toFixed(2)} | flex{b${c.flex.bend.toFixed(1)} h${c.flex.height.toFixed(1)} s${c.flex.beside.toFixed(1)} l${c.flex.level.toFixed(1)} c${c.flex.clear.toFixed(1)}} tu{f${c.thumbs_up.folded.toFixed(1)} u${c.thumbs_up.up.toFixed(1)} r${c.thumbs_up.upright.toFixed(1)} c${c.thumbs_up.clear.toFixed(1)}} hands=${f.hands.length} pose=${f.pose ? "Y" : "-"}`;
  if (r.fired) { const e = gate.tryFire(r.fired, f.ms); console.log(line + `  <== FIRE ${r.fired}${e ? "" : " (gated)"}`); }
  else if (verbose || r.scores.flex >= 0.35 || r.scores.thumbs_up >= 0.35) console.log(line);
}

// TEST r2: score held-out variant landmark sets (mirror / portrait / far) with the shipped rules.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { faceMetrics } from "./src/gestures/face";
import { fuseScores, GESTURES, type Gesture } from "./src/gestures/engine";
import { metrics } from "./tests/corpus";
const toPts = (a: number[][]) => a.map(([x, y]) => ({ x, y }));
const verbose = process.argv.includes("--verbose");
for (const dir of process.argv.slice(2).filter((a) => !a.startsWith("--"))) {
  const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")).stills as Array<{ id: string; kind: string; expected: Gesture | null }>;
  const meta = new Map(index.map((s) => [s.id, s]));
  const rows = readdirSync(dir).filter((f) => f.endsWith(".json") && !["index.json", "labels.json"].includes(f)).sort().map((f) => {
    const raw = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const m = meta.get(raw.id)!;
    const scores = fuseScores({ pose: raw.pose ? toPts(raw.pose) : null, hands: raw.hands.map(toPts), face: faceMetrics(raw.face ? toPts(raw.face) : null, raw.aspect), aspect: raw.aspect }).scores;
    return { id: raw.id as string, kind: m.kind, expected: m.expected, scores, fired: GESTURES.filter((g) => scores[g] >= 0.5), detected: { pose: !!raw.pose, hands: raw.hands.length, face: !!raw.face } };
  }).filter((r) => r.kind !== "skip");
  const gated = rows.filter((r) => ["ok", "neutral", "hard"].includes(r.kind));
  const m = metrics(gated as any);
  console.log(`\n${dir.split("/").pop()} (${rows.length} stills; landmarks found: pose ${rows.filter(r=>r.detected.pose).length}, face ${rows.filter(r=>r.detected.face).length}, hands>0 ${rows.filter(r=>r.detected.hands>0).length})`);
  for (const g of GESTURES) console.log(`  ${g.padEnd(10)} precision ${Math.round(m[g].precision*100)}%  recall ${Math.round(m[g].recall*100)}%  (tp ${m[g].tp} fp ${m[g].fp} fn ${m[g].fn})`);
  console.log(`  neutral fired: ${rows.filter(r=>r.kind==="neutral"&&r.fired.length).length}/${rows.filter(r=>r.kind==="neutral").length}  hard fired: ${rows.filter(r=>r.kind==="hard"&&r.fired.length).length}/${rows.filter(r=>r.kind==="hard").length}  occluded wrong: ${rows.filter(r=>r.kind==="occluded"&&r.fired.some(g=>g!=="yawn")).length}/8  partial wrong: ${rows.filter(r=>r.kind==="partial"&&r.fired.some(g=>g!==r.expected)).length}/5`);
  for (const r of rows) {
    const bad = (r.kind === "ok" && (r.fired.length !== 1 || r.fired[0] !== r.expected)) || (["neutral","hard"].includes(r.kind) && r.fired.length) || (["occluded","partial"].includes(r.kind) && r.fired.some((g) => g !== r.expected));
    if (bad || verbose) console.log(`   ${bad ? "X" : " "} ${r.id.padEnd(14)} ${r.kind.padEnd(8)} exp=${String(r.expected).padEnd(9)} ${GESTURES.map(g=>`${g}=${r.scores[g].toFixed(2)}`).join(" ")} fired=${r.fired.join(",")||"-"} pose=${r.detected.pose?"Y":"-"} hands=${r.detected.hands} face=${r.detected.face?"Y":"-"}`);
  }
}

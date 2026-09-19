// TEST r2 offline synthesis: 10 s holds at 25/12/8 fps and heavier jitter; fast sequences (2 s EmoteGate); 8 fps latency.
import { loadStills, synthesizeClip, runClip, type Clip } from "./tests/corpus";
const stills = loadStills();
const g = (s: string) => s.replace(/-\d+$/, "") as any;
const mk = (id: string, segs: Array<[string, number]>, fps: number, jitter: number, seed = 7): Clip => {
  let t = 0; const segments = [] as any[]; const events = [] as any[];
  for (const [still, ms] of segs) { segments.push({ still, ms, transitionMs: 300 }); if (still !== "angry-04") events.push({ gesture: g(still), startMs: t + 300, endMs: t + ms }); t += ms; }
  return { id, kind: "positive", fps, jitter, seed, aspect: 4 / 3, segments, events, expectFires: events.map((e: any) => e.gesture), note: "" };
};
console.log("== 10 s holds (fires must be 1)");
for (const still of ["thumbs_up-07", "thumbs_up-11", "flex-14", "flex-06", "yawn-19", "yawn-12", "yawn-17", "yawn-18"]) for (const fps of [25, 12, 8]) for (const jitter of [0.004, 0.008, 0.012]) {
  const clip = mk(`hold-${still}-${fps}`, [["angry-04", 1500], [still, 10000], ["angry-04", 1500]], fps, jitter);
  const { fires } = runClip(clip, synthesizeClip(clip, stills));
  const lat = fires.length ? fires[0].ms - 1800 : null;
  console.log(`${still.padEnd(13)} ${String(fps).padStart(2)} fps jitter ${jitter}: fires=${fires.length} [${fires.map(f => f.gesture + "@" + f.ms).join(" ")}] first latency ${lat} ms`);
}
console.log("\n== fast sequences (gap between gestures; the page's EmoteGate waits 2000 ms)");
for (const gap of [0, 300, 600, 1000, 1500, 2000]) for (const fps of [25, 8]) {
  const segs: Array<[string, number]> = [["angry-04", 1500], ["thumbs_up-07", 1200]];
  if (gap) segs.push(["angry-04", gap]);
  segs.push(["flex-14", 1200]); if (gap) segs.push(["angry-04", gap]); segs.push(["yawn-19", 1500], ["angry-04", 1500]);
  const clip = mk(`fast-${gap}-${fps}`, segs, fps, 0.004);
  const { fires } = runClip(clip, synthesizeClip(clip, stills));
  console.log(`gap ${String(gap).padStart(4)} ms ${String(fps).padStart(2)} fps: fires=[${fires.map(f => f.gesture + "@" + f.ms).join(" ")}] events=[${clip.events.map((e: any) => e.gesture + "@" + e.startMs).join(" ")}]`);
}
console.log("\n== latency at 8 / 12 fps, 2.5 s gestures (max must be <= 1000 ms)");
let worst = 0; const rows: string[] = [];
for (const still of stills.filter((s) => s.kind === "ok").map((s) => s.id)) for (const fps of [12, 8]) {
  const clip = mk(`lat-${still}-${fps}`, [["angry-04", 1500], [still, 2500], ["angry-04", 1500]], fps, Number(process.env.J ?? 0.008));
  const { fires } = runClip(clip, synthesizeClip(clip, stills));
  const lat = fires.length ? fires[0].ms - 1800 : null;
  if (lat === null || lat > 800 || fires.length !== 1 || fires[0].gesture !== g(still)) rows.push(`${still} ${fps} fps: fires=[${fires.map(f => f.gesture + "@" + f.ms).join(" ")}] latency ${lat}`);
  if (lat !== null) worst = Math.max(worst, lat);
}
console.log(`worst latency ${worst} ms; problem rows (${rows.length}):`); for (const r of rows) console.log("  " + r);

import { loadStills, synthesizeClip, runClip, type Clip } from "/Users/kalp/projects/emotes/tests/corpus";
const stills = loadStills();
const mk = (id: string, still: string, fps: number, holdMs: number, jitter: number, seed: number): Clip => ({
  id, kind: "positive", fps, jitter, seed, aspect: 4 / 3,
  segments: [
    { still: "angry-04", ms: 1500, transitionMs: 0 },
    { still, ms: holdMs, transitionMs: 300 },
    { still: "angry-04", ms: 1500, transitionMs: 300 },
  ],
  events: [{ gesture: still.replace(/-\d+$/, "") as any, startMs: 1800, endMs: 1500 + holdMs }],
  expectFires: [still.replace(/-\d+$/, "") as any], note: "",
});
for (const still of ["thumbs_up-07", "flex-14", "yawn-19", "flex-02", "yawn-12"]) {
  for (const fps of [25, 12, 8]) {
    for (const jitter of [0.004, 0.008, 0.012]) {
      const clip = mk(`hold-${still}-${fps}fps`, still, fps, 10_000, jitter, 7);
      const { fires } = runClip(clip, synthesizeClip(clip, stills));
      const lat = fires.length ? fires[0].ms - 1800 : null;
      console.log(`${still.padEnd(13)} ${String(fps).padStart(2)} fps jitter ${jitter}: fires=${fires.length} [${fires.map(f => f.gesture + "@" + f.ms).join(" ")}] first latency ${lat} ms`);
    }
  }
}

// pushups TEST r3: the live camera path in Playwright's bundled Chromium (new headless) with the fake camera,
// as docs/hosting-plan.md section 11 asks, on a subset of the ground-truth clips.
//   node pushups-r3-playwright.mjs <url> <outJson> <id> [...]   (from the scratchpad, where playwright is installed)
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
const [url, outFile, ...ids] = process.argv.slice(2);
const gt = JSON.parse(readFileSync("/Users/kalp/projects/pushups/tests/fixtures/clips/ground_truth.json", "utf8"));
const out = {};
for (const id of ids) {
  const clip = gt.clips.find((c) => c.id === id);
  const file = `/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/${id}.mjpeg`;
  const browser = await chromium.launch({ headless: true, channel: "chromium", args: ["--use-gl=angle", "--use-angle=metal", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${file}`, "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 }, permissions: ["camera"] });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${url}?trace`, { waitUntil: "networkidle" });
    const tClick = Date.now();
    await page.click("#start-camera");
    await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), null, { timeout: 120000 });
    const loadMs = Date.now() - tClick;
    const fps = [];
    const t0 = Date.now();
    while (Date.now() - t0 < clip.duration_s * 1000 + 1500) {
      await page.waitForTimeout(1000);
      const f = parseInt(await page.evaluate(() => document.getElementById("stat-fps").textContent), 10);
      if (!Number.isNaN(f)) fps.push(f);
    }
    const final = await page.evaluate(() => ({ good: Number(document.getElementById("stat-good").textContent), total: Number(document.getElementById("stat-total").textContent), status: document.getElementById("status").textContent }));
    const trace = await page.evaluate(() => window.__pushupsTrace ?? []);
    const events = trace.filter((f) => f.event).map((f) => `${f.mediaTime.toFixed(1)}s ${f.event}`);
    const pass = Math.abs(final.total - clip.total) <= 1 && final.good >= clip.good_min - 1 && final.good <= clip.good_max + 1;
    out[id] = { loadMs, final, expected: { total: clip.total, good: [clip.good_min, clip.good_max] }, pass, fpsAvg: Math.round(fps.reduce((a, b) => a + b, 0) / fps.length), fpsMin: Math.min(...fps), events, errors, ua: await page.evaluate(() => navigator.userAgent) };
    console.log(`${id.padEnd(15)} ${pass ? "PASS" : "FAIL"} total ${final.total} (want ${clip.total}) good ${final.good} (want ${clip.good_min}-${clip.good_max}) fps ${out[id].fpsAvg} min ${out[id].fpsMin} cold-start ${loadMs} ms events ${events.join(", ")}${errors.length ? ` ERRORS ${errors.length}` : ""}`);
  } finally {
    await browser.close();
  }
}
writeFileSync(outFile, JSON.stringify(out, null, 2));

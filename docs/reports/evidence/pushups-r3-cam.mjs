// pushups TEST r3: run the live camera path on an arbitrary fake-camera MJPEG and report counts, per-rep
// events (from the page's ?trace record), fps, hint/verdict timeline (fillText hook) and console errors.
//   node pushups-r3-cam.mjs <url> <outJson> <name>=<file.mjpeg>:<seconds> [...]     (run from ~/projects/pushups)
//   THROTTLE=4 applies CPU throttling; WIDTH=390 sets a phone viewport.
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";
const [url, outFile, ...specs] = process.argv.slice(2);
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TEXT_HOOK = () => { window.__texts = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t, x, y, ...r) { window.__texts.push([performance.now(), String(t)]); return o.call(this, t, x, y, ...r); }; };
const out = {};
for (const spec of specs) {
  const [name, rest] = spec.split("=");
  const [file, secs] = rest.split(":");
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400",
      "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${file}`] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    const w = Number(process.env.WIDTH ?? 1000);
    await page.setViewport({ width: w, height: w < 500 ? 844 : 1400, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500, hasTouch: w < 500 });
    await page.evaluateOnNewDocument(TEXT_HOOK);
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    if (process.env.THROTTLE) { const c = await page.createCDPSession(); await c.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE) }); }
    await page.goto(`${url}${url.includes("?") ? "&" : "?"}trace`, { waitUntil: "networkidle0" });
    await page.click("#start-camera");
    await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
    const start = await page.evaluate(() => performance.now());
    const fpsSamples = [];
    const t0 = Date.now();
    const budget = Number(secs) * 1000 + 1500;
    while (Date.now() - t0 < budget) {
      await sleep(1000);
      const f = parseInt(await page.evaluate(() => document.getElementById("stat-fps").textContent), 10);
      if (!Number.isNaN(f)) fpsSamples.push(f);
    }
    const final = await page.evaluate(() => ({ good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent, status: document.getElementById("status").textContent }));
    const trace = await page.evaluate(() => window.__pushupsTrace ?? []);
    const events = trace.filter((f) => f.event).map((f) => `${f.mediaTime.toFixed(1)}s ${f.event}`);
    const texts = await page.evaluate((s) => window.__texts.map(([t, x]) => [Math.round(t - s), x]), start);
    const seen = new Map();
    for (const [t, x] of texts) { if (/^\d+$/.test(x) || /good reps? ·/.test(x)) continue; const e = seen.get(x) ?? { first: t, last: t, n: 0 }; e.last = t; e.n++; seen.set(x, e); }
    const timeline = [...seen.entries()].map(([text, e]) => `${e.first}-${e.last} ms (${e.n}f) ${text}`).sort();
    if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/${name}.png`, fullPage: true });
    out[name] = { file, final, events, fpsAvg: fpsSamples.length ? Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length) : null, fpsMin: fpsSamples.length ? Math.min(...fpsSamples) : null, frames: trace.length, timeline, errors };
    console.log(`${name}: ${final.total} attempts / ${final.good} good  fps ${out[name].fpsAvg} (min ${out[name].fpsMin})  events: ${events.join(", ")}${errors.length ? `  ERRORS ${errors.length}` : ""}`);
    for (const l of timeline) console.log(`   ${l}`);
  } finally {
    await browser.close();
  }
}
if (outFile) writeFileSync(outFile, JSON.stringify(out, null, 2));

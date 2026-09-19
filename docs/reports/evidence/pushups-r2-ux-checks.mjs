// pushups TEST r2: S1 layout at 360/390/430/1280 both schemes + CLS + placement sentence in the viewport;
// S7 hint text + timing on black / two-people / cropped / frontal / portrait fake cameras; S6 portrait geometry;
// S8 stop/restart/double-start/deny; S9 hosts + post-load requests; S6 CPU-throttled counts.
//   node pushups-r2-ux-checks.mjs <url> <outDir> <clipDir>   (run from ~/projects/pushups)
import puppeteer from "puppeteer-core";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
const url = process.argv[2] ?? "https://pushups.kalpkan.com/";
const out = process.argv[3];
const clipDir = process.argv[4];
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400"];
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const result = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function launch(extra = []) {
  return puppeteer.launch({ executablePath: chrome, headless: true, ignoreDefaultArgs: ["--enable-automation"], args: [...base, ...extra] });
}
function fake(file) { return ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${file}`]; }
const readStats = () => ({ good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent, status: document.getElementById("status").textContent });

// ---- S1 layout
{
  const browser = await launch();
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  result.layout = [];
  for (const scheme of ["dark", "light"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    for (const w of [360, 390, 430, 1280]) {
      await page.setViewport({ width: w, height: w < 500 ? 844 : 800, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500 });
      await page.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
      await page.goto(url, { waitUntil: "networkidle0" });
      await sleep(1500);
      const m = await page.evaluate(() => {
        const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { top: Math.round(b.top), height: Math.round(b.height) }; };
        return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, innerH: innerHeight, cls: window.__cls, start: r("start-camera"), demo: r("play-demo"), status: r("status"), stage: r("stage"), notesTop: Math.round(document.querySelector(".notes").getBoundingClientRect().top), ledeTop: Math.round(document.querySelector(".lede").getBoundingClientRect().top), ledeText: document.querySelector(".lede").textContent.trim().slice(0, 90), bg: getComputedStyle(document.body).backgroundColor, fg: getComputedStyle(document.body).color, heavy: performance.getEntriesByType("resource").filter((e) => /wasm|models|demo/.test(e.name)).map((e) => e.name) };
      });
      await page.screenshot({ path: join(out, `s1-${scheme}-${w}.png`), fullPage: w <= 500 });
      result.layout.push({ scheme, w, ...m });
    }
  }
  await browser.close();
}

// ---- S7 hints: record every string drawn on the canvas (hint / flash / verdict) with a timestamp by
// wrapping CanvasRenderingContext2D.fillText before the page's scripts run, then derive when each hint
// first appeared after the session started.
const TEXT_HOOK = () => { window.__texts = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t, x, y, ...r) { window.__texts.push([performance.now(), String(t)]); return o.call(this, t, x, y, ...r); }; };
result.hints = {};
const HINT_CLIPS = [["black", join(clipDir, "black.mjpeg"), 4], ["two-people", join(clipDir, "two-people.mjpeg"), 6], ["cropped-right", join(clipDir, "cropped-right.mjpeg"), 6], ["frontal", join(clipDir, "frontal.mjpeg"), 6],
  ["IMG_1359", "/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/IMG_1359.mjpeg", 19], ["IMG_1305", "/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/IMG_1305.mjpeg", 9], ["IMG_1512", "/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/IMG_1512.mjpeg", 35]];
for (const [name, file, waitS] of HINT_CLIPS) {
  const browser = await launch(fake(file));
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1000, height: 1400 });
  await page.evaluateOnNewDocument(TEXT_HOOK);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
  const start = await page.evaluate(() => performance.now());
  const shotAt = { black: [1, 2], "two-people": [2, 5], "cropped-right": [2, 5], frontal: [2, 5], IMG_1359: [2, 5.5, 13.6], IMG_1305: [3, 8.5], IMG_1512: [4, 31, 33] }[name] ?? [];
  const t0 = Date.now();
  for (const t of shotAt) {
    const w = t * 1000 - (Date.now() - t0); if (w > 0) await sleep(w);
    await (await page.$("#stage")).screenshot({ path: join(out, `s7-${name}-${t}s.png`) });
  }
  const left = waitS * 1000 - (Date.now() - t0); if (left > 0) await sleep(left);
  const texts = await page.evaluate((s) => window.__texts.map(([t, x]) => [Math.round(t - s), x]), start);
  const final = await page.evaluate(readStats);
  // Timeline of distinct non-count strings: first time each appeared and the last time it was drawn.
  const seen = new Map();
  for (const [t, x] of texts) { if (/^\d+$/.test(x) || /good reps? ·/.test(x)) continue; const e = seen.get(x) ?? { first: t, last: t, n: 0 }; e.last = t; e.n++; seen.set(x, e); }
  const timeline = [...seen.entries()].map(([text, e]) => ({ text, firstMs: e.first, lastMs: e.last, frames: e.n })).sort((a, b) => a.firstMs - b.firstMs);
  // Segments: consecutive frames carrying a hint-like string (not "Good form"/"Bad form" verdicts)
  const hintOnly = texts.filter(([, x]) => !/^\d+$/.test(x) && !/good reps? ·/.test(x) && !/^(Good form|Bad form)/.test(x) && !/^Rep \d+/.test(x) && !/^Go lower/.test(x));
  result.hints[name] = { final, timeline, hintFramesTotal: hintOnly.length, framesTotal: texts.filter(([, x]) => /^\d+$/.test(x)).length, errors };
  await browser.close();
}

// ---- S6 portrait phone (390 px, 360x640 camera): geometry after Start, stats in view
{
  const browser = await launch(fake(join(clipDir, "portrait.mjpeg")));
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
  await sleep(4000);
  result.portrait = await page.evaluate(() => {
    const r = (sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), width: Math.round(b.width), height: Math.round(b.height) }; };
    const c = document.getElementById("canvas");
    return { innerW: innerWidth, innerH: innerHeight, scrollW: document.documentElement.scrollWidth, scrollY: Math.round(scrollY), canvasPx: [c.width, c.height], canvas: r("#canvas"), stage: r("#stage"), stats: r(".stats"), statsLast: r(".stats li:last-child"), good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, fps: document.getElementById("stat-fps").textContent, form: document.getElementById("stat-form").textContent };
  });
  await page.screenshot({ path: join(out, "s6-portrait-390-live.png") });
  await sleep(7000);
  result.portrait.end = await page.evaluate(readStats);
  await page.screenshot({ path: join(out, "s6-portrait-390-end.png") });
  await browser.close();
}

// ---- S8 + S9 with a real clip (good_IMG_4409): stop ends the track, restart 0/0, double start, hosts, requests
{
  const browser = await launch(fake("/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/good_IMG_4409.mjpeg"));
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1000, height: 1400 });
  const hosts = new Set(); const reqs = [];
  page.on("request", (r) => { hosts.add(new URL(r.url()).host); reqs.push({ u: r.url(), m: r.method(), pd: r.postData()?.length ?? 0 }); });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "networkidle0" });
  const nBefore = reqs.length;
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
  await sleep(6000);
  await page.evaluate(() => { const v = document.getElementById("video"); window.__tracks = v.srcObject ? v.srcObject.getTracks() : []; });
  result.beforeStop = await page.evaluate(readStats);
  await page.click("#stop");
  await sleep(500);
  result.stop = await page.evaluate(() => ({ status: document.getElementById("status").textContent, trackStates: window.__tracks.map((t) => t.readyState), srcObject: document.getElementById("video").srcObject, stopHidden: document.getElementById("stop").hidden, stageLive: document.getElementById("stage").classList.contains("live"), startDisabled: document.getElementById("start-camera").disabled, good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent }));
  await page.screenshot({ path: join(out, "s8-after-stop.png") });
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 60_000 });
  await sleep(1200);
  result.restart = await page.evaluate(readStats);
  await page.click("#stop");
  await sleep(300);
  await page.evaluate(() => { document.getElementById("start-camera").click(); document.getElementById("start-camera").click(); });
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 60_000 });
  await sleep(1500);
  result.doubleStart = await page.evaluate(readStats);
  await page.click("#stop");
  result.hosts = [...hosts];
  result.requestsAfterLoad = reqs.slice(nBefore).map((r) => `${r.m} ${new URL(r.u).pathname}${r.pd ? ` (${r.pd} B)` : ""}`).filter((p) => !/\/(wasm|models|assets)\//.test(p));
  result.errors = errors;
  await browser.close();
}

// ---- S8 deny
{
  const browser = await launch(["--deny-permission-prompts"]);
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1000, height: 1400 });
  await browser.defaultBrowserContext().overridePermissions(url, []);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.click("#start-camera");
  await page.waitForFunction(() => !/Loading|Asking|Nothing loads/.test(document.getElementById("status").textContent), { timeout: 120_000 }).catch(() => {});
  await sleep(1000);
  result.deny = await page.evaluate(() => ({ status: document.getElementById("status").textContent, demoDisabled: document.getElementById("play-demo").disabled, startDisabled: document.getElementById("start-camera").disabled, stageLive: document.getElementById("stage").classList.contains("live") }));
  await page.screenshot({ path: join(out, "s8-denied.png") });
  await browser.close();
}
writeFileSync(join(out, "ux-checks.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

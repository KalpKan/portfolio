// pushups TEST r1: S1 layout at 360/390/430/1280 in both schemes with a layout-shift observer, S7 no-pose hint timing
// on a black fake camera, S8 stop/restart/double-start and permission denial, S9 hosts and post-load requests.
//   node pushups-r1-ux-checks.mjs https://pushups.kalpkan.com/ <outDir> <black.mjpeg>
// black.mjpeg: "<venv ffmpeg> -f lavfi -i color=c=black:s=640x360:r=30 -t 12 -c:v mjpeg -q:v 5 black.mjpeg".
// Run from ~/projects/pushups (needs its puppeteer-core). Output JSON: pushups-r1-ux-checks-2026-09-18.json.
import puppeteer from "puppeteer-core";
import { join } from "node:path";
const url = process.argv[2] ?? "https://pushups.kalpkan.com/";
const out = process.argv[3];
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const mjpeg = process.argv[4];
const base = ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400"];
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const result = {};
async function launch(extra = []) {
  return puppeteer.launch({ executablePath: chrome, headless: true, ignoreDefaultArgs: ["--enable-automation"], args: [...base, ...extra] });
}
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
      await new Promise((r) => setTimeout(r, 1500));
      const m = await page.evaluate(() => {
        const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { top: b.top, height: b.height }; };
        const tips = [...document.querySelectorAll(".notes li")].map((li) => li.textContent);
        return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, innerH: innerHeight, cls: window.__cls, start: r("start-camera"), demo: r("play-demo"), status: r("status"), stage: r("stage"), notesTop: document.querySelector(".notes").getBoundingClientRect().top, ledeText: document.querySelector(".lede").textContent.trim(), tips, bg: getComputedStyle(document.body).backgroundColor, fg: getComputedStyle(document.body).color, heavy: performance.getEntriesByType("resource").filter((e) => /wasm|models|demo/.test(e.name)).map((e) => e.name) };
      });
      await page.screenshot({ path: join(out, `s1-${scheme}-${w}.png`), fullPage: w <= 500 });
      result.layout.push({ scheme, w, ...m });
    }
  }
  await browser.close();
}
if (mjpeg) {
  const browser = await launch(["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${mjpeg}`]);
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1000, height: 1400 });
  const hosts = new Set(); const reqs = [];
  page.on("request", (r) => { hosts.add(new URL(r.url()).host); reqs.push(r.url()); });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "networkidle0" });
  const nBefore = reqs.length;
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
  const t0 = Date.now();
  await page.waitForFunction(() => document.getElementById("stat-form").textContent === "no pose", { timeout: 15_000 }).catch(() => {});
  result.noPoseAfterMs = Date.now() - t0;
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: join(out, "s7-black-camera.png") });
  await page.evaluate(() => { const v = document.getElementById("video"); window.__tracks = v.srcObject ? v.srcObject.getTracks() : []; });
  await page.click("#stop");
  await new Promise((r) => setTimeout(r, 500));
  result.stop = await page.evaluate(() => ({ status: document.getElementById("status").textContent, trackStates: window.__tracks.map((t) => t.readyState), srcObject: document.getElementById("video").srcObject, stopHidden: document.getElementById("stop").hidden, stageLive: document.getElementById("stage").classList.contains("live"), startDisabled: document.getElementById("start-camera").disabled, good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent }));
  await page.screenshot({ path: join(out, "s8-after-stop.png") });
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 1500));
  result.restart = await page.evaluate(() => ({ good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, fps: document.getElementById("stat-fps").textContent }));
  await page.click("#stop");
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => { document.getElementById("start-camera").click(); document.getElementById("start-camera").click(); });
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 1500));
  result.doubleStart = await page.evaluate(() => ({ status: document.getElementById("status").textContent, fps: document.getElementById("stat-fps").textContent }));
  await page.click("#stop");
  result.hosts = [...hosts];
  result.requestsAfterLoad = reqs.slice(nBefore).map((u) => new URL(u).pathname).filter((p) => !/^\/(wasm|models|assets)\//.test(p));
  result.errors = errors;
  await browser.close();
}
{
  const browser = await launch(["--deny-permission-prompts"]);
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1000, height: 1400 });
  await browser.defaultBrowserContext().overridePermissions(url, []);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.click("#start-camera");
  await page.waitForFunction(() => !/Loading|Asking|Nothing loads/.test(document.getElementById("status").textContent), { timeout: 120_000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1000));
  result.deny = await page.evaluate(() => ({ status: document.getElementById("status").textContent, demoDisabled: document.getElementById("play-demo").disabled, startDisabled: document.getElementById("start-camera").disabled, stageLive: document.getElementById("stage").classList.contains("live") }));
  await page.screenshot({ path: join(out, "s8-denied.png") });
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));

// Full-corpus run through the real page (file input -> createImageBitmap -> canvas -> OpenCV.js)
// on the local build, plus main-thread / heap / canvas measurements on the huge files.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FIX = "/Users/kalp/projects/microtubules/tests/fixtures";
const gt = JSON.parse(fs.readFileSync(path.join(FIX, "ground_truth.json"), "utf8"));
const BASE = process.env.BASE || "http://localhost:8792/";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleErrors.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  await page.goto(BASE);
  await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Ready"), null, { timeout: 60000 });
  // long-task observer
  await page.evaluate(() => {
    window.__longTasks = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__longTasks.push(Math.round(e.duration)); }).observe({ entryTypes: ["longtask"] });
  });

  const input = page.locator("#file-input");
  const rows = [];
  const files = [...Object.keys(gt.images), ...Object.keys(gt.non_images)];
  for (const f of files) {
    const abs = path.join(FIX, f);
    if (!fs.existsSync(abs)) { rows.push({ f, skipped: true }); continue; }
    await page.evaluate(() => { window.__longTasks = []; });
    const t0 = Date.now();
    await input.setInputFiles(abs);
    let st = "";
    for (let i = 0; i < 2400; i++) {
      await page.waitForTimeout(25);
      st = await page.evaluate(() => document.getElementById("status").textContent);
      if (/^Done|^Could not|^OpenCV failed|^Refused|^That file/.test(st)) break;
    }
    const wall = Date.now() - t0;
    const r = await page.evaluate(() => {
      const g = (id) => document.getElementById(id).textContent;
      const ic = document.getElementById("input-canvas"), oc = document.getElementById("overlay-canvas");
      const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
      return { percent: g("percent"), threshold: g("threshold"), pixels: g("pixels"), dims: g("dims"), elapsed: g("elapsed"),
        resultsHidden: document.getElementById("results").hidden, inputCanvas: [ic.width, ic.height], overlayCanvas: [oc.width, oc.height],
        heapMB: mem, longTasks: window.__longTasks.slice(), maxLong: Math.max(0, ...window.__longTasks) };
    });
    const ref = gt.images[f];
    const got = st.startsWith("Done") ? Number(r.percent) : null;
    const row = { f, status: st.slice(0, 120), got, ref: ref ? ref.percent : null, diff: ref && got !== null ? +(got - ref.percent).toFixed(4) : null,
      threshold: r.threshold, refThreshold: ref ? ref.threshold : null, pixels: r.pixels, refPixels: ref ? `${ref.green_pixels} / ${ref.total_pixels}` : null,
      dims: r.dims, refDims: ref ? `${ref.width} × ${ref.height}` : null, elapsed: r.elapsed, wallMs: wall, resultsHidden: r.resultsHidden,
      inputCanvas: r.inputCanvas, overlayCanvas: r.overlayCanvas, heapMB: r.heapMB, maxLongTaskMs: r.maxLong, longTaskCount: r.longTasks.length };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  fs.writeFileSync(path.join(__dirname, "corpus-results.json"), JSON.stringify({ rows, consoleErrors }, null, 2));
  console.log("console:", consoleErrors.slice(0, 20));
  await browser.close();
})();

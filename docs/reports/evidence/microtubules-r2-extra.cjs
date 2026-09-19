#!/usr/bin/env node
/**
 * TEST round 2 extras for microtubules (things scripts/browser-check.cjs does not cover).
 * Run from web/ : NODE_PATH=node_modules node docs/reports/evidence/microtubules-r2-extra.cjs
 *   LOCAL=http://127.0.0.1:8792/   (dist + /fixtures + /fixtures2 served locally)
 *   LIVE=https://microtubules.kalpkan.com/
 * Sections: headed (visible Chromium, 12/24/30 MP main-thread gaps), throttle (Ready time on 4G presets, fresh cache),
 * offline (fresh load, no taps, then samples + upload), fallback (worker without OffscreenCanvas = Safari < 16.4),
 * limit (> 30 MP refusal), gif, layout (tall/wide at 360, CLS, reduced motion), themes (light/dark screenshots + contrast),
 * busy (double taps), camera (input#camera-input path on a phone viewport).
 */
const { chromium, webkit, devices } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const LOCAL = process.env.LOCAL || "http://127.0.0.1:8792/";
const LIVE = process.env.LIVE || "https://microtubules.kalpkan.com/";
const FIX = path.resolve(__dirname, "../../../../microtubules/tests/fixtures");
const FIX2 = process.env.FIX2 || "/private/tmp/claude-501/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/scratchpad/mt-site/fixtures2";
const SHOTS = path.join(__dirname, "microtubules-r2-shots");
const ONLY = new Set((process.env.ONLY || "headed,throttle,offline,fallback,limit,gif,layout,themes,busy,camera").split(","));
fs.mkdirSync(SHOTS, { recursive: true });
const out = {};
const log = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };

const DONE = /^Done|could not be read|megapixels|^Could not|crashed|^OpenCV failed/;
async function waitReady(page, timeout = 120000) {
  const t0 = Date.now();
  await page.waitForFunction(() => /^Ready/.test(document.getElementById("status").textContent), null, { timeout });
  return Date.now() - t0;
}
async function readout(page) {
  return page.evaluate(() => {
    const g = (id) => (document.getElementById(id) || { textContent: "" }).textContent.trim();
    const ic = document.getElementById("input-canvas"), oc = document.getElementById("overlay-canvas");
    const w = document.getElementById("warnings");
    return { status: g("status").slice(0, 200), percent: g("percent"), threshold: g("threshold"), pixels: g("pixels"), dims: g("dims"), nucleus: g("nucleus"),
      hidden: document.getElementById("results").hidden, warn: w.hidden ? "" : w.textContent.trim().slice(0, 120),
      canvases: [ic.width, ic.height, oc.width, oc.height], heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      scrollY: Math.round(scrollY), resultsTop: Math.round(document.getElementById("results").getBoundingClientRect().top) };
  });
}
async function upload(page, file, input = "#file-input") {
  await page.evaluate(() => { window.__gaps = []; window.__last = performance.now(); window.__tick = setInterval(() => { const n = performance.now(); window.__gaps.push(n - window.__last); window.__last = n; }, 16); });
  const t0 = Date.now();
  await page.locator(input).setInputFiles(file);
  await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 120000 });
  const wall = Date.now() - t0;
  const maxGap = await page.evaluate(() => { clearInterval(window.__tick); return Math.round(Math.max(0, ...window.__gaps)); });
  return { wall, maxGap, ...(await readout(page)) };
}

async function headed() {
  const browser = await chromium.launch({ headless: false, args: ["--enable-precise-memory-info"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(LOCAL); await waitReady(page);
  const rows = [];
  for (const f of ["edge/huge-12mp-4000x3000.jpg", "edge/huge-12mp-4000x3000.png", "edge/generated-large/huge-24mp-6000x4000.jpg"]) {
    const r = await upload(page, path.join(FIX, f));
    rows.push({ file: f, wall: r.wall, maxGap: r.maxGap, heapMB: r.heapMB, percent: r.percent, canvases: r.canvases, status: r.status.slice(0, 60) });
  }
  const r = await upload(page, path.join(FIX2, "at-limit-6000x5000.jpg"));
  rows.push({ file: "fixtures2/at-limit-6000x5000.jpg (30.0 MP)", wall: r.wall, maxGap: r.maxGap, heapMB: r.heapMB, percent: r.percent, threshold: r.threshold, warn: r.warn, canvases: r.canvases, status: r.status.slice(0, 80) });
  const w = page.workers()[0];
  const wasmMB = w ? await w.evaluate(() => (self.cv && self.cv.HEAPU8 ? Math.round(self.cv.HEAPU8.length / 1048576) : null)).catch(() => null) : null;
  log("headed", { rows, workerWasmHeapMB: wasmMB, visibility: await page.evaluate(() => document.visibilityState) });
  await browser.close();
}

async function throttle() {
  const rows = [];
  for (const [label, down, latency, cpu] of [["9 Mbps", 9e6 / 8, 100, 4], ["Fast 4G (4 Mbps)", 4e6 / 8, 150, 4], ["Slow 4G (1.6 Mbps)", 1.6e6 / 8, 150, 4]]) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency, downloadThroughput: down, uploadThroughput: down });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    const t0 = Date.now();
    const texts = [];
    await page.goto(LIVE);
    const firstPaint = Date.now() - t0;
    await page.exposeFunction("__note", (t) => texts.push([Date.now() - t0, t]));
    await page.evaluate(() => { const s = document.getElementById("status"); new MutationObserver(() => window.__note(s.textContent.slice(0, 60))).observe(s, { childList: true, characterData: true, subtree: true }); });
    let ready;
    try { await waitReady(page, 90000); ready = Date.now() - t0; } catch { ready = null; }
    rows.push({ label, firstPaintMs: firstPaint, readyMs: ready, progress: texts.filter((t) => /Downloading/.test(t[1])).length, lastTexts: texts.slice(-3) });
    await browser.close();
  }
  log("throttle", rows);
}

async function offline() {
  const rows = {};
  for (const [engine, type] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const reqs = [];
    page.on("request", (r) => reqs.push(r.url()));
    await page.goto(LIVE); await waitReady(page);
    await page.waitForTimeout(1500); // sample prefetch
    await ctx.setOffline(true);
    reqs.length = 0;
    const res = [];
    for (const s of ["P1_W1_C1", "P3_W2_C3", "P1_W3_C1"]) {
      await page.click(`button[data-sample="${s}"]`);
      await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
      res.push((await readout(page)).percent + " " + (await readout(page)).status.slice(0, 40));
    }
    let up;
    try { up = await upload(page, path.join(FIX, "cells/P3_W2_C3.PNG")); up = up.percent + " " + up.status.slice(0, 40); } catch (e) { up = "ERR " + e.message.slice(0, 80); }
    rows[engine] = { samples: res, upload: up, requestsWhileOffline: reqs.filter((u) => !u.startsWith("blob:")) };
    await browser.close();
  }
  log("offline", rows);
}

/** Safari < 16.4 has no OffscreenCanvas in workers: neutralise it inside the worker script and exercise the page-decode fallback. */
async function fallback() {
  const rows = {};
  for (const [engine, type] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch({ args: engine === "chromium" ? ["--enable-precise-memory-info"] : [] });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    await ctx.route(/assets\/worker-.*\.js$/, async (route) => {
      const res = await route.fetch();
      const body = "self.OffscreenCanvas = undefined;\n" + (await res.text());
      await route.fulfill({ response: res, body, headers: { ...res.headers(), "content-type": "text/javascript" } });
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 120)); });
    await page.goto(LOCAL); await waitReady(page);
    const r = [];
    for (const f of ["cells/P1_W1_C1.PNG", "fullfield/Plate2_45_nocodazole45uM.png", "fullfield/Plate1_W1_untreated.png", "edge/exif-rotated-orientation6.jpg", "edge/truncated.png", "edge/cell-grayscale.png", "edge/huge-12mp-4000x3000.jpg"]) {
      const u = await upload(page, path.join(FIX, f));
      r.push({ file: f, percent: u.percent, threshold: u.threshold, dims: u.dims, wall: u.wall, maxGap: u.maxGap, heapMB: u.heapMB, hidden: u.hidden, warn: u.warn.slice(0, 40), canvases: u.canvases, status: u.status.slice(0, 90) });
    }
    // sample + downloads on this path
    await page.click('button[data-sample="P1_W1_C1"]');
    await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
    const dl = {};
    for (const kind of ["overlay", "mask"]) {
      try {
        const [d] = await Promise.all([page.waitForEvent("download", { timeout: 15000 }), page.click(`#download-${kind}`)]);
        const file = path.join(SHOTS, `fallback-${engine}-${d.suggestedFilename()}`);
        await d.saveAs(file);
        dl[kind] = { name: d.suggestedFilename(), bytes: fs.statSync(file).size };
      } catch (e) { dl[kind] = "ERR " + e.message.slice(0, 80); }
    }
    rows[engine] = { rows: r, sample: (await readout(page)).percent, downloads: dl, errors: errors.slice(0, 5) };
    await browser.close();
  }
  log("fallback", rows);
}

async function limit() {
  const rows = {};
  for (const [engine, type] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(LOCAL); await waitReady(page);
    await page.click('button[data-sample="P1_W1_C1"]');
    await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
    const r = [];
    for (const f of ["over-limit-5600x5600.png", "over-limit-5600x5600.jpg"]) {
      const u = await upload(page, path.join(FIX2, f));
      r.push({ file: f, wall: u.wall, hidden: u.hidden, status: u.status });
    }
    rows[engine] = r;
    await browser.close();
  }
  log("limit", rows);
}

async function gif() {
  const rows = {};
  for (const [engine, type] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(LOCAL); await waitReady(page);
    const u = await upload(page, path.join(FIX2, "cell.gif"));
    rows[engine] = { percent: u.percent, threshold: u.threshold, pixels: u.pixels, status: u.status.slice(0, 60), python: "24.7425 thr 36 1105/4466" };
    await browser.close();
  }
  log("gif", rows);
}

async function layout() {
  const browser = await chromium.launch();
  const rows = {};
  for (const width of [360, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 664 : 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent });
    const page = await ctx.newPage();
    await page.goto(LIVE); await waitReady(page);
    const r = {};
    for (const f of ["edge/tall-100x2000.png", "edge/wide-2000x100.png", "edge/one-pixel.png", "fullfield/Plate1_W1_untreated.png"]) {
      const u = await upload(page, path.join(FIX, f));
      await page.waitForTimeout(900);
      r[f] = await page.evaluate(() => { const c = document.getElementById("overlay-canvas").getBoundingClientRect(); return { canvasCss: [Math.round(c.width), Math.round(c.height)], pageH: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, resultsTop: Math.round(document.getElementById("results").getBoundingClientRect().top) }; });
      r[f].percent = u.percent; r[f].warn = u.warn.slice(0, 50);
      if (f.includes("tall")) await page.screenshot({ path: path.join(SHOTS, `phone-${width}-tall.png`) });
    }
    rows[width] = r;
    await ctx.close();
  }
  // CLS on load (desktop + phone) and reduced-motion scroll behaviour
  for (const [label, opts] of [["desktop", { viewport: { width: 1280, height: 800 } }], ["phone390", { viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    await page.goto(LIVE); await waitReady(page);
    await page.waitForTimeout(1000);
    const clsLoad = await page.evaluate(() => window.__cls);
    await page.click('button[data-sample="P3_W2_C3"]');
    await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
    await page.waitForTimeout(300);
    const after = await readout(page);
    rows[`cls-${label}`] = { clsLoad: +clsLoad.toFixed(4), clsAfterTap: +(await page.evaluate(() => window.__cls)).toFixed(4), reducedMotionScrollY: after.scrollY, resultsTop: after.resultsTop };
    await ctx.close();
  }
  log("layout", rows);
  await browser.close();
}

function lum([r, g, b]) { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
function contrast(a, b) { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2); }
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

async function themes() {
  const browser = await chromium.launch();
  const rows = {};
  for (const scheme of ["light", "dark"]) {
    for (const [label, opts] of [["desktop", { viewport: { width: 1280, height: 800 } }], ["phone390", { viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
      const ctx = await browser.newContext({ ...opts, colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto(LIVE); await waitReady(page);
      await page.screenshot({ path: path.join(SHOTS, `${label}-${scheme}-idle.png`) });
      await page.click('button[data-sample="P1_W1_C1"]');
      await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SHOTS, `${label}-${scheme}-after-sample.png`) });
      if (label === "desktop") await page.screenshot({ path: path.join(SHOTS, `${label}-${scheme}-full.png`), fullPage: true });
      // contrast of the copy people read
      const c = await page.evaluate(() => {
        const bg = (el) => { let e = el; while (e) { const b = getComputedStyle(e).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; e = e.parentElement; } return getComputedStyle(document.body).backgroundColor; };
        const pick = (sel) => { const el = document.querySelector(sel); return el ? { fg: getComputedStyle(el).color, bg: bg(el), size: getComputedStyle(el).fontSize } : null; };
        return { lede: pick(".lede"), hint: pick(".hint"), status: pick("#status"), link: pick(".how a"), footerLink: pick(".footer a"), percent: pick("#percent"), label: pick(".readout-label"), definition: pick(".definition"), dt: pick(".details dt"), dd: pick(".details dd"), summary: pick(".explain summary"), reference: pick(".reference p"), caption: pick("figcaption"), buttonSecondary: pick("button.sample"), buttonPrimary: pick(".button.primary"), sampleLabel: pick(".samples-label") };
      });
      const ratios = {};
      for (const [k, v] of Object.entries(c)) if (v) ratios[k] = { ratio: contrast(parse(v.fg), parse(v.bg)), size: v.size, fg: v.fg, bg: v.bg };
      // warning look
      await page.locator("#file-input").setInputFiles(path.join(FIX, "edge/cell-grayscale.png"));
      await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
      await page.waitForTimeout(900);
      const warnC = await page.evaluate(() => { const w = document.querySelector("#warnings p"); const s = document.getElementById("status"); return { warn: [getComputedStyle(w).color, getComputedStyle(w.parentElement).backgroundColor], status: getComputedStyle(s).color }; });
      ratios.warning = { ratio: contrast(parse(warnC.warn[0]), parse(warnC.warn[1])), fg: warnC.warn[0], bg: warnC.warn[1] };
      await page.screenshot({ path: path.join(SHOTS, `${label}-${scheme}-warning.png`) });
      // error look
      await page.locator("#file-input").setInputFiles(path.join(FIX, "edge/not-an-image.txt"));
      await page.waitForFunction((re) => new RegExp(re).test(document.getElementById("status").textContent), DONE.source, { timeout: 30000 });
      const err = await page.evaluate(() => { const s = document.getElementById("status"); const bg = getComputedStyle(s.parentElement).backgroundColor; return [getComputedStyle(s).color, bg]; });
      ratios.error = { ratio: contrast(parse(err[0]), parse(err[1])), fg: err[0], bg: err[1] };
      await page.screenshot({ path: path.join(SHOTS, `${label}-${scheme}-error.png`) });
      rows[`${label}-${scheme}`] = ratios;
      await ctx.close();
    }
  }
  // focus-visible styling
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(LIVE); await waitReady(page);
  const focus = [];
  for (let i = 0; i < 7; i++) { await page.keyboard.press("Tab"); focus.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return `${a.tagName}#${a.id || ""}.${[...a.classList].join(".")} outline=${cs.outlineStyle} ${cs.outlineWidth} shadow=${cs.boxShadow.slice(0, 30)}`; })); }
  rows.keyboard = { tabOrder: focus, url: page.url() };
  // Space activates the focused sample button when a button has focus
  await page.goto(LIVE); await waitReady(page);
  await page.locator('button[data-sample="P1_W1_C1"]').focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);
  rows.keyboard.statusAfterSpace = (await readout(page)).status.slice(0, 60);
  log("themes", rows);
  await browser.close();
}

async function busy() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(LOCAL); await waitReady(page);
  // fire a 24 MP upload then hammer the sample buttons and another upload while busy
  const beacon = [];
  page.on("request", (r) => { if (r.url().includes("/ingest/")) beacon.push(r.method() + " " + r.url().slice(0, 60)); });
  await page.locator("#file-input").setInputFiles(path.join(FIX, "edge/generated-large/huge-24mp-6000x4000.jpg"));
  await page.waitForTimeout(150);
  const during = await page.evaluate(() => ({ status: document.getElementById("status").textContent.slice(0, 60), sampleDisabled: document.querySelector("button.sample").disabled, fileDisabled: document.getElementById("file-input").disabled, stale: document.getElementById("results").classList.contains("stale"), cursor: getComputedStyle(document.querySelector(".button.primary")).cursor, opacity: getComputedStyle(document.querySelector("button.sample")).opacity }));
  for (let i = 0; i < 5; i++) await page.click('button[data-sample="P1_W1_C1"]', { force: true }).catch(() => {});
  const statuses = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const s = await page.evaluate(() => document.getElementById("status").textContent.slice(0, 60));
    if (!statuses.length || statuses[statuses.length - 1] !== s) statuses.push(s);
    if (/^Done/.test(s)) break;
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(500);
  const final = await readout(page);
  log("busy", { during, statuses, finalPercent: final.percent, finalDims: final.dims, finalStatus: final.status.slice(0, 60) });
  await browser.close();
}

async function camera() {
  const rows = {};
  for (const [engine, type] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch();
    const ctx = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent });
    const page = await ctx.newPage();
    await page.goto(LIVE); await waitReady(page);
    const attrs = await page.evaluate(() => { const c = document.getElementById("camera-input"); return { accept: c.accept, capture: c.getAttribute("capture"), labelText: c.parentElement.textContent.trim() }; });
    const u = await upload(page, path.join(FIX, "edge/exif-rotated-orientation6.jpg"), "#camera-input");
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => { const p = document.getElementById("percent").getBoundingClientRect(); const c = document.getElementById("input-canvas"); return { percentY: [Math.round(p.top), Math.round(p.bottom)], innerH: innerHeight, canvas: [c.width, c.height], scrollY: Math.round(scrollY) }; });
    await page.screenshot({ path: path.join(SHOTS, `camera-${engine}-390.png`) });
    rows[engine] = { attrs, percent: u.percent, dims: u.dims, threshold: u.threshold, status: u.status.slice(0, 60), after };
    await browser.close();
  }
  log("camera", rows);
}

(async () => {
  const sections = { headed, throttle, offline, fallback, limit, gif, layout, themes, busy, camera };
  for (const [name, fn] of Object.entries(sections)) {
    if (!ONLY.has(name)) continue;
    try { await fn(); } catch (e) { log(name + "-error", String(e.message || e).slice(0, 300)); }
  }
  fs.writeFileSync(path.join(__dirname, "microtubules-r2-extra.json"), JSON.stringify(out, null, 2));
  console.log("wrote microtubules-r2-extra.json");
})();

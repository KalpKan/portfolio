// Live-site checks: network during analysis, offline after load, CLS, phone widths, button sizes,
// result visibility after tap at 390 px, EXIF fixture, dark/light screenshots.
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");
const LIVE = "https://microtubules.kalpkan.com/";
const OUT = __dirname;
const FIX = "/Users/kalp/projects/microtubules/tests/fixtures";

async function waitReady(page) {
  await page.waitForFunction(() => /^Ready|^Done|failed/.test(document.getElementById("status").textContent), null, { timeout: 90000 });
}
async function waitDone(page) {
  await page.waitForFunction(() => /^Done|^Could not|^OpenCV failed/.test(document.getElementById("status").textContent), null, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = {};

  // ---- Desktop: network requests during load and during analysis
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const reqs = [];
    page.on("request", (r) => reqs.push({ url: r.url(), method: r.method(), post: r.postData() ? r.postData().slice(0, 400) : null }));
    const consoleMsgs = [];
    page.on("console", (m) => consoleMsgs.push(`${m.type()}: ${m.text().slice(0, 160)}`));
    const t0 = Date.now();
    await page.goto(LIVE);
    const statusEarly = await page.evaluate(() => document.getElementById("status").textContent);
    await waitReady(page);
    out.readyMs = Date.now() - t0;
    out.statusEarly = statusEarly;
    // CLS + LCP
    out.cls = await page.evaluate(() => new Promise((res) => {
      let cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      setTimeout(() => res(cls), 500);
    }));
    out.loadRequests = reqs.map((r) => r.url.replace(LIVE, "/"));
    reqs.length = 0;
    // analyse a sample
    const ts = Date.now();
    await page.click('button[data-sample="P1_W1_C1"]');
    await waitDone(page);
    out.sampleMs = Date.now() - ts;
    out.sampleResult = await page.evaluate(() => ({ p: document.getElementById("percent").textContent, t: document.getElementById("threshold").textContent, px: document.getElementById("pixels").textContent }));
    await page.waitForTimeout(1500);
    out.sampleRequests = reqs.map((r) => ({ url: r.url.replace(LIVE, "/"), method: r.method, post: r.post }));
    reqs.length = 0;
    // upload a fixture
    await page.locator("#file-input").setInputFiles(path.join(FIX, "edge/exif-rotated-orientation6.jpg"));
    await waitDone(page);
    await page.waitForTimeout(1500);
    out.uploadRequests = reqs.map((r) => ({ url: r.url.replace(LIVE, "/"), method: r.method, post: r.post }));
    out.exif = await page.evaluate(() => ({ p: document.getElementById("percent").textContent, dims: document.getElementById("dims").textContent, status: document.getElementById("status").textContent }));
    // offline
    await ctx.setOffline(true);
    await page.click('button[data-sample="P3_W2_C3"]');
    await waitDone(page);
    out.offlineSample = await page.evaluate(() => ({ p: document.getElementById("percent").textContent, status: document.getElementById("status").textContent }));
    await page.locator("#file-input").setInputFiles(path.join(FIX, "cells/P1_W3_C1.PNG"));
    await waitDone(page);
    out.offlineUpload = await page.evaluate(() => ({ p: document.getElementById("percent").textContent, status: document.getElementById("status").textContent }));
    await ctx.setOffline(false);
    out.consoleDesktop = consoleMsgs.filter((m) => !m.startsWith("log"));
    // accept attribute
    out.accept = await page.evaluate(() => [document.getElementById("file-input").accept, document.getElementById("camera-input").accept, document.getElementById("camera-input").getAttribute("capture")]);
    // stale-result check: after an error does the old percent remain?
    await page.locator("#file-input").setInputFiles(path.join(FIX, "edge/not-an-image.txt"));
    await waitDone(page);
    out.afterBadFile = await page.evaluate(() => ({ status: document.getElementById("status").textContent, resultsHidden: document.getElementById("results").hidden, percent: document.getElementById("percent").textContent, dims: document.getElementById("dims").textContent, marked: document.getElementById("results").className }));
    await page.screenshot({ path: path.join(OUT, "desktop-after-bad-file.png"), fullPage: true });
    await ctx.close();
  }

  // ---- Phone widths: overflow, button heights, result visibility after tap, light/dark screenshots
  for (const w of [360, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent });
    const page = await ctx.newPage();
    await page.goto(LIVE);
    await waitReady(page);
    const m = await page.evaluate(() => {
      const btns = [...document.querySelectorAll(".button, button")].map((b) => ({ text: b.textContent.trim().slice(0, 24), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) }));
      return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, bodyScrollW: document.body.scrollWidth, btns, statusTop: Math.round(document.getElementById("status").getBoundingClientRect().top), resultsTop: Math.round(document.getElementById("results").getBoundingClientRect().top) };
    });
    out[`phone${w}`] = m;
    if (w === 390) {
      await page.screenshot({ path: path.join(OUT, "phone-390-dark-load.png") });
      const ts = Date.now();
      await page.click('button[data-sample="P1_W1_C1"]');
      await waitDone(page);
      const tapMs = Date.now() - ts;
      await page.waitForTimeout(800);
      const vis = await page.evaluate(() => {
        const r = document.getElementById("percent").getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), innerH: window.innerHeight, scrollY: Math.round(window.scrollY), visible: r.top >= 0 && r.bottom <= window.innerHeight, resultsTop: Math.round(document.getElementById("results").getBoundingClientRect().top) };
      });
      out.phone390AfterTap = { tapMs, ...vis };
      await page.screenshot({ path: path.join(OUT, "phone-390-dark-after-sample.png") });
      await page.evaluate(() => document.getElementById("results").scrollIntoView());
      await page.screenshot({ path: path.join(OUT, "phone-390-dark-result.png") });
      await page.emulateMedia({ colorScheme: "light" });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, "phone-390-light-result.png") });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(OUT, "phone-390-light-load.png") });
      await page.screenshot({ path: path.join(OUT, "phone-390-light-full.png"), fullPage: true });
    }
    await ctx.close();
  }
  // ---- Desktop screenshots both themes
  for (const scheme of ["dark", "light"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(LIVE);
    await waitReady(page);
    await page.click('button[data-sample="P3_W2_C3"]');
    await waitDone(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `desktop-${scheme}-full.png`), fullPage: true });
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, "live-results.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();

// TEST round 3 harness: the repo's scripts/e2e-camera.mjs judge, plus CPU throttling (THROTTLE=n via CDP,
// a phone-like frame rate), a pipeline fps counter, the stream / stage geometry (portrait check), every
// #status change with a timestamp (hint flicker), and BROWSER=playwright to drive Playwright's Chromium
// instead of Google Chrome. Same judge rules as the repo's harness (D7/D9 handling included).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/Users/kalp/projects/emotes/package.json");
const puppeteer = require("puppeteer-core");

const url = process.argv[2] ?? "http://localhost:4173/";
const clip = resolve(process.env.CLIP ?? "/Users/kalp/projects/emotes/tests/fixtures/clips/e2e-three-gestures.mjpeg");
const labels = JSON.parse(readFileSync(resolve(process.env.LABELS ?? "/Users/kalp/projects/emotes/tests/fixtures/clips/e2e-labels.json"), "utf8"));
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WINDOW = Number(process.env.WINDOW ?? 1000);
const THROTTLE = Number(process.env.THROTTLE ?? 0);
const width = Number(process.env.WIDTH ?? 1000);
const args = [
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
  `--use-file-for-fake-video-capture=${clip}`,
  "--autoplay-policy=no-user-gesture-required",
  ...(process.env.GPU ? ["--use-gl=angle", "--use-angle=metal"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
  "--window-size=1000,1400",
];
let browser, page, cdp;
if (process.env.BROWSER === "playwright") {
  const pwRequire = createRequire("/Users/kalp/projects/promptflip/package.json");
  const { chromium } = pwRequire("playwright");
  browser = await chromium.launch({ headless: true, args });
  const context = await browser.newContext({ viewport: { width, height: 1400 }, colorScheme: process.env.SCHEME ?? "dark" });
  page = await context.newPage();
  cdp = await context.newCDPSession(page);
} else {
  browser = await puppeteer.launch({ executablePath: chrome, headless: true, args });
  page = await browser.newPage();
  await page.setViewport({ width, height: 1400 });
  cdp = await page.createCDPSession();
}
try {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/^(INFO:|[WI]\d{4} )/.test(m.text())) errors.push(m.text()); });
  await page.goto(url, { waitUntil: "networkidle" in page ? "networkidle" : "networkidle0" }).catch(async () => page.goto(url, { waitUntil: "networkidle0" }));
  await page.evaluate(() => {
    window.__fires = []; window.__ticks = 0; window.__status = []; window.__tickAt = [];
    document.getElementById("video").addEventListener("playing", () => { window.__streamAt ??= performance.now(); }, { once: true });
    const box = document.getElementById("emote");
    new MutationObserver(() => {
      if (!box.classList.contains("hidden") && box.classList.contains("pop")) {
        const name = document.getElementById("emote-name").textContent;
        const last = window.__fires[window.__fires.length - 1];
        if (!last || last.name !== name || performance.now() - last.at > 500) window.__fires.push({ name, at: performance.now() });
      }
    }).observe(box, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(() => { window.__ticks++; window.__tickAt.push(performance.now()); }).observe(document.getElementById("val-flex"), { childList: true });
    const st = document.getElementById("status");
    new MutationObserver(() => window.__status.push({ at: performance.now(), text: st.textContent })).observe(st, { childList: true });
  });
  if (THROTTLE > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
  await page.click("#start-camera");
  await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Watching"), { timeout: 180_000 });
  const { t0, streamAt } = await page.evaluate(() => ({ t0: performance.now(), streamAt: window.__streamAt, }));
  await page.evaluate(() => { window.__ticks = 0; window.__tickAt = []; });
  await new Promise((r) => setTimeout(r, labels.durationMs + 500));
  const D = labels.durationMs;
  const { raw, ticks, tickAt, status, geom } = await page.evaluate(() => {
    const v = document.getElementById("video"); const s = document.getElementById("stage"); const r = s.getBoundingClientRect();
    return { raw: window.__fires, ticks: window.__ticks, tickAt: window.__tickAt, status: window.__status,
      geom: { videoWidth: v.videoWidth, videoHeight: v.videoHeight, stageAspect: s.style.aspectRatio, stageW: Math.round(r.width), stageH: Math.round(r.height), scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth } };
  });
  const fires = raw.map((f) => ({ name: f.name, ms: Math.round((f.at - streamAt) % D), sinceStart: Math.round(f.at - t0), pass: Math.floor((f.at - streamAt) / D) })).filter((f) => f.sinceStart < D);
  const phase = Math.round((t0 - streamAt) % D);
  const secs = (D + 500) / 1000;
  const gaps = tickAt.slice(1).map((t, i) => t - tickAt[i]).sort((a, b) => a - b);
  const p50 = gaps[Math.floor(gaps.length / 2)] ?? 0, p95 = gaps[Math.floor(gaps.length * 0.95)] ?? 0, max = gaps[gaps.length - 1] ?? 0;
  console.log(`clip ${labels.file} (${D} ms), url ${url}, width ${width}, throttle ${THROTTLE || "none"}, browser ${process.env.BROWSER ?? "chrome"}; models ready ${Math.round(t0 - streamAt)} ms after the stream started (clip position ${phase} ms)`);
  console.log(`pipeline: ${(ticks / secs).toFixed(1)} fps (frame gap median ${p50.toFixed(0)} p95 ${p95.toFixed(0)} max ${max.toFixed(0)} ms); stream ${geom.videoWidth}x${geom.videoHeight}, stage aspect "${geom.stageAspect}" ${geom.stageW}x${geom.stageH}, scrollWidth ${geom.scrollW}/${geom.innerW}`);
  console.log(`fires (clip position): ${fires.map((f) => `${f.name}@${f.ms}`).join(" ") || "none"}`);
  // status changes: count any two "Almost" lines closer than 900 ms
  const almost = status.filter((s) => s.at >= t0);
  let flick = 0; for (let i = 1; i < almost.length; i++) if (almost[i].at - almost[i - 1].at < 900 && /^Almost/.test(almost[i].text) && /^Almost/.test(almost[i - 1].text) && almost[i].text !== almost[i - 1].text) flick++;
  console.log(`status changes after ready: ${almost.length}, "Almost" swaps under 900 ms: ${flick}`);
  if (process.env.VERBOSE) for (const s of almost) console.log(`  +${Math.round(s.at - t0)} ${s.text}`);
  const nameOf = { flex: "Goblin Muscle", thumbs_up: "Thumbs Up", yawn: "Princess Yawn" };
  const problems = [];
  const left = [...fires];
  const inEvent = (f, ev) => (f.name === nameOf[ev.gesture] || (ev.accept ?? []).some((g) => f.name === nameOf[g])) && f.ms >= ev.startMs - 400 && f.ms <= ev.endMs;
  const lat = [];
  for (const ev of labels.events) {
    const i = left.findIndex((f) => inEvent(f, ev));
    if (i === -1) problems.push(`missed ${ev.gesture} (${ev.startMs}-${ev.endMs} ms)`);
    else {
      const f = left.splice(i, 1)[0];
      const seenFrom = f.pass === 0 && phase > ev.startMs && phase <= ev.endMs ? phase : ev.startMs;
      lat.push(f.ms - seenFrom);
      if (f.ms - seenFrom > WINDOW) problems.push(`${ev.gesture} late: ${f.ms - seenFrom} ms after ${seenFrom === phase ? "the models became ready mid-event" : "onset"}`);
      for (let j = left.length - 1; j >= 0; j--) if (inEvent(left[j], ev) && left[j].pass !== f.pass) left.splice(j, 1);
    }
  }
  for (const f of left) problems.push(`false trigger: ${f.name} at ${f.ms} ms`);
  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  console.log(`latencies: ${lat.join(" ")}`);
  console.log(problems.length ? `FAIL: ${problems.join("; ")}` : "PASS: every gesture fired once within 1 s, nothing else fired");
  process.exitCode = problems.length ? 1 : 0;
} finally {
  await browser.close();
}

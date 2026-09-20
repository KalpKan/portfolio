// TEST round 4 UX probe: the fold at real laptop window heights (Kalp's Chrome viewport is 1512 x 627),
// both colour schemes, prefers-reduced-motion, audio actually playing in demo mode, layout at 360/390/430.
import puppeteer from "/Users/kalp/projects/emotes/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { mkdirSync } from "node:fs";
const OUT = "/private/tmp/claude-501/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/scratchpad/shots";
mkdirSync(OUT, { recursive: true });
const url = process.argv[2] ?? "https://emotes.kalpkan.com/";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required"] });
const out = {};
const layoutOf = () => {
  const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width), left: Math.round(b.left) }; };
  return { vw: innerWidth, vh: innerHeight, scrollW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight, stage: r("stage"), startCam: r("start-camera"), demo: r("start-demo"), mute: r("mute"), status: r("status"), meters: r("meters-heading"), emoteCard: r("emote"), startBelowFold: document.getElementById("start-camera").getBoundingClientRect().top >= innerHeight, statusBelowFold: document.getElementById("status").getBoundingClientRect().top >= innerHeight, colorScheme: getComputedStyle(document.documentElement).colorScheme, bodyBg: getComputedStyle(document.body).backgroundColor, bodyColor: getComputedStyle(document.body).color, buttonsRows: [...new Set([...document.querySelectorAll(".buttons button")].map((b) => Math.round(b.getBoundingClientRect().top)))].length, popAnim: getComputedStyle(document.getElementById("emote")).animationName, transitionFill: getComputedStyle(document.getElementById("bar-flex")).transitionDuration };
};
for (const [w, h] of [[1512, 627], [1440, 800], [1280, 900], [1920, 1080], [430, 932], [390, 844], [360, 740]]) {
  for (const scheme of w === 390 || w === 1280 ? ["dark", "light"] : ["dark"]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 });
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
    await page.goto(url, { waitUntil: "networkidle0" });
    const key = `${w}x${h}-${scheme}`;
    await page.screenshot({ path: `${OUT}/r4-${key}-top.png` });
    const layout = await page.evaluate(layoutOf);
    out[key] = { layout, errors };
    await page.close();
  }
}
// reduced motion + audio in demo mode at 1280 x 900
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    window.__plays = [];
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__plays.push({ src: (this.currentSrc || this.src || "").replace(/^.*\//, ""), at: Math.round(performance.now()), muted: this.muted, vol: this.volume }); return orig.call(this); };
    window.__f = [];
    const box = document.getElementById("emote");
    new MutationObserver(() => { if (!box.classList.contains("hidden") && box.classList.contains("pop")) { const n = document.getElementById("emote-name").textContent; const l = window.__f[window.__f.length - 1]; if (!l || l.n !== n || performance.now() - l.at > 500) window.__f.push({ n, at: Math.round(performance.now()), anim: getComputedStyle(box).animationName, dur: getComputedStyle(box).animationDuration }); } }).observe(box, { attributes: true, attributeFilter: ["class"] });
  });
  await page.click("#start-demo");
  await new Promise((r) => setTimeout(r, 9000));
  out.reducedMotionDemo = await page.evaluate(() => ({ fires: window.__f, plays: window.__plays, muteLabel: document.getElementById("mute").textContent, pressed: document.getElementById("mute").getAttribute("aria-pressed") }));
  // mute then one more fire
  await page.click("#mute");
  await new Promise((r) => setTimeout(r, 6000));
  out.afterMute = await page.evaluate(() => ({ fires: window.__f.length, plays: window.__plays, muteLabel: document.getElementById("mute").textContent, pressed: document.getElementById("mute").getAttribute("aria-pressed"), stored: (() => { try { return localStorage.getItem("muted") ?? Object.keys(localStorage).join(","); } catch { return "n/a"; } })() }));
  await page.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();

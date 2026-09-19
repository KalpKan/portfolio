import puppeteer from "/Users/kalp/projects/emotes/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const OUT = "/private/tmp/claude-501/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/scratchpad/shots";
import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
const url = process.argv[2] ?? "https://emotes.kalpkan.com/"; const TAG = process.argv[3] ?? "live";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-gl=angle","--use-angle=metal","--autoplay-policy=no-user-gesture-required"] });
const results = {};
for (const [w, h] of [[1280, 900], [390, 844]]) for (const scheme of ["dark", "light"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
  const errors = [], reqs = [];
  page.on("pageerror", e => errors.push("pageerror: " + e));
  page.on("console", m => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  page.on("request", r => reqs.push({ url: r.url(), t: Date.now() }));
  await page.goto(url, { waitUntil: "networkidle0" });
  const key = `${TAG}-${w}-${scheme}`;
  await page.screenshot({ path: `${OUT}/${key}-top.png` });
  await page.screenshot({ path: `${OUT}/${key}-full.png`, fullPage: true });
  const layout = await page.evaluate(() => {
    const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return { top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width), left: Math.round(b.left) }; };
    return { scrollW: document.documentElement.scrollWidth, vw: innerWidth, docH: document.documentElement.scrollHeight, stage: r("stage"), startCam: r("start-camera"), demo: r("start-demo"), stop: r("stop"), status: document.getElementById("status").textContent, bodyBg: getComputedStyle(document.body).backgroundColor, bodyColor: getComputedStyle(document.body).color, hasThemeToggle: !!document.querySelector("[data-theme], .theme-toggle, #theme"), mute: !!document.getElementById("mute"), muteRect: document.getElementById("mute") ? (b => ({top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width)}))(document.getElementById("mute").getBoundingClientRect()) : null, hints: [...document.querySelectorAll(".hint")].map(h => h.textContent), note: document.querySelector(".note")?.textContent, stageAspect: getComputedStyle(document.getElementById("stage")).aspectRatio, tapTargets: [...document.querySelectorAll("button")].map(b => { const r = b.getBoundingClientRect(); return `${b.id}:${Math.round(r.width)}x${Math.round(r.height)}`; }), fontFamily: getComputedStyle(document.body).fontFamily, links: [...document.querySelectorAll("a")].map(a => a.href), footer: document.querySelector("footer")?.innerText.slice(0, 300) };
  });
  // demo mode
  const nBefore = reqs.length;
  await page.evaluate(() => { window.__f = []; const box = document.getElementById("emote"); new MutationObserver(() => { if (!box.classList.contains("hidden") && box.classList.contains("pop")) { const n = document.getElementById("emote-name").textContent; const l = window.__f[window.__f.length - 1]; if (!l || l.n !== n || performance.now() - l.at > 500) window.__f.push({ n, at: Math.round(performance.now()), cap: document.getElementById("demo-caption").textContent }); } }).observe(box, { attributes: true, attributeFilter: ["class"] }); });
  await page.click("#start-demo");
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: `${OUT}/${key}-demo.png` });
  await new Promise(r => setTimeout(r, 15000));
  const fires = await page.evaluate(() => window.__f);
  const demoStatus = await page.evaluate(() => ({ status: document.getElementById("status").textContent, caption: document.getElementById("demo-caption").textContent, meters: ["flex", "thumbs_up", "yawn"].map(g => document.getElementById("val-" + g).textContent) }));
  const after = reqs.slice(nBefore).map(r => r.url);
  await page.click("#stop");
  results[key] = { layout, errors, fires, demoStatus, requestsDuringDemo: after, allHosts: [...new Set(reqs.map(r => new URL(r.url).host))] };
  await page.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();

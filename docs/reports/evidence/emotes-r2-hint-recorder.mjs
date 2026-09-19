import puppeteer from "/Users/kalp/projects/emotes/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const url = process.argv[2] ?? "http://localhost:4173/"; const clip = process.argv[3];
const args = ["--use-gl=angle","--use-angle=metal","--autoplay-policy=no-user-gesture-required"];
if (clip) args.push("--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream",`--use-file-for-fake-video-capture=${clip}`);
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args });
const page = await browser.newPage(); await page.setViewport({ width: 1000, height: 1200 });
await page.goto(url, { waitUntil: "networkidle0" });
await page.evaluate(() => { window.__log = []; const s = document.getElementById("status"); new MutationObserver(() => window.__log.push({ at: Math.round(performance.now()), t: s.textContent })).observe(s, { childList: true, characterData: true, subtree: true }); const box = document.getElementById("emote"); new MutationObserver(() => { if (!box.classList.contains("hidden") && box.classList.contains("pop")) window.__log.push({ at: Math.round(performance.now()), t: "FIRE " + document.getElementById("emote-name").textContent }); }).observe(box, { attributes: true, attributeFilter: ["class"] }); });
await page.click(clip ? "#start-camera" : "#start-demo");
if (clip) await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Watching"), { timeout: 120000 });
await new Promise(r => setTimeout(r, clip ? 26000 : 17000));
const log = await page.evaluate(() => window.__log);
let prev = null; for (const l of log) { console.log(`${String(l.at).padStart(7)} ${prev ? "+" + (l.at - prev) : ""}\t${l.t}`); prev = l.at; }
await browser.close();

// pushups TEST r2: what a returning visitor sees when the browser cache still holds the v1 form classifier
// (same URL /models/form/*, served with cache-control: immutable for a year, but the input shape changed 36 -> 24
// in c446bcb). Simulated by answering those two requests with the v1 files (= a cache hit), everything else live.
//   node pushups-r2-stale-cache.mjs <url> <v1dir> <outDir>   (run from ~/projects/pushups)
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [url, v1, out] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, ignoreDefaultArgs: ["--enable-automation"],
  args: ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400"] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 1400 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
await page.setRequestInterception(true);
page.on("request", (r) => {
  const p = new URL(r.url()).pathname;
  if (p === "/models/form/model.json") return r.respond({ status: 200, contentType: "application/json", body: readFileSync(join(v1, "model.json")) });
  if (p === "/models/form/group1-shard1of1.bin") return r.respond({ status: 200, contentType: "application/octet-stream", body: readFileSync(join(v1, "group1-shard1of1.bin")) });
  r.continue();
});
await page.goto(url, { waitUntil: "networkidle0" });
await page.click("#play-demo");
await new Promise((r) => setTimeout(r, 12000));
const st = await page.evaluate(() => ({ status: document.getElementById("status").textContent, good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent, stopHidden: document.getElementById("stop").hidden, videoTime: document.getElementById("video").currentTime, ended: document.getElementById("video").ended }));
await page.screenshot({ path: join(out, "stale-cache-demo.png"), fullPage: true });
console.log(JSON.stringify({ st, errors: [...new Set(errors)].slice(0, 6), errorCount: errors.length }, null, 2));
await browser.close();

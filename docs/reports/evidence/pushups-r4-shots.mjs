// TEST r4: mid-clip overlay screenshots of the live camera path on a fake camera.
//   node shots.mjs <url> <outDir> <name>=<mjpeg>:<t1,t2,...>   (seconds after the session status appears)
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
const [url, out, ...specs] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const spec of specs) {
  const [name, rest] = spec.split("=");
  const [file, times] = rest.split(":");
  const ts = times.split(",").map(Number);
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--window-size=1000,900",
      "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${file}`] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: Number(process.env.WIDTH ?? 1000), height: Number(process.env.HEIGHT ?? 900) });
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.click("#start-camera");
    await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
    const t0 = Date.now();
    const log = [];
    for (const t of ts) {
      const wait = t * 1000 - (Date.now() - t0);
      if (wait > 0) await sleep(wait);
      const el = await page.$("#stage");
      await el.screenshot({ path: `${out}/${name}-${t}s.png` });
      const s = await page.evaluate(() => ({ good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent }));
      log.push({ t, ...s });
    }
    console.log(name, JSON.stringify(log));
  } finally { await browser.close(); }
}

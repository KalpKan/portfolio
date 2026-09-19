// pushups TEST r1: mid-clip screenshots of #stage while a ground-truth clip plays through Chrome's fake camera.
//   node pushups-r1-stage-shots.mjs <clipId> <t1,t2,...seconds> <outDir> [url]   (run from ~/projects/pushups)
// Used for docs/reports/evidence/pushups-r1-overlay-montage-2026-09-18.jpg: bad_IMG_4456 2.2 s, IMG_1359 2 s + 5.5 s,
// IMG_1305 3 s, IMG_1512 31 s, test_video_2 10.7 s.
import puppeteer from "puppeteer-core";
import { join } from "node:path";
const [clip, times, out, url = "https://pushups.kalpkan.com/"] = process.argv.slice(2);
const mjpeg = `/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/${clip}.mjpeg`;
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, ignoreDefaultArgs: ["--enable-automation"],
  args: ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${mjpeg}`, "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400"] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 1400 });
await page.goto(url, { waitUntil: "networkidle0" });
await page.click("#start-camera");
await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
const t0 = Date.now();
const log = [];
for (const t of times.split(",").map(Number)) {
  const wait = t * 1000 - (Date.now() - t0);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  await (await page.$("#stage")).screenshot({ path: join(out, `${clip}-${t}s.png`) });
  log.push({ t, ...(await page.evaluate(() => ({ good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent }))) });
}
console.log(JSON.stringify({ clip, log }));
await browser.close();

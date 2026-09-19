// pushups TEST r2: the live camera path with CPU throttling (phone-like frame rates) on chosen clips,
// plus mid-clip #stage screenshots. Compares the on-screen count with ground_truth.json.
//   node pushups-r2-throttled.mjs <url> <outDir> <rate> <clipId>[,t1,t2...] ...   (run from ~/projects/pushups)
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [url, out, rateS, ...clips] = process.argv.slice(2);
const rate = Number(rateS);
const gt = JSON.parse(readFileSync("/Users/kalp/projects/pushups/tests/fixtures/clips/ground_truth.json", "utf8"));
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
for (const spec of clips) {
  const [id, ...times] = spec.split(",");
  const clip = gt.clips.find((c) => c.id === id);
  const mjpeg = `/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/${id}.mjpeg`;
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${mjpeg}`, "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1400 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "networkidle0" });
  if (rate > 1) { const cdp = await page.createCDPSession(); await cdp.send("Emulation.setCPUThrottlingRate", { rate }); }
  await page.click("#start-camera");
  await page.waitForFunction(() => /pushup position|whole body/i.test(document.getElementById("status").textContent), { timeout: 120_000 });
  const t0 = Date.now();
  const fps = []; const forms = []; const shots = [];
  const budget = clip.duration_s * 1000 + 1500;
  const want = times.map(Number).sort((a, b) => a - b);
  while (Date.now() - t0 < budget) {
    const next = want[0];
    const el = Date.now() - t0;
    if (next != null && next * 1000 - el <= 250) {
      const w = next * 1000 - el; if (w > 0) await sleep(w);
      await (await page.$("#stage")).screenshot({ path: join(out, `${id}-${next}s.png`) });
      shots.push({ t: next, ...(await page.evaluate(() => ({ good: document.getElementById("stat-good").textContent, total: document.getElementById("stat-total").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent }))) });
      want.shift();
      continue;
    }
    await sleep(250);
    const s = await page.evaluate(() => ({ fps: document.getElementById("stat-fps").textContent, form: document.getElementById("stat-form").textContent }));
    const f = parseInt(s.fps, 10); if (!Number.isNaN(f)) fps.push(f);
    forms.push(s.form);
  }
  const st = await page.evaluate(() => ({ good: Number(document.getElementById("stat-good").textContent), total: Number(document.getElementById("stat-total").textContent) }));
  const fpsAvg = fps.length ? Math.round(fps.reduce((a, b) => a + b, 0) / fps.length) : null;
  const pass = Math.abs(st.total - clip.total) <= 1 && st.good >= clip.good_min - 1 && st.good <= clip.good_max + 1;
  rows.push({ id, rate, got: st, want: { total: clip.total, good: [clip.good_min, clip.good_max] }, pass, fpsAvg, fpsMin: fps.length ? Math.min(...fps) : null, shots, errors, formsPerQuarterSecond: forms.map((f) => f === "no pose" ? "_" : f.startsWith("bad") ? "b" : f === "good" ? "g" : "?").join("") });
  console.log(`${id.padEnd(14)} x${rate}  ${pass ? "PASS" : "FAIL"}  total ${st.total} (want ${clip.total}±1)  good ${st.good} (want ${clip.good_min}-${clip.good_max}±1)  fps avg ${fpsAvg} min ${rows.at(-1).fpsMin}  shots ${JSON.stringify(shots)}`);
  await browser.close();
}
console.log(JSON.stringify(rows, null, 2));

// pushups TEST r3: demo mode with ?trace -> per-rep events + fillText timeline, N times.
import puppeteer from "puppeteer-core";
const [url, n = "1"] = process.argv.slice(2);
const TEXT_HOOK = () => { window.__texts = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t, x, y, ...r) { window.__texts.push([performance.now(), String(t)]); return o.call(this, t, x, y, ...r); }; };
for (let i = 0; i < Number(n); i++) {
  const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, ignoreDefaultArgs: ["--enable-automation"], args: ["--disable-blink-features=AutomationControlled", "--use-gl=angle", "--use-angle=metal", "--autoplay-policy=no-user-gesture-required", "--window-size=1000,1400"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1400 });
  await page.evaluateOnNewDocument(TEXT_HOOK);
  await page.goto(`${url}?trace`, { waitUntil: "networkidle0" });
  await page.click("#play-demo");
  await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Clip finished"), { timeout: 90_000 });
  const r = await page.evaluate(() => ({ status: document.getElementById("status").textContent, form: document.getElementById("stat-form").textContent, fps: document.getElementById("stat-fps").textContent, events: (window.__pushupsTrace ?? []).filter((f) => f.event).map((f) => `${f.mediaTime.toFixed(2)}s ${f.event}`), frames: (window.__pushupsTrace ?? []).length, texts: window.__texts.filter(([, x]) => /^Rep|Go lower|Bad form|Good form/.test(x)).reduce((m, [t, x]) => { const e = m[x] ?? { first: t, last: t, n: 0 }; e.last = t; e.n++; m[x] = e; return m; }, {}) }));
  console.log(JSON.stringify(r));
  await browser.close();
}

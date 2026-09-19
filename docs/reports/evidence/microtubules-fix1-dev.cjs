const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  p.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text().slice(0, 200)); });
  await p.goto("http://localhost:5179/");
  await p.waitForFunction(() => /^Ready|failed/.test(document.getElementById("status").textContent), null, { timeout: 90000 });
  console.log("status:", await p.evaluate(() => document.getElementById("status").textContent));
  await p.click('button[data-sample="P1_W1_C1"]');
  await p.waitForFunction(() => /^Done|^Could/.test(document.getElementById("status").textContent));
  console.log("dev result:", await p.evaluate(() => [document.getElementById("percent").textContent, document.getElementById("threshold").textContent, document.getElementById("status").textContent]));
  await b.close();
})();

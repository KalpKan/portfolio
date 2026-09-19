const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  const reqs = []; p.on("request", (r) => reqs.push(r.method() + " " + r.url().replace("https://microtubules.kalpkan.com", "")));
  await p.goto("https://microtubules.kalpkan.com/");
  await p.waitForFunction(() => /^Ready/.test(document.getElementById("status").textContent), null, { timeout: 90000 });
  await p.waitForTimeout(2000);
  console.log("load:", reqs); reqs.length = 0;
  await p.click('button[data-sample="P1_W1_C1"]');
  await p.waitForFunction(() => /^Done/.test(document.getElementById("status").textContent));
  await p.waitForTimeout(1500);
  console.log("sample:", reqs); reqs.length = 0;
  await p.locator("#file-input").setInputFiles("/Users/kalp/projects/microtubules/tests/fixtures/fullfield/Plate2_45_nocodazole45uM.png");
  await p.waitForFunction(() => /^Done/.test(document.getElementById("status").textContent));
  await p.waitForTimeout(1500);
  console.log("upload:", reqs, await p.evaluate(() => document.getElementById("percent").textContent));
  await b.close();
})();

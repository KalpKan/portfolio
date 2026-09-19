const { chromium, webkit } = require("playwright");
(async () => {
  for (const bt of [chromium, webkit]) {
    const b = await bt.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
    const reqs = [];
    p.on("request", (r) => reqs.push(r.url().replace("http://localhost:8792", "")));
    await p.goto("http://localhost:8792/");
    await p.waitForFunction(() => /^Ready/.test(document.getElementById("status").textContent), null, { timeout: 60000 });
    await p.waitForTimeout(1500);
    await ctx.setOffline(true);
    reqs.length = 0;
    const out = [];
    for (const s of ["P1_W1_C1", "P3_W2_C3", "P1_W3_C1"]) {
      await p.click(`button[data-sample="${s}"]`);
      await p.waitForFunction(() => /^Done|^Could/.test(document.getElementById("status").textContent));
      out.push(await p.evaluate(() => document.getElementById("percent").textContent + " " + document.getElementById("status").textContent.slice(0, 40)));
    }
    await p.locator("#file-input").setInputFiles("/Users/kalp/projects/microtubules/tests/fixtures/cells/P2_W1_C1.PNG");
    await p.waitForFunction(() => /^Done|^Could/.test(document.getElementById("status").textContent));
    out.push(await p.evaluate(() => document.getElementById("percent").textContent + " " + document.getElementById("status").textContent.slice(0, 40)));
    console.log(bt.name(), "offline:", out, "requests while offline:", reqs);
    await b.close();
  }
})();

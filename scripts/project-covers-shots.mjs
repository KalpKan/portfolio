#!/usr/bin/env node
// Screenshot the Projects window (1440 light, 1440 dark, 390 phone sheet) and
// check every tile shows a loaded picture with no console errors.
// Usage: BASE=http://localhost:3000 OUT=docs/images/kalpos/project-covers [SUFFIX=-live] node scripts/project-covers-shots.mjs
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
const require = createRequire(path.join(process.env.PLAYWRIGHT_ROOT ?? path.join(os.homedir(), "projects", "promptflip"), "package.json"));
const { chromium } = require("playwright");
const base = process.env.BASE ?? "http://localhost:3000";
const out = process.env.OUT ?? "docs/images/kalpos/project-covers";
const sfx = process.env.SUFFIX ?? "";
const browser = await chromium.launch();
let bad = 0;
async function desk(name, { width, height, scheme, phone }) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, deviceScaleFactor: phone ? 3 : 1, hasTouch: !!phone });
  await ctx.addInitScript((s) => { try { localStorage.setItem("kalpos:appearance", s); } catch {} }, scheme);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base + "/?desk", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  if (phone) {
    await page.locator('button:has-text("Projects")').first().tap();
  } else {
    await page.locator('button.kos-icon:has-text("Projects")').first().click({ delay: 300 });
  }
  await page.waitForTimeout(3500); // health checks land, traces draw
  const stats = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img.kos-pic")];
    imgs.forEach((i) => i.scrollIntoView());
    return {
      tiles: document.querySelectorAll(".kos-tile").length,
      imgs: imgs.length,
      drawn: document.querySelectorAll("svg.kos-pic-drawn").length,
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      pills: document.querySelectorAll(".kos-pill").length,
    };
  });
  await page.waitForTimeout(800);
  const stats2 = await page.evaluate(() => ({
    loaded: [...document.querySelectorAll("img.kos-pic")].filter((i) => i.complete && i.naturalWidth > 0).length,
    broken: [...document.querySelectorAll("img.kos-pic")].filter((i) => i.complete && i.naturalWidth === 0).length,
  }));
  await page.evaluate(() => document.querySelector(".kos-grid")?.scrollTo?.(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `${name}${sfx}.png`) });
  if (!phone) {
    await page.locator(".kos-filter", { hasText: "Coming" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, `${name}-coming${sfx}.png`) });
  }
  console.log(name, JSON.stringify({ ...stats, ...stats2, errors }));
  if (stats2.broken || errors.length) bad++;
  await ctx.close();
}
await desk("projects-1440-light", { width: 1440, height: 900, scheme: "light" });
await desk("projects-1440-dark", { width: 1440, height: 900, scheme: "dark" });
await desk("projects-390", { width: 390, height: 844, scheme: "light", phone: true });
await browser.close();
process.exit(bad ? 1 : 0);

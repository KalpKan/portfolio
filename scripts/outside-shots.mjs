#!/usr/bin/env node
// Screenshot the Outside class window (1440 light, 1440 dark, 390 phone sheet), fail on console errors.
// Usage: BASE=http://localhost:3000 OUT=docs/images/kalpos/outside SUFFIX=-after node scripts/outside-shots.mjs
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
const require = createRequire(path.join(process.env.PLAYWRIGHT_ROOT ?? path.join(os.homedir(), "projects", "promptflip"), "package.json"));
const { chromium } = require("playwright");
const base = process.env.BASE ?? "http://localhost:3000";
const out = process.env.OUT ?? "docs/images/kalpos/outside";
const sfx = process.env.SUFFIX ?? "";
const browser = await chromium.launch();
let bad = 0;
async function shot(name, { width, height, scheme, phone }) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, deviceScaleFactor: phone ? 3 : 1, hasTouch: !!phone });
  await ctx.addInitScript((s) => { try { localStorage.setItem("kalpos:appearance", s); } catch {} }, scheme);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base + "/?desk", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  if (phone) await page.locator('button:has-text("Outside class")').first().tap();
  else await page.locator('button.kos-icon:has-text("Outside class")').first().click({ delay: 300 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, `${name}${sfx}.png`) });
  console.log(name, JSON.stringify({ errors }));
  if (errors.length) bad++;
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(base + "/?desk", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, `outside-desk-1440${sfx}.png`) });
  await ctx.close();
}
await shot("outside-1440-light", { width: 1440, height: 900, scheme: "light" });
await shot("outside-1440-light-full", { width: 1440, height: 1700, scheme: "light" });
await shot("outside-1440-dark", { width: 1440, height: 900, scheme: "dark" });
await shot("outside-390", { width: 390, height: 844, scheme: "light", phone: true });
await browser.close();
process.exit(bad ? 1 : 0);

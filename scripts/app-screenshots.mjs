#!/usr/bin/env node
// Capture the "mid-use" screenshots of the live apps that the Projects
// window's Quick Look shows (public/images/projects/<slug>/hero.webp), and
// keep the full-resolution originals under docs/images/apps/<slug>/.
//
// Every frame is a real browser at 1440x900, device scale 2, driving the live
// site through its own UI (upload, click, wait for the result). Nothing is
// mocked and nobody is signed in: the plantit flow stops at its login screen
// on purpose, and promptflip's flip stage (which needs two signed-in players)
// is taken from the app's own preview harness on a local dev server.
//
// Usage (README "How to refresh the app screenshots"):
//   node scripts/app-screenshots.mjs [slug ...]
//   node scripts/app-screenshots.mjs --hero            # only rebuild the webp heroes
//
// Environment:
//   PLAYWRIGHT_ROOT   a checkout with playwright + its Chromium installed
//                     (default ~/projects/promptflip; the hub does not depend on it)
//   PLATO_PDF         a course-outline PDF to upload (default: a corpus file)
//   PROMPTFLIP_STAGE  the flip-stage harness URL (default http://localhost:3000/dev/stage;
//                     `npm run dev` in ~/projects/promptflip; skipped when unreachable)
import { createRequire } from "node:module";
import { existsSync, mkdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const home = os.homedir();
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const docsDir = (slug) => path.join(root, "docs", "images", "apps", slug);
const heroDir = (slug) => path.join(root, "public", "images", "projects", slug);
const VIEWPORT = { width: 1440, height: 900 };
const LIMIT = 300 * 1024;

/** slug -> the original frame that becomes hero.webp */
const HERO_FRAME = {
  promptflip: "flip-landed.png",
  plato: "review.png",
  basketball: "shot-map.png",
  microtubules: "result.png",
  plantit: "landing.png",
};

const args = process.argv.slice(2);
const heroOnly = args.includes("--hero");
const only = args.filter((a) => !a.startsWith("--"));
const wanted = (slug) => only.length === 0 || only.includes(slug);

function loadPlaywright() {
  const pwRoot = process.env.PLAYWRIGHT_ROOT ?? path.join(home, "projects", "promptflip");
  try {
    return createRequire(path.join(pwRoot, "package.json"))("playwright");
  } catch {
    console.error(`playwright not found under ${pwRoot}; set PLAYWRIGHT_ROOT to a checkout that has it installed`);
    process.exit(2);
  }
}

async function shoot(page, slug, name, opts = {}) {
  mkdirSync(docsDir(slug), { recursive: true });
  const file = path.join(docsDir(slug), name);
  await page.screenshot({ path: file, ...opts });
  console.log(`${path.relative(root, file)}`);
  return file;
}

/** Scroll so `selector` sits `offset` px under the top of the viewport. */
async function scrollTo(page, selector, offset = 24) {
  await page
    .locator(selector)
    .first()
    .evaluate((el, off) => {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - off, behavior: "instant" });
    }, offset);
  await page.waitForTimeout(400);
}

/** Realtime sockets keep "networkidle" from ever firing on some apps; settle on load + a beat. */
async function open(page, url, settle = 1500) {
  const res = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(settle);
  return res;
}

const capture = {
  async promptflip(ctx) {
    const page = await ctx.newPage();
    await open(page, "https://promptflip.kalpkan.com/", 2500);
    await shoot(page, "promptflip", "lobby.png");
    const stage = process.env.PROMPTFLIP_STAGE ?? "http://localhost:3000/dev/stage";
    const res = await open(page, stage, 2500).catch(() => null);
    if (!res || !res.ok()) {
      console.warn(`promptflip: ${stage} is not up (npm run dev in ~/projects/promptflip); flip-landed.png kept as is`);
      await page.close();
      return;
    }
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.getByRole("button", { name: "landed", exact: true }).click();
    await page.waitForTimeout(1600); // confetti settles, the winner card lands
    // The stage is the last card on the harness page; the frame is that card
    // edge to edge (the harness's own controls above it are not the app).
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
    // The harness renders <FlipStage> in the div after its "coinLanded" line.
    const box = await page.locator("p:has-text('coinLanded') + div").boundingBox();
    const clip = box ? { x: box.x - 8, y: Math.max(0, box.y - 8), width: box.width + 16, height: Math.min(VIEWPORT.height - box.y + 8, box.height + 16) } : undefined;
    await shoot(page, "promptflip", "flip-landed.png", clip ? { clip } : {});
    await page.close();
  },

  async plato(ctx) {
    const pdf = process.env.PLATO_PDF ?? path.join(home, "projects", "plato-corpus", "pdfs", "Physiology 3120 Syllabus 2025–2026 Oct 31st UPDATED.pdf");
    if (!existsSync(pdf)) throw new Error(`PLATO_PDF not found: ${pdf}`);
    const page = await ctx.newPage();
    await open(page, "https://plato.kalpkan.com/");
    await shoot(page, "plato", "landing.png");
    await page.setInputFiles("#pdf_file", pdf);
    await page.check('input[name="force_refresh"]');
    await scrollTo(page, "#upload-section", 40);
    await shoot(page, "plato", "upload.png");
    await Promise.all([
      page.waitForURL("**/review", { timeout: 90_000 }),
      page.click('#upload-form button[type="submit"]'),
    ]);
    await page.waitForLoadState("load");
    await page.waitForTimeout(1200);
    await shoot(page, "plato", "review.png");
    await scrollTo(page, "#add-assessment-btn", 40);
    await shoot(page, "plato", "assessments.png");
    await page.locator("#generate-calendar-btn").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 160));
    await page.waitForTimeout(300);
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.locator("#generate-calendar-btn").hover().then(() => page.locator("#generate-calendar-btn").click()),
    ]);
    await page.waitForTimeout(400);
    await shoot(page, "plato", "download.png");
    console.log(`plato: downloaded ${download.suggestedFilename()}`);
    await page.close();
  },

  async basketball(ctx) {
    const page = await ctx.newPage();
    await open(page, "https://hoops.kalpkan.com/");
    await page.getByText("LIVE DATA").first().waitFor({ timeout: 30_000 });
    await shoot(page, "basketball", "analytics.png");
    await page.getByRole("button", { name: "Shot Map" }).click();
    await page.waitForTimeout(1500);
    // The card around the "Shot Map" heading, 24 px under the top edge.
    await page.locator("h2:has-text('Shot Map')").evaluate((h) => {
      const card = h.closest("[class*='rounded']") ?? h;
      window.scrollTo({ top: window.scrollY + card.getBoundingClientRect().top - 24, behavior: "instant" });
    });
    await page.waitForTimeout(600);
    await shoot(page, "basketball", "shot-map.png");
    await page.close();
  },

  async microtubules(ctx) {
    const page = await ctx.newPage();
    await open(page, "https://microtubules.kalpkan.com/");
    await shoot(page, "microtubules", "landing.png");
    await page.getByRole("button", { name: "Untreated" }).click();
    await page.getByText(/^Done:/).waitFor({ timeout: 60_000 });
    await page.waitForTimeout(500);
    // Fold the glossary so the percentage, the numbers and both pictures share one frame.
    await page.evaluate(() => {
      const d = document.querySelector("details#explain");
      if (d) d.open = false;
    });
    await scrollTo(page, "#results", 16);
    await shoot(page, "microtubules", "result.png");
    await page.close();
  },

  async plantit(ctx) {
    // Signed out on purpose: the identify flow needs a Google account, and the
    // rule is never Kalp's. What a stranger sees first is the login screen.
    const page = await ctx.newPage();
    await open(page, "https://plantit.kalpkan.com/", 3000);
    await shoot(page, "plantit", "landing.png");
    await page.close();
  },
};

async function buildHero(slug) {
  const src = path.join(docsDir(slug), HERO_FRAME[slug]);
  if (!existsSync(src)) {
    console.warn(`${slug}: no ${HERO_FRAME[slug]} yet, hero not built`);
    return;
  }
  mkdirSync(heroDir(slug), { recursive: true });
  // 1280 px wide is already 2x for the Quick Look frame (≤ 640 px), so one file is enough.
  const out = path.join(heroDir(slug), "hero.webp");
  let quality = 82;
  for (;;) {
    await sharp(src).resize({ width: 1280, withoutEnlargement: true }).webp({ quality, effort: 6 }).toFile(out);
    const size = statSync(out).size;
    if (size <= LIMIT || quality <= 40) {
      console.log(`${path.relative(root, out)}: ${(size / 1024).toFixed(0)} KB, quality ${quality}`);
      if (size > LIMIT) throw new Error(`${out} is over 300 KB at quality ${quality}`);
      break;
    }
    quality -= 6;
  }
}

const slugs = Object.keys(HERO_FRAME).filter(wanted);
if (!heroOnly) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, acceptDownloads: true, colorScheme: "dark" });
  try {
    for (const slug of slugs) {
      console.log(`--- ${slug}`);
      await capture[slug](ctx);
    }
  } finally {
    await browser.close();
  }
}
for (const slug of slugs) await buildHero(slug);

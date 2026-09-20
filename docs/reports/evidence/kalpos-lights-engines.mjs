import { createRequire } from 'node:module';
// Playwright is not a hub dependency: borrow promptflip's install (any project with playwright works).
const pw = createRequire('/Users/kalp/projects/promptflip/package.json')('playwright');
const base = process.argv[2]; const label = process.argv[3] ?? base;
for (const engine of ['chromium', 'webkit']) {
  const browser = await pw[engine].launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
  // The old build only skips the lock through the retired localStorage flag; the new one honours ?desk.
  await ctx.addInitScript(() => { try { localStorage.setItem('kalpos:visited', '1'); } catch {} });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/?desk'); await page.waitForTimeout(900);
  const held = async (sel) => { const b = await page.locator(sel).first().boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); await page.waitForTimeout(450); };
  const dialogs = () => page.evaluate(() => document.querySelectorAll('[role=dialog]').length);
  await held('button.kos-icon:has-text("Projects")');
  const opened = await dialogs();
  await held('.kos-light--close');
  const afterRed = await dialogs();
  await held('button.kos-icon:has-text("Projects")');
  await held('.kos-light--min');
  const afterYellow = await dialogs();
  console.log(`${label.padEnd(24)} ${engine.padEnd(9)} open=${opened} afterRed=${afterRed} afterYellow=${afterYellow} ${afterRed === 0 && afterYellow === 0 ? 'PASS' : 'FAIL'} errors=${errors.length}`);
  await browser.close();
}

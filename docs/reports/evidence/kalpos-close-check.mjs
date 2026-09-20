import { createRequire } from 'node:module';
// Playwright is not a hub dependency: borrow promptflip's install (any project with playwright works).
const { chromium } = createRequire('/Users/kalp/projects/promptflip/package.json')('playwright');
/*
 * The close / minimise beats (T6.3, 2026-09-20). A held click on the red light must
 * remove the dialog within 250 ms with exactly one animation (kos-win-close) and one
 * data-anim value set; the yellow light must run exactly one kos-win-min. Also
 * records the timeline (data-anim, getAnimations(), computed transform) the way the
 * defect was found on kalpkan.com: the old close edited the finished open animation
 * in place (same animation-name, `reverse`) and the frame jumped to the icon rect.
 *   node docs/reports/evidence/kalpos-close-check.mjs https://kalpkan.com
 */
const base = process.argv[2] ?? 'http://localhost:3999';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failed = true; };

async function run(which) {
  await page.goto(base + '/?desk&t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForSelector('.kos[data-stage="desk"]');
  const icon = page.locator('.kos-icons .kos-icon', { hasText: 'About me' });
  const b = await icon.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up();
  await page.waitForSelector('[role="dialog"][data-window="about"]');
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const dlg = document.querySelector('[data-window="about"]');
    window.__log = []; window.__anims = new Set(); window.__states = new Set(); window.__gone = null;
    const t0 = performance.now();
    const snap = (why) => {
      const el = document.querySelector('[data-window="about"]');
      const anims = el ? el.getAnimations().map((a) => `${a.animationName}@${a.playState}:${Math.round(a.currentTime ?? -1)}ms`) : [];
      const cs = el ? getComputedStyle(el) : null;
      window.__log.push(`${(performance.now() - t0).toFixed(0)}ms ${why} anim=${el?.getAttribute('data-anim')} transform=${cs ? cs.transform.slice(0, 48) : '-'} opacity=${cs?.opacity ?? '-'} [${anims.join(' ')}]`);
    };
    new MutationObserver(() => { const v = dlg.getAttribute('data-anim'); if (v && v !== 'open' && v !== 'place') window.__states.add(v); snap('mut data-anim'); }).observe(dlg, { attributes: true, attributeFilter: ['data-anim'] });
    new MutationObserver((ms) => ms.forEach((m) => { if ([...m.removedNodes].includes(dlg)) { window.__gone = performance.now() - t0; snap('UNMOUNT'); } })).observe(dlg.parentElement, { childList: true });
    dlg.addEventListener('animationstart', (e) => { if (e.target === dlg) { window.__anims.add(e.animationName); snap('animationstart ' + e.animationName); } });
    window.__t0 = t0;
  });
  const light = page.locator(`[data-window="about"] .kos-light--${which}`);
  const lb = await light.boundingBox();
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  const tDown = await page.evaluate(() => performance.now() - window.__t0);
  await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up();
  const tUp = await page.evaluate(() => performance.now() - window.__t0);
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({ log: window.__log, anims: [...window.__anims], states: [...window.__states], gone: window.__gone }));
  console.log(`\n== ${which} (press at ${tDown.toFixed(0)} ms, release at ${tUp.toFixed(0)} ms)`);
  console.log(r.log.join('\n'));
  return { ...r, tUp };
}

const c = await run('close');
check(c.gone !== null && c.gone - c.tUp <= 250, `close: dialog removed ${c.gone === null ? 'never' : (c.gone - c.tUp).toFixed(0) + ' ms'} after the release (≤ 250)`);
check(c.anims.length === 1 && c.anims[0] === 'kos-win-close', `close: exactly one animation ran: ${JSON.stringify(c.anims)}`);
check(c.states.length === 1 && c.states[0] === 'close', `close: exactly one data-anim set: ${JSON.stringify(c.states)}`);
check((await page.locator('[role="dialog"]').count()) === 0, 'close: no dialog left');

const m = await run('min');
check(m.anims.length === 1 && m.anims[0] === 'kos-win-min', `minimise: exactly one animation ran: ${JSON.stringify(m.anims)}`);
check(m.states.length === 1 && m.states[0] === 'min', `minimise: exactly one data-anim set: ${JSON.stringify(m.states)}`);
check(m.gone !== null && m.gone - m.tUp >= 300 && m.gone - m.tUp <= 450, `minimise: frame left ${m.gone === null ? 'never' : (m.gone - m.tUp).toFixed(0) + ' ms'} after the release (320 ms travel)`);
check((await page.locator('.kos-dock-item--notes .kos-dock-dot').count()) === 1, 'minimise: the Notes tile shows the running dot');
check(errors.length === 0, `no page errors: ${JSON.stringify(errors)}`);
await browser.close();
process.exit(failed ? 1 : 0);

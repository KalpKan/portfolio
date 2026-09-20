import { createRequire } from 'node:module';
// Playwright is not a hub dependency: borrow promptflip's install (any project with playwright works).
const { chromium } = createRequire('/Users/kalp/projects/promptflip/package.json')('playwright');
const base = process.argv[2] ?? 'http://localhost:3999';
const out = process.argv[3] ?? '/Users/kalp/projects/portfolio/docs/images/kalpos/fixes';
const reduced = process.argv[4] === 'reduced';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
// 2026-09-20: the boot starts from the power screen (a key press), like a Mac from its power button.
await page.goto(base + '/?t=' + Date.now(), { waitUntil: 'load' });
await page.waitForSelector('.kos-boot[data-power="off"]');
await page.screenshot({ path: `${out}/${reduced ? 'reduced-' : ''}power-screen.png` });
await page.keyboard.press('k');
const t0 = Date.now();
const samples = []; let last = ''; let shots = 0;
const marks = { '150': 'boot-logo', '900': 'boot-bar-shown', '1800': 'boot-bar-filling', '2200': 'boot-bar-full', '2600': 'boot-fade', '3200': 'lock' };
for (let i = 0; i < 120; i++) {
  const s = await page.evaluate(() => {
    const k = document.querySelector('.kos'); const boot = document.querySelector('.kos-boot'); const fill = document.querySelector('.kos-boot-bar i'); const mark = document.querySelector('.kos-boot-mark');
    const cs = (el) => getComputedStyle(el);
    return `${k?.getAttribute('data-stage')}|pw=${boot?.getAttribute('data-power')}|bar=${boot?.getAttribute('data-bar')}|lv=${k?.getAttribute('data-leaving')}|chime=${k?.getAttribute('data-chime')}|fill=${fill ? cs(fill).transform.split(',')[0].replace('matrix(', '') : '-'}|mark=${mark ? Number(cs(mark).opacity).toFixed(2) : '-'}|layer=${boot ? Number(cs(boot).opacity).toFixed(2) : '-'}|lock=${document.querySelector('.kos-lock') ? cs(document.querySelector('.kos-lock')).visibility : '-'}|clock=${document.querySelector('.kos-lock-clock') ? Number(cs(document.querySelector('.kos-lock-clock')).opacity).toFixed(2) : '-'}`;
  }).catch(e => 'err ' + e.message.slice(0, 40));
  const t = Date.now() - t0;
  if (s !== last) { samples.push(`${t}ms ${s}`); last = s; }
  for (const [ms, name] of Object.entries(marks)) if (t >= Number(ms) && !marks['done' + ms]) { marks['done' + ms] = true; await page.screenshot({ path: `${out}/${reduced ? 'reduced-' : ''}${name}.png` }); shots++; }
  if (t > 4500) break;
  await new Promise(r => setTimeout(r, 50));
}
console.log(samples.join('\n'));
console.log('errors:', errors);
await browser.close();

// Round-2 audit of the hoops dashboard. Usage: S=<screenshot dir> URL=https://hoops.kalpkan.com node hoops-r2-playwright-audit.mjs > results.json
// (needs `playwright` resolvable: ln -sfn ~/projects/promptflip/node_modules node_modules in a scratch dir; `npx playwright@1.63.0 install webkit` once)
import { chromium, webkit } from 'playwright';
const S = process.env.S || '.';
const URL = process.env.URL || 'https://hoops.kalpkan.com';
const configs = [
  { name: 'desktop-utc', w: 1440, h: 900, tz: 'UTC', scheme: 'dark' },
  { name: 'desktop-toronto', w: 1440, h: 900, tz: 'America/Toronto', scheme: 'dark' },
  { name: 'desktop-tokyo-light', w: 1440, h: 900, tz: 'Asia/Tokyo', scheme: 'light' },
  { name: 'phone-utc', w: 390, h: 844, tz: 'UTC', scheme: 'dark', mobile: true },
  { name: 'phone-toronto-light', w: 390, h: 844, tz: 'America/Toronto', scheme: 'light', mobile: true },
  { name: 'phone-tokyo', w: 390, h: 844, tz: 'Asia/Tokyo', scheme: 'dark', mobile: true },
];
const engines = { chromium, webkit };
const results = {};
const measure = () => {
  const barEls = [...document.querySelectorAll('[data-bar]')];
  const bars = barEls.map(d => ({ id: d.dataset.bar, styleH: d.style.height, renderedH: Math.round(d.getBoundingClientRect().height), title: d.title }));
  const chart = barEls[0]?.closest('.overflow-x-auto');
  return { bars, chartLabels: chart ? [...chart.querySelectorAll('span[title]')].map(s => s.textContent.trim()) : [], ticks: [...document.querySelectorAll('[data-tick]')].map(t => t.dataset.tick), chartScroll: chart ? { scrollW: chart.scrollWidth, clientW: chart.clientWidth } : null };
};
for (const [eng, launcher] of Object.entries(engines)) {
  let browser;
  try { browser = await launcher.launch(); } catch (e) { results[eng + ':launch-error'] = String(e).slice(0, 200); continue; }
  for (const c of configs) {
    if (eng === 'webkit' && !['desktop-toronto', 'phone-tokyo'].includes(c.name)) continue;
    const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, timezoneId: c.tz, colorScheme: c.scheme, isMobile: !!c.mobile && eng === 'chromium', hasTouch: !!c.mobile, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'networkidle' });
    const loadMs = Date.now() - t0;
    const info = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')].map(b => ({ t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) }));
      const rows = [...document.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent.trim()));
      const table = document.querySelector('table');
      const tableWrap = table?.parentElement;
      const cards = [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => ({ text: c.innerText.replace(/\n/g, ' | '), left: Math.round(c.getBoundingClientRect().left), w: Math.round(c.getBoundingClientRect().width) }));
      const text = document.body.innerText;
      const links = [...document.querySelectorAll('a')].map(a => a.href);
      const pillRow = document.querySelector('section.overflow-x-auto');
      return {
        title: document.title, metaDesc: document.querySelector('meta[name=description]')?.content, ogTitle: document.querySelector('meta[property="og:title"]')?.content, icon: document.querySelector('link[rel=icon]')?.href,
        scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
        btns, rows, cards,
        pillScroll: pillRow ? { scrollWidth: pillRow.scrollWidth, clientWidth: pillRow.clientWidth, overflowX: getComputedStyle(pillRow).overflowX } : null,
        tableWrap: tableWrap ? { scrollWidth: tableWrap.scrollWidth, clientWidth: tableWrap.clientWidth, overflowX: getComputedStyle(tableWrap).overflowX, tableWidth: table.scrollWidth } : null,
        hasNotice: /not available yet/i.test(text) && /ingest/i.test(text), hasDownload: /download|app store/i.test(text), repoLink: links.some(l => l.includes('github.com/KalpKan/Basketball-Stat-Tracker')),
        hiddenNote: (text.match(/\d+ shots? with an invalid timestamp hidden/) || [null])[0],
        liveBadge: /LIVE DATA/i.test(text), demoBanner: /Sample data/i.test(text),
        pillLabels: [...document.querySelectorAll('section.overflow-x-auto button')].map(b => b.textContent.trim()),
        faintTextNodes: document.querySelectorAll('.text-white\\/35, .text-white\\/40, .text-white\\/45').length,
      };
    });
    const chart = await page.evaluate(measure);
    await page.screenshot({ path: `${S}/hoops-r2-${eng}-${c.name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    const modes = {};
    for (const m of ['eFG%', 'Streak', 'FG%']) {
      try { await page.getByRole('button', { name: m, exact: true }).first().click(); await page.waitForTimeout(150); } catch (e) { modes[m] = 'no-button'; continue; }
      modes[m] = await page.evaluate(measure);
    }
    let pillCheck = null;
    try {
      const pills = page.locator('section.overflow-x-auto button');
      if (await pills.count() > 1) {
        const label = (await pills.nth(1).textContent()).trim();
        await pills.nth(1).click(); await page.waitForTimeout(200);
        pillCheck = await page.evaluate((label) => ({ pill: label, chart: [...document.querySelectorAll('[data-bar]')].map(d => d.title), rows: [...document.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent.trim())), cards: [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => c.innerText.replace(/\n/g, ' | ')) }), label);
        await pills.nth(0).click(); await page.waitForTimeout(150);
      }
    } catch (e) { pillCheck = 'err ' + String(e).slice(0, 100); }
    let map = null;
    try {
      await page.getByRole('button', { name: 'Shot Map' }).click(); await page.waitForTimeout(200);
      map = await page.evaluate(() => { const svg = document.querySelector('svg[aria-label="Shot map"]'); const r = svg.getBoundingClientRect(); const circles = [...svg.querySelectorAll('circle')]; const text = document.body.innerText; return { circles: circles.length, svg: { l: Math.round(r.left), r: Math.round(r.right) }, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, tracked: text.match(/\d+ tracked attempts/)?.[0], rates: [...text.matchAll(/(\d+\.\d)%\n(Made|Miss) rate/g)].map(m => m[1] + ' ' + m[2]) }; });
      await page.screenshot({ path: `${S}/hoops-r2-${eng}-${c.name}-map.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    } catch (e) { map = 'err ' + String(e).slice(0, 120); }
    results[eng + ':' + c.name] = { loadMs, errors, ...info, chart, modes, pillCheck, map };
    await ctx.close();
  }
  await browser.close();
}
console.log(JSON.stringify(results, null, 1));

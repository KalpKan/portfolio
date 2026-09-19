import { chromium, webkit } from 'playwright';
const S = process.env.S || ".";
const configs = [
  { name: 'desktop-utc', w: 1440, h: 900, tz: 'UTC', scheme: 'dark' },
  { name: 'desktop-toronto', w: 1440, h: 900, tz: 'America/Toronto', scheme: 'dark' },
  { name: 'desktop-tokyo-light', w: 1440, h: 900, tz: 'Asia/Tokyo', scheme: 'light' },
  { name: 'phone-utc', w: 390, h: 844, tz: 'UTC', scheme: 'dark', mobile: true },
  { name: 'phone-toronto-light', w: 390, h: 844, tz: 'America/Toronto', scheme: 'light', mobile: true },
  { name: 'phone-tokyo', w: 390, h: 844, tz: 'Asia/Tokyo', scheme: 'dark', mobile: true },
];
const engines = { chromium };
try { engines.webkit = webkit; } catch {}
const results = {};
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
    await page.goto('https://hoops.kalpkan.com', { waitUntil: 'networkidle' });
    const loadMs = Date.now() - t0;
    const info = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')].map(b => ({ t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) }));
      const rows = [...document.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent.trim()));
      const chart = document.querySelector('.h-72');
      const chartLabels = chart ? [...chart.querySelectorAll('span')].map(s => s.textContent.trim()) : [];
      const bars = chart ? [...chart.querySelectorAll('.flex-1 div')].filter(d => d.style && d.style.height).map(d => ({ styleH: d.style.height, renderedH: Math.round(d.getBoundingClientRect().height), title: d.getAttribute('title') || '' })) : [];
      const chartText = chart ? chart.innerText.replace(/\n/g, ' | ') : '';
      const pillRow = document.querySelector('section.overflow-x-auto');
      const table = document.querySelector('table');
      const tableWrap = table?.parentElement;
      const cards = [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => ({ text: c.innerText.replace(/\n/g, ' | '), left: Math.round(c.getBoundingClientRect().left), top: Math.round(c.getBoundingClientRect().top), w: Math.round(c.getBoundingClientRect().width) }));
      const overflowing = [...document.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 && r.width > 0; }).slice(0, 8).map(e => e.tagName + '.' + [...e.classList].slice(0, 3).join('.') + ' right=' + Math.round(e.getBoundingClientRect().right));
      const notice = document.body.innerText;
      const links = [...document.querySelectorAll('a')].map(a => a.href);
      // approximate contrast of low-alpha text
      const faint = [...document.querySelectorAll('.text-white\\/35, .text-white\\/40')].length;
      return {
        title: document.title, metaDesc: document.querySelector('meta[name=description]')?.content, ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
        btns, rows, chartLabels, bars, chartText, cards,
        pillScroll: pillRow ? { scrollWidth: pillRow.scrollWidth, clientWidth: pillRow.clientWidth, overflowX: getComputedStyle(pillRow).overflowX } : null,
        tableWrap: tableWrap ? { scrollWidth: tableWrap.scrollWidth, clientWidth: tableWrap.clientWidth, overflowX: getComputedStyle(tableWrap).overflowX, tableWidth: table.scrollWidth } : null,
        overflowing, faintTextNodes: faint,
        hasNotice: /not available|ingest/i.test(notice), hasDownload: /download|app store/i.test(notice), repoLink: links.some(l => l.includes('github.com/KalpKan/Basketball-Stat-Tracker')),
        liveBadge: /LIVE/.test(notice), demoBanner: /Demo data/i.test(notice),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        pillLabels: [...document.querySelectorAll('section.overflow-x-auto button')].map(b => b.textContent.trim()),
      };
    });
    await page.screenshot({ path: `${S}/hoops-r1b-${eng}-${c.name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    // toggle eFG% and Streak, measure bars
    const modes = {};
    for (const m of ['eFG%', 'Streak', 'FG%']) {
      try { await page.getByRole('button', { name: m, exact: true }).first().click(); await page.waitForTimeout(200); } catch (e) { modes[m] = 'no-button'; continue; }
      modes[m] = await page.evaluate(() => { const chart = document.querySelector('.h-72'); return chart ? [...chart.querySelectorAll('.flex-1 div')].filter(d => d.style && d.style.height).map(d => ({ styleH: d.style.height, renderedH: Math.round(d.getBoundingClientRect().height) })) : []; });
    }
    // click a session pill (second pill) and compare labels
    let pillCheck = null;
    try {
      const pills = page.locator('section.overflow-x-auto button');
      const n = await pills.count();
      if (n > 1) {
        const label = (await pills.nth(1).textContent()).trim();
        await pills.nth(1).click(); await page.waitForTimeout(300);
        pillCheck = await page.evaluate((label) => { const chart = document.querySelector('.h-72'); return { pill: label, chartLabels: chart ? [...chart.querySelectorAll('span')].map(s => s.textContent.trim()) : [], rows: [...document.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent.trim())), cards: [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => c.innerText.replace(/\n/g, ' | ')) }; }, label);
        await pills.nth(0).click(); await page.waitForTimeout(200);
      }
    } catch (e) { pillCheck = 'err ' + String(e).slice(0, 100); }
    // Shot map tab
    let map = null;
    try {
      await page.getByRole('button', { name: 'Shot Map' }).click();
      await page.waitForTimeout(300);
      map = await page.evaluate(() => {
        const svg = document.querySelector('svg[aria-label="Shot map"]');
        const r = svg.getBoundingClientRect();
        const circles = [...svg.querySelectorAll('circle')];
        const vb = svg.viewBox.baseVal;
        const outside = circles.filter(c => { const cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy'); return cx < 0 || cy < 0 || cx > vb.width || cy > vb.height; }).length;
        const legend = [...document.querySelectorAll('div')].find(d => d.innerText?.trim() === 'Made\nMissed');
        const lr = legend?.getBoundingClientRect();
        const text = document.body.innerText;
        const rates = [...text.matchAll(/(\d+\.\d)%/g)].map(m => +m[1]);
        return { circles: circles.length, outside, viewBox: `${vb.x} ${vb.y} ${vb.width} ${vb.height}`, svg: { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }, legend: lr ? { l: Math.round(lr.left), r: Math.round(lr.right), top: Math.round(lr.top) } : null, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, tracked: text.match(/\d+ tracked attempts/)?.[0], rates: rates.slice(0, 6), fills: circles.map(c => c.getAttribute('fill') || c.getAttribute('class')).reduce((a, f) => (a[f] = (a[f] || 0) + 1, a), {}) };
      });
      await page.screenshot({ path: `${S}/hoops-r1b-${eng}-${c.name}-map.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    } catch (e) { map = 'err ' + String(e).slice(0, 120); }
    results[eng + ':' + c.name] = { loadMs, errors, ...info, modes, pillCheck, map };
    await ctx.close();
  }
  await browser.close();
}
console.log(JSON.stringify(results, null, 1));

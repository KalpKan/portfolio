import { chromium } from 'playwright';
const S = process.env.S || ".";
const configs = [
  { name: 'desktop-utc', w: 1440, h: 900, tz: 'UTC', scheme: 'dark' },
  { name: 'desktop-toronto', w: 1440, h: 900, tz: 'America/Toronto', scheme: 'dark' },
  { name: 'desktop-toronto-light', w: 1440, h: 900, tz: 'America/Toronto', scheme: 'light' },
  { name: 'phone-toronto', w: 390, h: 844, tz: 'America/Toronto', scheme: 'dark', mobile: true },
  { name: 'phone-toronto-light', w: 390, h: 844, tz: 'America/Toronto', scheme: 'light', mobile: true },
  { name: 'phone-tokyo', w: 390, h: 844, tz: 'Asia/Tokyo', scheme: 'dark', mobile: true },
];
const browser = await chromium.launch();
const results = {};
for (const c of configs) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, timezoneId: c.tz, colorScheme: c.scheme, isMobile: !!c.mobile, hasTouch: !!c.mobile, deviceScaleFactor: 2 });
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
    const chartLabels = [...document.querySelectorAll('.h-72 span')].map(s => s.textContent.trim());
    const pillRow = document.querySelector('section.overflow-x-auto');
    const table = document.querySelector('table');
    const tableWrap = table?.parentElement;
    const cards = [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => ({ text: c.innerText.replace(/\n/g, ' | '), left: Math.round(c.getBoundingClientRect().left), top: Math.round(c.getBoundingClientRect().top) }));
    const overflowing = [...document.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 && r.width > 0; }).slice(0, 8).map(e => e.tagName + '.' + [...e.classList].slice(0, 3).join('.') + ' right=' + Math.round(e.getBoundingClientRect().right));
    const notice = document.body.innerText;
    return {
      scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
      btns, rows, chartLabels, cards,
      pillScroll: pillRow ? { scrollWidth: pillRow.scrollWidth, clientWidth: pillRow.clientWidth, overflowX: getComputedStyle(pillRow).overflowX } : null,
      tableWrap: tableWrap ? { scrollWidth: tableWrap.scrollWidth, clientWidth: tableWrap.clientWidth, overflowX: getComputedStyle(tableWrap).overflowX, tableWidth: table.scrollWidth } : null,
      overflowing,
      hasNotice: /not available|ingest/i.test(notice), hasDownload: /download|app store/i.test(notice),
      bodyBg: getComputedStyle(document.body).backgroundColor, mainBg: getComputedStyle(document.querySelector('main')).backgroundColor,
      pillLabels: [...document.querySelectorAll('section.overflow-x-auto button')].map(b => b.textContent.trim()),
    };
  });
  await page.screenshot({ path: `${S}/shot-${c.name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
  // Shot map tab
  await page.getByRole('button', { name: 'Shot Map' }).click();
  await page.waitForTimeout(300);
  const map = await page.evaluate(() => {
    const svg = document.querySelector('svg[aria-label="Shot map"]');
    const r = svg.getBoundingClientRect();
    const legend = [...document.querySelectorAll('div')].find(d => d.innerText?.trim() === 'Made\nMissed');
    const lr = legend?.getBoundingClientRect();
    return { dots: svg.querySelectorAll('circle').length - 3, svg: { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }, legend: lr ? { l: Math.round(lr.left), r: Math.round(lr.right), top: Math.round(lr.top) } : null, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, tracked: document.body.innerText.match(/\d+ tracked attempts/)?.[0] };
  });
  await page.screenshot({ path: `${S}/shot-${c.name}-map.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
  results[c.name] = { loadMs, errors, ...info, map };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 1));

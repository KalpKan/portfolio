import { chromium } from 'playwright';
const b = await chromium.launch(); const out = {};
for (const [name, w, h, mobile] of [['desktop', 1440, 900, false], ['phone', 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('file://' + process.env.S + '/synthetic-30.html', { waitUntil: 'networkidle' });
  out[name] = await page.evaluate(() => {
    const chart = document.querySelector('.h-72'); const r = chart.getBoundingClientRect();
    const cols = [...chart.querySelectorAll(':scope > div > div')];
    const bars = cols.map(c => { const bar = [...c.querySelectorAll('div')].find(d => d.style.height); return bar ? Math.round(bar.getBoundingClientRect().height) : null; });
    const labels = [...chart.querySelectorAll('span')].map(s => ({ t: s.textContent.trim(), w: Math.round(s.getBoundingClientRect().width), l: Math.round(s.getBoundingClientRect().left), r: Math.round(s.getBoundingClientRect().right) }));
    const overlap = labels.filter((l, i) => i > 0 && l.l < labels[i - 1].r).length;
    const pills = document.querySelector('section.overflow-x-auto');
    return { chart: { w: Math.round(r.width), scrollW: chart.scrollWidth, cols: cols.length, colW: cols.map(c => Math.round(c.getBoundingClientRect().width)).slice(0, 3), barsRendered: bars.slice(0, 5), barsZero: bars.filter(x => x === 0).length }, labels: labels.length, overlappingLabels: overlap, labelSample: labels.slice(0, 3), pageScrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, pills: { n: pills.querySelectorAll('button').length, scrollW: pills.scrollWidth, clientW: pills.clientWidth }, rows: document.querySelectorAll('tbody tr').length };
  });
  await page.screenshot({ path: `${process.env.S}/hoops-r1b-synthetic30-${name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
  await ctx.close();
}
await b.close(); console.log(JSON.stringify(out, null, 1));

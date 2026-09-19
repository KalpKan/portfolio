// Usage: S=<dir containing synthetic-30.html> node hoops-r2-synthetic30-measure.mjs (playwright resolvable from cwd)
import { chromium } from 'playwright';
const b = await chromium.launch(); const out = {};
for (const [name, w, h, mobile] of [['desktop', 1440, 900, false], ['phone', 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('file://' + process.env.S + '/synthetic-30.html', { waitUntil: 'networkidle' });
  out[name] = await page.evaluate(() => {
    const bars = [...document.querySelectorAll('[data-bar]')].map(d => Math.round(d.getBoundingClientRect().height));
    const chart = document.querySelector('[data-bar]').closest('.overflow-x-auto');
    const labels = [...chart.querySelectorAll('span[title]')].map(s => ({ t: s.textContent.trim(), l: Math.round(s.getBoundingClientRect().left), r: Math.round(s.getBoundingClientRect().right) }));
    const overlap = labels.filter((l, i) => i > 0 && l.l < labels[i - 1].r).length;
    const pills = document.querySelector('section.overflow-x-auto');
    return { bars: bars.length, barsZero: bars.filter(x => x === 0).length, barSample: bars.slice(0, 5), chart: { clientW: chart.clientWidth, scrollW: chart.scrollWidth, overflowX: getComputedStyle(chart).overflowX }, labels: labels.length, overlappingLabels: overlap, pageScrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, pills: pills.querySelectorAll('button').length, rows: document.querySelectorAll('tbody tr').length };
  });
  await page.screenshot({ path: `${process.env.S}/hoops-r2-synthetic30-${name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
  await ctx.close();
}
await b.close(); console.log(JSON.stringify(out, null, 1));

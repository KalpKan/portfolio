// TEST round 2 audit of the hoops dashboard (independent of the fixer's r2 script; wider coverage).
// Usage: S=<screenshot dir> URL=https://hoops.kalpkan.com node hoops-r2t-playwright-audit.mjs > results.json
import { chromium, webkit } from 'playwright';
const S = process.env.S || '.';
const URL = process.env.URL || 'https://hoops.kalpkan.com';
const ONLY = process.env.ENGINES ? process.env.ENGINES.split(',') : ['chromium', 'webkit'];
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

const measureChart = () => {
  const barEls = [...document.querySelectorAll('[data-bar]')];
  const bars = barEls.map(d => {
    const r = d.getBoundingClientRect();
    const valueEl = d.parentElement.querySelector('span');
    const vr = valueEl?.getBoundingClientRect();
    return { id: d.dataset.bar, styleH: d.style.height, renderedH: Math.round(r.height), renderedW: Math.round(r.width), title: d.title, valueText: valueEl?.textContent.trim(), valueVisible: !!vr && vr.width > 0 && vr.height > 0 };
  });
  const chart = barEls[0]?.closest('.overflow-x-auto');
  const labelEls = chart ? [...chart.querySelectorAll('span[title]')] : [];
  const labels = labelEls.map(s => ({ text: s.textContent.trim(), title: s.title, truncated: s.scrollWidth > s.clientWidth + 1, w: Math.round(s.getBoundingClientRect().width) }));
  const gridlines = chart ? [...chart.querySelectorAll('[aria-hidden="true"].border-t')].length : 0;
  const ticks = [...document.querySelectorAll('[data-tick]')].map(t => ({ tick: t.dataset.tick, visible: t.getBoundingClientRect().width > 0 }));
  return { bars, labels, gridlines, ticks, chartScroll: chart ? { scrollW: chart.scrollWidth, clientW: chart.clientWidth, overflowX: getComputedStyle(chart).overflowX } : null };
};

// contrast of every element that directly contains text, against its composited background
const contrastScan = () => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) layers.push(c); if (c && c.a >= 1) break; }
    let bg = { r: 0, g: 0, b: 0, a: 1 };
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor); if (bodyBg && bodyBg.a >= 1) bg = bodyBg;
    for (const l of layers.reverse()) bg = over(l, bg);
    return bg;
  };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el); const fgc = over(fg, bg);
    const l1 = lum(fgc), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    out.push({ text: t.textContent.trim().slice(0, 40), color: cs.color, ratio: Math.round(ratio * 100) / 100, size, large, cls: el.className.toString().slice(0, 60) });
  }
  return { min: Math.min(...out.map(o => o.ratio)), below45: out.filter(o => o.ratio < 4.5), count: out.length };
};

const clippedScan = () => {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (!el.childElementCount && el.textContent.trim() && (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) {
      out.push({ text: el.textContent.trim().slice(0, 50), scrollW: el.scrollWidth, clientW: el.clientWidth, cls: el.className.toString().slice(0, 50) });
    }
  }
  return out;
};

for (const eng of ONLY) {
  const launcher = engines[eng];
  let browser;
  try { browser = await launcher.launch(); } catch (e) { results[eng + ':launch-error'] = String(e).slice(0, 200); continue; }
  for (const c of configs) {
    const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, timezoneId: c.tz, colorScheme: c.scheme, isMobile: !!c.mobile && eng === 'chromium', hasTouch: !!c.mobile, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const errors = []; const warnings = []; const failedRequests = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); if (m.type() === 'warning') warnings.push(m.text().slice(0, 120)); });
    page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
    page.on('response', r => { if (r.status() >= 400) failedRequests.push(r.status() + ' ' + r.url().slice(0, 100)); });
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'load' });
    const loadMs = Date.now() - t0;
    await page.waitForLoadState('networkidle');
    const info = await page.evaluate(() => {
      const rect = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }; };
      const btns = [...document.querySelectorAll('button, a')].map(b => ({ t: b.textContent.trim().slice(0, 40), ...rect(b) }));
      const rows = [...document.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent.trim()));
      const table = document.querySelector('table');
      const tableWrap = table?.parentElement;
      const cards = [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => ({ text: c.innerText.replace(/\n/g, ' | '), ...rect(c) }));
      const text = document.body.innerText;
      const links = [...document.querySelectorAll('a')].map(a => ({ href: a.href, text: a.textContent.trim(), ...rect(a) }));
      const pillRow = document.querySelector('section.overflow-x-auto');
      const noticeEl = [...document.querySelectorAll('p')].find(p => /not available yet/i.test(p.textContent));
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        title: document.title, metaDesc: document.querySelector('meta[name=description]')?.content, ogTitle: document.querySelector('meta[property="og:title"]')?.content, ogDesc: document.querySelector('meta[property="og:description"]')?.content, icon: document.querySelector('link[rel=icon]')?.href,
        scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, bodyBg: getComputedStyle(document.body).backgroundColor,
        loadEventEnd: perf ? Math.round(perf.loadEventEnd) : null, domContentLoaded: perf ? Math.round(perf.domContentLoadedEventEnd) : null,
        btns, rows, cards, links,
        pillScroll: pillRow ? { scrollWidth: pillRow.scrollWidth, clientWidth: pillRow.clientWidth, overflowX: getComputedStyle(pillRow).overflowX } : null,
        tableWrap: tableWrap ? { scrollWidth: tableWrap.scrollWidth, clientWidth: tableWrap.clientWidth, overflowX: getComputedStyle(tableWrap).overflowX, tableWidth: table.scrollWidth } : null,
        notice: noticeEl ? { text: noticeEl.textContent.trim(), ...rect(noticeEl) } : null,
        hasDownload: /download|app store/i.test(text), repoLink: links.some(l => l.href.includes('github.com/KalpKan/Basketball-Stat-Tracker')),
        hiddenNote: (text.match(/\d+ shots? with an invalid timestamp hidden/) || [null])[0],
        liveBadge: /LIVE DATA/i.test(text), demoBanner: /Sample data|Demo data/i.test(text), shotsRecorded: (text.match(/\d+ shots recorded/) || [null])[0],
        pillLabels: [...document.querySelectorAll('section.overflow-x-auto button')].map(b => b.textContent.trim()),
        pillTitles: [...document.querySelectorAll('section.overflow-x-auto button')].map(b => b.title),
        faintTextNodes: document.querySelectorAll('.text-white\\/35, .text-white\\/40, .text-white\\/45').length,
        has1970: /1970|Dec 31|Jan 1\b/.test(text),
      };
    });
    const chart = await page.evaluate(measureChart);
    const contrast = await page.evaluate(contrastScan);
    const clipped = await page.evaluate(clippedScan);
    await page.screenshot({ path: `${S}/hoops-r2t-${eng}-${c.name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    const modes = {};
    for (const m of ['eFG%', 'Streak', 'FG%']) {
      try { await page.getByRole('button', { name: m, exact: true }).first().click(); await page.waitForTimeout(150); } catch (e) { modes[m] = 'no-button'; continue; }
      modes[m] = await page.evaluate(measureChart);
    }
    // click each session pill: cards, chart, table narrow; labels identical
    const pillChecks = [];
    try {
      const pills = page.locator('section.overflow-x-auto button');
      const n = await pills.count();
      for (let i = 1; i < n; i++) {
        const label = (await pills.nth(i).textContent()).trim();
        await pills.nth(i).click(); await page.waitForTimeout(120);
        const r = await page.evaluate((label) => ({ pill: label, chartTitles: [...document.querySelectorAll('[data-bar]')].map(d => d.title), chartLabels: [...document.querySelectorAll('[data-bar]')].map(d => d.closest('.overflow-x-auto').querySelectorAll('span[title]')[0]?.textContent.trim()), rows: [...document.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent.trim())), cards: [...document.querySelectorAll('section .grid > div')].slice(0, 4).map(c => c.innerText.replace(/\n/g, ' | ')) }), label);
        pillChecks.push(r);
      }
      await pills.nth(0).click(); await page.waitForTimeout(120);
    } catch (e) { pillChecks.push('err ' + String(e).slice(0, 100)); }
    let map = null; let mapPill = null;
    try {
      await page.getByRole('button', { name: 'Shot Map' }).click(); await page.waitForTimeout(200);
      const readMap = () => { const svg = document.querySelector('svg[aria-label="Shot map"]'); const r = svg.getBoundingClientRect(); const circles = [...svg.querySelectorAll('circle')]; const dots = circles.slice(3); const outside = dots.filter(c => { const x = +c.getAttribute('cx'), y = +c.getAttribute('cy'); return !(x >= 0 && x <= 200 && y >= 0 && y <= 200); }).length; const fills = {}; dots.forEach(d => { fills[d.getAttribute('fill')] = (fills[d.getAttribute('fill')] || 0) + 1; }); const text = document.body.innerText; const legend = [...document.querySelectorAll('div')].find(d => /^Made\s*Missed$/.test(d.innerText.replace(/\n/g, ' ').trim())); const lr = legend?.getBoundingClientRect(); const rim = circles[1].getBoundingClientRect(); return { circles: circles.length, dots: dots.length, outside, fills, svg: { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) }, rim: { l: Math.round(rim.left), r: Math.round(rim.right) }, legend: lr ? { l: Math.round(lr.left), r: Math.round(lr.right), w: Math.round(lr.width) } : null, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, tracked: text.match(/\d+ tracked attempts/)?.[0], rates: [...text.matchAll(/(\d+\.\d)%\n(Made|Miss) rate/g)].map(m => m[1] + ' ' + m[2]), titles: [...svg.querySelectorAll('circle title')].slice(0, 2).map(t => t.textContent) }; };
      map = await page.evaluate(readMap);
      await page.screenshot({ path: `${S}/hoops-r2t-${eng}-${c.name}-map.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
      const pills = page.locator('section.overflow-x-auto button');
      if (await pills.count() > 1) { await pills.nth(1).click(); await page.waitForTimeout(150); mapPill = await page.evaluate(readMap); await pills.nth(0).click(); }
    } catch (e) { map = 'err ' + String(e).slice(0, 120); }
    results[eng + ':' + c.name] = { loadMs, errors, warnings, failedRequests, ...info, chart, contrast, clipped, modes, pillChecks, map, mapPill };
    await ctx.close();
  }
  await browser.close();
}
console.log(JSON.stringify(results, null, 1));

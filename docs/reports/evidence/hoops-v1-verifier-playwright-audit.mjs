import { chromium, webkit } from 'playwright';
const S = process.env.S || '.';
const URL = 'https://hoops.kalpkan.com';
const configs = [
  { eng:'chromium', name:'desktop-utc', w:1440, h:900, tz:'UTC', scheme:'dark' },
  { eng:'chromium', name:'desktop-toronto', w:1440, h:900, tz:'America/Toronto', scheme:'dark' },
  { eng:'chromium', name:'desktop-toronto-light', w:1440, h:900, tz:'America/Toronto', scheme:'light' },
  { eng:'chromium', name:'phone-toronto', w:390, h:844, tz:'America/Toronto', scheme:'dark', mobile:true },
  { eng:'chromium', name:'phone-tokyo', w:390, h:844, tz:'Asia/Tokyo', scheme:'dark', mobile:true },
  { eng:'webkit', name:'desktop-toronto', w:1440, h:900, tz:'America/Toronto', scheme:'dark' },
  { eng:'webkit', name:'phone-tokyo', w:390, h:844, tz:'Asia/Tokyo', scheme:'dark', mobile:true },
];
const results = {};
for (const c of configs) {
  const browser = await (c.eng === 'webkit' ? webkit : chromium).launch();
  const ctx = await browser.newContext({ viewport:{width:c.w,height:c.h}, timezoneId:c.tz, colorScheme:c.scheme, isMobile:!!c.mobile, hasTouch:!!c.mobile, deviceScaleFactor:2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,300)); });
  page.on('pageerror', e => errors.push('pageerror: '+String(e).slice(0,300)));
  const t0 = Date.now();
  await page.goto(URL, { waitUntil:'networkidle' });
  const loadMs = Date.now()-t0;
  const r = { loadMs, errors };
  const collect = async () => page.evaluate(() => {
    const txt = document.body.innerText;
    const rect = e => { const b=e.getBoundingClientRect(); return {l:Math.round(b.left),r:Math.round(b.right),w:Math.round(b.width),h:Math.round(b.height),t:Math.round(b.top)}; };
    const pills = [...document.querySelectorAll('section.overflow-x-auto button')].map(b => ({t:b.textContent.trim(), ...rect(b), active: b.className.includes('bg-white/10')}));
    const bars = [...document.querySelectorAll('[data-bar]')].map(b => ({id:b.dataset.bar, h:Math.round(b.getBoundingClientRect().height), title:b.title, value: b.parentElement.querySelector('span')?.textContent.trim()}));
    const labelSpans = [...document.querySelectorAll('[data-bar]')].length ? [...document.querySelector('[data-bar]').closest('.relative[style]').nextElementSibling.querySelectorAll('span')] : [];
    const labels = labelSpans.map(s => ({ t:s.textContent.trim(), w:Math.round(s.getBoundingClientRect().width), scrollW:s.scrollWidth, clientW:s.clientWidth, truncated: s.scrollWidth > s.clientWidth + 1, overflow:getComputedStyle(s).textOverflow, fontPx:getComputedStyle(s).fontSize }));
    const ticks = [...document.querySelectorAll('[data-tick]')].map(s=>s.dataset.tick);
    const rows = [...document.querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(c=>c.textContent.trim()));
    const cards = [...document.querySelectorAll('section .grid > div')].slice(0,4).map(c => ({ text:c.innerText.replace(/\n/g,' | '), ...rect(c) }));
    const buttons = [...document.querySelectorAll('button')].map(b => ({t:b.textContent.trim().slice(0,40), h:Math.round(b.getBoundingClientRect().height)}));
    const table = document.querySelector('table'); const wrap = table?.parentElement;
    const overflowing = [...document.querySelectorAll('body *')].filter(e => { const b=e.getBoundingClientRect(); return b.width>0 && b.right > document.documentElement.clientWidth+1; }).slice(0,8).map(e => e.tagName+'.'+[...e.classList].slice(0,3).join('.')+' r='+Math.round(e.getBoundingClientRect().right));
    const notice = [...document.querySelectorAll('p,div,span')].find(e => /not available yet/i.test(e.textContent) && e.children.length < 4);
    const repoLink = [...document.querySelectorAll('a')].map(a=>a.href).filter(h=>/github.com\/KalpKan\/Basketball-Stat-Tracker/.test(h));
    const sec = [...document.querySelectorAll('[class*="text-white/"]')].map(e=>[...e.classList].find(c=>/^text-white\/\d+$/.test(c))).filter(Boolean);
    const secMin = Math.min(...sec.map(c=>+c.split('/')[1]));
    const live = document.querySelector('[aria-label="Live"]');
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, pills, bars, labels, ticks, rows, cards, buttons, tableWrap: wrap ? {overflowX:getComputedStyle(wrap).overflowX, sw:wrap.scrollWidth, cw:wrap.clientWidth} : null, overflowing, demoMatches:(txt.match(/Demo data/g)||[]).length, downloadMatches:(txt.match(/download|app store/gi)||[]).length, noticeTop: notice ? rect(notice).t : null, noticeText: notice?.textContent.trim().slice(0,200), repoLink, minOpacityClass: secMin, liveBadge: !!live, shotsRecorded: txt.match(/(\d+) shots? recorded/)?.[1], hiddenNote: txt.match(/\d+ shots? with an invalid timestamp hidden/)?.[0], has1970: /1970|Dec 31|Jan 1\b/.test(txt), title: document.title };
  });
  r.initial = await collect();
  await page.screenshot({ path:`${S}/v-${c.eng}-${c.name}.jpg`, fullPage:true, type:'jpeg', quality:65 });
  // toggle modes
  r.modes = {};
  for (const m of ['eFG%','Streak','FG%']) {
    await page.getByRole('button', { name: m, exact:true }).click(); await page.waitForTimeout(150);
    const d = await collect(); r.modes[m] = { bars:d.bars, ticks:d.ticks, labels:d.labels.map(l=>l.t+(l.truncated?' [TRUNC]':'')) };
  }
  // pill select second pill (Apr 16)
  const pillBtn = page.locator('section.overflow-x-auto button', { hasText: 'Apr 16' });
  if (await pillBtn.count()) {
    await pillBtn.click(); await page.waitForTimeout(150);
    const d = await collect(); r.aprSelected = { pills:d.pills.filter(p=>p.active).map(p=>p.t), bars:d.bars, rows:d.rows, cards:d.cards.map(x=>x.text), labels:d.labels.map(l=>l.t) };
    await page.screenshot({ path:`${S}/v-${c.eng}-${c.name}-apr16.jpg`, fullPage:true, type:'jpeg', quality:65 });
    // shot map on this filter
    await page.getByRole('button', { name:'Shot Map', exact:true }).click(); await page.waitForTimeout(300);
    r.mapApr16 = await page.evaluate(() => { const svg=document.querySelector('svg[aria-label="Shot map"]'); const cs=[...svg.querySelectorAll('circle')]; const dots=cs.filter(c=>c.querySelector('title')); const vb=svg.viewBox.baseVal; return { dots:dots.length, allCircles:cs.length, out:dots.filter(c=>{const x=+c.getAttribute('cx'),y=+c.getAttribute('cy');return x<vb.x||x>vb.x+vb.width||y<vb.y||y>vb.y+vb.height}).length, tracked: document.body.innerText.match(/(\d+) tracked attempts/)?.[1], rates: document.body.innerText.match(/\d+\.\d+ ?%/g)?.slice(0,6), titles: dots.slice(0,2).map(d=>d.querySelector('title').textContent) }; });
    await page.locator('section.overflow-x-auto button', { hasText: 'All Sessions' }).click(); await page.waitForTimeout(300);
  } else { await page.getByRole('button', { name:'Shot Map', exact:true }).click(); await page.waitForTimeout(300); }
  r.mapAll = await page.evaluate(() => { const svg=document.querySelector('svg[aria-label="Shot map"]'); const cs=[...svg.querySelectorAll('circle')]; const dots=cs.filter(c=>c.querySelector('title')); const vb=svg.viewBox.baseVal; const b=svg.getBoundingClientRect(); const legend=[...document.querySelectorAll('div,ul')].find(d=>d.innerText?.trim()==='Made\nMissed'); const lb=legend?.getBoundingClientRect(); const txt=document.body.innerText; const made=txt.match(/Made rate\s*\n?\s*([\d.]+)%/i)?.[1]; const miss=txt.match(/Miss rate\s*\n?\s*([\d.]+)%/i)?.[1]; return { dots:dots.length, allCircles:cs.length, out:dots.filter(c=>{const x=+c.getAttribute('cx'),y=+c.getAttribute('cy');return x<vb.x||x>vb.x+vb.width||y<vb.y||y>vb.y+vb.height}).length, viewBox:[vb.x,vb.y,vb.width,vb.height], svgRect:{l:Math.round(b.left),r:Math.round(b.right)}, legend: lb?{l:Math.round(lb.left),r:Math.round(lb.right)}:null, tracked: txt.match(/(\d+) tracked attempts/)?.[1], made, miss, clientWidth:document.documentElement.clientWidth, scrollWidth:document.documentElement.scrollWidth, sampleTitle: dots[0]?.querySelector('title').textContent, fills:[...new Set(dots.map(d=>d.getAttribute('fill')||d.getAttribute('class')))].slice(0,4) }; });
  await page.screenshot({ path:`${S}/v-${c.eng}-${c.name}-map.jpg`, fullPage:true, type:'jpeg', quality:65 });
  results[`${c.eng}:${c.name}`] = r;
  await ctx.close(); await browser.close();
}
console.log(JSON.stringify(results, null, 1));

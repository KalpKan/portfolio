const { chromium } = require('/Users/kalp/projects/promptflip/node_modules/playwright');
const EV = '/Users/kalp/projects/plato-corpus/evidence/audit-r3-2026-09-19';
const files = { 'b3415g': '/Users/kalp/projects/plato-corpus/pdfs/B3415G Course Outline 2025.pdf', 'anatcell3309': '/Users/kalp/projects/plato-corpus/pdfs/ANATCELL 3309 Syllabus FW25-26.pdf', 'mse2214': '/Users/kalp/projects/plato-corpus/pdfs/MSE-2214_Fall-2025-Website-Version.pdf', 'mos2242a': '/Users/kalp/projects/plato-corpus/pdfs/2242A001.pdf' };
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const [k, pdf] of Object.entries(files)) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('https://plato.kalpkan.com/', { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', pdf);
    await page.check('input[name=force_refresh]');
    await Promise.all([page.waitForURL('**/review', { timeout: 60000 }), page.click('button[type=submit]:has-text("Read the outline")')]);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${EV}/review-${k}-1280.png`, fullPage: true });
    const strip = await page.evaluate(() => document.body.innerText.length);
    console.log(k, 'ok', strip);
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://plato.kalpkan.com/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('.workflow-step')?.scrollIntoView({block:'center'}));
  await page.screenshot({ path: `${EV}/index-how-it-works-1280.png` });
  console.log(await page.evaluate(() => [...document.querySelectorAll('.workflow-step')].map(e => { const r = e.getBoundingClientRect(); return e.textContent.trim().slice(0,14) + ' x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' vis=' + (r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0'); })));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

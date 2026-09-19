const { chromium } = require('/Users/kalp/projects/promptflip/node_modules/playwright');
const EV = '/Users/kalp/projects/plato-corpus/evidence/audit-r2-2026-09-19';
const PDF = '/Users/kalp/projects/plato-corpus/pdfs/FHS Course Outline 2000.pdf';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = {};
  for (const w of [390, 360, 320, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 800 }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500, hasTouch: w < 500 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    const measure = async (name) => {
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const over = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > de.clientWidth + 1; }).slice(0, 8).map(el => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').slice(0,2).join('.') : '') + ' right=' + Math.round(el.getBoundingClientRect().right));
        const fonts = [...document.querySelectorAll('input,select,textarea')].map(el => getComputedStyle(el).fontSize);
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, bodyScrollWidth: document.body.scrollWidth, overflowing: over, inputFontSizes: [...new Set(fonts)] };
      });
      await page.screenshot({ path: `${EV}/${name}-${w}.png`, fullPage: true });
      out[`${name}@${w}`] = m;
    };
    await page.goto('https://plato.kalpkan.com/', { waitUntil: 'networkidle' });
    await measure('index');
    await page.setInputFiles('input[type=file]', PDF);
    await page.waitForTimeout(500);
    await measure('index-file-selected');
    const t0 = Date.now();
    await Promise.all([page.waitForURL('**/review', { timeout: 60000 }), page.click('button[type=submit]:has-text("Read the outline")')]);
    await page.waitForLoadState('networkidle');
    out[`upload_ms@${w}`] = Date.now() - t0;
    await measure('review');
    // open the study reminders and an edit control to see the editing UI at this width
    try { await page.click('text=Study Reminders'); await page.waitForTimeout(300); } catch (e) {}
    try { await page.click('text=Add date'); await page.waitForTimeout(300); } catch (e) {}
    await measure('review-editing');
    try { await page.click('text=Cancel'); } catch (e) {}
    try { await page.click('text=Add Section'); await page.waitForTimeout(300); await measure('review-add-section-modal'); await page.click('text=Cancel'); } catch (e) { out['modal@'+w] = String(e).slice(0,100); }
    try {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('button:has-text("Download Calendar")')]);
      out[`download@${w}`] = dl.suggestedFilename();
    } catch (e) { out[`download@${w}`] = 'FAILED ' + String(e).slice(0, 120); }
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(200);
    out[`lightbg@${w}`] = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' / ' + getComputedStyle(document.body).color);
    await page.screenshot({ path: `${EV}/review-light-${w}.png`, fullPage: false });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('https://plato.kalpkan.com/manual', { waitUntil: 'networkidle' });
    await measure('manual');
    out[`console@${w}`] = errors;
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });

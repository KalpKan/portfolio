// D5 + widths + D6 check in a real Chromium against BASE (local or live)
const { chromium } = require('/Users/kalp/projects/promptflip/node_modules/playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:5078';
const EV = process.env.EV || '/Users/kalp/projects/plato-corpus/evidence/fix1-2026-09-19';
const PDF = '/Users/kalp/projects/plato-corpus/pdfs/FHS Course Outline 2000.pdf';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = { base: BASE };
  for (const w of [1280, 390, 360, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 800 }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500, hasTouch: w < 500, acceptDownloads: true });
    const page = await ctx.newPage();
    const dialogs = []; const errors = [];
    page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    const measure = async (name) => {
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const over = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > de.clientWidth + 1; }).slice(0, 6).map(el => el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 2).join('.') + ' right=' + Math.round(el.getBoundingClientRect().right));
        const fonts = [...document.querySelectorAll('input,select,textarea')].map(el => getComputedStyle(el).fontSize);
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, overflowing: over, inputFontSizes: [...new Set(fonts)] };
      });
      await page.screenshot({ path: `${EV}/${name}-${w}.png`, fullPage: true });
      out[`${name}@${w}`] = m;
    };
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await measure('index');
    await page.setInputFiles('input[type=file]', PDF);
    await page.check('input[name=force_refresh]');
    const t0 = Date.now();
    await Promise.all([page.waitForURL('**/review', { timeout: 90000 }), page.click('#btn-generate')]);
    await page.waitForLoadState('networkidle');
    out[`parse_seconds@${w}`] = ((Date.now() - t0) / 1000).toFixed(1);
    await measure('review');
    if (w === 1280 || w === 390) {
      // D5: edit a weight inline, save, then download
      const weight = page.locator('.editable-field[data-field-type="assessment_weight"]').first();
      await weight.click();
      await page.waitForSelector('.inline-edit-input');
      await measure('review-editing');
      await page.fill('.inline-edit-input', '7');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      out[`editing_left@${w}`] = await page.locator('.editable-field.editing').count();
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#generate-calendar-btn')]);
      const p = `${EV}/download-${w}.ics`; await dl.saveAs(p);
      const ics = fs.readFileSync(p, 'utf8');
      out[`download@${w}`] = { file: dl.suggestedFilename(), vevents: (ics.match(/BEGIN:VEVENT/g) || []).length, has7pct: ics.includes('Weight: 7%'), dtstamp: (ics.match(/DTSTAMP/g) || []).length, vtimezone: ics.includes('BEGIN:VTIMEZONE'), until: (ics.match(/UNTIL=[^;\r\n]+/) || [''])[0], summaries: [...new Set((ics.match(/SUMMARY:[^\r\n]+/g) || []))].slice(0, 6), invented: /2026043[0]T235900|20260919T235900/.test(ics) };
      out[`dialogs@${w}`] = dialogs.slice();
    }
    out[`errors@${w}`] = errors.slice(0, 5);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${EV}/playwright-${BASE.replace(/[^a-z0-9]/gi, '_')}.json`, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAILED', e); process.exit(1); });

const { chromium } = require('/Users/kalp/projects/promptflip/node_modules/playwright');
const EV = '/Users/kalp/projects/plato-corpus/evidence/audit-r2-2026-09-19';
const PDF = '/Users/kalp/projects/plato-corpus/pdfs/FHS Course Outline 2000.pdf';
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const w of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500, acceptDownloads: true });
    const page = await ctx.newPage(); const dialogs = [];
    page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    await page.goto('https://plato.kalpkan.com/', { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', PDF);
    await Promise.all([page.waitForURL('**/review', { timeout: 60000 }), page.click('button[type=submit]')]);
    await page.waitForLoadState('networkidle');
    const wf = page.locator('.editable-field[title*="weight" i]').first();
    await wf.scrollIntoViewIfNeeded(); await wf.click(); await page.waitForTimeout(200);
    await page.locator('.editable-field.editing input').fill('7');
    await page.locator('.editable-field.editing button:has-text("Save")').click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${EV}/review-after-edit-${w}.png`, fullPage: false });
    const btn = page.locator('button:has-text("Download Calendar")');
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    try {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), btn.click()]);
      const p = `${EV}/download-${w}.ics`; await dl.saveAs(p);
      console.log(w, 'download OK', dl.suggestedFilename(), 'btn', JSON.stringify(box), 'dialogs', JSON.stringify(dialogs));
    } catch (e) { console.log(w, 'download FAILED', String(e).slice(0, 150), 'dialogs', JSON.stringify(dialogs)); }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

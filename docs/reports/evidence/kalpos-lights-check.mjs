import { createRequire } from 'node:module';
// Playwright is not a hub dependency: borrow promptflip's install (any project with playwright works).
const { chromium } = createRequire('/Users/kalp/projects/promptflip/package.json')('playwright');
const base = process.argv[2] ?? 'http://localhost:3999';
const out = process.argv[3] ?? '/Users/kalp/projects/portfolio/docs/images/kalpos/fixes';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
const page = await ctx.newPage();
const errors = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push(String(e)));
const held = async (sel) => { const b = await page.locator(sel).first().boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); await page.waitForTimeout(450); };
const dialogs = () => page.evaluate(() => [...document.querySelectorAll('[role=dialog]')].map(d => d.getAttribute('aria-label')));
const log = (k, v) => console.log(k.padEnd(34), JSON.stringify(v));

await page.goto(base + '/?desk'); await page.waitForTimeout(800);
await held('button.kos-icon:has-text("Projects")'); log('open Projects (held click)', await dialogs());
await page.screenshot({ path: out + '/projects-open.png' });
await held('.kos-light--close'); log('red light -> dialogs', await dialogs());
await held('button.kos-icon:has-text("Projects")');
await held('.kos-light--min'); log('yellow -> dialogs', await dialogs());
log('dock tile running dot', await page.evaluate(() => !!document.querySelector('.kos-dock-item--finder .kos-dock-dot')));
await page.screenshot({ path: out + '/minimised-dock-dot.png' });
await held('.kos-dock-item--finder'); log('dock tile -> dialogs', await dialogs());
await held('.kos-light--zoom'); log('green -> width', await page.evaluate(() => document.querySelector('[role=dialog]').style.width));
await held('.kos-light--zoom'); log('green again -> width', await page.evaluate(() => document.querySelector('[role=dialog]').style.width));
// double click on an icon: open once, stays open
await page.dblclick('button.kos-icon:has-text("About me")'); await page.waitForTimeout(500); log('double-click About -> dialogs', await dialogs());
// drag About by its title bar
const before = await page.evaluate(() => document.querySelector('[data-window=about]').getBoundingClientRect().left);
const tb = await page.locator('[data-window=about] .kos-window-titlebar').boundingBox();
await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.mouse.down(); for (let i = 1; i <= 10; i++) { await page.mouse.move(tb.x + tb.width / 2 + i * 20, tb.y + tb.height / 2 + i * 8); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(600);
const after = await page.evaluate(() => document.querySelector('[data-window=about]').getBoundingClientRect().left);
log('drag title bar dx', Math.round(after - before));
// inner button inside an unfocused window still clicks: click the Projects window's "Hardware" filter after focusing About
await held('.kos-filter:has-text("Hardware")'); log('sidebar filter pressed', await page.evaluate(() => document.querySelector('.kos-filter[aria-pressed=true]').textContent));
await page.keyboard.press('Escape'); await page.waitForTimeout(500); log('Esc -> dialogs', await dialogs());
await page.keyboard.press('Escape'); await page.waitForTimeout(500); log('Esc again -> dialogs', await dialogs());
// phone
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
phone.on('console', m => { if (m.type() === 'error') errors.push('phone: ' + m.text()); }); phone.on('pageerror', e => errors.push('phone: ' + String(e)));
await phone.goto(base + '/?desk'); await phone.waitForTimeout(800);
const sheetSel = '.kos-sheet';
const sheetY = () => phone.evaluate(() => ({ y: document.querySelector('.kos-sheet')?.style.getPropertyValue('--sheet-y'), label: document.querySelector('.kos-sheet')?.getAttribute('aria-label'), top: Math.round(document.querySelector('.kos-sheet').getBoundingClientRect().top) }));
log('phone sheet before', await sheetY());
const opener = phone.locator('button:has-text("Projects")').first(); await opener.tap(); await phone.waitForTimeout(600);
log('phone sheet after tap', await sheetY());
await phone.screenshot({ path: out + '/phone-sheet.png' });
await phone.locator('.kos-sheet-close').tap(); await phone.waitForTimeout(700); log('phone sheet after close', await sheetY());
log('console errors', errors);
await browser.close();

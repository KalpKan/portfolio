import { createRequire } from 'node:module';
// Playwright is not a hub dependency: borrow promptflip's install (any project with playwright works).
const { chromium } = createRequire('/Users/kalp/projects/promptflip/package.json')('playwright');
const base = process.argv[2] ?? 'http://localhost:3999';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 800 } })).newPage();
await page.goto(base + '/?f=' + Date.now(), { waitUntil: 'commit' });
await page.waitForFunction(() => document.querySelector('.kos')?.getAttribute('data-stage') === 'lock', null, { timeout: 8000 });
await page.waitForTimeout(100);
console.log('active after lock:', await page.evaluate(() => document.activeElement?.tagName + '/' + document.activeElement?.getAttribute('aria-label')));
await page.keyboard.type('hi'); await page.keyboard.press('Enter'); await page.waitForTimeout(1600);
console.log('stage after typing + Enter:', await page.evaluate(() => document.querySelector('.kos').getAttribute('data-stage')));
await browser.close();

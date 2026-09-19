// FIX round 1 live verification for Plant It (Playwright Chromium on production; 2 Pl@ntNet calls).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';

const BASE = process.env.BASE || 'https://plantit.kalpkan.com';
const UID = 'fix1-test';
const API_KEY = 'AIzaSyCL08dLFchZWMR5YbxNarVgmQoPWZIMQUE';
const FIX = '/Users/kalp/projects/plantit/tests/fixtures/plants';
const OUT = path.resolve('out'); fs.mkdirSync(OUT, { recursive: true });
const SA = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/portfolio-ops/plantit-firebase-sa.json`, 'utf8'));
const fbApp = initializeApp({ credential: cert(SA) });
const results = { base: BASE, ranAt: new Date().toISOString() };

async function session() {
  const custom = await getAuth(fbApp).createCustomToken(UID);
  const r = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: custom, returnSecureToken: true });
  return { idToken: r.data.idToken, refreshToken: r.data.refreshToken, expiresIn: Number(r.data.expiresIn) };
}
async function injectAuth(page, s) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ uid, apiKey, idToken, refreshToken, expiresIn }) => {
    const rec = { uid, email: `${uid}@example.test`, emailVerified: false, isAnonymous: false, providerData: [],
      stsTokenManager: { refreshToken, accessToken: idToken, expirationTime: Date.now() + expiresIn * 1000 - 60000 },
      createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' };
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('firebaseLocalStorage')) db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { const db = req.result; const tx = db.transaction('firebaseLocalStorage', 'readwrite');
        tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: rec });
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); };
    });
  }, { uid: UID, apiKey: API_KEY, ...s });
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 70 });

async function identify(page, file) {
  await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' });
  await page.setInputFiles('[data-testid="file-input"]', path.join(FIX, file));
  await page.waitForTimeout(400);
  const btn = page.locator('[data-testid="identify"]');
  const respP = page.waitForResponse((r) => r.url().includes('/api/identify'), { timeout: 60000 }).catch(() => null);
  const t0 = Date.now();
  await btn.click();
  const r = await respP;
  const body = r ? await r.json().catch(() => null) : null;
  await Promise.race([page.waitForURL('**/plant-details', { timeout: 30000 }).catch(() => null), page.waitForSelector('.MuiAlert-standardError', { timeout: 30000 }).catch(() => null)]);
  await page.waitForTimeout(700);
  return { file, ms: Date.now() - t0, status: r && r.status(), body: body && { notAPlant: body.notAPlant, error: body.error, lowConfidence: body.lowConfidence, top1: body.candidates?.[0]?.species?.scientificNameWithoutAuthor, score: body.candidates?.[0]?.score, n: body.candidates?.length, savedPlantId: body.savedPlant?.id, threshold: body.careInstructions?.soilMoisture?.wateringThreshold },
    url: page.url(), alerts: await page.locator('.MuiAlert-message').allTextContents() };
}

const s = await session();
const api = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${s.idToken}` }, validateStatus: () => true, timeout: 60000 });
const browser = await chromium.launch({ headless: true });
const consoleErrors = [];
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.mobile ? 3 : 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ vp: vp.name, text: m.text().slice(0, 200), url: page.url() }); });
  page.on('pageerror', (e) => consoleErrors.push({ vp: vp.name, text: 'pageerror ' + e.message.slice(0, 200), url: page.url() }));
  const R = (results[vp.name] = {});
  // D4 signed out
  await page.goto(`${BASE}/plants/whatever`, { waitUntil: 'networkidle' });
  R.signedOutUnknown = { url: page.url(), text: (await page.locator('#root').innerText()).slice(0, 120) };
  // D10 on /login: button text colour + contrast
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  R.loginButton = await page.evaluate(() => { const b = document.querySelector('button'); const cs = getComputedStyle(b); return { color: cs.color, backgroundImage: cs.backgroundImage.slice(0, 80), hasSvgLogo: !!b.querySelector('svg'), hasImgLogo: !!b.querySelector('img') }; });
  R.loginIframes = await page.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => f.src.slice(0, 60)));
  await shot(page, `${vp.name}-login`);
  await injectAuth(page, s);
  // D4 signed in
  for (const p of ['/plants/whatever', '/x/y']) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
    R[`route ${p}`] = { text: (await page.locator('#root').innerText()).replace(/\s+/g, ' ').slice(0, 160), links: await page.locator('#root a').evaluateAll((as) => as.map((a) => a.getAttribute('href'))) };
  }
  await shot(page, `${vp.name}-not-found`);
  // D10 disabled Identify button + D7 txt drop
  await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' });
  R.identifyDisabled = await page.evaluate(() => { const b = document.querySelector('[data-testid="identify"]'); const cs = getComputedStyle(b); return { disabled: b.disabled, color: cs.color, backgroundImage: cs.backgroundImage.slice(0, 60), backgroundColor: cs.backgroundColor }; });
  await page.setInputFiles('[data-testid="file-input"]', path.join(FIX, 'not-an-image.txt'));
  await page.waitForTimeout(400);
  R.txtDrop = { alerts: await page.locator('.MuiAlert-message').allTextContents() };
  await shot(page, `${vp.name}-txt-drop`);
  if (vp.name === 'desktop') {
    R.mug = await identify(page, 'not-a-plant-mug.jpg');
    await shot(page, 'desktop-mug-refused');
    R.lowConf = await identify(page, 'monstera-deliciosa-2.jpg');
    R.lowConf.otherCandidates = await page.locator('[data-testid="other-candidates"]').innerText().catch(() => null);
    R.lowConf.warning = await page.locator('[data-testid="low-confidence-notice"]').innerText().catch(() => null);
    await shot(page, 'desktop-lowconf');
    await page.goto(`${BASE}/plants`, { waitUntil: 'networkidle' });
    R.plantsChips = await page.locator('.MuiChip-label').allTextContents();
    R.plantsCount = await page.locator('[data-testid="plant-card"]').count();
    await shot(page, 'desktop-plants');
  }
  await ctx.close();
}
await browser.close();
results.consoleErrors = consoleErrors;
// cleanup
const list = await api.get('/api/plants');
for (const p of list.data) await api.delete(`/api/plants/${p.id}`);
results.deleted = list.data.length;
fs.writeFileSync(path.join(OUT, 'verify.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
process.exit(0);

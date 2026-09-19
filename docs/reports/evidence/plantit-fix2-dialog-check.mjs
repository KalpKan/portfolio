// FIX round 2 browser check: D8 (dialog leads with the reading; Water now above the fold at 1440x900 and 390x844),
// D9 (moisture on cards), D6 image attributes. Signs in a throwaway Firebase user via IndexedDB, seeds 2 plants
// through /api/identify (2 Pl@ntNet calls), measures, screenshots, deletes the plants.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';
import FormData from 'form-data';
const BASE = process.env.BASE || 'http://localhost:3999';
const UID = process.env.TEST_UID || 'fix2-dialog';
const API_KEY = 'AIzaSyCL08dLFchZWMR5YbxNarVgmQoPWZIMQUE';
const FIX = '/Users/kalp/projects/plantit/tests/fixtures/plants';
const OUT = process.env.OUT || path.resolve('out-dialog'); fs.mkdirSync(OUT, { recursive: true });
const SA = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/portfolio-ops/plantit-firebase-sa.json`, 'utf8'));
const fbApp = initializeApp({ credential: cert(SA) });
const custom = await getAuth(fbApp).createCustomToken(UID);
const r = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: custom, returnSecureToken: true });
const s = { idToken: r.data.idToken, refreshToken: r.data.refreshToken, expiresIn: Number(r.data.expiresIn) };
const api = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${s.idToken}` }, validateStatus: () => true, timeout: 60000 });
const R = { base: BASE, ranAt: new Date().toISOString(), seeds: [], widths: {} };
const existing = (await api.get('/api/plants')).data || [];
if (existing.length === 0) for (const f of ['monstera-deliciosa-2.jpg', 'zamioculcas-zamiifolia.jpg']) {
  const fd = new FormData(); fd.append('image', fs.createReadStream(`${FIX}/${f}`), { filename: f, contentType: 'image/jpeg' });
  const r2 = await api.post('/api/identify', fd, { headers: fd.getHeaders() });
  R.seeds.push({ f, status: r2.status, species: r2.data?.savedPlant?.species, lowConfidence: r2.data?.lowConfidence, thumbUrl: r2.data?.savedPlant?.thumbUrl });
  if (r2.data?.savedPlant?.thumbUrl) R.seeds[R.seeds.length - 1].thumbHead = (await axios.head(r2.data.savedPlant.thumbUrl, { validateStatus: () => true })).status;
}
const list = (await api.get('/api/plants')).data;
R.listReadings = list.map((p) => ({ species: p.species, thumbUrl: Boolean(p.thumbUrl), reading: p.reading && { currentVWC: p.reading.currentVWC, needsWater: p.reading.needsWater, wateringThreshold: p.reading.wateringThreshold } }));
const browser = await chromium.launch();
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: Boolean(vp.mobile), deviceScaleFactor: vp.mobile ? 3 : 1 });
  const page = await ctx.newPage();
  const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); }); page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ uid, apiKey, idToken, refreshToken, expiresIn }) => {
    const rec = { uid, email: `${uid}@example.test`, emailVerified: false, isAnonymous: false, providerData: [], stsTokenManager: { refreshToken, accessToken: idToken, expirationTime: Date.now() + expiresIn * 1000 - 60000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' };
    await new Promise((resolve, reject) => { const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('firebaseLocalStorage')) db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { const db = req.result; const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: rec }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }; });
  }, { uid: UID, apiKey: API_KEY, ...s });
  await page.goto(`${BASE}/plants`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="plant-card"]');
  const W = {};
  W.cards = await page.evaluate(() => [...document.querySelectorAll('[data-testid="plant-card"]')].map((c) => { const img = c.querySelector('img'); const rd = c.querySelector('[data-testid="card-reading"]'); return { img: img && { src: img.getAttribute('src').slice(-12), fetchpriority: img.getAttribute('fetchpriority'), loading: img.getAttribute('loading'), width: img.getAttribute('width'), height: img.getAttribute('height'), complete: img.complete, naturalWidth: img.naturalWidth }, reading: rd && rd.innerText, chips: [...c.querySelectorAll('.MuiChip-root')].map((x) => x.innerText + (/MuiChip-colorWarning/.test(x.className) ? ' [warning]' : ' [default]')) }; }));
  W.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.screenshot({ path: `${OUT}/${vp.name}-plants.jpg`, quality: 70 });
  const t0 = Date.now();
  await page.locator('[data-testid="plant-card"]').first().click();
  await page.waitForSelector('[data-testid="water-now"]');
  W.dialogOpenMs = Date.now() - t0;
  W.dialog = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const img = d.querySelector('img'); const sp = d.querySelector('[data-testid="sensor-panel"]'); const w = d.querySelector('[data-testid="water-now"]'); const box = (e) => e ? { top: Math.round(e.getBoundingClientRect().top), bottom: Math.round(e.getBoundingClientRect().bottom), height: Math.round(e.getBoundingClientRect().height) } : null; const title = d.querySelector('.MuiDialogTitle-root'); const btns = [...d.querySelectorAll('.MuiDialogActions-root button')].map((b) => b.innerText + (/MuiButton-text/.test(b.className) ? ' [text]' : /MuiButton-contained/.test(b.className) ? ' [contained]' : ' [outlined]')); return { viewportH: innerHeight, img: box(img), sensorPanel: box(sp), waterNow: box(w), waterNowVisibleWithoutScroll: w.getBoundingClientRect().bottom <= innerHeight, panelBeforeImg: Boolean(sp.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING), titleChips: [...title.querySelectorAll('.MuiChip-root')].map((x) => x.innerText), panelText: sp.innerText.slice(0, 120), actions: btns }; });
  await page.screenshot({ path: `${OUT}/${vp.name}-dialog.jpg`, quality: 70 });
  await page.waitForTimeout(1200); // the device request (watering log) has answered by now
  W.dialogAfterLoad = await page.evaluate(() => document.querySelector('[data-testid="sensor-panel"]').innerText.slice(0, 160));
  // Water now still works from the new layout
  const wp = page.waitForResponse((r) => r.url().includes('/water'));
  await page.locator('[data-testid="water-now"]').click();
  const wr = await wp; W.water = { status: wr.status(), mode: (await wr.json()).mode };
  await page.waitForTimeout(500);
  W.cardReadingAfterWater = await page.evaluate(() => document.querySelector('[data-testid="card-reading"]').innerText);
  W.errors = errors;
  R.widths[vp.name] = W;
  console.log(vp.name, JSON.stringify(W, null, 1));
  await ctx.close();
}
await browser.close();
const left = (await api.get('/api/plants')).data; if (process.env.CLEANUP === '1') for (const p of left) await api.delete(`/api/plants/${p.id}`);
R.deleted = process.env.CLEANUP === '1' ? left.length : 0;
fs.writeFileSync(`${OUT}/dialog-check.json`, JSON.stringify(R, null, 2));
console.log('seeds', JSON.stringify(R.seeds), 'list', JSON.stringify(R.listReadings), 'deleted', R.deleted);
process.exit(0);

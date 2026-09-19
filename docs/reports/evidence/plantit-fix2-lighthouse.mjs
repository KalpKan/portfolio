// Lighthouse 12 mobile on /login (signed out) and /plants (signed in via IndexedDB injection), through Playwright's Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';
const BASE = process.env.BASE || 'https://plantit.kalpkan.com';
const UID = process.env.UID_OVERRIDE || 'fix2-lh';
const API_KEY = 'AIzaSyCL08dLFchZWMR5YbxNarVgmQoPWZIMQUE';
const SA = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/portfolio-ops/plantit-firebase-sa.json`, 'utf8'));
const fbApp = initializeApp({ credential: cert(SA) });
const custom = await getAuth(fbApp).createCustomToken(UID);
const r = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: custom, returnSecureToken: true });
const s = { idToken: r.data.idToken, refreshToken: r.data.refreshToken, expiresIn: Number(r.data.expiresIn) };
const PORT = 9555;
import FormData from 'form-data';
const api = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${s.idToken}` }, validateStatus: () => true, timeout: 60000 });
const FIX = '/Users/kalp/projects/plantit/tests/fixtures/plants';
const existing = (await api.get('/api/plants')).data || [];
console.log('existing plants', existing.length);
if (existing.length === 0) for (const f of ['monstera-deliciosa.jpg', 'ficus-lyrata.jpg', 'aloe-vera.jpg']) { const fd = new FormData(); fd.append('image', fs.createReadStream(`${FIX}/${f}`), { filename: f, contentType: 'image/jpeg' }); const r2 = await api.post('/api/identify', fd, { headers: fd.getHeaders() }); console.log('seed', f, r2.status, r2.data?.savedPlant?.species); }
const userDir = path.resolve('lh-profile'); fs.rmSync(userDir, { recursive: true, force: true });
const ctx = await chromium.launchPersistentContext(userDir, { headless: true, args: [`--remote-debugging-port=${PORT}`] });
const out = {};
const flags = { port: PORT, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'], formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } };
for (const [name, url] of [['login', `${BASE}/login`], ['plants', `${BASE}/plants`]]) {
  if (name === 'plants') {
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(async ({ uid, apiKey, idToken, refreshToken, expiresIn }) => {
  const rec = { uid, email: `${uid}@example.test`, emailVerified: false, isAnonymous: false, providerData: [], stsTokenManager: { refreshToken, accessToken: idToken, expirationTime: Date.now() + expiresIn * 1000 - 60000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' };
  await new Promise((resolve, reject) => { const req = indexedDB.open('firebaseLocalStorageDb', 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('firebaseLocalStorage')) db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { const db = req.result; const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: rec }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }; });
}, { uid: UID, apiKey: API_KEY, ...s });

  }
  const res = await lighthouse(url, flags);
  const lhr = res.lhr;
  out[name] = { url, finalUrl: lhr.finalDisplayedUrl, performance: lhr.categories.performance.score, accessibility: lhr.categories.accessibility.score, bestPractices: lhr.categories['best-practices'].score,
    fcp: lhr.audits['first-contentful-paint'].displayValue, lcp: lhr.audits['largest-contentful-paint'].displayValue, tbt: lhr.audits['total-blocking-time'].displayValue, cls: lhr.audits['cumulative-layout-shift'].displayValue,
    lcpElement: (lhr.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet || '').slice(0, 160), unusedJs: lhr.audits['unused-javascript']?.displayValue, mainThread: lhr.audits['mainthread-work-breakdown']?.displayValue, a11yFails: Object.values(lhr.audits).filter((a) => a.score === 0 && lhr.categories.accessibility.auditRefs.some((x) => x.id === a.id)).map((a) => a.id) };
  console.log(name, JSON.stringify(out[name]));
}
fs.writeFileSync(process.env.OUT_FILE || 'out-local/lighthouse.json', JSON.stringify(out, null, 2));
await ctx.close();
if (process.env.CLEANUP === '1') { const left = await api.get('/api/plants'); for (const p of left.data || []) await api.delete(`/api/plants/${p.id}`); console.log('deleted', (left.data || []).length); } else console.log('plants kept for the next run');
process.exit(0);

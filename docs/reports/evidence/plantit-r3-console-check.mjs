import fs from 'node:fs';
import { chromium } from 'playwright';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';
const BASE = process.env.BASE || 'http://localhost:3999';
const UID = process.env.TEST_UID || 'round2-console';
const API_KEY = 'AIzaSyCL08dLFchZWMR5YbxNarVgmQoPWZIMQUE';
const SA = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/portfolio-ops/plantit-firebase-sa.json`, 'utf8'));
const fbApp = initializeApp({ credential: cert(SA) });
const custom = await getAuth(fbApp).createCustomToken(UID);
const r = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: custom, returnSecureToken: true });
const s = { idToken: r.data.idToken, refreshToken: r.data.refreshToken, expiresIn: Number(r.data.expiresIn) };
const browser = await chromium.launch({ headless: true });
const out = {};
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.name === 'phone', hasTouch: vp.name === 'phone', deviceScaleFactor: vp.name === 'phone' ? 3 : 1 });
  const page = await ctx.newPage();
  const msgs = []; const failed = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.push({ type: m.type(), text: m.text().slice(0, 200), url: page.url() }); });
  page.on('pageerror', (e) => msgs.push({ type: 'pageerror', text: String(e.message).slice(0, 200), url: page.url() }));
  page.on('response', (r) => { if (r.status() >= 400) failed.push({ status: r.status(), url: r.url().slice(0, 120) }); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
  await page.goto(`${BASE}/plants/whatever`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.evaluate(async ({ uid, apiKey, idToken, refreshToken, expiresIn }) => {
    const rec = { uid, email: `${uid}@example.test`, emailVerified: false, isAnonymous: false, providerData: [], stsTokenManager: { refreshToken, accessToken: idToken, expirationTime: Date.now() + expiresIn * 1000 - 60000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' };
    await new Promise((resolve, reject) => { const req = indexedDB.open('firebaseLocalStorageDb', 1); req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('firebaseLocalStorage')) db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); }; req.onerror = () => reject(req.error); req.onsuccess = () => { const db = req.result; const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: rec }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }; });
  }, { uid: UID, apiKey: API_KEY, ...s });
  for (const p of ['/', '/plants', '/add-plant', '/x/y', '/plant-details']) { await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2000); }
  out[vp.name] = { console: msgs, failedResponses: failed };
  await ctx.close();
}
await browser.close();
fs.writeFileSync(process.env.OUT_FILE || 'out-local/console-check.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
process.exit(0);

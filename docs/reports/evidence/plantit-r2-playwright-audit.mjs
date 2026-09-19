// Plant It round-2 audit (Playwright Chromium). BASE = the production-shaped local stack of fad7516 (real Firebase/Supabase/Pl@ntNet)
// or the live URL. Round-1 harness plus probes for every round-1 defect D1-D13, the Low confidence chip, a 70 h dry-out seed,
// button contrast and the API log (/__log on the local stack).
// Signs in as a throwaway Firebase user (custom token from the operator service account)
// by writing the Firebase Auth persistence record into IndexedDB, then walks stories S1-S10
// at 1440 px and 390 px, collecting console errors, network evidence, timings and screenshots.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import axios from 'axios';
import FormData from 'form-data';

const BASE = process.env.BASE || 'https://plantit.kalpkan.com';
const UID = process.env.TEST_UID || 'round2-test';
const API_KEY = 'AIzaSyCL08dLFchZWMR5YbxNarVgmQoPWZIMQUE'; // public web key (frontend/src/firebase.js)
const FIX = '/Users/kalp/projects/plantit/tests/fixtures/plants';
const OUT = process.env.OUT || path.resolve('out');
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const SA = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/portfolio-ops/plantit-firebase-sa.json`, 'utf8'));
const DB_URL = process.env.RTDB_URL || `https://${SA.project_id}-default-rtdb.firebaseio.com`;

const results = { base: BASE, uid: UID, ranAt: new Date().toISOString(), stories: {}, console: {}, notes: [] };
const note = (s) => { console.log(s); results.notes.push(s); };

const fbApp = initializeApp({ credential: cert(SA), databaseURL: DB_URL });
async function session() {
  const custom = await getAuth(fbApp).createCustomToken(UID);
  const r = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: custom, returnSecureToken: true });
  return { idToken: r.data.idToken, refreshToken: r.data.refreshToken, expiresIn: Number(r.data.expiresIn) };
}
async function injectAuth(page, s) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ uid, apiKey, idToken, refreshToken, expiresIn }) => {
    const rec = {
      uid, email: `${uid}@example.test`, emailVerified: false, isAnonymous: false, providerData: [],
      stsTokenManager: { refreshToken, accessToken: idToken, expirationTime: Date.now() + expiresIn * 1000 - 60000 },
      createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]',
    };
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('firebaseLocalStorage')) db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }); };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('firebaseLocalStorage', 'readwrite');
        tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: rec });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, { uid: UID, apiKey: API_KEY, ...s });
}

function watchConsole(page, bucket) {
  results.console[bucket] = results.console[bucket] || [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') results.console[bucket].push({ type: m.type(), text: m.text().slice(0, 400), url: page.url() }); });
  page.on('pageerror', (e) => results.console[bucket].push({ type: 'pageerror', text: String(e.message).slice(0, 400), url: page.url() }));
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.jpg`), type: 'jpeg', quality: 70, fullPage: false });
const contrastOf = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel); if (!el) return null;
  const cs = getComputedStyle(el);
  const parse = (c) => { const m = c.match(/[\d.]+/g) || []; return m.slice(0, 3).map(Number); };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  let bg = cs.backgroundImage !== 'none' ? (cs.backgroundImage.match(/rgb\([^)]*\)/g) || []) : [];
  const bgs = bg.length ? bg : [cs.backgroundColor];
  const fg = parse(cs.color);
  const ratios = bgs.map((b) => { const L1 = lum(fg), L2 = lum(parse(b)); return ((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)); });
  return { color: cs.color, backgrounds: bgs, minRatio: Math.round(Math.min(...ratios) * 100) / 100, disabled: el.matches(':disabled, .Mui-disabled'), opacity: cs.opacity };
}, selector);
const scrollWidth = (page) => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth }));

async function identify(page, file, label, opts = {}) {
  await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' });
  const reqs = [];
  const onReq = (r) => { if (r.url().includes('/api/identify')) reqs.push({ url: r.url(), headers: r.headers() }); };
  page.on('request', onReq);
  await page.setInputFiles('[data-testid="file-input"]', path.join(FIX, file));
  await page.waitForTimeout(400);
  const errBefore = await page.locator('.MuiAlert-message').allTextContents();
  const btn = page.locator('[data-testid="identify"]');
  const enabled = await btn.isEnabled();
  let ms = null; let resp = null; let after = null;
  if (enabled && !opts.noClick) {
    const t0 = Date.now();
    const respP = page.waitForResponse((r) => r.url().includes('/api/identify'), { timeout: 60000 }).catch(() => null);
    await btn.click();
    const r = await respP;
    if (r) { resp = { status: r.status(), body: await r.json().catch(() => null) }; }
    await Promise.race([page.waitForURL('**/plant-details', { timeout: 30000 }).catch(() => null), page.waitForSelector('.MuiAlert-standardError', { timeout: 30000 }).catch(() => null)]);
    await page.waitForTimeout(600);
    ms = Date.now() - t0;
    after = { url: page.url(), alerts: await page.locator('.MuiAlert-message').allTextContents(), text: (await page.locator('main, #root').first().innerText()).slice(0, 2500) };
  }
  page.off('request', onReq);
  await shot(page, label);
  return { file, enabled, errBefore, ms, requests: reqs.map((r) => ({ hasOpenAiHeader: Boolean(r.headers['x-openai-key']), openAiHeaderTail: r.headers['x-openai-key'] ? r.headers['x-openai-key'].slice(-4) : null })), resp: resp && { status: resp.status, demo: resp.body?.demo, reason: resp.body?.reason, top1: resp.body?.candidates?.[0]?.species?.scientificNameWithoutAuthor, score: resp.body?.candidates?.[0]?.score, nCandidates: resp.body?.candidates?.length, careSource: resp.body?.careSource, careReason: resp.body?.careReason, openaiError: resp.body?.openaiError, savedPlantId: resp.body?.savedPlant?.id, imageUrl: resp.body?.savedPlant?.imageUrl, threshold: resp.body?.careInstructions?.soilMoisture?.wateringThreshold, care: resp.body?.careInstructions }, after };
}

async function run() {
  const s = await session();
  const api = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${s.idToken}` }, validateStatus: () => true, timeout: 60000 });
  const browser = await chromium.launch({ headless: true });

  for (const vp of [{ name: 'desktop', width: 1440, height: 900, mobile: false }, { name: 'phone', width: 390, height: 844, mobile: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.mobile ? 3 : 1, isMobile: vp.mobile, hasTouch: vp.mobile, colorScheme: vp.mobile ? 'light' : 'dark' });
    const page = await ctx.newPage();
    watchConsole(page, vp.name);
    const R = (results.stories[vp.name] = {});

    // ---- S10a: signed-out behaviour -------------------------------------------------
    await page.goto(`${BASE}/plants`, { waitUntil: 'networkidle' });
    R.signedOutPlants = { url: page.url(), sw: await scrollWidth(page) };
    await page.goto(`${BASE}/plants/whatever`, { waitUntil: 'networkidle' });
    R.signedOutUnknown = { url: page.url(), bodyText: (await page.locator('#root').innerText()).slice(0, 200) };
    await shot(page, `${vp.name}-signed-out-unknown-route`);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await shot(page, `${vp.name}-login`);
    R.login = { sw: await scrollWidth(page), button: await page.getByRole('button', { name: /sign in with google/i }).count() };

    // ---- S1: signed-in home + nav --------------------------------------------------
    await injectAuth(page, s);
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    R.home = { url: page.url(), sw: await scrollWidth(page), text: (await page.locator('#root').innerText()).slice(0, 600) };
    R.home.addNewPlant = await page.getByRole('button', { name: /add new plant/i }).count();
    R.home.viewPlants = await page.getByRole('button', { name: /view plants/i }).count();
    R.home.navLinks = await page.locator('header button').allTextContents();
    if (vp.mobile) {
      const menu = page.getByRole('button', { name: /open menu/i });
      R.home.menuButton = await menu.count();
      if (R.home.menuButton) { await menu.click(); await page.waitForTimeout(500); R.home.drawerItems = await page.locator('.MuiDrawer-paper').innerText(); await shot(page, `${vp.name}-drawer`); await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    }
    await shot(page, `${vp.name}-home`);

    // ---- S2/S3: identify a good photo ----------------------------------------------
    if (!vp.mobile) {
      R.identifyGood = await identify(page, 'monstera-deliciosa.jpg', `${vp.name}-results-monstera`);
      if (R.identifyGood.resp?.imageUrl) { const im = await axios.get(R.identifyGood.resp.imageUrl, { validateStatus: () => true, responseType: 'arraybuffer' }); R.identifyGood.imageFetch = { status: im.status, type: im.headers['content-type'], bytes: im.data.length }; }
      R.identifyGood.careSections = await page.locator('[data-testid="care-list"] .MuiListItemText-primary').allTextContents();
      R.identifyGood.careTexts = await page.locator('[data-testid="care-list"] .MuiListItemText-secondary').allTextContents();
      R.identifyGood.sourceLine = await page.locator('.MuiTypography-caption').allTextContents();
      R.identifyGood.resultImgNatural = await page.evaluate(() => { const i = document.querySelector('img[alt="Uploaded plant"]'); return i ? { complete: i.complete, w: i.naturalWidth, src: i.src.slice(0, 80) } : null; });
      // ---- S2 low-confidence photo (10 %) ----
      R.identifyLow = await identify(page, 'monstera-deliciosa-2.jpg', `${vp.name}-results-lowconf`);
      R.identifyLow.warningAlerts = await page.locator('.MuiAlert-root').allTextContents();
      R.identifyLow.candidatesShown = await page.locator('#root').innerText().then((t) => (t.match(/\d+ ?%/g) || []));
      R.identifyLow.lowNotice = await page.locator('[data-testid="low-confidence-notice"]').allTextContents();
      R.identifyLow.otherCandidates = await page.locator('[data-testid="other-candidates"] li').allTextContents();
      R.identifyLow.demoNotice = await page.locator('[data-testid="demo-notice"]').count();
      R.identifyLow.sw = await scrollWidth(page);
      // ---- S3: ZZ and snake plant care via identify (uses 2 Pl@ntNet calls) ----
      R.identifyZZ = await identify(page, 'zamioculcas-zamiifolia.jpg', `${vp.name}-results-zz`);
      R.identifyZZ.careTexts = await page.locator('[data-testid="care-list"] .MuiListItemText-secondary').allTextContents();
      R.identifyZZ.sourceLine = await page.locator('[data-testid="care-source"]').allTextContents();
      R.careApi = {};
      for (const sp of ['Dracaena trifasciata', 'Sansevieria trifasciata', 'Zamioculcas zamiifolia', 'Spathiphyllum wallisii', 'Crassula ovata', 'Aloe vera', 'Monstera deliciosa', 'Pilea peperomioides']) { const c = await api.get(`/api/plant/${encodeURIComponent(sp)}/care`); R.careApi[sp] = { source: c.data.source, threshold: c.data.soilMoisture?.wateringThreshold, watering: String(c.data.watering).slice(0, 70), sections: ['watering','light','temperature','humidity','soil','fertilizer'].filter((k) => c.data[k] && String(c.data[k]).trim()).length }; }
      // ---- S4: mug, too-small, text ----
      const plantsBeforeMug = (await api.get('/api/plants')).data.length;
      R.mug = await identify(page, 'not-a-plant-mug.jpg', `${vp.name}-mug`);
      R.mug.plantsBefore = plantsBeforeMug; R.mug.plantsAfter = (await api.get('/api/plants')).data.length; R.mug.errorAlert = await page.locator('.MuiAlert-standardError').allTextContents(); R.mug.url = page.url();
      R.tooSmall = await identify(page, 'too-small.jpg', `${vp.name}-too-small`);
      R.textFile = await identify(page, 'not-an-image.txt', `${vp.name}-text-file`);
      R.textFile.fileInputAccept = await page.locator('[data-testid="file-input"]').getAttribute('accept');
      R.textFile.dropError = await page.locator('.MuiAlert-message').allTextContents();
      await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' });
      R.contrast = { identifyDisabled: await contrastOf(page, '[data-testid="identify"]') };
      await page.setInputFiles('[data-testid="file-input"]', path.join(FIX, 'aloe-vera.jpg')); await page.waitForTimeout(300);
      R.contrast.identifyEnabled = await contrastOf(page, '[data-testid="identify"]');
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); R.contrast.addNewPlant = await contrastOf(page, 'button.MuiButton-contained');
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); R.contrast.signIn = await contrastOf(page, 'button.MuiButton-contained'); R.login.logoImg = await page.evaluate(() => [...document.querySelectorAll('img, svg')].map((e) => ({ tag: e.tagName, src: (e.getAttribute('src') || '').slice(0, 60), w: e.getBoundingClientRect().width })));
    } else {
      R.identifyGood = await identify(page, 'ficus-lyrata.jpg', `${vp.name}-results-ficus`);
      R.identifyGood.sw = await scrollWidth(page);
      R.identifyGood.careSections = await page.locator('[data-testid="care-list"] .MuiListItemText-primary').allTextContents();
      R.addPlantSw = await (async () => { await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' }); return scrollWidth(page); })();
    }

    if (!vp.mobile) {
      // 70 h dry-out seed: a copy of the newest plant, lastWatered 70 h ago, written straight to Firestore (no photo -> placeholder).
      const src = (await api.get('/api/plants')).data[0];
      const fsdb = getFirestore(fbApp); const ref = fsdb.collection(`users/${UID}/plants`).doc();
      const ago = new Date(Date.now() - 70 * 3600 * 1000);
      await ref.set({ ...src, id: ref.id, imageUrl: null, photoPath: null, species: 'Spathiphyllum wallisii', commonName: 'Peace lily (dry-out seed)', minVWC: 5, maxVWC: 28, optimalVWC: 20, wateringThreshold: 28, currentVWC: 28, createdAt: ago, lastWatered: ago, deviceConnected: false, demo: false, lowConfidence: false });
      const dev = await api.get(`/api/plants/${ref.id}/device`);
      R.dryout = { id: ref.id, mode: dev.data.mode, currentVWC: dev.data.reading.currentVWC, needsWater: dev.data.reading.needsWater, min: dev.data.reading.minVWC, max: dev.data.reading.maxVWC, lastWatered: dev.data.reading.lastWatered };
      R.apiNope = (await axios.get(`${BASE}/api/nope`, { validateStatus: () => true })).data;
      R.health = (await axios.get(`${BASE}/api/health`)).data;
    }
    // ---- S5: My Plants ---------------------------------------------------------------
    await page.goto(`${BASE}/plants`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const cards = page.locator('[data-testid="plant-card"]');
    R.plants = { count: await cards.count(), sw: await scrollWidth(page) };
    R.plants.cardTexts = await cards.allInnerTexts();
    R.plants.images = await page.evaluate(() => [...document.querySelectorAll('[data-testid="plant-card"] img')].map((i) => ({ complete: i.complete, w: i.naturalWidth, alt: i.alt })));
    R.plants.placeholders = await page.locator('[data-testid="photo-unavailable"], [data-testid="photo-none"]').count();
    R.plants.lowConfidenceChips = await page.locator('[data-testid="plant-card"] .MuiChip-label', { hasText: 'Low confidence' }).count();
    R.plants.demoChips = await page.locator('[data-testid="plant-card"] .MuiChip-label', { hasText: 'Demo result' }).count();
    R.plants.moistureOnCards = (R.plants.cardTexts.join(' ').match(/\d+ ?%/g) || []).length;
    await shot(page, `${vp.name}-plants`);
    const t0 = Date.now();
    await cards.first().click();
    await page.waitForSelector('[data-testid="sensor-panel"]', { timeout: 10000 });
    R.dialog = { openMs: Date.now() - t0 };
    await page.waitForTimeout(500);
    R.dialog.text = await page.locator('[role="dialog"]').innerText();
    R.dialog.sensor = await page.locator('[data-testid="sensor-panel"]').innerText();
    R.dialog.sw = await scrollWidth(page);
    R.dialog.layout = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const img = d && d.querySelector('img'); const sp = d && d.querySelector('[data-testid="sensor-panel"]'); const w = d && d.querySelector('[data-testid="water-now"]'); const box = (e) => e ? { top: Math.round(e.getBoundingClientRect().top), height: Math.round(e.getBoundingClientRect().height) } : null; return { viewportH: innerHeight, dialogScrollH: d ? d.scrollHeight : null, img: box(img), sensorPanel: box(sp), waterNow: box(w), waterNowVisibleWithoutScroll: w ? w.getBoundingClientRect().top < innerHeight : null }; });
    R.dialog.chips = await page.locator('[role="dialog"] .MuiChip-label').allTextContents();
    R.dialog.waterNowContrast = await contrastOf(page, '[data-testid="water-now"]');
    R.dialog.dialogScroll = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? { sw: d.scrollWidth, cw: d.clientWidth } : null; });
    await shot(page, `${vp.name}-dialog`);
    // device reading via API for the first card's plant
    const plantsApi = await api.get('/api/plants');
    const first = plantsApi.data[0];
    const dev = await api.get(`/api/plants/${first.id}/device`);
    R.dialog.apiReading = { mode: dev.data.mode, currentVWC: dev.data.reading.currentVWC, min: dev.data.reading.minVWC, max: dev.data.reading.maxVWC, threshold: dev.data.reading.wateringThreshold, inRange: dev.data.reading.currentVWC >= dev.data.reading.minVWC && dev.data.reading.currentVWC <= dev.data.reading.maxVWC };

    // ---- S6: Water now ---------------------------------------------------------------
    await page.evaluate(() => { const el = document.querySelector('[data-testid="sensor-panel"]'); el.dataset.marker = 'before-water'; });
    const waterRespP = page.waitForResponse((r) => r.url().includes('/water') && r.request().method() === 'POST', { timeout: 20000 });
    const navs = []; page.on('framenavigated', (f) => navs.push(f.url()));
    await page.locator('[data-testid="water-now"]').click();
    const wr = await waterRespP; const wb = await wr.json();
    await page.waitForTimeout(1200);
    R.water = { status: wr.status(), ok: wb.ok, mode: wb.mode, current: wb.reading.currentVWC, max: wb.reading.maxVWC, eventSource: wb.event?.source, vwcBefore: wb.event?.vwcBefore, vwcAfter: wb.event?.vwcAfter, stillMounted: await page.evaluate(() => document.querySelector('[data-testid="sensor-panel"]')?.dataset.marker === 'before-water'), dialogOpen: await page.locator('[role="dialog"]').count(), reloaded: navs.length, sensorText: await page.locator('[data-testid="sensor-panel"]').innerText() };
    await shot(page, `${vp.name}-watered`);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
    await page.locator('[data-testid="plant-card"]').first().click(); await page.waitForSelector('[data-testid="sensor-panel"]'); await page.waitForTimeout(800);
    R.water.afterReload = await page.locator('[data-testid="sensor-panel"]').innerText();
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);

    // ---- S8: Connect ESP8266 (hardware required) ---------------------------------------
    await page.locator('[data-testid="plant-card"]').first().click(); await page.waitForSelector('[data-testid="sensor-panel"]');
    const hwBtn = page.getByRole('button', { name: /connect esp8266/i });
    R.hardware = { buttonText: await hwBtn.innerText() };
    await hwBtn.click(); await page.waitForTimeout(400);
    const hwDialog = page.locator('[role="dialog"]').last();
    R.hardware.dialogText = await hwDialog.innerText();
    await hwDialog.getByLabel(/ip address/i).fill('192.168.1.50');
    const cRespP = page.waitForResponse((r) => r.url().includes('connect-device'), { timeout: 20000 });
    await hwDialog.getByRole('button', { name: /send plant settings/i }).click();
    const cr = await cRespP; await page.waitForTimeout(500);
    R.hardware.privateIp = { status: cr.status(), body: await cr.json().catch(() => null), inline: await hwDialog.locator('.MuiAlert-root').allTextContents(), snackbar: await page.locator('.MuiSnackbar-root').allTextContents() };
    await shot(page, `${vp.name}-hardware-private-ip`);
    await hwDialog.getByLabel(/ip address/i).fill('8.8.8.8');
    const cRespP2 = page.waitForResponse((r) => r.url().includes('connect-device'), { timeout: 20000 });
    await hwDialog.getByRole('button', { name: /send plant settings/i }).click();
    const cr2 = await cRespP2; await page.waitForTimeout(500);
    R.hardware.publicIp = { status: cr2.status(), body: await cr2.json().catch(() => null), inline: await hwDialog.locator('.MuiAlert-root').allTextContents() };
    await hwDialog.getByRole('button', { name: /cancel/i }).click(); await page.waitForTimeout(400);
    R.hardware.afterCancelSensor = await page.locator('[data-testid="sensor-panel"]').innerText().catch(() => null);
    R.hardware.badPortApi = (await api.post(`/api/plants/${first.id}/connect-device`, { deviceIP: '192.168.1.50', devicePort: 99999 })).data;
    R.hardware.moistureNoSecret = (await axios.get(`${BASE}/api/plants/${first.id}/moisture/${UID}`, { validateStatus: () => true })).status;
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);

    // ---- S7: delete via UI -------------------------------------------------------------
    const before = await api.get('/api/plants');
    const victim = before.data[0];
    await page.locator('[data-testid="plant-card"]').first().click(); await page.waitForSelector('[data-testid="sensor-panel"]');
    await page.getByRole('button', { name: /delete plant/i }).click(); await page.waitForTimeout(400);
    const delRespP = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes('/api/plants/'), { timeout: 20000 });
    await page.locator('[role="dialog"]').last().getByRole('button', { name: /^delete$/i }).click();
    const dr = await delRespP; await page.waitForTimeout(1500);
    R.delete = { status: dr.status(), body: await dr.json().catch(() => null), cardsAfter: await page.locator('[data-testid="plant-card"]').count(), cardsBefore: before.data.length, snackbar: await page.locator('.MuiSnackbar-root').allTextContents(), victimId: victim.id, victimImage: victim.imageUrl };
    await shot(page, `${vp.name}-deleted`);
    if (victim.imageUrl) R.delete.imageAfter = (await axios.get(victim.imageUrl, { validateStatus: () => true })).status;
    const fsDoc = await getFirestore(fbApp).doc(`users/${UID}/plants/${victim.id}`).get();
    const fsEvents = await getFirestore(fbApp).collection(`users/${UID}/plants/${victim.id}/events`).get();
    const rt = await getDatabase(fbApp).ref(`plants/${UID}/${victim.id}`).get();
    R.delete.firestoreDocExists = fsDoc.exists; R.delete.eventsLeft = fsEvents.size; R.delete.rtdbExists = rt.exists();
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
    R.delete.cardsAfterReload = await page.locator('[data-testid="plant-card"]').count();

    // ---- S9: BYOK on desktop only ------------------------------------------------------
    if (!vp.mobile) {
      await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' });
      await page.locator('[data-testid="openai-key-section"] .MuiAccordionSummary-root').click(); await page.waitForTimeout(400);
      await page.locator('[data-testid="openai-key-input"]').fill('sk-invalidkeyabcdefghijklmnop');
      await page.locator('[data-testid="openai-key-save"]').click(); await page.waitForTimeout(300);
      R.byok = { status: await page.locator('[data-testid="openai-key-status"]').innerText().catch(() => null), message: await page.locator('[data-testid="openai-key-message"]').innerText().catch(() => null), stored: await page.evaluate(() => localStorage.getItem('plantit.openaiKey')) };
      await shot(page, `${vp.name}-byok-saved`);
      R.byok.identify = await identify(page, 'aloe-vera.jpg', `${vp.name}-byok-results`);
      R.byok.identify.alerts = await page.locator('.MuiAlert-root').allTextContents();
      R.byok.identify.sourceLine = await page.locator('[data-testid="care-source"]').allTextContents();
      R.byok.identify.keyNotice = await page.locator('[data-testid="openai-error-notice"]').allTextContents();
      if (BASE.includes('localhost')) { const lg = await axios.get(`${BASE}/__log`, { validateStatus: () => true }); R.byok.serverLog = { lines: lg.data.split('\n').filter(Boolean).length, skCount: (lg.data.match(/sk-/g) || []).length, keyFragment: lg.data.includes('mnop') || lg.data.includes('sk-inval'), tail: lg.data.split('\n').filter((l) => /OpenAI/.test(l)).slice(-2) }; }
      await page.goto(`${BASE}/add-plant`, { waitUntil: 'networkidle' });
      await page.locator('[data-testid="openai-key-section"] .MuiAccordionSummary-root').click(); await page.waitForTimeout(300);
      await page.locator('[data-testid="openai-key-remove"]').click(); await page.waitForTimeout(300);
      R.byok.afterRemove = await page.evaluate(() => localStorage.getItem('plantit.openaiKey'));
      await page.locator('[data-testid="openai-key-input"]').fill('sk-invalidkeyabcdefghijklmnop'); await page.locator('[data-testid="openai-key-save"]').click(); await page.waitForTimeout(300);
      R.byok.reSaved = await page.evaluate(() => localStorage.getItem('plantit.openaiKey'));
    }

    // ---- S10: routes signed in, then logout --------------------------------------------
    R.routes = {};
    for (const p of ['/plants/whatever', '/x/y', '/plant-details']) {
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
      R.routes[p] = { finalUrl: page.url(), text: (await page.locator('#root').innerText()).replace(/\s+/g, ' ').slice(0, 200), sw: await scrollWidth(page), missingPath: await page.locator('[data-testid="missing-path"]').allTextContents(), homeButtons: await page.getByRole('link', { name: /^home$/i }).count() };
      if (p === '/plants/whatever') await shot(page, `${vp.name}-unknown-route-signed-in`);
    }
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    if (vp.mobile) { await page.getByRole('button', { name: /open menu/i }).click(); await page.waitForTimeout(400); await page.getByRole('button', { name: /logout/i }).click(); } else { await page.getByRole('button', { name: /logout/i }).click(); }
    await page.waitForURL('**/login', { timeout: 15000 }).catch(() => null); await page.waitForTimeout(800);
    R.logout = { url: page.url(), localStorageKey: await page.evaluate(() => localStorage.getItem('plantit.openaiKey')), localStorageKeys: await page.evaluate(() => Object.keys(localStorage)) };
    await page.goBack({ waitUntil: 'networkidle' }).catch(() => null); await page.waitForTimeout(800);
    R.logout.afterBack = { url: page.url(), text: (await page.locator('#root').innerText()).replace(/\s+/g, ' ').slice(0, 120) };
    await ctx.close();
  }

  // clean up any plants left under the test uid (API)
  const left = await api.get('/api/plants');
  for (const p of left.data || []) await api.delete(`/api/plants/${p.id}`);
  results.cleanup = { deleted: (left.data || []).length };
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(results, null, 2));
  console.log('written', path.join(OUT, 'audit.json'));
  process.exit(0);
}
run().catch((e) => { console.error('audit failed:', e); fs.writeFileSync(path.join(OUT, 'audit-partial.json'), JSON.stringify(results, null, 2)); process.exit(1); });

// Round-2 production-shaped local stack for Plant It (fad7516):
// the CRA production build served with vercel.json's rewrites + the REAL Express app with the REAL
// Firebase Admin SDK (Auth verification, Firestore, RTDB), the REAL Supabase bucket and the REAL
// Pl@ntNet key. The only substitution: the `spend` collection (the app's 50/day counter) is served
// from memory so this run does not consume production's daily budget (Pl@ntNet's own 500/day still applies).
require('/Users/kalp/projects/plantit/node_modules/dotenv').config({ path: '/Users/kalp/projects/plantit/.env', quiet: true });
const path = require('path');
const express = require('/Users/kalp/projects/plantit/node_modules/express');
const { createApp } = require('/Users/kalp/projects/plantit/backend/src/app');
const { getFirebase } = require('/Users/kalp/projects/plantit/backend/src/firebase');
const { createMemoryDb } = require('/Users/kalp/projects/plantit/backend/src/spendGuard');

const real = getFirebase(process.env);
const mem = createMemoryDb();
const db = new Proxy(real.db, {
  get(target, prop) {
    if (prop === 'collection') return (name) => (name === 'spend' ? mem.collection(name) : target.collection(name));
    if (prop === 'runTransaction') return (fn) => mem.runTransaction(fn); // only the spend guard uses transactions
    const v = target[prop];
    return typeof v === 'function' ? v.bind(target) : v;
  },
});
const firebase = { ...real, db };
const env = { ...process.env, PLANTNET_DAILY_LIMIT: '100', VERCEL: '1' };
const logLines = [];
const log = {
  warn: (...a) => { logLines.push('WARN ' + a.map(String).join(' ')); },
  error: (...a) => { const line = a.map(String).join(' '); logLines.push('ERROR ' + line); console.error('[api]', line.slice(0, 200)); },
  log: (...a) => { logLines.push('LOG ' + a.map(String).join(' ')); },
  info: (...a) => { logLines.push('INFO ' + a.map(String).join(' ')); },
};
const api = createApp({ firebase, env, log });
const app = express();
app.use(require('/Users/kalp/projects/plantit/frontend/node_modules/compression')());
app.use((req, res, next) => (req.path.startsWith('/api/') || req.path === '/api' ? api(req, res, next) : next()));
// vercel.json's PostHog reverse-proxy rewrites, so the page behaves exactly like production (analytics + replay load).
const axios = require('/Users/kalp/projects/plantit/node_modules/axios');
app.use('/ingest', async (req, res) => {
  const target = req.path.startsWith('/static/') ? `https://us-assets.i.posthog.com${req.path}` : `https://us.i.posthog.com${req.path}`;
  try {
    const up = await axios({ method: req.method, url: target, params: req.query, data: req.method === 'GET' ? undefined : req, headers: { 'content-type': req.get('content-type') || '', 'user-agent': req.get('user-agent') || '' }, responseType: 'stream', validateStatus: () => true, maxRedirects: 0 });
    res.status(up.status); for (const [k, v] of Object.entries(up.headers)) if (!/^(transfer-encoding|content-encoding|connection)$/i.test(k)) res.setHeader(k, v);
    up.data.pipe(res);
  } catch (e) { res.status(502).end(); }
});
app.get('/__log', (req, res) => res.type('text/plain').send(logLines.join('\n')));
const build = '/Users/kalp/projects/plantit/frontend/build';
app.use('/static', express.static(path.join(build, 'static'), { immutable: true, maxAge: '1y' }));
app.use(express.static(build));
app.get('*', (req, res) => res.sendFile(path.join(build, 'index.html')));
app.listen(Number(process.env.PORT) || 3999, () => console.log('r2 local stack on', process.env.PORT || 3999));

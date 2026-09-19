// Production-shaped local stack: the CRA build served with the same rewrites as vercel.json, plus the real Express app
// (in-memory Firestore, real providers/Pl@ntNet from the env). Mirrors what Vercel runs, minus the CDN.
const path = require('path');
const express = require('express');
const { createApp } = require('/Users/kalp/projects/plantit/backend/src/app');
function fakeFirebase() {
  const store = new Map(); let autoId = 0;
  const docRef = (p) => ({ id: p.split('/').pop(), path: p,
    async get() { const d = store.get(p); return { id: p.split('/').pop(), exists: d !== undefined, data: () => (d ? { ...d } : undefined) }; },
    async set(data) { store.set(p, { ...data }); }, async update(data) { store.set(p, { ...(store.get(p) || {}), ...data }); }, async delete() { store.delete(p); },
    collection: (name) => colRef(`${p}/${name}`) });
  const colRef = (p) => { const list = () => [...store.entries()].filter(([k]) => k.startsWith(`${p}/`) && k.slice(p.length + 1).indexOf('/') === -1).map(([k, d]) => ({ id: k.split('/').pop(), data: () => ({ ...d }) }));
    const q = { async get() { return { docs: list() }; }, orderBy: () => q, limit: () => q };
    return { doc: (id) => docRef(`${p}/${id || `auto${++autoId}`}`), async add(d) { const r = docRef(`${p}/auto${++autoId}`); await r.set(d); return r; }, async get() { return { docs: list() }; }, orderBy: () => q, limit: () => q }; };
  return { db: { store, collection: (n) => colRef(n), async recursiveDelete(ref) { for (const k of [...store.keys()]) if (k === ref.path || k.startsWith(`${ref.path}/`)) store.delete(k); }, async runTransaction(fn) { return fn({ get: (r) => r.get(), set: async (r, d) => r.update(d) }); } },
    rtdb: { ref: () => ({ set: async () => {}, update: async () => {}, remove: async () => {} }) },
    auth: { verifyIdToken: async () => ({ uid: 'local-stack' }) },
    Timestamp: { fromMillis: (ms) => ({ toMillis: () => ms }) }, FieldValue: { delete: () => null } };
}
const env = { PLANTNET_API_KEY: process.env.PLANTNET_API_KEY, PLANTNET_DAILY_LIMIT: '100', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', VERCEL: '1' };
const logLines = [];
const log = { warn() {}, error: (...a) => { const line = a.map(String).join(' '); logLines.push(line); console.error('[api]', line.slice(0, 160)); } };
const api = createApp({ firebase: fakeFirebase(), env, log });
const app = express();
app.use(require('/Users/kalp/projects/plantit/frontend/node_modules/compression')());
app.use((req, res, next) => (req.path.startsWith('/api/') || req.path === '/api' ? api(req, res, next) : next()));
app.get('/__log', (req, res) => res.type('text/plain').send(logLines.join('\n')));
const build = '/Users/kalp/projects/plantit/frontend/build';
app.use('/static', express.static(path.join(build, 'static'), { immutable: true, maxAge: '1y' }));
app.use(express.static(build));
app.get('*', (req, res) => res.sendFile(path.join(build, 'index.html')));
app.listen(Number(process.env.PORT) || 3999, () => console.log('local stack on', process.env.PORT || 3999));

import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app'; import { getAuth } from 'firebase-admin/auth'; import { getFirestore } from 'firebase-admin/firestore'; import { getDatabase } from 'firebase-admin/database'; import axios from 'axios';
const BASE = 'https://plantit.kalpkan.com'; const API_KEY = 'AIzaSyCL08dLFchZWMR5YbxNarVgmQoPWZIMQUE';
const SA = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/portfolio-ops/plantit-firebase-sa.json`, 'utf8'));
const fbApp = initializeApp({ credential: cert(SA), databaseURL: `https://${SA.project_id}-default-rtdb.firebaseio.com` });
const uids = (process.env.UIDS || 'round3-test,round3-local,round3-limit,round3-console,round3-lh,round3-byok,corpus-r3,corpus-test').split(',');
for (const uid of uids) {
  const custom = await getAuth(fbApp).createCustomToken(uid);
  const r = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: custom, returnSecureToken: true });
  const api = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${r.data.idToken}` }, validateStatus: () => true });
  const list = (await api.get('/api/plants')).data || [];
  for (const p of list) await api.delete(`/api/plants/${p.id}`);
  const fsLeft = (await getFirestore(fbApp).collection(`users/${uid}/plants`).get()).size;
  const rt = await getDatabase(fbApp).ref(`plants/${uid}`).get();
  console.log(uid, 'deleted', list.length, 'firestoreLeft', fsLeft, 'rtdb', rt.exists());
}
process.exit(0);

# Plant It — consumer-grade spec and test corpus — 2026-09-19

Live URL: https://plantit.kalpkan.com (fallback alias `https://plantit-kappa.vercel.app`; never `plantit.vercel.app`, a stranger's project) · Repo: `KalpKan/PlantWater` (local `~/projects/plantit`) · Vercel project `plantit` (`prj_d2ATAx5QfXegcaCY2ZB8KGttDDuX`, team `kks-projects-2edcb11a`; CRA static build + one Express function `api/index.js`, auto-deploys from `main`) · Database: Firebase **Spark** `plant-it-5e2fc` (Auth, Firestore `users/{uid}/plants`, RTDB mirror; never Blaze) + Supabase Project B Storage bucket `plantit-photos` · Health route: `https://plantit.kalpkan.com/api/health` → `{ ok, service: "plantit", firestore, photos, identification: "plantnet", care: "bundled", careWithVisitorKey: "openai", image, spend }`

Written by the SPEC agent of workflow T5.a+b (round 0). It says what the app must do (quoted from its own docs), the user stories a TEST agent exercises, the measurable bar for each, and the labelled test corpus (created today, committed to the project repo, with a live baseline). Section 6 records what was measured today so the fixer knows where the gaps are. Section 7 records T2.2, which this agent implemented alongside the spec.

Kalp's focus for this project: **"Plant It is not working as intended."** Consumer grade = a stranger can sign in, upload a plant photo, get a correct species and sensible care guidance in < 10 s, add the plant, see moisture (simulated device) and trigger watering, and never hit a dead route or console error; hardware-only features clearly labelled.

Standing constraints for every fix: $0 (Firebase stays Spark, Vercel Hobby, exactly two Supabase projects), deployable exactly as hosted now (CRA static + one Express function), **no `OPENAI_API_KEY` on the server ever** (Kalp, 2026-09-18: no paid keys in public demos; the visitor's own key is the only OpenAI path), never commit secrets.

## 1. What the project is supposed to do (quoted from its own docs)

`README.md` (repo root, as of `e67d21f` plus today's T2.2 edits):

> Identify a plant from a photo, get a care guide, and keep an eye on its soil moisture. Live at **https://plantit.kalpkan.com** (part of kalpkan.com).
>
> No hardware is needed to use it: every plant gets a **simulated moisture sensor** that dries out over about three days and a **Water now** button that logs a real watering event. The ESP8266 watering device in `arduino/` is optional and, as of now, does not report readings back to the app …
>
> 1. **Sign in with Google** (Firebase Authentication).
> 2. **Upload a photo** (JPEG/PNG/WebP, 10 KB to 4 MB). The API shrinks it, identifies the species with Pl@ntNet when a key is configured, and stores the photo in Supabase Storage.
> 3. **Care guide**: five common houseplants are answered from a built-in library; anything else gets sensible general guidance. **Optional, bring your own key**: under *Add Plant* there is a "Use your own OpenAI key" field. A key typed there is kept only in your browser's localStorage, sent with each identification request in an `X-OpenAI-Key` header, used for that one OpenAI call, and never stored or logged by the server.
> 4. **My Plants**: each plant shows its soil moisture, a watering threshold, a Water now button and the last waterings. Readings are labelled **Simulated sensor** until a real ESP8266 posts a reading, then **Live sensor**.
> 5. **Hardware (optional, not finished)**: "Connect ESP8266 (hardware required)" sends the plant's moisture targets and a device secret to an ESP8266 on your home network (it only works when the API runs on your computer, not from the hosted site). **The firmware does not yet send readings back** …

`README.md`, "Demo mode, and why it exists":

> Without a Pl@ntNet key the app still identifies plants: the result is drawn from a bundled list of five common houseplants (the same photo always gives the same answer) and is clearly marked **Demo result** in the app and `demo: true` in the API.

`frontend/src/components/Home.js` (what the visitor reads after signing in):

> Your personal plant identification and care assistant. Upload a photo to identify a plant, get care instructions, and keep an eye on its soil moisture. No hardware needed: every plant gets a simulated sensor you can water; a real ESP8266 takes over when you connect one. … 1. Upload … 2. Identify: Our AI will analyze the image and identify the plant species. 3. Care and water: Get care instructions, watch the soil moisture (simulated until an ESP8266 reports), and press Water now.

`docs/hosting-plan.md` §1 row (portfolio repo):

> **PlantWater / "Plant It"** | React 18 CRA + MUI / Node Express / ESP8266 firmware | Firebase (Firestore, RTDB, Storage, Auth) | Pl@ntNet API + OpenAI API (HTTP only) | Abandoned mid-deploy (Jun 2025); broken `.firebaserc`; half needs physical hardware | Static frontend + Node API (serverless is fine, requests are one-off)

Routes that exist (`backend/src/app.js`): `GET /api/health`; `POST /api/identify` (multipart `image`, optional `X-OpenAI-Key`); `GET /api/plant/:species/care`; `GET /api/plants`; `DELETE /api/plants/:id`; `GET /api/plants/:id/device`; `POST /api/plants/:id/water`; firmware-only `POST /api/plants/:id/moisture` and `GET /api/plants/:id/moisture/:userId` (need `X-Device-Secret`, 403 otherwise); hardware-only `POST /api/plants/:id/connect-device` (502 `hardwareRequired` on Vercel), `POST .../disconnect-device`, `GET /api/discover-devices`; anything else under `/api` → 404 JSON. Frontend routes (`App.js`): `/login`, `/`, `/plants`, `/add-plant`, `/plant-details` (private; unauthenticated → `/login`); every other path is served `index.html` by `vercel.json`.

## 2. User stories (the TEST agent exercises every one in a real browser at 1440 px and 390 px, plus the corpus script)

| # | Story |
|---|---|
| S1 | As a visitor I open https://plantit.kalpkan.com, click **Sign in with Google**, pick an account, and I see the Home page ("Welcome to Plant It") with **Add New Plant** and **View Plants**, no console errors, and the nav shows Home / My Plants / Add Plant / Logout (a menu button at 390 px). |
| S2 | As a visitor I open **Add Plant**, drop or pick one of the corpus photos, press **Identify Plant**, and within 10 s I see the results page with the correct species (scientific + common name, family, confidence), the photo I uploaded, and "Saved to your collection". |
| S3 | As a visitor I read the **Care Instructions** on that page and I see six sections (Watering, Light, Temperature, Humidity, Soil, Fertilizer) plus soil-moisture targets that make sense for that plant (a snake plant or jade is told to let the soil dry out; a peace lily or fern is told to keep it moist), and a one-line note saying where the guide came from. |
| S4 | As a visitor I upload something that is **not a plant** (the coffee mug), a **too-small** image, or a **text file**, and I see a clear, specific message ("doesn't look like a plant", "too small", "only images"), nothing is added to My Plants, and nothing errors in the console. |
| S5 | As a visitor I open **My Plants** and I see a card per plant (photo, species, common name, family, "Simulated sensor" chip, "Demo result" chip only when it really was demo); clicking a card opens the detail dialog with the photo, care guide and a **Soil moisture** panel showing a percentage, the threshold, "last watered", and the simulated-sensor explanation. |
| S6 | As a visitor I press **Water now** in that dialog and, without the dialog closing or the page reloading, I see the reading jump to the plant's maximum, "last watered" become "1 min ago", and a "Watered (simulated)" line appear in the log; reopening the dialog or reloading the page shows the same state, and the reading has dropped a little when I come back hours later (the 72 h dry-out curve). |
| S7 | As a visitor I press **Delete Plant**, confirm, and I see the card disappear with a toast; the photo URL no longer serves the image and the plant does not reappear after reload. |
| S8 | As a visitor I open **Connect ESP8266 (hardware required)** on the hosted site and I see it labelled hardware-required with an explanation; entering a private IP and pressing send shows the "needs a real device / run the API locally" message (502 `hardwareRequired`) rather than a spinner, a crash or a fake success; a public IP or a bad port is refused with a specific message. The simulated sensor keeps working afterwards. |
| S9 | As a visitor I expand **Use your own OpenAI key (optional)** on Add Plant, paste a key, press save, and I see "saved, ends in …xxxx"; the key is in this browser's localStorage only (`plantit.openaiKey`), every identify request now carries `X-OpenAI-Key`, the results page says the guide came from OpenAI using my key (or, with a bad key, a warning naming the reason and the built-in guide instead), and after **Remove key** or **Logout** the header is gone. The server never stores or logs the key and has no `OPENAI_API_KEY`. |
| S10 | As a visitor I type a wrong address (`/plants/whatever`, `/api/nope`, `/plant-details` directly) or log out and go back, and I see either the app (SPA fallback → sign-in) or a JSON 404 for `/api/*`; never a blank page, a Vercel 404, an uncaught promise, or a red console error. Health `/api/health` says `ok: true`, `identification: "plantnet"`, `care: "bundled"`. |

## 3. Consumer-grade bar (measurable, per story)

| # | Bar (all must hold at 1440 px and 390 px unless stated) |
|---|---|
| S1 | Google popup sign-in completes and lands on `/` within 15 s of choosing the account; the account chooser is shown (`prompt=select_account`); `auth/unauthorized-domain` never appears on `plantit.kalpkan.com` or `plantit-kappa.vercel.app`; zero console errors on `/login` and `/` (warnings from third-party scripts are noted, not counted); at 390 px `document.documentElement.scrollWidth` = 390 on every route and the drawer opens with all four links. |
| S2 | Over the 15 plant photos in `tests/fixtures/plants/`: top-1 genus correct on **≥ 13/15**, top-1 species (or accepted synonym per `ground-truth.json`) on **≥ 9/15**, ground-truth species within the returned top 3 on **≥ 13/15** (live baseline today: 15 / 14 / 15). Every identify round trip **< 10 s** from the click to the results page (baseline: slowest 2.1 s API time). The results page shows the uploaded photo from the Supabase URL (HTTP 200, `image/jpeg`), the common name is not "Unknown" for any corpus photo, and a top-1 score **< 0.30** is shown with a visible low-confidence warning and the runner-up candidates, not as a bare number (today `monstera-deliciosa-2` scored 10 % and `spathiphyllum-wallisii-2` 19 % with no warning). "Demo result" appears **only** when `demo: true` (never on a Pl@ntNet answer). |
| S3 | Six care sections are non-empty for every corpus photo; the source line matches `careSource` (`bundled` / `generic` / `openai`). Species-appropriateness: for the corpus' drought-tolerant plants (both snake plants, jade, aloe, ZZ) the watering text says to let the soil dry out fully and `wateringThreshold ≤ 12 %`; for the peace lilies the text says keep moist and `wateringThreshold ≥ 25 %`; for the five bundled species the guide is the bundled one (today `Dracaena trifasciata` from Pl@ntNet misses the library, which lists only `Sansevieria trifasciata`, and gets the base generic guide "water when the top 2-3 cm feels dry", threshold 20 %: fails). No two different genera in the corpus may receive an identical guide unless both are generic and the bar above still holds. |
| S4 | `not-a-plant-mug.jpg` → the page shows a not-a-plant message within 10 s, `savedPlant` is absent, My Plants count is unchanged (today: saved as "Monstera deliciosa 91 %, Demo result", reason `plantnet_error`, because Pl@ntNet's 404 "no species found" is treated like an outage; that is the round-0 blocker). `too-small.jpg` → refused client-side (no `/api/identify` request in the network log) with the "too small" message. `not-an-image.txt` → not selectable through the picker; posted directly, the API answers 400 "Only image files are accepted". Direct API checks are in `scripts/run-corpus.js` ("negatives refused, nothing saved" bar must PASS 3/3). |
| S5 | `/plants` renders every plant the API returns; each card has an `<img>` that loads (or the labelled placeholder for `photoStatus: "unavailable"`; never a broken-image icon); the chip reads "Simulated sensor" for every plant without a device report; dialog opens within 1 s with the sensor panel showing `currentVWC` between `minVWC` and `maxVWC`, `wateringThreshold`, "last watered", and the simulated-sensor caption; the page never shows the full-page spinner after the first load (`LinearProgress` only). |
| S6 | After Water now: response `ok: true`, `mode: "simulated"`, `reading.currentVWC === reading.maxVWC`, event `source: "simulated"` with `vwcBefore`/`vwcAfter`; the dialog stays mounted (no unmount/remount of `[data-testid="sensor-panel"]`), the log shows the new line, the toast/caption updates; `GET /api/plants/:id/device` after reload agrees; with a plant whose `lastWatered` is 70 h old (set via Firestore or by waiting) `needsWater: true` and the amber warning are shown. A `water_now_clicked` PostHog event is sent. |
| S7 | Delete → 200 `{success: true}`, the card is gone without reload, the Supabase object answers 400/404 afterwards, Firestore has no `events` subdocuments left (check with the Admin SDK), and the RTDB mirror node is gone. |
| S8 | On the hosted site: the button text contains "hardware required"; the dialog explains it needs a local API; `192.168.1.50` → 502 with the "run the API locally" message inline (no snackbar success, no unhandled rejection); `8.8.8.8` or port `99999` → 400 with the specific validation message; after cancel the plant still reads "Simulated sensor" and Water now still works. `GET /api/plants/:id/moisture/:uid` without the secret → 403. |
| S9 | Unit: `frontend/src/openaiKey.test.js`, `OpenAiKeyField.test.js`, `backend/src/providers.test.js`, the two new `app.test.js` cases (all green today). Browser: after saving `sk-invalidkeyabcdefghijklmnop`, the network log shows `X-OpenAI-Key` on `/api/identify`, the response has `careReason: "openai_error"`, `openaiError: "invalid_key"`, the page shows the 401 warning and the built-in guide; `localStorage.getItem('plantit.openaiKey')` is the key; after Remove key the header is absent; after Logout localStorage has no `plantit.openaiKey`. Server: `vercel logs` for that request contain no `sk-`; `/api/health` never reports `care: "openai"`; `.env.example` and the README contain no `OPENAI_API_KEY`; the Vercel project has no such variable (`npx vercel env ls --scope kks-projects-2edcb11a`). With a real key (only if the TEST agent has one of its own) `careSource: "openai"` and six species-specific sections. |
| S10 | `curl -s -o /dev/null -w '%{http_code}' https://plantit.kalpkan.com/<path>` = 200 for `/`, `/login`, `/plants`, `/add-plant`, `/plant-details`, `/anything/else`; `/api/nope` = 404 JSON; `/api/health` = 200 `ok: true`; signed-out visit to `/plants` redirects to `/login`; `/plant-details` with no state redirects to `/add-plant`; zero uncaught errors in the console across the whole session (the TEST agent keeps the console open from sign-in to logout); Lighthouse mobile performance ≥ 0.80 and accessibility ≥ 0.90 on `/login` and `/plants`. |

Console-error rule for every story: `console.error` from the app or an uncaught rejection = fail; a third-party warning (PostHog, MUI dev warnings in a production build must not appear at all) is recorded.

## 4. Test assets

All created today by this agent, committed to `KalpKan/PlantWater` (every file < 300 KB, EXIF stripped, Wikimedia Commons CC-licensed with attribution recorded; no personal documents).

| Asset | Path | Purpose |
|---|---|---|
| Identification corpus: 15 plant photos, 10 species | `/Users/kalp/projects/plantit/tests/fixtures/plants/*.jpg` | S2, S3, S5, S6. Two photos each of the five bundled-care species (Monstera, pothos, snake plant, peace lily, fiddle-leaf fig), one each of aloe, spider plant, ZZ, Chinese money plant, jade. Three are deliberately hard (garden scene, distant tree, field). |
| Negatives | `.../not-a-plant-mug.jpg`, `.../too-small.jpg` (≈1 KB), `.../not-an-image.txt` | S4 |
| Ground truth + bars + sources | `/Users/kalp/projects/plantit/tests/fixtures/plants/ground-truth.json` | accepted species/synonyms, genus, family, common name, bundledCare, difficulty, Wikimedia source and licence per photo, `plantnetCalibration` (raw Pl@ntNet answer for the exact bytes) and `liveBaseline` (what the hosted API answered today) |
| Human-readable corpus table and attribution | `/Users/kalp/projects/plantit/tests/fixtures/plants/README.md` | |
| Live baseline, round 0 | `/Users/kalp/projects/plantit/tests/fixtures/plants/baseline-2026-09-19.json` | output of the corpus script against production today (§6) |
| Corpus runner | `/Users/kalp/projects/plantit/scripts/run-corpus.js` | mints a throwaway Firebase sign-in for uid `corpus-test` (service account `~/.config/portfolio-ops/plantit-firebase-sa.json`, or `PLANTIT_ID_TOKEN` from a browser), posts every fixture to `/api/identify`, scores against the bars, PASS/FAIL per bar, deletes the plants it made; exit 0 only when every bar passes; never prints a token |
| Existing smoke leaf (a drawing, not a photo) | `/Users/kalp/projects/plantit/docs/images/test-leaf.jpg` | kept for the old smoke test only; not part of the bars |
| Existing screenshots from the T2.1 run | `/Users/kalp/projects/plantit/docs/images/*.png` | reference for what the phone layout looked like at `72b7c3c` |
| Service account (operator-only, never committed) | `~/.config/portfolio-ops/plantit-firebase-sa.json` | S7's Firestore checks and the corpus sign-in |

Not needed: PDFs, videos, or webcam clips (this app has none of those features).

## 5. How to run the checks

```bash
cd ~/projects/plantit && npm test                                   # 42 API + 10 frontend jest tests (also run by .github/workflows/ci.yml on every push)
node scripts/run-corpus.js --base https://plantit.kalpkan.com       # S2/S3/S4 bars against production, ~16 Pl@ntNet calls of the app's 50/day
# Local API with a raised cap for repeated rounds (the counter is the shared Firestore doc spend/plantnet_<day>):
#   cp .env.example .env, fill FIREBASE_* from the service-account JSON, SUPABASE_* and PLANTNET_API_KEY from
#   ~/.config/portfolio-ops/secrets.env, set PLANTNET_DAILY_LIMIT=200, then npm run dev:api and --base http://localhost:3001
# Browser stories S1, S5-S10: claude-in-chrome on https://plantit.kalpkan.com at 1440 and 390 px, console + network panels open.
curl -s https://plantit.kalpkan.com/api/health | jq '{ok, identification, care, careWithVisitorKey, spend}'
for p in / /login /plants /add-plant /plant-details /x/y /api/nope; do printf '%s ' $p; curl -s -o /dev/null -w '%{http_code}\n' https://plantit.kalpkan.com$p; done
```

Corpus-quota note: Pl@ntNet's free tier is 500/day and the app caps itself at 50/day (`PLANTNET_DAILY_LIMIT`, counted per UTC day in Firestore). Two full corpus runs a day fit in production; use the local API with a raised cap for more.

## 6. Baseline measured today (round 0, so the fixer knows what is already right and what is not)

Measured by this agent on 2026-09-19 against production `e67d21f` (before T2.2 was pushed; T2.2 does not change identification).

| Check | Result today | Bar | Status |
|---|---|---|---|
| Corpus genus top-1 | 15/15 | ≥ 13 | PASS |
| Corpus species top-1 | 14/15 (`crassula-ovata` → *Crassula multicava* 41 %, *C. ovata* second) | ≥ 9 | PASS |
| Corpus species in top-3 | 15/15 | ≥ 13 | PASS |
| Identify latency | slowest 2145 ms (API side, from this Mac) | < 10 s | PASS |
| Negatives refused, nothing saved | 2/3: `too-small.jpg` 400, `not-an-image.txt` 400, **`not-a-plant-mug.jpg` → 200, saved as "Monstera deliciosa 91 %", `demo: true`, reason `plantnet_error`** | 3/3 | **FAIL (S4 blocker)** — `providers.identify` catches Pl@ntNet's HTTP 404 ("no species found") as an outage and falls back to the demo list; a 404 must instead become a 422 "This does not look like a plant" and save nothing |
| Low-confidence display | `monstera-deliciosa-2` 10 %, `spathiphyllum-wallisii-2` 19 % shown as plain "Confidence: 10%" | warning + runner-ups below 30 % | **FAIL (S2)** |
| Care for live snake plants | *Dracaena trifasciata* → generic base guide, threshold 20 % | bundled snake-plant guide, threshold 8 % | **FAIL (S3)** — `demoPlants.js` lists only *Sansevieria trifasciata*; `findCannedCare` matches exact name or genus; `genericCare`'s succulent regex lacks `dracaena` |
| Care for ZZ plant | *Zamioculcas zamiifolia* → generic base guide (water when top 2-3 cm dry) | drought-tolerant guidance, threshold ≤ 12 % | **FAIL (S3)** |
| Care for jade / aloe | succulent rule, threshold 8 % | ≤ 12 % | PASS |
| Care for peace lilies | bundled (genus match), threshold 28 % | ≥ 25 % | PASS |
| Health | `ok: true`, `identification: "plantnet"`, `care: "bundled"`, `firestore: "ok"`, `image: "sharp"` | same | PASS |
| SPA / API routes | `/`, `/login`, `/plants` → 200; `/api/nope` → 404 JSON | same | PASS |
| Unit tests | 42 API + 10 frontend pass (with T2.2) | green | PASS |
| Browser stories S1, S5–S10 at 1440/390 px | **not measured by this agent** (spec-only; the T2.1 fixer's screenshots at `72b7c3c` show a collapsed nav and the Water now flow working; the Phase 2–4 audit proved sign-in + `water_now_clicked` from a real Chrome) | §3 | TEST agent, round 1 |
| Delete leaves no `events` subcollection | code uses `recursiveDelete` (test covers it) | S7 | TEST agent verifies on production with the Admin SDK |

Other things a fixer should know: (a) the Pl@ntNet spend counter also counts a 404 (the mug), which is fine; (b) `serializePlant` strips `deviceSecret`, so the browser never sees it; (c) `Navbar` logout calls `localStorage.clear()`, which is what removes the visitor's OpenAI key (documented, intended); (d) `PlantDetails` refetches care with `GET /api/plant/:species/care` only when `careInstructions` is missing from router state, so a direct visit to `/plant-details` redirects to `/add-plant`.

## 7. T2.2 — "Use your own OpenAI key" (implemented today by this agent, `KalpKan/PlantWater`)

- Frontend: `frontend/src/openaiKey.js` (localStorage key `plantit.openaiKey`, header `X-OpenAI-Key`, shape check `sk-…`, masking), `frontend/src/components/OpenAiKeyField.js` (collapsible field on Add Plant: password input, show/hide, Save / Replace / Remove, status "saved, ends in …xxxx", explanatory copy), `PlantUpload.js` and `PlantDetails.js` send the header and show the source / failure reason.
- Backend: `visitorOpenAIKey(req)` in `app.js` reads the header (trimmed, ≤ 512 printable ASCII chars, otherwise ignored), passes it to `providers.careGuide({ species, visitorKey })` for that request only; CORS allows the header; `/api/health` reports `care: "bundled"` and `careWithVisitorKey: "openai"` and no longer has an OpenAI spend counter. `providers.careGuide` no longer reads any environment variable: with a visitor key OpenAI is asked for every species on the visitor's account (no server-side guard, it is their spend); on failure the bundled/generic guide answers with `reason: "openai_error"` and `openaiError` ∈ `invalid_key | rate_limited_or_no_credit | forbidden | timeout | error`; the log line is passed through `redactSecret` (the key and any `sk-…` token are replaced). `OPENAI_API_KEY` and `OPENAI_DAILY_LIMIT` are gone from `.env.example` and the README (`OPENAI_MODEL` stays, default `gpt-4o-mini`); a test asserts that setting `OPENAI_API_KEY` on the server changes nothing.
- CI: `.github/workflows/ci.yml` runs `npm ci` for API and frontend, `npm run test:api`, `npm run test:web`, and the CRA production build with `CI=true` on every push to `main` and every PR (no secrets needed).
- Verified locally: 42 API + 10 frontend tests green; `CI=true npm --prefix frontend run build` clean.

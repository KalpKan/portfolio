# Plant It functional audit — 2026-09-19 (TEST + CRITIQUE round 1)

Live URL: https://plantit.kalpkan.com (fallback alias `https://plantit-kappa.vercel.app`) · Repo: `KalpKan/PlantWater` at `a50344c` (local `~/projects/plantit`; production deployment `plantit-qdue6k07i`, same commit) · Vercel project `plantit` (`prj_d2ATAx5QfXegcaCY2ZB8KGttDDuX`, team `kks-projects-2edcb11a`) · Database: Firebase Spark `plant-it-5e2fc` (Auth, Firestore `users/{uid}/plants`, RTDB mirror) + Supabase Project B Storage bucket `plantit-photos` · Health route: `https://plantit.kalpkan.com/api/health` → `{"ok":true,"service":"plantit","firestore":"ok","photos":"supabase","identification":"plantnet","care":"bundled","careWithVisitorKey":"openai","image":"sharp",...}` (checked 01:51 UTC: `spend.plantnet.count` 17 of 50 before this round, 39 after it)

Spec: `docs/reports/plantit-spec.md` (10 stories, bars, corpus). No FIX round has run yet, so this is the first measurement of the whole spec against the code the spec agent left (`a50344c` = `e67d21f` + T2.2 + CI + corpus).

**How it was tested.** (1) `npm test` in the repo (42 API + 10 frontend jest tests). (2) `scripts/run-corpus.js` against production: 15 plant photos + 3 negatives, one `/api/identify` each. (3) Playwright Chromium (the machine's cached build 1243, headless) on the **live** site at 1440×900 dark and 390×844 (iPhone emulation, DPR 3, `prefers-color-scheme: light`, which the app ignores because its theme is hard-coded dark) for S1–S10, signed in as a throwaway Firebase user `round1-test` by writing the Firebase Auth persistence record into IndexedDB from a custom token minted with the operator service account; console (`error`/`warning`/`pageerror`), every `/api/*` request and response, timings and screenshots were recorded (`docs/reports/evidence/plantit-r1-playwright-audit.mjs`, results in `plantit-r1-playwright-audit-2026-09-19.json`). (4) Real Chrome through the claude-in-chrome extension on the live site: Logout, the Google sign-in click and the popup. The extension's window is shared with three other agents' tabs and was stuck at a 606 CSS-px viewport that `resize_window` could not change (incident filed), and the Google account-chooser popup is a separate window the extension cannot see, so the account pick could not be automated; everything after the popup was proven with the injected session instead. (5) Admin SDK checks of Firestore (`events` subcollection) and RTDB after Delete; direct Supabase URL checks; a 70-hour-old plant seeded straight into Firestore for the dry-out curve. (6) Lighthouse 12 mobile on `/login` and, signed in, `/plants`. (7) `vercel env ls` and 40 s of `vercel logs` on production. (8) impeccable `critique` (degraded single-context run: no sub-agent tool in this harness; the mechanical detector ran over `frontend/src` and `frontend/public/index.html` and returned no findings, so the UX pass below is the design review plus the browser evidence).

## Verdict: PARTIALLY WORKING

The core loop works and is fast: every corpus photo identifies correctly at genus level (15/15), 14/15 at species level, slowest round trip 2.9 s from click to results page; My Plants, the dialog, Water now, Delete, hardware-required messaging and the bring-your-own-OpenAI-key flow all behave as specified at both widths with no horizontal scroll and no application console errors. What stops it being consumer-grade is the same three things the spec measured at round 0 plus four new ones: a coffee mug is saved as "Monstera deliciosa, 91 %", snake plants and ZZ plants are told to keep the soil moist, a 10 % match is presented like a confident answer, a mistyped address shows a blank page, the visitor's OpenAI key is partly written into the server logs the app promises never to write it to, Lighthouse mobile performance is 0.68–0.75 against a 0.80 bar, and every primary button is white text on bright green at 1.8:1.

**4 of 10 stories meet their bar** (S5, S6, S7, S8); S1 is met for everything an agent can drive; S2, S3, S4, S9, S10 fail. Score **45/100**.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Sign in with Google, Home page, nav | **PASS (popup half proven earlier)** | Real Chrome: Logout lands on `/login`; clicking **Sign in with Google** flips the button to "Opening Google sign-in…" and opens the Google popup (account chooser, `prompt=select_account`); the account pick is a separate window this harness cannot drive, and the Phase 2–4 audit already proved the full round trip on this host (`water_now_clicked` from a real Chrome, 2026-09-18 23:26 UTC). With the injected session: `/` shows "Welcome to Plant It", **Add New Plant** and **View Plants** (1 each) at both widths; desktop nav `Home / My Plants / Add Plant / Logout`; at 390 px the `open menu` button opens the drawer with exactly those four items (`plantit-r1-phone-drawer-2026-09-19.jpg`); `document.documentElement.scrollWidth` = 390 on `/login`, `/`, `/add-plant`, `/plant-details`, `/plants` (dialog open too), `/plants/whatever`, `/x/y`; zero `console.error` / `pageerror` from the app across the whole session at both widths (the only red lines are the browser's own "Failed to load resource: 502 / 400" for the S8 hardware calls, see Known limitations) |
| S2 | Identify a corpus photo in < 10 s, correct species, photo, "Saved" | **FAIL** (metrics pass; low-confidence bar fails) | Corpus on production (`plantit-r1-corpus-production-2026-09-19.json`): genus top-1 **15/15**, species top-1 **14/15** (`crassula-ovata` → *Crassula multicava* 41 %, *C. ovata* in top 3), species in top-3 **15/15**, slowest API round trip 2 253 ms. Browser: monstera 2 298 ms click → results page, ficus at 390 px 2 239 ms, ZZ 1 844 ms, aloe with a visitor key 2 919 ms; results page shows species, common name (never "Unknown"), family, confidence, the Supabase photo (`HTTP 200 image/jpeg`, 62 892 B, `<img>` complete at 450 px) and "Saved to your collection"; "Demo result" appears only on the `demo: true` answer. **But** `monstera-deliciosa-2.jpg` (score 0.104) renders as "Confidence: 10 %" with no warning and no runner-ups, and the API's other four candidates are never shown (`plantit-r1-desktop-results-lowconf-2026-09-19.jpg`; D3) |
| S3 | Six care sections + sensible moisture targets + source line | **FAIL** | All six sections plus "Soil moisture targets" are non-empty for every corpus species and the source caption matches `careSource` (bundled / generic). Species fit: jade 8 %, aloe 8 %, peace lily 28 % "keep lightly moist" (pass); **`Dracaena trifasciata` (both snake-plant photos) → generic "water when the top 2-3 cm feels dry", threshold 20 %; `Zamioculcas zamiifolia` → the same moist generic guide, threshold 20 %** (`plantit-r1-desktop-results-zz-2026-09-19.jpg`; care table for all 12 species in the session log). Pilea and Chlorophytum get that identical base guide too (allowed by the bar only because they are not drought plants). D2 |
| S4 | Not-a-plant / too-small / text file refused, nothing saved | **FAIL (blocker)** | `not-a-plant-mug.jpg` → `200`, `demo: true`, `reason: plantnet_error`, saved as **"Monstera deliciosa, Swiss cheese plant, 91 %, Demo result"** and shown in My Plants (`plantit-r1-desktop-mug-2026-09-19.jpg`, `plantit-r1-desktop-plants-2026-09-19.jpg`, `plantit-r1-desktop-dialog-2026-09-19.jpg`). Pl@ntNet's actual answer for those bytes is `404 {"statusCode":404,"error":"Not Found","message":"Species not found"}` (`plantit-r1-mug-plantnet-404-2026-09-19.json`); Vercel log: `Pl@ntNet failed, using demo identification: Request failed with status code 404`. `too-small.jpg` → refused client-side ("That image is too small (under 10 KB)…"), no `/api/identify` request (pass). `not-an-image.txt` → posted directly: `400 Only image files are accepted` (pass); dropped on the page: **silently ignored**, no message, button stays disabled (D7). D1 |
| S5 | My Plants cards, dialog with care + Soil moisture panel | **PASS** | 4 cards (desktop) / 5 (phone), every `<img>` `complete` with a natural width, 0 placeholders (a seeded photo-less plant showed the labelled "No photo" placeholder, `plantit-r1-desktop-dryout-70h-2026-09-19.jpg`); species, common name, family and "Simulated sensor" on every card, "Demo result" only on the mug; dialog opens in 333 ms (desktop) / 827 ms (phone) with the photo, six care rows and the panel: `45%`, "waters below 20 %", "last watered 1 min ago", the simulated-sensor caption; API `currentVWC` 45 within [15, 45]; `LinearProgress` only on refetch, no full-page spinner after first load |
| S6 | Water now without unmount/reload; state survives; dries out | **PASS** | `POST …/water` → `200 {ok: true, mode: "simulated", reading.currentVWC 45 == maxVWC 45, event.source "simulated", vwcBefore 45, vwcAfter 45}`; the `[data-testid=sensor-panel]` element kept a DOM marker set before the click (no remount), the dialog stayed open, 0 navigations; log line "Watered (simulated) · 9/18/2026, 9:58:53 PM · 45 % → 45 %"; identical panel after reload; a plant seeded with `lastWatered` 70 h ago reads `5.2 %` (min 5, max 28), `needsWater: true`, "last watered 3 days ago", amber "below the watering threshold" alert (`plantit-r1-dryout-70h-2026-09-19.json`, screenshot) |
| S7 | Delete → card gone + toast; photo gone; never reappears | **PASS** | `DELETE` → `200 {success: true}`; cards 4 → 3 without reload, toast "Monstera deliciosa has been deleted."; after reload still 3; Firestore doc gone, `events` subcollection **0** docs, RTDB node gone (Admin SDK). The Supabase URL answered `200` when fetched 1.5 s after the delete (CDN cache) and `400` from then on (`cf-cache-status: BYPASS`), see Known limitations |
| S8 | Connect ESP8266 labelled hardware-required; private IP → 502 inline; public IP → 400; sim keeps working | **PASS** | Button "Connect ESP8266 (hardware required)"; dialog text explains the local-API requirement; `192.168.1.50` → `502 {hardwareRequired: true}` shown inline ("This needs a real device…"), no success snackbar, no unhandled rejection; `8.8.8.8` → `400 "deviceIP must be a private IPv4 address…"` inline; port `99999` via the API → `400 "devicePort must be a whole number from 1 to 65535"`; after Cancel the panel still reads "Simulated sensor" with the watering log; `GET /api/plants/:id/moisture/:uid` without the secret → `403` (`plantit-r1-desktop-hardware-private-ip-2026-09-19.jpg`) |
| S9 | Bring-your-own OpenAI key | **FAIL** (one clause: the server log) | Save `sk-invalidkeyabcdefghijklmnop` → "saved, ends in …mnop", `localStorage['plantit.openaiKey']` is the key; identify (aloe) carried `X-OpenAI-Key` (header seen on the request), response `careReason: "openai_error"`, `openaiError: "invalid_key"`, `careSource: "generic"`, page shows "OpenAI rejected the key saved in your browser (401)…" and the built-in guide (`plantit-r1-desktop-byok-results-2026-09-19.jpg`); Remove key → `null`; Logout → `localStorage` empty; `vercel env ls` → 8 names, **no** `OPENAI_API_KEY`; `/api/health` `care: "bundled"`. **But** production logs for that request read `OpenAI (visitor key) failed, using the built-in guide: invalid_key 401 Incorrect API key provided: sk-inval*****************mnop …` — the first 8 and last 4 characters of the visitor's key, in Vercel's log store, because the redaction only matches `sk-` followed by 6+ key characters and OpenAI has already starred the middle (D5). Unit tests: `openaiKey.test.js`, `OpenAiKeyField.test.js`, `providers.test.js`, `app.test.js` all green (42 + 10) |
| S10 | Wrong addresses, logout + back, health, Lighthouse | **FAIL** | `curl`: `/`, `/login`, `/plants`, `/add-plant`, `/plant-details`, `/plants/whatever`, `/x/y` → `200 text/html`; `/api/nope` → `404 {"error":"No route GET /api/nope?path=nope"}`; `/api/health` `ok: true`, `identification: plantnet`, `care: bundled`. Signed out: `/plants` → `/login` (redirect); `/plant-details` signed in → `/add-plant`; logout → `/login`, Back stays on `/login`. **But** `/plants/whatever` and `/x/y` render **nothing**: signed out the page is completely blank (`#root` inner text ""), signed in it is the nav bar over an empty page (`plantit-r1-desktop-unknown-route-signed-in-2026-09-19.jpg`, `plantit-r1-phone-signed-out-unknown-route-2026-09-19.jpg`; D4). Lighthouse mobile (`plantit-r1-lighthouse-2026-09-19.json`): `/login` performance **0.75**, accessibility 1.00, best-practices 1.00 (FCP 4.1 s, LCP 4.2 s); `/plants` performance **0.68**, accessibility 0.98 (`heading-order`), LCP 5.7 s. Bar is ≥ 0.80 (D6) |

Unit tests: `npm run test:api` → 42 passed (6 suites); `npm run test:web` → 10 passed (3 suites, with `act()` environment warnings, D13). Pl@ntNet budget used by this round: 16 (corpus) + 6 (browser) = 22 of the app's 50/day (counter 17 → ≈ 41 at 02:05 UTC). All plants created under uids `corpus-test` and `round1-test` were deleted.

## Defects

### D1 — A photo of a coffee mug is saved as "Monstera deliciosa, 91 %"
Severity: **blocker** (S4)
Steps to reproduce: sign in → Add Plant → drop `tests/fixtures/plants/not-a-plant-mug.jpg` → Identify Plant.
Expected: a "This does not look like a plant" message, nothing saved, My Plants unchanged.
Actual: results page in 1.6 s with "Saved to your collection", the info alert "Demo result. Pl@ntNet did not answer, so the species comes from a bundled list of common houseplants.", species *Monstera deliciosa*, Swiss cheese plant, Araceae, Confidence 91 %, and the mug photo; the mug then sits in My Plants with a "Demo result" chip and, in its dialog, a 45 % soil-moisture reading and Monstera care instructions.
Evidence: `plantit-r1-desktop-mug-2026-09-19.jpg`, `plantit-r1-desktop-plants-2026-09-19.jpg`, `plantit-r1-desktop-dialog-2026-09-19.jpg`; corpus row `not-a-plant-mug.jpg 200 1084 ms Monstera deliciosa 91% DEMO WRONG`; Pl@ntNet's direct answer for the same bytes: `HTTP 404 {"statusCode":404,"error":"Not Found","message":"Species not found"}`; Vercel log line `Pl@ntNet failed, using demo identification: Request failed with status code 404`.
Likely cause: `backend/src/providers.js:43-58` (`identify`, catch at line 54) wraps `identifyWithPlantNet` in one `try/catch` that treats every failure, including Pl@ntNet's HTTP 404 "Species not found" (its normal answer for a non-plant), as an outage and falls back to `pickDemoPlant(buffer)`; `backend/src/app.js:216-258` then saves whatever comes back. The demo alert text ("Pl@ntNet did not answer") is also false here: it answered.
Suggested fix: in `identify`, detect `error.response.status === 404` (and an empty `results` array) and return `{ candidates: [], notAPlant: true }`; in `/api/identify` answer `422 {error: "This does not look like a plant. Try a closer photo of the leaves or flowers.", notAPlant: true}` before any upload or Firestore write; keep the demo fallback only for 5xx/network/quota; add a unit test with a mocked 404 and a corpus assertion (`negatives 3/3`).

### D2 — Snake plants and ZZ plants get the "keep it moist" generic guide
Severity: **major** (S3)
Steps to reproduce: identify `dracaena-trifasciata.jpg` (or `-2.jpg`) or `zamioculcas-zamiifolia.jpg`; read Care Instructions.
Expected: "let the soil dry out completely" wording and a watering threshold ≤ 12 % (the bundled snake-plant guide says 8 %).
Actual: *Dracaena trifasciata* → "General houseplant care…", Watering "Water when the top 2-3 cm of soil feels dry…", "Keep between 15 % and 45 %; water below 20 %"; *Zamioculcas zamiifolia* → the identical text and numbers. The simulated sensor then tells the owner to water a snake plant at 20 %, roughly two and a half times too early.
Evidence: `plantit-r1-desktop-results-zz-2026-09-19.jpg`; `GET /api/plant/Dracaena%20trifasciata/care` → `source: generic, wateringThreshold 20`; same for `Zamioculcas zamiifolia`; `Aloe vera` and `Crassula` correctly hit the succulent rule (threshold 8).
Likely cause: `backend/src/demoPlants.js:110-118` `findCannedCare` matches exact name or genus only, and the library lists the snake plant under its old name *Sansevieria trifasciata* (`demoPlants.js:40`), while Pl@ntNet returns the accepted name *Dracaena trifasciata*; `backend/src/providers.js:104` `genericCare`'s drought regex `/cact|succulent|aloe|echeveria|crassula|haworthia|sansevieria/` has neither `dracaena` nor `zamioculcas`.
Suggested fix: give each `DEMO_PLANTS` entry a `synonyms` list (`Dracaena trifasciata`, `Epipremnum pinnatum` for pothos) and match on it in `findCannedCare`; add `dracaena|zamioculcas|zz plant|zamiifolia` (and `pilea|peperomia` for the moderately drought-tolerant group) to the succulent branch, or better, add ZZ and Chinese money plant as bundled entries; extend `ground-truth.json` with `expectedThresholdMax` per item and assert it in `run-corpus.js`.

### D3 — A 10 % match is presented like a confident answer and the other candidates are never shown
Severity: **major** (S2)
Steps to reproduce: identify `monstera-deliciosa-2.jpg` (Pl@ntNet top score 0.104) or `spathiphyllum-wallisii-2.jpg` (0.19).
Expected: a visible low-confidence warning and the runner-up candidates so the owner can pick or retake.
Actual: the same green "Saved to your collection" page as an 86 % match, with "Confidence: 10 %" in small grey text; the plant is saved as that species; the four other candidates the API returned (`nCandidates: 5`) are not rendered anywhere.
Evidence: `plantit-r1-desktop-results-lowconf-2026-09-19.jpg`; audit JSON `identifyLow.score 0.10437, nCandidates 5, warningAlerts: ["Saved to your collection…"]`.
Likely cause: `frontend/src/components/PlantDetails.js:141-145` prints `Math.round(topMatch.score * 100)%` unconditionally and only ever reads `candidates[0]`; nothing in `backend/src/app.js:216-217` flags a low score.
Suggested fix: in `PlantDetails`, when `topMatch.score < 0.3` render a `warning` Alert ("Low confidence: Pl@ntNet is only 10 % sure. Check the other matches or try a clearer photo of a leaf or flower.") above the card and a list of `candidates.slice(1, 4)` with their scores; consider not auto-saving below the threshold (or saving with a `lowConfidence` flag shown as a chip in My Plants).

### D4 — A mistyped address shows a blank page
Severity: **major** (S10)
Steps to reproduce: open `https://plantit.kalpkan.com/plants/whatever` or `/x/y`, signed out or signed in.
Expected: the sign-in page (signed out) or a "That page does not exist" view with a link home (signed in).
Actual: signed out, the page is entirely black (`#root` inner text empty, no nav, no button); signed in, the nav bar sits over an empty page. No error, no redirect.
Evidence: `plantit-r1-desktop-unknown-route-signed-in-2026-09-19.jpg`, `plantit-r1-phone-signed-out-unknown-route-2026-09-19.jpg`; audit JSON `signedOutUnknown.bodyText ""`, `routes["/x/y"].text "Plant It Home My Plants Add Plant Logout"`.
Likely cause: `frontend/src/App.js:165-199` declares four routes and no `path="*"`; React Router renders nothing for an unmatched location and `Navbar` returns `null` when signed out.
Suggested fix: add `<Route path="*" element={<PrivateRoute><NotFound /></PrivateRoute>} />` (a small card: "No such page" + Home / My Plants buttons); signed out, `PrivateRoute` already redirects to `/login`.

### D5 — Part of the visitor's OpenAI key is written to the server logs
Severity: **major** (S9; the app promises "never stored or logged on the server")
Steps to reproduce: save an OpenAI-shaped key that OpenAI rejects, identify a plant, then `cd ~/projects/plantit && npx vercel logs https://plantit.kalpkan.com --scope kks-projects-2edcb11a`.
Expected: no fragment of the key in any log line.
Actual: `OpenAI (visitor key) failed, using the built-in guide: invalid_key 401 Incorrect API key provided: sk-inval*****************mnop. You can find your API key at …` — OpenAI's own error message carries the first 8 and last 4 characters of the key, and that message is logged. For a real `sk-proj-…` key the same line would show its prefix and suffix.
Evidence: two such lines in the 40 s log capture at 21:59:11 (local) for the S9 request (`grep -c sk-` → 2).
Likely cause: `backend/src/providers.js:129-133` `redactSecret` replaces the exact key (already starred by OpenAI, so no match) and `/sk-[A-Za-z0-9_-]{6,}/` (the visible prefix `sk-inval` has only 5 key characters before the `*`, so no match either); `providers.js:164` logs `error.message` verbatim after that.
Suggested fix: never log the upstream message for visitor-key failures, only the classification (`invalid_key`, `rate_limited_or_no_credit`, …) and the HTTP status; harden `redactSecret` to `/sk-\S+/g`; add a unit test with OpenAI's real message format.

### D6 — Lighthouse mobile performance 0.75 (`/login`) and 0.68 (`/plants`) against a 0.80 bar
Severity: **major** (S10)
Steps to reproduce: Lighthouse 12, mobile preset, on `/login` and (signed in) `/plants`.
Expected: performance ≥ 0.80, accessibility ≥ 0.90.
Actual: `/login` 0.75 (FCP 4.1 s, LCP 4.2 s, TBT 120 ms, CLS 0); `/plants` 0.68 (FCP 4.3 s, LCP 5.7 s). Accessibility 1.00 / 0.98 (pass). The LCP element is body text, delayed by the JS bundle: `main.3677cf3f.js` 253 KB gzipped (131 KB unused on `/login`), a 104 KB chunk, the Firebase auth iframe (95 KB), the PostHog recorder (68 KB), and the Google "G" logo shipped as an **88 KB PNG** for a 24 px icon; every route change also plays a 0.5 s framer-motion fade that pushes the first paint of each page.
Evidence: `plantit-r1-lighthouse-2026-09-19.json`; audit run at 02:03 UTC.
Likely cause: `frontend/src/App.js` imports every page and MUI icon set into one bundle with no `React.lazy`; `AnimatedRoutes` fades every page for 0.5 s; `frontend/src/assets/Google__G__logo.png` (88 KB) in `Login.js:112`; `analytics.js` loads the session-recorder on `/login`.
Suggested fix: replace the logo with an inline 1 KB SVG; `React.lazy` the `/plants`, `/add-plant`, `/plant-details` pages; drop the route fade to ≤ 150 ms (or opacity only, no `y`); defer `initAnalytics` until after first paint (`requestIdleCallback`) and consider `session_recording` off on `/login`. Re-run Lighthouse; expect ≥ 0.85.

### D7 — Dropping a non-image file does nothing
Severity: minor (S4)
Steps to reproduce: Add Plant → drop `tests/fixtures/plants/not-an-image.txt` (or pick it after changing the picker filter to "All files").
Expected: "Only images (JPEG, PNG, WebP) are accepted."
Actual: no message, no preview, Identify Plant stays disabled; the visitor has to guess why.
Evidence: audit JSON `textFile.errBefore []`, `enabled false`.
Likely cause: `frontend/src/components/PlantUpload.js:30-33` `onDrop(acceptedFiles)` returns silently when `acceptedFiles` is empty; `react-dropzone`'s `fileRejections` argument is ignored.
Suggested fix: read the second argument of `onDrop` (`fileRejections`) and set the error to the first rejection's `errors[0].code` (`file-invalid-type` → "Only JPEG, PNG or WebP images…", `too-many-files` → "One photo at a time").

### D8 — On a phone the dialog opens on a full-screen photo; the moisture reading and Water now are below the fold
Severity: minor (S5/S6 UX)
Steps to reproduce: at 390 px open My Plants → tap a card.
Expected: the reading and Water now visible without scrolling (that is what the dialog is for).
Actual: the portrait photo fills the first 1 550 of 2 000 px of the dialog; the Soil moisture panel, the care list and the log are all below it; the action row at the bottom is a 2-line "Connect ESP8266 (hardware required)" button.
Evidence: `plantit-r1-phone-dialog-2026-09-19.jpg`.
Likely cause: `frontend/src/components/PlantList.js:254-259` puts `PlantPhoto` (`width: 100%`, natural aspect) first in the left column with the panel after it; `PlantPhoto.js:67-68` has no max height in dialog mode.
Suggested fix: cap the dialog photo (`maxHeight: 200, objectFit: cover` below `md`), put the Soil moisture panel first (photo second, care third), and demote the hardware button to a text button.

### D9 — My Plants cards do not say whether a plant needs water; the amber "Simulated sensor" chip reads as a warning
Severity: minor (S5 UX)
Steps to reproduce: My Plants with several plants.
Expected: the one number the owner cares about (moisture / "needs water") on the card, and a neutral marker for the simulated sensor.
Actual: cards show species, common name, family, an amber-outlined "Simulated sensor" chip on every plant and the date added; moisture is only visible after opening each dialog. The dialog for a demo plant also drops the "Demo result" chip the card had, and the delete icon is a bare red trash can in the card header.
Evidence: `plantit-r1-desktop-plants-2026-09-19.jpg`, `plantit-r1-phone-plants-2026-09-19.jpg`.
Likely cause: `PlantList.js:192-228` renders no reading (the API's `/api/plants` list does not include one); `PlantList.js:218` `color: 'warning'` for the simulated state.
Suggested fix: have `/api/plants` include `reading` (one `simulateReading` call per plant, no extra I/O) and show "45 % · fine" or "5 % · water me" on the card; use a neutral (`default`) chip for "Simulated sensor" and keep amber for "needs water"; show the "Demo result" chip in the dialog title too.

### D10 — Primary buttons are white text on bright green at 1.8:1, and disabled buttons look enabled
Severity: **major** (accessibility, every page)
Steps to reproduce: any page; look at Identify Plant, Water now, Sign in with Google, Add New Plant; look at Identify Plant before a file is chosen.
Expected: ≥ 4.5:1 (or ≥ 3:1 for large bold text) and a clearly different disabled state.
Actual: `#fff` on `#00DC82` is ≈ 1.8:1 (relative luminance 0.53); the disabled "Identify Plant" keeps the same green gradient with faint text and is easy to read as enabled (`plantit-r1-desktop-byok-saved-2026-09-19.jpg`). Lighthouse's `color-contrast` audit skips gradient backgrounds, which is why accessibility still scores 1.0.
Evidence: `plantit-r1-desktop-byok-saved-2026-09-19.jpg`, `plantit-r1-desktop-home-2026-09-19.jpg`; `frontend/src/App.js:18-19` `primary.main '#00DC82', contrastText '#fff'`, `App.js:86-93` gradient override, `Login.js:96-107`.
Suggested fix: set `contrastText` to `#062b1c` (dark green-black, ≈ 11:1 on `#00DC82`) or darken the primary to `#00a86b`; give `.Mui-disabled` a flat `rgba(255,255,255,0.12)` background with `text.disabled`.

### D11 — `/api/nope` echoes the rewrite's internal query string
Severity: minor (S10 polish)
Actual: `{"error":"No route GET /api/nope?path=nope"}`; the `?path=nope` comes from `vercel.json`'s `/api/:path(.*)` rewrite, not from the visitor.
Likely cause: `backend/src/app.js:476` uses `req.originalUrl`.
Suggested fix: use `req.path` (or strip the `path` query parameter).

### D12 — After a rejected visitor key the source line still says "add your own OpenAI key under Add Plant for one"
Severity: minor (S9 copy)
Actual: the 401 warning and the generic-guide caption contradict each other on the same page (`plantit-r1-desktop-byok-results-2026-09-19.jpg`).
Likely cause: `frontend/src/components/PlantDetails.js:29-33` `CARE_SOURCES.generic` is static.
Suggested fix: when `careReason === 'openai_error'` use "General houseplant care (your OpenAI key was rejected, see above)".

### D13 — Frontend tests print `act()` environment warnings
Severity: minor (test hygiene)
Actual: `npm run test:web` passes but prints `Warning: The current testing environment is not configured to support act(...)` several times from `OpenAiKeyField.test.js`.
Suggested fix: set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in `frontend/src/setupTests.js` (or render through `@testing-library/react`).

## UX critique (impeccable `critique`, degraded single-context run: no sub-agent tool exposed in this harness; detector over `frontend/src` + `index.html` returned no findings, browser evidence from the screenshots above)

Mode: **Operate** (a tool the owner uses to keep plants alive). Design specificity: the interface is a competent MUI dark template (Inter, `#00DC82` accent, 18 px radii, gradient buttons, framer fade) that any dashboard could wear unchanged; nothing about leaves, soil or water shapes the composition, and the one place the product could feel alive, the moisture panel, is a number, a bar and a caption. Coherent, generic.

| # | Heuristic | Score /4 | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Identify shows a spinner; but a 10 % match is presented like an 86 % one (D3), cards hide the moisture state (D9), and the disabled CTA looks enabled (D10) |
| 2 | Match system / real world | 2 | "VWC", "water content 45 %" and "waters below 20 %" are sensor jargon; a mug becomes a Monstera (D1); snake plant told to keep moist (D2) |
| 3 | User control and freedom | 3 | Delete is confirmed and toasts; nothing to undo a wrong identification except delete-and-redo; no way to pick the second candidate |
| 4 | Consistency and standards | 3 | Nav, cards, dialogs are consistent MUI; the dialog drops the "Demo result" chip the card shows |
| 5 | Error prevention | 1 | Non-plant photo accepted and saved (D1); non-image drop silent (D7); low confidence auto-saved (D3) |
| 6 | Recognition rather than recall | 2 | Which plant needs water is not visible from the list (D9); plants have no nickname, so four "Monstera deliciosa" cards are indistinguishable |
| 7 | Flexibility and efficiency | 2 | One plant at a time, no camera capture button on phones (the picker does open the camera on iOS, but nothing says so) |
| 8 | Aesthetic and minimalist design | 3 | Clean, but the amber "Simulated sensor" chip on every card, the long hardware-required copy and the "How it works" block repeat themselves |
| 9 | Error recovery | 2 | Inline messages are specific (too small, private IP, 401 key); but the unknown route is blank (D4) and the mug page says "Pl@ntNet did not answer" when it did |
| 10 | Help and documentation | 3 | The simulated-sensor caption, the BYOK explainer and the hardware dialog are honest and specific; the results page never explains what the confidence or the moisture numbers mean |
| | **Total** | **23/40** | **Acceptable** (significant improvements needed before users are happy) |

Cognitive load: the results page shows three alerts stacked (saved / demo / key warning) before the content; the dialog on phones is a scroll past a photo to reach the action (D8). Emotional journey: the peak is real, a correct species in two seconds with a photo, and the end is the toast after Delete; the valley is the mug and the 10 % match, both of which make the whole thing feel like it is guessing. Persona red flags: a first-timer (Jordan) trusts the mug result because it is green and says "Saved"; a distracted phone user (Casey) opens a plant and sees only a photo; an accessibility-dependent user (Sam) cannot read the green buttons (1.8:1). Strengths: the honest "hardware required" and "simulated" labelling, the inline specific error copy, no horizontal scroll anywhere at 390 px, fast identification.

Questions for the fixer: should a low-confidence match be saved at all, or should the visitor confirm a candidate first? Should My Plants be the home page once you have a plant (the current Home is a marketing page you see on every visit)?

## Known limitations that are NOT defects

- **Google account pick cannot be automated from this harness.** The popup is a separate window outside the extension's tab group; the sign-in round trip on this host was proven by the Phase 2–4 audit (real Chrome, `water_now_clicked` event) and the T2.1 fixer's screenshots. The page is left showing "Opening Google sign-in…" with the popup open until someone closes it.
- **The claude-in-chrome window is shared by several agents** and sat at a 606 CSS-px viewport that `resize_window` could not change (AppleScript saw only one Chrome window and zero accessible windows), so the 1440/390 px stories were driven with Playwright Chromium on the live URL instead; incident filed.
- **Hardware-required calls produce red "Failed to load resource: 502 / 400" lines** in the browser console (S8). They are the browser reporting the intentional HTTP status, not application errors; a fixer can avoid the 400 by validating the private-IP shape client-side.
- **A deleted photo keeps serving from Supabase's CDN for a short time** (200 at 1.5 s after delete, 400 by the next check); the object itself is gone.
- **Dark theme only.** The app ignores `prefers-color-scheme` (hard-coded `mode: 'dark'`), so "both themes" collapses to one.
- **Pl@ntNet budget:** 50 identifications per UTC day on the hosted app; a full corpus run costs 16.
- **Photos added before 2026-09-18** (Firebase Storage, Spark) show the labelled "Photo no longer available" placeholder by design.

## How a fixing agent should verify the fix

```bash
cd ~/projects/plantit && npm test                                   # expect 42+ API and 10+ frontend tests, no act() warnings (D13)
node scripts/run-corpus.js --base https://plantit.kalpkan.com       # all 5 bars PASS incl. "negatives refused, nothing saved: 3/3" (D1); ~16 Pl@ntNet calls
# D2: care thresholds
T=<id token minted as in scripts/run-corpus.js>; for s in "Dracaena trifasciata" "Zamioculcas zamiifolia" "Sansevieria trifasciata" "Spathiphyllum wallisii"; do curl -s -H "Authorization: Bearer $T" "https://plantit.kalpkan.com/api/plant/$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$s")/care" | jq -c '{source, t: .soilMoisture.wateringThreshold, w: .watering[0:40]}'; done
#   expect threshold <= 12 and "completely dry" wording for the first three, >= 25 and "moist" for the peace lily
# D1 direct: curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" -F image=@tests/fixtures/plants/not-a-plant-mug.jpg https://plantit.kalpkan.com/api/identify   # 422, and GET /api/plants unchanged
# D3/D4/D7/D8/D9/D10/D12 (browser): re-run the round-1 harness
cd /path/to/scratch && cp ~/projects/portfolio/docs/reports/evidence/plantit-r1-playwright-audit.mjs . && npm i playwright@1.63.0 firebase-admin axios form-data && OUT=$PWD/out node plantit-r1-playwright-audit.mjs
#   expect: identifyLow.warningAlerts contains "Low confidence"; routes["/x/y"].text contains a not-found message; textFile.errBefore non-empty; mug.resp.status 422 and no savedPlantId
# D5: save an invalid key in the app, identify once, then
npx vercel logs https://plantit.kalpkan.com --scope kks-projects-2edcb11a | grep -c 'sk-'      # 0 (was 2)
# D6: Lighthouse mobile on /login and /plants (lh.mjs pattern: Playwright persistent context + lighthouse on port 9555) → performance >= 0.80 both
# D10: contrast of the primary button text vs its background >= 4.5:1 (any contrast checker on the computed colours)
# D11: curl -s https://plantit.kalpkan.com/api/nope  → {"error":"No route GET /api/nope"}
```

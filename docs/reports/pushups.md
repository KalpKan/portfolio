# pushups (Pushup Form Tracker) functional audit — 2026-09-19 (TEST + CRITIQUE round 2)

Live URL https://pushups.kalpkan.com · Repo `KalpKan/pushup-tracker-web` (local `~/projects/pushups`, audited at `0dbdc48`, clean, = `origin/main`; production deployment `pushups-mgen7b0v8` built 21:16 UTC from that commit: the live `assets/session-L_dago3h.js` is byte-identical to the local build apart from the `index-*.js` import hash, which carries the PostHog key) · Vercel project `pushups` (repo root, framework Vite, static) · Database none · Health route `https://pushups.kalpkan.com/health.json` → `{"ok":true,"service":"pushups"}` · CI run `35469904988` green on `0dbdc48`.

Spec and bars: `docs/reports/pushups-spec.md`. Round-1 report: the previous version of this file (its D1–D14 are re-tested in the table below). Method: real Chrome 151 (claude-in-chrome) on the live URL for the load path, resource list, console and the **browser-cache probe** (the shared MCP tab is hidden, so `<video>` never starts there; the round-1 limitation); real Chrome headless (puppeteer-core, `--use-gl=angle --use-angle=metal`, the Mac GPU) on the live URL for everything that moves: the repo's `scripts/e2e-corpus.mjs` on all 15 ground-truth clips **three consecutive times** (load average 12–40 with another agent's Chrome on the same GPU), `scripts/e2e-demo.mjs` ×3, a canvas `fillText` hook that timestamps every hint / verdict / rep flash drawn on the overlay (black, two-people, cropped, frontal and portrait synthetic cameras plus `IMG_1359`, `IMG_1305`, `IMG_1512`), CPU throttling ×4 and ×20 on the camera path, stop/restart/double-start/deny, hosts and post-load requests, 360/390/430/1280 px in both colour schemes with a layout-shift observer, a portrait 390 px phone with a 360×640 camera, Lighthouse 12 mobile; the Python, browser-recorded and live-recorded landmark traces replayed through `src/tracker.ts` at 30/20/15/10 fps; `npm test` (117 passed + 2 expected fails, corpus gate on by default); `impeccable detect`. Every log, JSON, script and screenshot is in `docs/reports/evidence/pushups-r2-*`.

## Verdict: PARTIALLY WORKING

The counting is now what the spec asked for: on the live site the 15 clips give **the same attempts and good numbers in all three runs**, 14/15 are inside the tolerance (attempts within ±1 on 15/15; the miss is two clean reps in `test_video` scored "keep your body straight"), the first rep counts, no clip over-counts, standing/kneeling/resting/partials add 0 attempts, the pipeline runs at 27–30 fps (min 23) and the attempts do not change at 20/15/10 fps or under ×4 CPU throttling. The demo reports 4/4 three times, hints for dark / two people / feet out / head out appear in 0.74–1.0 s, stop kills the track, restart resets, refusal is handled, only `/ingest/*` after load, 0 console errors, Lighthouse 0.98, CLS 0, no horizontal scroll, the placement sentence is the first line of the page. Round-1 D1, D2, D4, D6, D7, D8, D9, D10, D11, D12, D13 are fixed and D3, D5, D14 mostly.

Two things stop it being consumer-grade. **(1) Every returning visitor gets a dead page**: the classifier was retrained with a different input shape (36 → 24) but kept the same URL under `cache-control: immutable, max-age=31536000`, so a browser that visited before 21:17 UTC today (Kalp's own Chrome does, verified: it serves the 36-input `model.json` from cache) loads the new code with the old model, throws `expected keypoints to have shape [null,36] but got array with shape [1,24]` on every frame inside the frame loop, draws nothing and ends the demo with "Clip finished: 0 good of 0"; the camera path fails the same way with no message. A first-time visitor and every headless run in this report are unaffected, which is why the numbers above look good. **(2) One rep in five gets the wrong verdict**: 56/69 high-confidence reps match their label on the live overlay (bar: all). Six clean reps are called bad (the demo's own first rep reads "keep your body straight"), five bad reps are called good (the demo's worm rep reads good, and three of the five bad-form clips show one good rep), and a knee pushup is not an attempt at all.

## Round-1 defects re-tested

| R1 | Title | Status now | Evidence |
|---|---|---|---|
| D1 | First rep lost, sets under-counted (4/15) | **fixed** | 15/15 attempts within ±1 in three live runs; first labelled bottom → first counted event within 0.4–1.0 s on 14/15 clips (`pushups-r2-corpus-live-run{1,2,3}-2026-09-19.log`, run-1 traces). `IMG_1305`'s first rep begins before frame 0 (shoulder already 1/3 down, `mediaTime` 0.08 s y = 0.29 vs top 0.17) and is reported as a partial: see limitations |
| D2 | Different counts on consecutive runs (6/15) | **fixed** | `attempts/good` identical on **15/15** clips across runs 1, 2, 3 |
| D3 | Single-frame verdict; `test_video_4` tops all bad; pike/kneeling "Good form 100 %" | **mostly fixed** | `test_video_4` 5/4 ×3 (was 4/0); pike at `IMG_1512` 32.6 s → "Rep 6: hips too high" (montage); kneeling at `IMG_1359` 5.5 s → "Bad form: knees down", never counted; verdict = majority of the end window (`repCounter.ts:134-149`). Residual: 13/69 verdicts wrong → new D2 |
| D4 | No reason for a bad verdict | **fixed** | overlay "Bad form: keep your body straight / hips sagging / hips too high / knees down", flash "Rep N: <reason>", tile "bad: <reason>" (montage, fillText timelines) |
| D5 | No placement hints beyond "no pose" | **mostly fixed** | dark 741 ms, two people 748 ms, feet out 739 ms, head out ≈ 1 s on `IMG_1359`; residual: debounce resets on intermittent detection (new D4), counting continues under a hint (new D5) |
| D6 | Count depends on the frame rate | **fixed** | attempts identical at 30/20/15/10 fps on 15/15 clips on all three trace sets (`pushups-r2-framedrop-table-2026-09-19.txt`); live ×4 CPU throttle (20–27 fps) same counts on 6/6 clips |
| D7 | Demo 2/1 at "60 fps" | **fixed** | `4 / 4` at 24–30 fps ×3, `hosts: ["pushups.kalpkan.com"]`, `errors: []` (`pushups-r2-demo-run{1,2,3}-2026-09-19.json`); the verdicts inside it are wrong → new D2/D7 |
| D8 | Bad clips 2 of 4 attempts | **fixed** | `bad_IMG_4456/4470/4451` 4 attempts ×3 runs |
| D9 | "Step back" in the dark | **fixed** | black camera → "Too dark: turn a light on or uncover the camera" at 741 ms |
| D10 | Placement sentence below the fold | **fixed** | lede "Phone or laptop on the floor, side-on, whole body in frame, one person." at y = 85 px at 390 × 844 (`pushups-r2-phone390-2026-09-19.jpg`) |
| D11 | 2 fps first second | **fixed** | shader warm-up before `play()` (`session.ts:47-57`); fps min per clip 23–30 across 45 clip-runs, including the first clip of a fresh browser (25) |
| D12 | Stats below the fold in portrait | **fixed** | 390 × 844 with a 360 × 640 camera: page scrolls to the stage on Start, canvas 358 × 439 (52 vh cap), stats bottom at y = 621 (`pushups-r2-portrait390-live-2026-09-19.jpg`); count 5/5 on the portrait clip |
| D13 | Stale tiles after Stop | **fixed** | after Stop: form "–", fps "–", status "Stopped: 2 good reps of 2 attempts." |
| D14 | Limits copy, "1 attempts" | **mostly fixed** | Tips name the frontal view, the second person, the pike and kneeling; "1 attempt" singular. Residual: the Tips say the demo has "2 good" while the app reports 4 → new D7 |

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load and understand; ≥ 0.85 Lighthouse; no horizontal scroll at 360/390/430; buttons ≥ 44 px; placement sentence above the fold at 390; nothing heavy before a click; CLS ≤ 0.1 | **PASS** | `HTTP/2 200`, `server: Vercel`, health ok. Lighthouse mobile **performance 0.98**, accessibility 1.00, best-practices 1.00 (FCP 1.1 s, LCP 1.9 s, TBT 40 ms, CLS 0). `scrollWidth == innerWidth` at 360/390/430/1280 in dark and light (the page is dark-only by design), layout-shift 0 in all eight loads, both buttons 50 px, lede at y = 85 px at 390, `heavy: []` before a click; real Chrome resource list before a click: `index-*.js` 2.3 KB, CSS, `analytics-*.js`, three `/ingest/*` PostHog files (`pushups-r2-ux-checks-2026-09-19.json` `layout`) |
| S2 | Live count on a laptop: 15/15 within tolerance, first rep counted, ≥ 15 fps avg and never < 10, identical on 3 runs | **FAIL (1 clip)** | `GPU=1 node scripts/e2e-corpus.mjs https://pushups.kalpkan.com/` ×3: **14/15, 14/15, 14/15**, every clip's numbers identical across the runs. Per clip (attempts/good; truth): demo 4/3 (4/2–3), test_video3 5/4 (5/2–4), **test_video 4/0 (4/2)** miss, test_video_2 3/1 (4/0–2), test_video_4 5/4 (5/4), good_IMG_4378 8/8, good_IMG_4409 5/5, bad_IMG_4456 4/1 (4/0), bad_IMG_4470 4/1 (4/0), bad_IMG_4451 4/0, IMG_1305 5/5 (6/6), IMG_1359 9/8 (9/9), IMG_1360 6/5 (6/6), IMG_1512 6/5 (6/4), IMG_1513 1/1 (1/0). fps avg 29.7 over 45 clip-runs (lowest per-clip avg 27), min 23. The first rep is counted on every clip that starts in a plank (event 0.4–1.0 s after the labelled bottom). Offline gate: python 14/15, browser 14/15, same miss. **But a returning visitor sees 0/0 with no skeleton** (D1) |
| S3 | Bad form is not a good rep: red skeleton + reason, attempts up, good flat; the five bad clips 0 good; high-confidence bottom verdicts match; 3-frame majority | **FAIL** | Red skeleton and a reason on every bad frame and every bad rep (montage: "Bad form: keep your body straight", "hips too high", "knees down"; flash "Rep 6: hips too high"). Bad clips: `bad_IMG_4451` 0 good, but **`bad_IMG_4456` 1 good (rep at 5.1 s), `bad_IMG_4470` 1 good (3.8 s), `IMG_1513` 1 good (its only rep, labelled bad)** in all three runs; `test_video_2` 1 good of 0–2 ok. High-confidence verdicts on the live overlay **56/69** (python traces 62/69, browser traces 57/69; bar: all). Majority windows exist (`repCounter.ts:134`, `tracker.ts:46-62`) and the verdict no longer flips per frame. Knee pushup (`test_video_2` 12–19 s): "Bad form: knees down" live but **0 attempts** (D3) |
| S4 | Pace and camera: the five edge clips within tolerance; standing/kneeling/resting/partials add 0; mid-descent start counts only after a top | **PASS** | IMG_1305 5/5 (6), IMG_1512 6/5 (6/4), IMG_1359 9/8 (9), IMG_1360 6/5 (6), test_video3 5/4 (5/2–4): all within ±1. Not-rep windows: 0 events inside any of the 14 windows on all trace sets (`corpus.test.ts` "no rep inside the not-rep windows" ×2 sets, live run-1 trace: IMG_1360's quarter dip → "Go lower" flash at 9.0 s, IMG_1512's two partials → one "Go lower", test_video3 stands up → nothing, IMG_1359 kneels → "knees down", nothing counted). IMG_1513: 1 attempt after the top at 2.5 s (right), graded good (wrong, D2). No clip over-counts in 45 runs |
| S5 | Demo clip: 3–5 attempts, 1–4 good, identical each play, own host only, no console errors | **PASS (partial)** | `GPU=1 node scripts/e2e-demo.mjs https://pushups.kalpkan.com/` ×3: **4 attempts / 4 good** all three times, "30 fps / 24 fps / 25 fps", `hosts: ["pushups.kalpkan.com"]`, `errors: []`, status "Clip finished: 4 good of 4. Play it again or start your camera.", canvas 640 × 360. Inside the band, but the per-rep verdicts are 2/4 wrong (the 6.2 s worm ascent reads good; in camera mode the same clip reads 4/3 with the first clean rep "keep your body straight") and the page promises "4 attempts, 2 good" (D7). **A returning visitor gets "Clip finished: 0 good of 0"** (D1) |
| S6 | Phone front camera: mirrored ≤ 100 % width, ≥ 8 fps, count independent of frame rate, portrait stats visible | **PASS (partial) / device untested** | Mirroring: `session.ts:108` + `draw.ts:31-34` (canvas flipped, text not). Frame-rate independence: attempts identical at 30/20/15/10 fps on **15/15** clips on the python, browser and live-run-1 traces; good reps differ by 1 at some rate on 1/15, 4/15 and 3/15 clips (classifier mean near 0.5). Live camera path with ×4 CPU throttling (20–27 fps): same counts as unthrottled on 6/6 clips (`pushups-r2-cpu-throttled-2026-09-19.log`). At ×20 (3–9 fps, below the README's 8 fps floor) fast reps are lost: IMG_1305 4/4, demo 1/1, IMG_1359 still 9/8 (D8). Portrait 390 × 844 with a 360 × 640 camera: canvas 358 × 439, stats fully visible (bottom 621), no overflow, 5/5 on the clip. Real iPhone/Android: H15 |
| S7 | Placement hints: no pose > 1 s, head/feet out, two poses, frontal, gone within 1 s, never over the count | **PASS (partial)** | fillText timelines (`pushups-r2-ux-checks-2026-09-19.json` `hints`): black → "Too dark: turn a light on or uncover the camera" at **741 ms**; two people → "Only one person in the frame, please" at **748 ms**; frontal upper body → "Feet out of frame: move the camera back" at **739 ms** (feet outrank frontal in `hints.ts:33-38`); `IMG_1359` head off at the top → "Head out of frame: move the camera back or tilt it up" from 3.0 s (≈ 1 s after the head left) to 6.4 s, gone 0.5 s after the head is back. Hints sit at the bottom centre, the count top-left (montage). Failures: a **cropped body that MediaPipe half-detects shows no hint for 4.5 s** and counts "Rep 1: good" with no head in the frame, then the generic "Step back…" (D4); `IMG_1512` lying flat at the bottom triggers a false "Only one person" for 1.2 s (D6); counting and verdicts continue under a hint (D5) |
| S8 | Stop ends the track, restart 0/0, refusal message + demo enabled, double start = one loop | **PASS** | After Stop: track `["ended"]`, `srcObject` null, Stop hidden, Start enabled, status "Stopped: 2 good reps of 2 attempts.", tiles "–"; restart → 0/0 at 31 fps; two `click()`s in one tick → one session (31 fps, one status); `--deny-permission-prompts` → "Camera permission was refused. You can still watch the demo clip.", demo enabled, stage back to the placeholder |
| S9 | Private and offline: only `/ingest/*` after load, no landmarks in events, second visit cached, health ok | **PASS (and the cache is the blocker)** | Hosts during a full camera session: `["pushups.kalpkan.com"]`; requests after load excluding `/wasm/ /models/ /assets/`: `POST /ingest/i/v0/e/` ×7 (≤ 2 KB each), `POST /ingest/s/` ×3 (session replay, DOM only). `analytics.ts` events carry `mode` / `good` / `reason` (a word). Real Chrome second visit: `model.json`, `.bin`, `vision_wasm_internal.*`, `pose_landmarker_full.task` all `deliveryType: "cache"`, `transferSize 0`. `/wasm/*` and `/models/*` `cache-control: public, max-age=31536000, immutable`. Console errors: **0** in 45 corpus runs, 3 demo runs, 7 hint runs, the controls run. That immutable cache is what serves the wrong classifier to returning visitors (D1) |
| S10 | Honest about limits on the page and in the README | **PASS (partial)** | Page "How it decides / Tips": trained on Kalp's clips, one orientation, "a frontal view is not graded; with a second person in the frame the biggest body is tracked; a pike (hips high) and kneeling are caught by geometry, a shallow sag mostly by the classifier". README "Limits (honest ones)" says the same plus 2D geometry and the 8–15 fps phone rate; "How to run this" is accurate (`npm install`, `npm run dev`, `npm test` → 117 passed + 2 expected fails). Residual: Tips claim the demo gives "4 attempts, 2 good" while the app says 4 good (D7) |

Global: `npm test` (vitest `--pool=forks --maxWorkers=1`) 7 files, **117 passed, 2 expected fail** (the `test_video` known miss on both trace sets, `it.fails`); the corpus gate is on by default (no env variable any more; `PUSHUPS_CORPUS_GATE=1` is accepted and changes nothing); CI `35469904988` green on `0dbdc48`; static Hobby, $0, no deploy made by this round; `impeccable detect --json index.html` → 1 warning (`flat-type-hierarchy`), the same false positive as round 1 (sizes live in `src/style.css`).

## Defects

### D1 — Returning visitors get a dead page: the retrained classifier kept its URL under a one-year immutable cache, so the cached 36-input model meets code that feeds 24 inputs

Severity: **blocker** (S2, S5; every visitor who pressed a button before 2026-09-19 21:17 UTC, including Kalp's Mac Chrome and, if he did H15, his phone)

Steps to reproduce: in a browser that opened the site before the fix deploy (Kalp's Chrome: `fetch('/models/form/model.json').then(r => r.json())` → `batch_input_shape [null, 36]`, `deliveryType: "cache"`, while `fetch(…, {cache: "reload"})` → `[null, 24]`), press **Play demo clip** or **Start camera**. Reproducible from scratch: `node docs/reports/evidence/pushups-r2-stale-cache.mjs https://pushups.kalpkan.com/ <dir with 4f0708e's public/models/form/> <out>` (answers the two model requests with the v1 files, exactly what the HTTP cache does).

Expected / Actual: the site works, or at worst a message. Actual: black stage, no skeleton, count 0/0, **254 uncaught errors** `Error when checking : expected keypoints to have shape [null,36] but got array with shape [1,24]`, then "Clip finished: 0 good of 0. Play it again or start your camera." (`pushups-r2-stale-cache-demo-2026-09-19.jpg`). The camera path: the same, with no message at all.

Evidence: `curl -sI https://pushups.kalpkan.com/models/form/model.json` → `cache-control: public, max-age=31536000, immutable`, `last-modified: 19 Sep 2026 21:17:41`; `git show 4f0708e:public/models/form/model.json` → 36 inputs, `group1-shard1of1.bin` 60 420 B; HEAD → 24 inputs, 5 380 B; `vercel.json` `headers` `/models/(.*)`; real-Chrome probe in this session (`deliveryType: "cache"`, 60 420 B served).

Likely cause: `vercel.json:18-25` marks everything under `/models/` immutable for a year (right for the 9.4 MB pose model, which never changed), and `src/classifier.ts:36` loads the classifier from the fixed path `/models/form/model.json`; `c446bcb` replaced the files in place. Second fault: `session.ts:149-190` `step()` runs inside the `requestVideoFrameCallback` loop with no try/catch, so an exception per frame is invisible to the visitor (the loop keeps re-arming, `frames++` never runs, the fps tile stays "–").

Suggested fix: version the classifier's URL (e.g. `public/models/form-v2/…` or import `model.json` through Vite with `?url` so the filename carries a hash, and update `scaler.ts`/tests), and drop `immutable` for the small classifier files (or add a `?v=<hash>` query in `loadClassifier`). Wrap `step()` in try/catch: stop the session, set the status to "Something went wrong: <message>. Reload the page." and report it as a PostHog event, so a broken pipeline is never silent. Add a verification row that fetches `model.json` from a cold cache and asserts the input shape matches `formFeatures`.

### D2 — One rep in five gets the wrong verdict: 13/69 high-confidence reps on the live overlay (6 clean reps called bad, 5 bad reps called good, 3 of the 5 bad-form clips show a good rep)

Severity: **major** (S3 bar "every high-confidence verdict matches"; S2's `test_video` miss; S5's demo verdicts)

Steps to reproduce: `GPU=1 REPORT_ONLY=1 TRACE_DIR=/tmp/t node scripts/e2e-corpus.mjs https://pushups.kalpkan.com/` and compare each clip's `event` list with `ground_truth.json`; or `npx vitest run --pool=forks --maxWorkers=1 tests/corpus.test.ts --reporter=verbose` and read "bottom verdicts".

Expected / Actual: verdict = label. Actual (live run 1): clean reps called bad: demo 0.8 s and test_video3 0.8 s "keep your body straight" (the first rep of the demo clip every visitor watches), test_video 13.5 s + 15.0 s "keep your body straight" (→ `test_video` 4/0 vs 4/2, the one corpus FAIL), IMG_1359 13.6 s "hips too high", IMG_1360 10.0 s "hips sagging". Bad reps called good: demo 6.2 s and test_video3 6.2 s (lies on the floor, chest first: the worm), bad_IMG_4456 5.1 s, bad_IMG_4470 3.8 s, IMG_1513 5.7 s (the only rep of a bad clip). `[python]` 62/69, `[browser]` 57/69, live 56/69; the test ratchet is at 0.8.

Evidence: `pushups-r2-npm-test-2026-09-19.txt` (both "bottom verdicts" lists), run-1 traces summarised in the report's S3 row, montage panel `IMG_1512-31s` ("Rep 5: good" on the rep that ends in a pike), `demo` fillText timeline.

Likely cause: the classifier (`src/classifier.ts`, 24 hip-centred x/y inputs) is the only signal for a shallow sag and the worm, it is trained on one person, and its mean probability over the bottom window sits near 0.5 on those reps (`repCounter.ts:144-147`); it is disabled for the other facing (`form.ts:97`), so the other person's reps are judged by the geometry only, whose thresholds (`SAG_DEV 0.18`, `PIKE_DEV -0.26`, `form.ts:47-48`) were tuned on the same clips and still misfire on IMG_1359/1360's tops. The worm (chest rises before the hips) is a *temporal* fault that no single-frame measure sees: at the bottom window the body is straight on the floor.

Suggested fix: add a rule for the worm on the ascent (hip deviation integrated over the first half of the rise, or the hip's rise lagging the shoulder's by more than a fraction of the depth); raise the classifier's training set with the corpus's labelled bottoms of the second person (or gate it on a confidence margin, e.g. only "bad" below 0.35, and say "form: unsure" between); loosen `SAG_DEV`/`PIKE_DEV` at the top window where the body is loaded differently; then raise `BOTTOM_VERDICT_MIN` to the measured value and remove `test_video` from `KNOWN_MISSES`.

### D3 — A knee pushup is not an attempt

Severity: **major** (S3 "on my knees … the attempts number go up and the good reps number stay put")

Steps to reproduce: `test_video_2` 12–19 s (knee pushup, labelled bad rep at 15.9 s), or do a set on the knees.

Expected / Actual: attempts +1 with "knees down". Actual: the live tile reads "bad: knees down" throughout, but the counter needs `plank` (knee angle ≥ 130°) to open a descent (`repCounter.ts:184`), so the rep is never counted: `test_video_2` 3 attempts of 4 in all runs (inside the ±1 tolerance, so no red in the harness, but the story is not met and a visitor doing knee pushups sees "0 attempts" for the whole set).

Evidence: run-1 trace `test_video_2` frames 12.0–19.1 s: `plank=False faults=knees down`, no event; the corpus table's `test_video_2 total 3 (want 4)`.

Likely cause: `plank` doubles as "eligible top" and "eligible to start a rep"; kneeling was excluded because kneeling *to rest* must not count (IMG_1359 5.1–5.9 s, IMG_1513 7.7 s), and both look the same to the gate.

Suggested fix: let a descent open from a kneeling top too, but only when the body angle is plank-like (≤ 30°) and the knees stay on the floor through the rep, and grade it "knees down"; keep the rest case out with the existing depth rule (a rest drop has no matching ascent within the rep window). Add the `test_video_2` 15.9 s rep as an expected `bad:knees down` event in `corpus.test.ts`.

### D4 — Hints never appear while a body is half-detected: a cropped body counted "Rep 1: good" with no head in the frame and no hint for 4.5 s

Severity: **major** (S7 "head or feet out of frame for > 1 s → say so"; the count taken meanwhile is what a visitor trusts)

Steps to reproduce: `node docs/reports/evidence/pushups-r2-ux-checks.mjs https://pushups.kalpkan.com/ <out> <dir>` with `cropped-right.mjpeg` (`good_IMG_4378` with the right 28 % cut off, so the head is outside the frame), or prop the phone so the head is cut off.

Expected / Actual: "Head out of frame…" within 1 s, no counting. Actual: MediaPipe alternates between no pose and a pose with the nose extrapolated inside the frame; every alternation restarts the 700 ms debounce (`session.ts:139-147`, `raw !== hintCandidate`), so no hint at all until 4.5 s, when the generic "Step back so your whole body is visible" appears; meanwhile "Good form" was drawn on 57 frames and **"Rep 1: good"** was counted at 3.1 s (`hints.cropped-right` timeline, montage `cropped-right-2s`: 0 attempts, no skeleton, no hint).

Evidence: `pushups-r2-ux-checks-2026-09-19.json` `hints["cropped-right"]`; compare `IMG_1359`, where the head leaves cleanly and the hint comes in ≈ 1 s.

Likely cause: the debounce is per exact string and resets on any change, including null; and `hints.ts:33` decides "head out" from the nose's coordinates/visibility only, which MediaPipe fills in with a guess when the head is just outside the frame.

Suggested fix: debounce on a "problem present" state with hysteresis (keep the last hint for 700 ms after it stops being raised; require 700 ms of *continuous* clean frames to clear) and treat "no pose" and "head out" as the same family; also read the eye/ear landmarks' visibility (MediaPipe drops it below 0.5 when the face is out) and treat a pose whose nose is within 2 % of the edge *or* whose head landmarks are invisible as "head out". Pause the counter (do not open a descent) while any hint is raised.

### D5 — Counting and verdicts continue while a placement hint is up

Severity: **minor** (S7 "instead of a silent wrong count"; the hint is there, but the count runs anyway)

Steps to reproduce: two-people clip (both doing pushups); the frontal clip.

Expected / Actual: the hint pauses counting or says the count is paused. Actual: "Only one person in the frame, please" from 0.75 s **and** 4 attempts counted on the biggest body under it; the standing frontal person gets a green skeleton, "Good form", then "Bad form: keep your body straight" under "Feet out of frame: move the camera back" (montage `two-people-2s`, `frontal-2s`).

Evidence: `hints["two-people"]` (`total 4`), `hints.frontal` timeline.

Likely cause: `session.ts:156-169` runs the tracker whenever a visible pose exists; the hint is computed afterwards (`:171`) and only drawn.

Suggested fix: compute the hint first; when one is raised skip `tracker.push`, draw the skeleton in grey and hide the verdict, and show "paused" next to the count.

### D6 — A false "Only one person in the frame" while lying flat, and "keep your body straight" is not a reason a beginner can act on

Severity: **minor** (S3 wording, S7 false positive)

Steps to reproduce: `IMG_1512` 3.5–4.2 s (rests flat at the bottom).

Expected / Actual: no hint. Actual: "Only one person in the frame, please" for 1.2 s (3.8–5.0 s, montage `IMG_1512-4s`): MediaPipe returns two poses for one body lying flat. Separately, the classifier's fault is shown as "keep your body straight" on 60 % of bad reps in the corpus, which does not say *what* to straighten.

Evidence: `hints.IMG_1512` timeline; run-1 events (`bad:keep your body straight` ×14 of 24 bad events).

Likely cause: `hints.ts:30` trusts `poses.length > 1` without checking that the second pose is a different body (its size, or an overlap with the first); the classifier has one output.

Suggested fix: count a second person only when the second pose's torso is ≥ 40 % of the first's and its bounding box overlaps the first's by < 50 %; when the classifier alone says bad, choose the wording from the geometry's sign (`hipDev > 0` → "hips sagging a little", else "keep your body straight") so it is at least directional.

### D7 — The demo's verdicts contradict its own caption, and the same clip grades differently in demo and camera mode

Severity: **minor** (S5, S10; the totals are inside the band)

Steps to reproduce: press **Play demo clip**; read the Tips bullet; play the same file through the fake camera.

Expected / Actual: the page says "4 attempts, 2 good"; the demo reports **4 good of 4** (the 6.2 s worm ascent is graded good); the fake camera on the identical file reports 4/3 (the first clean rep is graded "keep your body straight"). Both are inside 3–5 / 1–4, both are wrong on at least one rep, and the two modes disagree.

Evidence: `pushups-r2-demo-run{1,2,3}-2026-09-19.json`, `pushups-r2-corpus-live-run1-2026-09-19.log` `demo 4/3`, `index.html:62`.

Likely cause: D2 (classifier mean ≈ 0.5 at those two bottoms: 0.73 in demo mode, < 0.5 in camera mode because the MJPEG re-encode shifts the landmarks slightly).

Suggested fix: D2; then make the caption "4 attempts, 2–3 good" or, better, pick a demo clip whose every rep the pipeline grades the way a human does.

### D8 — Below ~7 fps the fast reps are lost and the page does not say so

Severity: **minor** (S6; the README promises 8–15 fps on a phone and the trace tests hold at 10 fps, but nothing on the page warns when the device is slower)

Steps to reproduce: `node docs/reports/evidence/pushups-r2-throttled.mjs https://pushups.kalpkan.com/ <out> 20 IMG_1305 demo` (×20 CPU throttling → 3–7 fps).

Expected / Actual: a warning ("your device is too slow for a reliable count") or a degraded but honest count. Actual: IMG_1305 4/4 (truth 6/6), demo 1/1 (truth 4/2–3), fps tile "3 fps" with no comment; IMG_1359 at 9 fps still 9/8, bad_IMG_4470 at 4 fps 4/1.

Evidence: `pushups-r2-cpu-throttled-2026-09-19.log` (×4 block: all six clips identical to unthrottled at 20–27 fps; ×20 block).

Likely cause: a 0.7 s rep sampled at 3–4 fps has 1–2 frames per phase; `repCounter.ts` needs a sample near the top and one near the bottom.

Suggested fix: when the measured fps stays < 8 for 2 s, show "Slow device: fast reps may be missed, slow down a little" under the count; consider the lite pose model as a fallback when fps < 8 (the classifier would need retraining on its landmarks, see the incidents entry from T3.1).

## UX critique (impeccable, critique mode)

⚠️ DEGRADED: single-context (this session exposes no sub-agent tool; Assessment A was written before the detector output was read, Assessment B = `impeccable detect --json index.html` → 1 warning `flat-type-hierarchy`, a false positive: `h1` is `clamp(1.6rem, 5vw, 2.4rem)` in `src/style.css`). Mode: **Operate**.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Count, live verdict, per-rep flash, hints and an end summary all exist now; nothing says "paused" under a hint, nothing warns at 3 fps, and a broken pipeline (D1) shows a black box with "0 good of 0" |
| 2 | Match system / real world | 3 | "hips sagging / hips too high / knees down / go lower" are coach words; "keep your body straight" is not; "attempts" is still a developer's noun for "reps" |
| 3 | User control and freedom | 3 | Stop/restart/deny are clean and the stop line keeps the result; no way to reset the count without stopping the camera, no "start counting now" |
| 4 | Consistency and standards | 3 | The same clip is graded 4/4 in demo mode, 4/3 through the camera, and "2 good" in the copy (D7) |
| 5 | Error prevention | 2 | Placement hints arrive in < 1 s for dark / two people / feet / head, but counting keeps running under them (D5) and a half-detected body slips through (D4); the cache trap (D1) was preventable |
| 6 | Recognition rather than recall | 4 | The placement rule is the first sentence, the reasons are on the video where the eye is, the Tips explain every hint the overlay can show |
| 7 | Flexibility and efficiency | 2 | No sound or haptic per rep (a visitor at the bottom of a pushup cannot read the screen), no target, no per-rep list |
| 8 | Aesthetic and minimalist design | 3 | Dark panel, yellow count, green/red skeleton read well; the four tiles duplicate the canvas; the "How it decides" prose is long for a phone |
| 9 | Error recovery | 1 | The one failure a real visitor will hit today (D1) surfaces as nothing: no message, no reload prompt, 254 silent exceptions |
| 10 | Help and documentation | 3 | Honest "How it decides / Tips / Limits"; still no "why was my rep not counted?" and the demo caption is wrong |
| **Total** | | **27/40** | needs work (round 1: 23/40) |

Design specificity: authored for this product (the placement sentence leads, the reasons are on the video, the limits are specific to this classifier); the interaction is now a coach's, not a console's, except for "keep your body straight" and "attempts". Strengths: the first rep counts and the count is the same every time, which is the thing the page is for; the hint set covers the real placement mistakes and fires within a second; the end-of-session line ("Stopped: 2 good reps of 2 attempts.") gives the result a home. Priority issues: [P0] returning visitors get a dead page (D1); [P1] one rep in five mis-graded and the demo mis-grades two of its four reps (D2, D7); [P1] counting under a hint and the half-detected body (D4, D5); [P2] no per-rep sound; [P2] "keep your body straight", "attempts". Persona red flags: *first-timer on a phone (Kalp, H15)* opens the site he opened yesterday → black box, "0 good of 0", blames the phone; *sceptic* watches the demo, sees rep 1 (clean) flagged bad and rep 4 (worm) flagged good, closes the tab; *power user* wants a beep, a target and a rep log, gets a probability-free but silent count. Questions skipped: Kalp is not watching this run.

## Known limitations that are NOT defects

- `IMG_1305`'s first labelled rep (bottom 0.7 s) begins before the clip's first frame (shoulder already a third of the way down at `mediaTime` 0.08 s), so the pipeline reports it as a partial ("Go lower") and counts 5 of 6: inside the ±1 tolerance and consistent with the ground truth's own rule ("a clip that starts mid-descent does not get that rep"). The label and the rule disagree on this clip; the fixer may relabel `total: 5`.
- iOS Safari / Android Chrome on a real phone could not be driven from this Mac; S6's device half stays with H15 (which will hit D1 until it is fixed and Kalp's phone cache expires or is cleared). Mirroring, `facingMode: "user"`, width and portrait layout were verified in headless Chrome with a portrait fake camera.
- The claude-in-chrome tab is hidden (`document.hidden`), so `<video>` never plays there; the live pipeline was exercised in headless real Chrome on the same URL with the GPU. The hidden tab was still useful: it is the browser that proved D1 from Kalp's own cache.
- Another agent's headless Chrome shared the GPU during every run (load average 12–40); the counts did not move and fps stayed ≥ 23, which is itself evidence for the time-based counter.
- Light colour scheme: the site is dark-only by design (`color-scheme: dark`); both schemes render the identical page.
- Two of the external clips show another person and the classifier is deliberately not consulted for the non-training facing (`form.ts:97`); their verdict misses in D2 are the geometry's, not the classifier's.
- PostHog session replay records DOM events, not canvas pixels (`recordCanvas` off), so "no frame leaves the device" holds.
- At 3–4 fps (×20 CPU throttling) nothing time-based can count a 0.7 s rep; D8 asks for a warning, not a miracle.

## How a fixing agent should verify the fix

```bash
cd ~/projects/pushups
npm test                                                   # 7 files; after D2: 119 passed, 0 expected fail (remove test_video from KNOWN_MISSES, raise BOTTOM_VERDICT_MIN)
npx vitest run --pool=forks --maxWorkers=1 tests/corpus.test.ts --reporter=verbose 2>&1 | grep -E "bottom verdicts|MISS"   # ≥ 66/69 on both sets, no MISS
npm run build && npx vite preview --port 4177 --strictPort &
# D1: the classifier URL must change (or lose `immutable`) and a stale cache must show a message, not a black box
node ~/projects/portfolio/docs/reports/evidence/pushups-r2-stale-cache.mjs http://localhost:4177/ <dir with 4f0708e public/models/form> /tmp   # expect: the status names the problem, 0 uncaught errors per frame
curl -sI https://pushups.kalpkan.com/models/form/model.json | grep -i cache-control          # after the deploy: not immutable at the old path, or the path is gone (404)
for i in 1 2 3; do GPU=1 node scripts/e2e-corpus.mjs http://localhost:4177/; done             # 15/15 PASS ×3, identical got columns, fpsMin ≥ 10
for i in 1 2 3; do GPU=1 node scripts/e2e-demo.mjs http://localhost:4177/; done               # same numbers each time, errors []
node ~/projects/portfolio/docs/reports/evidence/pushups-r2-ux-checks.mjs http://localhost:4177/ /tmp/ux <dir with black/two-people/cropped-right/frontal/portrait .mjpeg>   # D4: hints["cropped-right"] shows a head/no-pose hint < 1000 ms and total 0; D5: two-people total 0
node ~/projects/portfolio/docs/reports/evidence/pushups-r2-throttled.mjs http://localhost:4177/ /tmp/thr 4 IMG_1305 bad_IMG_4456,2.2 test_video_2   # same counts as unthrottled; test_video_2 4 attempts after D3
pkill -f "vite preview --port 4177"
```

The synthetic cameras are built with the `.venv` ffmpeg: black `-f lavfi -i color=c=black:s=640x360:r=30 -t 12`; two-people = `good_IMG_4409` and `bad_IMG_4456` each scaled to 320×360 and `hstack`ed; cropped-right = `good_IMG_4378` with `crop=iw*0.72:ih:0:0`; frontal = `~/projects/emotes/tests/fixtures/clips/e2e-three-gestures.mjpeg`; portrait = `good_IMG_4409` scaled/padded to 360×640; all MJPEG `-q:v 6`. Then on the live URL after the single deploy: `e2e-corpus.mjs` ×3 and `e2e-demo.mjs` ×3, the stale-cache script against the live host, the head-out screenshot of `IMG_1359` at 2 s, the knee set of `test_video_2` at 17 s (expect an attempt with "knees down"), Lighthouse ≥ 0.85, 360/390/430 px `scrollWidth == innerWidth`.

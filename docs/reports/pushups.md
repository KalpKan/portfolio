# pushups (Pushup Form Tracker) functional audit — 2026-09-18 (TEST + CRITIQUE round 1)

Live URL https://pushups.kalpkan.com · Repo `KalpKan/pushup-tracker-web` (local `~/projects/pushups`, audited at commit `06e245a`, clean, = `origin/main`; production deployment `pushups-87n4ptvqo` is `4f0708e`, and `git diff 4f0708e HEAD -- src index.html public` is empty, so the live bundle `assets/index-CReZYZ1E.js` is the audited source; the only non-test change since is the `vercel.json` `ignoreCommand`) · Vercel project `pushups` (repo root, framework Vite, static) · Database none · Health route `https://pushups.kalpkan.com/health.json` → `{"ok":true,"service":"pushups"}`

Spec and bars: `docs/reports/pushups-spec.md` (10 stories, §3 bar table, §5 root causes, §6 baseline). Method: real Chrome 151 (claude-in-chrome) on the live URL for the load path, resource list and console (the shared MCP tab is hidden, so `<video>` never starts there: `document.hidden === true`, the session stalls at "Loading the pose model…", the same limitation the spec and H15 record); real Chrome 151 headless (puppeteer-core, `--use-gl=angle --use-angle=metal`, the Mac GPU) on the live URL for everything that moves: the repo's own fake-camera harness `scripts/e2e-corpus.mjs` on all 15 ground-truth clips **three consecutive times**, `scripts/e2e-demo.mjs` three times, mid-clip stage screenshots, a 12 s black MJPEG for the no-pose hint, `--deny-permission-prompts` for the refusal path, stop/restart/double-start, host and request lists, 360/390/430/1280 px in dark and light schemes with a layout-shift observer; Lighthouse 12 mobile; the Python landmark traces replayed through `src/repCounter.ts` at 30/20/15/10 fps and per-rep verdicts compared with the labels (`docs/reports/evidence/pushups-r1-framedrop-replay.test.ts`); `npm test` and `PUSHUPS_CORPUS_GATE=1`; `impeccable detect`. Every harness JSON, log, screenshot and script is in `docs/reports/evidence/pushups-r1-*`.

## Verdict: PARTIALLY WORKING

The site loads fast and honestly (Lighthouse mobile 0.99, CLS 0, nothing heavy before a click, only `/ingest/*` after load, no console errors, permission refusal handled, stop really ends the camera track) and the pose pipeline runs at 26–30 fps on the GPU. But the one thing the page is for, counting pushups, is not trustworthy: on the live site with the 15 hand-labelled clips played into Chrome's camera the count is within tolerance on **4/15, 4/15 and 5/15** clips in three consecutive runs, every miss is an under-count (the first rep is lost on almost every clip, the three bad-form clips register 2 of 4 attempts, a 9-rep set shows 6), and **six of the fifteen clips give different numbers from run to run** (one 8-rep clip counted 7, then 0, then 7). Four clean reps in `test_video_4` yield 0 good reps because the classifier calls every top "bad"; a pike is scored "Good form 100 %" and counted as a good rep; kneeling to rest is "Good form 100 %"; a bad rep shows a percentage but never a reason; the only placement hint is "Step back so your whole body is visible", shown also when the room is dark, and never when the head or feet are out of frame; the demo clip reports 2 / 1 against a truth of 4 / 2–3 while analysing every frame twice. None of the six root causes in spec §5 has been touched (no commits since the spec). A stranger would do five pushups, see "3", and leave.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load and understand: what it does, Start camera + Play demo clip, a placement sentence (side-on, floor level, whole body, one person), nothing heavy before a click; `200` + Vercel, Lighthouse ≥ 0.85, no horizontal scroll at 360/390/430, buttons ≥ 44 px, placement sentence above the fold at 390 px, CLS ≤ 0.1 | **PASS (partial)** | `HTTP/2 200`, `server: Vercel`, `/health.json` ok. Lighthouse mobile: **performance 0.99**, accessibility 1.00, best-practices 1.00 (FCP 1.1 s, LCP 1.8 s, TBT 20 ms, CLS 0). `scrollWidth == innerWidth` at 360/390/430/1280 in both schemes, layout-shift total **0** in all eight loads (`pushups-r1-ux-checks-2026-09-18.json` `layout`). Both buttons 50 px tall. Resources before any click: `index-*.js` (3.8 KB), CSS, `analytics-*.js`, three `/ingest/*` PostHog files; no `/wasm/*`, `/models/*`, `/demo/*` (real Chrome `performance.getEntriesByType('resource')`, and headless `heavy: []`). **Placement sentence: the lede says only "side-on"; the full sentence ("Camera at roughly floor level, whole body in frame, side view, one person") is the fourth bullet of the Tips section at y = 886 px at 390 × 844, i.e. below the fold** (`pushups-r1-phone390-2026-09-18.jpg`) → D10. Light scheme renders the identical dark page (`color-scheme: dark`, no light tokens): by design, noted under limitations |
| S2 | Live count on a laptop: skeleton at ≥ 15 fps, good reps = N, every rep counted once including the first; e2e-corpus 15/15 PASS with attempts ±1 and good in [min−1, max+1], fps avg ≥ 15 and never < 10, identical numbers on 3 consecutive runs | **FAIL** | `GPU=1 node scripts/e2e-corpus.mjs https://pushups.kalpkan.com/` ×3: **4/15, 4/15, 5/15** within tolerance (`pushups-r1-corpus-live-run{1,2,3}-2026-09-18.{json,log}`). Per clip (attempts/good per run; truth): demo 1/0, 2/1, 2/1 (4 / 2–3); test_video3 2/1 ×3 (5 / 2–4); test_video 3/2, 3/3, 3/3 (4 / 2) pass; test_video_2 2/0 ×3 (4 / 0–2); test_video_4 4/0 ×3 (5 / 4); good_IMG_4378 **7/7, 0/0, 7/7** (8 / 8); good_IMG_4409 4/4 ×3 (5 / 5) pass; bad_IMG_4456, bad_IMG_4470, bad_IMG_4451 2/0 ×3 (4 / 0); IMG_1305 4/4, 2/2, 4/4 (6 / 6); IMG_1359 6/6 ×3 (9 / 9); IMG_1360 3/3, 5/5, 5/5 (6 / 6); IMG_1512 3/3, 4/4, 3/3 (6 / 4); IMG_1513 1/0 ×3 (1 / 0) pass. **Every miss is an under-count; the first rep is lost on 12/15 clips** (e.g. IMG_1305 at 3.0 s, two bottoms into the clip, still "0 attempts", montage panel 4). Consistency: **6/15 clips change numbers between runs** (demo, test_video, good_IMG_4378, IMG_1305, IMG_1360, IMG_1512) → D1, D2. Pipeline rate: avg 26–30 fps on every clip (45 clip-runs), min per clip 12–20 except the first clip of run 1 (**min 2 fps**, the fresh browser's model warm-up) → the "never < 10" half fails only there (D11). Skeleton drawn on every frame with a pose (montage). Offline: `PUSHUPS_CORPUS_GATE=1 npx vitest run tests/corpus.test.ts` → **10 failed / 7 passed** (5/15 clips), identical to the spec baseline |
| S3 | Bad form is not a good rep: red skeleton, a one-line reason, attempts up, good reps flat; bad clips 0 good ±1 with the right attempts; high-confidence verdicts match the label at the bottom; rep verdict from a 3-frame majority | **FAIL** | The three bad clips give **0 good** in all 9 runs (pass) but **2 attempts of 4** (fail, D1). Skeleton turns red and the label reads "Bad form 94 %" at the bottom of `bad_IMG_4456` at 2.2 s (montage panel 1) — **no reason is ever shown** (`src/draw.ts:61-65` prints only `Good/Bad form NN%`) → D4. Per-rep verdict at the labelled bottom on the traces: single frame matches the label on **67/69** high-confidence reps, the 3-frame majority also 67/69, so the bottom is fine; the failures are at the **top**: `test_video_4` reps 1–4 (labelled good, high) have P(good) = 0.07–0.16 on every top frame (y ≈ 0.41) → 0 good reps of 4 in all three live runs; and the two pike reps in `IMG_1512` (28.8 s medium, 32.6 s high, labelled bad) read "Good form 100 %" at 31 s and 33 s and were counted as good (5 good on screen at 31 s, montage panel 5) → D3. The verdict is still a single frame at each end (`src/repCounter.ts:66-68, 72-74`); a 3-frame majority does not exist in the code. In the `formPerSecond` strings of run 1 the label flips good→bad→good within one second on demo/test_video3 (`goodgoodbadgoodbadbad…`) |
| S4 | Consistent across pace and camera: fast (IMG_1305), slow with holds (IMG_1512), head out at the top (IMG_1359), quarter partial (IMG_1360), stands up (test_video3) each within tolerance; standing/kneeling/resting/partials add 0 attempts; a clip that starts mid-descent gets its first rep only after a top | **FAIL** | IMG_1305 4/4, 2/2, 4/4 vs 6; IMG_1512 3, 4, 3 vs 6; IMG_1359 6 vs 9 (all three runs); IMG_1360 3, 5, 5 vs 6; test_video3 2 vs 5. Phantom reps: **none** in any run (no clip ever over-counts; standing, kneeling, resting and the partials add 0 attempts: pass). IMG_1513 (starts at the bottom) counts 1 attempt / 0 good in all runs, exactly the truth: pass. The pace cases fail by under-count, not by double count |
| S5 | Demo clip: same overlay, 3–5 attempts and 1–4 good when it finishes, identical every play, hosts = own host, no console errors | **FAIL (partial)** | `GPU=1 node scripts/e2e-demo.mjs https://pushups.kalpkan.com/` ×3: **attempts 2, good 1** all three times (bar 3–5 / 1–4; truth 4 / 2–3), `hosts: ["pushups.kalpkan.com"]`, `errors: []`, status "Clip finished. Play it again or start your camera.", canvas 640 × 360, `scrollWidth == innerWidth`. Consistent but wrong; and `stat-fps` reads **"60 fps"** for a 30 fps clip (every frame analysed twice, spec §5.6, D7). In camera mode the same clip gave 1/0, 2/1, 2/1 |
| S6 | Phone front camera: mirrored preview ≤ 100 % width, skeleton and count at ≥ 8 fps, count independent of frame rate (traces with every third frame dropped give the same count), stats visible in portrait after Start | **FAIL (frame-rate) / untested (device)** | Mirroring is real: `src/session.ts:63` `mirror = mode === "camera"` and `src/draw.ts:25-28` flip the canvas; `getUserMedia({ facingMode: "user" })` at `session.ts:40`; `.stage canvas { width: 100% }`. **Trace replay: dropping every third frame (20 fps) changes the count on 3/15 clips** (bad_IMG_4456 3→2, IMG_1359 7→6, IMG_1512 4→3); at 15 fps 4/15 differ, at 10 fps **6/15** (also good_IMG_4409 5→4, bad_IMG_4451 2→1, IMG_1360 4→3) (`pushups-r1-framedrop-replay.test.ts`, output `pushups-r1-framedrop-replay-output-2026-09-18.txt`) → D6. Portrait: with a 480 × 640 front camera the stage at 390 px is 520 px tall starting at y ≈ 300, so the stats list sits at y ≈ 830+, below an 844 px viewport (the count is also drawn on the canvas top-left, which is what a visitor actually reads) → D12. A real iPhone/Android was not available (H15 stays open) |
| S7 | Placement guidance: no pose > 1 s → where to move; head/feet out > 1 s → say so; two poses or frontal → "turn side-on / one person"; hint gone within 1 s of fixing; hints never cover the count | **FAIL** | Black camera: "no pose" state and the hint "Step back so your whole body is visible" appear **510 ms** after the session starts (pass for timing; `pushups-r1-ux-checks…` `noPoseAfterMs`), but the advice is wrong for a dark room (D9). `IMG_1359` at 2.0 s (head cut off at the top of the rep): skeleton drawn to the frame edge, "Good form 100 %", **no hint** (montage panel 2). `IMG_1305` at 3.0 s (feet at the edge, bystander in the background): "Good form 100 %", no hint (panel 4). `IMG_1359` at 5.5 s (kneeling to rest): "Good form 100 %", no hint (panel 3). The only hint in the code is `src/session.ts:100` `hint: landmarks ? undefined : "Step back…"`; there is no head/feet/visibility check, no frontal check (shoulder width vs torso), no second-person check (`result.landmarks[0]` at `session.ts:85` silently takes the first pose) → D5. The hint sits at the bottom centre and never covers the count (pass) |
| S8 | Stop ends the track, hides the video, restart shows 0 / 0; refusal shows the message and the demo button still works; a double Start never opens two loops | **PASS** | After Stop: `MediaStreamTrack.readyState` = `["ended"]`, `video.srcObject` = null, Stop hidden, status "Stopped.", Start enabled; restart → good 0, attempts 0, 24 fps; two `click()`s in the same tick → one session, one status, 24 fps (no doubled count, `main.ts:32` `starting` guard). `--deny-permission-prompts`: status "Camera permission was refused. You can still watch the demo clip.", demo enabled, stage back to the placeholder (`pushups-r1-camera-denied-2026-09-18.jpg`). Minor: after Stop the stats still read "Speed 30 fps" and "Form now: no pose" (stale, D13) |
| S9 | Private and offline: after load only `/ingest/*`; `rep_counted {good}` carries no landmark/image keys; second load serves `/wasm/*` and `/models/*` immutable; health ok | **PASS** | Hosts contacted during a full camera session: `["pushups.kalpkan.com"]`; requests after load, excluding `/wasm/`, `/models/`, `/assets/`: `/ingest/i/v0/e/` ×5 and `/ingest/s/` ×2 (PostHog events + session-replay chunks; rrweb does not capture canvas or video pixels, `recordCanvas` is off by default). `src/analytics.ts` events carry only `mode` / `good`. `curl -I`: `/wasm/vision_wasm_internal.wasm` 11.15 MB and `/models/pose_landmarker_full.task` 9.40 MB both `cache-control: public, max-age=31536000, immutable`; `/demo/pushups.mp4` 265 KB `max-age=86400`; in real Chrome on a second visit every model/WASM entry had `transferSize 0` (served from cache). Console errors in all 45 corpus runs + 3 demo runs + the UX run: **0** |
| S10 | Honest about limits: page and README name the training set, the three things the classifier cannot judge (front view, second person, pike vs plank) and the placement rules; README runs for a non-developer | **PASS (partial)** | Page "How it decides": "trained on Kalp's own good- and bad-form videos", 94.8 % held-out; Tips give the placement rule. README "Limits (honest ones)": one person, side-on, "other angles read as bad form", first rep may be missed, phone 8–15 fps. **Neither says a second person, a pike, or kneeling can be scored as good** (they are: montage panels 3 and 5), and the page claims "it only counts when the form was good at both ends" while the README's "How to run this" (`npm install`, `npm run dev`, `npm test`) is accurate (`npm test` → 26/26 + the corpus table) → D14 |

Global: `npm test` (vitest `--pool=forks --maxWorkers=1`) 26/26; with `PUSHUPS_CORPUS_GATE=1` the corpus test fails 10/17 (expected until the fix round); CI run `35413958556` green on `06e245a`; static Hobby, $0, no deploy made by this round; `impeccable detect --json index.html` → 1 warning (`flat-type-hierarchy`), a false positive (sizes live in `src/style.css`: `h1` `clamp(1.6rem, 5vw, 2.4rem)`).

## Defects

### D1 — The counter loses the first rep and then under-counts every set (4/15 clips on the live site; all misses are under-counts)

Severity: **blocker** (S2, S3, S4 bars; this is the product)

Steps to reproduce: `cd ~/projects/pushups && GPU=1 REPORT_ONLY=1 node scripts/e2e-corpus.mjs https://pushups.kalpkan.com/` (needs the git-ignored `.mjpeg` files, `node scripts/make-mjpeg.mjs` once). Or offline: `PUSHUPS_CORPUS_GATE=1 npx vitest run --pool=forks --maxWorkers=1 tests/corpus.test.ts`.

Expected / Actual: 15/15 within ±1. Actual 4/15, 4/15, 5/15 live (traces 5/15). `bad_IMG_4456` 4 reps → 2 attempts; `IMG_1359` 9 → 6; `test_video3` 5 → 2; `IMG_1305` at t = 3.0 s (after two bottoms at 0.7 and 2.6 s) still shows "0 attempts".

Evidence: `docs/reports/evidence/pushups-r1-corpus-live-run{1,2,3}-2026-09-18.json` (`got` vs `expected` per clip), `pushups-r1-overlay-montage-2026-09-18.jpg` panel 4; the corpus test's event lists (e.g. `IMG_1359 events 1.7g 7.7g 8.8g 9.8g 11.9g 14.4g 15.9g`, reps at 16.4 and 17.5 s missing).

Likely cause: `src/repCounter.ts:54-58, 65` — the top band is `shoulderMin + 0.1 × range` on the **all-time** min/max. At the start `range ≈ 0`, so the plank the visitor is already in never registers as a "top" and the first descent counts for nothing (spec §5.1); after that, one deeper bottom or a higher top (head-off-frame extrapolation, standing up, `test_video3` overshoot at 2.4 s) widens the range so the 10 % bands become unreachable for normal reps (§5.2). `WARMUP_FRAMES = 10` (`:31, :60-63`) discards the first third of a second regardless of what happened in it.

Suggested fix: treat the first stable shoulder height as the top (seed `topReached` when the shoulder has been within a small band for ~0.3 s), replace all-time min/max by a decaying or per-rep re-estimated range (e.g. exponential decay toward the last rep's extremes, or a rolling window of ~4 s) with hysteresis, and express the bands as a fraction of the last completed rep's amplitude rather than of the session extremes. Keep `tests/corpus.test.ts` as the gate (flip `PUSHUPS_CORPUS_GATE=1` in CI when it passes) and confirm with `e2e-corpus.mjs` ×3.

### D2 — The same clip gives different counts on consecutive runs (6/15 clips; one 8-rep clip counted 7, 0, 7)

Severity: **blocker** (S2 "identical on 3 consecutive runs"; a visitor who repeats a set and gets a different number stops trusting the page)

Steps to reproduce: run `scripts/e2e-corpus.mjs` three times as in D1 and diff the `got` columns.

Expected / Actual: identical numbers. Actual: demo 1/0 → 2/1 → 2/1; test_video 3/2 → 3/3 → 3/3; good_IMG_4378 **7/7 → 0/0 → 7/7**; IMG_1305 4/4 → 2/2 → 4/4; IMG_1360 3/3 → 5/5 → 5/5; IMG_1512 3/3 → 4/4 → 3/3. A separate screenshot run of IMG_1512 showed **5/5 at 31 s** (a fourth value).

Evidence: the three run JSONs above; `fpsMin` 2 on the first clip of run 1 (model warm-up in a fresh browser).

Likely cause: the counter is frame-based, not time-based, and every decision is a single sample: `WARMUP_FRAMES` (`repCounter.ts:31`) is 10 *detections*, and a band crossing is registered on the first frame that lands inside the 10 % band (`:65-76`). Which frames the pipeline samples varies from run to run (29 ± 1 fps against a 30 fps source, plus the first second at 2–16 fps while MediaPipe's GPU shaders compile), so a top or bottom that lasts one or two frames is sometimes seen and sometimes not. A single spurious landmark frame during warm-up (`shoulderY` far outside the body's range) is enough to poison the all-time min/max for the whole session, which is the most plausible reading of the 0/0 run on `good_IMG_4378` (the range never became reachable).

Suggested fix: make warm-up and hold times wall-clock (`performance.now()`), smooth `shoulderY` with a short time-based filter (e.g. 100 ms EMA or a 3-sample median) before the state machine, require a band to be held for ~100 ms rather than one frame, and ignore frames whose pose visibility/confidence is low. Then the count depends on the movement, not on which frames the GPU happened to process.

### D3 — Form is judged on one frame at each end, the classifier calls every clean top in `test_video_4` "bad", and pikes / kneeling read "Good form 100 %"

Severity: **major** (S3; 4 clean reps → 0 good in three runs; a pike counted as a good rep)

Steps to reproduce: `e2e-corpus.mjs … test_video_4` (0 good of 4 good reps, every run); `IMG_1512` screenshot at 31 s; `IMG_1359` at 5.5 s.

Expected / Actual: `test_video_4` → 4 good; pike → bad with a reason; kneeling → not a good plank. Actual: 0 good; "Good form 100 %" on the downward-dog pike (counted as a good rep, "5 good reps · 5 attempts" at 31 s); "Good form 100 %" while kneeling to rest.

Evidence: `pushups-r1-overlay-montage-2026-09-18.jpg` panels 3 and 5; trace `tests/fixtures/traces/test_video_4.json` frames at t = 2.3–2.6, 3.9–4.2, 5.5–5.6, 7.0–7.5 s: `shoulderY ≈ 0.41–0.44`, `prob` 0.07–0.16 (the frames show a straight plank, spec §5.4); at the labelled bottoms the single-frame verdict matches 67/69 high-confidence labels, so the bottom is not the problem.

Likely cause: `src/repCounter.ts:66-68` and `:72-74` copy `good` from the *first* frame inside each band; `src/session.ts:90` feeds `prob > 0.5` per frame with no temporal smoothing. The MLP (`src/classifier.ts`, 36 raw landmark coordinates through a `StandardScaler`) was trained on one person, one camera, one orientation; `test_video_4` has a 180° rotation baked in (so the body faces the other way) and pikes/kneeling were under-represented, so the network's answer at the top and on those shapes is not the definition in `ground_truth.json`.

Suggested fix: (1) take each end's verdict as the majority of the frames spent inside the band (or at least 3 frames around the extreme); (2) add the geometric rules the spec asks for on the 33 landmarks, independent of the network: hip deviation from the shoulder–ankle line (sag below / pike above a threshold), knee–ankle–hip geometry for kneeling, and depth from the shoulder amplitude; the rep verdict = network AND rules; (3) mirror the feature vector horizontally when the person faces left so both orientations look like the training data.

### D4 — A bad verdict never says why

Severity: **major** (S3 "a one-line reason (hips sagging / knees on the floor / go lower)")

Steps to reproduce: any bad frame, e.g. `bad_IMG_4456` at 2.2 s.

Expected / Actual: "Bad form: hips sagging". Actual: "Bad form 94 %" and a red skeleton; the stats tile says "bad 97 %".

Evidence: montage panel 1; `src/draw.ts:61-65` (`${good ? "Good" : "Bad"} form ${pct}%`); `src/main.ts:55`.

Likely cause: the pipeline has one scalar (`prob`) and no per-fault signal; nothing in `features.ts` computes hip/knee/depth geometry.

Suggested fix: with the rules from D3, pass a `reason` string into `draw()` and the "Form now" tile ("hips sagging", "hips too high", "knees down", "go lower", or "form: unsure" when only the network disagrees), and show it on the rep event so the attempt that just failed says why.

### D5 — No placement guidance beyond "no pose": head or feet out of frame, a second person and a frontal view are silently scored

Severity: **major** (S7)

Steps to reproduce: `IMG_1359` (head leaves the frame at every top), `IMG_1305` (feet at the edge, bystander), any frontal recording.

Expected / Actual: "move the phone back until your whole body is in the frame" / "only one person" / "turn side-on" within 1 s. Actual: nothing; "Good form 100 %" and a skeleton extrapolated past the frame edge.

Evidence: montage panels 2 and 4; `src/session.ts:85` (`result.landmarks[0] ?? null`) and `:100` (single hint string).

Likely cause: the only condition checked is `landmarks == null`. MediaPipe returns landmarks with coordinates outside [0, 1] and low `visibility` for out-of-frame joints, and `result.landmarks.length > 1` for a second person; none of it is read.

Suggested fix: per frame, compute (a) any of nose/ankles outside [0.02, 0.98] or `visibility < 0.5` → "move back / lower the phone", (b) `result.landmarks.length > 1` → "only one person in the frame", (c) shoulder x-distance > 0.6 × shoulder–hip distance → "turn side-on", (d) mean frame luminance below a threshold when no pose → "too dark"; debounce each for 1 s, show the most important one, and pause counting while a hint is up (a count taken with the head off frame is what D1's range poisoning feeds on).

### D6 — The count depends on the frame rate (a phone at 10–15 fps counts differently from a laptop)

Severity: **major** (S6 "a rep is never counted twice because the phone is slower" and the frame-drop bar)

Steps to reproduce: replay `tests/fixtures/traces/*.json` through `createRepCounter` keeping every frame, then 2 of 3, 1 of 2, 1 of 3 (`docs/reports/evidence/pushups-r1-framedrop-replay.test.ts`, copy into `tests/` and run with vitest).

Expected / Actual: same counts. Actual: 3/15 clips differ at 20 fps, 4/15 at 15 fps, 6/15 at 10 fps (e.g. `IMG_1359` 7 → 6 → 6 → 6, `IMG_1512` 4 → 3, `good_IMG_4409` 5 → 5 → 4 → 4).

Evidence: `pushups-r1-framedrop-replay-output-2026-09-18.txt`; the live "60 fps" demo (D7) vs the 27–29 fps camera path already give different counts for the same clip (2/1 vs 1/0–2/1).

Likely cause: same as D2: `WARMUP_FRAMES` and single-frame band crossings (`repCounter.ts:31, 60-76`).

Suggested fix: as in D2 (time-based warm-up, time-based hold, smoothing). Add the frame-drop replay to `tests/corpus.test.ts` as a permanent invariant ("count at 30 fps == count at 10 fps for every clip").

### D7 — The demo clip reports 2 / 1 (truth 4 / 2–3) and analyses every frame twice ("60 fps")

Severity: **major** (S5; the demo is the only path most visitors try, and it is wrong on a clip the site chose)

Steps to reproduce: press **Play demo clip**, or `GPU=1 node scripts/e2e-demo.mjs https://pushups.kalpkan.com/`.

Expected / Actual: 3–5 attempts, 1–4 good, Speed ≈ 30 fps. Actual: 2 attempts, 1 good (three runs), "60 fps".

Evidence: e2e-demo output ×3 in the session log; `src/session.ts:79` (`video.currentTime !== lastTime` is true on every 60 Hz animation frame because `currentTime` advances continuously, not per decoded frame).

Likely cause: D1 for the count (the clip starts in a plank, the first rep at 0.8 s is lost during warm-up, the second at 1.8 s falls inside the calibration); duplicated detections for the fps (`requestVideoFrameCallback` is not used).

Suggested fix: fix D1/D2 (the demo is `test_video3` 0–8.5 s and will follow); drive demo mode with `video.requestVideoFrameCallback` (falls back to rAF gated on `mediaTime`), which also halves GPU work on phones.

### D8 — Attempts are under-counted on every bad-form clip (2 of 4) so "attempts" does not tell the visitor how many reps they did

Severity: **major** (S3 "the attempts number go up"; folded into D1's cause but a distinct visible symptom: a visitor doing bad reps sees half of them)

Steps to reproduce: `e2e-corpus.mjs … bad_IMG_4456 bad_IMG_4470 bad_IMG_4451`.

Expected / Actual: 4 attempts / 0 good each. Actual: 2 / 0 in all nine runs.

Evidence: run JSONs; corpus test events `bad_IMG_4470 events 4.5b 6.3b` (reps at 0.9 and 2.2 s missing).

Likely cause: D1 (first rep lost) plus the range widening as the sagging hips push the shoulders lower on later reps, so the first band crossing never re-arms.

Suggested fix: D1.

### D9 — The no-pose hint gives wrong advice in the dark

Severity: **minor** (S7 wording)

Steps to reproduce: start the camera with the lens covered or in a dark room (black MJPEG in the harness).

Expected / Actual: "Can't see you: turn on a light or uncover the camera." Actual: "Step back so your whole body is visible" within 0.5 s.

Evidence: `pushups-r1-ux-checks-2026-09-18.json` `noPoseAfterMs: 510`; `pushups-r1-black-camera-hint-2026-09-18.jpg`.

Likely cause: `src/session.ts:100` has one string for every no-pose case.

Suggested fix: part of D5 (frame luminance check).

### D10 — The placement sentence is below the fold at phone width and the lede only says "side-on"

Severity: **minor** (S1 bar "placement sentence visible above the fold at 390 px")

Steps to reproduce: open the site at 390 × 844.

Expected / Actual: "side-on, floor level, whole body in frame, one person" before the buttons. Actual: the sentence is Tips bullet 1 at y = 886 px; the lede above the buttons says only "Point your camera at yourself side-on".

Evidence: `pushups-r1-phone390-2026-09-18.jpg`; `layout[1].notesTop = 886` in the UX JSON.

Likely cause: `index.html:19-24` (lede) and `:57-62` (Tips at the bottom).

Suggested fix: make the status line before Start read "Phone on the floor, side-on, whole body in frame, one person." and keep the Tips for the rest.

### D11 — The first second of a fresh session runs at 2 fps while the GPU warms up, and a rep done in it is lost

Severity: **minor** (S2 "never below 10 fps"; visible once per browser, but the demo clip's first rep falls exactly there)

Steps to reproduce: first camera session in a fresh Chrome profile (run 1, clip 1 of the harness).

Expected / Actual: ≥ 10 fps from the first frame, or counting deferred until the pipeline is warm. Actual: `fpsMin: 2` on `demo` in run 1 (`fpsAvg` 27), min 12–16 on the first clip of runs 2–3.

Evidence: `pushups-r1-corpus-live-run1-2026-09-18.json` `results[0]`.

Likely cause: `src/pose.ts` creates the landmarker but the first `detectForVideo` compiles the WebGL shaders; `session.ts` starts the loop and the counter at once.

Suggested fix: run one `detectForVideo` on a blank frame before `video.play()` (or before the status flips to "Get into pushup position"), and start the counter only after the first pose is seen at ≥ 10 fps for 0.5 s.

### D12 — In portrait on a phone the stats tiles are below the fold after Start

Severity: **minor** (S6 "stats visible without scrolling after tapping Start"; mitigated because the count is drawn on the canvas)

Steps to reproduce: 390 px wide, front camera 480 × 640.

Expected / Actual: count visible without scrolling. Actual: stage height 520 px from y ≈ 300, stats at y ≈ 830+; the on-canvas count (top-left, `draw.ts:58-60`) is visible.

Evidence: geometry from `src/style.css:24-26` and the 390 px screenshot (placeholder stage at 4:3).

Likely cause: header + lede + two full-width buttons + status take ~300 px before the stage.

Suggested fix: on `.stage.live` at ≤ 480 px collapse the lede (or scroll the stage into view on Start) and cap the stage at `max-height: 60vh` with `object-fit`.

### D13 — After Stop the stats keep saying "Speed 30 fps" and "Form now: no pose"

Severity: **minor** (S8 polish)

Steps to reproduce: Start camera, Stop.

Expected / Actual: fps "–" and form "–" (or "stopped"). Actual: stale values from the last frame; the stage keeps the last frame.

Evidence: `pushups-r1-ux-checks-2026-09-18.json` `stop.fps = "30 fps"`, `stop.form = "no pose"`.

Likely cause: `src/main.ts:85-90` resets nothing but the buttons and the status.

Suggested fix: reset the four tiles in the stop handler (and say "Stopped · 3 good reps of 5" in the status so the result survives).

### D14 — The limits copy does not say that a second person, a pike or kneeling can be scored "good", and "1 attempts"

Severity: **minor** (S10; plus a grammar slip on the overlay)

Steps to reproduce: read "How it decides / Tips" and README "Limits".

Expected / Actual: the three things the classifier cannot judge (front view, second person, pike vs plank) named. Actual: "other angles read as bad form more than they should" only; nothing about a second person or a pike (which today reads "Good form 100 %"). The overlay prints "good reps · 1 attempts".

Evidence: `index.html:50-62`, `README.md` "Limits"; montage panel 1 ("0 attempts") and the demo end frame ("1 attempts").

Likely cause: copy written before the corpus existed; `draw.ts:60` has no plural rule.

Suggested fix: one sentence in both places listing the three; `attempt${n === 1 ? "" : "s"}`.

## UX critique (impeccable, critique mode)

⚠️ DEGRADED: single-context (this session exposes no sub-agent tool; Assessment A and B ran inline, A written before the detector output was read). Detector: `impeccable detect --json index.html` → 1 warning, false positive (see Global). Mode: **Operate** (a tool the visitor uses for one task).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The 20 MB download is one static sentence with no progress; during a set the only feedback is the number, which is wrong; nothing says "calibrating" while the first rep is being eaten; "60 fps" on the demo |
| 2 | Match system / real world | 2 | "Bad form 94 %" is a probability, not coaching; "attempts" vs "good reps" is a developer's distinction, a visitor wants "5 reps, 3 with good form" |
| 3 | User control and freedom | 3 | Stop/restart work; nothing to reset the count without stopping the camera, no "start counting" moment (counting begins while you are still crawling into position) |
| 4 | Consistency and standards | 3 | Buttons, tiles and colours are consistent; the same clip gives different numbers on different plays (D2), which is the inconsistency that matters |
| 5 | Error prevention | 1 | No placement checks, no "too dark", no second-person guard, no calibration step; the page lets the visitor start counting with the head off frame and then under-counts silently |
| 6 | Recognition rather than recall | 3 | Everything is on one screen; the placement rule has to be remembered from the bottom of the page |
| 7 | Flexibility and efficiency | 2 | No keyboard shortcut, no target-rep goal, no rep beep (a visitor on the floor cannot read the screen at the bottom of a pushup; audio is the natural channel and is absent) |
| 8 | Aesthetic and minimalist design | 3 | Clean dark panel, good hierarchy, yellow count reads well on video; the four tiles duplicate what the canvas already shows |
| 9 | Error recovery | 2 | Refusal path is good; a wrong count offers no way to see why (no reason, no per-rep list) |
| 10 | Help and documentation | 2 | "How it decides" is honest engineering prose; there is no "why was my rep not counted?" and the limits are incomplete (D14) |
| **Total** | | **23/40** | needs work |

Design specificity: the page is authored for this product (yellow rep count on the video, honest privacy line, "Python original" link), not a template; but the interaction is a developer's console, not a trainer: numbers and percentages where a coach would say one word. Strengths: nothing loads until a click and the page says so; the count is drawn on the video where the visitor is looking; refusal and stop are handled cleanly. Priority issues: [P0] the count is wrong and unstable (D1, D2); [P1] no reason and no placement coaching (D4, D5); [P1] no audio/haptic cue per rep, so the visitor must look up from a plank to know whether it counted; [P2] the placement rule is below the fold (D10); [P2] "1 attempts", stale tiles after Stop (D13, D14). Persona red flags: *first-timer on a phone* props the phone, starts, does 5, reads 3, does not know it "calibrates" (the sentence is 900 px down), blames themself; *power user* wants a target, a beep and a per-rep log, gets a percentage; *sceptic* wants to know why rep 2 was bad and gets "Bad form 71 %". Questions skipped: Kalp is not watching this run; the questions a fixer should answer are in D1–D5.

## Known limitations that are NOT defects

- iOS Safari / Android Chrome on a real phone could not be driven from this Mac; S6's device half stays with H15. The mirroring, `facingMode: "user"` and width rules were verified in code and the frame-rate half was measured on the traces.
- The claude-in-chrome tab is hidden (`document.hidden`), so `<video>` never plays there; the live pipeline was exercised in headless real Chrome on the same URL with the GPU, which the spec names as the evidence path.
- Chrome's fake camera plays the MJPEG at real time, so run-to-run jitter in which frames the pipeline sees is part of the test; that is also what a real webcam does, which is why D2 is a defect and not a harness artefact.
- Light colour scheme: the site is dark-only by design (`color-scheme: dark`); the "both themes" pass shows the identical page.
- Two of the external clips show another person and one has a bystander; the app is not expected to identify people.
- PostHog session replay (`/ingest/s/`) records DOM events, not canvas or video pixels (`recordCanvas` off), so "no frame leaves the device" holds; a fixer may still want to set it explicitly.
- The first-second GPU warm-up (D11) is a property of MediaPipe's WebGL delegate; the fix is to defer counting, not to make shaders compile faster.

## How a fixing agent should verify the fix

```bash
cd ~/projects/pushups
npm test                                                   # 26 unit tests + corpus table
PUSHUPS_CORPUS_GATE=1 npx vitest run --pool=forks --maxWorkers=1 tests/corpus.test.ts   # must be 17/17 (then set the CI variable)
cp ~/projects/portfolio/docs/reports/evidence/pushups-r1-framedrop-replay.test.ts tests/zz_framedrop.test.ts \
  && npx vitest run --pool=forks --maxWorkers=1 tests/zz_framedrop.test.ts --reporter=verbose | grep -E "fps|clips whose"   # "0/15" clips change at 20 fps
node scripts/make-mjpeg.mjs                                # once (needs .venv ffmpeg)
npm run build && npx vite preview --port 4177 --strictPort &
for i in 1 2 3; do GPU=1 node scripts/e2e-corpus.mjs http://localhost:4177/; done   # 15/15 PASS three times, identical got columns, fpsMin ≥ 10
for i in 1 2 3; do GPU=1 node scripts/e2e-demo.mjs http://localhost:4177/; done     # attempts 3-5, good 1-4, same each time, fps ≈ 30, hosts = [localhost:4177], errors []
pkill -f "vite preview --port 4177"
```

Then on the live URL after the single deploy: the same `e2e-corpus.mjs` ×3 and `e2e-demo.mjs` ×3 against `https://pushups.kalpkan.com/`; mid-clip screenshots of `IMG_1359` at 2 s (expect a "move back" hint), `IMG_1359` at 5.5 s (no "Good form" while kneeling), `IMG_1512` at 31 s (pike → bad with a reason), `bad_IMG_4456` at 2.2 s (a reason under "Bad form"); a black MJPEG (expect a "too dark / uncover the camera" hint within 1 s); `--deny-permission-prompts` (message + demo enabled); Stop → tiles reset; Lighthouse mobile ≥ 0.85; 360/390/430 px `scrollWidth == innerWidth`; the placement sentence in the viewport at 390 × 844 before scrolling.

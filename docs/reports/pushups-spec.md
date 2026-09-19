# Pushup Form Tracker — consumer-grade spec and ground-truth corpus — 2026-09-18

Live URL: https://pushups.kalpkan.com · Repo: `KalpKan/pushup-tracker-web` (local `~/projects/pushups`) · Vercel project `pushups` (team `kks-projects-2edcb11a`, repo root, framework Vite, auto-deploys from `main`) · Database: none · Health route: `https://pushups.kalpkan.com/health.json` → `{"ok":true,"service":"pushups"}` · Python original: `KalpKan/AI-Pushup-Form-Tracker` (read-only clone `~/projects/pushups-python`, purge PR #1 open; the newer local copy with every recording is `~/Desktop/Out and About/Sidequest/AI_Pushup_Tracking/`, read-only)

Written by the SPEC agent of workflow T5.a+b. It says what the site must do (quoted from its own docs), the user stories a TEST agent exercises, the measurable bar for each, and the ground-truth corpus (created today and committed to the project repo). Section 6 records today's baseline so the fixer knows where the gaps are.

Kalp's focus for this project: **"it only worked on uploaded videos; I want it real-time in the browser, working very well and consistently, counting pushups correctly."** Consumer grade therefore means: live webcam at ≥ 15 fps on a laptop, rep count within ±1 of the hand-counted truth on every test clip, no double counts, good/bad form feedback that matches the one-pager's definition, works on a phone's front camera, and clear guidance on where to put the camera.

## 1. What the project is supposed to do (quoted from its own docs)

The one-pager (`~/Desktop/Out and About/Sidequest/One Pagers/AI-Powered Pushup Form Tracker - Google Docs.pdf`, Kalp Kansara & Yash Panchal):

> **AI-Powered Pushup Form Tracker — Your Personal Trainer, Powered by Computer Vision.** We love going to the gym, but a common issue is performing exercises with poor form leading to injury or suboptimal gains. Since personal trainers can be expensive, we built an AI-powered monitor to evaluate pushup form and provide instant feedback.
>
> Key Features: • Real-time pushup form analysis using computer vision • Instant feedback on form quality based on body position • Repetition counting with form validation • Low-cost and efficient implementation on Raspberry Pi
>
> Development Process: … we began by designing a flowchart to define good versus bad pushup form. … A custom algorithm was implemented to detect valid pushup repetitions based on timing and the top-of-rep form.

`README.md` of the web repo:

> Counts your pushups from the webcam and grades the form of every rep, entirely inside the browser. Nothing is uploaded: the pose model, the WASM runtime and the form classifier are all served from this site and run on your device.
>
> **Reps:** a line-for-line port of the original shoulder-height state machine. A rep is a top → bottom → top cycle of the shoulders' normalised height; it counts as a **good rep** only when the classifier said "good" at both the top and the bottom. Cycles with bad form are shown as "attempts".
>
> Limits (honest ones): The classifier was trained on one person's videos, filmed side-on. Film yourself side-on, whole body in frame, in decent light … The rep counter adapts its "top" and "bottom" bands to the shoulder range it has seen, so the first rep of a session may be missed while it calibrates (the original had the same behaviour). Phones work (front camera, mirrored), but the full pose model on a phone GPU runs at roughly 8 to 15 fps; very fast reps can skip the bottom band.

`index.html` (the page's own promise): "Point your camera at yourself side-on, do pushups, and the page counts the reps whose form was good at the top and the bottom. Everything runs on your device … no frame is ever uploaded." Tips: "Camera at roughly floor level, whole body in frame, side view, one person. The first rep calibrates the range, so the count may lag by one rep."

`README.md` of the Python original (`~/projects/pushups-python`): "Counts pushups from a video or a webcam and grades each frame's form as **good** or **bad**. MediaPipe Pose finds 12 body landmarks …, a small Keras neural network … classifies the form, and a shoulder-height state machine counts a rep only when the form was good at the top **and** the bottom."

`docs/hosting-plan.md` §1 (Tier B row): "**AI-Pushup-Form-Tracker** — MediaPipe Pose + 220 KB Keras MLP (36 features) → MediaPipe Tasks JS PoseLandmarker (VIDEO mode) + TF.js-converted MLP + rep state machine in JS → static site, $0". Appendix T3.1 DoD: "counts good reps from a webcam on desktop and phone". §11: "Webcam features are tested end-to-end with Playwright's fake camera fed by ground-truth clips."

`docs/superpowers/specs/2026-09-18-pushups-design.md`: "Error handling: no camera permission → message and the demo button stays; WASM/model fetch failure → message with a retry; no pose in frame → overlay says 'Step back so your whole body is visible'; GPU delegate failure → CPU delegate retry."

**What "good form" means here** (the one-pager only says "based on body position", so the definition is taken from the labelled training folders `data/good_form` and `data/bad_form` that the classifier was trained on, checked frame by frame today): a straight line from shoulders through hips to ankles at the top **and** at the bottom, chest near the floor at the bottom, arms straight at the top. Bad form is any of: hips sagging / lower back arched (the "worm", hips lagging the chest on the way up), hips piked up, knees on the floor, collapsing onto the floor and pushing the chest up first, or a partial dip counted as a rep. The same definition is at the top of `tests/fixtures/clips/ground_truth.json`.

## 2. User stories (the TEST agent exercises every one, at desktop and 390 px widths)

- **S1 — Load and understand.** As a visitor I open the site on a laptop or a phone and I see, within seconds and without anything jumping, what it does, a "Start camera" and a "Play demo clip" button, and a plain sentence on where to put the camera (side-on, floor level, whole body in frame, one person); nothing heavy downloads until I press a button.
- **S2 — Live count on a laptop.** As a visitor I press "Start camera", get into a side-on plank with my whole body in frame, do N pushups with good form, and I see the skeleton drawn on me at ≥ 15 fps and the "good reps" number reach N, with every rep counted once (no rep missed, no rep counted twice), including the first one.
- **S3 — Bad form is not a good rep.** As a visitor I do pushups with sagging hips, on my knees, in a pike, or resting on the floor, and I see the skeleton turn red, a one-line reason ("hips sagging", "knees on the floor", "go lower"), the "attempts" number go up and the "good reps" number stay put.
- **S4 — Consistent across pace and camera.** As a visitor I do fast reps (≈ 0.7 s), slow reps with pauses (≈ 4 s), reps that end with me standing up, and reps with the phone a bit too close or too low, and I still get the right count (±1) every time, with no phantom reps while I stand up, kneel, or rest.
- **S5 — Demo clip.** As a visitor without a camera I press "Play demo clip" and I see the same overlay on the bundled clip and, when it finishes, the correct count for that clip (4 attempts, 2–3 good), and the numbers are the same every time I play it.
- **S6 — Phone front camera.** As a visitor on a phone (iOS Safari, Android Chrome) I press "Start camera", prop the phone on the floor, and I see a mirrored preview that fills the width, the skeleton, and the count, at a usable frame rate; a rep is never counted twice because the phone is slower.
- **S7 — Camera placement guidance.** As a visitor who set the camera badly (too close, head cut off, facing the camera instead of side-on, two people in frame, too dark) I see a specific hint on the video ("move the phone back until your whole body is in the frame", "turn side-on", "only one person") instead of a silent wrong count.
- **S8 — Session controls.** As a visitor I can stop and restart a session, the count resets to 0 on restart, the camera light goes off on stop, and refusing the camera permission shows a message and leaves the demo button working.
- **S9 — Private and offline.** As a visitor I can check that after the first load the page makes no network request except the site's own analytics beacon (`/ingest/*`), that no frame or landmark leaves the device, and that a second visit needs no download (models cached).
- **S10 — Honest about limits.** As a visitor I read what the classifier was trained on and what it cannot judge (front view, a second person, pike vs plank) so I know when to trust the verdict, and the README says the same for a non-developer.

## 3. Consumer-grade bar (measurable, per story)

| Story | Bar (all must hold) | How to measure |
|---|---|---|
| S1 | `HTTP/2 200` with `server: Vercel`; Lighthouse performance ≥ 0.85 (mobile preset; today 1.00); no horizontal scroll at 360, 390 and 430 px; both buttons ≥ 44 px tall; the placement sentence is visible above the fold at 390 px; no request for `/wasm/*`, `/models/*` or `/demo/*` before a click; the hero-to-button distance does not shift when the status line changes (CLS ≤ 0.1) | verification.md pushups rows; Chrome device toolbar; Network tab |
| S2 | On **every** clip in `tests/fixtures/clips/ground_truth.json` fed through Chrome's fake camera (`scripts/e2e-corpus.mjs`, `GPU=1`) the on-screen **attempts** are within ±1 of `total` and **good reps** within `[good_min−1, good_max+1]`; the first rep of a clip that starts in a plank is counted; the measured pipeline rate (`stat-fps`) averages ≥ 15 fps and never reads below 10 fps on this Mac's GPU; the count is identical on 3 consecutive runs of the same clip (consistency) | `GPU=1 node scripts/e2e-corpus.mjs http://localhost:4177/` (15/15 must print PASS), run three times |
| S3 | Clips labelled bad (`bad_IMG_4456`, `bad_IMG_4470`, `bad_IMG_4451`, `IMG_1513`, the knee/pike cycles in `test_video_2`, the sag reps in `test_video`) produce **0 good reps** (±1) and the right number of attempts; for every rep whose form is labelled with `confidence: "high"` the verdict shown at that rep's bottom matches the label; the overlay states a reason for a bad verdict in words a beginner understands (at minimum: hips sagging / hips piked / knees down / not deep enough / unknown); the classifier's per-frame probability is still shown, but the rep verdict must not flip on a single noisy frame (a 3-frame majority or equivalent) | e2e-corpus table + `SHOT_DIR` screenshots at the bottom of a bad rep; `formPerSecond` in the results JSON |
| S4 | The five fast/slow/edge clips `IMG_1305` (0.7 s reps, camera very close, second person in the background), `IMG_1512` (4 s reps, long holds, then pike), `IMG_1359` (head leaves the frame at the top), `IMG_1360` (a quarter-depth partial that must not count), `test_video3` (stands up at the end) each meet the S2 tolerance; standing up, kneeling, resting on the floor, and the partial dip add **0** attempts; a clip that starts mid-descent (`IMG_1513`) gets its first rep only after a top was seen | e2e-corpus table; `not_reps` in the json |
| S5 | `node scripts/e2e-demo.mjs <url>` (with `GPU=1`) prints `attempts` 3–5 and `good` 1–4 (truth 4 / 2–3), `hosts` = `["<host>"]`, `errors` = `[]`; 3 consecutive runs print the same two numbers | e2e-demo.mjs ×3 on the live host |
| S6 | On a real iPhone (Safari) and an Android phone (Chrome), front camera: `getUserMedia` succeeds with `facingMode: "user"`, the preview is mirrored and ≤ 100 % width with no overflow, the pipeline runs at ≥ 8 fps and the rep counter does not depend on the frame rate (the same clip at 10 fps and 30 fps gives the same count: replay `tests/fixtures/traces/*.json` with every third frame dropped and compare); the page works in portrait with the stats visible without scrolling after tapping Start | H15 (Kalp's phone) for the real device; frame-drop replay in `tests/corpus.test.ts` for the rate independence |
| S7 | With no pose for > 1 s the overlay says where to move (today: "Step back so your whole body is visible"); with the head or feet outside the frame for > 1 s it says so; with two poses or a frontal pose (shoulder width in x > 0.6 × torso length) it says "turn side-on / one person"; the hint disappears within 1 s of fixing the setup; hints never cover the count | screenshots from the fake camera with `IMG_1359` (head out), `IMG_1305` (feet out, bystander), and a synthetic frontal clip the TEST agent records |
| S8 | Stop turns the camera track off (`MediaStreamTrack.readyState === "ended"`), hides the video, and Start again shows 0 / 0; denying the permission shows the "Camera permission was refused" line and the demo button still works; starting a session twice quickly never opens two loops (counts do not jump by 2) | Playwright/puppeteer with `--use-fake-ui-for-media-stream` and, for denial, `--deny-permission-prompts` |
| S9 | Network tab after load: only `POST /ingest/…`; `rep_counted {good}` carries no landmark or image keys; second load serves `/wasm/*` and `/models/*` from cache (`cache-control: immutable`); `/health.json` returns `{"ok":true,"service":"pushups"}` | e2e-demo `hosts`; curl of headers |
| S10 | The page's "How it decides / Tips" section and the README name the training set (one person, side view), the three things the classifier cannot judge, and the placement rules; the README "How to run this" works for a non-developer (`npm install`, `npm run dev`, `npm test`) | read as Kalp |

Global: Vercel Hobby static only, $0, MediaPipe + TF.js self-hosted, no new third-party scripts; `npm test` (vitest `--pool=forks --maxWorkers=1`, per-test timeout set in `vite.config.ts`) and `npm run build` clean; CI green (`.github/workflows/ci.yml`, added today); at most one production deploy per fix round.

## 4. Test assets (created today unless noted; paths are absolute)

| Asset | Path | What it is |
|---|---|---|
| Ground truth | `/Users/kalp/projects/pushups/tests/fixtures/clips/ground_truth.json` | 15 clips, every completed rep with the time of its bottom, the form label and a confidence, the movements that must not count, `total`, `good_min`, `good_max`, the form definition, source sha256 prefixes. Labelled by hand from 4 fps contact sheets (`README.md` beside it explains how) |
| Committed clips (9, 3.9 MB) | `/Users/kalp/projects/pushups/tests/fixtures/clips/{test_video,test_video_2,test_video3,test_video_4,good_IMG_4378,good_IMG_4409,bad_IMG_4456,bad_IMG_4470,bad_IMG_4451}.mp4` | Kalp's own recordings (the four test videos that were public in the old repo, two good-form and three bad-form training clips), 640 px, 30 fps, H.264; `test_video_4` has its 180° rotation baked in. Rebuilt by `scripts/make-clips.sh` |
| External clips (5, not committed) | `/Users/kalp/Desktop/Out and About/Sidequest/AI_Pushup_Tracking/Pushup Test Videos/IMG_{1305,1359,1360,1512,1513}.mp4` | personal recordings (two of a different person, one with a bystander); hard cases: camera too close, head cut off, 4 s reps, a quarter-depth partial, a pike pushup. Read from the absolute path by the harness |
| Demo clip | `/Users/kalp/projects/pushups/public/demo/pushups.mp4` (existing) | `test_video3` 0–8.5 s; truth 4 attempts, 2–3 good |
| Python landmark traces (15, 1.9 MB) | `/Users/kalp/projects/pushups/tests/fixtures/traces/<id>.json` | per frame: `shoulderY`, Keras `prob`, 36 features, from the legacy MediaPipe pose at 640 px on each clip (`scripts/make_traces.py`, needs the `.venv`). Replayed by `tests/corpus.test.ts` |
| Corpus unit test | `/Users/kalp/projects/pushups/tests/corpus.test.ts` | rep counter vs ground truth on the traces; prints a table; **report-only until `PUSHUPS_CORPUS_GATE=1`** (the fixer sets the repo variable in CI once it passes) |
| Fake-camera clips | `/Users/kalp/projects/pushups/tests/fixtures/clips/.mjpeg/<id>.mjpeg` (git-ignored, 84 MB, `node scripts/make-mjpeg.mjs`) | 640×360 @ 30 fps MJPEG with 3 s of black appended, the format Chrome's `--use-file-for-fake-video-capture` plays at real time (measured 30.2 fps) |
| End-to-end camera harness | `/Users/kalp/projects/pushups/scripts/e2e-corpus.mjs` | launches headless Chrome per clip with the fake camera, presses **Start camera**, waits the clip's length, reads the on-screen counts and fps, compares with the json, writes `tests/fixtures/results/<timestamp>.json` (git-ignored). `GPU=1` for the real GPU (what a visitor gets), `REPORT_ONLY=1` to never fail, `SHOT_DIR=` for screenshots |
| Demo harness | `/Users/kalp/projects/pushups/scripts/e2e-demo.mjs` (existing) | demo-clip run, hosts and console errors |
| Existing Python fixtures | `/Users/kalp/projects/pushups/tests/fixtures/test_video3_0-160.json`, `test_video_2_1000-1408.json` | port-fidelity tests (classifier within 1e-4 of Keras, counter = Python state machine); unchanged |
| CI | `/Users/kalp/projects/pushups/.github/workflows/ci.yml` | `npm ci`, `npm run typecheck`, `npx vitest run --pool=forks --maxWorkers=1`, `npm run build` |
| Baseline results | `/Users/kalp/projects/portfolio/docs/reports/evidence/pushups-spec-baseline-2026-09-18.json` | the e2e-corpus JSON of today's run (section 6) |

The "How to run the corpus" recipe for a fixer or tester, from `~/projects/pushups`:

```bash
npm test                                     # unit + corpus table (report-only)
PUSHUPS_CORPUS_GATE=1 npm test               # same, failing on misses
node scripts/make-mjpeg.mjs                  # once, 84 MB into tests/fixtures/clips/.mjpeg/
npm run build && npx vite preview --port 4177 --strictPort &   # or use the live host
GPU=1 node scripts/e2e-corpus.mjs http://localhost:4177/       # 15 clips, ~6 min; PASS on all = the bar
GPU=1 node scripts/e2e-demo.mjs https://pushups.kalpkan.com/   # demo + hosts + errors
pkill -f "vite preview --port 4177"
```

## 5. Why the count is wrong today (read of `src/repCounter.ts`, verified on the traces)

1. **The first rep is usually lost.** The counter only registers "top" when `shoulderY < min + 0.1·range`; at the start `range ≈ 0`, so the plank the visitor is already in never registers as a top and the first descent counts for nothing. `good_IMG_4409` counts 5/5 only because a 0.6 s hold at the start jitters below the threshold; `good_IMG_4378`, `bad_*`, `IMG_1305/1359/1360` all lose rep 1. The README calls this "calibration"; a visitor calls it a missed rep.
2. **Bands are 10 % of the all-time min/max, so any overshoot poisons the session.** One deeper bottom or one higher top (standing up, a head-off-frame extrapolation, the phone moving) makes the 10 % band unreachable for normal reps: `test_video3` loses reps 3 and 5 after a 0.26 overshoot at 2.4 s; `IMG_1359` loses reps 8–9 once the top drifts from 0.00 to 0.04. No decay, no per-rep re-estimation, no hysteresis.
3. **The count depends on the frame rate.** The same clip counts 3 at 60 fps and 2 at 30 fps (`test_video3`), because the 10-frame warm-up and single-frame band crossings are frame-based, not time-based. A phone at 10 fps will differ again (S6).
4. **A rep's form is judged on two single frames** (the first frame in the top band, the first in the bottom band); one noisy classifier frame flips the whole rep (`test_video_4` reps 2–4: the frames show a straight plank, the classifier calls the top frames bad, so 4 clean reps yield 1 good).
5. **Nothing tells the visitor what went wrong**: no "hips sagging" text, no "move back" beyond the no-pose hint, no "one person" check. The classifier cannot see a pike (all green on `IMG_1512` 30–33 s), so a rule on hip height vs the shoulder–ankle line is needed for that case.
6. **Demo mode analyses every frame twice.** New frames are detected by `video.currentTime` changing, which happens on every 60 Hz animation frame for a 30 fps clip, so `detectForVideo` runs ~61 times a second on duplicated frames (the "Speed" label shows 61 fps); camera mode is fine (27–29 fps measured for a 30 fps source).

## 6. Baseline measured today (commit `18ab3e6`, local build = production `4f0708e` + the e2e script change)

Python-trace replay (`npm test`, corpus table): **5/15 clips within tolerance**. Browser, fake camera, real GPU (`GPU=1 node scripts/e2e-corpus.mjs http://localhost:4177/`, pipeline 27–29 fps avg, min 17–19): see the table below and `docs/reports/evidence/pushups-spec-baseline-2026-09-18.json`. The demo clip counts 2 attempts / 1 good in both demo mode (`e2e-demo.mjs`, 3 runs) and camera mode against a truth of 4 / 2–3.

| Clip | Truth: attempts / good | Browser (camera path): attempts / good | fps avg / min | Result |
|---|---|---|---|---|
| `demo` | 4 / 2–3 | 2 / 1 | 27 / 17 | FAIL |
| `test_video3` | 5 / 2–4 | 2 / 1 | 29 / 19 | FAIL |
| `test_video` | 4 / 2–2 | 3 / 2 | 29 / 19 | PASS |
| `test_video_2` | 4 / 0–2 | 2 / 0 | 29 / 10 | FAIL |
| `test_video_4` | 5 / 4–4 | 4 / 0 | 29 / 19 | FAIL |
| `good_IMG_4378` | 8 / 8–8 | 7 / 7 | 27 / 15 | PASS |
| `good_IMG_4409` | 5 / 5–5 | 4 / 4 | 28 / 19 | PASS |
| `bad_IMG_4456` | 4 / 0–0 | 2 / 0 | 29 / 19 | FAIL |
| `bad_IMG_4470` | 4 / 0–0 | 2 / 0 | 28 / 9 | FAIL |
| `bad_IMG_4451` | 4 / 0–0 | 2 / 0 | 29 / 18 | FAIL |
| `IMG_1305` | 6 / 6–6 | 4 / 4 | 29 / 20 | FAIL |
| `IMG_1359` | 9 / 9–9 | 6 / 6 | 29 / 17 | FAIL |
| `IMG_1360` | 6 / 6–6 | 4 / 4 | 29 / 19 | FAIL |
| `IMG_1512` | 6 / 4–4 | 3 / 3 | 30 / 17 | FAIL |
| `IMG_1513` | 1 / 0–0 | 1 / 0 | 29 / 19 | PASS |

**4/15 clips within tolerance** (Chrome 153 headless, ANGLE/Metal, fake camera at 30 fps). Every miss is an under-count; not one clip over-counts, so the fix is in registering tops and bottoms (§5), not in suppressing double counts.

Everything above the pipeline (page, health, DNS, monitors, PostHog, Lighthouse 1.00, no third-party hosts) passed the Phase 2–4 audit on 2026-09-19 and is not re-listed here.

## 7. Known limitations that are NOT defects

- The classifier was trained on one person filmed side-on; a frontal view is out of scope (S7 asks for a hint, not a verdict).
- Two of the external clips show a different person; the app is not expected to identify people, only to track the one doing pushups.
- Headless Chrome without `GPU=1` renders WebGL in software at a few fps; numbers from such a run are not evidence.
- iOS Safari cannot be driven from this Mac; S6 is verified by Kalp (H15) plus the frame-drop replay.

# emotes (Emote Detector) functional audit — 2026-09-19 (TEST + CRITIQUE round 3)

Live URL https://emotes.kalpkan.com · Repo `KalpKan/emote-detector-web` (local `~/projects/emotes`, audited at commit `10c2bae` = `origin/main`, clean; CI run on `10c2bae` `success`, unit + corpus) · Vercel project `emotes` (repo root, framework Vite, static, `prj_mgoUdU4NQ9X8sfP7Jhcy4xBBM6pr`) · Database none · Health route `https://emotes.kalpkan.com/health.json` → `{"ok":true,"service":"emotes"}`

**Production now runs the fixed code.** The live bundle is `assets/index-B9nmmuhl.js`, served `public, max-age=31536000, immutable`; it differs from a local `npm run build` of `10c2bae` only by the injected PostHog key and the MediaPipe chunk hash, so everything below was measured on the deployed site unless marked *local* (the local production build, `vite preview`, was used for the new reels so the live runs were not slowed by a second Chrome). Method: the repo's own gates (`npm run typecheck`, `test:unit`, `test:corpus`, `report`); Chrome's fake camera fed with MJPEG slideshows of the labelled photo corpus through the site's own landmarkers on the Mac GPU, judged by the page's own emote box (`scripts/e2e-camera.mjs`, 34 live runs at 1000 and 390 px covering every reel from rounds 1–2, plus `docs/reports/evidence/emotes-r3-e2e-harness.mjs`, the same judge with CPU throttling, a pipeline fps counter, stream/stage geometry, a status-change recorder and a `BROWSER=playwright` switch); twelve new reels built by `emotes-r3-build-e2e-clips.py` (portrait frames, slow zoom/pan motion, a dim blurry webcam, 0.6 s rests, a 30 s neutral mix, both-arm flexes, six more thumbs-ups, six more yawns, a moving hard-negative reel); the real pipeline throttled to 10–14 fps; Playwright's Chromium instead of Google Chrome; the three held-out landmark sets (mirror / portrait / far) re-extracted with the site's models; synthetic talking with all five lip pairs and synthetic laughs on the nine real neutral faces; gestures that morph into one another without a rest; headless real Chrome at 1280 and 390 px in both colour schemes (console, network, demo, layout); Lighthouse mobile ×2; `impeccable detect` and a single-context critique. The claude-in-chrome pass on the live site was degraded: the tab stayed hidden behind other agents' tabs (`document.visibilityState === "hidden"`, the demo's `setTimeout` loop throttled to one tick per second so its first emote took 42 s), `resize_window` reported success but the viewport stayed 1082 px, and one long `javascript_tool` evaluation timed out; console showed no site errors and the network showed only `emotes.kalpkan.com`, everything else came from headless Chrome. Evidence: `docs/reports/evidence/emotes-r3-*` (scripts included; no photo frame is committed because the frames are the stock photos).

## Verdict: PARTIALLY WORKING

This is the first round in which the live site is the fixed site, and the fix holds up under tests it was not tuned on. On the deployed URL, 33 of 34 fake-camera runs pass: the official clip at 1000 and 390 px (Thumbs Up 285–328 ms, Goblin Muscle 279–409 ms, Princess Yawn 572–753 ms after onset), the thumb beside the head **12/12 at 1000 px and 22/24 at 390 px** (round 2: Goblin Muscle 8 of 13), thumbs-up → flex → yawn with no rest **3/3 at both widths** (round 2: flex lost), both hard-negative reels **0 fires in 53 s** at both widths, the misses, repeat, mirror, sweep and far reels, three 10 s holds firing exactly once, two thumbs at shoulder height 4/4, and no console error in any run. On the local build the new reels add: slow zoom-and-sway motion 6/6 at both widths, a dim blurry feed 6/6 at both widths, a moving hard-negative reel and a 30 s neutral mix firing nothing, six more thumbs-ups 6/6, the pipeline **CPU-throttled to 10–14 fps** still firing every event within 1 s (official 290 / 520 / 700 ms at 12.8 fps; the beside-the-head thumb 4/4 at 10.3 fps; hard reel nothing), and Playwright's Chromium passing the official, fast and tu04x4 reels. The status line never swapped between two "Almost" hints inside 900 ms in any of the 26 recorded runs. Lighthouse mobile is 0.99 / 1.00, accessibility and best-practices 1.0, and after "Watching" the only request is the favicon.

What still keeps it from consumer grade, in order: (1) a clear flex from the corpus's own `ok` set (`flex-09`, a boy flexing and looking at his bicep) plays **Thumbs Up** 5 of 6 times through the live pipeline, because the hand model calls his fist a perfect thumbs-up on the first frame while the pose model needs ~400 ms to see the arm; FIX round 2 widened the ground truth to accept either emote instead of fixing it, so the gate is green while a stranger who flexes like that gets the wrong emote. (2) A second clear positive misses the 1 s bar on video: the back-view double-biceps flex (`flex-12`) fires at 1,525 ms, and the borderline yawn (`yawn-17`) does not fire at all through the pipeline, so the real-video recall for yawns is 7/8 and the held-out landmark sets still sit at 63–75 % yawn recall (round-2 D5/D6 unchanged). (3) The same gesture repeated with a 0.6 s rest merges into one hold (thumbs-up 1/3, flex 2/3, yawn 3/3), the phone fold is unchanged (Mute alone on a row, the emote card over a third of the stage), and one of six 390 px runs of the beside-the-head thumb lost its last two passes without a wrong emote and without a reproducible cause. Score 72/100 (round 2: 50 on the fixed build, 35 live).

## Round-2 defects re-tested (all on the live `10c2bae`)

| Round 2 | Result |
|---|---|
| D1 thumb beside the head fires Goblin Muscle 8/13 | **Fixed**: `tu04x4` Thumbs Up 12/12 at 1000 px (three runs), 22/24 at 390 px over six runs (one run fired only its first two passes; the other five 4/4 with frame gaps ≤ 100 ms), 4/4 at 10.3 fps throttled, 4/4 in Playwright Chromium; Goblin Muscle **0** in 46 passes. `thumbs_up-03` (the other beside-the-head photo) 1/1 in the `thumbs-more` reel |
| D2 gesture < 1.5 s after another never plays | **Fixed**: `fast` reel 3/3 at 1000 and 390 live, 3/3 at 12.3 fps throttled, 3/3 in Chromium; offline, a gesture that morphs into another with a 300 or 800 ms transition and no rest fires both, 20/20 pairs |
| D3 hint flickers at 12 Hz | **Fixed**: 0 "Almost" swaps under 900 ms in all 26 recorded runs (up to 11 status changes per run) |
| D4 production still runs round-1 rules | **Fixed**: live bundle `index-B9nmmuhl.js`, immutable, Mute button present, copy in seconds; Lighthouse 0.99 / 1.00 |
| D5 borderline yawn-17 | **Not fixed, now a real-pipeline miss**: `yawn-more` reel fires yawn-05/07/12/18/03 (480–714 ms) and **misses yawn-17** (new D3 below) |
| D6 yawn eye cue on small / flipped faces | **Not fixed**: re-extracted mirror / portrait / far sets give yawn recall 63 % / 75 % / 63 % again, precision 100 % everywhere, 0/9 neutral and 0/33 hard fired on all three (`emotes-r3-variants-stills`). The far reel still passes through VIDEO mode at both widths |
| D7 judge "late" for an event in progress | **Fixed** (`10c2bae`): no spurious late this round; an event the models catch mid-hold is timed from readiness |
| D8 synthetic talking moves one lip pair | **Not fixed in the corpus, but answered**: talking that moves all five lip pairs at 3 Hz with the eyes open (mouth-open ratio up to 1.2) scores yawn 0.00 on all nine real neutral faces; a shout with open eyes likewise. Only a synthetic laugh with the lids at ≤ 30 % fires (new D6) |
| D9 phone fold | **Not fixed**: at 390 × 844 the Mute button still wraps alone, "The three gestures" starts at y ≈ 720, and the 118 × 128 emote card covers the right third of the 358 × 269 stage (`emotes-r3-live-390-dark-demo`) |

## User stories tested (live unless marked local)

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load and start | **PASS** | `HTTP/2 200`, `server: Vercel`, health ok; click → "Watching…" in **1,401 ms** with the progress line (runtime → face → hand → pose → "Models ready."); models ready 1.7–2.8 s after the stream in every live run; Lighthouse mobile **0.99 / 1.00** (LCP 1.4 s, TBT 30–90 ms, CLS 0), accessibility 1.0, best-practices 1.0; page errors none at 1280/390 × dark/light and in all 34 live fake-camera runs; `scrollWidth` = viewport at 390 and 1000; `/assets/*` and `/mediapipe/*` immutable, MP3s `max-age=86400` (`emotes-r3-net-live`, `emotes-r3-lighthouse`, `emotes-r3-ux-live`) |
| S2 | Thumbs-up, either hand, chest height or beside the face, once within 1 s | **PASS** | Official 285–328 ms at both widths; `tu04x4` 12/12 + 22/24 (D1 row); `tu17x4` 4/4 + 4/4; `misses` thumbs_up-04/09/16 at both widths; `repeat` 3/3 at both widths (1752–3332 ms latencies are the mid-event ready artefact, next-pass 153–385 ms); mirror, far and sweep thumbs-ups at both widths; local: `thumbs-more` (01, 03, 08, 12, 14, 15) **6/6 at 189–291 ms**, motion 2/2, dim 2/2, 10.3 fps throttled 4/4, Chromium 4/4 + 1/1 |
| S3 | Flex, fist beside the head, once within 1 s | **FAIL (major, D1; minor D2)** | flex-14 279–409 ms at both widths; flex-01/04 in sweep and far at both widths; hold-flex once at both widths; local: motion 2/2, dim 2/2, `flex-both` flex-11/02/05/07 at 269–500 ms. **But** `flex09x3` plays **Thumbs Up 3/3 at 1000 px and 2/3 at 390 px** for a clear flex (D1), and `flex-12` (back view, double biceps) fires **1,525 ms** after onset (D2) |
| S4 | Yawn once within 1 s; an occluded yawn never becomes another emote | **PARTIAL (D3, D4)** | yawn-19 572–753 ms at both widths, yawn-02/05/15 in misses/sweep/far, hold-yawn once at both widths, mirror yawn-19; local: motion 2/2, dim 2/2, `yawn-more` 5/6 with **yawn-17 missed** (D3); occluded yawn-08 in the hard reel and the 9 occluded stills fire nothing wrong (0 wrong on four landmark sets); screams angry-01/05/06/07/09 fire nothing in four reels. Held-out recall 63–75 % (D4) |
| S5 | Nothing fires on sitting, talking, looking around, scratching, cover-eyes, dab | **PASS** | Live: `hard` (cover_eyes-02, dab-01, angry-01, yawn-08, angry-07) **none / 24.5 s** and `hard2` (cover_eyes-05/11, dab-07/12, angry-05/09) **none / 29 s** at both widths, mirrored cover_eyes-02 + dab-01 none, hard reel none at 11.7 fps; local: `motion-hard` (the same negatives zooming and swaying) none / 29 s, `neutral-mix` (nine rest photos, 30 s) none; corpus neutral-60s 0, hard-negatives-60s 0; synthetic talking with all five lip pairs 0.00 on 9/9 faces (`emotes-r3-talk-laugh-synth`). Caveat: a synthetic laugh with narrowed lids fires on 2–3 of 9 faces (D6) |
| S6 | Sequence in order; ×3 with short rests fires ×3; a 10 s hold fires once | **PASS (D5 caveat)** | `sequence-three` corpus PASS; `sweep` (flex, thumb, yawn, flex, thumb, yawn) 6/6 in order at both widths; `repeat` (1.3 s rests) 3/3 at both widths; `fast` (no rest) 3/3 at both widths; holds: hold-yawn / hold-thumb / hold-flex exactly once at both widths, 12/12 corpus holds. **Rests of 0.6 s merge** (local `quick-thumb` 1/3, `quick-flex` 2/3, `quick-yawn` 3/3; D5) |
| S7 | Three live meters; when nothing fires the page says which cue is missing | **PASS** | Meters move per frame (`scaleX`), active bar amber; status shows e.g. "Almost a Goblin Muscle: Raise the fist higher, well above the shoulder." and "Almost a Princess Yawn: Relax your brows; a frown reads as a scream."; no two "Almost" lines closer than 900 ms in 26 runs; the row turns pink with "Almost: …". Copy is in seconds. The cooldown is still invisible (critique) |
| S8 | Phone: front camera portrait, fits, tappable, sound after tap, as reliable within 1 s | **PARTIAL (D7, H11)** | `facingMode: "user"`, audio created in the click, buttons 51 px tall, `scrollWidth` 390; **time-based hysteresis proven on the real pipeline at phone frame rates**: CPU-throttled 4× / 6× the page ran at 14.1 / 12.8 / 12.3 / 11.7 / 10.3 fps and fired the official clip at 96–629 and 290–700 ms, `fast` 3/3, `tu04x4` 4/4, `hard` none (local); every 390 px live reel passes except the one `tu04x4` run (D8). A portrait file through Chrome's fake camera comes out **480 × 480** (the device honours the site's 640 × 480 request), which at least proves the D6 code path: the stage became `480 / 480` (358 × 358 at 390 px) and all three gestures fired at 235 / 311 / 663 ms. Layout D9 unchanged (D7). A real phone, a true portrait stream and iOS Safari remain H11 |
| S9 | Demo mode | **PASS** | Live at 1280 and 390 × dark and light: Thumbs Up, Goblin Muscle, Princess Yawn at ≈ 2.2–2.5 / 5.0–5.2 / 7.6–7.9 s and again at ≈ 10.5 / 13.2 / 15.9 s (6 fires / 17 s); `getUserMedia` never called; requests during the demo: the three MP3s and the favicon only; zero page errors |
| S10 | Private and offline; health | **PASS** | Hosts contacted during load + camera + one clip: **`emotes.kalpkan.com` only**; after "Watching" only `GET /favicon.svg`; `/ingest/*` = PostHog proxy (config, recorder, dead-clicks); `/health.json` → `{"ok":true,"service":"emotes"}` |

Cross-cutting on `10c2bae`: `npm run typecheck` clean; `npm run test:unit` **65 passed**; `npm run test:corpus` **110 passed**; `npm run report` = README "Numbers today" exactly (stills 100 % ×3, 0/9 neutral, 0/33 hard, 1/8 occluded detected, 0 wrong; clips 70/70, precision / recall 100 % ×3, neutral and hard minutes 0, latency median 240 / p95 500 / max 700 ms; reels 9/9, median 500 / max 600 ms from the cut); CI on `10c2bae` `success`. `impeccable detect --json index.html`: 2 warnings (both false positives: `#emote-img` gets its `src` at runtime; the 31-character eyebrow is a label) + 1 advisory (1 px border + 30 px shadow on the emote card).

## Defects

### D1 — A clear flex (`flex-09`) plays Thumbs Up through the real pipeline; the gate was widened to accept it

Severity: **major** (S3 "I see Goblin Muscle"; a wrong emote on a corpus `ok` positive; the README calls it "one limit, on purpose", but the visitor does not read the README)

Steps to reproduce: `/usr/bin/python3 scripts/build_e2e_clips.py /tmp/emotes-e2e flex09x3` (rest 2 s + `flex-09` 2.5 s, three times); `GPU=1 CLIP=/tmp/emotes-e2e/e2e-flex09x3.mjpeg LABELS=/tmp/emotes-e2e/e2e-flex09x3-labels.json npm run e2e -- https://emotes.kalpkan.com/`, also with `WIDTH=390`.

Expected / Actual: Goblin Muscle three times. Actual live: `Thumbs Up@2245 Thumbs Up@6751 Thumbs Up@11510` at 1000 px and `Goblin Muscle@2812 Thumbs Up@7043 Thumbs Up@11197` at 390 px, both reported **PASS** because `scripts/build_e2e_clips.py:33` (`ACCEPT = {"flex09x3": {"flex": ["thumbs_up"]}}`) and `tests/video.test.ts` ("Thumbs Up may be the one that plays") accept either emote. The photo (a boy flexing one arm, knuckles up, looking at his bicep) is unambiguously a flex and is labelled `ok` / `flex` in `tests/fixtures/stills/labels.json`.

Evidence: `emotes-r3-e2e-live-2026-09-19.txt` (`flex09x3` at both widths); `emotes-r3-flex09-video-cues-2026-09-19.txt` (the VIDEO-mode reel through `rawScores` + `GestureEngine` + `EmoteGate`): from the first frame after the cut the hand model reports `folded 1.0 up 1.0 upright 1.0 clear 1.0`, while the pose cues are `bend 0.0 height 0.0` for 300 ms and the raw flex score reaches 1.0 only at +400 ms; the smoothed thumbs-up crosses 0.5 at +100 ms and fires at +200 ms (`EDGE thumbs_up PLAY Thumbs Up`), the flex becomes active at +1000 ms and takes the hold over silently.

Likely cause: `src/gestures/engine.ts:102` `THUMB_ON_ARM_MS = 450` only delays a thumbs-up when `min(bend, beside, level) ≥ 0.5` (`engine.ts:210-213`), which is exactly what the pose model cannot deliver in the first 300 ms after the fist appears; and `resolveConflicts` (`engine.ts:131`) drops the flex whenever it scores less than 0.9 × the thumbs-up, which during the pose model's settling is always. The hand rule's `up` cue (`src/gestures/thumbsUp.ts:71`, thumb tip 0.6–1.1 hand-lengths above the wrist) is satisfied by any fist whose wrist is curled towards the shoulder, i.e. every flex.

Suggested fix: delay a thumbs-up whenever the same hand's wrist is above its shoulder in the pose (a cheap pose-only test that is stable from the first frame), not only when the full arm-beside-head triple is there, and let the flex win the takeover with its own emote when it becomes active within ~600 ms of a thumbs-up that fired on an arm that was already raised (i.e. treat the first emote as provisional for a raised arm). Then remove the `accept` from `flex09x3` so the gate measures what the visitor sees.

### D2 — The back-view double-biceps flex (`flex-12`) fires 1.5 s after onset

Severity: **minor** (bar: ≤ 1000 ms max; 4 of 5 flexes in the reel are at 269–500 ms)

Steps: `emotes-r3-build-e2e-clips.py DIR flex-both` then the reel through `emotes-r3-e2e-harness.mjs` (local build). Actual: `Goblin Muscle@8025` for an event starting at 6500 ms (`emotes-r3-e2e-local-2026-09-19.txt`, `flex-both`). Likely cause: from behind, the pose model's shoulder / elbow estimate takes longer to settle and the `level` / `beside` cues (`src/gestures/flex.ts:66-79`) hover around their ramps, so the smoothed score needs ~1.3 s to hold ≥ 0.5 for 150 ms. Suggested fix: add `flex-12` (and `flex-11`) as VIDEO-mode reels and check whether the `level` band (`-0.5 … 0.4` shoulder widths) or `beside` (`0.08 … 0.25`) is the slow cue; widen the slower one for the two-arm case where both arms agree.

### D3 — The borderline yawn (`yawn-17`) never fires on video

Severity: **minor → counts against S4** (1 of 8 clear yawns; round-2 D5 said it would flicker under jitter, on the real pipeline it does not fire at all)

Steps: `emotes-r3-build-e2e-clips.py DIR yawn-more` through the harness (local). Actual: yawn-05 / 07 / 12 / 18 / 03 fire at 480–714 ms, `missed yawn (15500-18000 ms)` for yawn-17. Likely cause: `src/gestures/face.ts:128-135`: its IMAGE-mode brow lift ratio is 0.109 against the 0.10–0.125 ramp (brows cue 0.38, score 0.56); in VIDEO mode the ratio sits a little lower and the score stays under 0.5 for the whole hold. Suggested fix (as round 2): lower `BROWS_DOWN` to 0.095 (screams measure 0.07–0.107 in the corpus, so 0.095–0.125 keeps a margin) or weight `brows` less than `mouth` when the mouth cue is ≥ 0.9.

### D4 — Yawn recall on the held-out landmark sets is still 63–75 % (round-2 D6, unchanged)

Severity: **minor** (the corpus bar passes; the far reel passes on video; but a phone at arm's length is a small face and the eye cue is the weak link)

`emotes-r3-variants-stills-2026-09-19.txt` (this round's re-extraction, same numbers as round 2): mirror yawn 5/8, portrait 6/8, far 5/8; yawn-19 scores 0 in the portrait and far sets because `avgEyeOpenRatio` reads 0.19–0.21 (open); yawn-07 0.50 / 0.00 / 0.00. Precision 100 % and 0 negatives fired on all three sets, so the risk is misses, not false emotes. Likely cause: `face.ts:126` `EYES_OPEN = 0.14` and the `eyes / 0.6` cap at `face.ts:142`. Suggested fix: when `mouth ≥ 0.9` relax the eyes cap (e.g. `eyes / 0.4`) or measure the eyes over a 300 ms window; commit the variant sets' landmarks (they are landmarks, not photos) as a held-out gate so the next tuning cannot overfit the originals.

### D5 — The same gesture repeated with a 0.6 s rest merges into one hold

Severity: **minor** (the bar's repeats use 1.2–1.5 s rests and pass 3/3 live at both widths; a visitor pumping a thumbs-up quickly sees one emote)

Steps: `emotes-r3-build-e2e-clips.py DIR quick-thumb quick-flex quick-yawn` (1.5 s holds, 0.6 s rests, ×3) through the harness. Actual: `quick-thumb` Thumbs Up 1 of 3, `quick-flex` 2 of 3, `quick-yawn` 3 of 3 (`emotes-r3-e2e-local-2026-09-19.txt`). Likely cause: `src/gestures/engine.ts:88-89` `OFF_MS = 500` plus the 200 ms smoothing (`SMOOTH_MS`, `engine.ts:87`): after the hand drops the smoothed score needs ~210 ms to fall under 0.35, leaving ~390 ms of "gone" in a 600 ms rest, short of the 500 ms release, so the next hold is the same hold and produces no edge. Suggested fix: make the release faster when the raw score is exactly 0 (no hand at all, as opposed to a low score), e.g. drain `gone` from the raw score rather than the smoothed one, or lower `OFF_MS` to 300 ms for thumbs-up and flex (the yawn already copes). Add a 0.6 s-rest repeat clip to `tests/clips.test.ts` and say the minimum rest in the note if it stays.

### D6 — A big laugh with narrowed eyes is geometrically a yawn (synthetic; no laugh photos in the corpus)

Severity: **minor** (risk, not a measured failure: the neutral corpus has no laughing photos, and the spec's S5 list does not name laughing)

`emotes-r3-talk-laugh-synth-2026-09-19.txt`: on the nine real neutral faces, a mouth opened to a 0.6–1.0 open ratio with the lids scaled to 30 % (EAR 0.06–0.09) fires Princess Yawn on angry-03 and angry-07 (score 0.79 / 0.65), and with the lids at 15 % on angry-02 as well; every talking and shouting variant with open eyes scores 0.00. Likely cause: `face.ts:142`: with `mouth = 1`, `eyes = 0.75` gives `min(0.9, 1.25, 0.3 + 0.7·brows)`, so relaxed brows plus squinting eyes pass the 0.5 line after 400 ms. Suggested fix: laughing is shorter and mouth-corner-wider than a yawn: gate the yawn on `mouthWidthRatio` not growing (a laugh widens the mouth, a yawn does not) or ask Kalp for a handful of laugh photos for the `hard` set (the Desktop corpus has an empty `laugh/` folder).

### D7 — Phone fold: Mute wraps alone and the emote card hides a third of the stage (round-2 D9, unchanged)

Severity: **minor** (S8 polish; the buttons are 51 px tall and tappable)

At 390 × 844 live: `Start camera · Play demo · Stop` on one row and `Mute` alone on the next (y 577), the status under it, "The three gestures" at y ≈ 720; the 118 × 128 emote card sits over the right third of the 358 × 269 stage, on top of the stick figure's raised hand in demo mode (`emotes-r3-live-390-dark-demo-2026-09-19.jpg`, `emotes-r3-ux-live-2026-09-19.json` `layout`). Likely cause: `index.html:41-47` (four full-width pill buttons in a wrapping flex row, status below), `src/style.css:150-165` (`.emote` anchored bottom-right at `min(clamp(96px, 30vw, 200px), 36cqh)`), no `@media` rule in the stylesheet. Suggested fix: make Mute an icon button in the stage corner, put the reacting status line inside the stage as an overlay caption (like the demo caption), and at ≤ 480 px centre the emote card over the stage at 60 % opacity or dock it above the stage.

### D8 — One of six live 390 px runs of the beside-the-head thumb lost its last two passes, cause not attributable from the repo harness

Severity: **minor** (tooling until it recurs; no wrong emote, and 5/6 runs plus 3/3 with frame-gap logging were 4/4)

Actual: run 1 of `tu04x4` at 390 px live fired `Thumbs Up@2573 Thumbs Up@6740` and nothing for the passes at 11,000 and 15,500 ms (`emotes-r3-e2e-live-2026-09-19.txt`); runs 2–3 and three reruns with `emotes-r3-e2e-harness.mjs` (19.7 / 19.7 / 18.8 fps, max frame gap 76–100 ms) fired 4/4 (`emotes-r3-e2e-tu04x4-390-live-rerun-2026-09-19.txt`). Round 2 saw a fake-camera stall once as well. Likely cause: unknown; candidates are Chrome's fake video device stalling mid-loop or the page's loop stalling. Suggested fix: have `scripts/e2e-camera.mjs` record the pipeline's frame times (a MutationObserver on a meter value, as the round-3 harness does) and the `<video>` `currentTime` per second, and print both on a FAIL, so a stall is attributed to the camera or to the page.

### D9 — The README and the "How it works" copy describe a conflict rule the code does not implement

Severity: **minor** (documentation honesty; the numbers in the README are correct)

`README.md:17` and `index.html` "How it works" item 3 say "a clear thumbs-up (≥ 0.9, every hand cue there) beats a flex that is not itself clear (< 0.9); otherwise … the flex wins unless the thumbs-up leads by a wide margin". `src/gestures/engine.ts:124-135` implements one rule: the flex keeps its fist iff `flex ≥ 0.9 × thumbs_up`, else the thumbs-up wins; there is no absolute 0.9 test and no "wide margin" branch (that was round 1's `> 0.25` veto, removed in `ea1e718`). Suggested fix: rewrite both sentences to match the ratio rule, and mention the raised-arm 0.45 s delay, which neither text does.

## UX critique (impeccable, critique mode)

⚠️ DEGRADED: single-context (this session exposes no sub-agent tool; Assessment A was written from the source, the live screenshots and the round-3 measurements before the detector output was read). Questions skipped: unattended workflow run. Snapshot not persisted (no `.impeccable/` in the project; nothing to compare against).

Mode: Operate (the visitor is trying to make an emote fire). Design specificity: authored for this product: the stage is first, the emote art lives in the meter rows, the stick-figure demo is honest about being landmarks, the Supercell notice and the privacy line are where a stranger looks for them; the palette (aubergine, amber, cyan, pink) is its own. Cognitive load: one decision point with two real options (camera or demo) plus Stop and Mute; no more than four visible choices anywhere; the only checklist failure is that the most important line (status / hint) has the least visual weight. Emotional journey: the peak is the emote popping with its sound over your own face, which now arrives reliably; the valley is a quick repeat that does nothing with no explanation (D5) and, for one flex style, the wrong emote (D1); the end (Stop → "Stopped.") is flat but not negative.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The status line reacts (progress, "Watching", "Almost a …") and no longer flickers, but it is muted grey under the buttons, off the stage the eyes are on; the 2 s / 0.7 s waits are described in the note and never shown |
| 2 | Match system / real world | 3 | Copy is in seconds and body parts; "MediaPipe", "landmarkers", "478 face points" remain in the lede and How-it-works; the How-it-works conflict sentence no longer matches the code (D9) |
| 3 | User control and freedom | 3 | Start / Stop / Mute / Demo; no camera picker for a laptop with two, no un-mirror |
| 4 | Consistency and standards | 4 | One button style, one card style, tabular percentages, `aria-pressed` on Mute, `aria-live` on status and hints |
| 5 | Error prevention | 3 | Hard negatives, motion, dim light and 10 fps all stay silent, which is the hard part; the remaining traps are a thumb-on-top flex (D1) and quick repeats (D5) |
| 6 | Recognition rather than recall | 3 | Meter rows carry the art and a one-line instruction, the hint says what to change, the demo shows the poses; nothing marks *which* moment counted |
| 7 | Flexibility and efficiency | 2 | No keyboard shortcuts, no threshold or cooldown control, no per-gesture disable |
| 8 | Aesthetic and minimalist design | 3 | Clean and well spaced on a laptop; on a phone the coaching is below the fold and the emote card sits on the subject (D7); the stage-first layout pushes the buttons below the fold on a 1080 px-tall laptop window too (stage 516 px + masthead) |
| 9 | Error recovery | 3 | Refused / missing / failed camera each get a sentence and the demo as a way out |
| 10 | Help and documentation | 3 | How-it-works is accurate except D9; no "why didn't it fire?" beyond the hint |
| **Total** | | **30/40** | Solid and now trustworthy on the laptop; the phone and the two remaining traps keep it from delightful |

What works: the emote pop over your own mirrored face with the sound, now within ~0.3 s for the common poses; the pink "Almost: …" row that names the missing cue; a demo that is truthful; a page that stays private and fast (Lighthouse 1.00, only its own host on the wire).

Priority issues: **[P0]** D1 (wrong emote on a common flex style). **[P1]** D7 phone fold and the status line's placement: put the reacting line in the stage as an overlay caption in the text colour. **[P1]** D5: a quick repeat that does nothing needs either to work or to say why (a thin ring draining after a fire would explain the cooldown and the release at once). **[P2]** D3/D4 yawn recall on small faces and borderline brows. **[P3]** D9 copy.

Persona red flags. *Jordan (first-timer, laptop)*: flexes with her knuckles up the way the demo's stick figure does, gets Thumbs Up, and thinks the detector guessed. *Sam (phone, portrait)*: the buttons wrap, the status is under them, the meters are off-screen; the emote card lands on his raised hand. *Alex (developer)*: pumps a thumbs-up three times in two seconds, sees one emote, and does not know whether it is the 2 s cooldown or a miss. Minor observations: `prefers-reduced-motion` is not honoured by the pop animation; the percentage values stay muted even when their bar is amber; the demo caption and the emote card can overlap at 390 px; `color-scheme: dark` only, which reads fine in a bright room.

Detector (Assessment B, read after A): 2 warnings, both false positives (`#emote-img` receives `src` at runtime; the 31-character eyebrow is a label) and 1 advisory (1 px border + 30 px shadow on the emote card). No layout-transition findings.

## Known limitations that are NOT defects

- No real camera, phone or iOS Safari in the agent sandbox: the "real pipeline" is Chrome's fake camera fed with slideshows of the labelled photos (hard cuts, plus this round's slow zoom-and-sway and a dim blurry variant). It exercises the site's landmarkers and rules on real faces and hands, and this round at phone frame rates, but not real motion blur or a portrait stream; a portrait MJPEG comes out of the fake device as 480 × 480 because the site asks for 640 × 480. H11 (Kalp on his phone) remains the honest test of S8.
- The held-out sets in D4 are transforms of the same 95 photos, not new people; the laugh and talking probes in D6 are synthetic morphs of real neutral faces, not photos of laughing people.
- The photo corpus is copyrighted stock imagery: only landmarks are in the repo; the e2e clips and the variant sets are rebuilt from the Desktop folder by the scripts in `docs/reports/evidence/`; no camera-frame screenshot is committed.
- In a background tab the demo crawls (`setTimeout` chain throttled to 1 Hz) and the camera loop stops itself on `visibilitychange`; a visitor who switches tabs and back sees the demo resume slowly. This is what made the claude-in-chrome pass useless this round (hidden tab).
- The 26 local runs were made on the local production build of the same commit (bundle identical bar the PostHog key), because two headless Chromes on one GPU would have inflated the live latencies; every live reel from rounds 1–2 was nevertheless run on the deployed URL at both widths.
- `flex09x3` is reported PASS by the repo's own harness because its ground truth accepts Thumbs Up (D1); the number to watch is the emote name in the `fires` line, not the verdict.

## How a fixing agent should verify the fix

```bash
cd ~/projects/emotes && git pull --rebase
npm run typecheck && npm run test:unit && npm run test:corpus && npm run report   # 65 / 110 passed; report unchanged or better
S=/tmp/emotes-e2e; mkdir -p $S
/usr/bin/python3 scripts/build_e2e_clips.py $S all                                  # rounds 1-2 reels
/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r3-build-e2e-clips.py $S   # round-3 reels (portrait, motion, dim, quick-*, neutral-mix, flex-both, thumbs-more, yawn-more, motion-hard)
python3 scripts/build_e2e_clip.py && npm run build && (npx vite preview --port 4173 --strictPort &) && sleep 2
H=~/projects/portfolio/docs/reports/evidence/emotes-r3-e2e-harness.mjs
# D1: remove the accept from flex09x3 in scripts/build_e2e_clips.py + tests/video.test.ts first, then
for i in 1 2 3; do GPU=1 CLIP=$S/e2e-flex09x3.mjpeg LABELS=$S/e2e-flex09x3-labels.json node $H http://localhost:4173/; done   # Goblin Muscle 9/9, Thumbs Up 0
GPU=1 CLIP=$S/e2e-flex-both.mjpeg LABELS=$S/e2e-flex-both-labels.json node $H http://localhost:4173/      # D2: five flexes, max latency <= 1000
GPU=1 CLIP=$S/e2e-yawn-more.mjpeg LABELS=$S/e2e-yawn-more-labels.json node $H http://localhost:4173/      # D3: 6/6 incl. yawn-17
for n in quick-thumb quick-flex quick-yawn; do GPU=1 CLIP=$S/e2e-$n.mjpeg LABELS=$S/e2e-$n-labels.json node $H http://localhost:4173/; done   # D5: 3/3 each (or the note states the minimum rest)
for n in tu04x4 fast hard hard2 misses repeat mirror sweep far hold-yawn hold-thumb hold-flex tu17x4 motion motion-hard dim neutral-mix thumbs-more; do GPU=1 CLIP=$S/e2e-$n.mjpeg LABELS=$S/e2e-$n-labels.json node $H http://localhost:4173/; done   # all PASS, hard/motion-hard/neutral-mix "none"
GPU=1 WIDTH=390 THROTTLE=6 node $H http://localhost:4173/ && GPU=1 WIDTH=390 THROTTLE=6 CLIP=$S/e2e-fast.mjpeg LABELS=$S/e2e-fast-labels.json node $H http://localhost:4173/   # ~12 fps: PASS
GPU=1 BROWSER=playwright node $H http://localhost:4173/                                                    # Playwright Chromium: PASS
# D4: held-out sets (rebuilt from the Desktop photos, never committed)
/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r2-make-variants.py /tmp/emotes-variants
for v in mirror portrait far; do mkdir -p /tmp/emotes-stills-$v && cp tests/fixtures/stills/labels.json /tmp/emotes-stills-$v/ && /usr/bin/python3 scripts/extract_still_landmarks.py --src /tmp/emotes-variants/$v --out /tmp/emotes-stills-$v; done
cp ~/projects/portfolio/docs/reports/evidence/emotes-r2-variant-eval.ts .variant-eval.ts && npx vite-node .variant-eval.ts /tmp/emotes-stills-mirror /tmp/emotes-stills-portrait /tmp/emotes-stills-far; rm .variant-eval.ts   # yawn recall >= 7/8 on each, precision 100 %, 0 neutral/hard fired
# D6: synthetic laugh probe (copy into the repo root, run, delete): see emotes-r3-talk-laugh-synth-2026-09-19.txt for the script's output format
# D7: layout at 390 x 844
node ~/projects/portfolio/docs/reports/evidence/emotes-r2-ux-puppeteer.mjs http://localhost:4173/ local   # muteRect on the first button row, meters heading above y 640, emote card not over the stage centre
pkill -f "vite preview --port 4173"
# after the deploy: the live rows in verification.md
curl -s https://emotes.kalpkan.com | grep -o 'index-[A-Za-z0-9_-]*\.js'     # new hash
GPU=1 npm run e2e -- https://emotes.kalpkan.com/ && GPU=1 WIDTH=390 npm run e2e -- https://emotes.kalpkan.com/
for W in 1000 390; do GPU=1 WIDTH=$W CLIP=$S/e2e-flex09x3.mjpeg LABELS=$S/e2e-flex09x3-labels.json node $H https://emotes.kalpkan.com/; done   # Goblin Muscle x3, both widths
node ~/projects/portfolio/docs/reports/evidence/emotes-r2-net-puppeteer.mjs https://emotes.kalpkan.com/ live   # hosts: emotes.kalpkan.com only; after Watching only /favicon.svg
npx lighthouse https://emotes.kalpkan.com/ --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new" --quiet && python3 -c "import json;print(json.load(open('/tmp/lh.json'))['categories']['performance']['score'])"   # >= 0.85
gh run list -R KalpKan/emote-detector-web --limit 1 --json conclusion   # success
```

---

## Round 2 report (2026-09-19, kept for history)

Production then served `9807a11`; the round-2 findings (D1 thumb beside the head → Goblin Muscle 8/13, D2 back-to-back gesture lost, D3 hint flicker, D4 deploy blocked, D5–D9 minors) and their evidence are in `docs/reports/evidence/emotes-r2-*`; the re-test table above records each one's state on the live `10c2bae`. Round 1 (35/100 on `9807a11`) is summarised in STATUS.md row T5.a-emotes-r1 and `emotes-r1-*`.

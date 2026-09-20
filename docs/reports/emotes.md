# emotes (Emote Detector) functional audit — 2026-09-20 (TEST + CRITIQUE round 4)

Live URL https://emotes.kalpkan.com · Repo `KalpKan/emote-detector-web` (local `~/projects/emotes`, audited at commit `d80120d` = `origin/main`, clean; CI on `d80120d` and `51f74f8` `success`, unit + corpus) · Vercel project `emotes` (repo root, framework Vite, static, `prj_mgoUdU4NQ9X8sfP7Jhcy4xBBM6pr`; production deployment `emotes-koe3cca3l`, 2026-09-20 00:01 UTC) · Database none · Health route `https://emotes.kalpkan.com/health.json` → `{"ok":true,"service":"emotes"}`

**Everything below was measured on the deployed site.** The live bundle is `assets/index-Cx23TXpj.js` (immutable); a local `npm run build` of `d80120d` differs from it only by the injected PostHog key (4 diff lines, `evidence/` method as in round 3). Method: the repo's own gates (`npm run typecheck`, `test:unit`, `test:corpus`, `report`); **81 fake-camera runs on the deployed URL** through the site's own landmarkers on the Mac GPU (the round-3 judge `emotes-r3-e2e-harness.mjs`, one Chrome at a time, 12.6–20.1 pipeline fps, plus six `?trace` runs with the repo's `scripts/e2e-camera.mjs` to read a wrong or missing emote frame by frame): every round-1/2/3 reel at 1000 px, twenty-four reels at 390 px, and **eighteen new round-4 reels** built by `emotes-r4-build-e2e-clips.py` — every one of the 37 clear positives once (`all-flex`, `all-thumbs`, `all-yawn`, with the rest photo alternating between a face with no hands and a person talking with hands at a desk), all 33 hard negatives in one 100 s reel, the 9 occluded yawns and 6 partial stills, seven gestures morphing into one another with no rest, flex ↔ thumbs-up takeovers, 0.8 s and 1.0 s rests, 0.6–1.0 s holds, mirrored and far (55 %) `flex-09`, the official sequence over five different rest photos, and crossfaded variants of the failures; CPU-throttled 390 px runs at 11.5–12.9 fps; Playwright's Chromium; the three held-out landmark sets re-extracted; headless real Chrome at 1512 × 627 (Kalp's own Chrome viewport), 1440 × 800, 1280 × 900, 1920 × 1080, 430, 390 and 360 px in both colour schemes with `prefers-reduced-motion`, an `HTMLMediaElement.play` spy and the Mute button; the network/privacy probe; Lighthouse mobile ×2; `impeccable detect` and a single-context critique. The claude-in-chrome pass on Kalp's Chrome was degraded for the third round running (tab hidden behind other agents' tabs, `resize_window` reported success but the viewport stayed 1512 × 627, the demo throttled to 1 Hz); it still confirmed one host on the wire and no site errors, and it is where the fold defect (D9) was first seen. Another agent's fake-camera Chromes shared the GPU from 01:20 UTC (the throttled, Playwright, Lighthouse and held-out runs); the 66 batch runs before that had the GPU alone. Evidence: `docs/reports/evidence/emotes-r4-*` (scripts included; no photo frame committed because the frames are the stock photos).

## Verdict: PARTIALLY WORKING

The round-3 blocker is gone and the thumbs-up is now the most reliable thing on the page: **every one of the 16 clear thumbs-up photos fires Thumbs Up through the live pipeline at 1000 and 390 px (32/32, 280–689 ms)**, the flex whose other hand reads as a thumbs-up plays Goblin Muscle **3/3 in five runs** (1000 px ×2, 390 px, Playwright, and mirrored 3/3 ×2), the thumb beside the head is Thumbs Up 8/8, seven gestures back to back with no rest fire 7/7 in order at both widths and at 12 fps, 0.6–0.8 s holds fire 5/5, 0.8 s and 1.0 s rests fire 3/3 ×8, and **nothing fires in 7 min 20 s of negatives** (all 33 hard negatives twice, both hard reels twice, the moving hard reel, the 30 s neutral mix). No console error in 81 runs, only `emotes.kalpkan.com` on the wire, Lighthouse 1.00 / 1.00 / 1.00 twice.

What keeps it from consumer grade is the flex, and this round found out why it has looked solid: every earlier reel rested on the same no-hands photo. **Two of the 13 clear flexes (`flex-04`, `flex-06`) never fire when the frames before them show a person with their hands on a desk** (3 of 4 missed at 1000 px, 4 of 4 at 390 px, a crossfade instead of a hard cut changes nothing), and fire 4/4 after the no-hands rest; the per-frame trace shows the lite pose model alternating between *no pose* and a wrong pose for the whole 2.5 s hold, with the wrist read at shoulder height, and the same two photos are the misses in the held-out portrait and far sets (flex recall 77 %). Live flex recall over the full positive set is **11/13 at both widths (85 %, bar 90 %)**. At 55 % scale (a subject about 2 m from a laptop) `flex-09` plays **Thumbs Up on 3 of 15 passes and nothing on 6**: the round-3 wait rule expires after 500 ms because the far pose never settles. And a thumbs-up that turns into a flex with the fist still up (or the reverse) plays only the first emote: the "one fist, one emote" takeover swallows the second gesture 4 times in 12 even after a 2.5 s hold. The round-3 minors are all still there: `flex-12` at 922–1055 ms and once missed, `yawn-17` never on video, 0.6 s rests merging (0.8 s is the real minimum and the page does not say so), the phone fold, plus two new layout findings (the buttons and the status sit below the fold on a 627 px-tall laptop window; the pop animation ignores `prefers-reduced-motion`). Score **75/100** (round 3: 72).

## Round-3 defects re-tested (all on the live `d80120d`)

| Round 3 | Result |
|---|---|
| D1 `flex-09` plays Thumbs Up 5/6, gate widened to accept it | **Fixed at normal distance**: `flex09x3` Goblin Muscle 3/3 at 1000 px (two runs, 248–649 ms), 3/3 at 390 px, 3/3 in Playwright Chromium, mirrored `flex09-mirror` 3/3 at both widths; Thumbs Up **0** in 18 passes; the `accept` is gone from the builder, judge and `tests/video.test.ts`. **Not at distance**: the same photo at 55 % plays Thumbs Up 3/15 and nothing 6/15 (new D2) |
| D2 `flex-12` fires at 1.5 s | **Not fixed**: 922 ms (1000 px `all-flex`), **1,055 ms** (390 px `all-flex`), **missed** in `flex-both` at 1000 px (round-3 FIX measured 977 ms) |
| D3 `yawn-17` never fires on video | **Not fixed**: missed in `all-yawn` at 1000 and 390 px and in `yawn-more` at 1000 px (3/3 misses) |
| D4 held-out yawn recall 63–75 % | **Not fixed** (identical numbers: mirror 5/8, portrait 6/8, far 5/8); and the same files show **flex recall 77 % on portrait and far** (flex-01/04/06), which round 3 did not report |
| D5 0.6 s rests merge | **Not fixed**: `quick-thumb` 1/3 at 1000 and 390 px, `quick-flex` 2/3 and 3/3 (978 / 920 ms), `quick-yawn` 3/3; new: **0.8 s rests fire 3/3** (thumb and flex, both widths), 1.0 s rests 3/3 |
| D6 synthetic laugh = yawn | Not re-tested (still no laugh photos; the Desktop `laugh/` folder is still empty) |
| D7 phone fold | **Not fixed**: buttons on two rows at 360 / 390 / 430 px, meters heading at y 709–739, no `@media` rule in `src/style.css` |
| D8 one 390 px run lost two passes | **Not reproduced**: 0 stalls in 24 live 390 px runs and 42 at 1000 px, every run 12.6–20.1 fps with frame-gap max ≤ 282 ms (the judge now prints fps on every run) |
| D9 README / How-it-works copy ≠ code | **Fixed** (`51f74f8`): both describe the ratio rule, the 0.5 s wait and the 2 s / 0.7 s gaps as implemented |

## User stories tested (live unless marked)

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load and start | **PASS** | `HTTP/2 200`, `server: Vercel`, health ok; click → "Watching…" in **1,145 ms** with the progress line (camera → runtime → face → hand → pose → "Models ready."); models ready 1.7–2.3 s after the stream in every live run; Lighthouse mobile **1.00 / 1.00 / 1.00** twice (LCP 1.3–1.4 s, TBT 30–40 ms, CLS 0); zero page errors at 7 viewports × 2 schemes and in 81 fake-camera runs; `scrollWidth` = viewport at 360/390/430/1000; `/assets/*`, `/mediapipe/*` immutable, MP3s `max-age=86400` (`emotes-r4-net-live`, `-lighthouse`, `-ux-live`). Caveat D9: on a 627 px-tall laptop window nothing clickable is in the first viewport |
| S2 | Thumbs-up, either hand, chest height or beside the face, once within 1 s | **PASS** | `all-thumbs` (all 16 clear photos) **16/16 at 1000 px (280–689 ms) and 16/16 at 390 px (max 704 ms)**; `tu04x4` 4/4 + 4/4 (563–680 ms), `tu17x4` 4/4, `thumbs-more` 6/6, official / misses / repeat / mirror / far / sweep / motion / dim / portrait at both widths; holds fire once; `short-hold` 0.8 s and 0.6 s thumbs-ups fire; throttled 12.4–12.9 fps 3/3 |
| S3 | Flex, fist beside the head, once within 1 s | **FAIL (D1, D2 majors; D4 minor)** | `all-flex` (all 13 clear photos) **11/13 at 1000 px and 11/13 at 390 px**: flex-04 and flex-06 never fire after the hands-at-a-desk rest (`a10-flex` 1/4 and 0/4; 4/4 and 4/4 after the no-hands rest); flex-12 922 / 1,055 ms; far `flex-09` 6/15 correct with 3 Thumbs Up (D2). Everything else passes: flex09x3 3/3 ×5 incl. mirrored, `flex-both` 4/5, sweep / far / motion / dim / portrait flexes, holds once, rests ≥ 0.8 s 3/3 |
| S4 | Yawn once within 1 s; an occluded yawn never becomes another emote | **PARTIAL (D5, D6)** | `all-yawn` (all 8 clear photos) **7/8 at both widths** (442–810 ms; yawn-17 missed); `yawn-more` 5/6 (same miss); occluded reel: yawn-09 and yawn-15 play Princess Yawn, the other 7 occluded yawns and 6 partial stills play nothing wrong (thumbs_up-05 plays Thumbs Up, its own gesture); screams angry-01/05/06 nothing in 4 reels; held-out yawn recall 63–75 % |
| S5 | Nothing fires on sitting, talking, looking around, scratching, cover-eyes, dab | **PASS** | `all-hard` (15 cover-eyes, 15 dabs, 3 screams, 100 s) **none at 1000 and 390 px**; `hard` and `hard2` none ×4; `motion-hard` none; `neutral-mix` (nine rest photos, 30 s) none; five different rest photos in `other-rest` fire nothing; corpus neutral-60s 0, hard-negatives-60s 0. **0 false emotes in 7 min 20 s of live negatives** |
| S6 | Sequence in order; ×3 with short rests fires ×3; a 10 s hold fires once | **PARTIAL (D3, D7)** | `morph` (flex → thumb → yawn → flex → yawn → thumb → flex, 1.5 s each, no rest) **7/7 in order at 1000, 390, 12 fps and Chromium**; `fast` 3/3 ×3; `sweep` 6/6; `repeat` 3/3; `rest08-*` and `rest10-*` 3/3 ×8; holds once ×3. **But** a flex → thumbs-up or thumbs-up → flex with the fist kept up loses the second emote (`takeover` 4/6 at both widths, D3) and 0.6 s rests merge (D7) |
| S7 | Three live meters; when nothing fires the page says which cue is missing | **PASS** | meters update per frame, hints such as "Almost a Princess Yawn: Relax your brows; a frown reads as a scream." appear in the status; no "Almost" swap under 900 ms in 75 recorded runs (up to 14 status changes per run); copy in seconds. The 2 s / 0.7 s waits and the 0.8 s minimum rest are still invisible (critique) |
| S8 | Phone: front camera portrait, fits, tappable, sound after tap, as reliable within 1 s | **PARTIAL (D8, H11)** | `facingMode: "user"`, buttons 51 px tall, `scrollWidth` 360/390/430 = viewport; **CPU-throttled to 11.5–12.9 fps at 390 px**: official 3/3 (364–640 ms) ×3, `morph` 7/7, `short-hold` 5/5, `a04-flex` 4/4; 24 live 390 px runs match the 1000 px verdicts one for one; `portrait` reel 3/3 at both widths (stage 480 × 480 / 358 × 358). Sound: `HTMLMediaElement.play` called unmuted on every demo fire, none after Mute, Mute persisted (`emotes.muted`). Layout unchanged (D8). A real phone and iOS Safari remain H11 |
| S9 | Demo mode | **PASS** | Live at 1280 × 900 with reduced motion: Thumbs Up 2.33 s, Goblin Muscle 5.05 s, Princess Yawn 7.73 s, then again (5 fires / 15 s); `getUserMedia` never called; three MP3s + favicon the only requests; zero errors. Caveat: the 0.35 s pop plays under `prefers-reduced-motion: reduce` (D10) |
| S10 | Private and offline; health | **PASS** | Hosts contacted during load + camera + one clip: **`emotes.kalpkan.com` only**; after "Watching" only `GET /favicon.svg`; `/ingest/*` = PostHog proxy (config, recorder, dead-clicks); `/health.json` → `{"ok":true,"service":"emotes"}`; Kalp's own Chrome: 7 resources, one host |

Cross-cutting on `d80120d`: `npm run typecheck` clean; `npm run test:unit` **70 passed**; `npm run test:corpus` **114 passed**; `npm run report` = README "Numbers today" (stills 100 % ×3, 0/9 neutral, 0/33 hard, 1/8 occluded detected, 0 wrong; clips 70/70, precision / recall 100 % ×3, neutral and hard minutes 0, latency median 200 / p95 520 / max 700 ms; reels 11/11, median 500 / max 700 ms from the cut); CI `success` on both round-3 commits. `impeccable detect --json index.html`: 2 warnings (both false positives: `#emote-img` gets its `src` at runtime; the 31-character eyebrow is a label) + 1 advisory (1 px border + 30 px shadow on the emote card), unchanged.

**Real pipeline, all clear positives, live (the number the bar asks for):** thumbs-up 32/32, flex 22/26, yawn 14/16 over `all-*` at both widths → emote-level recall 100 % / 85 % / 88 %, precision 100 % / 100 % / 100 % (0 wrong emotes in those reels); latency median ≈ 330 ms, max 1,055 ms (flex-12); false triggers 0 in 440 s of negatives. The only wrong emote anywhere this round is the far `flex-09` (D2).

## Defects

### D1 — Two clear flexes never fire when the frames before them show hands on a desk; the pose model stays lost for the whole hold

Severity: **major** (S3; live flex recall 85 % over the clear set, bar 90 %; a visitor sitting at a desk who then flexes is the ordinary case)

Steps to reproduce: `/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r4-build-e2e-clips.py $S a10-flex a04-flex all-flex` (`a10-flex`: angry-10 "talking with hands at a desk" 2 s → flex-04 2.5 s → angry-10 → flex-06 → angry-10 → flex-04 → angry-10 → flex-06; `a04-flex` the same with the no-hands angry-04 rest); `GPU=1 CLIP=$S/e2e-a10-flex.mjpeg LABELS=$S/e2e-a10-flex-labels.json node ~/projects/portfolio/docs/reports/evidence/emotes-r3-e2e-harness.mjs https://emotes.kalpkan.com/`, also `WIDTH=390`.

Expected / Actual: Goblin Muscle ×4. Actual live: `a10-flex` **Goblin Muscle@2468 only** at 1000 px (3 missed) and **none** at 390 px (4 missed); `a10-flex-fade` (0.4 s crossfade instead of a hard cut) 1/4; `a04-flex` **4/4 at 1000 px, 4/4 at 390 px and 4/4 at 12.4 fps**; `all-flex` (rest alternating angry-04 / angry-10) misses exactly the two events after angry-10 (flex-04 at 15.5 s, flex-06 at 24.5 s) at both widths.

Evidence: `emotes-r4-e2e-live-1000-2026-09-20.txt`, `-390-`, `emotes-r4-traces-2026-09-20.txt` (§ `a10-flex`): during the flex-06 hold the pose is **absent on every other frame** (17 of 34) and on the frames that have one the flex cues read `bend 0.33 height 0.18 beside 0.47 level 1.00` for 2.5 s, identical frame after frame; raw flex never reaches 0.5. IMAGE-mode detection on the same 640 × 480 frame in Python puts the right wrist 0.07 above the shoulder; VIDEO mode after five angry-04 frames puts it 0.25 above (a clear flex), after five angry-10 frames 0.11–0.15 (marginal) and alternating `none` (`emotes-r4-traces` header note; command in "How to verify"). The full-resolution fixture has it 0.30 above, which is why the corpus scores 100 %. The held-out portrait and far sets miss the same two photos plus flex-01 (`emotes-r4-variants-stills-2026-09-20.txt`: flex recall 10/13 on both).

Likely cause: `src/landmarkers.ts:69-74` creates one `PoseLandmarker` (lite model, VIDEO mode, `numPoses: 1`) whose per-frame result depends on its tracking ROI from the previous frames; the flex rule (`src/gestures/flex.ts`, `height` = wrist above the shoulder, `bend` = elbow angle) takes the wrist and elbow from that pose only, while the hand model has the fist in the right place on every frame (pose gap a steady 0.25 in the trace, i.e. the pose wrist is 0.25 shoulder widths from where the hand model sees the fist). `src/gestures/engine.ts` treats a missing pose as `flex 0` and has no re-seed path, so a tracker that has locked onto a bad ROI never recovers while the subject holds still.

Suggested fix: (1) when the hand model sees a hand and the pose gap stays > `POSE_STALE_GAP` (or the pose is absent) for more than ~300 ms, re-seed the pose: call `detect()` on the current frame with a second `PoseLandmarker` created in IMAGE mode (kept warm; the lite model is 5.8 MB and already loaded) or recreate the VIDEO landmarker's tracking by `setOptions({ runningMode: "IMAGE" })` → `detect` → back to VIDEO; (2) let the flex rule take the wrist from the hand model when a fist is seen within 0.3 shoulder widths of either pose wrist, using the pose only for the shoulders and elbow; (3) add `a10-flex`, `a04-flex` and `all-flex` as VIDEO-mode reels (`extract_video_landmarks.py`) so the gate covers a rest with hands, and measure the `full` pose model's latency cost on the throttled harness before choosing it.

### D2 — At a distance (55 % scale) the flex whose other hand points at the bicep plays Thumbs Up or nothing (round-3 D1 at distance)

Severity: **major** (S3 wrong emote; 6 of 15 passes correct)

Steps: `emotes-r4-build-e2e-clips.py $S flex09-far flex09-far2 flex09-far-fade` (`^` = shrunk to 55 %, as the round-2 `far` reel); through the harness at 1000 px, and `flex09-far2` at 390 px.

Expected / Actual: Goblin Muscle each time. Actual live over five runs (15 far flex-09 events): **Thumbs Up 3, Goblin Muscle 6, nothing 6** (`flex09-far` TU / GM, traced rerun TU / GM, `flex09-far-fade` TU / GM / GM, `flex09-far2` GM 1/4 at 1000 px and 1/4 at 390 px). The far thumbs_up-04 in the same reels is Thumbs Up 3/3 and the far `flex-14` / `flex-04` in the round-2 `far` reel 2/2, so distance alone is not the problem; this photo's arm is.

Evidence: `emotes-r4-traces-2026-09-20.txt` § `flex09-far`: the hand model reports `folded 1.0 up 1.0 upright 1.0 clear 1.0` from the first frame, the pose gap swings 0.09–0.57 every frame (the pose wrist jumps around the small fist), `beside` stays 0.0 and `level` flips 0–1, so the flex is *undecided* on every frame; `st.wait` reaches `THUMB_WAIT_MAX_MS` (500 ms) and Thumbs Up fires at +560 ms (`fired=thumbs_up` at 2604). In the other run (§ `flex09-far2`) the pose is present and steady but `bend 0.00 height 0.00 level 0.00`: the lite model has the small arm hanging, and the hand cue `folded` is 0, so nothing fires.

Likely cause: `src/gestures/engine.ts:105-116` `POSE_STALE_GAP = 0.3`, `POSE_JUMP = 0.3`, `THUMB_WAIT_MAX_MS = 500`: the cap was set so that "a pose that never agrees fires anyway", which at this scale means the wrong emote; and the flex cues in shoulder widths (`src/gestures/flex.ts:66-79`) amplify pose jitter when the shoulder width is ~50 px.

Suggested fix: when the wait cap expires with the pose still undecided, fire nothing rather than the thumbs-up (a thumbs-up that has been contested for 500 ms is not "clear"), and re-arm the wait; treat a hand model fist with `up = 1` whose wrist the pose puts above the shoulder as a flex candidate even when `beside` is 0; and add the far flex-09 to the VIDEO-mode gate. A far subject is also a candidate for the "Come closer" hint (the shoulder width is known).

### D3 — A thumbs-up that turns into a flex with the fist kept up (or a flex into a thumbs-up) plays only the first emote

Severity: **major** (S6 "each emote once in that order"; the second gesture is silently absorbed even after a 2.5 s hold)

Steps: `emotes-r4-build-e2e-clips.py $S takeover` (rest → flex-09 2.5 s → thumbs_up-04 2.5 s → rest → thumbs_up-07 2.5 s → flex-09 2.5 s → rest → thumbs_up-04 2.5 s → flex-14 2.5 s → rest); through the harness at 1000 and 390 px.

Expected / Actual: six emotes. Actual live at both widths: `Goblin Muscle@2366 Thumbs Up@9287 Thumbs Up@16528 Goblin Muscle@18718` — **the thumbs-up after the flex (4.5–7 s) and the flex after the thumbs-up (11.5–14 s) never play**, while thumbs_up-04 → flex-14 (a fist that folds the thumb) plays both. The `morph` reel, where the hand drops between gestures, plays 7/7.

Likely cause: `src/gestures/engine.ts:330-336`: a gesture becoming active while its twin (flex ↔ thumbs_up) is still active *and* the twin's smoothed raw score is ≥ 0.5 is a "takeover" and adds no edge. The rule was written for the first 400 ms of one hold (the pose settling on a fist), but it has no time limit: 2.5 s into a held thumbs-up the visitor raises the arm, the hand model still says thumb-up (it is), the flex wins the conflict rule, and the takeover swallows it; likewise a flex whose fist opens into a thumbs-up.

Suggested fix: limit the takeover to twins that became active within ~600 ms of each other (`st.activeSince`), or to a twin whose emote has not yet played; after that window a new active gesture is a new gesture and fires (the 0.7 s cross-emote gap in `EmoteGate` already prevents a double). Add `takeover` as a VIDEO-mode reel with six events.

### D4 — The back-view double-biceps flex (`flex-12`) is at or over the 1 s bar (round-3 D2, unchanged)

Severity: **minor** (one of 13 flexes; 922 ms at 1000 px, **1,055 ms** at 390 px, missed once in `flex-both`)

Evidence: `all-flex` latencies (1000 px 922, 390 px 1055), `flex-both` at 1000 px `missed flex (6500-9000 ms)`. Cause and fix as round 3: from behind the `level` / `beside` cues (`src/gestures/flex.ts:66-79`) hover on their ramps; add flex-11/12 VIDEO-mode reels and widen the slower cue when both arms agree.

### D5 — `yawn-17` never fires on video (round-3 D3, unchanged)

Severity: **minor** (1 of 8 clear yawns; 3 more misses this round at both widths)

Cause and fix as round 3 (`src/gestures/face.ts:128-135`, brow-lift ratio 0.109 on the 0.10–0.125 ramp): lower `BROWS_DOWN` to ~0.095 or weight `brows` less when `mouth ≥ 0.9`.

### D6 — Held-out sets: yawn recall 63–75 % and flex recall 77 % on the portrait and far sets (round-3 D4, extended)

Severity: **minor** (frame level; precision 100 % and 0 negatives fired on all three sets)

`emotes-r4-variants-stills-2026-09-20.txt`: mirror flex 13/13 / thumbs 16/16 / yawn 5/8; portrait 10/13 / 16/16 / 6/8; far 10/13 / 16/16 / 5/8. The flex misses are flex-01 (no pose found), flex-04 (0.11 / 0.32) and flex-06 (0.00), the same photos as D1. Suggested fix as round 3 for the eyes cue, plus committing these landmark sets as a held-out gate.

### D7 — 0.6 s rests merge into one hold; 0.8 s is the real minimum and nothing says so (round-3 D5, unchanged)

Severity: **minor**

`quick-thumb` 1/3 at both widths, `quick-flex` 2/3 (1000 px) and 3/3 with 978 / 920 ms (390 px); `rest08-thumb` / `rest08-flex` 3/3 ×4 and `rest10-*` 3/3 ×4. Cause as round 3 (`OFF_MS = 500` after ~210 ms of smoothing decay). Suggested: drain `gone` from the raw score when it is exactly 0 (no hand), or state "rest for about a second between repeats" in the note.

### D8 — Phone fold (round-3 D7, unchanged)

Severity: **minor**

At 360 / 390 / 430 px the four buttons wrap onto two rows (`buttonsRows: 2`), the status sits under them, "The three gestures" starts at y 709–739, and the emote card still covers the right third of the 269 px-tall stage (`emotes-r4-ux-live-2026-09-20.json`, `emotes-r4-live-390x844-dark-2026-09-20.jpg`). `src/style.css` has no `@media` rule. Fix as round 3 (Mute as an icon in the stage corner, status as a stage caption, card centred at ≤ 480 px).

### D9 — On a short laptop window nothing clickable is in the first viewport

Severity: **minor** (first-run discoverability on the desktop)

At 1512 × 627 (the viewport Kalp's own Chrome had during this audit) the first screen is the masthead and an empty stage saying "Your camera shows here"; **Start camera is at y 649 and the status at y 708, both below the 627 px fold** (`emotes-r4-live-1512x627-dark-2026-09-20.jpg`, `emotes-r4-ux-live` `startBelowFold: true`). At 1440 × 800 the buttons end at y 777. Likely cause: `src/style.css:78` `.stage { max-height: 70vh }` plus the ~196 px masthead: 70 % + 196 px exceeds the viewport below ~660 px of height, and the buttons are below the stage. Suggested fix: `max-height: min(70vh, 100vh - 320px)` (or `calc(100dvh - <masthead + buttons>)`) so the stage always leaves room for the button row, or move the buttons above the stage.

### D10 — `prefers-reduced-motion` is ignored by the emote pop

Severity: **minor** (accessibility)

With `prefers-reduced-motion: reduce` emulated, every fire still runs `animation: pop 0.35s` (`emotes-r4-ux-live` `reducedMotionDemo.fires[].anim = "pop"`). `src/style.css:162` `.emote.pop` has no reduced-motion override. Suggested fix: `@media (prefers-reduced-motion: reduce) { .emote.pop { animation: none } .fill { transition: none } }`. (Observation, not a defect: the page is `color-scheme: dark` only; a light-scheme visitor gets the same dark page, which reads fine.)

### D11 — Judge: a fire on the last frame of an event the models caught mid-hold is counted as a false trigger (tooling)

Severity: **minor** (harness only; one throttled run printed FAIL for a correct emote)

`live-390-throttled` run 1: models ready at clip position 4,390 ms inside the thumbs-up event (2,000–4,500), Thumbs Up fired at **4,501 ms** (111 ms after readiness, on the segment's last frame) and the judge said `false trigger: Thumbs Up at 4501 ms` because `inEvent` requires `f.ms <= ev.endMs`; two re-runs passed. Both harnesses (`scripts/e2e-camera.mjs:81`, `emotes-r3-e2e-harness.mjs`) should extend the event window by one frame (or by the 400 ms grace they already give the start) and count a pass-0 fire within ~300 ms of readiness inside an event as that event's.

## UX critique (impeccable, critique mode)

⚠️ DEGRADED: single-context (this session exposes no sub-agent tool; Assessment A was written from the source, the live screenshots at seven viewports and the round-4 measurements before the detector output was read). Questions skipped: unattended workflow run. Snapshot not persisted (no `.impeccable/` in the project; nothing to compare against).

Mode: Operate (the visitor is trying to make an emote fire). Design specificity: authored for this product: the stage first, the emote art in the meter rows, the stick-figure demo that is honest about being landmarks, the pink "Almost: …" row naming a body part, the aubergine / amber / cyan / pink palette, the Supercell notice where a stranger looks for it. Cognitive load: one decision point with two real options plus Stop and Mute; nothing over four visible choices; the checklist failures are that the most important line (status / hint) has the least visual weight and sits off the stage, and that on a short window the first viewport offers no action at all (D9). Emotional journey: the peak (your own face, the emote pop, the sound) now arrives reliably for a thumbs-up and for most flexes; the valleys are a flex that does nothing after you have been sitting at your desk (D1), a thumbs-up that will not turn into a flex (D3), and a quick repeat that does nothing with no explanation (D7); the end (Stop → "Stopped.") is flat.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Reacting status and hints, no flicker; but muted grey under the buttons, off the stage; the 2 s / 0.7 s waits and the ~0.8 s minimum rest are never shown |
| 2 | Match system / real world | 3 | Copy in seconds and body parts; How-it-works now matches the code; "478 face points", "landmarkers" still in the lede |
| 3 | User control and freedom | 3 | Start / Stop / Mute / Demo; camera stops when the tab is hidden and does not resume; no camera picker, no un-mirror |
| 4 | Consistency and standards | 4 | One button style, one card style, tabular percentages, `aria-pressed`, `aria-live`; Mute persists |
| 5 | Error prevention | 3 | Negatives, motion, dim light, 12 fps and back-to-back gestures all behave; the traps are a flex after hands-on-desk (D1), a far flex (D2), a fist that changes gesture (D3), quick repeats (D7) |
| 6 | Recognition rather than recall | 3 | Meter rows carry the art and a one-line instruction, the hint names the missing cue, the demo shows the poses; nothing marks *which* moment counted |
| 7 | Flexibility and efficiency | 2 | No keyboard shortcuts, no per-gesture disable, no sensitivity or distance control |
| 8 | Aesthetic and minimalist design | 3 | Clean on a tall laptop; on a 627 px window the buttons are below the fold (D9), on a phone two button rows and the card on the subject (D8) |
| 9 | Error recovery | 3 | Refused / missing / failed camera each get a sentence and the demo as a way out; a miss gets a hint only when a cue is *almost* there, a lost pose gets nothing |
| 10 | Help and documentation | 3 | How-it-works is accurate; still no "why didn't it fire?" beyond the hint |
| **Total** | | **30/40** | Trustworthy for a thumbs-up on a laptop; the flex, the phone fold and the fold on short windows keep it from delightful |

What works: the emote pop over your own mirrored face with the sound within ~0.3 s for the common poses; the "Almost: …" row; a demo that is truthful; a page that stays private and fast (Lighthouse 1.00, one host on the wire); Mute that remembers.

Priority issues: **[P0]** D1 (a flex after sitting at the desk does nothing; the pose tracker is lost and the page has no recovery and no hint for it: at minimum say "I can't see your arm, step back" when the pose is absent on alternate frames). **[P1]** D3 (a fist that changes gesture should play the second emote). **[P1]** D9 + D8: keep a button in the first viewport at every height; on the phone put the status in the stage and dock the card. **[P2]** D7: the ~0.8 s rest and the 2 s wait need to be visible (a thin ring draining after a fire). **[P2]** D2 (far subject: fire nothing rather than the wrong emote, and hint "come closer"). **[P3]** D10 reduced motion.

Persona red flags. *Jordan (first-timer, laptop, small window)*: opens the page, sees a dark box and a sentence, no button; scrolls, presses Start, flexes from her desk chair and nothing happens (D1); the meter stays at 0 % and the hint stays quiet because no cue is close. *Sam (phone, portrait)*: the buttons wrap, the status is under them, the meters are off-screen; a thumbs-up works every time (good), the emote card sits on his raised hand. *Alex (developer)*: gives a thumbs-up, then flexes with the same fist to see the second emote and gets nothing (D3); pumps a thumb three times in two seconds and gets one emote (D7); reads the note and cannot find the minimum rest. Minor observations: `prefers-reduced-motion` ignored (D10); the percentage values stay muted when their bar is amber; the demo caption and the emote card can overlap at 390 px; hidden-tab throttling makes the demo crawl at 1/25 speed when the visitor comes back to the tab (it recovers).

Detector (Assessment B, read after A): 2 warnings, both false positives (`#emote-img` receives `src` at runtime; the 31-character eyebrow is a label) and 1 advisory (1 px border + 30 px shadow on the emote card). No layout-transition findings.

## Known limitations that are NOT defects

- No real camera, phone or iOS Safari in the agent sandbox: the "real pipeline" is Chrome's fake camera fed with slideshows of the labelled photos (hard cuts and, this round, 0.4 s crossfades; round-3 slow motion and dim variants re-run). A cut between two different people is not a webcam; D1 was nevertheless reported because the crossfade reproduces it, the held-out sets miss the same photos, and the page has no recovery from a lost pose. H11 (Kalp on his phone and laptop) remains the honest test of S8 and of D1 in continuous video.
- The held-out sets are transforms of the same 95 photos, not new people; there are still no laugh photos (round-3 D6 stands as a risk, untested).
- The photo corpus is copyrighted stock imagery: only landmarks are in the repo; the reels are rebuilt from the Desktop folder by the scripts in `docs/reports/evidence/`; no camera-frame screenshot is committed.
- Runs after 01:20 UTC shared the GPU with another agent's fake-camera Chromes (pipeline 12–20 fps was unaffected in the runs that printed it); every verdict above that mattered was either taken before that or repeated.
- In a background tab the demo crawls (timer throttled to 1 Hz) and the camera loop stops itself; this is what makes the claude-in-chrome pass useless in a shared browser window.
- The far-subject reels shrink the photo to 55 % of a 480 px frame (a person ~2 m from a laptop); the site sets no expectation about distance.

## How a fixing agent should verify the fix

```bash
cd ~/projects/emotes && git pull --rebase
npm run typecheck && npm run test:unit && npm run test:corpus && npm run report   # 70 / 114 passed today; report unchanged or better
S=/tmp/emotes-e2e; mkdir -p $S
/usr/bin/python3 scripts/build_e2e_clips.py $S all                                  # rounds 1-2 reels
/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r3-build-e2e-clips.py $S   # round-3 reels
/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r4-build-e2e-clips.py $S   # round-4 reels: all-flex all-thumbs all-yawn all-hard occluded morph takeover rest08-* rest10-* short-hold flex09-mirror flex09-far flex09-far2 flex09-far-fade a10-flex a10-flex-fade a04-flex other-rest
python3 scripts/build_e2e_clip.py && npm run build && (npx vite preview --port 4173 --strictPort &) && sleep 2
H=~/projects/portfolio/docs/reports/evidence/emotes-r3-e2e-harness.mjs
R=~/projects/portfolio/docs/reports/evidence/emotes-r4-run-e2e.sh   # R URL WIDTH OUTFILE reel...  (reads the clip folder from $S, default /tmp/emotes-e2e)
# D1: flexes after a hands-on-desk rest
for i in 1 2 3; do GPU=1 CLIP=$S/e2e-a10-flex.mjpeg LABELS=$S/e2e-a10-flex-labels.json node $H http://localhost:4173/; done   # Goblin Muscle 4/4 each run, both widths
GPU=1 CLIP=$S/e2e-all-flex.mjpeg LABELS=$S/e2e-all-flex-labels.json node $H http://localhost:4173/                      # 13/13 (>= 12/13 for the 90 % bar), max latency <= 1000
# D2: far flex-09 never plays Thumbs Up
for i in 1 2 3; do GPU=1 CLIP=$S/e2e-flex09-far2.mjpeg LABELS=$S/e2e-flex09-far2-labels.json node $H http://localhost:4173/; done   # Thumbs Up 0; Goblin Muscle or (documented) nothing
# D3: a fist that changes gesture plays both
GPU=1 CLIP=$S/e2e-takeover.mjpeg LABELS=$S/e2e-takeover-labels.json node $H http://localhost:4173/                      # 6/6 at 1000 and 390
# D4-D7
GPU=1 CLIP=$S/e2e-flex-both.mjpeg LABELS=$S/e2e-flex-both-labels.json node $H http://localhost:4173/      # 5/5, max <= 1000
GPU=1 CLIP=$S/e2e-all-yawn.mjpeg LABELS=$S/e2e-all-yawn-labels.json node $H http://localhost:4173/        # 8/8 incl. yawn-17
for n in quick-thumb quick-flex quick-yawn; do GPU=1 CLIP=$S/e2e-$n.mjpeg LABELS=$S/e2e-$n-labels.json node $H http://localhost:4173/; done   # 3/3 each, or the note states the minimum rest
# regression: everything that passed this round must still pass (all-thumbs 16/16, all-hard none, occluded 0 wrong, morph 7/7, rest08-* 3/3, short-hold 5/5, flex09x3 + flex09-mirror 3/3, tu04x4 4/4, fast, hard, hard2, misses, repeat, mirror, sweep, far, holds, motion, motion-hard, dim, neutral-mix, thumbs-more, portrait)
GPU=1 WIDTH=390 THROTTLE=6 node $H http://localhost:4173/ && GPU=1 WIDTH=390 THROTTLE=6 CLIP=$S/e2e-a10-flex.mjpeg LABELS=$S/e2e-a10-flex-labels.json node $H http://localhost:4173/   # ~12 fps: PASS
GPU=1 BROWSER=playwright node $H http://localhost:4173/                                                    # Playwright Chromium: PASS
# D6: held-out sets (rebuilt from the Desktop photos, never committed)
/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r2-make-variants.py /tmp/emotes-variants
for v in mirror portrait far; do mkdir -p /tmp/emotes-stills-$v && cp tests/fixtures/stills/labels.json /tmp/emotes-stills-$v/ && /usr/bin/python3 scripts/extract_still_landmarks.py --src /tmp/emotes-variants/$v --out /tmp/emotes-stills-$v; done
cp ~/projects/portfolio/docs/reports/evidence/emotes-r2-variant-eval.ts .variant-eval.ts && npx vite-node .variant-eval.ts /tmp/emotes-stills-mirror /tmp/emotes-stills-portrait /tmp/emotes-stills-far; rm .variant-eval.ts   # flex >= 12/13 and yawn >= 7/8 on each, precision 100 %, 0 neutral/hard fired
# D8-D10: layout, fold, reduced motion, audio
node ~/projects/portfolio/docs/reports/evidence/emotes-r4-ux-puppeteer.mjs http://localhost:4173/ | python3 -c "import json,sys; d=json.load(sys.stdin); print({k:(v['layout']['startBelowFold'], v['layout']['buttonsRows']) for k,v in d.items() if 'layout' in v}); print(d['reducedMotionDemo']['fires'][0]['anim'])"   # startBelowFold False at 1512x627, buttonsRows 1 at 390, anim 'none' under reduced motion
pkill -f "vite preview --port 4173"
# after the deploy: the live rows in verification.md
curl -s https://emotes.kalpkan.com | grep -o 'index-[A-Za-z0-9_-]*\.js'     # new hash (today: index-Cx23TXpj.js)
GPU=1 npm run e2e -- https://emotes.kalpkan.com/ && GPU=1 WIDTH=390 npm run e2e -- https://emotes.kalpkan.com/
bash $R https://emotes.kalpkan.com/ 1000 /tmp/emotes-r5-live-1000.txt all-flex all-thumbs all-yawn all-hard a10-flex flex09-far2 takeover morph && bash $R https://emotes.kalpkan.com/ 390 /tmp/emotes-r5-live-390.txt all-flex a10-flex takeover
node ~/projects/portfolio/docs/reports/evidence/emotes-r2-net-puppeteer.mjs https://emotes.kalpkan.com/ live   # hosts: emotes.kalpkan.com only; after Watching only /favicon.svg
npx lighthouse https://emotes.kalpkan.com/ --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new" --quiet && python3 -c "import json;print(json.load(open('/tmp/lh.json'))['categories']['performance']['score'])"   # >= 0.85
gh run list -R KalpKan/emote-detector-web --limit 1 --json conclusion   # success
```

---

## Round 3 report (2026-09-19, kept for history)

Round 3 measured the live `10c2bae` (FIX round 2): PARTIALLY WORKING, 72/100; round-2 D1–D4 and D7 fixed; open D1 (`flex-09` plays Thumbs Up 5/6 with the gate widened to accept it, fixed by FIX round 3 `51f74f8` + `d80120d`), D2 flex-12 late, D3 yawn-17 missed, D4 held-out yawn recall, D5 0.6 s rests, D6 synthetic laugh, D7 phone fold, D8 one unexplained 390 px run, D9 copy. Evidence `docs/reports/evidence/emotes-r3-*`; the re-test table above records each one's state on the live `d80120d`. Rounds 1 and 2 are summarised in STATUS.md rows T5.a-emotes-r1 / r2 and `emotes-r1-*` / `emotes-r2-*`.

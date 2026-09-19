# emotes (Emote Detector) functional audit — 2026-09-19 (TEST + CRITIQUE round 2)

Live URL https://emotes.kalpkan.com · Repo `KalpKan/emote-detector-web` (local `~/projects/emotes`, audited at commit `4e25a95` = `origin/main`, clean; CI run 35417355442 green, unit + corpus) · Vercel project `emotes` (repo root, framework Vite, static, `prj_mgoUdU4NQ9X8sfP7Jhcy4xBBM6pr`) · Database none · Health route `https://emotes.kalpkan.com/health.json` → `{"ok":true,"service":"emotes"}`

**Two things were audited, because they differ.** Production still serves the round-1 code: the live bundle is `assets/index-CCXAWVGh.js` (rules from `0b0753a`, no Mute button, "three frames" copy, `/assets/*` at `max-age=0`), because FIX round 1 (`4e25a95`, pushed 03:01 UTC) was refused by Vercel's team-wide 100-deployments-per-day window; at 03:08 UTC the API still listed 100 deployments in the last 24 h, the oldest ageing out at 19:20 UTC, so this round could not deploy either (`scripts/vercel-redeploy-when-quota-frees.sh ~/projects/emotes emotes.kalpkan.com 20 10` after that). So: the **live site** was tested for what it is (S1, S9, S10, layout, console, network, Lighthouse: unchanged since round 1, every round-1 detection defect still live), and the **fixed code** was tested as a production build (`npm run build && vite preview`, bundle `index-DSWF50GZ.js`) through the real pipeline: headless real Chrome 151 on the Mac GPU, Chrome's fake camera fed with MJPEG slideshows built from the labelled photo corpus, the site's own MediaPipe landmarkers and rules, judged by the page's own emote box. Round 1's method (corpus report, unit/corpus gates, hold synthesis, the official + hard/misses/repeat clips at 1000 and 390 px, headless dark/light screenshots, network trace, Lighthouse 12, `impeccable detect`) was repeated, plus what round 1 did not do: three held-out landmark sets re-extracted from mirrored, letterboxed-portrait and 60 %-scale copies of all 95 photos with the site's own `.task` models; ten new fake-camera clips (10 s holds ×3, mirrored positives + negatives, a six-gesture sweep, a back-to-back "fast" sequence, a second hard-negative reel, a far-subject reel, and the same thumbs-up repeated four times, three runs); VIDEO-mode landmark extraction over a clip to read the per-frame cues behind a wrong emote; a status/hint change recorder. Evidence: `docs/reports/evidence/emotes-r2-*` (scripts included; photos and `.mjpeg` clips never leave the Desktop folder, and no camera-frame screenshot is committed because the frames are the stock photos).

## Verdict: PARTIALLY WORKING

The fix round did what it claimed on the corpus it was tuned on, and most of it holds up under tests it was not tuned on: on the original landmarks every number is 100 %, and on three re-extracted variant sets (mirror, portrait, far) precision stays at 100 % for all three gestures with 0 of 9 neutral and 0 of 33 hard negatives firing in every set; through the real pipeline the official clip passes at 1000 and 390 px, the round-1 hard-negative reel and a second one fire nothing in 53 s, the known-misses clip fires all five, repeats fire 3/3, three 10 s holds fire exactly once, mirrored positives fire and mirrored negatives do not, a six-gesture sweep fires 6/6, and a reel with the subject at 55 % size fires 6/6 at both widths. The page now says which cue is missing ("Almost a Thumbs Up: Fold the other four fingers into a fist."), speaks in seconds, has a Mute button, and Lighthouse is 1.00 on the fixed build (0.89 live).

But a stranger would still hit three things. (1) A thumbs-up held **beside the head with the elbow bent** (the spec's own S2 pose, still `thumbs_up-04`) fires **Goblin Muscle** in 8 of 13 passes through the real pipeline: every thumbs-up cue is 1.0 on every frame, but the pose model's "wrist above shoulder" estimate jitters 0.2 ↔ 1.0 frame to frame on a static image, and `fuseScores` applies a per-frame hard veto (flex ≥ 0.5 zeroes the thumbs-up unless it leads by 0.25) before any temporal smoothing, so the fused scores flip between {flex 0.85, thumbs 0} and {flex 0, thumbs 1.0} every 100 ms and whichever clock fills first wins. (2) Gestures done back to back at a natural pace lose the second one: a flex 1.2 s after a thumbs-up never plays, at 1000 and 390 px, because the 2 s `EmoteGate` swallows the engine's one-shot edge (offline: any gap under ~1.5 s drops the middle gesture at 25 fps). (3) The new hint line flickers between "Almost a Goblin Muscle" and "Almost a Thumbs Up" every ~80 ms when two gestures are close, because the 900 ms hold only applies to the same gesture. Everything else on the fixed build meets or nearly meets its bar; on production nothing has changed since round 1. Fix-build score 50/100; production is still the round-1 35/100 until `4e25a95` is deployed.

## Round-1 defects re-tested

| Round 1 | In `4e25a95` (local production build) | On production (`9807a11`) |
|---|---|---|
| D1 thumbs-ups score nothing / beside-head thumbs-up becomes a flex | **Partly fixed**: 16/16 clear stills at 1.00 on four landmark sets; `thumbs_up-17` fires 5/5 through the pipeline; the misses clip fires 3/3 thumbs-ups. **The beside-the-head case is not fixed on video** (new D1 below: `thumbs_up-04` → Goblin Muscle 8/13) | not fixed |
| D2 flex fires on cover-eyes / dab / thumbs-up beside the face | **Fixed**: flex precision 100 % on all four sets, 0/33 hard stills, hard + hard2 reels fire nothing (53 s), mirrored cover_eyes-02 and dab-01 fire nothing | not fixed |
| D3 yawns missed, screams become yawns, hand over mouth becomes thumbs-up | **Fixed on the corpus** (8/8 ok, 0/8 occluded wrong on four sets, angry-01/05 fire nothing on video); recall is fragile off the training landmarks (new D6: 63–75 % on mirror/portrait/far IMAGE-mode sets) | not fixed |
| D4 frame-count dwell, held yawn re-fires every 2.3 s | **Fixed**: 69/72 synthetic 10 s holds fire once at 25/12/8 fps (the 3 misses are the borderline yawn-17 at 2–3× the corpus jitter, new D5); hold-yawn / hold-thumb / hold-flex clips fire exactly once through the pipeline (Princess Yawn @2448 ms, Thumbs Up @2223, Goblin Muscle @2209 for holds starting at 2000 ms) | not fixed |
| D5 no cue hint, "frames" copy | **Fixed** (hint seen live in the pipeline at 390 px; copy in seconds) **but flickers** between gestures (new D3) | not fixed |
| D6 portrait stream cropped to 4:3 | **Fixed in code** (`stage.style.aspectRatio = stageAspect(videoWidth, videoHeight)`, `object-fit: contain`, card ≤ 36 % of stage height; unit test); Chrome's fake device cannot emit a portrait stream, so not verified on a real phone (H11) | not fixed |
| D7 gate asserts 42 stills | **Fixed** (37 ok after two photo-checked relabels, 70 clips; `npm run test:corpus` 96 passed) | n/a |
| D8 INFO line counted as console error | **Fixed** (harness ignores `INFO:`/`W0919` lines, fails on real errors; every run this round reports no console errors) | n/a |
| D9 next-loop fire counted as false trigger | **Partly fixed**: the false-trigger half is gone; an event already in progress when the models become ready is still judged "late" (three spurious `late` FAILs this round, new D7) | n/a |
| D10 `/assets/*` not immutable, meters animate width | **Fixed in code** (`vercel.json` `/assets/(.*)` immutable; `transform: scaleX`; `impeccable detect` no longer reports layout transitions) | not fixed (`index-CCXAWVGh.js` still `max-age=0, must-revalidate`) |
| D11 no mute | **Fixed** (Mute/Unmute button, `aria-pressed`, `localStorage`) | not fixed |

## User stories tested (fixed build unless marked live)

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load and start: Start camera → video + overlay + "Watching…" within seconds, progress line, Lighthouse ≥ 0.85, no console errors, no horizontal scroll | **PASS** | Live: `HTTP/2 200`, `server: Vercel`, health ok; click → "Watching…" in **1,992 ms** (statuses "Asking for the camera…" → runtime → face → hand → pose → "Models ready." → "Watching. Try a thumbs-up…"); Lighthouse mobile **0.89** live (LCP 1.5 s, TBT 420 ms under a loaded machine) / **1.00** fixed build (LCP 1.3 s, TBT 0), accessibility 1.0, best-practices 1.0 both; page errors none (live and fixed, 1280/390 × dark/light); `scrollWidth` = 390 at 390 px; `/mediapipe/*` immutable. Fixed build: click → Watching 1,568 ms (`emotes-r2-net-*.json`, `emotes-r2-lighthouse-*.txt`) |
| S2 | Thumbs-up, either hand, chest height or beside the face, fires once within 1 s | **FAIL (blocker, new D1)** | Chest-height thumbs-ups: 16/16 clear stills 1.00 on original + mirror + portrait + far sets; pipeline: official clip Thumbs Up **224–730 ms** after onset at 1000/390, misses clip thumbs_up-04/09/16 all fired, repeat 3/3 (1784/5054/8324 for onsets 1500/4800/8100), `thumbs_up-17` ×4 → 5/5 Thumbs Up, hold 10 s → once, mirrored thumbs_up-07 → 199 ms. **Beside the face** (`thumbs_up-04`, thumb up next to the cheek, elbow bent) repeated four times per clip, three runs: **Goblin Muscle 8 times, Thumbs Up 5** (`emotes-r2-e2e-thumbs-beside-head-*.txt`); VIDEO-mode cue trace shows why (`emotes-r2-video-mode-cues-thumbs_up-04-*.txt`) |
| S3 | Flex, fist beside the head, fires once within 1 s | **PASS** (with D2 caveat) | 13/13 stills on original and mirror (10/13 on portrait/far, where the pose model itself loses the arm or bends the elbow out of the 20–110° band: flex-01/04/06); pipeline: flex-14 **298–302 ms** at 1000/390, flex-01/04 in the sweep, hold-flex once, mirrored flex-14 299 ms, far flex-14/flex-04 at both widths; the pose model's "height" cue jitters 0.2–1.0 on a still fist but the charge clock absorbs it. A flex within ~1.5 s of a thumbs-up never plays (D2) |
| S4 | Yawn fires once within 1 s; an occluded yawn may be missed but never becomes another emote | **PASS** (fragility noted, D6) | 8/8 clear stills on the original set; occluded yawns fired a wrong emote **0/8 on all four sets** (round 1: 2/8); screams angry-01/05 fire nothing on video; pipeline: yawn-19 **459–521 ms**, yawn-02/-05/-15 fire in the misses/sweep reels, hold 10 s once, mirrored yawn-19 459 ms, far yawn-19/yawn-02 at both widths. IMAGE-mode recall on held-out sets 63 % (mirror), 75 % (portrait), 63 % (far): the eyes cue reads a small or flipped face as open (yawn-19 far: mouth 1.0, eyes 0, score 0) |
| S5 | Nothing fires on sitting, talking, looking around, scratching, cover-eyes, dab (< 1 false trigger per minute) | **PASS** | Stills: neutral 0/9 and hard 0/33 on original, mirror, portrait and far (132 hard-negative landmark sets, 0 fired); corpus `neutral-60s` 0 firings / 59 s, `hard-negatives-60s` 0 / 60 s; pipeline: round-1 hard reel (cover_eyes-02, dab-01, angry-01, yawn-08, angry-07) **none in 24.5 s**, new hard2 reel (cover_eyes-05/11, dab-07/12, angry-05/09) **none in 29 s**, mirrored cover_eyes-02 + dab-01 none. Caveat: the corpus's "talking" only moves lip pair 13/14, one of the five pairs the new mouth cue averages (D9) |
| S6 | thumbs-up → flex → yawn once each in order; ×3 fires ×3; a 10 s hold fires once | **PARTIAL (major, new D2)** | `sequence-three` (3 s apart) PASS; repeat clips 3/3 in corpus and pipeline; holds: 12/12 corpus hold clips + 69/72 synthetic holds (25/12/8 fps × 3 jitters × 8 stills) + 3/3 pipeline holds fire once. **Back to back** (thumbs-up 1.2 s, flex 1.2 s, yawn 1.5 s, no rest): pipeline fires Thumbs Up and Princess Yawn and **misses the flex** at 1000 and 390 px (`clip=fast`); offline, gaps of 0/300/600 ms at 25 fps drop the flex, 1000 ms and up keep it (`emotes-r2-synth-*.txt`) |
| S7 | Three live meters; when nothing fires the page says which cue is missing | **PARTIAL (major, new D3)** | Meters move per frame (`scaleX`), active bar turns amber; pipeline at 390 px: status became **"Almost a Thumbs Up: Fold the other four fingers into a fist."** and the Thumbs Up row turned pink with "Almost: Fold the other four fingers into a fist." (`emotes-r2-hints-390-*.json`). But with a thumb beside the head the status alternated "Almost a Goblin Muscle: Raise the fist higher…" / "Almost a Thumbs Up: Fold…" **8 times in 640 ms** before firing (`emotes-r2-hint-flicker-*.txt`). Demo mode never writes a hint into the status line (only the meter rows), by design |
| S8 | Phone: front camera portrait, no horizontal scroll, tappable buttons, sound after tap, detection as reliable within 1 s | **PARTIAL (not device-verified)** | Time-based engine holds at 8 and 12 fps (37/37 clear stills fire ≤ 867 ms at 8/12 fps with the corpus jitter); pipeline at 390 px passes the official, hold-yawn, mirror and far clips; buttons 51 px tall; `scrollWidth` 390; `facingMode: "user"`; audio created in the click. Not verifiable here: a real portrait stream (Chrome's fake device emits 640 × 480), real motion, iOS Safari. Minor: at 390 px the Mute button wraps alone onto a second row and the meters start at y ≈ 720 (below the fold on an 844 px phone). H11 stays open |
| S9 | Play demo: stick figure, three emotes per loop, no camera prompt | **PASS** | Live and fixed, 1280/390 × dark/light: Thumbs Up, Goblin Muscle, Princess Yawn at ≈ 2.0 / 4.7 / 7.3 s and again at ≈ 10.4 / 13.1 / 15.6 s; `getUserMedia` never called; zero page errors (`emotes-r2-ux-*.json`) |
| S10 | After the models load only same-origin and `/ingest`; `/health.json` ok | **PASS (live)** | Hosts contacted during load + camera + 12 s watching: **`emotes.kalpkan.com` only**; after "Watching" the only request was `/favicon.svg`; `/ingest/*` = PostHog proxy; `/health.json` → `{"ok":true,"service":"emotes"}` (`emotes-r2-net-live-*.json`) |

Cross-cutting on `4e25a95`: `npm run typecheck` clean; `npm run test:unit` **56 passed**; `npm run test:corpus` **96 passed**; `npm run report` = README "Numbers today" exactly (stills 100 % ×3, 0/9, 0/33, 1/8 occluded detected, 0 wrong; clips 70/70, 100 % ×3, neutral 0, hard 0, latency median 160 / p95 450 / max 960 ms); CI run 35417355442 `success`. `impeccable detect --json index.html`: 2 warnings, both false positives (`#emote-img` gets its `src` at runtime; the 31-character eyebrow is a label) + 1 advisory (1 px border + 30 px shadow); round 1's three layout-transition warnings are gone.

## Defects

### D1 — A thumbs-up beside the head fires Goblin Muscle more often than Thumbs Up

Severity: **blocker** (S2 names "beside my face"; a wrong emote is worse than none; the corpus reports 100 % because IMAGE-mode landmarks are steady and VIDEO-mode landmarks are not)

Steps to reproduce: `cd ~/projects/emotes && npm run build && (npx vite preview --port 4173 --strictPort &)`; `/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r2-build-e2e-clips.py /tmp/emotes-e2e tu04x4` (rest 2 s + `thumbs_up-04` 2.5 s, four times); `GPU=1 CLIP=/tmp/emotes-e2e/e2e-tu04x4.mjpeg LABELS=/tmp/emotes-e2e/e2e-tu04x4-labels.json npm run e2e -- http://localhost:4173/` three times.

Expected / Actual: Thumbs Up four times per run. Actual over three runs: `Thumbs Up@2851 Goblin Muscle@6924 Goblin Muscle@11621 Thumbs Up@15827`, `Thumbs Up@6889 Goblin Muscle@11242 Thumbs Up@15856`, `Thumbs Up@3217 Goblin Muscle@6743 Goblin Muscle@11290 Goblin Muscle@15878`: **8 Goblin Muscle, 5 Thumbs Up** in 13 passes. `thumbs_up-17` (two thumbs at shoulder height) under the same protocol: 5/5 Thumbs Up.

Evidence: `emotes-r2-e2e-thumbs-beside-head-2026-09-19.txt`; `emotes-r2-video-mode-cues-thumbs_up-04-2026-09-19.txt` (the site's three `.task` models run in VIDEO mode over the clip with `emotes-r2-video-landmarks.py`, fed through `GestureEngine` + `EmoteGate` by `emotes-r2-video-eval.ts`): every frame has thumbs-up cues `folded 1.0 up 1.0 upright 1.0 clear 1.0`, while the flex `height` cue reads 0.2, 0.9, 0.5, 1.0, 0.9, 0.7, 0.7 … on consecutive 100 ms samples of the same still, so the fused scores alternate `flex=0.85 tu=0.00` / `flex=0.00 tu=1.00`; the engine then fires `flex` at 2400 ms and the `thumbs_up` edge at 3000 ms is gated, or the reverse.

Likely cause: `src/gestures/engine.ts:88-93` (`fuseScores`): the flex-vs-thumbs conflict is a per-frame hard veto (`flex ≥ 0.5 && thumbs_up ≥ 0.5` → flex wins unless `thumbs_up − flex > 0.25`; `1.0 − 0.85 = 0.15`) applied *before* the time-based engine, so pose jitter in the flex `height` cue (`src/gestures/flex.ts:62`, wrist 0.2–0.4 shoulder-widths above the shoulder, a 0.2-shoulder-width band that the lite pose model does not hold on video) becomes a 10 Hz flip between two gestures; the two charge clocks then race.

Suggested fix: resolve the conflict after smoothing, not per frame: keep an exponential average (≈ 300 ms) of each raw score and apply the veto to the averaged pair; and give a hand-model thumbs-up with all four cues ≥ 0.9 priority over a flex whose weakest cue is below 0.9 (a flexing fist rarely has a straight upright thumb clear above it). Add `thumbs_up-04` as a VIDEO-mode fixture (the `emotes-r2-video-landmarks.py` dump) to `tests/clips.test.ts` so the gate sees jittery pose landmarks, and widen the flex `height` band or use the elbow-to-wrist vector angle, which the pose model holds steadily.

### D2 — Gestures done back to back lose the middle one: the 2 s cooldown swallows the engine's one-shot edge

Severity: **major** (S6 "each emote once in that order"; S2/S3 "within 1 s of being performed": a gesture performed 1.2 s after another never fires)

Steps to reproduce: `emotes-r2-build-e2e-clips.py /tmp/emotes-e2e fast` (thumbs_up-07 1.2 s → flex-14 1.2 s → yawn-19 1.5 s, no rest) through `npm run e2e` at `WIDTH=1000` and `390`; or offline `npx vite-node ~/projects/portfolio/docs/reports/evidence/emotes-r2-synth.ts` (copy into the repo root first), section "fast sequences".

Expected / Actual: three emotes. Actual: `Thumbs Up@2257 Princess Yawn@4848 … FAIL: missed flex (3200-4400 ms)` at 1000 px and `Thumbs Up@2332 Princess Yawn@4829 … missed flex` at 390 px. Offline at 25 fps: gaps of 0, 300 and 600 ms between gestures drop the flex; 1000 ms and above keep it.

Evidence: `emotes-r2-e2e-local-2026-09-19.txt` (`clip=fast`, both widths); `emotes-r2-synth-holds-fast-lowfps-2026-09-19.txt`.

Likely cause: `src/main.ts:163-166` — `if (result.fired) { const emote = gate.tryFire(result.fired, now); … }`: `fired` is true on exactly one frame (the edge in `engine.ts:150-154`), and `EmoteGate.tryFire` (`src/emotes.ts:61-65`, `COOLDOWN_MS = 2000`) returns null inside the cooldown, so the edge is consumed and lost; the flex stays `active` but never fires again until it is released for 500 ms and re-held.

Suggested fix: when the gate refuses an edge, remember it as pending and fire it when the cooldown ends if that gesture is still `active` (or fire immediately when the *new* gesture differs from the one that just played: the cooldown exists to stop one gesture spamming, not to stop a sequence). Alternatively drop `COOLDOWN_MS` to ≈ 700 ms, since the engine's release rule already guarantees one fire per hold. Add a 0.6 s-gap sequence clip to `tests/clips.test.ts` (`runClip` uses the same gate).

### D3 — The hint line flickers between two gestures at about 12 Hz

Severity: **major** (S7: an unreadable hint is no hint; it also happens on exactly the pose in D1)

Steps to reproduce: `node ~/projects/portfolio/docs/reports/evidence/emotes-r2-hint-recorder.mjs http://localhost:4173/ /tmp/emotes-e2e/e2e-misses.mjpeg` (records every `#status` change with a timestamp).

Expected / Actual: one hint that stays readable (the code intends 900 ms). Actual at the thumbs_up-04 segment: `Almost a Goblin Muscle: Raise the fist higher…` +88 ms `Almost a Thumbs Up: Fold the other four fingers…` +85 ms `Almost a Goblin Muscle…` +87 … eight changes in 640 ms, then `FIRE Goblin Muscle`.

Evidence: `emotes-r2-hint-flicker-2026-09-19.txt`.

Likely cause: `src/main.ts:123-127` (`updateHint`): the `HINT_HOLD_MS` guard returns early only when the next hint is for the *same* gesture or when there is none; a hint for a different gesture replaces the shown one immediately, and `weakestCue` (`engine.ts:104-112`) picks whichever gesture's second-weakest cue is higher this frame, which the D1 jitter flips every frame.

Suggested fix: hold the shown hint for `HINT_HOLD_MS` regardless of which gesture the new candidate belongs to (replace only when the hold expires or a gesture becomes active), and pick the hint from the smoothed scores of D1's fix.

### D4 — Production still runs the round-1 rules

Severity: **major** (for the visitor it is round 1's blockers D1 and D2; not a code defect, a deploy that has not happened)

Steps to reproduce: `curl -s https://emotes.kalpkan.com | grep -o 'index-[A-Za-z0-9_-]*\.js'` → `index-CCXAWVGh.js` (the `9807a11` bundle; `4e25a95` builds `index-DSWF50GZ.js`); no Mute button, note text "Hold a pose for about three frames"; `curl -sI https://emotes.kalpkan.com/assets/index-CCXAWVGh.js | grep -i cache-control` → `max-age=0, must-revalidate`.

Likely cause: Vercel's team-wide `api-deployments-free-per-day` window (100 in 24 h; 100 listed at 03:08 UTC, oldest ages out 19:20 UTC 2026-09-19). Both the Git integration and `vercel --prod` are refused until then.

Suggested fix: after 19:20 UTC, `bash ~/projects/portfolio/scripts/vercel-redeploy-when-quota-frees.sh ~/projects/emotes emotes.kalpkan.com 20 10`, then the live rows in `verification.md`. Do it with the D1–D3 fixes in the same deploy if they are ready, because the window will be tight again.

### D5 — The borderline clear yawn (`yawn-17`, score 0.56) flickers or is missed at 8 fps under heavier jitter

Severity: **minor**

`yawn-17` scores 0.56 on the original landmarks (the only clear positive under 0.8; the rest score 0.81–1.00). Held 10 s at 8 fps with jitter σ 0.008 it fires **twice** (3000, 8500 ms; first latency 1,200 ms) and at σ 0.012 it fires 0 times at 25 and 8 fps; at the corpus jitter (0.004) it fires once at every rate, 825–867 ms after onset. Its weakest cue is `brows` 0.38 (`browLiftRatio` 0.109 against a 0.10–0.125 ramp). Evidence: `emotes-r2-synth-holds-fast-lowfps-2026-09-19.txt` (69/72 hold rows fire once). Suggested fix: widen the brow ramp's lower edge (screams measure 0.07–0.107, so 0.095–0.125 keeps the margin) or weight `brows` less than `mouth`.

### D6 — The yawn rule's eye cue reads a small or flipped face as "eyes open", so recall off the training landmarks is 63–75 %

Severity: **minor** (a risk with data, not a failed bar: the corpus bar is met and the far-subject reel passed through the real pipeline; but a phone at arm's length is exactly a small face)

Re-extracting all 95 photos with the site's own models after mirroring, letterboxing into a 480 × 640 portrait frame at 78 % and shrinking to 60 % gives yawn recall **5/8, 6/8, 5/8** (precision 100 % everywhere; flex 13/13, 10/13, 10/13; thumbs-up 16/16 ×3). The misses are eyes: `yawn-19` (mouth 0.97 open) scores **0** in the portrait and far sets because `avgEyeOpenRatio` reads 0.187 / 0.209 (open) instead of −0.024; `yawn-07` mirrored drops to 0.499. Evidence: `emotes-r2-variants-stills-2026-09-19.txt`, `emotes-r2-variants-cues-2026-09-19.txt` (`emotes-r2-make-variants.py` + `scripts/extract_still_landmarks.py --src … --out …` + `emotes-r2-variant-eval.ts`). Through the real pipeline (VIDEO mode, 640 × 480 frames, subject at 55 %) yawn-19 and yawn-02 fired at both widths (`emotes-r2-e2e-far-2026-09-19.txt`), so VIDEO-mode tracking helps. Suggested fix: when the mouth cue is very high (≥ 0.9, a jaw-dropping yawn) let the eyes cap relax (e.g. cap at `eyes / 0.4`), or measure the eyes over a 300 ms window; keep the variant sets as a held-out gate so the next tuning round cannot overfit the 95 originals.

### D7 — The e2e judge still reports "late" for an event already in progress when the models become ready

Severity: **minor** (tooling; three spurious FAILs this round: `mirror` at 390 "thumbs_up late: 1622 ms", `far` at 390 "1956 ms", `tu17x4` "2072 ms", each with the models ready 1.5–2.1 s into the first event and the next pass firing 199–241 ms after onset)

Likely cause: `scripts/e2e-camera.mjs:73-79` matches the first fire to the event regardless of whether detection started after `startMs`. Suggested fix: when `phase` falls inside an event, judge that event on the next pass only (the one-loop window already covers it).

### D8 — The neutral minute's "talking" only moves one of the five lip pairs the new mouth cue averages

Severity: **minor** (tooling; weakens S5's talking evidence)

`tests/corpus.ts:104-110` (`talk`) opens indices 13/14 by up to 0.02 of the frame; `src/gestures/face.ts` averages `LIP_PAIRS` 13/14, 82/87, 312/317, 81/178, 311/402, so synthetic talking reaches one fifth of the intended `mouthOpenRatio`. Real talking with open eyes is still safe by construction (the `eyes` cap zeroes the score when EAR ≥ 0.14), but laughing (mouth open, eyes narrowed, brows relaxed) is untested and geometrically a yawn; the Desktop corpus has empty `laugh/`, `kiss/`, `sad/`, `think/` folders. Suggested fix: move all five pairs in `talk`, and if Kalp has a few laugh/think photos, add them as hard negatives.

### D9 — Phone layout: Mute wraps alone and the meters start below the fold

Severity: **minor** (S8 polish)

At 390 × 844 the four buttons wrap to `Start camera · Play demo · Stop` + `Mute` on its own line (each 51 px tall, fine to tap), and "The three gestures" starts at y ≈ 720, so a visitor sees the stage, the buttons and the status but only the top of the first meter; the emote card (118 × 128) covers the right third of the 358 × 269 stage. Evidence: `emotes-r2-local-390-dark-full-2026-09-19.jpg`, `emotes-r2-hints-390-2026-09-19.json` (`layout`). Suggested fix: make Mute an icon button in the stage corner, shorten the lede on phones, and render the hint line directly under the stage so the coaching is visible without scrolling.

## UX critique (impeccable, critique mode)

⚠️ DEGRADED: single-context (this session exposes no sub-agent tool; Assessment A was written before the detector ran). Questions skipped: unattended workflow run.

Mode: Operate (the visitor is trying to make an emote fire). Design specificity: authored for the product, not interchangeable: the emote art sits in the meter rows, the stage is first, the stick-figure demo is honest, the Supercell notice and the privacy line are where a stranger looks for them. Detector: 2 warnings (both false positives) + 1 advisory; no layout animations any more.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The status line now reacts (progress, "Watching", "Almost a …"), but it is set in muted grey at 16 px under the buttons: the most important line on the page has the least emphasis; and it flickers (D3) |
| 2 | Match system / real world | 3 | Copy is now in seconds and body parts; "MediaPipe", "landmarkers", "478 face points" remain in the lede and How-it-works (fine for the audience the footer implies) |
| 3 | User control and freedom | 3 | Start / Stop / Mute / Demo all work; no way to pick a camera on a laptop with two, no way to turn the mirror off |
| 4 | Consistency and standards | 4 | One button style, one card style, tabular percentages, `aria-pressed` on Mute |
| 5 | Error prevention | 2 | The detector fires the wrong emote on a thumb beside the face (D1) and drops a quick second gesture (D2); nothing warns that a gesture is being ignored during the cooldown |
| 6 | Recognition rather than recall | 3 | Meter rows show the emote art and one-line instructions; the hint says what to change; the demo shows the poses. A visitor cannot see *which* frame counted (no freeze-frame or "that was it" marker) |
| 7 | Flexibility and efficiency | 2 | No keyboard shortcuts, no option to lower the cooldown or disable a gesture, no threshold slider for people the rules miss |
| 8 | Aesthetic and minimalist design | 3 | Clean, dark-only, well spaced; on a phone the meters (the explanation) are below the fold and the emote card hides a third of the stage |
| 9 | Error recovery | 3 | Camera refused / not found / failed each have a sentence and a way out (demo) |
| 10 | Help and documentation | 3 | "How it works" is accurate to the code; the note explains dwell and cooldown; no link to "why didn't it fire?" beyond the hint |
| **Total** | | **29/40** | Solid, not yet delightful |

What works: the stage-first layout with the emote card popping over the video and its sound; the cue hints turning a row pink ("Almost: Fold the other four fingers into a fist.") is exactly the feedback round 1 asked for; the demo is a truthful, camera-free tour; the page is honest about what is and is not shipped.

Priority issues: **[P0]** wrong emote on a thumb beside the face (D1) and dropped second gesture (D2): the product's one job. **[P1]** hint flicker (D3). **[P1]** status line styling: put the reacting line in the stage (overlay caption, like the demo caption) in the text colour, not muted grey under the buttons. **[P2]** phone fold: coaching and meters should be visible with the stage (D9). **[P3]** the two-second cooldown is described but never shown; a thin ring or bar draining after a fire would explain why the second gesture waited.

Persona red flags. *Jordan (first-timer, laptop)*: presses Start, does a thumbs-up beside her face because that is where the camera sees it best, gets Goblin Muscle, concludes the detector is random. *Sam (phone, portrait)*: the stage fills the width, the buttons wrap, the status is under the buttons, the meters are off-screen; he does a gesture, nothing fires, scrolls down to read the hint and the gesture is over. *Alex (developer)*: reads How-it-works, tries a quick thumbs-up → flex → yawn to test the sequence, sees two of three, and doubts the "fires once per hold" claim.

Minor observations: the demo caption and the emote card can overlap on the right at 390 px; the "0%" values are muted even when a bar is amber; the footer's two lines are the only place the author's name appears; `color-scheme: dark` with no light theme is a choice, and the page reads well in a bright room, but the Lighthouse-style contrast of `--muted` (#b3a6cc on #120b1f, 8.6:1) is fine while the pink hint on the elevated card (#ff7ab6 on #1c1230, 6.9:1) is fine too.

## Known limitations that are NOT defects

- No real camera, phone or iOS Safari in the agent sandbox: the "real pipeline" is Chrome's fake camera fed with slideshows of the labelled photos (640 × 480, hard cuts, no motion blur). It exercises the site's landmarkers and rules on real faces and hands but not real motion or a portrait stream. H11 (Kalp on his phone) remains the honest test of S8.
- The held-out sets in D6 are transforms of the same 95 photos, not new people; they measure invariance, not generalisation to new faces.
- The photo corpus is copyrighted stock imagery: only landmarks are in the repo; the e2e clips and the variant sets live in the scratchpad and are rebuilt from the Desktop folder by the scripts in `docs/reports/evidence/`.
- Lighthouse 0.89 on the live URL this round (1.00 in round 1) was measured while three other agents were driving Chrome on the same Mac (TBT 420 ms); the fixed build scored 1.00 on the same machine a minute later.
- One fake-camera run (a 1000 px sweep with the recorder) froze on its first frame for 16 s and was not reproducible on the rerun; Chrome's fake device occasionally stalls (round 1 recorded its 30 fps / loop-phase quirks in `incidents.md`).
- The page is dark-only by design; light-scheme screenshots equal the dark ones.
- In a background tab the demo crawls (`setTimeout` chain, throttled); the camera loop stops itself on `visibilitychange`.

## How a fixing agent should verify the fix

```bash
cd ~/projects/emotes && git pull --rebase
npm run typecheck && npm run test:unit && npm run test:corpus && npm run report   # 56 / 96 passed; report unchanged or better
S=/tmp/emotes-e2e; mkdir -p $S
for n in tu04x4 tu17x4 fast hard2 far mirror sweep hold-yawn hold-thumb hold-flex; do /usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r2-build-e2e-clips.py $S $n; done
for n in hard misses repeat; do /usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r1-build-extra-e2e-clips.py $S $n; done
python3 scripts/build_e2e_clip.py && npm run build && (npx vite preview --port 4173 --strictPort &) && sleep 2
GPU=1 npm run e2e -- http://localhost:4173/ && GPU=1 WIDTH=390 npm run e2e -- http://localhost:4173/     # PASS
for i in 1 2 3; do GPU=1 CLIP=$S/e2e-tu04x4.mjpeg LABELS=$S/e2e-tu04x4-labels.json npm run e2e -- http://localhost:4173/; done   # D1: 12/12 Thumbs Up, 0 Goblin Muscle
GPU=1 CLIP=$S/e2e-fast.mjpeg LABELS=$S/e2e-fast-labels.json npm run e2e -- http://localhost:4173/          # D2: 3 fires, PASS (also WIDTH=390)
node ~/projects/portfolio/docs/reports/evidence/emotes-r2-hint-recorder.mjs http://localhost:4173/ $S/e2e-misses.mjpeg   # D3: no two "Almost" lines closer than 900 ms
for n in hard hard2 misses repeat mirror sweep far hold-yawn hold-thumb hold-flex; do GPU=1 CLIP=$S/e2e-$n.mjpeg LABELS=$S/e2e-$n-labels.json npm run e2e -- http://localhost:4173/; done   # all PASS (a "late" on the first event with the models ready mid-event is D7 until fixed)
# held-out landmark sets (D6): variants are rebuilt from the Desktop photos, never committed
/usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r2-make-variants.py /tmp/emotes-variants
for v in mirror portrait far; do mkdir -p /tmp/emotes-stills-$v && cp tests/fixtures/stills/labels.json /tmp/emotes-stills-$v/ && /usr/bin/python3 scripts/extract_still_landmarks.py --src /tmp/emotes-variants/$v --out /tmp/emotes-stills-$v; done
cp ~/projects/portfolio/docs/reports/evidence/emotes-r2-variant-eval.ts .variant-eval.ts && npx vite-node .variant-eval.ts /tmp/emotes-stills-mirror /tmp/emotes-stills-portrait /tmp/emotes-stills-far; rm .variant-eval.ts   # precision 100 % everywhere, 0 neutral/hard fired; yawn recall the number to move
pkill -f "vite preview --port 4173"
# after the deploy (D4):
curl -s https://emotes.kalpkan.com | grep -o 'index-[A-Za-z0-9_-]*\.js'     # not index-CCXAWVGh.js
GPU=1 npm run e2e -- https://emotes.kalpkan.com/ && GPU=1 WIDTH=390 npm run e2e -- https://emotes.kalpkan.com/
node ~/projects/portfolio/docs/reports/evidence/emotes-r2-net-puppeteer.mjs https://emotes.kalpkan.com/ live   # requestsAfterWatching: only /favicon.svg; hosts: emotes.kalpkan.com
node ~/projects/portfolio/docs/reports/evidence/emotes-r2-ux-puppeteer.mjs https://emotes.kalpkan.com/ live     # 6 demo fires / 17 s at 1280 and 390, both schemes; errors []; mute true
curl -sI https://emotes.kalpkan.com/assets/$(curl -s https://emotes.kalpkan.com | grep -o 'index-[A-Za-z0-9_-]*\.js') | grep -i cache-control   # immutable
npx lighthouse https://emotes.kalpkan.com/ --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new" --quiet && python3 -c "import json;print(json.load(open('/tmp/lh.json'))['categories']['performance']['score'])"   # >= 0.85
gh run list -R KalpKan/emote-detector-web --limit 1 --json conclusion   # success
```

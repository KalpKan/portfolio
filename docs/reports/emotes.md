# emotes (Emote Detector) functional audit — 2026-09-19 (TEST + CRITIQUE round 1)

Live URL https://emotes.kalpkan.com · Repo `KalpKan/emote-detector-web` (local `~/projects/emotes`, audited at commit `9807a11`, clean, = `origin/main`; the rules are unchanged since `0b0753a`, the live bundle `assets/index-CCXAWVGh.js` is that source) · Vercel project `emotes` (repo root, framework Vite, static, `prj_mgoUdU4NQ9X8sfP7Jhcy4xBBM6pr`) · Database none · Health route `https://emotes.kalpkan.com/health.json` → `{"ok":true,"service":"emotes"}`

Spec and bars: `docs/reports/emotes-spec.md` (10 stories, §3 bar table, §6 baseline with five root causes). No fix round has landed yet: this report measures the baseline as a stranger would meet it and adds what the spec did not know. Method: real Chrome 151 on the live URL through claude-in-chrome (console; the demo; the tab was kept in the background by the other agents sharing the window, so widths and screenshots were taken in headless real Chrome instead); Puppeteer 25 + real Chrome 151 headless (Mac GPU via ANGLE/Metal) on the live URL at 1280 × 900 and 390 × 844 in both colour schemes, for layout, demo mode, console and every network request; the repo's own fake-camera harness `scripts/e2e-camera.mjs` on the live URL with the official 3-gesture clip at widths 1000 and 390, plus three extra fake-camera clips built from the same read-only photo folder (hard negatives, the known misses, a 3× repeat); the repo's own tests (`npm run test:unit`, `npm run test:corpus`, `npm run report`); a 10 s-hold synthesis through `tests/corpus.ts` at 25 / 12 / 8 fps; Lighthouse 12.8.2 mobile; `impeccable detect` on `index.html`. Every transcript, JSON, script and screenshot is in `docs/reports/evidence/emotes-r1-*` (photos and `.mjpeg` clips never leave the Desktop folder).

## Verdict: PARTIALLY WORKING

The site, the models and the wiring are good: the page loads fast (Lighthouse 0.99–1.00 mobile), "Watching…" appears about 1 s after allowing the camera with a warm CDN, nothing leaves the device but the PostHog beacon, the demo fires all three emotes every loop on desktop and phone, and through the real pipeline (headless Chrome, fake camera, the site's own landmarkers) a clean thumbs-up, flex and yawn each fire once, 111–198 ms after onset, at 1000 and 390 px, on the deployed URL. But a stranger would not trust it, because the three gesture rules are wrong on real people: 10 of 17 clear thumbs-up photos score nothing (and 2 more become a flex), the flex fires on 22 of 30 cover-eyes/dab photos and on a thumbs-up beside the head, 4 of 9 clear yawns are missed while all 3 screams become a yawn, a hand over the mouth becomes a thumbs-up or a flex, the neutral minute fires twice, the hard-negative minute fires twelve times, and a yawn held for ten seconds re-fires every 2.3 s. All of that reproduces through the live pipeline, not only in the offline corpus: a 24.5 s fake-camera clip of hard negatives fired five emotes on the live site, and a clip of the known misses fired none of its five gestures. On top of the detection defects, the page never tells the visitor which cue is missing (S7), its copy talks about "frames", the dwell/cool-down is counted in frames so phones behave differently, and the 4:3 stage crops a portrait phone stream. Three of ten stories pass (S1, S9, S10); S6 passes for sequences and repeats but fails the hold-once bar; the rest fail. Score 35/100.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load and start: what it does, Start camera → video + overlay + "Watching…" within seconds, progress line while ~40 MB loads; 200/Vercel, Lighthouse ≥ 0.85, no console errors, immutable ML files, no horizontal scroll at 390 | **PASS** | `HTTP/2 200`, `server: Vercel`; Lighthouse mobile perf **0.99** (LCP 1.8 s, TBT 20 ms, CLS 0; an earlier run 1.00; `emotes-r1-lighthouse-2026-09-19.txt`), accessibility 1.0, best-practices 1.0. Status sequence after the click: "Asking for the camera…" → "Loading the vision runtime…" → "Loading the face model…" → "…hand model…" → "…pose model…" → "Models ready." → "Watching. Try a thumbs-up, a flex beside your head, or a big yawn." in **1,058 ms** (fresh headless profile, warm CDN; `emotes-r1-net-puppeteer-2026-09-19.json`). `/mediapipe/*` (wasm 11.8 MB + three `.task`) served `max-age=31536000, immutable`, MP3s `max-age=86400`. `scrollWidth` = 390 at 390 px; all three buttons 51 px tall. Page errors: none; console has MediaPipe's own `INFO: Created TensorFlow Lite XNNPACK delegate for CPU.` printed at error level (D8) and three GL warnings |
| S2 | Thumbs-up, either hand, chest height or beside the face, fires once within 1 s | **FAIL** | Clean photo (thumbs_up-07) through the live pipeline: **Thumbs Up 111–150 ms** after onset at 1000 and 390 px (`emotes-r1-e2e-live-2026-09-19.txt`). Corpus: thumbs-up **recall 41 %** (7/17 clear photos; thumbs_up-06/08/09/11/12/13/15/16 score `{flex 0, thumbs_up 0, yawn 0}`, thumbs_up-04/-17 score flex 0.52/0.55 instead), clips 11/21 positives pass. Live fake camera, the "misses" clip: thumbs_up-04 → **Goblin Muscle** at 158 ms, thumbs_up-09 and thumbs_up-16 → nothing |
| S3 | Flex, fist beside the head, fires once within 1 s | **FAIL (precision)** | flex-14 live: **Goblin Muscle 131–178 ms**. Corpus flex **recall 100 %** (13/13) but **precision 35 %** (24 false photos: 11/15 cover-eyes, 11/15 dab, thumbs_up-04, thumbs_up-17); clips precision 52 %. Live fake camera: cover_eyes-02 → Goblin Muscle 135 ms, dab-01 → Goblin Muscle 207 ms, yawn-08 (hand over mouth) → Goblin Muscle |
| S4 | Yawn fires once within 1 s; a yawn behind the hand may be missed but never becomes another emote | **FAIL** | yawn-19 live: **Princess Yawn 116–147 ms**. Corpus yawn **recall 56 %** (5/9; yawn-02/-05/-13/-17 score 0), precision 63 % (all 3 screams angry-01/05/06 → yawn 1.00); occluded yawns 0/8 detected and **2 fire thumbs-up** (yawn-04, yawn-08); partial yawns 3/5 fire flex (yawn-06/10/11, stretching). Live fake camera: angry-01 (scream) → **Princess Yawn**, yawn-08 → **Goblin Muscle**, yawn-05 and yawn-02 → nothing |
| S5 | Nothing fires on ordinary sitting, talking, looking around, scratching, cover-eyes, dab (< 1 false trigger per minute) | **FAIL** | `neutral-60s`: **2 firings / 59 s** (thumbs_up@9360, @43920; bar 0). `hard-negatives-60s`: **12 firings / 60 s** (2 yawn, 10 flex; bar ≤ 1). Stills: 1/9 neutral fires (angry-07, clenched hands → thumbs-up 1.00), **25/33 hard negatives** score something (bar ≤ 3). Live fake camera, the "hard" clip (cover_eyes-02, dab-01, angry-01, yawn-08, angry-07, rest between): **5 emotes in 24.5 s** (Goblin Muscle ×3, Princess Yawn, Thumbs Up) |
| S6 | Thumbs-up → flex → yawn once each in order; the same gesture ×3 fires ×3; a 10 s hold fires once | **PARTIAL** | Corpus: `sequence-three` PASS (thumbs_up@1360 flex@4360 yawn@7280), `repeat-flex/thumbs_up/yawn` PASS 3/3 each. Live fake camera "repeat" clip: Thumbs Up at **406 / 103 / 131 ms** after each of the three onsets (the harness's `FAIL` line is D9, the judge counting the next loop's first fire). **Hold bar fails:** a 10 s hold of yawn-12 (a "clear yawn") synthesised at 25 fps with the corpus's own jitter (σ 0.004) fires **5 times** (2040, 4200, 6760, 9120, 11160 ms); yawn-19 at σ 0.008 fires 4–5 times at 25/12/8 fps; thumbs-up and flex holds fire once at every fps/jitter tried (`emotes-r1-hold-flicker-2026-09-19.txt`) |
| S7 | Three live meters that move; when nothing fires the page says which cue is missing and what to try | **FAIL** | Meters exist, update per frame and highlight the active one (live: Princess Yawn 100 % with the bar filled, Goblin Muscle 64 % mid-transition; `emotes-r1-1000-camera-2026-09-19.jpg`). But there is no cue-level hint anywhere: `#status` is set once to "Watching. Try a thumbs-up…" (`src/main.ts:174`) and never changes; the per-gesture text is the static description (`index.html:57/68/79`); a visitor with a 40 % thumbs-up bar has no way to learn whether the thumb, the fingers or the raised elbow is the problem. The note under the meters says "Hold a pose for about three frames (a tenth of a second)" (`index.html:86`) |
| S8 | Phone: front camera in portrait, no horizontal scroll, tappable buttons, sound after tap, detection as reliable within 1 s | **FAIL (code review; not device-verified)** | Good: `facingMode: "user"` (`main.ts:165`), audio elements created inside the click (`prepareSounds`, `main.ts:58`), 390 px layout has no horizontal scroll, buttons 51 × 74–136 px, the official e2e passes at `WIDTH=390` (Thumbs Up 111 ms, Goblin Muscle 142 ms, Princess Yawn 116 ms). Bad: dwell and cool-down are **frame counts** (`engine.ts:48` `{3,3,3}`, `:86` `cooldownFrames 3`, `:106-119`), so at a phone's 8–12 fps the hysteresis is 250–375 ms per edge instead of 120 ms and the yawn flicker above shows at 8 fps too; `.stage` is a fixed `aspect-ratio: 4 / 3` with `object-fit: cover` on video and canvas (`style.css:76, 89, 110`), so a portrait 480 × 640 stream from a phone is cropped to its middle 40 % (Chrome's fake device can only produce a 480 × 480 stream, which is already cropped top and bottom in `emotes-r1-390-portrait-camera-2026-09-19.jpg`). H11 (Kalp on his phone) remains open |
| S9 | Play demo: stick figure does the three gestures, three emotes fire per loop, no camera prompt | **PASS** | Headless real Chrome at 1280 dark/light and 390 dark/light: Thumbs Up, Goblin Muscle, Princess Yawn at 2.0 / 4.7 / 7.3 s and again at 10.4 / 13.1 / 15.6 s (7.9 s loop), captions "Thumbs up" / "Flex" / "Yawn"; `getUserMedia` is never called in demo mode (`main.ts:191-209`); zero page errors (`emotes-r1-ux-puppeteer-2026-09-19.json`). Real Chrome (claude-in-chrome) confirmed the fires with the tab in the foreground; in a background tab the demo crawls because it is a `setTimeout` chain (limitation, not a defect) |
| S10 | After the models load only same-origin and `/ingest`; `/health.json` ok | **PASS** | Hosts contacted during load + camera + 12 s of watching: **`emotes.kalpkan.com` only**; after "Watching" the only request was `/favicon.svg`; `/ingest/array/…/config.js`, `/ingest/static/1.434.2/posthog-recorder.js`, `/ingest/static/1.434.2/dead-clicks-autocapture.js` are the PostHog proxy; `/health.json` → `{"ok":true,"service":"emotes"}`. Minor: the hashed `/assets/*.js` (460 KB) are served `max-age=0, must-revalidate` (D10) |

Cross-cutting: `npm run typecheck` clean; `npm run test:unit` 33/33; `npm run test:corpus` **32 failing** (31 detection assertions + the count assertion in D7); `npm run report` numbers identical to spec §6 (`emotes-r1-corpus-report-2026-09-19.txt`); CI run 35413937486 on `9807a11`: `unit` green, `corpus` red, as designed. `impeccable detect --json index.html`: 3 warnings for `transition: width` on the meter fills (layout animation; D10), one `all-caps-body` on the 31-character eyebrow (false positive), one `<img>` without `src` (`#emote-img`, set at runtime; false positive), one advisory (1 px border + 30 px shadow). Design critique (single-context, no sub-agent tool in this session): the page is authored for the product (the emote art in the meter rows, the stage-first layout, the honest footer), hierarchy and typography are clean at both widths, the Supercell notice and the privacy line are exactly where a stranger looks for them; what fails is feedback, not looks: status text that never changes, no cue hints, implementation vocabulary in body copy, and no mute.

## Defects

### D1 — Most real thumbs-ups score nothing, and a thumbs-up beside the head becomes a flex

Severity: **blocker** (S2 bar: recall ≥ 90 % / precision ≥ 90 %; measured 41 % / 88 % on photos, 52 % / 73 % on clips; 3 of 3 thumbs-ups in the live "misses" clip failed)

Steps to reproduce: `cd ~/projects/emotes && npm run report -- --verbose | grep thumbs_up-0[689]` — or play `emotes-r1-build-extra-e2e-clips.py misses` through `GPU=1 CLIP=… LABELS=… npm run e2e -- https://emotes.kalpkan.com/`.

Expected / Actual: thumbs_up-06/08/09/11/12/13/15/16 → Thumbs Up within 1 s. Actual: every score 0 (nothing fires). thumbs_up-04 (thumb up beside the head, elbow bent) and thumbs_up-17 (two thumbs up at shoulder height) → **Goblin Muscle** at 158 ms on the live site.

Evidence: `emotes-r1-corpus-report-2026-09-19.txt` (stills table; `missed: thumbs_up-04 {"flex":0.52,"thumbs_up":0,"yawn":0}; thumbs_up-06 {"flex":0,"thumbs_up":0,"yawn":0}…`), `emotes-r1-e2e-live-2026-09-19.txt` (`## WIDTH=1000 clip=misses`).

Likely cause: `src/gestures/thumbsUp.ts:49` — the strict rule's "fingers folded" cue `normalise(tip.y - pip.y, 0.02, 0.14)` needs every fingertip 0.02–0.14 of the frame *below* its PIP joint; in a real fist the tips sit level with the PIPs (−0.02…+0.03 in the fixtures), so `foldedScore < 0.6` and line 56 returns 0 for every real hand. Only `scoreThumbLoose` ever scores, and `src/gestures/engine.ts:73` discards it whenever `poseFlex >= 0.4`, which any bent elbow satisfies (`flex.ts:41` gives a bent elbow alone 0.45 × angleScore).

Suggested fix: measure "folded" as tip-to-MCP distance relative to the hand size (tip closer to the wrist/MCP than the PIP is, or tip below the PIP *along the finger's own axis*), not a fixed 0.02–0.14 frame-fraction; drop the `poseFlex >= 0.4` veto in favour of the fixed flex rule (D2) and only veto a thumbs-up whose hand overlaps the face box. Re-tune on the 17 stills until recall and precision clear 90 % without touching the labels.

### D2 — The flex rule fires on any bent, raised arm: hands over the eyes, a dab, a stretch, a thumbs-up beside the face

Severity: **blocker** (S3/S5 bars: precision ≥ 90 % and ≤ 1 false trigger per hard-negative minute; measured 35 % and 10 flex firings in that minute)

Steps to reproduce: `npm run report` (stills: `flex precision 35 % (tp 13 fp 24)`); live: `emotes-r1-build-extra-e2e-clips.py hard` clip through `npm run e2e`.

Expected / Actual: cover_eyes-02 and dab-01 → nothing. Actual: **Goblin Muscle** at 135 ms and 207 ms on the live site; in the corpus 11/15 cover-eyes, 11/15 dab, yawn-03/06/10 (stretching) and thumbs_up-04/17 all fire flex.

Evidence: `emotes-r1-corpus-report-2026-09-19.txt`, `emotes-r1-e2e-live-2026-09-19.txt` (`## WIDTH=1000 clip=hard`), `tests/stills.test.ts` failure text listing all 24 photos.

Likely cause: `src/gestures/flex.ts:41-57` — the score is elbow angle near 60° (0.45), wrist above the shoulder (0.35) and wrist near the nose/eyes (0.2), and line 54 lets angle + height alone win. Nothing asks whether the wrist is *outside* the shoulder line (beside the head rather than in front of the face), whether the elbow is raised to shoulder height, or whether the hand is a fist; a hand on the face satisfies all three cues better than a real flex does. `engine.ts:56` then accepts any `poseFlex >= 0.5`.

Suggested fix: add the cues that separate a flex from a hand on the face: wrist x beyond the same-side shoulder x by ≥ 0.3 shoulder-widths, elbow within ~0.15 of shoulder height, wrist not inside the face box, and (when the hand landmarker sees that hand) fingers curled; require the wrist-outside-shoulder cue as a gate rather than a weighted term. Check the 15 flex stills (including the profile ones, flex-01/04) still clear 90 %.

### D3 — Yawns are missed when moderate or eyes-open, screams become a yawn, and a hand over the mouth becomes a thumbs-up or a flex

Severity: **major** (S4 bar: recall ≥ 90 %, never a different emote on an occluded yawn; measured 56 %, 2/8 occluded → thumbs-up, 3/3 screams → yawn)

Steps to reproduce: `npm run report -- --verbose | grep -E "yawn-0[2458]|angry-01"`; live: the "hard" and "misses" clips above.

Expected / Actual: yawn-02/05/13/17 (mouth visible) → Princess Yawn; angry-01/05/06 (screams) → nothing; yawn-04/08 (hand over the mouth) → nothing or Princess Yawn. Actual: the four yawns score 0; the three screams score yawn 1.00 and angry-01 fired **Princess Yawn** live; yawn-04/08 fire **Thumbs Up** in the corpus and yawn-08 fired **Goblin Muscle** live.

Evidence: `emotes-r1-corpus-report-2026-09-19.txt` (`yawn precision 63 % recall 56 %`, `occluded yawns: 0/8 detected, 2 fired a wrong emote`), `emotes-r1-e2e-live-2026-09-19.txt`.

Likely cause: `src/gestures/face.ts:89` requires `mouthOpenRatio > 0.55 && mouthHeightRatio > 0.2 && avgEyeOpenRatio < 0.25` and `engine.ts:66` zeroes the score again at `avgEyeOpenRatio >= 0.25`; real yawns in the fixtures have `mouthHeightRatio` 0.16–0.25 and eyes-open yawns exist (yawn-15, yawn-05). A scream is geometrically the same in one frame; only duration and the gradual opening separate them, and the rule has no memory. For the occluded case the hand landmarker sees a raised hand with the thumb up, and nothing suppresses a thumbs-up or flex whose hand/wrist lies inside the face box.

Suggested fix: lower `mouthHeightRatio` to ≈ 0.15 and make the eye term a soft weight rather than a gate (a yawn with eyes at 0.25–0.3 still scores if the mouth is very open); add a duration term in the engine (a yawn must exceed the threshold for ≥ 600 ms of the time-based dwell in D4, screams are shorter and spikier in the corpus clips); veto thumbs-up and flex when the hand's centroid or the wrist is inside the face bounding box.

### D4 — Dwell and cool-down are frame counts, so a held yawn re-fires every 2.3 s and phones get a different detector

Severity: **major** (S6 bar "held for ten seconds fires once"; S8 bar "time-based hysteresis so an 8–12 fps phone still fires within 1 s without flicker")

Steps to reproduce: `npx vite-node docs/reports/evidence/emotes-r1-hold-flicker.ts` (from `~/projects/emotes`, path adjusted): synthesises rest → still held 10 s → rest through `tests/corpus.ts` with the corpus's seeded jitter.

Expected / Actual: one emote per hold. Actual: yawn-12 at 25 fps, jitter σ 0.004 (the corpus default): **5 fires** (2040, 4200, 6760, 9120, 11160 ms), i.e. one every ≈ 2.3 s, exactly the 2 s cooldown plus the 3-frame re-arm; yawn-19 at σ 0.008: 5 fires at 25 fps, 4 at 12 fps, 4 at 8 fps; at 8 fps the first yawn-12 fire is 825 ms after onset and 2,075 ms at σ 0.012. Thumbs-up and flex holds fire once at every rate tried, because their scores sit far above 0.5.

Evidence: `emotes-r1-hold-flicker-2026-09-19.txt` (45 rows).

Likely cause: `src/gestures/engine.ts:106-119` — `hit`/`miss` count frames; `DEFAULT_DWELL {3,3,3}` (`:48`) and `cooldownFrames 3` (`:86`); three consecutive frames under 0.5 (120 ms at 25 fps) reset `active`, and the next three above re-fire the edge; `EmoteGate` (2 s) only rate-limits, it does not know the pose never left. `main.ts:51` caps the loop at 25 fps but a phone delivers whatever the GPU manages.

Suggested fix: pass timestamps into `update()` and switch on after the score has been ≥ 0.5 for ≥ 150 ms, off only after it has been < 0.5 for ≥ 400–500 ms (with a short hysteresis band, e.g. on at 0.5 / off at 0.35), and add a per-gesture refractory period so a gesture that stays active cannot fire again until it has been off for ≥ 500 ms. Keep `tests/engine.test.ts` green by driving it with synthetic timestamps, and add the 10 s-hold case to `tests/clips.test.ts`.

### D5 — The page never tells the visitor which cue is missing; its copy speaks in frames

Severity: **major** (S7 bar; the visitor whose gesture does not fire has only three percentages)

Steps to reproduce: Start camera or Play demo; watch `#status` and the meter rows while a gesture sits at 30–60 %.

Expected / Actual: a hint per gesture naming the failing cue ("raise your fist beside your head", "fold your fingers", "open wider / let your eyes narrow") and a status that reacts. Actual: `#status` stays "Watching. Try a thumbs-up, a flex beside your head, or a big yawn." for the whole session (`src/main.ts:174`, only rewritten on stop/error); the three `.hint` spans are static (`index.html:57, 68, 79`); the note reads "Hold a pose for about three frames (a tenth of a second). Emotes wait two seconds between plays." (`index.html:86`) and "How it works" item 3 repeats "three frames in a row" (`index.html:94`), which is false on a phone (D4) and meaningless to a non-developer.

Evidence: `emotes-r1-1000-camera-2026-09-19.jpg`, `emotes-r1-390-dark-full-2026-09-19.jpg`, `index.html`.

Likely cause: `updateMeters` (`main.ts:88-95`) receives only the fused scores; the rules return a single number and discard which component failed.

Suggested fix: have each rule also return its component scores (`{angle, height, beside, fist}`, `{vertical, folded, upright}`, `{mouth, eyes, duration}`), let the engine expose the weakest component of the best-scoring gesture, and write one hint line per gesture under its meter ("almost: fold your fingers") when the score is 0.25–0.5; rewrite the two "frames" sentences in seconds once D4 lands.

### D6 — A portrait phone stream is cropped to a 4:3 strip

Severity: **major** (S8; unverified on a device, but deterministic from the CSS)

Steps to reproduce: on a phone in portrait, Start camera (iOS Safari and Android Chrome deliver a portrait frame, e.g. 480 × 640, for `facingMode: "user"`); or headless Chrome with a 480 × 480 fake stream at 390 px (`emotes-r1-390-portrait-camera-2026-09-19.jpg`).

Expected / Actual: the stage takes the stream's aspect so the visitor sees their whole head and raised arm. Actual: `.stage` is `aspect-ratio: 4 / 3` (`src/style.css:76`) and video + canvas are `object-fit: cover` (`:89, :110`), so a 3:4 stream is scaled to the 358 px width and its top and bottom 30 % each are cut off; the square fake stream already loses the top and bottom of flex-14. Detection is unaffected (the landmarkers read the full frame), but the visitor cannot see the arm the flex rule is judging, and the 200 px emote card covers most of a 269 px stage.

Evidence: `emotes-r1-390-portrait-camera-2026-09-19.jpg`; `style.css:73-111`.

Suggested fix: on `loadedmetadata` set `stage.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`` (cap the height at ~70 vh), keep `object-fit: contain`, and scale the emote card to ≤ 40 % of the stage height.

### D7 — The stills gate asserts 42 clear positives but the corpus has 39, so the test stays red after the rules are fixed

Severity: **minor** (tooling; blocks a green CI)

Steps to reproduce: `npm run test:corpus` → `tests/stills.test.ts > loads every labelled still: expected 39 to be 42`.

Expected / Actual: `ok` count in `tests/fixtures/stills/index.json` is 13 flex + 17 thumbs_up + 9 yawn = **39** (21 yawn photos = 9 ok + 8 occluded + 3 partial + 1 skip). The test (`tests/stills.test.ts:21`), spec §3/§4 and this task's bar all say 42.

Likely cause: the spec agent counted 42 by adding the 3 partial yawns; `labels.json` is right, the number in the assertion is not.

Suggested fix: change the assertion to 39 (or derive it from `index.json`), and correct the "42 clear photos" wording in `docs/reports/emotes-spec.md` §3/§4 (the README's "42 negatives" is a different, correct count: 12 angry + 15 cover-eyes + 15 dab photos).

### D8 — MediaPipe's INFO line is printed at error level, and the harness reports it as a console error

Severity: **minor**

Steps to reproduce: any camera session; `scripts/e2e-camera.mjs` prints `console errors: INFO: Created TensorFlow Lite XNNPACK delegate for CPU.`

Expected / Actual: zero console errors (S1 bar). Actual: one `console.error` from the WASM runtime every session; the harness records it (`e2e-camera.mjs:41`) but does not fail on it, so the bar is neither met nor enforced.

Likely cause: MediaPipe's WASM glue routes TFLite's INFO log through `console.error`. Not the page's fault; the harness should filter lines starting with `INFO:` and *fail* on anything else.

Suggested fix: in the harness ignore `^(INFO|W\d{4}|I\d{4}) ` lines and add `console errors` to `problems`; optionally wrap `console.error` during model load in `landmarkers.ts` to downgrade INFO lines.

### D9 — The e2e judge counts the next loop's first fire as a false trigger when the models become ready mid-clip

Severity: **minor** (tooling; produces a spurious `FAIL` on otherwise-passing clips)

Steps to reproduce: `emotes-r1-build-extra-e2e-clips.py repeat` clip on the live site: `fires: Thumbs Up@1906 Thumbs Up@4903 Thumbs Up@8231 Thumbs Up@1633 … FAIL: false trigger: Thumbs Up at 1633 ms`.

Expected / Actual: 3 fires, PASS. Actual: the models became ready at clip position 1,728 ms, so the one-loop window (`sinceStart < D`, `e2e-camera.mjs:66-69`) extends 1,728 ms into the second pass and catches its first event (onset 1,500 ms) as a fourth fire; the run before it also reported the first fire as "late: 1019 ms" because the still had already been on screen 850 ms when detection started.

Suggested fix: judge fires by clip position per event with de-duplication (at most one fire per event per loop, and ignore the portion of the window that precedes `phase` on the second pass), or start the fake stream only after the models are ready (press Start camera twice: once to load, once after `stop()`).

### D10 — Small performance and caching leaks

Severity: **minor**

- Hashed bundles `/assets/index-*.js`, `/assets/vision_bundle-*.js` (154 KB), `/assets/module-*.js` (288 KB) are served `cache-control: public, max-age=0, must-revalidate` (`vercel.json` only sets headers for `/mediapipe/*` and `/emotes/*`), so every visit revalidates 460 KB of immutable files. Add a `/assets/(.*)` header with `max-age=31536000, immutable`.
- The meter fills animate `width` (`impeccable detect`: 3 × `layout-transition`), which relayouts three bars 25 times a second during a session; use `transform: scaleX()`.

### D11 — No way to mute

Severity: **minor**

Every fire plays an MP3 with no mute toggle or volume control (`main.ts:76-82`); a visitor in a quiet room can only stop the camera. Add a mute button next to Stop, remembered in `localStorage`.

## Known limitations that are NOT defects

- No real camera or phone in the agent sandbox: the "real pipeline" checks use Chrome's fake camera fed with photo slideshows of the labelled corpus, which exercises the site's own landmarkers and rules but not real motion, lighting or a portrait stream (Chrome's fake device honours the 640 × 480 constraint with crop-and-scale, so it cannot emit a 3:4 stream). H11 stays open for Kalp.
- The photo corpus is copyrighted stock imagery; only landmarks are in the repo, and the extra e2e clips were built in the scratchpad and not committed (`emotes-r1-build-extra-e2e-clips.py` rebuilds them from the Desktop folder).
- The page is dark-only (`color-scheme: dark`, `style.css:13`); it ignores `prefers-color-scheme: light` by design, so the light-theme screenshots equal the dark ones.
- In a background tab the demo runs at about one frame per second (a `setTimeout` chain; Chrome throttles hidden tabs). A visitor never watches a hidden tab; the camera loop stops itself on `visibilitychange` for privacy.
- MediaPipe prints GL/TFLite warnings to the console on every session (`gl_context.cc`, `landmark_projection_calculator.cc`); harmless.
- "Models ready" in ~1 s here reflects a warm Vercel CDN and a fast link; the spec's 15 s cold-load bar was not measured on a throttled connection this round.

## How a fixing agent should verify the fix

```bash
cd ~/projects/emotes && git pull --rebase
npm run typecheck && npm run test:unit                 # 33 passed
npm run test:corpus                                     # all green, incl. "loads every labelled still" (39 ok, D7)
npm run report                                          # per gesture precision/recall >= 90 %, neutral 0/min, hard <= 1/min, max latency <= 1000 ms
npx vite-node ~/projects/portfolio/docs/reports/evidence/emotes-r1-hold-flicker.ts   # every row fires=1 (D4)
python3 scripts/build_e2e_clip.py                       # official clip (git-ignored)
S=/tmp/emotes-e2e && mkdir -p $S && for n in hard misses repeat; do /usr/bin/python3 ~/projects/portfolio/docs/reports/evidence/emotes-r1-build-extra-e2e-clips.py $S $n; done
npm run build && (npx vite preview --port 4173 --strictPort &) && sleep 2
GPU=1 npm run e2e -- http://localhost:4173/             # PASS
GPU=1 WIDTH=390 npm run e2e -- http://localhost:4173/   # PASS
GPU=1 CLIP=$S/e2e-hard.mjpeg   LABELS=$S/e2e-hard-labels.json   npm run e2e -- http://localhost:4173/   # fires: none (S5 through the real pipeline)
GPU=1 CLIP=$S/e2e-misses.mjpeg LABELS=$S/e2e-misses-labels.json npm run e2e -- http://localhost:4173/   # 5 events, each once, <= 1000 ms (D1, D3)
GPU=1 CLIP=$S/e2e-repeat.mjpeg LABELS=$S/e2e-repeat-labels.json npm run e2e -- http://localhost:4173/   # 3 fires (after D9 the judge says PASS)
pkill -f "vite preview --port 4173"
# after the one deploy of the round:
GPU=1 npm run e2e -- https://emotes.kalpkan.com/ && GPU=1 WIDTH=390 npm run e2e -- https://emotes.kalpkan.com/
node ~/projects/portfolio/docs/reports/evidence/emotes-r1-net-puppeteer.mjs   # requestsAfterWatching: only /favicon.svg; hosts: emotes.kalpkan.com; statuses end in "Watching…"
node ~/projects/portfolio/docs/reports/evidence/emotes-r1-ux-puppeteer.mjs    # 6 demo fires per 17 s at 1280 and 390; errors: []; scrollW == vw
npx lighthouse https://emotes.kalpkan.com/ --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new" --quiet && python3 -c "import json;print(json.load(open('/tmp/lh.json'))['categories']['performance']['score'])"   # >= 0.85
curl -sI https://emotes.kalpkan.com/assets/$(curl -s https://emotes.kalpkan.com | grep -o 'index-[A-Za-z0-9_-]*\.js') | grep -i cache-control   # immutable (D10)
gh run list -R KalpKan/emote-detector-web --limit 1 --json conclusion    # success (unit + corpus)
grep -n "Numbers today" README.md   # quotes the new npm run report figures
```

For S7/D5 and D6 read the page at 390 × 844 in headless Chrome: a hint line under the meter of a 25–50 % gesture, no "frames" in the copy, and `#stage` with the stream's aspect ratio (`getComputedStyle(stage).aspectRatio` = `videoWidth / videoHeight`).

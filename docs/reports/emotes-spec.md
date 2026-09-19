# Emote Detector — consumer-grade spec and test corpus — 2026-09-18

Live URL: https://emotes.kalpkan.com · Repo: `KalpKan/emote-detector-web` (local `~/projects/emotes`) · Vercel project `emotes` (team `kks-projects-2edcb11a`, repo root, framework Vite, auto-deploys from `main`; `prj_mgoUdU4NQ9X8sfP7Jhcy4xBBM6pr`) · Database: none · Health route: `https://emotes.kalpkan.com/health.json` → `{"ok":true,"service":"emotes"}` · Python original (read-only): `~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/`, snapshot in private `KalpKan/clash-emote-bot-python`.

Written by the SPEC agent of workflow T5.a+b. It says what the site must do (from the project's own docs), the user stories a TEST agent exercises, the measurable bar for each, and the labelled test corpus (created today, committed to the project repo unless noted). Section 6 records the baseline measured today so fixers know where the gaps are; section 7 lists what the fixers may and may not change.

Kalp's focus for this project: **"it was not detecting the emotes well at all; the model needs a lot of work."** Consumer grade = each of the three gestures (flex, yawn, thumbs-up) fires within 1 s of being performed, with < 1 false trigger per minute of neutral video, on desktop and phone.

## 1. What the project is supposed to do (quoted from its own docs)

Repo `README.md` (the page's own promise):

> Give your webcam a thumbs-up, flex beside your head, or yawn, and the matching Clash Royale emote pops up with its sound. Everything runs on your device: MediaPipe's face, hand and pose landmarkers in WebAssembly, three hand-written gesture rules in TypeScript, an image and an MP3. No video, landmark or audio ever leaves the browser, and after the models have loaded the page makes no network requests except anonymous, cookieless visit counts to its own `/ingest` path.
>
> **What it detects (exactly three things)** — Thumbs up: fingers folded, thumb straight up → *Thumbs Up*. Flex: one arm bent, fist up beside your head → *Goblin Muscle*. Yawn: mouth wide open, eyes narrowed → *Princess Yawn*.
>
> Each rule gives a 0–1 score per frame. A score of 0.5 or more for three frames in a row switches the gesture on; three frames below switches it off … A strong yawn suppresses the other two, and a raised arm cancels a thumbs-up, as in the original. The strongest active gesture fires its emote, then nothing fires for two seconds.
>
> Detection is a set of geometric rules, so lighting, camera angle and how far you stand from the camera all matter; the on-page meters show the live score for each gesture so you can see what the rules are seeing.
>
> **Demo mode** replays hand-built landmark fixtures … through the very same engine and draws a stick figure, so visitors without a webcam still see the three emotes fire.
>
> How to run this: Open https://emotes.kalpkan.com on a laptop or phone, press **Start camera**, allow the camera, and try a thumbs-up. If you would rather not use the camera, press **Play demo**.

Python original, `README.md` and `USER_GUIDE.md`:

> A real-time computer vision application that analyzes facial expressions and displays corresponding Clash Royale emotes. … The detector now focuses on three high-confidence reactions: Flexing beside the head → Goblin Muscle · Wide yawn / tired face → Princess Yawn · Clear thumbs-up → Thumbs Up. Hold each pose steadily for a few frames (roughly 0.15 s) so the system can lock in the gesture confidently.
>
> Tips for best results — Sit 2-3 feet from the camera · Keep your face centered in the frame · Make clear, exaggerated expressions · Hold expressions for 1-2 seconds.
>
> `EMOTE_COLLECTION_SUMMARY.md`: "This change guarantees the detector cannot fall back to legacy emotes … eliminating the false positives we were seeing when multiple reactions overlapped."

Design doc `docs/superpowers/specs/2026-09-18-emotes-design.md`: "when you flex, yawn or give a thumbs-up it flashes the matching Clash Royale emote and plays its sound … Firing: an emote fires on the FSM's inactive→active edge; a 2 s global cooldown … Same feel as the Python app: hold the pose ~0.15 s, one emote per gesture." Non-goals: "Six-gesture classification, emotion detection, multiple faces, recording, any server."

`docs/hosting-plan.md` §1 Tier B row: "**Clash Royale Emote Detector** — MediaPipe face/hand/pose + 9.2 MB MobileNetV2 (68% val acc, 5 epochs); emotion is heuristic. Port: MediaPipe Tasks JS Face/Hand/Pose landmarkers + gesture rules in JS + `<audio>` + canvas → static site, $0." §7 row 9: "heuristics carry the 3 working gestures; keep Supercell art/sounds, ship under Supercell's fan-content policy with attribution and a 'not affiliated' notice." Appendix hard constraint: "ML demos run in the browser (MediaPipe Tasks JS / TF.js / OpenCV.js). No Python inference servers."

So the promise is narrow and testable: three gestures, each fires its one emote promptly when a person does it in front of an ordinary webcam, and nothing fires when they do not.

## 2. User stories (the TEST agent exercises every one, at desktop and 390 px widths)

- **S1 — Load and start.** As a visitor I open the site on a laptop or a phone and I see what it does and two buttons; I press **Start camera**, allow the camera, and within a few seconds I see my own video with the overlay and the status "Watching…", with a progress line while the ~40 MB of models load.
- **S2 — Thumbs-up.** As a visitor I hold a clear thumbs-up in front of the camera (either hand, at chest height or beside my face, fingers folded) and within 1 s I see the *Thumbs Up* emote pop up and hear its sound, exactly once, even if I keep holding it.
- **S3 — Flex.** As a visitor I bend one arm and bring my fist up beside my head (either arm, or both) and within 1 s I see *Goblin Muscle* and hear it, exactly once per flex.
- **S4 — Yawn.** As a visitor I open my mouth wide in a yawn with my eyes narrowing, and within 1 s I see *Princess Yawn* and hear it, exactly once; a yawn behind my hand may be missed but never becomes another emote.
- **S5 — Nothing happens when nothing happens.** As a visitor I sit, talk, look around, gesture with my hands while talking, scratch my head, cover my eyes or dab, and I see no emote fire (fewer than one false trigger per minute of ordinary sitting-and-talking video).
- **S6 — Repeats and sequences.** As a visitor I do thumbs-up, then flex, then yawn, and I see each emote once in that order; if I do the same gesture three times with short rests I see it fire three times, and holding a gesture for ten seconds fires it once, not repeatedly.
- **S7 — Meters that explain.** As a visitor I see three live score bars whose numbers move as I approach each gesture, so when nothing fires I can tell which cue is missing (arm not high enough, thumb not vertical, eyes too open), and the status text tells me what to try.
- **S8 — Phone.** As a visitor on a phone (iOS Safari, Android Chrome) I use the front camera in portrait, the layout fits without horizontal scrolling, the buttons are tappable, the sound plays after my tap, and detection is as reliable as on the laptop, within 1 s.
- **S9 — Demo mode.** As a visitor without a camera I press **Play demo** and I see a stick figure do the three gestures and the three emotes fire in a loop, without any camera permission prompt.
- **S10 — Private and offline.** As a visitor I can check that nothing leaves my device: after the models have loaded, the Network tab shows only same-origin requests and `/ingest`, and `/health.json` answers `{"ok":true,"service":"emotes"}`.

## 3. Consumer-grade bar (measurable, per story)

| Story | Bar (all must hold) | How to measure |
|---|---|---|
| S1 | `HTTP/2 200`, `server: Vercel`; Lighthouse performance ≥ 0.85 (mobile preset) with no ML loaded on first paint; models load and "Watching" appears ≤ 15 s after allowing the camera on a laptop (warm cache ≤ 4 s); no console errors; the four model/WASM files and the MP3s served with `Cache-Control: immutable`/`max-age`; no horizontal scroll at 360/390/430 px | verification.md emotes rows; `scripts/e2e-camera.mjs` prints the models-ready time |
| S2–S4 (photo corpus, frame level) | On the 42 clear photos of the three gestures (`tests/fixtures/stills`, kind `ok`), per gesture **recall ≥ 90 %** and **precision ≥ 90 %** at the engine's firing threshold; the 9 rest/talking photos (`neutral`) score nothing; at most 3 of the 33 hard negatives (cover-eyes, dab, screams) score anything; no occluded yawn or out-of-frame photo scores a *different* gesture | `npm run test:corpus` (`tests/stills.test.ts`); numbers from `npm run report` |
| S2–S4 (ground-truth clips, emote level) | For each of the 43 positive clips (`tests/fixtures/clips/clips.json`) exactly one emote fires, it is the right one, and it fires **≤ 1000 ms after the gesture is fully reached** (p95 and max); over the whole clip set per-gesture emote **precision ≥ 95 %, recall ≥ 90 %**; the 8 occluded-yawn and 5 not-visible clips never fire a different emote | `tests/clips.test.ts`; `npm run report` |
| S2–S4 (real pipeline) | `scripts/e2e-camera.mjs` (headless Chrome, fake camera fed with `e2e-three-gestures.mjpeg`, the page's own landmarkers) reports every event fired once within 1000 ms of onset and nothing else, at width 1000 and 390, on the real GPU (`GPU=1`) and on the deployed URL; in software rendering (CI-like SwiftShader) the same but with the window widened to 2000 ms (few fps) | `GPU=1 npm run e2e -- https://emotes.kalpkan.com` (build the clip first: `python3 scripts/build_e2e_clip.py`) |
| S2–S4 (a real person) | H11 remains the human check: Kalp on his phone and laptop; each gesture fires within 1 s of being performed, three tries out of three, in ordinary room light at 0.6–1.2 m from the camera. The TEST agent, having no camera, substitutes the e2e clip and records that it did | STATUS.md H11 |
| S5 | `neutral-60s` clip: **0 firings** (i.e. < 1 per minute); `hard-negatives-60s` (15 cover-eyes, 15 dab, 3 screams): **≤ 1 firing**; on stills, neutral photos 0/9 and hard negatives ≤ 3/33 | `tests/clips.test.ts`, `tests/stills.test.ts` |
| S6 | `sequence-three` fires thumbs_up, flex, yawn in order, each once; `repeat-flex`, `repeat-thumbs_up`, `repeat-yawn` fire exactly three times each (1.2–1.5 s rests); a gesture held for the whole 2 s segment fires once (no re-fire while held); the 2 s emote cooldown never swallows a *different* gesture performed ≥ 2 s later | `tests/clips.test.ts` |
| S7 | The three meters update every frame with the fused score (0–100 %) and the active one is highlighted; when a gesture is *almost* there the page says which cue is missing (a hint line per gesture that names the failing cue: e.g. "raise your fist higher", "fold your fingers", "eyes still open"); status text names the three gestures | screenshot at desktop and 390 px; code review |
| S8 | `getUserMedia({facingMode: "user"})`; canvas overlay matches the video box at 390 × 844; buttons ≥ 44 px tall; e2e clip passes at `WIDTH=390`; dwell/cool-down expressed in **time**, not frames, so a phone at 8–12 fps still fires within 1 s and does not flicker (see §7) | `WIDTH=390 GPU=1 npm run e2e`; code review of `src/gestures/engine.ts` |
| S9 | Demo fires all three emotes in one loop (`tests/demo.test.ts`), in Chrome and Safari, without a permission prompt; caption names the segment | `npm run test:unit`; browser check |
| S10 | After load: only same-origin + `POST /ingest/…`; `emote_fired {emote}` and `session_started {source}` carry no landmarks; `/health.json` 200 | Chrome Network tab; verification.md rows |

Global: Vercel Hobby static only (no server, no GPU service, no Python inference), $0, MediaPipe Tasks JS from the site's own files, no new third-party scripts; `npm run typecheck`, `npm test`, `npm run build` clean; the CI workflow (`.github/workflows/ci.yml`, added today: `unit` and `corpus` jobs, vitest `--pool=forks --maxWorkers=1`, per-test timeouts) green on `main`; README sections for a non-developer kept current, including honest numbers from `npm run report`.

## 4. Test assets (all created today; paths are absolute)

Project repo `/Users/kalp/projects/emotes` (branch `main`):

| Path | What | Ground truth |
|---|---|---|
| `/Users/kalp/projects/emotes/tests/fixtures/stills/*.json` (95 files, 900 KB, committed) | **Real MediaPipe landmarks** (pose 33 pts, up to 2 hands × 21 pts, face 478 pts, normalised x/y, plus the photo's aspect) for every photo in the Python project's gesture corpus, extracted with the **same `.task` models the site ships** (`public/mediapipe/models`, mediapipe 0.10.20 IMAGE mode) by `scripts/extract_still_landmarks.py`. Photos: flex 15, thumbs_up 17, yawn 21, angry 12, cover_eyes 15, dab 15 | `index.json` (per still: label, expected gesture, kind, note, which landmarkers found something) merged from the hand-written `labels.json`. Kinds: `ok` 42 clear positives (gated), `neutral` 9 rest/talking photos (gated: nothing), `hard` 33 (cover-eyes, dab, 3 screams; gated ≤ 3), `occluded` 8 yawns behind a hand (a miss is tolerated, a wrong emote is not), `partial` 5 (arm-only crops, no face mesh), `skip` 1 (a search-results screenshot) |
| Source photos (read-only, **never committed**): `/Users/kalp/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/data/raw/gestures/<label>/*.png` | 95 screenshots of stock photos (Getty/iStock/Shutterstock watermarks) that Kalp collected for the Python classifier; copyrighted, so only their landmarks and a sha256 are in the repo | labels.json |
| `/Users/kalp/projects/emotes/tests/fixtures/clips/clips.json` (58 clip scripts, 44 KB, committed; built by `scripts/build_clip_scripts.py`) | **Ground-truth clips** as scripts: segments of real stills held for N ms with 300 ms linear transitions and seeded landmark jitter (σ 0.004), synthesised deterministically to 25 fps frames by `tests/corpus.ts` `synthesizeClip`. 43 positive (`single-<still>`: rest 1.5 s → gesture 2 s → rest 1.5 s; `repeat-<gesture>` ×3 holds; `sequence-three`), 8 occluded, 5 partial, `neutral-60s` (59 s of rest frames, hands at rest, synthetic talking and looking around), `hard-negatives-60s` (60 s of cover-eyes, dab, screams from rest) | `events[] {gesture, startMs, endMs}`, `expectFires[]`, `acceptFires[]` per clip; the judge (`judgeClip`) accepts a fire from 400 ms before the still is fully reached until it leaves, flags latency > 1000 ms, and counts every unmatched fire as a false trigger |
| `/Users/kalp/projects/emotes/tests/corpus.ts` | Loader + synthesiser + `runClip` (GestureEngine + EmoteGate exactly as `src/main.ts` wires them) + `judgeClip` + precision/recall | — |
| `/Users/kalp/projects/emotes/tests/stills.test.ts`, `tests/clips.test.ts` | The gate tests for §3 (`npm run test:corpus`); **red today** (32 failing assertions, §6) | — |
| `/Users/kalp/projects/emotes/scripts/eval-corpus.ts` (`npm run report [-- --verbose]`) | Prints the per-gesture precision/recall tables, false-trigger rates per minute and fire latency (median/p95/max) that the fix rounds and the README report | — |
| `/Users/kalp/projects/emotes/tests/fixtures/clips/e2e-three-gestures.mjpeg` (13 MB, **git-ignored**; rebuild with `python3 scripts/build_e2e_clip.py`, needs only Pillow and the read-only photo folder) | Real-video clip for Chrome's fake camera: rest 2 s → thumbs_up-07 2.5 s → rest 2 s → flex-14 2.5 s → rest 2 s → yawn-19 2.5 s → rest 2 s, 640 × 480 letterboxed, 30 fps (Chrome plays `.mjpeg` at 30 fps whatever it was built at) | `/Users/kalp/projects/emotes/tests/fixtures/clips/e2e-labels.json` (committed): three events with `startMs`/`endMs` |
| `/Users/kalp/projects/emotes/scripts/e2e-camera.mjs` (`npm run e2e [-- url]`) | Headless real Chrome (`puppeteer-core`, dev dependency) with `--use-fake-device-for-media-stream --use-file-for-fake-video-capture`, presses **Start camera**, observes the page's own emote box, recovers the clip position from the `<video>` `playing` moment, judges against `e2e-labels.json`, exit 1 on failure. `GPU=1` uses the Mac GPU, `WIDTH=390` the phone layout | e2e-labels.json |
| `/Users/kalp/projects/emotes/.github/workflows/ci.yml` | `unit` job (typecheck, `test:unit`, build) and `corpus` job (`test:corpus` + the report) | — |

Nothing in the repo contains a person's name, a grade or a face image: the fixtures are landmark coordinates only.

## 5. How to run the measurements

```bash
cd /Users/kalp/projects/emotes
npm ci
npm run test:unit        # 33 rule/engine/demo tests (green today)
npm run test:corpus      # the consumer-grade gate (red today)
npm run report -- --verbose   # per-still scores + per-clip verdicts + precision/recall/latency
python3 scripts/build_e2e_clip.py           # once; writes the git-ignored .mjpeg (uses /usr/bin/python3 Pillow)
npm run build && npx vite preview --port 4173 --strictPort &   # local production build
GPU=1 npm run e2e -- http://localhost:4173/  # real pipeline; add WIDTH=390 for the phone layout
GPU=1 npm run e2e -- https://emotes.kalpkan.com   # after a deploy
pkill -f "vite preview --port 4173"          # kill only what you started
```

Re-extracting landmarks (only if the models under `public/mediapipe/models` change): `/usr/bin/python3 scripts/extract_still_landmarks.py` (mediapipe 0.10.20 is installed for that interpreter), then `python3 scripts/build_clip_scripts.py`.

## 6. Baseline measured today (why Kalp is right)

`npm run report`, commit before any fix (`0b0753a` rules, corpus added on top):

**Photo corpus, frame level (94 photos):**

| Gesture | Precision | Recall | tp / fp / fn |
|---|---|---|---|
| flex | **35 %** | 100 % | 13 / 24 / 0 |
| thumbs_up | 88 % | **41 %** | 7 / 1 / 10 |
| yawn | 63 % | **56 %** | 5 / 3 / 4 |

Neutral photos that scored a gesture: 1/9 (a man gesturing with clawed hands → thumbs-up 1.00). Hard negatives that scored something: **25/33** (11 of 15 cover-eyes and 11 of 15 dab → flex; all 3 screams → yawn). Occluded yawns: 0/8 detected, 2 fired thumbs-up instead. Partial: 3 of 5 fired flex (people stretching while yawning).

**Ground-truth clips, emote level (58 clips):** gated clips passing **36/58**. flex precision 52 % / recall 100 %; thumbs_up 73 % / 52 %; yawn 80 % / 62 %. `neutral-60s`: **2 false thumbs-up per minute** (bar: 0). `hard-negatives-60s`: **12 firings per minute** (bar: ≤ 1). Latency when a fire does happen: median 80 ms, p95 520 ms, max 540 ms (the dwell itself is fine; the misses and false triggers are the problem).

**Real pipeline (e2e clip, headless Chrome):** all three emotes fire on the clean photos through the real landmarkers. On the Mac GPU (`GPU=1`): Thumbs Up 131 ms, Goblin Muscle 183 ms, Princess Yawn 140 ms after onset at width 1000 (PASS) and 160 / 198 / 173 ms at width 390 (PASS); models ready 1.7 s after the stream started. In SwiftShader (no GPU): 1.4–1.7 s at the few fps software GL manages, models ready after ~20 s. So the models and the wiring are fine on clean, well-lit, frontal poses; the misses and false triggers in the corpus are the rules.

**Root causes visible in the numbers (for the fixers; from reading `src/gestures/*.ts` against the corpus):**

1. `scoreThumbStrict` is 0 on **every** real thumbs-up photo: its "fingers folded" cue wants each fingertip 0.02–0.14 *below* its PIP joint in normalised units, but in a real fist the tips sit level with the PIPs (measured −0.02…+0.03). Only the loose rule ever scores, and the engine then discards it whenever `poseFlex ≥ 0.4`, which is true for any thumbs-up held beside the face or with a bent elbow (thumbs_up-03/04/06/08/09/11/12/13/15/16/17). That is the 41 % recall.
2. `scoreArmFlex` fires on any bent elbow with the wrist above the shoulder and near the head: hands over the eyes, a dab, stretching, a thumbs-up beside the face. It never checks that the wrist is *outside* the shoulder line (beside the head, not in front of the face), that the hand is a fist, or that the elbow is raised. That is the 35 % precision and 22 of the 24 false flexes.
3. `scoreYawn` needs `mouthHeightRatio > 0.2` of the face box; real yawns measure 0.16–0.25, and eye narrowing (< 0.25) fails on people who yawn with eyes open (yawn-15). Screams (mouth open, eyes squeezed) are geometrically identical in one frame; only duration separates them (a yawn lasts > 1 s and the mouth opens gradually).
4. The FSM counts **frames**: dwell 3 and cool-down 3. At 25 fps that is 120 ms of hysteresis, so landmark jitter of one frame drops and re-arms a gesture; on a phone at 8 fps it is 375 ms of dwell. Time-based hysteresis (e.g. on for ≥ 150 ms, off after ≥ 400 ms) plus a per-gesture refractory period are needed for S6 and S8.
5. Occluded yawns: the hand over the mouth is seen by the hand landmarker as a raised hand with the thumb up (yawn-04/08 → thumbs-up). A thumbs-up whose hand overlaps the face box should not count.

Fixers are free to replace the rules with a small landmark-based classifier (logistic regression / tiny MLP on normalised landmark features, trained on these fixtures, exported as plain JSON weights; no image model, no new network calls) as long as §3 holds and the README says what runs.

## 7. Constraints for the fix rounds

- Keep it a Vite static site on Vercel Hobby; MediaPipe Tasks JS from `public/mediapipe/`; no CDN, no server, no paid tier, no new tracking. Bundle size on first paint stays ML-free (Lighthouse ≥ 0.85).
- The three emotes, their art and sounds and the Supercell notice stay as they are (Kalp's decision; fan-content policy).
- Any change to the corpus labels must be justified in the commit message and re-checked against the photo (the contact sheets are easy to rebuild from the read-only folder); never commit the photos or the `.mjpeg`.
- Deploy at most once per fix round (Vercel Hobby: 100 deployments/day per team; the emotes build sits in the team's single Hobby build queue).
- Machine hygiene: vitest with `--pool=forks --maxWorkers=1`; kill only the preview server you started.
- README "Development" and "What it detects" sections must end each round with the true test count and the report's precision/recall per gesture.

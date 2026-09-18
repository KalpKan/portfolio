# T3.2 Emote Detector in the Browser — Design

_2026-09-18. Brainstormed self-contained (Kalp is not watching); the decisions below follow `docs/hosting-plan.md` §1 Tier B, §7 row 9, Appendix Phase 3 T3.2 and Kalp's confirmed decision to keep the Supercell art and sounds under Supercell's fan-content policy._

## What it is

`https://emotes.kalpkan.com`: a static page that watches your webcam, runs MediaPipe's face, hand and pose landmarkers in the browser, and when you flex, yawn or give a thumbs-up it flashes the matching Clash Royale emote and plays its sound. Nothing is uploaded; after the page has loaded its models there is no network traffic except the first-party analytics proxy.

## What exists (source, read-only)

`~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/` (Python 3.10, OpenCV + MediaPipe Solutions + pygame + Tkinter, 8.6 k lines, never in git until today: snapshot pushed to private `KalpKan/clash-emote-bot-python`, commit `71e3e9f`). The parts worth porting:

- `src/body/pose_gesture_recognizer.py` `_score_arm_flex` (elbow angle near 60°, wrist above shoulder, wrist near the head) and `_score_thumb_direction` (thumb vertical + aligned + pointing up, four fingers folded).
- `src/behavior/behavior_analyzer.py` `_score_thumbs_up` (looser hand-only thumbs-up), `_score_yawn` (mouth-open ratio, mouth-height ratio, eyes narrowed), `_extract_face_metrics` (FaceMesh indices 61/291/13/14 for the mouth, 159/145/33/133 and 386/374/362/263 for the eyes), the conflict rules (yawn ≥ 0.6 suppresses the others; a thumbs-up is dropped while a flex ≥ 0.4 is scoring) and the per-gesture dwell/cool-down FSM (score ≥ 0.5 for 3 frames → active; 3 misses → inactive).
- `config/emotes_config.json`: the three emotes actually enabled (`goblin_muscle` ← flex, `princess_yawn` ← yawn, `thumbs_up` ← thumbs_up), 2 s audio spam prevention.

Not ported, on purpose: the MobileNetV2 `gesture_classifier.keras` (9.2 MB, 5 epochs, 68 % validation accuracy on 19 images, six classes of which three are not in the enabled set); the emotion analyzer (its outputs only gate `laugh`/`kiss`/`embarrassed`/`muscle_face`, none of which the config maps); the Tk GUI, camera diagnostics and Task summaries.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Landmarks | `@mediapipe/tasks-vision` 1.x FaceLandmarker (478 pts, same indices as FaceMesh with refined landmarks), HandLandmarker (21 pts, up to 2 hands), PoseLandmarker lite (33 pts), all in `VIDEO` running mode | Direct port of the Python heuristics with the same landmark indices; the hosting plan requires MediaPipe Tasks JS |
| Self-hosting | WASM runtime (`vision_wasm_internal` + `nosimd`, 22 MB) and the three `.task` models (17 MB) are committed under `public/mediapipe/` and served by Vercel with immutable cache headers | "No network after load", no CDN dependency; Vercel Hobby serves static files free |
| Load strategy | The page paints with zero ML loaded; models load only after "Start camera" or "Play demo" is pressed, with a progress line | Keeps Lighthouse performance ≥ 0.85 (a 39 MB payload on first paint would not) |
| Gesture rules | Pure TypeScript functions over plain `{x,y}` arrays in `src/gestures/*.ts`; a `GestureEngine` class holds the FSM. Rule thresholds are copied number for number from Python | Unit-testable on fixtures without a browser; honest "same rules as the Python app" claim |
| Rule fusion | Per frame: `flex` = pose `_score_arm_flex` (max of both arms), only counted when pose is present and score ≥ 0.5; `thumbs_up` = max(strict `_score_thumb_direction`, loose `_score_thumbs_up` when ≥ 0.6), dropped if flex ≥ 0.4; `yawn` from face metrics; yawn ≥ 0.6 clears the other two. Then the FSM, then one winner (highest score) | Mirrors `BehaviorAnalyzer.analyze` including its conflict resolution |
| Firing | An emote fires on the FSM's inactive→active edge; a 2 s global cooldown (`audio_spam_prevention_ms`) plus "same emote cannot re-fire until its gesture went inactive" | Same feel as the Python app: hold the pose ~0.15 s, one emote per gesture |
| Assets | `public/emotes/<id>.png` (Supercell art, unchanged) and `<id>.mp3` (converted from the WAVs with ffmpeg: mono, 32 kHz, 48 kbps: 544–688 KB → 19–24 KB, ~28× smaller) | Task brief asked for OGG/MP3 at ~10×; MP3 plays everywhere including iOS Safari |
| Audio unlock | Sounds are created and `load()`ed inside the click handler that starts the camera/demo | iOS Safari refuses playback that is not user-initiated |
| Demo mode | A bundled short clip (`public/demo/demo.mp4`, recorded by the worker, or a landmark replay if no clip can be produced) runs through the same engine; visitors without a webcam can still see emotes fire | DoD requires it; also the only way an automated check can prove the pipeline end to end |
| Phone | `getUserMedia({video: {facingMode: "user"}})`, canvas overlay sized to the video, layout tested at 390 px | DoD |
| Analytics | posthog-js via `/ingest` rewrite (`:path(.*)`), cookieless; events `session_started {source}`, `emote_fired {emote}`, `demo_video_played` | `docs/analytics.md`; `emote_fired` is the reserved name on the "Top demos" insight |
| Supercell IP | Footer and README: "Clash Royale emote art and sounds are © Supercell, used under Supercell's Fan Content Policy (link). This site is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it." No ads, no payments | Kalp's decision; the policy's required notice wording |
| Hosting | Vercel project `emotes` (root `/`, framework Vite), `emotes.kalpkan.com` DNS-only CNAME per runbook, `public/health.json` | Same as microtubules |

## Landmark contracts (what the rule functions receive)

```ts
type Pt = { x: number; y: number };           // normalised image coordinates, 0..1
type Pose = Pt[];                              // 33 MediaPipe pose landmarks
type Hand = Pt[];                              // 21 MediaPipe hand landmarks
type FaceMetrics = {                           // from src/gestures/face.ts (faceMetrics(face478, faceBox))
  mouthWidthRatio: number;  mouthHeightRatio: number;  mouthOpenRatio: number;
  avgEyeOpenRatio: number;
};
```

`mouthWidthRatio`/`mouthHeightRatio` are relative to the face bounding box (the Python code divided by the face region), so the port computes the face box as the min/max of the 478 landmarks.

## Non-goals

Six-gesture classification, emotion detection, multiple faces, recording, any server. Those are stated in the README so the page is honest about what it does.

## Verification

- `npm test`: fixture tests for flex, thumbs-up, yawn (positive + negative cases, conflict rules, FSM dwell/cool-down, cooldown), run with `--pool=forks --maxWorkers=1`.
- `npm run build` and Lighthouse ≥ 0.85 on the live host.
- Live host: `/health.json` 200, `/ingest/e/` → 400 (proxy reaches PostHog), Network tab after load shows only same-origin + `/ingest`.
- Demo mode plays in Chrome and fires at least one emote; PostHog receives `session_started`, `emote_fired`, `demo_video_played`.

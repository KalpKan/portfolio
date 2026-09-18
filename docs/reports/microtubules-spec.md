# Microtubule Quantifier — consumer-grade spec and test corpus — 2026-09-18

Live URL: https://microtubules.kalpkan.com · Repo: `KalpKan/Microtubule-Quantification` (local `~/projects/microtubules`, web app in `web/`) · Vercel project `microtubules` (team `kks-projects-2edcb11a`, Root Directory `web`, framework Vite, auto-deploys from `main`) · Database: none · Health route: `https://microtubules.kalpkan.com/health.json` → `{"ok":true,"service":"microtubules"}`

Written by the SPEC agent of workflow T5.a. It says what the site must do (from the project's own docs), the user stories a TEST agent exercises, the measurable bar for each, and the labelled test corpus (created today, committed to the project repo). Section 6 records the baseline measured today so fixers know where the gaps are.

Kalp's focus for this project: **the in-browser result must match the Python pipeline within 1 percentage point on every sample and on at least 3 new images; the UI must explain what the number means, handle wrong file types and huge images gracefully, and work on a phone.**

## 1. What the project is supposed to do (quoted from its own docs)

Root `README.md`:

> An automated image analysis pipeline for quantifying microtubule content in fluorescent microscopy images. Designed for drug screening and dose-response analysis.
>
> **Try it in your browser: https://microtubules.kalpkan.com** — the same measurement, on one image at a time, with nothing uploaded (the `web/` folder; it matches this Python pipeline exactly on the sample cells, see web/README.md#accuracy).
>
> This tool automatically: 1. **Analyzes** fluorescent cell images (green = microtubules, blue = nuclei) 2. **Quantifies** the percentage of each cell occupied by microtubules 3. **Excludes** the nucleus from measurements …
>
> Input Files … Cropped individual cells (one cell per image) · Fluorescent microscopy: green channel (microtubules), blue channel (nuclei) · Formats: PNG, JPG, or TIFF
>
> Processing Pipeline: 1. Extract green channel 2. Detect nucleus 3. Threshold — Apply Otsu's method 4. Exclude nucleus 5. Clean mask — morphological operations 6. Quantify — (green pixels / total pixels) × 100
>
> Key Findings: Untreated: 27.9 ± 4.6% microtubule content · 45 µM nocodazole: 17.2 ± 2.6% (dose-dependent decrease) · DMSO control: 0.00% · Taxol control: 30.7 ± 9.5%

`web/README.md`:

> You pick a fluorescent cell image (or tap a sample), and it shows the image, a green overlay of the detected microtubules with the nucleus cut out, and the percentage of the image that is microtubule. The picture is processed on your device and is never uploaded anywhere. After the page has loaded once it needs no internet connection at all.
>
> The requirement was "within 1 percentage point"; the result is identical to four decimal places, with the same Otsu threshold and the same pixel counts. [on the three sample cells P1_W1_C1 24.8321 %, P3_W2_C3 34.7120 %, P1_W3_C1 21.1827 %]

`web/index.html` (the page's own promise): "Upload a fluorescent cell image (green = microtubules, blue = nucleus) and get the percentage of the image occupied by microtubules, using the same OpenCV steps as the Python pipeline. Nothing is uploaded: the picture never leaves your device."

`USAGE_GUIDE.md` on what to check: "Verify: Overlay matches visible microtubules · No false positives (green where there are no microtubules) · No false negatives (missing visible microtubules)"; and the interpretation rule from `QUICK_REFERENCE.md`: "High %: More microtubules (stabilized) · Low %: Fewer microtubules (destabilized) · Nocodazole: Decreases microtubules ↓ · Taxol: Increases ↑ · DMSO: No effect (≈ untreated)".

`docs/hosting-plan.md` §1 row (Tier B): "**Microtubule-Quantification** — No ML — classical OpenCV (threshold, morphology) + scipy fits. Option 1: OpenCV.js in-browser (static, $0)." and Appendix T1.4 DoD: "works on a phone with zero network calls after load; number matches the Python pipeline on the samples within 1%."

Note on wording: the docs say "percentage of each cell" but the pipeline (and the page) computes the percentage of the **whole image** that is counted as microtubule (background pixels are in the denominator; the nucleus is zeroed, not removed from the denominator). The page must say this plainly (story S7).

## 2. User stories (the TEST agent exercises every one, at desktop and 390 px widths)

- **S1 — Load.** As a visitor I open the site on a phone or a laptop and I see, within seconds, what the tool does, the three sample buttons, and a status line that says OpenCV is loading and then "Ready", without anything jumping around.
- **S2 — Sample.** As a visitor I tap a sample cell and I see the input image, the green overlay with the nucleus cut out, and the percentage, and the number is the one printed in the paper's CSV.
- **S3 — My own cropped cell.** As a visitor I upload one of my own cropped cells (the original ImageJ crop: RGBA PNG with a transparent border, uppercase `.PNG`; or a JPEG, WebP, BMP, 16-bit or grayscale PNG) and I see the same number the Python script gives for that file.
- **S4 — Whole-well image.** As a visitor I upload a whole-well microscope image (0.3–1.4 megapixels, PNG or the camera's JPEG) and I see the overlay and the number in a couple of seconds.
- **S5 — Huge photo.** As a visitor I upload a 12–24 megapixel phone photo and the page stays responsive (shows progress, never freezes or reloads), then shows the result, or tells me clearly that the image is too large and what to do.
- **S6 — Wrong file.** As a visitor I pick a file that is not an image (text, PDF, an empty or truncated file, a `.png` that is really text) or an image the browser cannot decode (TIFF in Chrome/Firefox, HEIC) and I see a specific message that names what is supported; no stale number from the previous image stays on screen as if it were mine.
- **S7 — What the number means.** As a visitor I read, next to the result, what the percentage is (share of the image area counted as microtubule outside the nucleus), what typical values look like in the paper, when to trust it and when not to (crop tightness, exposure, compare only within one experiment), what "Otsu threshold" and the pixel counts are, and I get a warning when the result is degenerate (0 %, 100 %, threshold 0, nucleus covering almost everything, or an image with no blue channel).
- **S8 — Phone camera.** As a visitor on a phone I tap "Take a photo", take a picture of a printed cell image or a screen, and I get a result that respects the photo's orientation, with the result visible without hunting for it.
- **S9 — Keep the result.** As a visitor I can download the overlay (and mask) as PNG and copy the numbers, so I can put them in a report, and the downloaded overlay is the same picture the Python script writes.
- **S10 — Private and offline.** As a visitor I can check that nothing leaves my device: after the page has loaded, analysing an image makes no network request except the site's own analytics beacon, and the page still works with the network off.

## 3. Consumer-grade bar (measurable, per story)

| Story | Bar (all must hold) | How to measure |
|---|---|---|
| S1 | `HTTP/2 200` with `server: Vercel`; Lighthouse performance ≥ 0.90 (mobile preset); "Ready" status within 10 s on a mid-range phone on 4G (opencv.js 10.96 MB, cached `immutable` after the first visit); no horizontal scroll at 360, 390 and 430 px; CLS ≤ 0.1; readable in light and dark mode; all buttons ≥ 44 px tall | verification.md microtubules rows; Chrome device toolbar or the 390 px iframe harness |
| S2 | Each sample shows exactly `24.83` (Untreated, P1_W1_C1), `34.71` (Nocodazole 25 µM, P3_W2_C3), `21.18` (Taxol control, P1_W3_C1) with thresholds 36 / 29 / 62 and pixel counts 1109/4466, 2459/7084, 677/3196; result renders < 1 s after tap on desktop, < 3 s on a phone; on a 390 px screen the percentage is visible without scrolling after the tap (page scrolls the result into view or the result sits above the fold) | `npm test`; browser at 390 px |
| S3 | For **every** image in `tests/fixtures/ground_truth.json` (36 original cells + 4 whole-well + 20 edge images, 60 entries), the browser percentage is within **1.0 percentage point** of the Python `percent`; for lossless formats (PNG, WebP-lossless, BMP, 16-bit PNG, RGBA PNG) the match is exact to 2 decimals and the threshold and pixel counts are identical; for JPEG the difference stays ≤ 1.0 (decoder rounding). Holds in Chrome, Safari (macOS) and iOS Safari. Uppercase `.PNG` accepted | `cd web && npx vitest run --pool=forks --maxWorkers=1` (52 PNGs, Node) plus `web/scripts/browser-corpus.js` in a real browser for the JPEG/WebP/BMP/EXIF/TIFF entries |
| S4 | Whole-well fixtures (`tests/fixtures/fullfield/*`, 660×502 to 1360×1024) analyse in ≤ 2 s on a laptop and ≤ 6 s on a phone, with the overlay shown at a size that fits the screen; numbers match `ground_truth.json` (13.1362 %, 2.8791 %, 3.9149 %, 0.0000 %) | browser-corpus.js; phone via DevTools throttling or a real device |
| S5 | 12 MP fixtures (`edge/huge-12mp-4000x3000.{png,jpg}`) and the 24 MP file (`edge/generated-large/huge-24mp-6000x4000.jpg`, regenerated by `make_fixtures.py`) complete with the correct number (24.7754 / 23.6721 / 23.9292 %) within 15 s on a laptop and within 30 s on a phone, **or** are refused with a message that states the limit in megapixels; while working the page shows a progress/busy state and the main thread is not blocked for more than 1 s at a time (buttons respond, status updates); JS heap stays under 300 MB on the 24 MP file (today 475 MB); display canvases are capped (≤ 2 MP each, analysis at full resolution); no tab crash/reload on iPhone (iOS Safari canvas limit is ~16.7 MP per canvas) | Chrome Performance panel / `performance.memory`; a real iPhone or iOS Simulator |
| S6 | Each non-image fixture (`edge/not-an-image.txt`, `renamed-text.png`, `truncated.png`, `document.pdf`, `empty.png`) and `edge/cell.tiff` in Chrome/Firefox produce a message that (a) names the file, (b) says it could not be read as an image, (c) lists the supported formats (PNG, JPEG, WebP, BMP, GIF; "TIFF/HEIC: convert to PNG first"), and (d) hides or clearly marks the previous result (no stale percentage on screen); the file picker's `accept` lists concrete types rather than `image/*` where that improves the picker; the page remains usable afterwards (a sample still works) | browser-corpus.js non-image rows; screenshot |
| S7 | Next to the result: one sentence defining the number ("share of all pixels in the image counted as microtubule, after the nucleus is removed; background counts in the denominator, so tighter crops give higher numbers"); the paper's reference values (untreated 27.9 ± 4.6 %, nocodazole 45 µM 17.2 ± 2.6 %, taxol 30.7 ± 9.5 %) with the caveat that they only apply to images taken the same way; one-line explanations of Otsu threshold, microtubule pixels, image size; a visible warning when percent = 0, percent = 100, threshold = 0, nucleus mask > 90 % of pixels, or the green and blue channels are identical (grayscale/single-channel image, e.g. `edge/cell-grayscale.png`, `fullfield/Plate1_W1_green_channel_camera.jpeg` both give 0.00 % today with no explanation). Copy reads for a non-scientist (a first-year student can say what the number means after reading it) | screenshot review at 390 px and desktop; design review per hosting-plan operating model |
| S8 | "Take a photo" opens the rear camera on iOS Safari and Android Chrome; the EXIF-rotated fixture `edge/exif-rotated-orientation6.jpg` gives 23.9812 % at 58 × 231 px (rotated, like Python) and the displayed input is upright; after the photo the result is scrolled into view | real phone (Kalp's), fixture via browser-corpus.js |
| S9 | "Download overlay" and "Download mask" buttons produce PNGs; for the three samples the downloaded overlay equals `Results/<name>_overlay.png` pixel-for-pixel (`cv2.imread` diff = 0) and the mask equals `Results/<name>_mask.png`; "Copy result" puts `<name>: <percent>% (threshold N, X/Y px)` on the clipboard | Python diff of the downloads |
| S10 | After load, analysing an image causes no requests except `POST /ingest/…` (PostHog); `image_analyzed` carries only `percent, width, height, source`; with the network disabled after load, samples and uploads still work; `/health.json` returns `{"ok":true,"service":"microtubules"}` | Chrome Network tab, verification.md rows |

Global: Vercel Hobby static only (no serverless, no server-side processing), $0, OpenCV.js served from the site, no new third-party scripts; `npm test` and `npm run build` clean; README sections for a non-developer kept current.

## 4. Test assets (all created today; paths are absolute)

Project repo `/Users/kalp/projects/microtubules`:

| Path | What | Ground truth |
|---|---|---|
| `tests/fixtures/make_fixtures.py` | Builds the corpus: copies the 36 original cells and 4 whole-well images from the Desktop folder (read-only source: `~/Desktop/Out and About/Sidequest/Microtubule Quantification/`), generates the edge cases, runs the Python pipeline on every file and writes `ground_truth.json`. `--check` recomputes and diffs. | itself |
| `tests/fixtures/ground_truth.json` | 60 image entries `{percent, threshold, green_pixels, total_pixels, width, height, bytes, sha256, committed}` + 6 non-image entries with the expected refusal. Truth = `MicrotubuleQuantifier` on the file via `cv2.imread` (alpha dropped, 16-bit → 8-bit, EXIF applied) | Python 3.14 venv, `opencv-python-headless` 5.0.0 |
| `tests/fixtures/cells/P{1,2,3}_W{1..4}_C{1,2,3}.PNG` (36 files, 400 KB) | The **original ImageJ crops** (RGBA, transparent border, uppercase extension) that produced `Results/quantification_results.csv`. 33 of 36 reproduce the CSV exactly; `P3_W1_C2`, `P3_W1_C3`, `P3_W3_C3` were re-cropped after the CSV was made (file dates 27 Nov vs 26 Nov 2025), so their truth is the pipeline on the current file (18.5544 / 5.3544 / 24.7249 %), not the CSV | ground_truth.json |
| `tests/fixtures/fullfield/Plate1_W1_untreated.png` (914×692), `Plate2_45_nocodazole45uM.png` (660×502), `Plate3_W2_New_nocodazole25uM.png` (872×658), `Plate1_W1_green_channel_camera.jpeg` (1360×1024, camera JPEG, green channel only) | The **new images** Kalp asked for: whole-well merged microscope images the site has never seen, plus one raw camera JPEG | 13.1362 / 2.8791 / 3.9149 / 0.0000 % |
| `tests/fixtures/edge/` (25 files, 2.4 MB committed) | Same cell as `cell-rgb.png`, `cell-rgba-transparent-border.png`, `cell-q95.jpg`, `cell-q60.jpg`, `cell.webp` (lossless), `cell.bmp`, `cell-16bit.png`, `cell-grayscale.png`, `cell-posterized.png`, `cell.tiff`; `exif-rotated-orientation6.jpg` (Orientation = 6); sizes `one-pixel.png`, `tiny-4x4.png`, `all-black.png`, `all-green.png`, `all-blue-nucleus-only.png`, `wide-2000x100.png`, `tall-100x2000.png`, `huge-12mp-4000x3000.png`, `huge-12mp-4000x3000.jpg`; non-images `not-an-image.txt`, `renamed-text.png`, `truncated.png`, `document.pdf`, `empty.png` | ground_truth.json |
| `tests/fixtures/edge/generated-large/huge-24mp-6000x4000.jpg` (4.3 MB, **git-ignored**; regenerate with `.venv/bin/python tests/fixtures/make_fixtures.py`) | 24 MP phone-photo-sized input | 23.9292 % |
| `web/tests/corpus.test.ts` | vitest: every PNG entry (52) through `src/pipeline.ts` with the shipped `public/opencv.js`, asserts ≤ 1 point and identical pixel totals. **Passes today: 57/57 tests, diff 0.0000 on all 52** | ground_truth.json |
| `web/scripts/browser-corpus.js` | Paste-into-console harness that drives the real file input on a locally served build (`/fixtures/` on the same origin) for the JPEG/WebP/BMP/EXIF/TIFF and non-image entries, printing browser % vs Python % per file | ground_truth.json |
| `web/public/samples/*.png`, `web/tests/expected.json`, `web/tests/pipeline.test.ts` | Pre-existing: the three sample cells and their reference numbers | expected.json |

Not committed (personal or large): `~/Desktop/Out and About/Sidequest/Microtubule Quantification/Microtubules_Group4_RJ_KK_MR.pdf` (group poster, contains names), `20251118_TuesAM_Group4/*.jpeg` (raw camera channels, 24 files, 14 MB; one is copied as the camera fixture), `Overlayed Images/PHOTO-*.jpeg` (a phone photo, not a microscopy image). Note for future agents: the earlier T1.4 note "the Desktop folder is gone" was wrong; it lives under `Out and About/Sidequest/`, not directly on the Desktop.

Portfolio repo: `docs/reports/images/microtubules-phone-390-after-sample.jpg` (today's 390 px screenshot after tapping a sample: the result is below the fold).

## 5. How to run the checks

```bash
cd ~/projects/microtubules
.venv/bin/python tests/fixtures/make_fixtures.py --check        # Python truth unchanged: "all match"
cd web && npm ci && npx vitest run --pool=forks --maxWorkers=1   # 57 tests, corpus table printed
npm run build && mkdir -p /tmp/mt-site && cp -R dist/. /tmp/mt-site && cp -R ../tests/fixtures /tmp/mt-site/fixtures
(cd /tmp/mt-site && python3 -m http.server 8792)                  # then open http://localhost:8792/ in Chrome,
#   paste web/scripts/browser-corpus.js in the console and run: await runCorpus(await corpusList())
#   (a page on https://microtubules.kalpkan.com cannot fetch localhost, so use the local build for the corpus run;
#    use the live URL for S1, S10 and the Lighthouse row)
```

Phone width without a device: `/tmp/mt-site/phone.html` = `<iframe src="/" width="390" height="844">`, then drive `document.getElementById("f").contentDocument` (headless Chrome will not lay out narrower than 500 px; see incidents.md 2026-09-18 Plato "390 px overflow").

## 6. Baseline measured today (so the fixer knows what is already right and what is not)

Accuracy is already at the bar. In Chrome (local build of `main` `eb07aa0`, macOS), the real file-input path gave, browser vs Python: 6 unseen original cells 49.94/49.9433, 44.23/44.2323, 10.04/10.0369, 5.35/5.3544, 0.00/0.0000, 36.99/36.9892; whole-well 13.14/13.1362, 2.88/2.8791, 3.91/3.9149, 0.00/0.0000; JPEG q95 23.94/23.9364, q60 23.89/23.8916; 16-bit 24.83, grayscale 0.00, RGBA 24.83, WebP 24.83, BMP 24.83, EXIF-rotated 23.98/23.9812 at 58 × 231; 12 MP JPEG 23.67/23.6721 (708 ms), 12 MP PNG 24.78/24.7754 (613 ms); 24 MP JPEG 23.93/23.9292. Every difference ≤ 0.01. vitest: 52/52 PNGs diff 0.0000.

Gaps found (each needs a fix; the TEST agent should confirm them from the steps above and file them as defects in `docs/reports/microtubules.md`):

1. **S6 — wrong file types.** Every non-image (`not-an-image.txt`, `renamed-text.png`, `truncated.png`, `document.pdf`, `empty.png`) and `cell.tiff` show the same generic line "Could not analyse that image: The source image could not be decoded." while the previous image's percentage, threshold and size stay on screen unchanged. Nothing says which formats work, and the README advertises TIFF as an input format. (`web/src/main.ts` `run()` catch block; `decode()`.)
2. **S5 — huge images.** The 24 MP JPEG took 15.4 s wall time with the tab frozen (decode + analysis + painting two 6000 × 4000 canvases on the main thread), JS heap 475 MB, no progress indication and no size guard; both display canvases are created at full resolution. Likely to blank or reload on an iPhone. (`main.ts` `run()`/`paint()`; analysis is synchronous.)
3. **S2/S8 — phone.** At 390 px the result section starts ~800 px below the fold; after tapping a sample only the status text changes, so a phone user sees no number until they scroll (screenshot above). Layout otherwise fits (scrollWidth 390, buttons wrap).
4. **S7 — meaning of the number.** The only explanation is "of the image is microtubule" plus a "How the number is computed" list; no definition of the denominator, no reference values, no caveats, no tooltips on threshold/pixels, and degenerate inputs (grayscale cell → 0.00 %, camera green-channel JPEG → 0.00 %, solid colours → threshold 0 with 0 % or 100 %) are reported as if they were valid measurements.
5. **S9 — keeping the result.** No download or copy affordance; the overlay canvas can only be screenshotted.
6. **Docs.** README "percentage of each cell" vs the actual whole-image denominator; `web/README.md` accuracy section covers 3 cells (now 60 fixtures, update the table and mention `tests/fixtures/`); three published CSV rows do not correspond to the committed crops (say so in `Results/` or the README so nobody "fixes" the pipeline to hit the CSV).

Already fine (do not spend time here): accuracy on every fixture; RGBA transparent borders (the transparent pixels' RGB is what Python uses, and the canvas round-trip does not change the result on any of the 36 cells: worst diff 0.000); uppercase `.PNG`; 16-bit and grayscale decode; health route; offline after load; Lighthouse 0.98; PostHog events.

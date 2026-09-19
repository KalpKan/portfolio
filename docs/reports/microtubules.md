# microtubules (Microtubule Quantifier) functional audit — 2026-09-18 (TEST + CRITIQUE round 1)

Live URL https://microtubules.kalpkan.com · Repo `KalpKan/Microtubule-Quantification` (local `~/projects/microtubules`, web app in `web/`, audited at commit `e56190d`, clean, = `origin/main`; the live bundle `assets/index-CtfItMnP.js` is the same source built with the Vercel env) · Vercel project `microtubules` (Root Directory `web`, framework Vite, static) · Database none · Health route `https://microtubules.kalpkan.com/health.json` → `{"ok":true,"service":"microtubules"}`

Spec and bars: `docs/reports/microtubules-spec.md` (10 stories, §3 bar table, §6 six known gaps). Method: real Chrome 151 (claude-in-chrome, macOS, dark scheme) on the live URL and on a local build of `e56190d` served with the fixture corpus (`python3 -m http.server 8792`, since the live page cannot fetch local fixtures); Playwright Chromium 1.63 headless on the live URL (1280 × 900 dark/light; 360/390/430 px phone widths; iPhone 13 profile 390 × 664 with 4× CPU throttle and CDP network throttling); Playwright WebKit 2359 (the Safari engine; macOS Safari itself is not automatable without Kalp enabling Remote Automation, and no iOS Simulator is installed) on the same local build for the full corpus; Lighthouse 12.8.2 mobile ×3; PostHog events API for the analytics payload; Python 3.14 venv (`opencv-python-headless` 5.0.0) for the ground truth and the overlay/mask diff. Every corpus row (Chromium and WebKit), the live-site JSON, the Playwright scripts, Lighthouse summaries and screenshots are in `docs/reports/evidence/microtubules-r1-*`.

## Verdict: PARTIALLY WORKING

The measurement is right and fast: in Chrome every one of the 60 labelled images gives the Python number to 2 decimals with the identical Otsu threshold and pixel counts (max |diff| 0.005, i.e. display rounding), the three samples print exactly 24.83 / 34.71 / 21.18 with thresholds 36 / 29 / 62, the overlay canvas is pixel-identical to the Python `Results/*_overlay.png`, nothing leaves the device except the PostHog beacon, and the page works offline. But a stranger would not trust or enjoy it yet: in Safari's engine three of Kalp's own whole-well PNGs (Mac-made, with an embedded `kCGColorSpaceGenericRGB` ICC profile) give a different number and threshold (up to +0.97 points); a 24 MP phone photo freezes the tab for 5.5 s at 453 MB heap with two 24 MP canvases; a wrong file leaves the previous result on screen under a generic "could not be decoded" line; the big number comes with no definition, reference values or warnings (a grayscale image confidently reports "0.00 % of the image is microtubule"); there is no download or copy; and on a phone the number sits at the bottom edge of the viewport with the overlay entirely below the fold. None of the six gaps in spec §6 has been fixed (no commits since `e56190d`), and this round adds the Safari colour-management defect (D1) and four minor ones.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load: what it does, three sample buttons, status "OpenCV loading" → "Ready", no layout shift; HTTP/2 200 + Vercel, Lighthouse mobile ≥ 0.90, Ready ≤ 10 s on 4G, no horizontal scroll at 360/390/430, CLS ≤ 0.1, buttons ≥ 44 px, both themes | **PASS (partial)** | `HTTP/2 200`, `server: Vercel`; live Ready in 882 ms (desktop), CLS **0**, status goes "Downloading OpenCV (about 11 MB, one time)..." → "Starting OpenCV runtime..." → "Ready. Choose an image or try a sample."; `scrollWidth` = `clientWidth` at 360/390/430 (`microtubules-r1-live-playwright-2026-09-18.json` `phone360/390/430`); every button 46 px tall; dark and light screenshots readable (`microtubules-r1-desktop-dark-full-2026-09-18.jpg`, `…phone-390-dark-after-sample…` is the light theme at 390, `…chrome-phone390…` the real-Chrome dark theme). Ready under CDP throttling + 4× CPU: 4.9 s at 9 Mbps, **8.8 s at Chrome's "Fast 4G" (4 Mbps)**, **19.9 s at "Slow 4G" (1.6 Mbps)** (`opencv.js` is 3.39 MB brotli on the wire). Lighthouse mobile ×3: **0.73, 0.97, 0.61** (LCP 18.7 s / 1.5 s / 18.8 s, TBT 80 / 170 / 520 ms; `microtubules-r1-lighthouse-runs-2026-09-18.txt`), so the ≥ 0.90 bar holds in 1 of 3 runs → D7 |
| S2 | Sample: input, overlay with nucleus cut out, 24.83 / 34.71 / 21.18, thresholds 36 / 29 / 62, pixels 1109/4466, 2459/7084, 677/3196; < 1 s desktop, < 3 s phone; percent visible without scrolling at 390 px | **PASS (partial)** | Live: `24.83`, `36`, `1,109 / 4,466`; `34.71`, `29`, `2,459 / 7,084`; `21.18`, `62`, `677 / 3,196`; wall time after click 203 ms desktop (Playwright), 318 ms at 4× CPU iPhone 13 profile; real Chrome 7 ms analysis. Overlay shows the nucleus hole (`…desktop-dark-full…`). At 390 × 844 the number is at y = 600–665 (real Chrome, `…chrome-phone390…`); at the iPhone 13 viewport (390 × 664) it is at 576–641 for the short status text and clipped for the "Nocodazole 25 µM (P3_W2_C3)" three-line status; the input/overlay panels are always below the fold; nothing scrolls → D6 |
| S3 | Own cropped cell (RGBA `.PNG`, JPEG, WebP, BMP, 16-bit, grayscale): same number as Python for every one of the 60 ground-truth images; lossless exact to 2 decimals with identical threshold and pixel counts; Chrome, macOS Safari, iOS Safari | **FAIL (Safari)** | **Chromium (real file-input path): 60/60 images, max \|diff\| 0.005, 0 threshold mismatches, 0 pixel-count mismatches** (`microtubules-r1-corpus-chromium-2026-09-18.json`; real Chrome 151 spot checks agree). vitest 57/57 diff 0.0000; `make_fixtures.py --check` → `all match`. **WebKit: 60/60 within 1.0 but 4 threshold mismatches and 8 pixel-count mismatches**: the three ICC-tagged whole-well PNGs give 13.47 / 3.85 / 4.77 % (Python 13.1362 / 2.8791 / 3.9149; thresholds 30/24, 45/42, 34/30) and the JPEGs differ by 0.19–0.29 (decoder rounding, allowed) (`microtubules-r1-corpus-webkit-2026-09-18.json`) → D1. iOS Safari not testable here (no device, no Simulator) |
| S4 | Whole-well image (0.3–1.4 MP PNG or camera JPEG): overlay + number in a couple of seconds, 13.1362 / 2.8791 / 3.9149 / 0.0000 % | **PASS (Chrome) / FAIL (Safari)** | Chromium: 13.14 / 2.88 / 3.91 / 0.00, analysis 27 / 14 / 24 / 60 ms, wall ≤ 107 ms desktop; 128–235 ms analysis at 4× CPU phone profile. WebKit: 13.47 / 3.85 / 4.77 / 0.00 (D1). Overlay fits the screen (canvas `width: 100%`) |
| S5 | 12–24 MP photo: responsive (progress, no freeze/reload), correct number within 15 s laptop / 30 s phone or refused with a MP limit; main thread never blocked > 1 s; heap < 300 MB; display canvases ≤ 2 MP; no iOS crash | **FAIL** | Numbers correct: 12 MP JPEG 23.67 (23.6721), 12 MP PNG 24.78 (24.7754), 24 MP JPEG 23.93 (23.9292). Real Chrome 151 on the local build: 12 MP JPEG wall 2.13 s with the main thread blocked **2,126 ms** (16 ms `setInterval` gap), heap **259 MB**; 24 MP JPEG wall 5.50 s, blocked **5,500 ms**, heap **453 MB**, both display canvases **6000 × 4000** (24 MP each). Headless Chromium: single long task 619 / 597 / 1,264 ms, heap 223 / 223 / 418 MB; 4× CPU phone profile: 12 MP 2.4 s blocked, 24 MP 4.8 s blocked. No progress state beyond the static "Analysing …" text, no size guard, no MP limit message |
| S6 | Wrong file (txt, PDF, empty, truncated, text-as-.png, TIFF): message names the file, says it could not be read as an image, lists PNG/JPEG/WebP/BMP/GIF + "convert TIFF/HEIC", hides or marks the previous result; a sample still works afterwards | **FAIL** | All six fixtures in Chromium/Chrome: status `Could not analyse that image: The source image could not be decoded.` (WebKit: `…Cannot decode the data in the argument to createImageBitmap`, empty file `…from an empty buffer`); `#results.hidden` stays `false` and the previous percent/threshold/size/canvases remain (after `not-an-image.txt` the screen still shows `21.18 %`, `68 × 47 px`, `62`; `microtubules-r1-desktop-after-bad-file-2026-09-18.jpg`). The file name is not in the message; no format list; `accept="image/*"` on both inputs; console shows the raw `InvalidStateError`. `cell.tiff` decodes in WebKit (24.83) but not in Chrome. A sample does work afterwards (pass) |
| S7 | Next to the result: one-sentence definition (whole-image denominator, nucleus zeroed), paper reference values with caveats, one-line explanations of threshold and pixel counts, warnings on degenerate results | **FAIL** | The only copy is "of the image is microtubule" and the six-step "How the number is computed" list. No reference values (27.9 ± 4.6 / 17.2 ± 2.6 / 30.7 ± 9.5 %), no caveats, no tooltip/explanation on "Otsu threshold" or "Microtubule pixels". Degenerate inputs reported as valid: `cell-grayscale.png` and `Plate1_W1_green_channel_camera.jpeg` → `0.00 %`; `all-black.png` → `0.00 %` threshold `0`; `all-green.png` and `one-pixel.png` → `100.00 %` threshold `0`; `all-blue-nucleus-only.png` → `0.00 %`. No warning text anywhere |
| S8 | Phone camera: rear camera opens, EXIF orientation 6 fixture gives 23.9812 % at 58 × 231, input upright, result scrolled into view | **PASS (partial)** | `#camera-input` has `accept="image/*" capture="environment"` (rear camera on iOS/Android by spec); `exif-rotated-orientation6.jpg` → `23.98 %`, `58 × 231 px`, threshold 37, pixels 3,213 / 13,398 (Python 23.9812, 3213 / 13398) in Chromium and real Chrome; WebKit 23.79 % (JPEG decoder, within bar). Not scrolled into view (D6). A real phone camera was not exercised (no device) |
| S9 | Download overlay + mask PNG pixel-identical to `Results/*_overlay.png` / `*_mask.png`; copy `<name>: <percent>% (threshold N, X/Y px)` | **FAIL** | No download or copy control exists (`web/index.html` has none; `main.ts` exposes no mask). The evidence that the fix is only a button: `#overlay-canvas.toDataURL()` for the three samples vs Python — overlay diff **0 px**, max abs 0, and the mask reconstructed from the pure-green pixels equals `Results/<name>_mask.png` with **0 px** difference, for P1_W1_C1, P3_W2_C3 and P1_W3_C1 |
| S10 | After load only `POST /ingest` (event carries only percent/width/height/source); works offline; `/health.json` ok | **PASS (partial)** | Load: `/`, JS, CSS, `/ingest/array/…/config.js`, `/opencv.js`, PostHog recorder + dead-clicks scripts. Sample click: `GET /samples/P1_W3_C1.png` + 2 `sendBeacon` to `/ingest/i/v0/e/` (real Chrome `performance.getEntriesByType('resource')`); upload: **no requests** except the beacon. PostHog `image_analyzed` at 01:41:04 UTC: `{height: 47, percent: 21.18, source: "sample", width: 68}`, `$host microtubules.kalpkan.com`, no other custom keys. Offline (Playwright `setOffline`): upload of `P1_W3_C1.PNG` → `21.18` (pass); a sample **not yet tapped in that session** → `Could not load the sample: Failed to fetch` (D8). `/health.json` → `{"ok":true,"service":"microtubules"}`. Global: `npm run build` clean (`✓ built in 123ms`), `npx vitest run --pool=forks --maxWorkers=1` 57/57, OpenCV.js from `/opencv.js` with `immutable` caching, static Hobby, $0 |

Cross-cutting: no page errors in any run; the only console errors are the uncaught-looking `console.error(err)` lines the page itself prints for bad files. `impeccable detect --json web/index.html` → 1 warning (`flat-type-hierarchy`), a false positive: the sizes live in `src/style.css` (`h1` `clamp(1.8rem, 5vw, 2.6rem)`, `.percent` `clamp(3rem, 14vw, 5rem)`).

## Defects

### D1 — In Safari's engine, PNGs with an embedded ICC profile give a different number and Otsu threshold than the Python pipeline

Severity: **major** (fails the S3 "lossless formats match exactly … in macOS Safari and iOS Safari" bar; the drift is 0.33–0.97 points on Kalp's own three whole-well images, so a fourth image can cross 1.0)

Steps to reproduce: in Playwright WebKit (or Safari) open the local build, choose `tests/fixtures/fullfield/Plate2_45_nocodazole45uM.png`.

Expected / Actual: `2.88 %`, threshold 42 (Python, Chrome). Actual: `3.85 %`, threshold 45. Same for `Plate1_W1_untreated.png` 13.47 vs 13.1362 (threshold 30 vs 24) and `Plate3_W2_New_nocodazole25uM.png` 4.77 vs 3.9149 (34 vs 30). The 36 ImageJ cells (gAMA + cHRM chunks only) and every untagged PNG match exactly in WebKit.

Evidence: `docs/reports/evidence/microtubules-r1-corpus-webkit-2026-09-18.json` vs `…corpus-chromium…`; the three files carry an `iCCP` chunk named `kCGColorSpaceGenericRGB` (Apple Generic RGB, gamma 1.8; `python` chunk walk in this audit). Verified fix: rewriting `Plate2` with the `iCCP` chunk removed gives `2.88 %` / 42 in WebKit (and unchanged in Chromium).

Likely cause: `web/src/main.ts:44` `createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" })`. WebKit ignores `colorSpaceConversion: "none"` and converts the pixels from the embedded profile to sRGB before `getImageData`, which raises the green channel and moves the Otsu threshold. Python's `cv2.imread` ignores ICC profiles, so Chrome (which honours "none") matches and Safari does not. Any Mac-exported PNG (Preview, ImageJ on macOS, screenshots) carries such a profile, so this is the common case for a Mac user, not an edge case.

Suggested fix: before `createImageBitmap`, for PNG blobs walk the chunks and drop `iCCP`, `gAMA`, `cHRM` and `sRGB` (a few lines over the `ArrayBuffer`; no decoding needed) and feed the rewritten bytes; for JPEG strip the `APP2` ICC segment the same way. Add the three whole-well files to a WebKit run in CI (`npx playwright install webkit`, or the `browser-corpus.js` harness) so the bar "identical threshold in Safari" is tested, not assumed.

### D2 — A 12–24 MP photo freezes the page for 2–5.5 s, uses 450 MB and paints two 24 MP canvases

Severity: **major** (S5 bar: main thread never blocked > 1 s, heap < 300 MB, display canvases ≤ 2 MP, progress shown; likely a tab crash on iOS where a single canvas is limited to ~16.7 MP and total canvas memory to ~224–384 MB)

Steps to reproduce: open the site in Chrome, choose `tests/fixtures/edge/generated-large/huge-24mp-6000x4000.jpg` (or any 24 MP phone photo). Try to click a sample button while it runs.

Expected / Actual: a busy/progress state, buttons still responsive, the result within 15 s on a laptop, heap < 300 MB, display canvases capped at 2 MP. Actual (real Chrome 151, `e56190d` local build): 24 MP JPEG: status stays "Analysing huge-24mp-6000x4000.jpg..." with the main thread blocked for **5,500 ms** (max gap between 16 ms timer ticks), `performance.memory.usedJSHeapSize` **453 MB**, `#input-canvas` and `#overlay-canvas` both **6000 × 4000**; 12 MP JPEG: blocked **2,126 ms**, 259 MB, 4000 × 3000 canvases. The number is correct (23.93 / 23.67).

Evidence: real-Chrome measurements in this report's S5 row; headless Chromium rows `edge/huge-*` and `edge/generated-large/*` in `microtubules-r1-corpus-chromium-2026-09-18.json` (`maxLongTaskMs` 619 / 597 / 1264, `heapMB` 223 / 223 / 418, `inputCanvas [6000,4000]`).

Likely cause: `web/src/main.ts:69-84` `run()` decodes to a full-size `ImageData`, calls the synchronous `analyze()` (`src/pipeline.ts:78`, which copies the RGBA into a wasm `Mat`, then copies the mask and a second full RGBA overlay back out), then `paint()` (`main.ts:58-66`) creates two canvases at the image's native size. Everything runs on the main thread; four full-resolution RGBA buffers (image, wasm copy, overlay, canvas backing ×2) are alive at once.

Suggested fix: move decode + `analyze` into a Web Worker (`createImageBitmap` works in workers; OpenCV.js loads with `importScripts`) and post back `{percent, threshold, counts, mask}` so the page never blocks; paint the display canvases at ≤ 2 MP (`drawImage` scaled, keep the full-resolution mask only for download); show a determinate status ("Decoding 24 MP… / Thresholding… / Painting…") and disable the inputs while busy; refuse inputs above a stated limit (e.g. "Images above 30 megapixels are refused; resize to 4000 px wide first") with the limit in the message. Free the `ImageData` after analysis.

### D3 — A wrong file shows a generic "could not be decoded" line while the previous image's result stays on screen

Severity: **major** (S6 bar: name the file, say it could not be read as an image, list supported formats, hide/mark the old result)

Steps to reproduce: tap "Untreated", then "Choose an image" and pick `tests/fixtures/edge/not-an-image.txt` (or `renamed-text.png`, `truncated.png`, `document.pdf`, `empty.png`, `cell.tiff`).

Expected / Actual: "`not-an-image.txt` could not be read as an image. Supported: PNG, JPEG, WebP, BMP, GIF (convert TIFF/HEIC to PNG first)." and the old result hidden or greyed. Actual: red status `Could not analyse that image: The source image could not be decoded.` (WebKit wording differs: `Cannot decode the data in the argument to createImageBitmap`); the Result card still shows `21.18 %`, `68 × 47 px`, threshold `62`, both canvases from the previous image; `console.error` prints the raw `InvalidStateError`.

Evidence: `docs/reports/evidence/microtubules-r1-desktop-after-bad-file-2026-09-18.jpg`; `afterBadFile` in `microtubules-r1-live-playwright-2026-09-18.json` (`resultsHidden: false, percent: "21.18"`); the six non-image rows at the end of both corpus JSONs.

Likely cause: `web/src/main.ts:97-100` catch block prints `err.message` verbatim and never touches `#results`; `decode()` (`main.ts:43`) throws the browser's `InvalidStateError` with no file name or format hint; `index.html:32,36` `accept="image/*"` lets the picker offer TIFF/HEIC/PDF-as-image. The root README (line 72) still advertises "Formats: PNG, JPG, or TIFF".

Suggested fix: in `run()` set `results.hidden = true` (or add a `stale` class that greys the card) before decoding; on a decode failure build the message from the file name, size and type: "`<name>` (<type or extension>) could not be read as an image. This tool reads PNG, JPEG, WebP, BMP and GIF; convert TIFF or HEIC to PNG first."; set `accept="image/png,image/jpeg,image/webp,image/bmp,image/gif"`; fix the README format line.

### D4 — The number is not explained and degenerate results are shown as valid measurements

Severity: **major** (S7 bar; the page's own promise is "the percentage of the image occupied by microtubules", which a first-year student cannot interpret without the denominator, the reference range and a warning when the input is not a two-colour fluorescence image)

Steps to reproduce: tap "Untreated"; read what surrounds `24.83 %`. Then choose `tests/fixtures/edge/cell-grayscale.png` (or `fullfield/Plate1_W1_green_channel_camera.jpeg`, `all-green.png`, `one-pixel.png`, `all-black.png`).

Expected / Actual: next to the result a one-sentence definition ("share of all pixels in the image counted as microtubule after the nucleus is removed; background counts in the denominator, so tighter crops give higher numbers"), the paper's reference values (untreated 27.9 ± 4.6 %, nocodazole 45 µM 17.2 ± 2.6 %, taxol 30.7 ± 9.5 %) with the "same microscope, same exposure, compare within one experiment" caveat, one-line explanations of "Otsu threshold" and the pixel counts, and a visible warning for 0 %, 100 %, threshold 0, nucleus > 90 % or identical green/blue channels. Actual: label "of the image is microtubule", four bare stat tiles (`IMAGE`, `OTSU THRESHOLD`, `MICROTUBULE PIXELS`, `TIME`), the six-step algorithm list further down. `cell-grayscale.png` → `0.00 %` threshold 24 with no warning; camera JPEG → `0.00 %`; `all-green.png` and `one-pixel.png` → `100.00 %` threshold `0`; `all-black.png` → `0.00 %` threshold `0`; `all-blue-nucleus-only.png` → `0.00 %`. `TIME 0 ms` is shown for every small cell.

Evidence: `microtubules-r1-desktop-dark-full-2026-09-18.jpg`; corpus rows `edge/cell-grayscale.png`, `edge/all-*.png`, `edge/one-pixel.png`, `fullfield/Plate1_W1_green_channel_camera.jpeg` (all `status: Done`, no warning text).

Likely cause: `web/index.html:49-62` has only the readout markup; `main.ts:85-90` writes the numbers and nothing else; `pipeline.ts` returns `threshold`, `greenPixels`, `totalPixels` but not the nucleus-pixel count or a channel-identity flag, so the page has nothing to warn with.

Suggested fix: extend `AnalysisResult` with `nucleusPixels` and `channelsIdentical` (compare the G and B planes once, or `countNonZero(absdiff)`), add a `warnings: string[]` builder in `main.ts` (`percent === 0`, `=== 100`, `threshold === 0`, `nucleusPixels / totalPixels > 0.9`, `channelsIdentical`) rendered as an amber callout above the number; add a `<p class="definition">` under the label and a "What the number means" block with the three reference values and the caveats, plus `title`/`<abbr>` or a short line under each stat tile; hide the `TIME` tile (or show it only above 100 ms).

### D5 — No way to keep the result: no download of overlay/mask, no copy

Severity: **major** (S9 bar)

Steps to reproduce: tap any sample; look for a download or copy control.

Expected / Actual: "Download overlay", "Download mask" (PNG) and "Copy result" buttons. Actual: none; the only option is a screenshot of the canvas.

Evidence: `web/index.html` (no such controls); this audit's diff: the live `#overlay-canvas.toDataURL('image/png')` for P1_W1_C1, P3_W2_C3 and P1_W3_C1 differs from `Results/<name>_overlay.png` by **0 pixels**, and the mask reconstructed from its pure-green pixels differs from `Results/<name>_mask.png` by **0 pixels**, so a download would already be pixel-identical.

Likely cause: feature never built; `analyze()` (`pipeline.ts:78`) already returns `mask` (one byte per pixel) and `overlay`, but `main.ts:85` discards `result.mask`.

Suggested fix: keep the last `AnalysisResult` + name in `main.ts`; add three buttons in the results card: overlay → `overlayCanvas.toBlob('image/png')` (from the full-resolution overlay, not the ≤ 2 MP display canvas once D2 lands), mask → paint `mask` into an offscreen `CV_8UC1`-style grayscale canvas (`putImageData` with R=G=B=mask, A=255) and `toBlob`, copy → `navigator.clipboard.writeText(`${name}: ${percent.toFixed(2)}% (threshold ${threshold}, ${green}/${total} px)`)` with a "Copied" confirmation. File names `<name>_overlay.png` / `<name>_mask.png` to mirror `Results/`. Add a vitest that the mask PNG bytes decode to `Results/P1_W1_C1_mask.png`.

### D6 — On a phone the result is not brought into view: the number sits at the bottom edge and the overlay is below the fold

Severity: **major** (S2/S8 bar: percentage visible without scrolling after a tap at 390 px; result scrolled into view after a photo)

Steps to reproduce: at 390 px width (real Chrome via the `phone.html` iframe harness, or an iPhone) tap "Nocodazole 25 µM".

Expected / Actual: the page scrolls so the number and the overlay are visible, or they are above the fold. Actual: `window.scrollY` stays 0; the only visible change is the status line; the `34.71 %` glyphs occupy y = 600–665 px (real Chrome, 390 × 844), i.e. exactly the bottom edge of an iPhone 13/14 Safari viewport (664 px with toolbars) and below the fold on an iPhone SE / small Android (≈ 548–620 px); the two image panels start at ≈ 830 px and are never visible without scrolling. With the shorter one-line status ("Done: P1_W1_C1.PNG…") the number is at 576–641.

Evidence: `docs/reports/evidence/microtubules-r1-chrome-phone390-after-sample-2026-09-18.jpg` (real Chrome, dark), `…iphone13-after-sample…` (Playwright iPhone 13 profile, light), `…phone-390-dark-after-sample…` (390 × 844); `phone390AfterTap` in `microtubules-r1-live-playwright-2026-09-18.json`.

Likely cause: `web/src/main.ts:91` `results.hidden = false` with no `scrollIntoView`; the masthead + controls card (`index.html:16-46`) take ~580 px at 390 px because the lede is five lines and the three sample buttons wrap to two rows.

Suggested fix: after `results.hidden = false` call `results.scrollIntoView({ behavior: "smooth", block: "start" })` when the results card's top is below `innerHeight * 0.5` (samples and uploads alike); shorten the lede to two lines on phones (move the OpenCV/Python sentence to the "How the number is computed" card) and make the sample row a single horizontal scroller so the number lands above the fold on an iPhone 13 without scrolling at all.

### D7 — Lighthouse mobile performance is unstable (0.61–0.97) because the 11 MB `opencv.js` is fetched and parsed on the main thread at page load; Ready takes 20 s on Slow 4G with no progress indicator

Severity: **minor** (S1 bar ≥ 0.90 met in 1 of 3 runs; Ready ≤ 10 s holds at 4 Mbps "Fast 4G" (8.8 s) but not at 1.6 Mbps "Slow 4G" (19.9 s))

Steps to reproduce: `npx lighthouse https://microtubules.kalpkan.com --only-categories=performance --chrome-flags="--headless=new" --output=json` three times; and Playwright CDP `emulateNetworkConditions` 1.6 Mbps / 150 ms + 4× CPU, time to the "Ready" status.

Expected / Actual: ≥ 0.90 every run; Ready ≤ 10 s on 4G with a visible progress bar. Actual: 0.73 (LCP 18.7 s), 0.97 (LCP 1.5 s), 0.61 (LCP 18.8 s, TBT 520 ms); Lighthouse's `bootup-time` attributes 12–16 s (4× slowdown) of scripting to `/opencv.js`; Playwright with 4× CPU: long tasks at load 64/60/588/69/181 ms (largest 588 ms); Ready 19.9 s at 1.6 Mbps, 8.8 s at 4 Mbps, 4.9 s at 9 Mbps, 0.9 s unthrottled. During the download the status text is static ("Downloading OpenCV (about 11 MB, one time)...").

Evidence: `docs/reports/evidence/microtubules-r1-lighthouse-runs-2026-09-18.txt`; `readyMs` in `microtubules-r1-live-playwright-2026-09-18.json`; S1 row.

Likely cause: `web/src/main.ts:135` warms up OpenCV immediately at load; `opencv-loader.ts:35-40` injects `<script src="/opencv.js" async>` (the official build embeds the 8 MB wasm as base64 inside the JS, so the browser parses 11 MB of JS and base64-decodes the wasm on the main thread; `content-length: 10964323`, 3.39 MB brotli). Two of three Lighthouse runs attribute the LCP render delay to that work.

Suggested fix: load OpenCV inside the Web Worker from D2 (moves parse + instantiate off the main thread and fixes the TBT/LCP variance); serve the split build (`opencv.js` + `opencv_js.wasm`, streaming-compiled, ~8 MB and no base64) or at least `fetch()` it with a `ReadableStream` progress counter so the status reads "Downloading OpenCV 3.1 / 11 MB". Record three Lighthouse runs in `verification.md`, not one.

### D8 — Offline, a sample that was not tapped before going offline fails with "Failed to fetch"

Severity: **minor** (S10 bar: "samples and uploads still work" offline; uploads do, samples only if cached)

Steps to reproduce: load the page, tap "Untreated", turn the network off (DevTools Offline), tap "Nocodazole 25 µM".

Expected / Actual: the sample analyses (24 KB of PNGs). Actual: red status `Could not load the sample: Failed to fetch`; "Untreated" still works because `/samples/P1_W1_C1.png` is in the HTTP cache (`max-age=86400`).

Evidence: `offlineSample` in `microtubules-r1-live-playwright-2026-09-18.json`.

Likely cause: `web/src/main.ts:106` fetches `/samples/<name>.png` on click; nothing prefetches or inlines them; the footer promises "works offline once loaded".

Suggested fix: prefetch the three sample blobs right after OpenCV is ready (`Promise.all(fetch(...))` into a `Map`), or import them as Vite assets (`?url` with `inline` for 14 KB total) so a tap never needs the network; optionally a service worker for the whole shell.

### D9 — Extreme aspect ratios and tiny images render absurdly on a phone

Severity: **minor**

Steps to reproduce: at 390 px choose `tests/fixtures/edge/tall-100x2000.png`, then `one-pixel.png`.

Expected / Actual: panels constrained to the viewport (max-height), a 1 × 1 image shown small with a note. Actual: the 100 × 2000 overlay renders **324 × 6,442 px** (page height 14,437 px, two such panels); `one-pixel.png` is a 324 × 324 black square with `100.00 %` and threshold 0 (see D4).

Evidence: `docs/reports/evidence/microtubules-r1-iphone13-tall-image-2026-09-18.jpg`.

Likely cause: `web/src/style.css:203-210` `.panels canvas { width: 100%; height: auto }` with no `max-height`/`object-fit`.

Suggested fix: `max-height: 70vh; width: auto; max-width: 100%; object-fit: contain; margin: 0 auto` on the canvases, and `image-rendering: pixelated` only when the image is smaller than the box (already handled for < 400 px).

### D10 — Light-mode link colour misses AA contrast

Severity: **minor**

Steps to reproduce: light theme, read the "Python pipeline" link in the lede and the footer links.

Expected / Actual: ≥ 4.5:1 for body-size text. Actual: `--accent #178a4c` on `--bg #f4f7f4` = **4.07:1**; on `--surface #fff` = 4.4:1 (the big percent is large text, so 4.4 passes there). Dark theme is fine (10.5:1).

Likely cause: `web/src/style.css:7,58` one accent token used for both fills and text.

Suggested fix: add `--accent-text: #0f6e3b` (≈ 5.6:1 on `#f4f7f4`) for links and the percent in light mode; keep `--accent` for button fills.

### D11 — Docs contradict the tool: "percentage of each cell", "Formats: PNG, JPG, or TIFF", accuracy table covers 3 of 60 images, three CSV rows do not correspond to the committed crops

Severity: **minor** (spec §6 gap 6)

Steps to reproduce: `grep -n 'percentage of each cell\|TIFF' README.md`; read `web/README.md` "Accuracy".

Expected / Actual: README says the number is the share of the whole image (background in the denominator, nucleus zeroed), lists the formats the site actually reads (TIFF only in Safari), and the accuracy section points at `tests/fixtures/ground_truth.json` (60 images) and says that `P3_W1_C2`, `P3_W1_C3`, `P3_W3_C3` were re-cropped after `Results/quantification_results.csv` was produced. Actual: README.md:16 "percentage of each cell", README.md:72 "Formats: PNG, JPG, or TIFF"; `web/README.md:7-15` three-row table; no note on the re-cropped cells anywhere in the repo.

Likely cause: docs written at T1.4 before the corpus existed.

Suggested fix: three sentences in each README and a `Results/README.md` note; keep the three-sample table and add the 60-image summary line ("52 PNGs diff 0.0000 in vitest; JPEG/WebP/BMP/EXIF via `web/scripts/browser-corpus.js`").

## Design critique (impeccable `critique`, run in this context)

⚠️ DEGRADED: single-context (this audit agent has no sub-agent tool; Assessment A and B were run inline, detector first on `web/index.html`, then the design pass on the live page at 1280 px and 390 px in both themes). Mode: **Operate** (a measuring tool).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Status line is honest ("Downloading OpenCV…", "Analysing…", "Done: …") but static during an 11 MB download and a 5 s freeze; disabled state is only 55 % opacity |
| 2 | Match system / real world | 2 | "of the image is microtubule" hides that background counts; "Otsu threshold" and "Microtubule pixels" are unexplained jargon; `TIME 0 ms` |
| 3 | User control and freedom | 3 | Any image or sample can be run again at any time; no cancel for a long run |
| 4 | Consistency and standards | 3 | One card language, one accent, system font; sample buttons and file buttons look identical though one runs instantly and the other opens a picker |
| 5 | Error prevention | 1 | `accept="image/*"` admits TIFF/HEIC/PDF-as-image; no size guard; grayscale/green-only images accepted silently |
| 6 | Recognition rather than recall | 3 | Everything visible on one page; the reference values a user needs to judge a number are absent |
| 7 | Flexibility and efficiency | 2 | No drag-and-drop, no paste, no keyboard shortcut, no batch, no copy/download |
| 8 | Aesthetic and minimalist design | 3 | Clean, restrained, readable in both themes; the "How the number is computed" card is the right idea; the lede is one sentence too long on phones |
| 9 | Error recovery | 1 | Generic decoder error, stale result stays, raw `InvalidStateError` in the console |
| 10 | Help and documentation | 2 | Six-step algorithm list and a link to the accuracy table, nothing on interpretation |
| **Total** | | **22/40** | needs work |

Design-specificity verdict: the page is authored for this product (green accent for "microtubule", the readout hierarchy of one giant number + four monospace tiles + two black image panels, the honest "Nothing is uploaded" promise), not a template; but everything that would make a scientist trust it (definition, reference range, warnings, export) is missing, so it reads as a demo rather than an instrument. Deterministic scan: 1 finding, false positive (see cross-cutting). No overlay was injected (no `live-server` needed for a static page under audit).

What's working: the result hierarchy (the number is unmissable at every width; tiles are scannable); the two-panel input/overlay comparison with the nucleus visibly cut out; both themes are genuinely designed, not inverted.

Priority issues: **[P1]** trust copy and warnings (D4) → `/impeccable clarify`; **[P1]** wrong-file recovery + stale state (D3) → `/impeccable harden`; **[P1]** phone fold and scroll (D6) → `/impeccable adapt`; **[P2]** busy state and progress for big files (D2, D7) → `/impeccable optimize`; **[P2]** export controls (D5) → `/impeccable harden`.

Persona red flags. *Jordan (first-year student, phone):* taps a sample, sees only the status text change, does not know the page moved on; reads "24.83 % of the image is microtubule" and cannot say whether that is high; uploads a phone photo of a printed figure and the tab hangs for five seconds. *Alex (the lab-mate with the real data, Mac + Safari):* drops a Preview-exported whole-well PNG and gets a number 0.9 points off the Python script with no hint why; wants the mask for the report and finds no download; picks a `.tif` from the microscope and reads "could not be decoded" over yesterday's result. *Sam (screen-reader/keyboard user):* the file inputs are focusable and labelled (good), `role="status"` announces the result (good), but the result card appears offscreen with no focus move, and the light-mode link contrast is 4.07:1.

Minor observations: `TIME` tile is noise for < 100 ms; disabled buttons keep `cursor: pointer` on the label while the input says `wait`; the sample row wraps to a lone "Taxol control" full-width button at 390 px; the footer packs four facts into one sentence; no `:focus-visible` styling beyond the UA default.

Questions to consider: what if the number were always accompanied by a one-line verdict ("within the paper's untreated range")? What if dropping a file anywhere on the page ran it? Questions skipped for the fixer: none; the decision list above is the priority order.

## Known limitations that are NOT defects

- iOS Safari and a real phone camera were not exercised (no device, no iOS Simulator on this Mac). WebKit 2359 stands in for Safari for the corpus (D1); the rear-camera claim rests on `capture="environment"`. Kalp can confirm both in one minute on his phone: tap "Take a photo", photograph a printed cell, check the number appears and is upright.
- `cell.tiff` decodes in Safari/WebKit (24.83 %) and not in Chrome/Firefox; the spec treats TIFF as unsupported, so the Chrome refusal is the expected path (D3 covers the message).
- JPEG numbers differ by decoder (WebKit 23.65–24.12 vs Python 23.89–23.94 on the same cell) by ≤ 0.29 points; the bar allows ≤ 1.0 for JPEG.
- The three re-cropped cells (`P3_W1_C2`, `P3_W1_C3`, `P3_W3_C3`) legitimately differ from `Results/quantification_results.csv`; ground truth is the pipeline on the committed file (spec §4). Nobody should "fix" the pipeline toward the CSV.
- Lighthouse's `bootup-time` of 12–16 s for `opencv.js` is at its 4× CPU slowdown; measured long tasks at load in Playwright at 4× are ≤ 588 ms (D7 is about variance and the missing progress, not a real 12 s freeze).
- Vercel Hobby, $0, no server-side code: confirmed (static `dist/`, only `/ingest` rewrites in `vercel.json`).

## How a fixing agent should verify the fix

```bash
cd ~/projects/microtubules
.venv/bin/python tests/fixtures/make_fixtures.py --check            # "all match" (Python truth unchanged)
cd web && npm ci && npx vitest run --pool=forks --maxWorkers=1       # 57/57, every PNG diff 0.0000
npm run build && SITE=/tmp/mt-site && rm -rf $SITE && mkdir -p $SITE && cp -R dist/. $SITE && cp -R ../tests/fixtures $SITE/fixtures
(cd $SITE && python3 -m http.server 8792 &)                          # kill it when done: pkill -f "http.server 8792"
# Full corpus through the real file input, Chromium AND WebKit (D1): expect 60/60 |diff| <= 0.005 and 0 threshold / pixel mismatches in BOTH
NODE_PATH=~/projects/promptflip/node_modules node ~/projects/portfolio/docs/reports/evidence/microtubules-r1-corpus.js
#   (edit the launch line to `webkit.launch()` for the WebKit run; `node <playwright>/cli.js install webkit` once)
# Non-image rows (D3): each status must contain the file name, "could not be read as an image", "PNG, JPEG, WebP, BMP, GIF" and "TIFF"; `resultsHidden` true or the card marked stale
# Huge files (D2), real Chrome on http://localhost:8792/ with the console snippet from this audit (setInterval 16 ms gap): 24 MP -> max gap < 1000 ms, performance.memory.usedJSHeapSize < 300 MB, #input-canvas / #overlay-canvas <= 2 MP, status shows progress, buttons stay disabled-but-responsive; or the file is refused with the MP limit in the message
# Warnings (D4): edge/cell-grayscale.png, fullfield/Plate1_W1_green_channel_camera.jpeg, edge/all-green.png, edge/all-black.png, edge/one-pixel.png, edge/all-blue-nucleus-only.png each show a visible warning; the definition, the three reference values and the threshold/pixel explanations are in the DOM next to #percent
# Download/copy (D5): for the three samples, download overlay + mask and diff with Python:
.venv/bin/python - <<'EOF'
import cv2, numpy as np
for s in ["P1_W1_C1","P3_W2_C3","P1_W3_C1"]:
    for kind in ["overlay","mask"]:
        a = cv2.imread(f"Results/{s}_{kind}.png", cv2.IMREAD_UNCHANGED); b = cv2.imread(f"/path/to/Downloads/{s}_{kind}.png", cv2.IMREAD_UNCHANGED)
        if b.ndim == 3 and b.shape[2] == 4: b = b[:, :, :3]
        if a.ndim == 2 and b.ndim == 3: b = b[:, :, 0]
        print(s, kind, "diff px", int(np.count_nonzero(a != b)))
EOF
#   expect "diff px 0" six times; the clipboard text must be "<name>: <percent>% (threshold N, X/Y px)"
# Phone fold (D6): NODE_PATH=~/projects/promptflip/node_modules node ~/projects/portfolio/docs/reports/evidence/microtubules-r1-live.js
#   -> phone390AfterTap.visible true AND resultsTop <= 40 (scrolled into view) for both the Untreated and the Nocodazole sample; scrollWidth == clientWidth at 360/390/430
# Lighthouse (D7): run three times, all >= 0.90:
for i in 1 2 3; do npx lighthouse https://microtubules.kalpkan.com --only-categories=performance --chrome-flags="--headless=new" --output=json --quiet --output-path=/tmp/lh$i.json; jq .categories.performance.score /tmp/lh$i.json; done
# Offline (D8): in DevTools set Offline after load without tapping anything, then tap each sample -> three results
# Privacy (S10, must still hold): Network tab after load shows only GET /samples/* and POST /ingest/...; PostHog image_analyzed carries only percent/width/height/source
curl -sf https://microtubules.kalpkan.com/health.json                 # {"ok":true,"service":"microtubules"}
```

## FIX round 1 (2026-09-19, FIX agent) — what changed, for the next TEST round

Project commits `efe7f76` (fix) and `52aa5c0` (harness), both on `main` and live at https://microtubules.kalpkan.com (production deployment `microtubules-n6ezmi2ak…`, `githubCommitSha efe7f76`, verified by the v13 deployments API; the CLI deploy was refused by the daily limit but the push-triggered build went through).

| Defect | Change | Evidence after the fix |
|---|---|---|
| D1 Safari ICC | `web/src/decode.ts` strips PNG `iCCP`/`gAMA`/`cHRM`/`sRGB`/`cICP` and JPEG APP2 ICC before `createImageBitmap` (EXIF kept); 20 byte-level tests in `tests/decode.test.ts` | WebKit: 13.14 / 2.88 / 3.91 %, thresholds 24 / 42 / 30, 57 images with 0 lossless mismatches, local and live (`evidence/microtubules-fix1-browser-local.txt`, `…-browser-live.json`) |
| D2 12–24 MP | `web/src/worker.ts`: OpenCV, decoding (banded, ≤ 4 MP canvases), analysis and PNG encoding in a Web Worker; display bitmaps ≤ 2 MP; > 30 MP refused from the header with the limit in the message; `pipeline.ts` keeps single-channel Mats and frees each early | 24 MP: wall 1.25 s Chromium / 1.43 s WebKit, longest main-thread gap 19–49 ms, main-thread heap 6 MB, canvases 1732 × 1154, worker wasm heap 128 MB; numbers 23.67 / 24.78 / 23.93 |
| D3 wrong file | magic-byte sniffing; message names the file, the reason, the five formats and the TIFF/HEIC note; result card hidden on failure, dimmed while busy; `accept` lists concrete types | all six fixtures `hidden=true` with the required phrases in both engines (`…-browser-local.txt` "file" rows; `evidence/microtubules-fix1-desktop-dark-badfile.jpg`) |
| D4 meaning + warnings | definition sentence, "Nucleus removed" tile, "What these numbers mean" disclosure, "Is that high or low?" reference block with caveat; `interpret.ts` warnings (identical channels, nucleus > 90 %, threshold 0, 0 %, 100 %); `TIME` tile removed | `WARN` on exactly the degenerate rows (grayscale, camera JPEG, all-black/green/blue, one-pixel, tiny-4x4, and the three DMSO cells Python itself scores 0.0); `tests/interpret.test.ts`; `evidence/microtubules-fix1-desktop-dark-warning.jpg` |
| D5 download/copy | Download overlay, Download mask (worker-encoded, full resolution, `Results/`-style names), Copy result | six downloads `0 px differ from Results/` in Chromium and WebKit, local and live; clipboard `P1_W1_C1: 24.83% (threshold 36, 1109/4466 px)` |
| D6 phone fold | `scrollIntoView` + focus after every run, two-line lede, one-row scrolling samples below 520 px | `results top 0`, percent y = 19–84 of 664 at 360/390/430 in both engines (`evidence/microtubules-fix1-chromium-phone390-after-sample.jpg`) |
| D7 Lighthouse | OpenCV fetched (with progress text) and run inside the worker | 0.97 / 0.97 / 0.99, TBT 10 / 0 / 0 ms (`evidence/microtubules-fix1-lighthouse-runs.txt`) |
| D8 offline sample | the three samples are prefetched as bytes once OpenCV is ready | Chromium offline: 24.83 / 34.71 / 21.18 and an upload, zero requests (`evidence/microtubules-fix1-offline.cjs`); WebKit not provable under Playwright's offline emulation (fails all blob decodes, see incidents.md) |
| D9 tall images | canvases `max-height: 70vh`, `object-fit: contain` | (not re-measured; CSS only) |
| D10 link contrast | `--accent-text #0f6e3b` for links in light mode | (CSS only) |
| D11 docs | READMEs reworded (denominator, formats, 60-image corpus, re-cropped cells), `Results/README.md` | `git show efe7f76 -- README.md web/README.md Results/README.md` |

How to re-verify: `cd ~/projects/microtubules/web && npm ci && npx vitest run --pool=forks --maxWorkers=1` (93/93) and `npm run build && npm run test:browser` (PASS in chromium + webkit; add `BASE=https://microtubules.kalpkan.com/` for the live site). Not done this round: a real iPhone (Kalp's phone) for the camera path and the < 16.4 Safari fallback (`analyze-decoded`, exercised only by code review), and the S1 "Ready ≤ 10 s on Slow 4G" bar (unchanged 11 MB download; the progress text now shows a percentage).

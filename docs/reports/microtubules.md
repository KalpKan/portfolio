# microtubules (Microtubule Quantifier) functional audit — 2026-09-19 (TEST + CRITIQUE round 2)

Live URL https://microtubules.kalpkan.com · Repo `KalpKan/Microtubule-Quantification` (local `~/projects/microtubules`, web app in `web/`; audited at `main` `52aa5c0`, clean, = `origin/main`; production deployment `microtubules-n6ezmi2ak…` carries `githubCommitSha efe7f76…`, and `52aa5c0` only touches the test harness, so the live bundle `assets/index-sVFWsrWw.js` is the audited source built with the Vercel env) · Vercel project `microtubules` (Root Directory `web`, framework Vite, static, Hobby, $0) · Database none · Health route `https://microtubules.kalpkan.com/health.json` → `{"ok":true,"service":"microtubules"}`

Spec and bars: `docs/reports/microtubules-spec.md` (10 stories, §3 bar table). Previous round: round 1 (2026-09-18, kept below as history) found 0/10 stories at the bar, 6 majors + 5 minors; FIX round 1 (`efe7f76`) claimed all eleven fixed. This round re-tested every one of them independently plus the things the fix did not claim (old-Safari fallback path, > 30 MP refusal, GIF, keyboard, busy state, camera input, CLS, reduced motion, both themes, a visible-window Chromium run for the main-thread measurements).

Method: real Chrome 151 (claude-in-chrome, macOS, dark scheme, Kalp's profile with his extensions) on the live URL for load, samples, network, console and the analytics beacon, and on a local build of the same commit served with the fixture corpus (`http://127.0.0.1:8792/`, `python3 -m http.server` variant with CORS) for every upload path, since the file picker cannot be driven from the live origin (Chrome 151 blocks the https page → `127.0.0.1` fetch behind a local-network permission prompt); the repo's own `npm run test:browser` (Playwright Chromium 1243 + WebKit 2359, the Safari engine) against the live site and against the local build, all 57 committed images + the git-ignored 24 MP file + the 6 non-image fixtures, downloads diffed against `Results/`, phone widths 360/390/430; an extra Playwright script (`evidence/microtubules-r2-extra.cjs`) for headed Chromium, CDP 4G throttling, offline, the no-OffscreenCanvas fallback, the 30 MP limit, GIF, tall/wide layouts, CLS, reduced motion, light/dark contrast, keyboard, busy state and the camera input; Lighthouse 12 mobile ×3; PostHog events API; Python 3.14 venv (`opencv-python-headless` 5.0.0) for the ground truth (`make_fixtures.py --check` → `all match`). Real macOS Safari is still not automatable here (`safaridriver` answers "You must enable 'Allow remote automation' in the Developer section of Safari Settings"; one click by Kalp) and there is no iOS Simulator, so WebKit 2359 on macOS (which uses the same ImageIO decoders that caused round 1's ICC defect) stands in for Safari. Evidence: `docs/reports/evidence/microtubules-r2-*` (harness output in both engines as `.txt` + `.json`, `microtubules-r2-extra.{cjs,txt,json}`, `microtubules-r2-lighthouse-runs.txt`, real-Chrome screenshots `microtubules-r2-chrome-*.jpg`, Playwright screenshots in `microtubules-r2-shots/`).

## Verdict: WORKING

Every one of the six round-1 majors and five minors is fixed and stays fixed in both engines, locally and on the live site. The numbers are now right everywhere they can be measured: 57/57 corpus images (+ the 24 MP file) match the Python pipeline to 2 decimals with identical Otsu thresholds and pixel counts in Chromium **and WebKit** (max lossless |diff| 0.005 = display rounding; JPEGs within 0.29 in WebKit, 0.004 in Chromium); the samples print 24.83 / 34.71 / 21.18 with thresholds 36 / 29 / 62; a 24 MP phone photo finishes in 1.3–2.2 s with the main thread never blocked more than 264 ms (first upload, visible window) and 4–13 MB of page heap; a 31.4 MP file is refused in 16 ms with the limit in the message; every wrong file is named and explained and the old result disappears; the definition, reference values, tile explanations and amber warnings are on the page; downloads equal `Results/*_overlay.png` / `*_mask.png` to the pixel in both engines and the clipboard line has the exact format; on phones the number lands at y = 19–90 px of the viewport after every tap; Lighthouse mobile is 1.00 / 1.00 / 1.00 (perf / a11y / best-practices) three times running with CLS 0.021; the only network traffic after load is the PostHog beacon and the event carries exactly `{percent, width, height, source}`; offline, the three samples and an upload work in Chromium with zero requests. What remains is minor: the fallback path for Safari before 16.4 (no `OffscreenCanvas` in workers) re-introduces round 1's ICC drift (+0.97 points) and paints full-size canvases; the phone layout scrolls the controls and the "Done" line out of view and puts the pictures below the fold; a degenerate "0.00 %" is still typeset as a proud green hero number under a warning that says it is not a measurement; the "Nocodazole 25 µM" sample scores higher than "Untreated" with nothing on the page to explain that; Ready takes 19 s on Slow 4G; and a few sentences of copy are clumsy. Real macOS Safari, a real iPhone camera and Safari offline still need Kalp's one-minute checks (listed under Known limitations).

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Load: what it does, three sample buttons, status "OpenCV loading" → "Ready", no layout shift; HTTP/2 200 + Vercel, Lighthouse mobile ≥ 0.90, Ready ≤ 10 s on 4G, no horizontal scroll at 360/390/430, CLS ≤ 0.1, buttons ≥ 44 px, both themes | **PASS** | `HTTP/2 200`, `server: Vercel`, `h2`; real Chrome (warm cache) `loadEventEnd` 564 ms, Ready at 905 ms; status walks "Loading OpenCV..." → "Downloading OpenCV (about 11 MB, one time)... N %" (ten distinct progress texts) → "Starting OpenCV runtime..." → "Ready. Choose an image or try a sample."; Ready with a cold cache, iPhone 13 profile + 4× CPU: **4.5 s at 9 Mbps, 8.3 s at Fast 4G (4 Mbps), 19.0 s at Slow 4G (1.6 Mbps)** (`extra.txt` `throttle`); **Lighthouse mobile ×3: perf 1.00 / 1.00 / 1.00, a11y 1.00, best-practices 1.00, LCP 0.8–1.4 s, TBT 0–30 ms, CLS 0.021** (`microtubules-r2-lighthouse-runs.txt`); PerformanceObserver CLS 0 at load and after a tap on desktop and 390 px; `scrollWidth ≤ clientWidth` at 360/390/430 in both engines; every visible button ≥ 44 px (harness `phone` rows); light and dark screenshots `microtubules-r2-shots/{desktop,phone390}-{light,dark}-idle.jpg`. Slow 4G is the one preset over 10 s → D18 (minor; the bar names 4G, and Chrome's "Fast 4G" preset passes) |
| S2 | Sample: input, overlay with nucleus cut out, 24.83 / 34.71 / 21.18, thresholds 36 / 29 / 62, pixels 1109/4466, 2459/7084, 677/3196; < 1 s desktop, < 3 s phone; percent visible without scrolling at 390 px | **PASS** | Live, real Chrome: `24.83` thr `36` `1,109 / 4,466` nucleus `8.6 %`; `34.71` / `29` / `2,459 / 7,084` / `11.9 %`; `21.18` / `62` / `677 / 3,196` / `15.1 %`; click → Done in **9–32 ms** (MutationObserver; the first cold click 301 ms), stages "Loading sample…" → "Reading…" → "Finding the nucleus and microtubules in …" → "Painting the overlay…" → "Done: sample Untreated (P1_W1_C1). Pick another image or sample to run again."; focus moves to `#results`. Harness, live: samples in both engines; phone 360/390/430: percent at **y = 19–90 of 664/844, `results top 0`** in Chromium and WebKit (`microtubules-r2-browser-live.txt`). Overlay shows the nucleus hole (`microtubules-r2-chrome-desktop-dark-after-sample.jpg`, `…shots/phone390-light-after-sample.jpg`) |
| S3 | Own cropped cell (RGBA `.PNG`, JPEG, WebP, BMP, 16-bit, grayscale): same number as Python for every one of the 60 ground-truth images; lossless exact to 2 decimals with identical threshold and pixel counts; Chrome, macOS Safari, iOS Safari | **PASS (engine-level for Safari)** | Harness through the real file input, **live site**: Chromium 57 images, max \|diff\| 0.0050, **0 lossless threshold mismatches, 0 pixel mismatches**; **WebKit 57 images, 0 lossless mismatches**, JPEG diffs 0.23 / −0.29 / −0.19 (decoder rounding, bar ≤ 1.0); identical on the local build (`…-browser-live.txt`, `…-browser-local.txt`, JSON rows). The three ICC-tagged whole-well PNGs now give 13.14 / 2.88 / 3.91 with thresholds 24 / 42 / 30 in WebKit (round 1: 13.47 / 3.85 / 4.77). Real Chrome 151 spot checks on the local build: `cell-rgba-transparent-border.png`, `cell.webp`, `cell.bmp`, `cell-16bit.png` → 24.83 / 36 / 1,109; `cell-q95.jpg` 23.94 (Python 23.9430); `cell-grayscale.png` 0.00 + warning; `exif-rotated-orientation6.jpg` 23.98 at 58 × 231. vitest 93/93 (52 PNGs diff 0.0000); `make_fixtures.py --check` all match. A `cell.gif` (PIL-converted, Python 24.7425 / 36 / 1105) gives 24.74 / 36 / 1,105 in both engines. **Not this bar:** the Safari < 16.4 fallback path (D12) and a real iPhone (Known limitations) |
| S4 | Whole-well image (0.3–1.4 MP PNG or camera JPEG): overlay + number in a couple of seconds, 13.1362 / 2.8791 / 3.9149 / 0.0000 % | **PASS** | Real Chrome: 13.14 (wall 324 ms), 2.88 (130 ms), 3.91 (157 ms), 0.00 (319 ms, amber "nucleus mask covers 97 %" warning); WebKit and Chromium harness rows the same; iPhone 13 profile + 4× CPU: 235 ms / 128 ms. Display canvases at native size (≤ 1.4 MP) |
| S5 | 12–24 MP photo: responsive (progress, no freeze/reload), correct number within 15 s laptop / 30 s phone or refused with a MP limit; main thread never blocked > 1 s; heap < 300 MB; display canvases ≤ 2 MP; no iOS crash | **PASS** | **Headed (visible) Chromium**: 12 MP JPEG 23.67 in 1.38 s, max main-thread gap **264 ms**, page heap 4 MB, canvases 1632 × 1224; 12 MP PNG 24.78 in 0.76 s, gap 19 ms; **24 MP JPEG 23.93 in 2.2 s, gap 18 ms**, canvases 1732 × 1154; a 30.0 MP JPEG (6000 × 5000, the limit itself) 1.97 s, gap 19 ms; worker wasm heap 128 MB (`extra.txt` `headed`). Headless harness live: 0.70 / 0.73 / 1.30 s, gaps 19 ms, heap 12–13 MB; WebKit 0.64 / 1.08 / 1.60 s, gaps ≤ 126 ms. iPhone 13 profile + 4× CPU: 12 MP 0.8 s, 24 MP 1.3 s, gaps ≤ 39 ms. Real Chrome in a background tab: 24 MP 6.0–6.5 s (Chrome de-prioritises hidden tabs; still within the bar). Progress: "Reading … (24.0 MP)..." → "Finding the nucleus and microtubules in 6000 × 4000 px..." → "Painting the overlay..." → "Done: … in 1.1 s"; while busy the inputs are `disabled`, the sample buttons at 55 % opacity, cursor `wait`, the old card dimmed (`stale`), and five forced clicks on a sample during the run change nothing (`extra.txt` `busy`). **Refusal**: a 5600 × 5600 PNG and JPEG (31.4 MP) → "over-limit-5600x5600.png is 31.4 megapixels (5600 × 5600 px); the limit is 30 megapixels. Resize it (about 6000 × 4000 px or smaller) and try again." in **14–16 ms** (header read, nothing decoded), result hidden, both engines; the limit is also printed under the buttons ("up to 30 megapixels"). iOS crash: not testable (no device); every canvas is ≤ 4 MP by construction |
| S6 | Wrong file (txt, PDF, empty, truncated, text-as-.png, TIFF): message names the file, says it could not be read as an image, lists PNG/JPEG/WebP/BMP/GIF + "convert TIFF/HEIC", hides or marks the previous result; a sample still works afterwards | **PASS** | Real Chrome after a 21.18 % result, all six: e.g. "not-an-image.txt is not an image file (text/plain, 35 bytes) and could not be read as an image. This tool reads PNG, JPEG, WebP, BMP and GIF; convert TIFF or HEIC to PNG first." / "truncated.png looks damaged or truncated and …" / "document.pdf is a PDF, not an image and …" / "empty.png is empty (0 bytes) and …" / "cell.tiff is a TIFF, which browsers cannot read and …"; `#results.hidden` **true** every time, status red (`rgb(255,138,128)` on dark, 6.6:1 on light), no console error; then `P1_W1_C1.PNG` → 24.83 with the card back (`microtubules-r2-chrome-desktop-dark-badfile.jpg`; harness `file` rows in both engines, live and local). `accept` lists the five concrete types; the TIFF is refused by magic bytes in WebKit too (spec: unsupported). Copy nit → D17 |
| S7 | Next to the result: one-sentence definition (whole-image denominator, nucleus zeroed), paper reference values with caveats, one-line explanations of threshold and pixel counts, warnings on degenerate results | **PASS** | Under the number: "Share of all pixels counted as microtubule after the nucleus is removed. Background is in the denominator, so a tighter crop around the cell gives a higher number."; tiles Image / Otsu threshold / Microtubule pixels / Nucleus removed with a "What these numbers mean" disclosure (open ≥ 700 px); "Is that high or low?" block with **27.9 ± 4.6 %, 17.2 ± 2.6 %, 30.7 ± 9.5 %** and the same-microscope/same-exposure/compare-within-one-experiment caveat. Warnings (amber `role="alert"`, 8.5:1 light / dark) on exactly the degenerate rows: `cell-grayscale.png` and `all-black.png` ("channels identical… not a measurement"), `Plate1_W1_green_channel_camera.jpeg` ("nucleus mask covers 97 %"), `tiny-4x4.png` (100 %), `all-blue-nucleus-only.png`, `all-green.png` and `one-pixel.png` (threshold 0 + "Every pixel counted as microtubule (100 %)"), and the three DMSO cells Python also scores 0.0; none on the other 47 (harness `WARN` column). Presentation of a warned result → D14, sample-vs-reference copy → D15 |
| S8 | Phone camera: rear camera opens, EXIF orientation 6 fixture gives 23.9812 % at 58 × 231, input upright, result scrolled into view | **PASS (input path; no device)** | `#camera-input` `accept="image/*" capture="environment"`, label "Take a photo"; through **that input** on a 390 × 664 iPhone 13 profile: Chromium 23.98 % / 37 / 58 × 231 px, WebKit 23.79 % (JPEG decoder), canvas 58 × 231 (upright), percent at y = 19–84 after the scroll (`extra.txt` `camera`, `…shots/camera-{chromium,webkit}-390.jpg`); the banded pixel read gives the same numbers (`bands` rows). A real phone camera was not exercised (Known limitations) |
| S9 | Download overlay + mask PNG pixel-identical to `Results/*_overlay.png` / `*_mask.png`; copy `<name>: <percent>% (threshold N, X/Y px)` | **PASS** | Harness, live and local, Chromium and WebKit: `P1_W1_C1_overlay.png`, `P1_W1_C1_mask.png`, `P3_W2_C3_*`, `P1_W3_C1_*` → **0 px differ from `Results/`**, right sizes and names; clipboard `P1_W1_C1: 24.83% (threshold 36, 1109/4466 px)`, `P3_W2_C3: 34.71% (threshold 29, 2459/7084 px)`, `P1_W3_C1: 21.18% (threshold 62, 677/3196 px)`; button flips to "Copied" and the status repeats the line. Downloads also work on the no-OffscreenCanvas fallback (page-side PNG encode, 3.0–3.3 KB files) |
| S10 | After load only `POST /ingest` (event carries only percent/width/height/source); works offline; `/health.json` ok | **PASS** | Real Chrome, live, during a sample: resource entries = two `beacon /ingest/i/v0/e/` (315 B) and nothing else; the network panel for the whole session shows only `microtubules.kalpkan.com` (page, JS, CSS, `/ingest/array/…/config.js`, `/ingest/i/v0/e/`, `/ingest/s/`) plus Kalp's own extensions; the worker's `/opencv.js` and `/samples/*.png` are same-origin. PostHog events API: `image_analyzed` at 02:40:20 Z `{height: 58, percent: 24.83, source: "sample", width: 77}`, `$host microtubules.kalpkan.com`, no other custom keys; `sample_loaded {sample: "P1_W1_C1"}`. Offline (Playwright `setOffline` after Ready, **no sample tapped beforehand**): Chromium 24.83 / 34.71 / 21.18 and an upload 34.71 with **zero requests**; WebKit under the same emulation fails every blob decode ("looks damaged or truncated", "The I/O read operation failed") — a Playwright artefact, see Known limitations and D13. `/health.json` → `{"ok":true,"service":"microtubules"}`. Global: `npm run build` clean (105 ms), vitest 93/93 with `--pool=forks --maxWorkers=1`, static Vercel Hobby, OpenCV.js from `/opencv.js`, $0 |

Cross-cutting: no page errors in any run in either engine; the console on the live site is clean apart from Kalp's MetaMask extension. Keyboard: Tab order is file input → camera input → three samples → links, each with a 3 px accent `:focus-visible` outline; Space on a focused sample runs it. Reduced motion: the result still scrolls into view (instant). `impeccable detect --json web/index.html` → the same single `flat-type-hierarchy` warning as round 1, a false positive (sizes live in `src/style.css`).

## Round-1 defects re-tested

| Round 1 | Status | Evidence this round |
|---|---|---|
| D1 Safari ICC drift | **Fixed** (current Safari engine) | WebKit 13.14 / 2.88 / 3.91, thresholds 24 / 42 / 30, 0 lossless mismatches on 57 images, live + local. Still present on the < 16.4 fallback path → D12 |
| D2 12–24 MP freeze, 453 MB, 24 MP canvases | **Fixed** | S5 row: gaps ≤ 264 ms visible window, heap 4–13 MB, canvases ≤ 2 MP, progress stages, 31.4 MP refused |
| D3 wrong file: generic text, stale result | **Fixed** | S6 row: six fixtures, name + reason + formats, `hidden=true`, both engines |
| D4 no definition / references / warnings | **Fixed** | S7 row. Residual presentation issues → D14, D15 |
| D5 no download / copy | **Fixed** | S9 row: 12 downloads at 0 px diff, 3 clipboard lines exact |
| D6 phone: number at the fold, no scroll | **Fixed** | percent y = 19–90 px, `results top 0` at 360/390/430, both engines; camera input too. Side effect → D16 |
| D7 Lighthouse 0.61–0.97, no progress text | **Fixed** | 1.00 ×3, TBT ≤ 30 ms; download progress in 1 MB steps. Slow 4G still 19 s → D18 |
| D8 un-tapped sample fails offline | **Fixed** (Chromium) | three samples + upload offline with zero requests; WebKit unprovable under Playwright (D13) |
| D9 tall image 6,442 px tall | **Fixed** | `tall-100x2000.png` renders 324 × 465 CSS px at 390 (page 3,172 px, was 14,437); `wide-2000x100.png` 324 × 18; `one-pixel.png` 324 × 324 with the threshold-0 warning (`…shots/phone-390-tall.jpg`) |
| D10 light link contrast 4.07:1 | **Fixed** | links `#0f6e3b` on white 6.34:1, on `#f4f7f4` 5.87:1; lede 5.65:1, hint/status 6.1:1, tile labels 5.23:1 at 12 px; the 80 px percent 4.4:1 (large text, passes AA); dark theme 6.7–10.5:1 (`extra.json` `themes`) |
| D11 README contradictions | **Fixed** | `README.md:72` lists the browser formats, `web/README.md:7,9,42` denominator / formats / 60-image corpus / re-cropped cells, `Results/README.md` note |

## Defects

### D12 — On Safari before 16.4 (no `OffscreenCanvas` in workers) the page-side fallback skips the colour-profile strip, the size guard and the format check, and paints full-size canvases

Severity: **minor** (Safari 16.4 shipped March 2023 and is the floor for `OffscreenCanvas` in workers; iPhones on iOS 15–16.3 are a small minority in 2026, but on them the S3 bar fails by exactly round 1's margin, and a 24 MP photo is decoded on the main thread again)

Steps to reproduce: serve the build with the worker script prefixed by `self.OffscreenCanvas = undefined;` (`evidence/microtubules-r2-extra.cjs` `fallback` does this with `context.route`), open in WebKit, choose `fullfield/Plate2_45_nocodazole45uM.png`, then `edge/huge-12mp-4000x3000.jpg`, then `edge/truncated.png`.

Expected / Actual: 2.88 % threshold 42; display canvases ≤ 2 MP; the same refusal text as the worker path. Actual (WebKit): **3.85 % threshold 45** and `Plate1_W1_untreated.png` **13.47 % threshold 30** (the ICC-tagged PNGs are decoded with the profile applied because the raw blob goes to `createImageBitmap` on the page); the 12 MP JPEG paints **4000 × 3000** `#input-canvas` and `#overlay-canvas` (12 MP each, 95 MB page heap in Chromium's copy of the same run); `truncated.png` → "Could not analyse truncated.png: Cannot decode the data in the argument to createImageBitmap" (no format list; Chromium: "…The source image could not be decoded."). Numbers on untagged files are right (24.83, 13.14 for the gAMA-only cells, 23.98 EXIF), downloads work (page-side encode).

Evidence: `extra.txt` `fallback` rows for `webkit` and `chromium`.

Likely cause: `web/src/main.ts:117-130` `decodeOnPage(blob)` passes the untouched blob (no `stripColorMetadata`); `main.ts:198-213` sets `pageDecodes = true` after the first `no-offscreen` error, and from then on skips the worker's `sniffFormat` / `readDimensions` / `MAX_MEGAPIXELS` pre-checks entirely (`if (!pageDecodes)`), so the size limit is only enforced in `worker.ts:264` after the page has already decoded the full image; `main.ts:143-150` `paintPixels` paints at native size with no `MAX_DISPLAY_PIXELS` cap.

Suggested fix: in `run()` always read the bytes on the page and run `sniffFormat` + `readDimensions` + the megapixel check (import them from `decode.ts`, reuse `describeFormat`/`tooLarge` by moving them into `decode.ts`) before either path; call `stripColorMetadata` before `decodeOnPage`; in the fallback paint through a scaled `drawImage` onto ≤ 2 MP canvases (keep the full `overlayRGBA` only for the download). Extend `browser-check.cjs` with the routed-worker trick so this path is tested in CI in both engines.

### D13 — A decode failure that is not a format problem is reported as "looks damaged or truncated"

Severity: **minor**

Steps to reproduce: any `createImageBitmap` failure that is not caused by the bytes; the reproducible case here is WebKit under Playwright's offline emulation (blob loads fail with "The I/O read operation failed"): tap "Untreated" → "P1_W1_C1 looks damaged or truncated and could not be read as an image. This tool reads PNG, JPEG, WebP, BMP and GIF; convert TIFF or HEIC to PNG first."

Expected / Actual: a message that says what actually happened ("P1_W1_C1 could not be decoded: The I/O read operation failed. Reload the page and try again.") so the user does not go looking for a corrupt file. Actual: the sample cell, which is fine, is called damaged.

Evidence: `extra.txt` `offline.webkit`.

Likely cause: `web/src/worker.ts:190-196` `decodeBitmap` catches every error and rewrites it as `describeFormat("png", …)`.

Suggested fix: keep the "damaged or truncated" wording only when the bytes sniff as a supported format and the file is small/complete-looking; otherwise append the browser's own message and a "reload and try again" hint.

### D14 — A result the page itself calls "not a measurement" is still typeset as the hero number, and the Copy line carries no flag

Severity: **minor** (S7 bar met: the warning is visible; this is about what a stranger takes away)

Steps to reproduce: choose `edge/cell-grayscale.png` (or `fullfield/Plate1_W1_green_channel_camera.jpeg`, `edge/all-green.png`); read the card; click "Copy result".

Expected / Actual: the number visibly demoted (muted colour, smaller, or crossed) with the warning as the headline, and the copied line marked ("cell-grayscale: 0.00% (threshold 24, 0/4466 px) — not a measurement: channels identical"). Actual: an amber box, then a full-size **green** "0.00 %" with "of the image is microtubule" and the definition text beneath, exactly like a valid result (`…shots/phone390-dark-warning.jpg`, `desktop-dark-warning.jpg`); the clipboard/download line is `cell-grayscale: 0.00% (threshold 24, 0/4466 px)` with nothing to say it is void (`interpret.ts:55` `formatResultLine` ignores the warnings).

Likely cause: `web/index.html:49-58` and `src/style.css:273` style `.percent` unconditionally; `main.ts:158-166` only toggles `#warnings`.

Suggested fix: add `results.classList.toggle("warned", notes.length > 0)` and style `.warned .percent { color: var(--muted) }` (plus "not a measurement" as the readout label); append ` — not a measurement (<first warning, short>)` to `formatResultLine` when warnings exist; `tests/interpret.test.ts` gains the two cases.

### D15 — The "Nocodazole 25 µM" sample scores 34.71 %, above "Untreated" (24.83 %) and above the untreated reference, and the reference block only lists nocodazole 45 µM

Severity: **minor** (trust/copy)

Steps to reproduce: tap "Nocodazole 25 µM", read "Is that high or low?".

Expected / Actual: a stranger expects the drug that depolymerises microtubules to give the lowest number; the page shows the treated sample highest with no comment, and the reference table has no 25 µM row, so nothing on the page reconciles 34.71 % with "nocodazole 45 µM 17.2 ± 2.6 %". "Taxol control" is also a confusing label (taxol is a treatment, not a control).

Evidence: live sample readouts (S2 row); `web/index.html:41-43, 92-99`.

Likely cause: the three samples were chosen for pixel-exact recovery (T1.4), not to illustrate the reference values; the labels come from `SAMPLE_LABELS` in `main.ts:23-27`.

Suggested fix: one sentence in the reference block ("Single cells vary a lot (SD up to 9.5 points); the 25 µM sample above is one cell from a different dose than the 45 µM reference"), label the buttons with the CSV row values too ("Nocodazole 25 µM · 34.7 %"), and rename "Taxol control" to "Taxol 10 µM" or whatever the metadata says (`metadata.csv`).

### D16 — On a phone the tap scrolls the controls and the "Done" line out of view and the pictures are below the fold

Severity: **minor** (S2/S8 bar met: the number is visible; this is the peak-end of the interaction)

Steps to reproduce: at 390 × 664 tap a sample; look for the status line, the next sample button, and the overlay.

Expected / Actual: number, a glimpse of the overlay, and a way to run the next sample without hunting. Actual: `scrollY` 508–531 so the sample row and the "Done: …" status are above the viewport; the card shows number → definition → four tiles → disclosure → three export buttons; the input picture begins at ≈ 520 CSS px and the overlay (the thing that proves the number) starts at ≈ 900 px, two screens down (`…shots/phone390-light-after-sample.jpg`). To try the next sample the user scrolls back up ~530 px.

Likely cause: `web/index.html:49-84` orders readout → actions → panels; `main.ts:173-183` `revealResults` uses `block: "start"`.

Suggested fix: on narrow screens move `.panels` directly under the tiles and the `.actions` row after the pictures (CSS `order` in the ≤ 520 px media query, or swap the markup), and either keep the sample row visible (`position: sticky` on `.samples` at phone widths) or repeat a compact "Try another sample" row at the bottom of the card.

### D17 — Copy nits in the refusal and reference text

Severity: **minor**

Steps to reproduce: choose `edge/cell.tiff`; read the sample-row scroller at 390 px; read the lede at 390 px.

Expected / Actual: "cell.tiff is a TIFF, which browsers cannot read and could not be read as an image" says "read" three times and is wrong for Safari (which can decode TIFF; the page refuses it by design). The sample scroller shows "Untreated | Nocodazole 25 µM | Ta" with the scrollbar hidden and no fade, so the third sample is a truncated word (`…shots/phone390-dark-idle.jpg`). The lede is four lines at 390 px (the fix note says two).

Suggested fix: "cell.tiff is a TIFF. This tool reads PNG, JPEG, WebP, BMP and GIF; convert TIFF or HEIC to PNG first." (drop the "could not be read" clause for the format-known cases); add a right-edge fade (`mask-image: linear-gradient(to right, #000 85%, transparent)`) or size the three buttons to fit; cut the lede to "Pick a fluorescent cell image (green microtubules, blue nucleus) and get the share of the picture that is microtubule. Nothing is uploaded." on phones.

### D18 — Ready takes 19 s on Slow 4G (11 MB `opencv.js`)

Severity: **minor** (S1 bar "Ready within 10 s on 4G" holds on Chrome's Fast 4G preset at 8.3 s; Slow 4G is 19.0 s; progress text is now shown throughout)

Steps to reproduce: Playwright CDP `emulateNetworkConditions` 1.6 Mbps / 150 ms + 4× CPU, iPhone 13 profile, fresh context, time to "Ready".

Expected / Actual: ≤ 10 s. Actual: 9 Mbps 4.5 s, 4 Mbps 8.3 s, 1.6 Mbps 19.0 s; `content-length` 10,964,323 (3.39 MB brotli on the wire).

Likely cause: the official OpenCV.js build ships every module; this page uses `threshold`, `morphologyEx`, `getStructuringElement`, `countNonZero`, `absdiff`, `Mat`.

Suggested fix: a custom OpenCV.js build with only `core` + `imgproc` (`opencv/platforms/js/build_js.py --build_wasm` with a trimmed `opencv_js.config.py`) is ~2–3 MB and would put Slow 4G under 10 s; keep `public/opencv.js` self-hosted and re-run `npm run test:browser` in both engines (the numbers must not move).

## Design critique (impeccable `critique`, run in this context)

⚠️ DEGRADED: single-context (this audit agent has no sub-agent tool; Assessment A was done on the live page in real Chrome at 1280 px and on the Playwright captures at 390 px in both themes before the detector ran; Assessment B = `impeccable detect --json web/index.html`). Mode: **Operate** (a measuring tool).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Download percentage, four named stages, busy dimming, "Done: … in 1.1 s"; the only gap is that the status line scrolls off screen on phones (D16) |
| 2 | Match system / real world | 3 | Definition, tiles, references are right; the treated sample scoring highest with no comment (D15) and "Taxol control" break the mental model |
| 3 | User control and freedom | 3 | Any image re-runnable, inputs locked while busy; still no cancel and no way back to the samples on a phone without scrolling |
| 4 | Consistency and standards | 3 | One card language, one accent; the refusal sentences share a template; "Ta" cut-off in the scroller (D17) |
| 5 | Error prevention | 4 | Concrete `accept`, magic-byte sniffing, header-level 30 MP refusal, warnings on every degenerate input |
| 6 | Recognition rather than recall | 3 | Reference values and explanations are on the page; the disclosure is folded on phones, so the tile meanings need a tap |
| 7 | Flexibility and efficiency | 2 | Keyboard works (Tab + Space); no drag-and-drop, paste, batch or shareable URL |
| 8 | Aesthetic and minimalist design | 3 | Clean in both themes, no dead tiles; the export row sits between the number and the pictures on phones, and a void result is styled like a good one (D14) |
| 9 | Error recovery | 4 | Every wrong file is named, explained and cleared; the old result never lingers |
| 10 | Help and documentation | 3 | "What these numbers mean", "Is that high or low?", six-step method; nothing yet on what to do about a warned result |
| **Total** | | **32/40** | solid |

Design-specificity verdict: authored for this instrument, not a template: the green-for-microtubule accent, the giant readout with monospace tiles, the input/overlay pair with the nucleus hole, the amber "not a measurement" band, the Python-exactness promise in the footer. The step from 22/40 to 32/40 is real (status, prevention, recovery went from 1–2 to 4). Deterministic scan: 1 finding (`flat-type-hierarchy`), false positive, unchanged. No overlay injected (static page; the detector ran on the file).

What's working: the busy state is honest and the stages read like a lab notebook; the refusals are specific enough to act on; the amber warnings fire on exactly the right inputs; the downloads are the real artefacts from the paper, to the pixel.

Priority issues: **[P2]** phone order and sticky samples (D16) → `/impeccable adapt`; **[P2]** demote a warned number and flag the copied line (D14) → `/impeccable clarify`; **[P2]** reconcile the sample labels with the reference table (D15) → `/impeccable clarify`; **[P3]** refusal and scroller copy (D17) → `/impeccable clarify`; **[P3]** trimmed OpenCV build (D18) → `/impeccable optimize`.

Persona red flags. *Jordan (first-year, phone):* taps "Nocodazole 25 µM", sees 34.71 % in green, scrolls two screens to find the overlay, then reads that nocodazole cells should be at 17 % and does not know what to believe (D15, D16). *Alex (lab-mate, Mac + Safari 26):* drops the Preview-exported PNG and gets the Python number (fixed); on the lab's old iPad (iPadOS 16.1) the same file is 0.97 points off with no hint (D12). *Sam (screen reader / keyboard):* focus lands on the result card, warnings are `role="alert"`, the outline is visible; the copied line for a grayscale image sounds like a valid measurement (D14).

Minor observations: "Nucleus removed 8.6 %" reads as a percentage of what? (it is of the image; the disclosure says so); the "TIME" tile is gone (good); `theme-color` is the dark green in both themes; the footer still packs four facts into one sentence.

Questions to consider: what if the overlay were the hero on phones and the number its caption? What if each sample button showed its number, so the page teaches the range before the first tap? What if a warned result copied as "not a measurement" by default?

Questions skipped: the fixing agent takes the priority list above; no user is present in this run.

## Known limitations that are NOT defects

- Real macOS Safari and iOS Safari were not driven: `safaridriver` needs "Allow Remote Automation" enabled once in Safari's Develop settings (Kalp: Safari → Settings → Advanced → "Show features for web developers", then Develop → Allow Remote Automation), and no iOS Simulator is installed. WebKit 2359 on macOS decodes with the same ImageIO/CoreGraphics path that produced round 1's ICC defect, and now matches Python on all 57 images, so the engine evidence is strong; a one-minute confirmation by Kalp on his iPhone (tap a sample → 24.83; "Take a photo" of a printed cell → upright result scrolled into view) closes S3/S8 for real devices.
- Offline in Safari: Playwright's WebKit offline emulation fails every blob decode ("The I/O read operation failed"), so the offline story is proven only in Chromium. On a real iPhone: load the page, switch to Airplane mode, tap a sample.
- JPEG numbers differ by decoder (WebKit −0.29…+0.23 on the same cell) — within the ≤ 1.0 bar for lossy files.
- `cell.tiff` is refused in every browser by design (magic bytes), although Safari could decode it; the Python script reads TIFF, the READMEs say so.
- The three re-cropped cells (`P3_W1_C2`, `P3_W1_C3`, `P3_W3_C3`) legitimately differ from `Results/quantification_results.csv`; truth is the pipeline on the committed file.
- Real Chrome in a background tab runs a 24 MP photo in ~6 s instead of ~2 s (Chrome de-prioritises hidden tabs); nothing to fix.
- The harness sends real `image_analyzed` events to PostHog (source `upload` for the corpus); they are cheap and carry no image data, but a dashboard reader should know the 2026-09-18/19 spikes are test runs.
- Static Vercel Hobby, $0, no server code: confirmed (`vercel.json` only rewrites `/ingest`).

## How a fixing agent should verify the fix

```bash
cd ~/projects/microtubules
.venv/bin/python tests/fixtures/make_fixtures.py --check            # "all match"
cd web && npm ci && npx vitest run --pool=forks --maxWorkers=1       # 93/93 (+ new interpret cases for D14)
npm run build && npm run test:browser                                # PASS in chromium + webkit (corpus, files, huge, downloads, phone, bands)
BASE=https://microtubules.kalpkan.com/ npm run test:browser          # same against the live site after the deploy
# Round-2 extras (D12, D13, D16, D18 and the themes): serve dist + fixtures, then run the script
SITE=/tmp/mt-site && rm -rf $SITE && mkdir -p $SITE && cp -R dist/. $SITE && ln -s ~/projects/microtubules/tests/fixtures $SITE/fixtures
(cd $SITE && python3 -m http.server 8792 &)                          # kill it when done: pkill -f "http.server 8792"
NODE_PATH=$PWD/node_modules FIX2=<dir with over-limit-5600x5600.{png,jpg}, at-limit-6000x5000.jpg, cell.gif> \
  node ~/projects/portfolio/docs/reports/evidence/microtubules-r2-extra.cjs
#   fallback (D12): webkit rows for Plate2_45 must read 2.88 / thr 42 and Plate1_W1 13.14 / 24; huge-12mp canvases <= 2 MP; truncated.png message contains the format list
#   offline: chromium three samples + upload with requestsWhileOffline []
#   throttle (D18): readyMs <= 10000 on "Fast 4G"; aim for the same on "Slow 4G" after a trimmed OpenCV build
#   layout / camera: resultsTop 0, percent visible; after D16, the overlay canvas top must be < innerHeight at 390 x 664 after a sample tap
# D14: after edge/cell-grayscale.png, #percent must carry a muted style (e.g. .results.warned) and the clipboard line must contain "not a measurement"
# D15: the reference block must mention the 25 µM sample / single-cell spread; sample buttons show their values
# D17: cell.tiff message has no "could not be read" clause; sample scroller has a fade or fits at 390 px
for i in 1 2 3; do npx lighthouse https://microtubules.kalpkan.com --only-categories=performance --chrome-flags="--headless=new" --output=json --quiet --output-path=/tmp/lh$i.json; jq .categories.performance.score /tmp/lh$i.json; done   # all >= 0.90
curl -sf https://microtubules.kalpkan.com/health.json                 # {"ok":true,"service":"microtubules"}
```

---

# Round 1 (2026-09-18) report and FIX round 1 notes, kept for history

## microtubules functional audit — 2026-09-18 (TEST + CRITIQUE round 1)

Live URL https://microtubules.kalpkan.com · Repo `KalpKan/Microtubule-Quantification` (local `~/projects/microtubules`, web app in `web/`, audited at commit `e56190d`, clean, = `origin/main`; the live bundle `assets/index-CtfItMnP.js` is the same source built with the Vercel env) · Vercel project `microtubules` (Root Directory `web`, framework Vite, static) · Database none · Health route `https://microtubules.kalpkan.com/health.json` → `{"ok":true,"service":"microtubules"}`

Spec and bars: `docs/reports/microtubules-spec.md` (10 stories, §3 bar table, §6 six known gaps). Method: real Chrome 151 (claude-in-chrome, macOS, dark scheme) on the live URL and on a local build of `e56190d` served with the fixture corpus (`python3 -m http.server 8792`, since the live page cannot fetch local fixtures); Playwright Chromium 1.63 headless on the live URL (1280 × 900 dark/light; 360/390/430 px phone widths; iPhone 13 profile 390 × 664 with 4× CPU throttle and CDP network throttling); Playwright WebKit 2359 (the Safari engine; macOS Safari itself is not automatable without Kalp enabling Remote Automation, and no iOS Simulator is installed) on the same local build for the full corpus; Lighthouse 12.8.2 mobile ×3; PostHog events API for the analytics payload; Python 3.14 venv (`opencv-python-headless` 5.0.0) for the ground truth and the overlay/mask diff. Every corpus row (Chromium and WebKit), the live-site JSON, the Playwright scripts, Lighthouse summaries and screenshots are in `docs/reports/evidence/microtubules-r1-*`.

### r1: Verdict: PARTIALLY WORKING

The measurement is right and fast: in Chrome every one of the 60 labelled images gives the Python number to 2 decimals with the identical Otsu threshold and pixel counts (max |diff| 0.005, i.e. display rounding), the three samples print exactly 24.83 / 34.71 / 21.18 with thresholds 36 / 29 / 62, the overlay canvas is pixel-identical to the Python `Results/*_overlay.png`, nothing leaves the device except the PostHog beacon, and the page works offline. But a stranger would not trust or enjoy it yet: in Safari's engine three of Kalp's own whole-well PNGs (Mac-made, with an embedded `kCGColorSpaceGenericRGB` ICC profile) give a different number and threshold (up to +0.97 points); a 24 MP phone photo freezes the tab for 5.5 s at 453 MB heap with two 24 MP canvases; a wrong file leaves the previous result on screen under a generic "could not be decoded" line; the big number comes with no definition, reference values or warnings (a grayscale image confidently reports "0.00 % of the image is microtubule"); there is no download or copy; and on a phone the number sits at the bottom edge of the viewport with the overlay entirely below the fold. None of the six gaps in spec §6 has been fixed (no commits since `e56190d`), and this round adds the Safari colour-management defect (D1) and four minor ones.

### r1: User stories tested

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

### r1: Defects

#### D1 (r1) — In Safari's engine, PNGs with an embedded ICC profile give a different number and Otsu threshold than the Python pipeline

Severity: **major** (fails the S3 "lossless formats match exactly … in macOS Safari and iOS Safari" bar; the drift is 0.33–0.97 points on Kalp's own three whole-well images, so a fourth image can cross 1.0)

Steps to reproduce: in Playwright WebKit (or Safari) open the local build, choose `tests/fixtures/fullfield/Plate2_45_nocodazole45uM.png`.

Expected / Actual: `2.88 %`, threshold 42 (Python, Chrome). Actual: `3.85 %`, threshold 45. Same for `Plate1_W1_untreated.png` 13.47 vs 13.1362 (threshold 30 vs 24) and `Plate3_W2_New_nocodazole25uM.png` 4.77 vs 3.9149 (34 vs 30). The 36 ImageJ cells (gAMA + cHRM chunks only) and every untagged PNG match exactly in WebKit.

Evidence: `docs/reports/evidence/microtubules-r1-corpus-webkit-2026-09-18.json` vs `…corpus-chromium…`; the three files carry an `iCCP` chunk named `kCGColorSpaceGenericRGB` (Apple Generic RGB, gamma 1.8; `python` chunk walk in this audit). Verified fix: rewriting `Plate2` with the `iCCP` chunk removed gives `2.88 %` / 42 in WebKit (and unchanged in Chromium).

Likely cause: `web/src/main.ts:44` `createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" })`. WebKit ignores `colorSpaceConversion: "none"` and converts the pixels from the embedded profile to sRGB before `getImageData`, which raises the green channel and moves the Otsu threshold. Python's `cv2.imread` ignores ICC profiles, so Chrome (which honours "none") matches and Safari does not. Any Mac-exported PNG (Preview, ImageJ on macOS, screenshots) carries such a profile, so this is the common case for a Mac user, not an edge case.

Suggested fix: before `createImageBitmap`, for PNG blobs walk the chunks and drop `iCCP`, `gAMA`, `cHRM` and `sRGB` (a few lines over the `ArrayBuffer`; no decoding needed) and feed the rewritten bytes; for JPEG strip the `APP2` ICC segment the same way. Add the three whole-well files to a WebKit run in CI (`npx playwright install webkit`, or the `browser-corpus.js` harness) so the bar "identical threshold in Safari" is tested, not assumed.

#### D2 (r1) — A 12–24 MP photo freezes the page for 2–5.5 s, uses 450 MB and paints two 24 MP canvases

Severity: **major** (S5 bar: main thread never blocked > 1 s, heap < 300 MB, display canvases ≤ 2 MP, progress shown; likely a tab crash on iOS where a single canvas is limited to ~16.7 MP and total canvas memory to ~224–384 MB)

Steps to reproduce: open the site in Chrome, choose `tests/fixtures/edge/generated-large/huge-24mp-6000x4000.jpg` (or any 24 MP phone photo). Try to click a sample button while it runs.

Expected / Actual: a busy/progress state, buttons still responsive, the result within 15 s on a laptop, heap < 300 MB, display canvases capped at 2 MP. Actual (real Chrome 151, `e56190d` local build): 24 MP JPEG: status stays "Analysing huge-24mp-6000x4000.jpg..." with the main thread blocked for **5,500 ms** (max gap between 16 ms timer ticks), `performance.memory.usedJSHeapSize` **453 MB**, `#input-canvas` and `#overlay-canvas` both **6000 × 4000**; 12 MP JPEG: blocked **2,126 ms**, 259 MB, 4000 × 3000 canvases. The number is correct (23.93 / 23.67).

Evidence: real-Chrome measurements in this report's S5 row; headless Chromium rows `edge/huge-*` and `edge/generated-large/*` in `microtubules-r1-corpus-chromium-2026-09-18.json` (`maxLongTaskMs` 619 / 597 / 1264, `heapMB` 223 / 223 / 418, `inputCanvas [6000,4000]`).

Likely cause: `web/src/main.ts:69-84` `run()` decodes to a full-size `ImageData`, calls the synchronous `analyze()` (`src/pipeline.ts:78`, which copies the RGBA into a wasm `Mat`, then copies the mask and a second full RGBA overlay back out), then `paint()` (`main.ts:58-66`) creates two canvases at the image's native size. Everything runs on the main thread; four full-resolution RGBA buffers (image, wasm copy, overlay, canvas backing ×2) are alive at once.

Suggested fix: move decode + `analyze` into a Web Worker (`createImageBitmap` works in workers; OpenCV.js loads with `importScripts`) and post back `{percent, threshold, counts, mask}` so the page never blocks; paint the display canvases at ≤ 2 MP (`drawImage` scaled, keep the full-resolution mask only for download); show a determinate status ("Decoding 24 MP… / Thresholding… / Painting…") and disable the inputs while busy; refuse inputs above a stated limit (e.g. "Images above 30 megapixels are refused; resize to 4000 px wide first") with the limit in the message. Free the `ImageData` after analysis.

#### D3 (r1) — A wrong file shows a generic "could not be decoded" line while the previous image's result stays on screen

Severity: **major** (S6 bar: name the file, say it could not be read as an image, list supported formats, hide/mark the old result)

Steps to reproduce: tap "Untreated", then "Choose an image" and pick `tests/fixtures/edge/not-an-image.txt` (or `renamed-text.png`, `truncated.png`, `document.pdf`, `empty.png`, `cell.tiff`).

Expected / Actual: "`not-an-image.txt` could not be read as an image. Supported: PNG, JPEG, WebP, BMP, GIF (convert TIFF/HEIC to PNG first)." and the old result hidden or greyed. Actual: red status `Could not analyse that image: The source image could not be decoded.` (WebKit wording differs: `Cannot decode the data in the argument to createImageBitmap`); the Result card still shows `21.18 %`, `68 × 47 px`, threshold `62`, both canvases from the previous image; `console.error` prints the raw `InvalidStateError`.

Evidence: `docs/reports/evidence/microtubules-r1-desktop-after-bad-file-2026-09-18.jpg`; `afterBadFile` in `microtubules-r1-live-playwright-2026-09-18.json` (`resultsHidden: false, percent: "21.18"`); the six non-image rows at the end of both corpus JSONs.

Likely cause: `web/src/main.ts:97-100` catch block prints `err.message` verbatim and never touches `#results`; `decode()` (`main.ts:43`) throws the browser's `InvalidStateError` with no file name or format hint; `index.html:32,36` `accept="image/*"` lets the picker offer TIFF/HEIC/PDF-as-image. The root README (line 72) still advertises "Formats: PNG, JPG, or TIFF".

Suggested fix: in `run()` set `results.hidden = true` (or add a `stale` class that greys the card) before decoding; on a decode failure build the message from the file name, size and type: "`<name>` (<type or extension>) could not be read as an image. This tool reads PNG, JPEG, WebP, BMP and GIF; convert TIFF or HEIC to PNG first."; set `accept="image/png,image/jpeg,image/webp,image/bmp,image/gif"`; fix the README format line.

#### D4 (r1) — The number is not explained and degenerate results are shown as valid measurements

Severity: **major** (S7 bar; the page's own promise is "the percentage of the image occupied by microtubules", which a first-year student cannot interpret without the denominator, the reference range and a warning when the input is not a two-colour fluorescence image)

Steps to reproduce: tap "Untreated"; read what surrounds `24.83 %`. Then choose `tests/fixtures/edge/cell-grayscale.png` (or `fullfield/Plate1_W1_green_channel_camera.jpeg`, `all-green.png`, `one-pixel.png`, `all-black.png`).

Expected / Actual: next to the result a one-sentence definition ("share of all pixels in the image counted as microtubule after the nucleus is removed; background counts in the denominator, so tighter crops give higher numbers"), the paper's reference values (untreated 27.9 ± 4.6 %, nocodazole 45 µM 17.2 ± 2.6 %, taxol 30.7 ± 9.5 %) with the "same microscope, same exposure, compare within one experiment" caveat, one-line explanations of "Otsu threshold" and the pixel counts, and a visible warning for 0 %, 100 %, threshold 0, nucleus > 90 % or identical green/blue channels. Actual: label "of the image is microtubule", four bare stat tiles (`IMAGE`, `OTSU THRESHOLD`, `MICROTUBULE PIXELS`, `TIME`), the six-step algorithm list further down. `cell-grayscale.png` → `0.00 %` threshold 24 with no warning; camera JPEG → `0.00 %`; `all-green.png` and `one-pixel.png` → `100.00 %` threshold `0`; `all-black.png` → `0.00 %` threshold `0`; `all-blue-nucleus-only.png` → `0.00 %`. `TIME 0 ms` is shown for every small cell.

Evidence: `microtubules-r1-desktop-dark-full-2026-09-18.jpg`; corpus rows `edge/cell-grayscale.png`, `edge/all-*.png`, `edge/one-pixel.png`, `fullfield/Plate1_W1_green_channel_camera.jpeg` (all `status: Done`, no warning text).

Likely cause: `web/index.html:49-62` has only the readout markup; `main.ts:85-90` writes the numbers and nothing else; `pipeline.ts` returns `threshold`, `greenPixels`, `totalPixels` but not the nucleus-pixel count or a channel-identity flag, so the page has nothing to warn with.

Suggested fix: extend `AnalysisResult` with `nucleusPixels` and `channelsIdentical` (compare the G and B planes once, or `countNonZero(absdiff)`), add a `warnings: string[]` builder in `main.ts` (`percent === 0`, `=== 100`, `threshold === 0`, `nucleusPixels / totalPixels > 0.9`, `channelsIdentical`) rendered as an amber callout above the number; add a `<p class="definition">` under the label and a "What the number means" block with the three reference values and the caveats, plus `title`/`<abbr>` or a short line under each stat tile; hide the `TIME` tile (or show it only above 100 ms).

#### D5 (r1) — No way to keep the result: no download of overlay/mask, no copy

Severity: **major** (S9 bar)

Steps to reproduce: tap any sample; look for a download or copy control.

Expected / Actual: "Download overlay", "Download mask" (PNG) and "Copy result" buttons. Actual: none; the only option is a screenshot of the canvas.

Evidence: `web/index.html` (no such controls); this audit's diff: the live `#overlay-canvas.toDataURL('image/png')` for P1_W1_C1, P3_W2_C3 and P1_W3_C1 differs from `Results/<name>_overlay.png` by **0 pixels**, and the mask reconstructed from its pure-green pixels differs from `Results/<name>_mask.png` by **0 pixels**, so a download would already be pixel-identical.

Likely cause: feature never built; `analyze()` (`pipeline.ts:78`) already returns `mask` (one byte per pixel) and `overlay`, but `main.ts:85` discards `result.mask`.

Suggested fix: keep the last `AnalysisResult` + name in `main.ts`; add three buttons in the results card: overlay → `overlayCanvas.toBlob('image/png')` (from the full-resolution overlay, not the ≤ 2 MP display canvas once D2 lands), mask → paint `mask` into an offscreen `CV_8UC1`-style grayscale canvas (`putImageData` with R=G=B=mask, A=255) and `toBlob`, copy → `navigator.clipboard.writeText(`${name}: ${percent.toFixed(2)}% (threshold ${threshold}, ${green}/${total} px)`)` with a "Copied" confirmation. File names `<name>_overlay.png` / `<name>_mask.png` to mirror `Results/`. Add a vitest that the mask PNG bytes decode to `Results/P1_W1_C1_mask.png`.

#### D6 (r1) — On a phone the result is not brought into view: the number sits at the bottom edge and the overlay is below the fold

Severity: **major** (S2/S8 bar: percentage visible without scrolling after a tap at 390 px; result scrolled into view after a photo)

Steps to reproduce: at 390 px width (real Chrome via the `phone.html` iframe harness, or an iPhone) tap "Nocodazole 25 µM".

Expected / Actual: the page scrolls so the number and the overlay are visible, or they are above the fold. Actual: `window.scrollY` stays 0; the only visible change is the status line; the `34.71 %` glyphs occupy y = 600–665 px (real Chrome, 390 × 844), i.e. exactly the bottom edge of an iPhone 13/14 Safari viewport (664 px with toolbars) and below the fold on an iPhone SE / small Android (≈ 548–620 px); the two image panels start at ≈ 830 px and are never visible without scrolling. With the shorter one-line status ("Done: P1_W1_C1.PNG…") the number is at 576–641.

Evidence: `docs/reports/evidence/microtubules-r1-chrome-phone390-after-sample-2026-09-18.jpg` (real Chrome, dark), `…iphone13-after-sample…` (Playwright iPhone 13 profile, light), `…phone-390-dark-after-sample…` (390 × 844); `phone390AfterTap` in `microtubules-r1-live-playwright-2026-09-18.json`.

Likely cause: `web/src/main.ts:91` `results.hidden = false` with no `scrollIntoView`; the masthead + controls card (`index.html:16-46`) take ~580 px at 390 px because the lede is five lines and the three sample buttons wrap to two rows.

Suggested fix: after `results.hidden = false` call `results.scrollIntoView({ behavior: "smooth", block: "start" })` when the results card's top is below `innerHeight * 0.5` (samples and uploads alike); shorten the lede to two lines on phones (move the OpenCV/Python sentence to the "How the number is computed" card) and make the sample row a single horizontal scroller so the number lands above the fold on an iPhone 13 without scrolling at all.

#### D7 (r1) — Lighthouse mobile performance is unstable (0.61–0.97) because the 11 MB `opencv.js` is fetched and parsed on the main thread at page load; Ready takes 20 s on Slow 4G with no progress indicator

Severity: **minor** (S1 bar ≥ 0.90 met in 1 of 3 runs; Ready ≤ 10 s holds at 4 Mbps "Fast 4G" (8.8 s) but not at 1.6 Mbps "Slow 4G" (19.9 s))

Steps to reproduce: `npx lighthouse https://microtubules.kalpkan.com --only-categories=performance --chrome-flags="--headless=new" --output=json` three times; and Playwright CDP `emulateNetworkConditions` 1.6 Mbps / 150 ms + 4× CPU, time to the "Ready" status.

Expected / Actual: ≥ 0.90 every run; Ready ≤ 10 s on 4G with a visible progress bar. Actual: 0.73 (LCP 18.7 s), 0.97 (LCP 1.5 s), 0.61 (LCP 18.8 s, TBT 520 ms); Lighthouse's `bootup-time` attributes 12–16 s (4× slowdown) of scripting to `/opencv.js`; Playwright with 4× CPU: long tasks at load 64/60/588/69/181 ms (largest 588 ms); Ready 19.9 s at 1.6 Mbps, 8.8 s at 4 Mbps, 4.9 s at 9 Mbps, 0.9 s unthrottled. During the download the status text is static ("Downloading OpenCV (about 11 MB, one time)...").

Evidence: `docs/reports/evidence/microtubules-r1-lighthouse-runs-2026-09-18.txt`; `readyMs` in `microtubules-r1-live-playwright-2026-09-18.json`; S1 row.

Likely cause: `web/src/main.ts:135` warms up OpenCV immediately at load; `opencv-loader.ts:35-40` injects `<script src="/opencv.js" async>` (the official build embeds the 8 MB wasm as base64 inside the JS, so the browser parses 11 MB of JS and base64-decodes the wasm on the main thread; `content-length: 10964323`, 3.39 MB brotli). Two of three Lighthouse runs attribute the LCP render delay to that work.

Suggested fix: load OpenCV inside the Web Worker from D2 (moves parse + instantiate off the main thread and fixes the TBT/LCP variance); serve the split build (`opencv.js` + `opencv_js.wasm`, streaming-compiled, ~8 MB and no base64) or at least `fetch()` it with a `ReadableStream` progress counter so the status reads "Downloading OpenCV 3.1 / 11 MB". Record three Lighthouse runs in `verification.md`, not one.

#### D8 (r1) — Offline, a sample that was not tapped before going offline fails with "Failed to fetch"

Severity: **minor** (S10 bar: "samples and uploads still work" offline; uploads do, samples only if cached)

Steps to reproduce: load the page, tap "Untreated", turn the network off (DevTools Offline), tap "Nocodazole 25 µM".

Expected / Actual: the sample analyses (24 KB of PNGs). Actual: red status `Could not load the sample: Failed to fetch`; "Untreated" still works because `/samples/P1_W1_C1.png` is in the HTTP cache (`max-age=86400`).

Evidence: `offlineSample` in `microtubules-r1-live-playwright-2026-09-18.json`.

Likely cause: `web/src/main.ts:106` fetches `/samples/<name>.png` on click; nothing prefetches or inlines them; the footer promises "works offline once loaded".

Suggested fix: prefetch the three sample blobs right after OpenCV is ready (`Promise.all(fetch(...))` into a `Map`), or import them as Vite assets (`?url` with `inline` for 14 KB total) so a tap never needs the network; optionally a service worker for the whole shell.

#### D9 (r1) — Extreme aspect ratios and tiny images render absurdly on a phone

Severity: **minor**

Steps to reproduce: at 390 px choose `tests/fixtures/edge/tall-100x2000.png`, then `one-pixel.png`.

Expected / Actual: panels constrained to the viewport (max-height), a 1 × 1 image shown small with a note. Actual: the 100 × 2000 overlay renders **324 × 6,442 px** (page height 14,437 px, two such panels); `one-pixel.png` is a 324 × 324 black square with `100.00 %` and threshold 0 (see D4).

Evidence: `docs/reports/evidence/microtubules-r1-iphone13-tall-image-2026-09-18.jpg`.

Likely cause: `web/src/style.css:203-210` `.panels canvas { width: 100%; height: auto }` with no `max-height`/`object-fit`.

Suggested fix: `max-height: 70vh; width: auto; max-width: 100%; object-fit: contain; margin: 0 auto` on the canvases, and `image-rendering: pixelated` only when the image is smaller than the box (already handled for < 400 px).

#### D10 (r1) — Light-mode link colour misses AA contrast

Severity: **minor**

Steps to reproduce: light theme, read the "Python pipeline" link in the lede and the footer links.

Expected / Actual: ≥ 4.5:1 for body-size text. Actual: `--accent #178a4c` on `--bg #f4f7f4` = **4.07:1**; on `--surface #fff` = 4.4:1 (the big percent is large text, so 4.4 passes there). Dark theme is fine (10.5:1).

Likely cause: `web/src/style.css:7,58` one accent token used for both fills and text.

Suggested fix: add `--accent-text: #0f6e3b` (≈ 5.6:1 on `#f4f7f4`) for links and the percent in light mode; keep `--accent` for button fills.

#### D11 (r1) — Docs contradict the tool: "percentage of each cell", "Formats: PNG, JPG, or TIFF", accuracy table covers 3 of 60 images, three CSV rows do not correspond to the committed crops

Severity: **minor** (spec §6 gap 6)

Steps to reproduce: `grep -n 'percentage of each cell\|TIFF' README.md`; read `web/README.md` "Accuracy".

Expected / Actual: README says the number is the share of the whole image (background in the denominator, nucleus zeroed), lists the formats the site actually reads (TIFF only in Safari), and the accuracy section points at `tests/fixtures/ground_truth.json` (60 images) and says that `P3_W1_C2`, `P3_W1_C3`, `P3_W3_C3` were re-cropped after `Results/quantification_results.csv` was produced. Actual: README.md:16 "percentage of each cell", README.md:72 "Formats: PNG, JPG, or TIFF"; `web/README.md:7-15` three-row table; no note on the re-cropped cells anywhere in the repo.

Likely cause: docs written at T1.4 before the corpus existed.

Suggested fix: three sentences in each README and a `Results/README.md` note; keep the three-sample table and add the 60-image summary line ("52 PNGs diff 0.0000 in vitest; JPEG/WebP/BMP/EXIF via `web/scripts/browser-corpus.js`").

### r1: Design critique (impeccable `critique`, run in this context)

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

### r1: Known limitations that are NOT defects

- iOS Safari and a real phone camera were not exercised (no device, no iOS Simulator on this Mac). WebKit 2359 stands in for Safari for the corpus (D1); the rear-camera claim rests on `capture="environment"`. Kalp can confirm both in one minute on his phone: tap "Take a photo", photograph a printed cell, check the number appears and is upright.
- `cell.tiff` decodes in Safari/WebKit (24.83 %) and not in Chrome/Firefox; the spec treats TIFF as unsupported, so the Chrome refusal is the expected path (D3 covers the message).
- JPEG numbers differ by decoder (WebKit 23.65–24.12 vs Python 23.89–23.94 on the same cell) by ≤ 0.29 points; the bar allows ≤ 1.0 for JPEG.
- The three re-cropped cells (`P3_W1_C2`, `P3_W1_C3`, `P3_W3_C3`) legitimately differ from `Results/quantification_results.csv`; ground truth is the pipeline on the committed file (spec §4). Nobody should "fix" the pipeline toward the CSV.
- Lighthouse's `bootup-time` of 12–16 s for `opencv.js` is at its 4× CPU slowdown; measured long tasks at load in Playwright at 4× are ≤ 588 ms (D7 is about variance and the missing progress, not a real 12 s freeze).
- Vercel Hobby, $0, no server-side code: confirmed (static `dist/`, only `/ingest` rewrites in `vercel.json`).

### r1: How a fixing agent should verify the fix

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

### r1: FIX round 1 (2026-09-19, FIX agent) — what changed, for the next TEST round

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

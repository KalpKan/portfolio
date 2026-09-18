# T1.4 Microtubule Quantifier in the Browser — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `https://microtubules.kalpkan.com`, a static Vite + TypeScript page that runs the repo's OpenCV microtubule pipeline in the browser (OpenCV.js, offline after load) on an uploaded or sample cell image and reports the same percentage the Python script does, within 1 percentage point.

**Architecture:** The Python pipeline (`microtubule_quantification.py::MicrotubuleQuantifier.process_image`) is, as actually executed, five OpenCV calls: green channel → Otsu threshold; blue channel → Otsu + ellipse-5 close x2 (nucleus mask); subtract nucleus; ellipse-3 open then close; `% = nonzero / total`. The blur/bilateral/background methods exist in the class but are never called by `process_image`, so the port reproduces the executed path exactly (that is the only way to match within 1 pp). `web/src/pipeline.ts` is a pure function over an OpenCV.js module and an RGBA buffer, used unchanged by both the page (`main.ts`) and the vitest suite (Node loads the same `web/public/opencv.js`; PNGs decoded with `pngjs`). Sample cells are recovered pixel-exact from the `Results/*_analysis.png` figures (their "Original Image" panel is a nearest-neighbour upscale, verified: intra-block variation 0, and identical to `*_overlay.png` outside the mask), because the raw crops are not in the repo and `~/Desktop/Organized Cropped Cells` does not exist.

**Tech Stack:** Vite 7 + TypeScript, OpenCV.js 4.x official build (`https://docs.opencv.org/4.x/opencv.js`, committed to `web/public/opencv.js`, ~10.5 MB, wasm embedded as base64 so it is one file), posthog-js, vitest + pngjs, Python 3.14 venv with `opencv-python-headless` for the reference numbers, Vercel Hobby (project `microtubules`, root `web/`), Cloudflare DNS-only CNAME.

**Spec:** `docs/hosting-plan.md` §7 row 6 and Appendix T1.4; task brief in the dispatch message (Definition of done, T1.4).

## Global Constraints

- Spend $0; no plan upgrades; no cards. Non-commercial.
- Never commit secrets; operator keys only via `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`.
- OpenCV.js is served from `web/public/opencv.js` in the repo, never a CDN.
- No network requests after load except PostHog analytics to `/ingest/*` (first-party proxy). The image never leaves the device.
- PostHog contract (hub `lib/posthog.ts`): `api_host: "/ingest"`, `ui_host: "https://us.posthog.com"`, `persistence: "memory"`, autocapture on, pageview on; custom events `sample_loaded` `{sample}` and `image_analyzed` `{percent, width, height, source}`; never the image.
- Vercel project `microtubules`, team `kks-projects-2edcb11a`, root directory `web`. Domain `microtubules.kalpkan.com` via the "Attach a domain to a Vercel project" runbook (DNS-only, target from `vercel domains verify`).
- README sections "How to run this / How to deploy this / Where the settings live" for a non-developer; `.env.example` names only.
- Commit messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Recover three sample cells and record the Python reference numbers

**Files:**
- Create: `web/scripts/extract_samples.py`, `web/scripts/reference.py`
- Create: `web/public/samples/P1_W1_C1.png`, `web/public/samples/P3_W2_C3.png`, `web/public/samples/P1_W3_C1.png`
- Create: `web/tests/expected.json`

**Interfaces:**
- Produces: `web/tests/expected.json` = `{"<name>": {"percent": <float>, "threshold": <int>, "width": <int>, "height": <int>, "green_pixels": <int>}}`, consumed by Task 3's vitest test and Task 5's README table.

- [ ] **Step 1: Write `extract_samples.py`** — locate the "1. Original Image" panel in `Results/<name>_analysis.png` (bounding box of non-white pixels below y=290 in the left third; height = `orig_h * panel_w / orig_w`), sample every block centre, assert intra-block variation is 0 and equality with `<name>_overlay.png` outside `<name>_mask.png`, write `web/public/samples/<name>.png`.
- [ ] **Step 2: Run it**: `.venv/bin/python web/scripts/extract_samples.py` → three PNGs, each assertion printed as OK.
- [ ] **Step 3: Write `reference.py`** — import `MicrotubuleQuantifier`, run the executed path (no matplotlib) on each sample, print and write `web/tests/expected.json`; also assert the percentage equals `Results/quantification_results.csv` to 6 decimals (proves the recovered pixels are the originals).
- [ ] **Step 4: Run it** and paste the output into `web/README.md` later (Task 5).
- [ ] **Step 5: Commit** `feat(web): recover 3 sample cells from the figures + Python reference numbers`.

### Task 2: `run_analysis.py` takes argv with defaults (tested)

**Files:**
- Modify: `run_analysis.py` (paths → `argparse` with the old paths as defaults, logic in `build_command(input_dir, output_dir, metadata)`)
- Create: `tests/test_run_analysis.py` (unittest, no third-party deps)

- [ ] **Step 1: Write the failing test**: `build_command("/in","/out","m.csv")` returns `[sys.executable, "microtubule_quantification.py", "--input", "/in", "--output", "/out", "--metadata", "m.csv"]`; `parse_args([])` yields the old defaults; `parse_args(["--input","x"])` overrides.
- [ ] **Step 2: Run** `.venv/bin/python -m unittest tests/test_run_analysis.py -v` → FAIL (ImportError).
- [ ] **Step 3: Implement** and re-run → PASS.
- [ ] **Step 4: Commit** `fix: run_analysis.py accepts --input/--output/--metadata instead of hardcoded Desktop paths`.

### Task 3: Vite app skeleton + pipeline port with a vitest accuracy test

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/vite.config.ts`, `web/index.html`, `web/src/pipeline.ts`, `web/src/opencv-loader.ts`, `web/tests/pipeline.test.ts`, `web/public/opencv.js`, `web/public/health.json`, `web/.gitignore`

**Interfaces:**
- Produces: `analyze(cv: OpenCV, rgba: Uint8ClampedArray, width: number, height: number): { percent: number; threshold: number; greenPixels: number; totalPixels: number; mask: Uint8Array; overlay: Uint8ClampedArray }` in `pipeline.ts` (pure; RGBA in, RGBA overlay out, all Mats deleted). `loadOpenCV(): Promise<OpenCV>` in `opencv-loader.ts` (browser: injects `<script src="/opencv.js">`, waits for `onRuntimeInitialized`; never `await cv` because the Emscripten thenable resolves to itself and loops).

- [ ] **Step 1: Scaffold** `npm create vite@latest web -- --template vanilla-ts`, add `vitest`, `pngjs`, `posthog-js`; copy `opencv.js` from `https://docs.opencv.org/4.x/opencv.js` into `web/public/` and record its sha256 in `web/README.md`.
- [ ] **Step 2: Write the failing test** `web/tests/pipeline.test.ts`: for each name in `expected.json`, decode `public/samples/<name>.png` with pngjs, run `analyze`, expect `|percent - expected| <= 1` and (stricter) `threshold === expected.threshold`.
- [ ] **Step 3: Run** `npm test` → FAIL (module not found).
- [ ] **Step 4: Implement `pipeline.ts`** mirroring `process_image`: `cv.matFromArray(h,w,CV_8UC4)` → `split` → green (index 1) and blue (index 2, RGBA order) → `threshold(green,0,255,THRESH_BINARY+THRESH_OTSU)`; nucleus: `threshold(blue, OTSU)` then `morphologyEx(MORPH_CLOSE, getStructuringElement(MORPH_ELLIPSE,5x5), iterations=2)`; `mask.setTo(0, nucleus)`; `MORPH_OPEN` then `MORPH_CLOSE` with ellipse 3x3; `percent = countNonZero/total`; overlay = input with mask pixels set to `(0,255,0,255)`.
- [ ] **Step 5: Run** `npm test` → PASS for all three, print the JS percentages.
- [ ] **Step 6: Commit** `feat(web): OpenCV.js port of the pipeline, matches Python on the 3 samples`.

### Task 4: The page (upload/camera, samples, overlay, percentage, PostHog, offline)

**Files:**
- Create/modify: `web/index.html`, `web/src/main.ts`, `web/src/style.css`, `web/src/analytics.ts`, `web/vercel.json`, `web/.env.example`

- [ ] **Step 1: `analytics.ts`**: `initAnalytics()` reads `import.meta.env.VITE_PUBLIC_POSTHOG_KEY`; no key → no-op; `capture(event, props)`.
- [ ] **Step 2: `main.ts`**: `<input type="file" accept="image/*" capture="environment">`, three "Try a sample" buttons (fetch `/samples/<name>.png`, same-origin), decode with `createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" })`, draw to a canvas, `getImageData`, `analyze`, paint input + overlay canvases, show `percent.toFixed(2)%`, threshold, and pixel counts; status line while OpenCV loads (10 MB); errors shown in-page.
- [ ] **Step 3: `vercel.json`**: rewrites `/ingest/static/:path*` → `https://us-assets.i.posthog.com/static/:path*`, `/ingest/:path*` → `https://us.i.posthog.com/:path*`; `Cache-Control: public, max-age=31536000, immutable` header for `/opencv.js` and `/samples/*` so repeat visits are fully cached.
- [ ] **Step 4: Manual check** `npm run dev`, load a sample, see overlay and %, `npm run build` succeeds, `dist/` contains `opencv.js`, `samples/`, `health.json`.
- [ ] **Step 5: Commit** `feat(web): page with upload/camera, samples, overlay, PostHog events`.

### Task 5: Docs (root README for a non-developer, web/README.md with comparison table, .env.example, MIT kept)

- [ ] **Step 1: Root `README.md`**: add a "Try it in your browser" link at the top and a section "How to run this / How to deploy this / Where the settings live" in plain English; note `run_analysis.py` flags.
- [ ] **Step 2: `web/README.md`**: what it is, the accuracy table (name, Python %, JS %, difference), how samples were recovered, the opencv.js provenance line, the same three plain-English sections, the PostHog events list.
- [ ] **Step 3: Commit** `docs: READMEs for a non-developer, accuracy table`.

### Task 6: Deploy to Vercel, attach the domain, verify

- [ ] **Step 1**: from `~/projects/microtubules`: `npx vercel link --yes --project microtubules --scope kks-projects-2edcb11a`; set root directory `web` with `PATCH https://api.vercel.com/v9/projects/microtubules?slug=kks-projects-2edcb11a {"rootDirectory":"web","framework":"vite"}` using the CLI's bearer token from `~/Library/Application Support/com.vercel.cli/auth.json` (never printed); add env `VITE_PUBLIC_POSTHOG_KEY` (production+preview) by piping the value from the PostHog API into `npx vercel env add`.
- [ ] **Step 2**: `npx vercel --prod --yes` → note the URL; `curl -sf <url>/health.json`.
- [ ] **Step 3**: runbook "Attach a domain": `npx vercel domains add microtubules.kalpkan.com microtubules --scope ...`; `npx vercel domains verify --json` → CNAME target; Cloudflare `POST dns_records` DNS-only; poll `curl -sI https://microtubules.kalpkan.com | head -1` until `HTTP/2 200`; record id into `docs/DNS_PENDING.md` §1 + §5.
- [ ] **Step 4**: `npx vercel git connect` so pushes to `main` auto-deploy (best effort).
- [ ] **Step 5**: Phone check with claude-in-chrome at 390 px: load, tap sample, read Network tab: only same-origin + `/ingest/*`.
- [ ] **Step 6**: push the microtubules repo to GitHub (`main`).

### Task 7: Ops record (portfolio repo)

- [ ] `skills/portfolio-ops/runbooks.md`: "Deploy a static Vite app to Vercel" (as executed) + index row.
- [ ] `skills/portfolio-ops/settings-map.md`: `VITE_PUBLIC_POSTHOG_KEY` (microtubules) row.
- [ ] `skills/portfolio-ops/verification.md`: microtubules section (health.json, dig, server header, `npm test`).
- [ ] `skills/portfolio-ops/SKILL.md`: system-map row for `microtubules.`.
- [ ] `skills/portfolio-ops/incidents.md`: entries for anything that went wrong.
- [ ] `docs/DNS_PENDING.md` rows; `projects.json` entry (`url`, `healthUrl`, `status: "live"`), `npm test` in the hub passes.
- [ ] `STATUS.md` task row + session-log line; `bash scripts/install-ops-skill.sh`; `git pull --rebase --autostash`; commit own files; push.

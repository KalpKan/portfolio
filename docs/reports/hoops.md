# hoops (Basketball Stat Tracker) functional audit — 2026-09-18 (TEST + CRITIQUE round 2)

Live URL https://hoops.kalpkan.com · Repo `KalpKan/Basketball-Stat-Tracker` (local `~/projects/basketball`, audited at commit `7eead57`, the FIX round-1 commit; production deployment `v0-basketball-analytics-dashboard-1r3vfa4fi`, READY, aliased) · Vercel project `v0-basketball-analytics-dashboard` (Root Directory `apps/web`) · Database Supabase Project B `platform` (`yzppfufqaekgaxcrsqxp`), schema `hoops` (5 sessions / 95 shots before and after this audit) · Health route `https://hoops.kalpkan.com/api/health` → `{"ok":true,"db":"ok","service":"hoops"}`; Project B `https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health`

Spec and bars: `docs/reports/hoops-spec.md`. Round 1 (`hoops.md` before this rewrite, D1–D11) is re-tested below; the round-1 text is preserved in git history (`0bf0cd2`).

Method: real Chrome via claude-in-chrome on the live URL (1280 px window, `America/Toronto`; console, network, DOM measurements, pill and tab interaction); Playwright 1.63 **Chromium ×6 and WebKit ×6** (1440×900 and 390×844 mobile emulation, `UTC` / `America/Toronto` / `Asia/Tokyo`, dark and light `prefers-color-scheme`) with a new audit script that also measures text contrast of every text node, clipped/truncated text, tap targets, chart labels, gridlines, shot-map dot positions and the pill filter on every session (`docs/reports/evidence/hoops-r2t-playwright-audit.mjs`, results `hoops-r2t-playwright-2026-09-18.json`); Lighthouse 12 ×3 (`hoops-r2t-lighthouse-2026-09-18.jsonl`); `tests/compute-expected-metrics.py --check` on the live payload (`hoops-r2t-dashboard-payload-2026-09-18.json`) against the Management-API row counts; the live ingest function exercised with the handoff doc's 3-shot session on a fresh device/date plus every bad input (rows deleted afterwards, DB back to 5 / 95); the 30-session synthetic corpus rendered through the real `buildDashboardPayload` + `DashboardPage` with the **live** CSS and measured at both widths; the local production build started with a bogus `SUPABASE_URL` for the outage story; the repo's tests and schema test; `impeccable` critique + detector.

## Verdict: WORKING (one phone-width defect left)

Every round-1 defect is fixed on the live host. Numbers are right (`--check` exit 0; 95 = `count(*)`), 0 console errors in 13 browser configs, the Progress chart has real bars with values and a 0–100 axis, one date string per session in every timezone, the 1970 session is hidden with a note, cards and table share one basis and each card names it, eFG% is bounded, the stub notice and repo link sit above the fold, the table scrolls on a phone, tap targets are ≥ 40 px, the worst text contrast is 7.06:1, ingest rejects 1970/future timestamps and shows a new session in 6 s, a DB outage shows a red banner and `/api/health` returns `503 {ok:false, db:"error"}`, Lighthouse performance 0.97–1.00 and accessibility 1.00. What is left: on a 390 px phone the Progress chart's date labels for the two Apr 15 sessions are truncated to **"Apr 1…"**, so two of four bars read as April 1 and cannot be told apart (stories 3 and 8 fail their "readable label" / "no clipped text" bars), and the Session History date (`Wed, Apr 15`) is not byte-identical to the pill/bar label as story 5's bar demands. **8 of 10 stories meet their bar**, 3 and 8 fail on one defect, 5 passes in substance with a wording deviation. Score 84/100.

## Round-1 defects re-tested

| Round-1 defect | Status | Evidence this round |
|---|---|---|
| D1 chart bars 0 px | **fixed** | bars 121–208 px in FG/eFG/Streak in all 12 Playwright configs and real Chrome; values printed; ticks 100/75/50/25/0 + 5 gridlines; Streak axis 30/15/0 |
| D2 React #418, three date strings | **fixed** | `errors []` in 12/12 configs, real Chrome console has only extension warnings; pill = bar title = bar label for every session; identical strings in UTC/Toronto/Tokyo (12 configs produce one distinct label set) |
| D3 1970 session + ingest accepts bad timestamps | **fixed** | no pill/row/bar before 2000; "23 shots with an invalid timestamp hidden"; ingest `400` for 1970 and +30 d |
| D4 Consistency/Avg Streak bases | **fixed** | `--check`: consistency 64.0 = 64.0, avgStreak 9.8 = 9.8 on the device + UTC-day basis; card meta "100 − 2·σ of FG% over 4 sessions" / "avg of 4 best streaks"; single pill → "n/a · needs 2 sessions" |
| D5 eFG 150 % | **fixed** | view `session_summaries` `…0100` = 100.0; page max eFG 100.0; formula in README, page copy, view and Python agree (v2 bounded) |
| D6 no stub notice / links | **fixed** | notice at y = 253 px desktop, 363 px phone; link to the repo; OG/description do not promise capture; no download wording |
| D7 phone table, 36 px toggles, contrast | **fixed** | table wrapper `overflow-x: auto` (794 px table in 290 px wrapper); every button ≥ 40 px; contrast min 7.06:1; Lighthouse contrast 0 failures — but see new D1 (chart labels truncated) |
| D8 outage impersonates config error, no health | **fixed** | local build with bogus URL: `source mock`, `dataError "TypeError: fetch failed"`, red `role=alert` "The database could not be reached…", badge "SAMPLE DATA", `/api/health` → `503 {ok:false, db:"error"}`; live `/api/health` `db: ok` |
| D9 cross-device merge, 12-row cap | **fixed** | fresh device on 2026-08-20 got its own row/pill "Aug 20 · Manual Tap Test (audit r2)"; 30-corpus: 30 sessions, 30 bars, 30 rows, 31 pills |
| D10 minors | **fixed** | `link rel=icon` → `basketball-logo.svg` (no request for `favicon.ico`, 0 failed requests); `role="img"` on the live dot (Lighthouse `aria-prohibited-attr` pass); no key → `401` before body validation; `started_at` = earliest `captured_at` (23:00:00); bars keyed by session id; header `eFG%` |
| D11 pure functions not exported | **fixed** | `lib/dashboard-data.test.ts` drives both fixture corpora; `npx pnpm test` 23/23 |

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| 1 | Live dashboard within 3 s, LIVE, no Demo banner, no console errors, totals match DB | **PASS** | `/api/dashboard` `source "live"`, `totalShotsRecorded 95` = `select count(*) from hoops.shot_events` 95 (Management API; 5 sessions); page "72 shots recorded" + "23 shots with an invalid timestamp hidden" = 95; `Demo data`/`Sample data` absent in 12/12 configs; `loadEventEnd` 389–1244 ms (Playwright), 1000 ms real Chrome; console errors **0** in Chromium ×6, WebKit ×6, real Chrome (Toronto); Lighthouse performance **0.98 / 1.00 / 0.97**, accessibility 1.00 ×3, best-practices 1.00 ×3, `errors-in-console` 0 |
| 2 | Cards recomputable from the table | **PASS** | `--check` exit 0: `consistency: dashboard=64 expected=64.0 (device+UTC-day basis, 4 sessions)`, `avgStreak 9.8 = 9.8`; by hand from the 4 visible rows: FG% 66.7/58.3/75.0/100.0 → 100 − 2·s = 64.0; streaks 1/7/30/1 → 9.75 → 9.8; made 2+7+42+1 = 52 of 3+12+56+1 = 72; each card names its basis ("over 4 sessions", "avg of 4 best streaks") |
| 3 | Progress chart: bar per session, value + label, 0–100 axis, eFG ≤ 100, 4 bars fill, 30 fit | **FAIL** (phone only) | Desktop: 4 bars 208/156/121/139 px (FG) each 276 px wide with value text (`100.0%`, `75.0%`, `58.3%`, `66.7%`) and full labels; eFG max 100.0; ticks `100%…0%`, 5 gridlines; Streak ticks 30/15/0. 30-corpus: 30 bars, 0 at 0 px, 0 overlapping labels, chart scrolls in its box (desktop 1320/1128, phone 1320/206), page 1440/390 px. **Phone (390 px, Chromium + WebKit, all 3 timezones): the two Apr 15 labels are truncated in 46 px columns to "Apr 1…"** (`truncated: true`, scrollWidth 218/181 vs clientWidth 46), so two bars read as April 1 and are indistinguishable (new D1) |
| 4 | Shot map: dots, count, legend, rates sum to 100 | **PASS** | 75 `<circle>` = 72 dots + 3 rim rings; 52 green `rgba(34,197,94,0.9)` / 20 red; 0 dots outside 0–200; "72 tracked attempts" = `shotMap.length` 72; 72.2 + 27.8 = 100.0; dot titles "made 100%"; at 390 px SVG spans 35–355 px, rim 86–304 px, legend 49–341 px, page 390 px (both engines); Sep 18 pill → 3 dots, 66.7 + 33.3 |
| 5 | Session pill narrows everything; date identical everywhere and in every timezone | **PASS** (deviation) | All four pills clicked in all 12 configs: cards, chart, table and map narrow together (e.g. Apr 16 → 7 of 12, 58.3 %, n/a, 7.0; one bar "Apr 16: 58.3% FG%"; one row; map 12 dots). Pill label = bar label = bar title in every timezone. Deviation: the table's Date cell is `Wed, Apr 15` while the pill/bar say `Apr 15 · shootit-ios-manual-test` (the spec bar says byte-identical) — new D2, minor |
| 6 | One row per real session, nothing that looks like a bug | **PASS** | 4 rows: `Fri, Sep 18 · T1.1 sample · 3/2 · 66.7 · 71.4 · 1`, `Thu, Apr 16 · shootit-ios-manual-test · 12/7 · 58.3 · 63.0 · 7`, `Wed, Apr 15 · shootit-ios-manual-test · 56/42 · 75.0 · 75.4 · 30`, `Wed, Apr 15 · Frontend Backend Smoke Test · 1/1 · 100.0 · 100.0 · 1`; no 1970 row (`[.sessions[] | select(.startedAt < "2000")] | length` = 0); every row equals `hoops-expected-metrics.json` `dashboard` block (`--check`); title or device shown |
| 7 | Plain sentence that the iPhone app is not available, ingest-API test sessions, repo link, no download wording | **PASS** | Notice "The iPhone capture app is not available yet. These sessions were recorded through the ingest API for testing. Source and API on GitHub · 23 shots…" at y = 253 px (desktop, above the fold) / 363–459 px (phone, first screen); link → `https://github.com/KalpKan/Basketball-Stat-Tracker`; `hasDownload false`; `<title>` "Hoops Analytics", description/OG "…sent through the Basketball Stat Tracker ingest API. The iPhone capture app is not available yet." |
| 8 | 390 px phone: no horizontal scroll, cards stack, pills scroll, table readable, taps ≥ 40 px, contrast | **FAIL** (one item) | scrollWidth 390 = clientWidth 390 (both engines, all configs); cards stacked at x = 24, 342 px wide; pills row `overflow-x: auto` 877/342; table `overflow-x: auto` 794/290; every `<button>` ≥ 40 px (min 40); contrast: 0 of ~90 text nodes below 4.5:1, min 7.06:1, Lighthouse contrast 0 failures; **but** two chart labels are clipped to "Apr 1…" (D1) — the bar says "no clipped text" |
| 9 | Ingest: 3 × 200, re-POST idempotent, 401, 400s, session appears in 10 s | **PASS** | Device `audit-r2t-1789785933`, 2026-08-20T23:00:00Z: E1/E2/E3 → `200 {"accepted":true}`; re-POST E1 → `200` same `event.id`, DB stayed 98 shots; wrong key → `401`; `x: 1.5` → `400 "Shot coordinates must be normalized…"`; `1970-01-01T00:00:00Z` → `400 "capturedAt must be on or after 2000-01-01…"`; +30 d → `400 "capturedAt is in the future…"`; no key + bad body → `401` (key before body); dashboard row "Thu, Aug 20 · Manual Tap Test (audit r2) · 3 / 2 / 1 · 66.7 · **71.4** · 50.0 · 1" appeared **6 s** after the first POST (real Chrome showed the pill "Aug 20" and its 3-dot map); `session_summaries` identical; `started_at` = 23:00:00. eFG is 71.4 under the bounded v2 formula that spec bar 3 required (the handoff doc and fixture now say 71.4; 83.3 was the v1 proxy). Rows deleted: `sessions 5, shots 95, leftover_audit 0` |
| 10 | DB unreachable → honest banner, no LIVE badge, `/api/health` | **PASS** | Local production build, `SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co`: `/api/dashboard` `source "mock"`, `dataError "TypeError: fetch failed"`; page renders (3 sample bars/rows) with red `role="alert"` "SAMPLE DATA — The database could not be reached, so the numbers below are built-in sample shots, not real sessions. The page retries every few seconds."; `SUPABASE_URL` text absent (0 matches); badge "SAMPLE DATA", no LIVE; `/api/health` → `503 {"ok":false,"db":"error",…}`; 0 console errors. Live: `/api/health` → `200 {"ok":true,"db":"ok","service":"hoops"}`; monitor `804030256` points at it |

Cross-cutting: `npx pnpm test` → **23/23** (incl. `snapshot corpus (5 sessions / 95 shots) matches the ground truth on the dashboard basis`, `30-session synthetic corpus: all 30 sessions survive and match the ground truth`, eFG bound, UTC labels, banner variants, ingest validation); `bash supabase/migrations/test_hoops_schema.sh` → `PASS`; still a plain Next.js 15 app on Vercel Hobby (Root Directory `apps/web`), Supabase Project B schema `hoops` only, PostHog `/ingest/s/` 200 in real Chrome; `impeccable detect` on the three UI files: 0 findings. Spend $0; nothing touched but the audit rows, all removed.

## Defects

### D1 — On a 390 px phone the Progress chart truncates the two "Apr 15 · …" labels to "Apr 1…", so two bars read as April 1 and cannot be told apart

Severity: **major** (phone only; desktop labels are complete)

Steps to reproduce: open https://hoops.kalpkan.com on a 390 px phone (or Playwright `viewport 390×844`, Chromium or WebKit, any timezone), Analytics tab, look under the Progress bars.

Expected / Actual: four readable labels that match the pills (`Apr 15 · shootit-ios-manual-test`, `Apr 15 · Frontend Backend Smoke Test`, `Apr 16`, `Sep 18`), no clipped text. Actual: the first two labels render as `Apr 1…` / `Apr 1…` in 46 px columns (`span.truncate`: scrollWidth 218 and 181 vs clientWidth 46, `truncated: true` in all six phone configs of both engines); the visible date is wrong (reads as April 1) and the two bars are indistinguishable except by hovering (no hover on a phone). The chart width is 206 px, so `MIN_COLUMN_PX = 44` × 4 fits without scrolling and nothing forces the labels to get room.

Evidence: `docs/reports/evidence/hoops-r2t-webkit-phone-tokyo-2026-09-18.jpg` (Progress box, labels "Apr 1…"), `clipped` and `chart.labels[].truncated` in `hoops-r2t-playwright-2026-09-18.json` for every `phone-*` config.

Likely cause: `apps/web/components/dashboard-page.tsx` `ProgressChart`: the label span is `flex-1 truncate … minWidth: MIN_COLUMN_PX - 8` (36 px) while `buildDailySessions` (`lib/dashboard-data.ts`, "Two devices on the same day…") appends ` · <title or deviceId>` to `label` whenever two sessions share a date. The disambiguation string is 30+ characters and the column is sized for a 6-character date.

Suggested fix: keep the axis label to the date (`Apr 15`) and put the disambiguator on a second, smaller line that may truncate (title first, then device) or as a `1`/`2` suffix (`Apr 15 ①` / `Apr 15 ②`) that matches the pill; alternatively size `minWidth` per column from the longest label (`ch` units) so the chart scrolls sideways instead of clipping. Add the phone-width label assertion (`scrollWidth <= clientWidth` on every `span[title]`) to `dashboard-page.test.tsx` or the Playwright smoke.

### D2 — The Session History date is not byte-identical to the pill and bar label for the same session

Severity: **minor** (spec-bar deviation; the substance of story 5 holds)

Steps to reproduce: compare the `Apr 15 · shootit-ios-manual-test` pill with the corresponding table row.

Expected / Actual: spec bar 5 says the pill, bar and table label are byte-identical. Actual: pill and bar say `Apr 15 · shootit-ios-manual-test`; the table Date cell says `Wed, Apr 15` and the Session column says `shootit-ios-manual-test`. Both Apr 15 rows show the same Date text, so the mapping from bar to row depends on reading the Session column. The strings are identical across UTC/Toronto/Tokyo, which was the real intent of the bar.

Evidence: `rows[*][0]` vs `pillLabels` in `hoops-r2t-playwright-2026-09-18.json` (12 configs, one distinct set).

Likely cause: `lib/dashboard-data.ts` builds `label` (pill/bar) and `dateLabel` (table, with weekday) separately, and the ` · title` disambiguator is added to `label` only.

Suggested fix: either render `session.label` in the table's Date cell too (drop the weekday or add it to both), or change the spec bar to "same date text everywhere; the table may add the weekday". One string per session is the simplest.

### D3 — Presentation of test data a stranger notices (minor bundle)

Severity: **minor**

- Pills and chart labels expose raw device ids (`shootit-ios-manual-test`) because those sessions have no title; a visitor sees developer identifiers as session names. Humanise untitled sessions (`Session 2`, `Device 1`) or title them in the DB (`update hoops.sessions set title = …`).
- The 1-shot `Frontend Backend Smoke Test` session draws a full-height 100 % bar and is one of the four values behind Consistency: with it 64.0 %, without it 83.3 %. Nothing on the chart says the bar is one attempt. Print the attempt count with the value (`100.0% · 1 shot`) or in the label, and consider excluding sessions below n attempts from Consistency with the basis text saying so.
- "1 misses" in the Field Goal card meta when a single session is selected (`${missed} misses`); pluralise.
- Chart value text is 11 px (`text-[11px]`); readable on desktop, small on a phone.
- With 30 sessions the desktop chart is 1320 px inside a 1128 px box: the last four bars sit behind a horizontal scroll with no visible affordance (no fade, no scrollbar until hover; the cut-off `44.` at the right edge is the only hint). Add an edge fade or a "scroll →" hint, or shrink columns until ~26 bars fit.
- `favicon.ico` is still 404 (harmless: `link rel=icon` points at the SVG and no browser in this run requested it).
- `tests/fixtures/README.md` line 10 still promises `eFG 83.3` for the synthetic session; the fixture, handoff doc and README say 71.4 (v2). Update the one stale sentence.
- Risk, not reproduced: `getSupabaseAdmin()` creates the client with no fetch timeout. A Supabase outage that fails fast (DNS, 5xx) shows the red banner as tested; one that hangs would run into the Vercel function limit and 500 instead. Consider `AbortSignal.timeout(8000)` in a custom `fetch`.

## UX critique (impeccable `critique`, mode: Operate)

⚠️ DEGRADED: single-context (no sub-agent/Task tool exposed in this session; Assessment A was written from the live page and source before the detector ran; detector `impeccable detect` on `dashboard-page.tsx`, `demo-data-banner.tsx`, `layout.tsx`: 0 findings).

Design specificity: the glass header pill, orange rim shot map, green/orange tiles and the per-session pills belong to this product; the Overview → Progress → Key Metrics → History stack is still a generic analytics template, but it now carries the numbers and copy that make it trustworthy (basis on every card, formula text, UTC note on the chart). The most memorable screen (Shot Map) is still behind a non-default tab.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | LIVE badge, "72 shots recorded", hidden-shot note; still no "updated n s ago" despite the 5 s poll |
| 2 | Match system / real world | 3 | UTC dates stated; device ids as session names; "1 misses" |
| 3 | User control and freedom | 3 | Pills, tabs and modes reversible; no keyboard shortcut or URL state for a selection |
| 4 | Consistency and standards | 3 | One label per session on pill and bar; table date differs (D2); phone labels clipped (D1) |
| 5 | Error prevention | 4 | Ingest rejects bad coordinates, clocks and keys; key checked first |
| 6 | Recognition rather than recall | 3 | Values on every bar, axis and gridlines; attempts per bar only on hover |
| 7 | Flexibility and efficiency | 3 | Instant filtering across every panel |
| 8 | Aesthetic and minimalist | 3 | Restrained dark palette, contrast ≥ 7:1, good hierarchy; 11 px chart values |
| 9 | Error recovery | 4 | Red outage banner with retry note, health route, sample-data badge |
| 10 | Help and documentation | 3 | Stub notice + repo link + formula copy; no link from the notice to the handoff doc |
| **Total** | | **32/40** | Trustworthy numbers and honest states; the remaining friction is phone chart labels and test-data naming |

Cognitive load: 4 cards + 3 modes + 5 pills + 2 tabs, fine. Emotional journey: header → cards → a real chart → map; the valley is now on a phone, where the chart labels read "Apr 1…". Strengths: every number is explainable from the page itself; the outage state is honest; the ingest API tells the caller exactly what was wrong. Persona red flags: a recruiter on a phone sees two "Apr 1…" bars; a data-literate visitor sees a 100 % bar and finds it is one shot. Provocative question: should the Shot Map be the first thing on the page, with a small per-session strip of sparklines instead of a 12-column table?

## Known limitations that are NOT defects

- The iPhone capture app is a stub by design; the page says so (story 7).
- Dark-only: `prefers-color-scheme: light` renders the same dark page (body `rgb(5,5,5)`); the spec does not require a light theme.
- Merging one device's sessions into one row per UTC day is deliberate and matches the backend's own session rule.
- eFG% is the bounded v2 proxy since `7eead57` (spec bar 3): the handoff doc's original 83.3 for the synthetic session is 71.4 now, and every doc/fixture except `tests/fixtures/README.md` line 10 says so.
- The 30-bar chart scrolls inside its own box rather than shrinking bars; the spec only forbids overflowing the page.
- Real Chrome on macOS cannot present a 390 px viewport (window minimum ≈ 500 px); phone bars were measured in Playwright Chromium (mobile emulation) and WebKit; Playwright's WebKit is Safari's engine, not Safari.app.
- The outage story is verified on the local production build (`next start`) with a bogus `SUPABASE_URL`; Project B was not paused for the test.

## How a fixing agent should verify the fix

```bash
# 1. Numbers still right, health ok
curl -s https://hoops.kalpkan.com/api/dashboard > /tmp/hoops-payload.json
python3 ~/projects/basketball/tests/compute-expected-metrics.py --check /tmp/hoops-payload.json   # exit 0
curl -s https://hoops.kalpkan.com/api/health                                                       # {"ok":true,"db":"ok",...}

# 2. D1/D2: no truncated chart label on a phone, one string per session (Chromium + WebKit, 3 timezones, 2 widths, 2 schemes)
mkdir -p /tmp/hoops-audit/shots && cd /tmp/hoops-audit && ln -sfn ~/projects/promptflip/node_modules node_modules
cp ~/projects/portfolio/docs/reports/evidence/hoops-r2t-playwright-audit.mjs . && S=$PWD/shots node hoops-r2t-playwright-audit.mjs > results.json
jq -r 'to_entries[] | "\(.key) errors=\(.value.errors|length) clipped=\(.value.clipped|length) truncated=\([.value.chart.labels[]|select(.truncated)]|length) minBtn=\([.value.btns[]|select(.t!="Source and API on GitHub")|.h]|min) contrast=\(.value.contrast.min) sw=\(.value.scrollWidth)"' results.json
#   expect every line: errors=0 clipped=0 truncated=0 minBtn>=40 contrast>=4.5 sw<=viewport; and pillLabels[1..] == chart.labels[].text reversed == rows[][0] (if D2 is fixed by one string)

# 3. 30-session corpus still fits (render with the live CSS)
cd ~/projects/basketball/apps/web && cp ~/projects/portfolio/docs/reports/evidence/hoops-r2-synthetic30-render.tsx ./__r.tsx && \
  curl -s "https://hoops.kalpkan.com$(curl -s https://hoops.kalpkan.com | grep -o '/_next/static/css/[^"]*\.css' | head -1)" -o /tmp/hoops-audit/live.css && \
  CSS=file:///tmp/hoops-audit/live.css OUT=/tmp/hoops-audit/synthetic-30.html npx tsx --tsconfig tsconfig.test.json ./__r.tsx; rm ./__r.tsx
cd /tmp/hoops-audit && cp ~/projects/portfolio/docs/reports/evidence/hoops-r2-synthetic30-measure.mjs . && S=$PWD node hoops-r2-synthetic30-measure.mjs
#   expect: bars 30, barsZero 0, overlappingLabels 0, pageScrollW 390 on phone (the render script must be run from inside apps/web so it resolves that app's React)

# 4. Ingest end to end (fresh device + date), then delete
KEY=$(cat ~/.config/portfolio-ops/hoops-ingest.key); FN=https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/hoops-ingest-shot
#   POST the three events of tests/fixtures/synthetic-tap-session.json with fresh uuids, deviceId verify-<ts>, capturedAt on an unused date → 3 × 200 accepted:true; re-POST → 200; wrong key → 401;
#   x:1.5 / capturedAt 1970-01-01T00:00:00Z / +30 d → 400; within 10 s /api/dashboard has the row 3/2/1 66.7/71.4/50/1
#   cleanup (Management API SQL): delete from hoops.shot_events where session_id in (select id from hoops.sessions where device_id like 'verify%'); delete from hoops.sessions where device_id like 'verify%'

# 5. Outage story on the local production build
cd ~/projects/basketball/apps/web && npx pnpm build && (SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co SUPABASE_SERVICE_ROLE_KEY=x npx next start -p 3124 &) ; sleep 6
curl -s localhost:3124/api/dashboard | jq '{source, dataError}'; curl -s -w ' %{http_code}\n' localhost:3124/api/health; curl -s localhost:3124/ | grep -c 'could not be reached'; pkill -f 'next start -p 3124'

# 6. Tests, schema, Lighthouse
cd ~/projects/basketball && npx pnpm test && bash supabase/migrations/test_hoops_schema.sh
for i in 1 2 3; do npx lighthouse@12 https://hoops.kalpkan.com --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility --output=json --output-path=/tmp/lh-$i.json; jq '{p:.categories.performance.score,a:.categories.accessibility.score}' /tmp/lh-$i.json; done
```

# hoops (Basketball Stat Tracker) functional audit — 2026-09-18 (TEST + CRITIQUE round 1, re-run)

Live URL https://hoops.kalpkan.com · Repo `KalpKan/Basketball-Stat-Tracker` (local `~/projects/basketball`, audited at commit `1f743b9`; no product commits since the first round-1 pass at `b34f00e`, only test fixtures) · Vercel project `v0-basketball-analytics-dashboard` (Root Directory `apps/web`) · Database Supabase Project B `platform` (`yzppfufqaekgaxcrsqxp`), schema `hoops` (5 sessions / 95 shots before and after this audit) · Health route: **none on the dashboard host** (`/api/health` → 404); Project B `https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health`

Spec and bars: `docs/reports/hoops-spec.md`. This is the round-1 report re-run after the workflow was resumed; D1–D10 from the first pass were re-tested from scratch and all reproduce. New this run: Safari engine coverage (Playwright WebKit 26.6), the pipeline run offline on the 30-session synthetic corpus (D9 gains a measured "30 bars" failure, D11 is new), and Lighthouse now clears the performance bar.

Method: real Chrome via claude-in-chrome on the live URL at 1440 px, `America/Toronto` (console + DOM measurements; Chrome on macOS refuses to shrink its window below ~500 px, so the 390 px bars were measured with Playwright mobile emulation); Playwright 1.63 **Chromium** at 1440×900 and 390×844 in `UTC`, `America/Toronto`, `Asia/Tokyo`, dark and light `prefers-color-scheme` (6 configs) and **WebKit** in 4 of those configs (`docs/reports/evidence/hoops-r1b-playwright-{chromium,webkit}-2026-09-18.json`, script `hoops-r1b-playwright-audit.mjs`); Lighthouse 12 × 3 (`hoops-r1b-lighthouse-2026-09-18.json`); `tests/compute-expected-metrics.py --check` on the live payload; the ingest function exercised with the handoff doc's 3-shot session plus bad inputs (all audit rows deleted afterwards, DB back to 5 / 95); `getDashboardPayload()` run offline on `tests/fixtures/synthetic-30-sessions.json` through a mocked Supabase client (`hoops-r1b-corpus-harness.test.ts`) and the component rendered with all 30 days to measure the chart (`hoops-r1b-synthetic30-*`); a local `next dev` with a bogus `SUPABASE_URL` for the outage story; the repo's own tests; `impeccable` critique (degraded single-context: no sub-agent tool exposed).

## Verdict: PARTIALLY WORKING

Every number the page shows is right (each count, FG%, eFG%, swish rate and best streak per UTC day equals the independent ground truth, `--check` exit 0; 95 = `count(*)`), the page reads real rows, and it now scores 0.96–0.99 on Lighthouse performance. But a stranger would not trust it: the Progress chart is an empty box in Chrome, Safari and every timezone (all bars render at 0 px), every load outside UTC throws React #418 and shows the same session under two different dates, a 1970 test session sits in the history as "Wed, Dec 31", the Session History table is cut off on a phone, nothing says the iPhone app does not exist, the ingest API accepts a 1970 and a +30-day timestamp, and a database outage renders sample numbers under a "set `SUPABASE_URL`" banner. **1 of 10 stories meets its bar** (Shot Map). Score 33/100.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| 1 | Live dashboard within 3 s, LIVE, no Demo banner, no console errors, totals match DB | **FAIL** (partial) | `/api/dashboard` → `source: "live"`, `totalShotsRecorded 95` = `select count(*) from hoops.shot_events` 95 (Management API); `Demo data` absent from the HTML in all 10 Playwright configs; load 0.9–1.9 s (Playwright `loadMs` 933–1874; real Chrome `loadEventEnd` 1156 ms). Console: `Minified React error #418` on every load in Toronto and Tokyo (Chromium ×4, WebKit ×3, real Chrome), 0 errors only in `UTC`; `favicon.ico` 404 (Lighthouse `errors-in-console`). Lighthouse performance **0.96 / 0.97 / 0.99** (LCP 2.4 / 2.4 / 2.0 s) → the ≥ 0.85 × 3 bar now passes; accessibility 0.91 (16 `color-contrast` nodes at 3.1–3.8 : 1, `aria-prohibited-attr`), best-practices 0.96. |
| 2 | Overview cards recomputable from the table (same basis, rounding) | **FAIL** | `--check`: `consistency: dashboard=67.6 (raw-session basis 67.6, utc-day basis 85.9)`, `avgStreak: dashboard=10.3 (raw 8.4, utc-day 10.3)`. Table has 4 rows; `100 − 2·stddev(FG%)` over them is 85.9, not the 67.6 shown. Consistency card meta is `13.4% swish rate`; no card names its basis. Selecting the `Sep 18` pill: `Consistency | 67.6% | 50.0% swish rate` (global value, per-session meta) in every config. |
| 3 | Progress chart: one bar per session, value + label, 0–100 axis, eFG ≤ 100, 30 bars fit | **FAIL** (blocker) | Bars: `style.height` 65.2 / 75.4 / 58.3 / 66.7 % but `getBoundingClientRect().height` **0** for all four in FG%, eFG% and Streak modes, in Chromium ×6, WebKit ×4 and real Chrome (`bars`, `modes` in the JSON; `hoops-r1b-chrome-real-desktop-toronto-2026-09-18.jpg`). No numeric value on any bar, no axis, no gridlines. 30-session corpus rendered through the real component: 30 columns, still 0 px bars; at 390 px the chart's inner row is 1102 px wide inside a 292 px box and the **page scrollWidth becomes 1152** (`hoops-r1b-synthetic30-phone-2026-09-18.jpg`); at 1440 px the 30 labels wrap to two lines but fit. `hoops.session_summaries` still returns `efg_percent 150.0` for session `…0100`. |
| 4 | Shot map: every shot a dot, count = filter, legend, Made + Miss = 100 | **PASS** | 98 `<circle>` = 95 shots + 3 rim/ring circles, 67 green `rgba(34,197,94,0.9)` / 28 red, 0 outside `0 0 200 200`; "95 tracked attempts"; 70.5 + 29.5 = 100.0. `Dec 31` pill in real Chrome → "23 tracked attempts", 65.2 %. At 390 px the SVG spans 35–355 px and the legend sits below at 49–341 px, unclipped (Chromium and WebKit). |
| 5 | Session pill narrows everything; date identical everywhere and in every timezone | **FAIL** | Filtering works (cards, chart, map, table change together). Same session, three strings: Toronto pill `Dec 31`, chart `Jan 1`, row `Wed, Dec 31`; Tokyo pill `Sep 19`, chart `Sep 18`, row `Sat, Sep 19` for the real 2026-09-18 session; UTC pill `Jan 1`, row `Thu, Jan 1`. WebKit identical. |
| 6 | One row per real session, nothing that looks like a bug | **FAIL** | Row `Wed, Dec 31 · 23 · 15 · 65.2% · 69.6% · 3` (Toronto) / `Thu, Jan 1` (UTC, Tokyo) is the 1970 epoch session, 24 % of the corpus, counted in every card. No title or device column. Other three rows match `per_utc_day` exactly. |
| 7 | Plain sentence that the iPhone app is not available yet, ingest-API test sessions, repo link | **FAIL** | `hasNotice false`, `repoLink false` in all 10 configs; real Chrome `document.querySelectorAll('a')` → **0 links on the whole page**. `<title>` "Hoops Analytics", description "Basketball shooting analytics dashboard", no OG tags. No download / App Store wording either (that half holds). |
| 8 | 390 px phone: no horizontal scroll, cards stack, pills scroll, table readable, taps ≥ 40 px, contrast | **FAIL** | scrollWidth 390 = client 390 (pass); cards stack at x = 24, 342 px wide (pass); pills row `overflow-x: auto`, 496–507 > 342 (pass). `<table>` 500 px inside a 290 px wrapper with `overflow-x: hidden`: FG% half cut, EFG% and Best Streak unreachable (Chromium and WebKit, both schemes; `hoops-r1b-chromium-phone-tokyo-2026-09-18.jpg`). Toggles FG% / eFG% / Streak are **36 px** tall. Lighthouse contrast: 16 nodes at 3.14–3.82 : 1 (`text-white/35`, `/40`, `/45`). |
| 9 | Ingest: 3 × 200, 401, 400s, session appears within 10 s, re-POST idempotent | **FAIL** (partial) | Device `audit-r1b-1789781687`: three events → `200 {"accepted":true}`; re-POST of E1 → `200` with the same `event.id`, `session_summaries` stayed 3 / 2 / 1; wrong key → `401`; `x: 1.5` → `400`. View for the session: attempts 3, made 2, missed 1, FG 66.7, eFG 83.3, swish 50.0, streak 1 (exact). Dashboard refreshed within 8 s. **But** `capturedAt 1970-01-01T00:00:00Z` → `200` (day-1970 row went 23 → 24) and `2026-10-19T01:34:51Z` (+30 d) → `200` (a `day-2026-10-19` session appeared); and the synthetic session never got its own row: it merged into `day-2026-04-15 · 60 / 45 / 15 · 75.0 / 78.4`, Consistency moved 67.6 → 64.1. Also `sessions.started_at` was set to the first *ingested* event (23:00:03), not the earliest `captured_at` (23:00:00). Rows deleted; `sessions 5, shots 95, leftover_audit 0`. |
| 10 | DB unreachable → honest banner, no LIVE badge, `/api/health` | **FAIL** | Local `next dev` with `SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co`: `/api/dashboard` → `source "mock"`, `totalShotsRecorded 67`, sessions `demo-1..3`; HTML contains `Demo data` and "not connected to a database. Set `SUPABASE_URL`…"; LIVE badge absent (pass). `/api/health` → **404** locally and on https://hoops.kalpkan.com; `apps/web/app/api/` holds only `dashboard`. |

Cross-cutting: `npx pnpm test` → 4/4 (none cover the metric math; no `lib/dashboard-data.test.ts`, and `buildDailySessions`, `buildProgress`, `calculateBestMakeStreak` are not exported, so the fixture-driven unit test the spec asks for cannot be written without a source change). `bash supabase/migrations/test_hoops_schema.sh` → `PASS`. Offline pipeline on the 30-session corpus: `source live`, **12 of 30 sessions** survive, 801 shots in the map, 0 mismatches against ground truth for the 12 kept days, 0 eFG > 100. `impeccable detect`: 1 warning (Inter). Spend $0; nothing touched but audit rows, all removed.

## Defects

### D1 — The Progress chart renders no bars at all, in every browser

Severity: **blocker**

Steps to reproduce: open https://hoops.kalpkan.com (Analytics tab, default). Look at the Progress box. Toggle FG% / eFG% / Streak.

Expected / Actual: four green bars of height 65.2 / 75.4 / 58.3 / 66.7 % with their values printed. Actual: an empty dashed box with four labels along the bottom. Real Chrome: `[...document.querySelectorAll('.h-72 .flex-1 div')].filter(d=>d.style.height)` → `style.height "65.2%" … getBoundingClientRect().height 0` for all four; identical in Chromium ×6 and WebKit ×4 and in all three modes. With the 30-session corpus, 30 columns of 0 px.

Evidence: `docs/reports/evidence/hoops-r1b-chrome-real-desktop-toronto-2026-09-18.jpg`, `hoops-r1b-chromium-desktop-toronto-2026-09-18.jpg`, `hoops-r1b-webkit-phone-tokyo-2026-09-18.jpg`, `bars`/`modes` in the two Playwright JSONs, `hoops-r1b-synthetic30-desktop-2026-09-18.jpg`.

Likely cause: `apps/web/components/dashboard-page.tsx:367-376`. The row is `flex h-full items-end gap-4`, so each column (`flex flex-1 flex-col items-center gap-3`) is only as tall as its content; the bar's percentage `height` then has no definite containing-block height and resolves to 0 (CSS percentage heights need a definite parent height).

Suggested fix: give the columns the full height and push content to the bottom (`flex h-full flex-1 flex-col items-center justify-end gap-3`, drop `items-end` on the row), or size the bar area in px and compute bar heights in px. In the same change print the value above each bar, add a fixed 0–100 axis with gridlines for the percentage modes, and make the chart area `overflow-x-auto` with a `min-w` per column so 30 bars scroll instead of pushing the page wider (story 3 bar). A DOM test asserting rendered bar height > 0 would have caught this.

### D2 — React error #418 on every load outside UTC, and the same session carries different dates on the pill, chart and table (and across timezones)

Severity: **blocker**

Steps to reproduce: open the page in a browser whose timezone is America/Toronto or Asia/Tokyo; read the console; compare the last pill, the first chart label and the last table row.

Expected / Actual: 0 console errors; one date string per session everywhere, the same in every timezone. Actual: `Minified React error #418` (hydration text mismatch) in Toronto and Tokyo (real Chrome, Chromium, WebKit), 0 errors only in UTC. Toronto: pill `Dec 31`, chart `Jan 1`, row `Wed, Dec 31`. Tokyo: pill `Sep 19`, chart `Sep 18`, row `Sat, Sep 19` for the real 2026-09-18 19:40 Z session, so this is not only the epoch row.

Evidence: real-Chrome console excerpt (`[EXCEPTION] Error: Minified React error #418 … at rD (d99d8e6a-80443bd3c9d31f50.js:1:35052)`); `errors`, `pillLabels`, `chartLabels`, `rows` per config in `hoops-r1b-playwright-chromium-2026-09-18.json` and `-webkit-`.

Likely cause: `apps/web/components/dashboard-page.tsx:480-486` (`formatPillLabel`, `formatTableDate`) call `Intl.DateTimeFormat("en-US", …)` without `timeZone` inside a `"use client"` component that is server-rendered in UTC; `apps/web/lib/dashboard-data.ts:59-64` (`formatSessionLabel`) formats the chart label on the server only. Any session near a UTC day boundary gets one string on the server and another in the browser.

Suggested fix: format each date once on the server in `dashboard-data.ts` with `timeZone: "UTC"` (the merge key is already the UTC date), add `label` and `dateLabel` to `SessionSummary`, and render those strings in the pill, chart and table; delete the two client formatters. Add the year to the label when it is not the current year.

### D3 — A 1970 epoch session is shown as a real session, and the ingest function accepts pre-2000 and future timestamps

Severity: **major**

Steps to reproduce: (a) open the page: last pill `Dec 31` (Toronto) or `Jan 1` (UTC/Tokyo), last row `23 · 15 · 65.2%`. (b) POST an otherwise valid event with `capturedAt: "1970-01-01T00:00:00Z"`, then one with `capturedAt` 30 days ahead.

Expected / Actual: rows before 2000-01-01 hidden or labelled invalid and excluded from every card, with a muted "23 shots with an invalid timestamp hidden"; both POSTs → `400`. Actual: the epoch session counts in every card (95 attempts, 70.5 %, Consistency); both POSTs → `200 {"accepted":true}`; the day-1970 row went to 24 attempts and a `day-2026-10-19` session appeared in `/api/dashboard`.

Evidence: this run's ingest output (`1970 200 …session_id 864621c5…`, `future 2026-10-19T01:34:51Z 200 …`), `tests/fixtures/hoops-expected-metrics.json` `overall.shots_before_2000: 23`; all audit rows removed afterwards.

Likely cause: `supabase/functions/hoops-ingest-shot/index.ts:63-65` only checks `Number.isNaN(Date.parse(body.capturedAt))`; `apps/web/lib/dashboard-data.ts:203-217` maps every `session_summaries` row without a date guard; `overall_analytics` (`supabase/migrations/0002_analytics_views.sql`) aggregates every shot.

Suggested fix: in the function reject `capturedAt < 2000-01-01` or `> now + 1 day` with `400`; in `getDashboardPayload` drop sessions and shots with `started_at < 2000-01-01` before merging and compute the overview from the kept shots (or filter in the views), and show the hidden count in a muted note. Add the case to `compute-expected-metrics.py --check`.

### D4 — "Consistency" and "Avg Streak" are on different bases from each other and from the table, and no card names its basis

Severity: **major**

Steps to reproduce: read the Consistency card (67.6 %) and the four Session History rows; compute `100 − 2·stddev_samp(FG%)` over the rows. Then tap the `Sep 18` pill.

Expected / Actual: 85.9 % with meta "over 4 sessions"; a per-session selection says "n/a (1 session)". Actual: 67.6 % (SQL, over 5 raw sessions including a 1-shot 100 % session) while Avg Streak 10.3 is over the 4 merged days; the Consistency card's meta is the swish rate; after selecting one pill the card still reads the global 67.6 % beside that session's swish rate. Adding three 1-shot audit sessions moved it 67.6 → 64.1, which is how fragile the raw basis is.

Evidence: `--check` output quoted in story 2; `pillCheck.cards` in the Playwright JSONs (`Consistency |  | 67.6% | 50.0% swish rate`).

Likely cause: `apps/web/lib/dashboard-data.ts:260` takes `overviewRow.consistency` from `hoops.overall_analytics` (`0002_analytics_views.sql`, per raw session) while `avgStreak` (`:248-251`) is computed over `buildDailySessions()`; `apps/web/components/dashboard-page.tsx:70` returns `data.overview.consistency` for a single-session selection.

Suggested fix: compute Consistency in `dashboard-data.ts` from the merged day sessions with the same formula, name the basis in each card's meta ("over 4 sessions", "avg of 4 best streaks"), and show "n/a (1 session)" when one pill is selected.

### D5 — eFG% proxy exceeds 100 % (150 % on a 1-shot swish session); the formula lives in four places

Severity: **major**

Steps to reproduce: `select efg_percent from hoops.session_summaries where session_id = '90000000-0000-4000-8000-000000000100'` → `150.0`. Any UTC day whose only shots are swishes would show > 100 % on the page.

Expected / Actual: eFG ≤ 100 for every session. Actual: 150.0 in the view; hidden today only because that session merges into Apr 15 (78.1 %).

Evidence: view query; `hoops-expected-metrics.json` `sessions_with_efg_over_100`; the synthetic corpus (0 > 100) shows the fix is testable.

Likely cause: `(made + 0.5·swishes) / attempts` in `supabase/migrations/0002_analytics_views.sql`, `apps/web/lib/dashboard-data.ts:141`, `README.md` and the Key Metrics copy `dashboard-page.tsx:187`.

Suggested fix: redefine as `(made + 0.5·swishes) / (attempts + 0.5·swishes)` (bounded, still rewards swishes) in all four places in one commit; regenerate both expected-metrics fixtures with the new `formulas` block so `--check` still exits 0.

### D6 — Nothing tells the visitor the iPhone capture app does not exist or where the shots came from; the page has no links at all

Severity: **major**

Steps to reproduce: open the page at 1440 and 390 px; search the text for "iPhone", "app", "ingest", "not available", "GitHub"; count `<a>` elements.

Expected / Actual: a one-sentence notice above the fold with a link to `https://github.com/KalpKan/Basketball-Stat-Tracker`. Actual: no such text, 0 links on the page; header says "Track your shooting performance" beside a pulsing LIVE DATA badge; no OG tags.

Evidence: `hasNotice false`, `repoLink false` in all 10 configs; real Chrome `links: []`.

Likely cause: no such element in `apps/web/components/dashboard-page.tsx:105-129`; `apps/web/app/layout.tsx:5-8` metadata.

Suggested fix: add a muted one-line notice under the header ("The iPhone capture app is not available yet; these are ingest-API test sessions" + repo link), reword the subtitle, add `openGraph` metadata that does not promise phone capture, and mark rows from test devices as such.

### D7 — On a 390 px phone the Session History table is cut off, chart toggles are under 40 px, and secondary text fails contrast

Severity: **major**

Steps to reproduce: Playwright `viewport 390×844, isMobile` (Chromium or WebKit), scroll to Session History; measure the FG% / eFG% / Streak buttons; run Lighthouse accessibility.

Expected / Actual: table scrolls in its own container or reflows; tap targets ≥ 40 px; ≥ 4.5:1. Actual: `<table>` 500 px in a 290 px wrapper with `overflow-x: hidden` (FG% half visible, EFG% and Best Streak unreachable); toggles 36 × 63–74 px; 16 nodes at 3.14–3.82 : 1 (`#606060`–`#727272` on near-black).

Evidence: `hoops-r1b-chromium-phone-tokyo-2026-09-18.jpg`, `hoops-r1b-webkit-phone-tokyo-2026-09-18.jpg`, `tableWrap`/`btns` in the JSONs, `hoops-r1b-lighthouse-2026-09-18.json` `color_contrast_items`.

Likely cause: `dashboard-page.tsx:194` (`overflow-hidden` wrapper), `:349` (`py-2` toggles), `text-white/35` / `/40` / `/45` at `:113`, `:126`, `:171`, `:197`, `:227`, `:229`, `:250`, `:327`, `:376`.

Suggested fix: `overflow-x-auto` on the wrapper with `min-w-[560px]` on the table (or a card list under `md:`), `min-h-10` on the toggles, and raise secondary text to `text-white/60` or brighter.

### D8 — A database failure renders sample numbers under a "set SUPABASE_URL" banner, and there is no `/api/health` on the dashboard host

Severity: **major**

Steps to reproduce: `cd apps/web && SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co SUPABASE_SERVICE_ROLE_KEY=x npx next dev -p 3123`; `curl localhost:3123/api/dashboard`; `curl localhost:3123/`; `curl -I localhost:3123/api/health`; on production `curl -I https://hoops.kalpkan.com/api/health`.

Expected / Actual: `/api/dashboard` says the database could not be reached, the banner names the problem, `/api/health` returns `{ok, db}`. Actual: `source "mock"`, 67 sample shots, `demo-1..3`; banner "Demo data … not connected to a database. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`…"; `/api/health` → 404 locally and live (the UptimeRobot monitor only checks the HTML).

Evidence: local run output in this report's story 10; `curl -s -o /dev/null -w '%{http_code}' https://hoops.kalpkan.com/api/health` → `404`.

Likely cause: `apps/web/lib/dashboard-data.ts:192-201` returns `buildMockPayload()` on any query error, indistinguishable from the missing-env case; `apps/web/components/demo-data-banner.tsx` has one message; no `apps/web/app/api/health/route.ts`.

Suggested fix: add `dataError?: string` to the payload, show a red "could not reach the database" banner for query failures (never the env-var text in production), and add `app/api/health/route.ts` calling `health_select_one()` → `{ok, db, service: "hoops"}`; then point the monitor at it.

### D9 — Sessions from different devices on the same UTC day merge into one row, titles are dropped, and history is capped at 12 raw sessions (30-day corpus shows 12)

Severity: **major**

Steps to reproduce: POST the handoff doc's 3-shot session (2026-04-15T23:00Z, new device) and open the page. Separately run `getDashboardPayload()` on `tests/fixtures/synthetic-30-sessions.json` (harness `hoops-r1b-corpus-harness.test.ts`).

Expected / Actual: a new row/pill with 3 / 2 / 1; 30 bars/rows for the corpus. Actual: the Apr 15 row silently became 60 / 45 / 15, no pill, no title; the corpus yields `sessions 12, progress 12` (Jun 19–30 only) while `shotMap` holds all 801 shots, so 18 days' dots appear under All Sessions with no pill or row (their `sessionId` falls back to the raw id at `dashboard-data.ts:232`).

Evidence: ingest output (`day-2026-04-15 audit-r1b-1789781687 … 60 45 15 75 78.4`); harness output `source live sessions 12 progress 12 shotMap 801 … mismatches 0`.

Likely cause: `apps/web/lib/dashboard-data.ts:114-148` (`buildDailySessions` keys on the UTC date only) and `:188` (`.limit(12)`); `:189` caps shots at 1000, which will silently truncate the map once the corpus grows.

Suggested fix: key the merge on `deviceId + UTC day` (the backend's own session rule) and show the title/device as a column or pill tooltip; raise or paginate the session limit and derive the shot query from the kept sessions; export the pure functions and add `lib/dashboard-data.test.ts` driven by both fixtures.

### D10 — Small things a stranger notices

Severity: **minor**

- `favicon.ico` → 404 on every load; `public/` has `basketball-logo.svg` but `layout.tsx` declares no `icons`.
- `<span class="relative flex" aria-label="Live">` fails `aria-prohibited-attr` (Lighthouse ×3); use `role="img"` or put the label on the badge text.
- The ingest function validates the body before the key: `POST {"x":1.5}` with no key → `400 Missing field: id`, so an unauthenticated caller can probe the schema. Check `x-device-api-key` first.
- `sessions.started_at` is the first ingested event's time, not `min(captured_at)` (23:00:03 vs 23:00:00 in this run).
- Chart bars keyed by `${point.label}-${mode}` collide once two sessions share a label (D2/D9).
- Table header says `EFG%` while the toggle says `eFG%`; eFG copy never states the weight.
- Detector: Inter is the only font (`globals.css:15`); fine for Operate mode but nothing else carries brand.

### D11 — The spec's unit-test bar cannot be met without exporting the pure functions

Severity: **minor** (test-infrastructure)

`buildDailySessions`, `buildProgress`, `buildDailyStreaks`, `calculateBestMakeStreak` and `getUtcDateKey` in `apps/web/lib/dashboard-data.ts` are module-private, and `package.json` `test` is `tsx --test lib/*.test.ts`, not vitest. The fixer must export them (or move them to `lib/metrics.ts`) so `lib/dashboard-data.test.ts` can drive them with `tests/fixtures/hoops-rows-2026-09-18.json` and `synthetic-30-sessions.json`. The harness in `docs/reports/evidence/hoops-r1b-corpus-harness.test.ts` shows how to mock `./supabase-admin` with `node --experimental-test-module-mocks` in the meantime.

## UX critique (impeccable `critique`, mode: Operate)

⚠️ DEGRADED: single-context (no sub-agent tool exposed in this session). Assessment A was written from the screenshots and source before the detector ran; detector: 1 warning (`overused-font` Inter), no false positives.

Design specificity: the glass header pill, the orange rim shot map with per-dot confidence, and the green/orange stat tiles belong to this product; the Overview → Progress → Key Metrics → History stack is a generic analytics template. The one screen a stranger would remember (Shot Map) is behind a non-default tab, and the default tab opens on an empty chart.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | LIVE badge + "95 shots recorded" good; empty Progress box reads as "still loading"; no "updated n s ago" though it polls every 5 s |
| 2 | Match system / real world | 2 | "Dec 31" for a 1970 test session; Consistency meta shows the swish rate; eFG weight unstated |
| 3 | User control and freedom | 3 | Pills and tabs reversible; no way to see a session's title/device |
| 4 | Consistency and standards | 1 | One session, three date strings; cards on two bases; `EFG%` vs `eFG%` |
| 5 | Error prevention | 1 | Ingest accepts 1970 and future timestamps; DB outage impersonates a config error |
| 6 | Recognition rather than recall | 2 | Chart has no values, axis or gridlines |
| 7 | Flexibility and efficiency | 3 | Pill filter is instant and touches every panel |
| 8 | Aesthetic and minimalist | 3 | Restrained dark palette, good hierarchy; 35–45 % white text too faint |
| 9 | Error recovery | 1 | Mock fallback hides failures; no health route |
| 10 | Help and documentation | 1 | Nothing about where the data comes from or that the app is a stub; zero links |
| **Total** | | **19/40** | Below average: right numbers, untrustworthy presentation |

Cognitive load: 4 cards + 3 chart modes + 5 pills + 2 tabs is fine; the failure is trust, not volume. Emotional journey: confident header, Overview lands, then the empty Progress box is the valley and the visitor leaves before finding the Shot Map. Strengths: shot map with per-dot titles; instant filtering; the LIVE affordance. Persona red flags: a recruiter (first-timer) sees an empty chart and a "Dec 31" row and assumes the demo is broken; a data-literate visitor recomputes Consistency from the table, gets 85.9 vs 67.6, and stops trusting every card. Priority for the fixer: D1, D2, D3, D6, D7, then D4/D5/D8/D9. Provocative question: should the Shot Map be the default tab, with the analytics stack below it?

## Known limitations that are NOT defects

- The iPhone capture app is a stub by design (README); the audit only requires the page to say so.
- Dark-only: `prefers-color-scheme: light` renders the same page (body `rgb(5,5,5)`); the spec does not require a light theme.
- Day-merging one device's sessions into a UTC day is deliberate (`a48ee63`); D9 is about cross-device merging, the missing title and the 12-row cap.
- Real Chrome on macOS cannot present a 390 px viewport (window minimum ≈ 500 px); the phone bars were measured with Playwright mobile emulation in both engines, which is the same renderer.
- The Management API `secrets` value for `INGEST_API_KEY` is not what the function accepts; `~/.config/portfolio-ops/hoops-ingest.key` is (incidents.md, ops only).
- Playwright's WebKit is Safari's engine, not Safari.app; no macOS Safari automation is exposed to the agent.

## How a fixing agent should verify the fix

```bash
# 1. Numbers still right (regenerate both fixtures first if D5 changes the eFG formula)
curl -s https://hoops.kalpkan.com/api/dashboard > /tmp/hoops-payload.json
python3 ~/projects/basketball/tests/compute-expected-metrics.py --check /tmp/hoops-payload.json   # exit 0

# 2. Bars render, dates agree, no console errors, phone table scrolls (Chromium + WebKit, 3 timezones)
mkdir -p /tmp/hoops-audit && cd /tmp/hoops-audit && ln -sfn ~/projects/promptflip/node_modules node_modules
S=/tmp/hoops-audit node ~/projects/portfolio/docs/reports/evidence/hoops-r1b-playwright-audit.mjs > results.json
#   expect in every config: errors []; every bars[].renderedH > 0 in all three modes; pillLabels[1..] == chartLabels (reversed) == rows[].[0] date part,
#   identical across UTC/Toronto/Tokyo; tableWrap.overflowX "auto"; every btns[].h >= 40; hasNotice true; repoLink true; scrollWidth <= 390 on phone
#   (edit `const engines` to add webkit: `npx playwright@1.63.0 install webkit` once)

# 3. 30-session corpus: all 30 survive and the phone chart does not widen the page
cd ~/projects/basketball/apps/web && cp ~/projects/portfolio/docs/reports/evidence/hoops-r1b-corpus-harness.test.ts lib/__corpus.test.ts && \
  OUT=/tmp/synthetic-30-payload.json npx tsx --experimental-test-module-mocks --tsconfig tsconfig.test.json --test lib/__corpus.test.ts; rm lib/__corpus.test.ts
#   expect: sessions 30, mismatches 0; then render + measure with hoops-r1b-synthetic30-render.tsx / -measure.mjs: pageScrollW 390 on phone, barsZero 0

# 4. Epoch session hidden, ingest rejects bad timestamps
curl -s https://hoops.kalpkan.com/api/dashboard | jq '[.sessions[] | select(.startedAt < "2000")] | length'   # 0
KEY=$(cat ~/.config/portfolio-ops/hoops-ingest.key)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/hoops-ingest-shot \
  -H 'content-type: application/json' -H "x-device-api-key: $KEY" \
  -d '{"id":"'$(uuidgen)'","deviceId":"verify","sessionId":"'$(uuidgen)'","capturedAt":"1970-01-01T00:00:00Z","result":"made","x":0.5,"y":0.5,"confidence":0.9}'   # 400
# same with capturedAt 30 days ahead → 400; then POST tests/fixtures/synthetic-tap-session.json with a fresh device on a fresh date → its own row 3/2/1;
# delete afterwards via the Management API SQL endpoint (delete from hoops.shot_events where session_id in (select id from hoops.sessions where device_id like 'verify%'); delete from hoops.sessions where device_id like 'verify%')

# 5. Health route and honest failure banner
curl -s https://hoops.kalpkan.com/api/health            # {"ok":true,"db":"ok",...}
cd ~/projects/basketball/apps/web && SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co SUPABASE_SERVICE_ROLE_KEY=x npx next dev -p 3123 &
sleep 10; curl -s localhost:3123/api/dashboard | jq '.source, .dataError'; curl -s localhost:3123/ | grep -c 'could not'; curl -s localhost:3123/api/health; kill %1

# 6. Unit tests, schema test, Lighthouse
cd ~/projects/basketball && npx pnpm test && bash supabase/migrations/test_hoops_schema.sh
for i in 1 2 3; do npx lighthouse@12 https://hoops.kalpkan.com --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility --output=json --output-path=/tmp/lh-$i.json; done
#   expect performance >= 0.85 ×3, no color-contrast or aria-prohibited-attr failures
```

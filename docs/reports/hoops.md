# hoops (Basketball Stat Tracker) functional audit — 2026-09-18 (TEST + CRITIQUE round 1)

Live URL https://hoops.kalpkan.com · Repo `KalpKan/Basketball-Stat-Tracker` (local `~/projects/basketball`, audited at commit `b34f00e`) · Vercel project `v0-basketball-analytics-dashboard` (Root Directory `apps/web`) · Database Supabase Project B `platform` (`yzppfufqaekgaxcrsqxp`), schema `hoops` · Health route: **none on the dashboard host** (`/api/health` → 404); Project B `https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health`

Spec and bars: `docs/reports/hoops-spec.md`. Method: claude-in-chrome on the live URL (real Chrome, `America/Toronto`); Playwright Chromium 1.63 headless on the live URL at 1440 × 900 and 390 × 844 in `UTC`, `America/Toronto` and `Asia/Tokyo`, dark and light `prefers-color-scheme` (`docs/reports/evidence/hoops-r1-playwright-audit-2026-09-18.json` is the raw run); Lighthouse 12 × 3; `tests/compute-expected-metrics.py --check` against the live payload; the ingest function exercised with the synthetic 3-shot session plus bad inputs (rows deleted afterwards; DB back to 5 sessions / 95 shots); a local `next dev` with a bogus `SUPABASE_URL` for the DB-failure story; repo tests; `impeccable` critique in degraded single-context mode (no sub-agent tool exposed).

## Verdict: PARTIALLY WORKING

The numbers are right (every count, FG%, eFG%, swish rate and streak per UTC day matches the independent ground truth, exit 0) and the page reads real rows from the `hoops` schema. But a stranger would not trust it: the Progress chart is an empty box (every bar renders at 0 px), a 1970 test session sits in the history as "Wed, Dec 31", every load outside UTC throws React #418 and shows the same session under two different dates, the Session History table is cut off on a phone, nothing says the iPhone app does not exist, and a database outage would show sample numbers with a banner telling the visitor to set an env var. 1 of 10 stories meets its bar.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| 1 | Live dashboard within 3 s, LIVE, no Demo banner, no console errors, totals match DB | **FAIL** (partial) | `/api/dashboard` `source: "live"`, `totalShotsRecorded` 95 = `select count(*) from hoops.shot_events` 95; `grep -c 'Demo data'` on the HTML = 0; page load 0.85–1.8 s (Playwright `loadMs` 854–1357, Chrome `loadEventEnd` 1788 ms). Console in a non-UTC browser: `Minified React error #418` on every load (Chrome America/Toronto, Playwright Toronto and Tokyo; 0 errors only with `timezoneId: 'UTC'`) plus `favicon.ico` 404. Lighthouse performance 0.84 / 1.00 / 0.98 (run 1 cold LCP 2.7 s, TBT 410 ms) → fails "≥ 0.85 on 3 of 3"; accessibility 0.91 (color-contrast, aria-prohibited-attr), best-practices 0.96 (errors-in-console). |
| 2 | Overview cards recomputable from the table (same basis, rounding) | **FAIL** | `compute-expected-metrics.py --check` exit 0: counts/FG/eFG/streaks match. `consistency: dashboard=67.6 (raw-session basis 67.6, utc-day basis 85.9)`; the table shows 4 UTC-day rows whose FG% stddev gives 85.9. `avgStreak 10.3` is on the day basis while Consistency is on the raw basis; neither card names its basis ("13.4% swish rate" is the Consistency card's meta). Selecting one session leaves Consistency at the global 67.6 % (Chrome, "Dec 31" pill: `Consistency | 67.6% | 13.3% swish rate`). |
| 3 | Progress chart: one bar per session, value + label on each, 0–100 axis, eFG ≤ 100 | **FAIL** (blocker) | Every bar's rendered height is **0 px** in all six Playwright configs and in Chrome (`style.height` 65.2 % … 100 % but `getBoundingClientRect().height` 0; column height 28 px). Screenshots `hoops-r1-desktop-toronto-2026-09-18.jpg` and `-phone-toronto-` show an empty dashed box with four labels. No numeric value on any bar, no axis, no gridlines. eFG per visible day ≤ 100 only because the 150 % session is merged into the Apr 15 day (78.1 %); `hoops.session_summaries` still returns `efg_percent 150.0` for `90000000-…0100`. |
| 4 | Shot map: every shot a green/red dot, count = filter, legend, Made + Miss = 100 | **PASS** | 95 `<circle>` dots for All Sessions (= `shotMap.length` 95), 0 outside the 0–200 viewBox, 67 green / 28 red; "95 tracked attempts"; tiles 70.5 % + 29.5 % = 100.0; "Dec 31" filter → 23 dots, "23 tracked attempts", 65.2 % + 34.8 %. Hover title `made 100%`. At 390 px the SVG is 320 px wide (35–355 px) and the legend renders below it unclipped (`hoops-r1-phone-shotmap-2026-09-18.jpg`). |
| 5 | Session pill narrows everything; date identical everywhere and in every timezone | **FAIL** | Filtering works (cards, chart, map, table change together). Labels do not agree: All-Sessions chart says `Jan 1` while the pill and table say `Dec 31` / `Wed, Dec 31` in Toronto; after selecting the pill the single chart bar says `Dec 31`. Timezone changes real sessions too: in `Asia/Tokyo` the 2026-09-18 19:40 Z session is the `Sep 19` pill and `Sat, Sep 19` row while the chart says `Sep 18` (Playwright `phone-tokyo`). |
| 6 | One row per real session, nothing that looks like a bug | **FAIL** | Row `Wed, Dec 31 · 23 · 15 · 65.2% · 69.6% · 3` is the 1970-01-01 epoch session (23 shots = 24 % of the corpus). No title/device column, so `T1.1 sample` and `Frontend Backend Smoke Test` are invisible. Other rows match `per_utc_day` ground truth exactly. |
| 7 | Plain sentence that the iPhone app is not available yet, ingest-API test sessions, repo link | **FAIL** | `body.innerText` matches neither `not available` nor `ingest` in any config; no link to the repo anywhere; header copy "Track your shooting performance" + LIVE DATA badge. (No download/App Store wording either, so that half holds.) |
| 8 | 390 px phone: no horizontal scroll, cards stack, pills scroll, table readable, taps ≥ 40 px | **FAIL** | `scrollWidth` 390 = client 390 (pass); cards stack at x = 24 (pass); pills row `overflow-x: auto`, 507 > 342 (pass). Session History `<table>` is 500 px wide inside a 290 px wrapper with `overflow: hidden`: FG% is half cut, EFG% and Best Streak are unreachable (`hoops-r1-phone-toronto-2026-09-18.jpg` bottom). Chart toggles FG% / eFG% / Streak are 36 px tall. Lighthouse contrast failures on `text-white/35` and `/40` (3.1–3.8 : 1). |
| 9 | Ingest: 3 × 200, 401 wrong key, 400 bad coords / pre-2000, dashboard shows the session within 10 s, re-POST idempotent | **FAIL** (partial) | Device `audit-r1-1789763459`: E1–E3 → `200 {"accepted":true}`; wrong key → `401`; `x: 1.5` → `400`; re-POST of the same ids → `200` with the same `created_at`, DB count stayed 3. `hoops.session_summaries` for the session: 3 / 2 / 1, FG 66.7, eFG 83.3, swish 50.0, streak 1 (exact). Dashboard refreshed 9 s later. **But** `capturedAt 1970-01-01T00:00:00Z` → `200` (a new 1970 session appeared: day-1970 row went to 24 attempts) and `2026-10-18` (+30 d) → `200` (an `Oct 18` pill appeared). And the synthetic session never shows as its own row: it is merged with the two existing 2026-04-15 devices into `day-2026-04-15 · 60 · 45 · 15 · 75.0 · 78.4`. All audit rows deleted afterwards; DB back to 5 sessions / 95 shots. |
| 10 | DB unreachable → honest banner, no LIVE badge, `/api/health` | **FAIL** | Local `next dev` with `SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co`: `/api/dashboard` → `source: "mock"`, `totalShotsRecorded 67`, sessions `demo-1..3`; HTML contains `Demo data`, "not connected to a database. Set `SUPABASE_URL` …". LIVE badge correctly absent ("mock data"). `GET /api/health` → 404 locally and on https://hoops.kalpkan.com. |

Cross-cutting: `npx pnpm test` → 4/4 pass (none cover the metric math; no `lib/dashboard-data.test.ts`). `impeccable detect` on the two components: 0 mechanical findings.

## Defects

### D1 — The Progress chart renders no bars at all

Severity: **blocker**

Steps to reproduce: open https://hoops.kalpkan.com (Analytics tab, default). Look at the Progress box. Toggle FG% / eFG% / Streak.

Expected / Actual: four green bars of height 65.2 / 75.4 / 58.3 / 66.7 % with values. Actual: an empty dashed box with the four labels along the bottom; in Chrome `document.querySelectorAll('.h-72 .flex-1 div')` each report `style.height: "65.2%"` but `getBoundingClientRect().height === 0`, column height 28 px. Same in all six Playwright configs.

Evidence: `docs/reports/evidence/hoops-r1-desktop-toronto-2026-09-18.jpg` (Progress box), `hoops-r1-phone-toronto-2026-09-18.jpg`, `hoops-r1-playwright-audit-2026-09-18.json`.

Likely cause: `apps/web/components/dashboard-page.tsx:368-376`. The row `flex h-full items-end gap-4` aligns each column to the bottom instead of stretching it, so the column `flex flex-1 flex-col items-center gap-3` has no definite height and the bar's percentage `height` resolves to 0 (CSS percentage heights need a definite containing-block height).

Suggested fix: make the columns full height and push content to the bottom (`flex h-full flex-1 flex-col items-center justify-end gap-3` and drop `items-end` on the row, or give the bar area an explicit pixel height and compute bar heights in px). While there, print the value above each bar, add a 0–100 axis with gridlines for the percentage modes, and label the max in Streak mode (story 3 bar). A Vitest/DOM test that asserts the rendered bar height > 0 would have caught this.

### D2 — React error #418 on every load outside UTC, and the same session carries different dates on the pill, chart and table (and in different timezones)

Severity: **blocker**

Steps to reproduce: in Chrome with the system timezone America/Toronto (or Playwright `timezoneId: 'Asia/Tokyo'`) open the page; read the console; compare the last pill, the first chart label and the last table row.

Expected / Actual: 0 console errors; one date per session everywhere. Actual: `Minified React error #418` (hydration text mismatch) in Toronto and Tokyo, 0 errors only in UTC. Toronto: pill `Dec 31`, chart `Jan 1`, row `Wed, Dec 31` for the 1970 session. Tokyo: pill `Sep 19`, chart `Sep 18`, row `Sat, Sep 19` for the real 2026-09-18 session, so this is not only the epoch row.

Evidence: Chrome console excerpt in `hoops-r1-playwright-audit-2026-09-18.json` (`errors` per config), `hoops-r1-desktop-utc-2026-09-18.jpg` vs `hoops-r1-desktop-toronto-2026-09-18.jpg`.

Likely cause: `apps/web/components/dashboard-page.tsx:480-486` (`formatPillLabel`, `formatTableDate`) format with `Intl.DateTimeFormat("en-US", …)` and no `timeZone`, inside a `"use client"` component that is server-rendered in UTC; `apps/web/lib/dashboard-data.ts:56-61` (`formatSessionLabel`) does the same on the server for the chart. Sessions near a UTC day boundary get one string on the server and another in the browser.

Suggested fix: format every date once, on the server, in `dashboard-data.ts` with `timeZone: "UTC"` (the day-merge key is already the UTC date), add `label`/`dateLabel` to `SessionSummary`, and have the pill, chart and table render that string. Delete the two client-side formatters.

### D3 — A 1970 epoch session is shown as a real session, and the ingest function accepts pre-2000 and future timestamps

Severity: **major**

Steps to reproduce: (a) open the page: the last pill is `Dec 31` (or `Jan 1`), the last table row `Wed, Dec 31 · 23 · 15 · 65.2%`. (b) POST to `hoops-ingest-shot` an otherwise valid event with `capturedAt: "1970-01-01T00:00:00Z"`, then one with `capturedAt` 30 days in the future.

Expected / Actual: rows before 2000-01-01 hidden or labelled invalid and excluded from the Overview/Consistency math, with a muted "23 shots with an invalid timestamp hidden"; both POSTs → `400`. Actual: the epoch session counts in every card (95 attempts, 70.5 %), both POSTs → `200 {"accepted": true}`; a new 1970 shot joined the `day-1970-01-01` row (24 attempts) and an `Oct 18` pill appeared for the future one.

Evidence: audit run output (device `audit-r1-1789763459-epoch` / `-future`, both cleaned up); `tests/fixtures/hoops-expected-metrics.json` `overall.shots_before_2000: 23`.

Likely cause: `supabase/functions/hoops-ingest-shot/index.ts:66-68` only checks `Number.isNaN(Date.parse(body.capturedAt))`; `apps/web/lib/dashboard-data.ts:207-224` maps every `session_summaries` row without a date guard, and `overall_analytics` (`supabase/migrations/0002_analytics_views.sql`) aggregates every shot.

Suggested fix: in the function reject `capturedAt < 2000-01-01` or `> now + 1 day` with `400`; in `getDashboardPayload` drop sessions/shots with `started_at < 2000-01-01` before merging, recompute the overview from the kept shots (or add a `where captured_at >= '2000-01-01'` to the views), and show the hidden count in a muted note. Add a `--check` fixture case for it.

### D4 — Overview "Consistency" and "Avg Streak" are on different bases from each other and from the table, and the basis is never named

Severity: **major**

Steps to reproduce: read the Consistency card (67.6 %) and the four Session History rows; compute `100 − 2·stddev_samp(FG%)` over the rows.

Expected / Actual: 85.9 % (the rows' basis) with meta text "over 4 sessions". Actual: 67.6 %, computed in SQL over the 5 raw sessions including a 1-shot 100 % session; Avg Streak 10.3 is computed in JS over the 4 merged days; the Consistency card's meta text is the swish rate; selecting one session still shows the global 67.6 %.

Evidence: `python3 tests/compute-expected-metrics.py --check` output: `consistency: dashboard=67.6 (raw-session basis 67.6, utc-day basis 85.9)`, `avgStreak: dashboard=10.3 (raw-session basis 8.4, utc-day basis 10.3)`; during the ingest test Consistency moved 67.6 → 64.1 because three 1-shot audit sessions were added, which is how sensitive the raw basis is.

Likely cause: `apps/web/lib/dashboard-data.ts:246` takes `overviewRow.consistency` from `hoops.overall_analytics` (`0002_analytics_views.sql:95-105`, per raw session) while `avgStreak` (`dashboard-data.ts:236-239`) is computed over `buildDailySessions()`; `apps/web/components/dashboard-page.tsx:71` returns `data.overview.consistency` for a single-session selection.

Suggested fix: compute Consistency in `dashboard-data.ts` from the merged day sessions (same formula) so it is reproducible from the table, name the basis in each card's meta ("over 4 sessions", "avg of 4 best streaks"), and show "n/a (1 session)" when one pill is selected. Keep the SQL column for the API but stop displaying it.

### D5 — eFG% proxy exceeds 100 % (150 % on a 1-shot swish session); formula lives in four places

Severity: **major**

Steps to reproduce: `select efg_percent from hoops.session_summaries where session_id = '90000000-0000-4000-8000-000000000100'` → `150.0`; on the page, any UTC day whose only shots are swishes would show > 100 %.

Expected / Actual: eFG ≤ 100 for every session. Actual: 150.0 in the view; the page currently hides it only because the session is merged into Apr 15 (78.1 %).

Evidence: Management API query output above; `hoops-expected-metrics.json` `sessions_with_efg_over_100`.

Likely cause: formula `(made + 0.5·swishes) / attempts` in `supabase/migrations/0002_analytics_views.sql:49-56`, `apps/web/lib/dashboard-data.ts:131` (day merge), `README.md:34`, and the on-page copy `apps/web/components/dashboard-page.tsx:187`.

Suggested fix: redefine as `(made + 0.5·swishes) / (attempts + 0.5·swishes)` (bounded, still rewards swishes) in the view, the JS merge, the README and the Key Metrics copy in one commit; regenerate `hoops-expected-metrics.json` with the new formula and update `compute-expected-metrics.py` (`formulas` block) so `--check` still exits 0.

### D6 — Nothing tells the visitor the iPhone capture app does not exist or where the shots came from

Severity: **major**

Steps to reproduce: open the page at 1440 and 390 px; search the text for "iPhone", "app", "ingest", "not available", "GitHub".

Expected / Actual: a one-sentence notice above the fold ("The iPhone capture app is not available yet; these sessions were recorded through the ingest API for testing") with a link to `https://github.com/KalpKan/Basketball-Stat-Tracker`. Actual: no such text, no link anywhere; header says "Track your shooting performance" beside a pulsing LIVE DATA badge; `<meta name="description">` is "Basketball shooting analytics dashboard".

Evidence: `bodyHasNotAvailable: false` in the Chrome and Playwright runs; `hoops-r1-desktop-toronto-2026-09-18.jpg`.

Likely cause: no such element in `apps/web/components/dashboard-page.tsx` (header lines 105-129); `apps/web/app/layout.tsx:5-8` metadata.

Suggested fix: add a muted one-line notice under the header (with the repo link and a "test sessions" label on rows whose device id is a test device), and reword the subtitle to "Shot-by-shot analytics from a mini hoop; capture app in progress". Keep it out of the Demo banner so it shows in live mode.

### D7 — On a 390 px phone the Session History table is cut off, chart toggles are under 40 px, and secondary text fails contrast

Severity: **major**

Steps to reproduce: Playwright `viewport 390×844, isMobile`, scroll to Session History; measure the FG% / eFG% / Streak buttons; run Lighthouse accessibility.

Expected / Actual: table scrolls in its own container or reflows; every tap target ≥ 40 px; 4.5:1 on secondary text. Actual: `<table>` scrollWidth 500 inside a 290 px wrapper with `overflow: hidden`, so FG% is half visible and EFG% / Best Streak cannot be reached by any gesture; toggles are 36 px tall; Lighthouse color-contrast: `text-white/40` 3.7–3.8:1, `text-white/35` 3.1:1 on the near-black cards.

Evidence: `hoops-r1-phone-toronto-2026-09-18.jpg` (bottom), `hoops-r1-playwright-audit-2026-09-18.json` (`tableWrap`, `btns`), `lh-*.json` color-contrast items.

Likely cause: `apps/web/components/dashboard-page.tsx:194` (`overflow-hidden` wrapper), `:349` (`py-2` toggles), `text-white/35` / `text-white/40` throughout (`:113`, `:126`, `:171`, `:327`, `:376`).

Suggested fix: `overflow-x-auto` on the table wrapper (plus `min-w-[560px]` on the table, or reflow to a card list under `md:`), `py-2.5`/`min-h-10` on the toggles, and raise secondary text to `text-white/60` (≈ 6:1) or make numbers never depend on it.

### D8 — A database failure renders sample numbers under a "set SUPABASE_URL" banner, and there is no `/api/health` on the dashboard host

Severity: **major**

Steps to reproduce: `cd apps/web && SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co SUPABASE_SERVICE_ROLE_KEY=x npx next dev -p 3123`; `curl localhost:3123/api/dashboard`; `curl localhost:3123/`; `curl -I localhost:3123/api/health`. On production: `curl -I https://hoops.kalpkan.com/api/health`.

Expected / Actual: `/api/dashboard` says the database could not be reached (`source: "unavailable"` or `mock` with an `error` field), the banner names the problem ("Shooting data is temporarily unavailable"), `/api/health` returns `{ok, db}`. Actual: `source: "mock"`, 67 sample shots, three `demo-*` sessions; banner "Demo data … not connected to a database. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the hosting settings"; `/api/health` → 404 locally and on the live host (UptimeRobot monitor 804030256 only checks the HTML, which would still be 200).

Evidence: local run output (`source mock total 67`, grep hits `Demo data`, `not connected to a database. Set`, `SUPABASE_URL`, `local health 404`); `curl -s -o /dev/null -w '%{http_code}' https://hoops.kalpkan.com/api/health` → `404`.

Likely cause: `apps/web/lib/dashboard-data.ts:198-207` returns `buildMockPayload()` on any query error, indistinguishable from the missing-env case; `apps/web/components/demo-data-banner.tsx` has one message; no `apps/web/app/api/health/route.ts`.

Suggested fix: distinguish `missing-env` from `query-failed` in the payload (`source: "mock" | "live"`, plus `dataError?: string`), show a red "could not reach the database (…)" banner for the latter and never the env-var text in production, and add `app/api/health/route.ts` that runs `select 1` via `health_select_one()` and returns `{ok, db, service: "hoops"}` (then point the UptimeRobot monitor at it, runbook "Add an UptimeRobot monitor").

### D9 — Sessions from different devices on the same UTC day are merged into one row, so a new session can be invisible; titles are dropped; history is capped at 12 raw sessions

Severity: **major**

Steps to reproduce: POST the handoff doc's 3-shot session (`capturedAt` 2026-04-15T23:00Z, new device id) and open the page.

Expected / Actual: a new row/pill with 3 / 2 / 1, FG 66.7, eFG 83.3, streak 1 (story 9). Actual: the Apr 15 row silently becomes 60 / 45 / 15, 75.0 / 78.4; no pill, no title, no device. The handoff doc promises "all events from the same `deviceId` and UTC calendar day" become one session; the dashboard merges across devices. Separately, `session_summaries` is read with `.limit(12)`, so a 30-session history would show at most 12 raw sessions in the chart and table.

Evidence: ingest run output (`day-2026-04-15 audit-r1-1789763459 … 60 45 15 75 78.4 9 30`); the spec's own baseline note ("two devices merged").

Likely cause: `apps/web/lib/dashboard-data.ts:112-150` (`buildDailySessions` keys on `getUtcDateKey(startedAt)` only) and `:184` (`.limit(12)`).

Suggested fix: key the merge on `deviceId + UTC day` (matching the backend's own session rule) and show the session title (or device id) as a column/pill tooltip; raise the limit (or paginate) and generate the 30-session synthetic set the spec asks for to test the many-bars case.

### D10 — Small things a stranger notices

Severity: **minor**

- `favicon.ico` → 404 on every load (`Failed to load resource: 404` in Lighthouse's console audit; `apps/web/public` has `basketball-logo.svg` but no icon link in `layout.tsx`). Fix: add `icons` to `metadata` pointing at the SVG.
- `<span class="relative flex" aria-label="Live">` fails `aria-prohibited-attr` (Lighthouse); use `role="img"` or move the label to the badge text.
- Lighthouse performance 0.84 on the cold run (LCP 2.7 s, TBT 410 ms) vs 0.98–1.0 warm: the page is `force-dynamic` and waits on three Supabase queries before the first byte. Consider `revalidate = 5` or streaming the shell with a Suspense boundary.
- The ingest function validates the body (`400` for `x: 1.5`) before checking `x-device-api-key`, so an unauthenticated caller can probe the schema. Move the key check to the top.
- Chart bars keyed by `${point.label}-${mode}`: two sessions on the same label (D2/D9) would collide.
- The Progress toggle group and Key Metrics copy describe eFG as "swishes are weighted" without the formula; once D5 lands, state it.

## UX critique (impeccable `critique`, mode: Operate)

⚠️ DEGRADED: single-context (no sub-agent tool exposed in this session; Assessment A written before running the detector, detector ran after: 0 findings).

Design specificity: the glass pills, the orange rim shot map and the green/orange stat tiles are specific to this product; the Overview/Progress/Key Metrics/History stack could be any analytics template. The Shot Map is the one screen a stranger would remember, and it is hidden behind a tab while the default tab opens on an empty chart.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | LIVE badge and "95 shots recorded" are good; but no "updated 5 s ago", and an empty Progress box reads as "loading forever" |
| 2 | Match system / real world | 2 | "Dec 31" for a 1970 test session; eFG copy does not say what a swish is worth; "Consistency" meta shows swish rate |
| 3 | User control and freedom | 3 | Pills and tabs are reversible; no way to see a session's title or device |
| 4 | Consistency and standards | 1 | The same session has two dates on one page; cards use two bases; table header says EFG% while the toggle says eFG% |
| 5 | Error prevention | 1 | Ingest accepts 1970 and future timestamps; the DB-failure state impersonates a config error |
| 6 | Recognition rather than recall | 2 | Chart has no values or axis, so the visitor must recall the table to read it |
| 7 | Flexibility and efficiency | 3 | Pill filter is fast and touches every panel |
| 8 | Aesthetic and minimalist | 3 | Restrained dark palette, good hierarchy; 35 % white text is too faint |
| 9 | Error recovery | 1 | Mock fallback hides failures; no health route |
| 10 | Help and documentation | 1 | No sentence about where the data comes from or that the app is a stub; no repo link |
| **Total** | | **19/40** | Below average: right numbers, untrustworthy presentation |

Cognitive load: 4 metric cards + 3 chart modes + 5 pills + 2 tabs is fine; the failure is not volume but trust (empty chart, contradictory dates). Emotional journey: the header is confident, the Overview lands, then the empty Progress box is the valley and the visitor leaves before finding the Shot Map. Strengths: the shot map with per-dot confidence titles; instant pill filtering; the LIVE affordance. Priority order for the fixer: D1, D2, D3, D6, D7, then D4/D5/D8/D9. Provocative question: should the Shot Map be the default tab, with the analytics stack below it, so the product's one distinctive view is the first thing seen?

## Known limitations that are NOT defects

- The iPhone capture app is a stub by design (README); this audit only requires the page to say so.
- Dark-only: `prefers-color-scheme: light` renders the same black page (body `rgb(5,5,5)`); the spec does not require a light theme.
- Day-merging of one device's sessions into a UTC day is deliberate (`a48ee63` "Group shots by daily session"); the defect in D9 is cross-device merging and the missing title, not the day grouping itself.
- The Management API `GET /v1/projects/{ref}/secrets` value for `INGEST_API_KEY` is not the value the function accepts; the operator copy `~/.config/portfolio-ops/hoops-ingest.key` is (3 × 200). Logged in `incidents.md` for ops; not a product defect.
- Lighthouse's cold-run 0.84 is a Vercel cold start plus three sequential-latency queries; warm runs are 0.98–1.0.

## How a fixing agent should verify the fix

```bash
# 1. Numbers still right (regenerate the fixture first if D5 changes the eFG formula)
curl -s https://hoops.kalpkan.com/api/dashboard > /tmp/hoops-payload.json
python3 ~/projects/basketball/tests/compute-expected-metrics.py --check /tmp/hoops-payload.json   # exit 0

# 2. Bars render, dates agree, no console errors, phone table scrolls (Playwright, any timezone)
cd /tmp && ln -sfn ~/projects/promptflip/node_modules node_modules   # or npx playwright install chromium
node ~/projects/portfolio/docs/reports/evidence/hoops-r1-playwright-audit.mjs   # expect: errors [] in every config;
#   every bar renderedH > 0; pills == chart labels == table dates in UTC, America/Toronto and Asia/Tokyo;
#   tableWrap.overflowX == "auto"; all buttons h >= 40; bodyHasNotice true; scrollWidth <= 390 on phone

# 3. Epoch session hidden, ingest rejects bad timestamps
curl -s https://hoops.kalpkan.com/api/dashboard | jq '[.sessions[] | select(.startedAt < "2000")] | length'   # 0
KEY=$(cat ~/.config/portfolio-ops/hoops-ingest.key)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/hoops-ingest-shot \
  -H 'content-type: application/json' -H "x-device-api-key: $KEY" \
  -d '{"id":"'$(uuidgen)'","deviceId":"verify","sessionId":"'$(uuidgen)'","capturedAt":"1970-01-01T00:00:00Z","result":"made","x":0.5,"y":0.5,"confidence":0.9}'   # 400

# 4. Synthetic session shows as its own row (use a fresh date so it cannot merge with 2026-04-15), then delete it
#    (tests/fixtures/synthetic-tap-session.json; delete via the Management API SQL endpoint: delete from hoops.shot_events where session_id in (select id from hoops.sessions where device_id like 'verify%'); delete from hoops.sessions where device_id like 'verify%')

# 5. Health route and honest failure banner
curl -s https://hoops.kalpkan.com/api/health          # {"ok":true,"db":"ok",...}
cd ~/projects/basketball/apps/web && SUPABASE_URL=https://invalid-project-does-not-exist.supabase.co SUPABASE_SERVICE_ROLE_KEY=x npx next dev -p 3123 &
sleep 20; curl -s localhost:3123/ | grep -c 'SUPABASE_URL'   # 0 ; and the page names the data problem
pkill -f 'next dev -p 3123'

# 6. Tests and Lighthouse
cd ~/projects/basketball/apps/web && npx pnpm test   # includes lib/dashboard-data.test.ts against tests/fixtures/*.json
npx lighthouse https://hoops.kalpkan.com --only-categories=performance,accessibility --chrome-flags='--headless=new' --quiet   # perf >= 0.85 x3, a11y >= 0.95
```

Evidence files for this round: `docs/reports/evidence/hoops-r1-*` (desktop UTC and Toronto, phone Toronto, phone shot map, dashboard payload, Playwright audit JSON, the audit script).

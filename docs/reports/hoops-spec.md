# hoops (Basketball Stat Tracker) — product spec for the Phase 5 audit

_Written 2026-09-18 by the SPEC agent. Read this before auditing or fixing https://hoops.kalpkan.com. The audit report that follows it is `docs/reports/hoops.md` (format: `docs/hosting-plan.md` section 11)._

Live URL https://hoops.kalpkan.com · Repo `KalpKan/Basketball-Stat-Tracker` (local `~/projects/basketball`) · Vercel project `v0-basketball-analytics-dashboard` (Root Directory `apps/web`) · Database Supabase Project B `platform` (`yzppfufqaekgaxcrsqxp`), schema `hoops` · Data route `/api/dashboard` · Project B health `https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health`

Focus set by Kalp for this project: the dashboard must read real rows from the `hoops` schema, look complete and trustworthy with the sample data, show FG% / eFG% / shot map / streaks correctly (math verified against the rows), and make clear that the iOS capture app is not yet available.

## (a) What the project is supposed to do, in its own words

From `README.md`:

> Hoops Analytics is a personal basketball shooting tracker: a web dashboard (live at https://hoops.kalpkan.com) that shows shot maps, session stats and progress, fed by a Supabase backend. The iPhone capture app is a **stub** (two SwiftUI files, no working capture yet); today shots reach the backend through the ingest API described below.

> Product direction: Capture and infer shots on-device on iPhone 15 Pro · Upload structured shot events to Supabase · Visualize session analytics, shot maps, and progress on the web dashboard

> The Edge Function validates the payload, verifies `x-device-api-key`, upserts the session row, and inserts the shot event idempotently by client event `id` · Supabase stores raw events in `hoops.shot_events` and computes dashboard-friendly metrics through SQL views in the `hoops` schema · The dashboard shows a yellow "Demo data" banner (with built-in sample shots) only when the Supabase settings are missing · The Next.js dashboard reads those analytics through a server-side API route and refreshes every 5 seconds

> `eFG%` is a v1 proxy: `((made + 0.5 * swishes) / attempts) * 100` · `consistency` is a practical score derived from session FG% variance: `max(0, min(100, 100 - 2 * stddev(session_fg_percent)))`

From `docs/mobile-backend-handoff.md` (what the backend promises any client):

> Backend resolves all events from the same `deviceId` and UTC calendar day into one canonical session · Re-sending the same event `id` is safe · Invalid coordinates, confidence, timestamps, or result values are rejected · Missing/incorrect `x-device-api-key` returns `401`

> After one or more taps: `shot_map_points` should contain the new rows · `session_summaries` should contain or update the active session · `overall_analytics` should reflect the new totals · `progress_over_time` should include the session once attempts > 0

> Expected aggregate result for that synthetic session: attempts `3`, made `2`, missed `1`, fg_percent `66.7`, efg_percent `83.3`, swish_rate `50.0`, best_streak `1`

From `docs/hosting-plan.md` section 1 (the platform's view of the project):

> Dashboard works; iOS app is a 28-line stub; shows **mock data silently** without env

and section 7 row 4:

> visible "demo data" banner when unconfigured; README says iOS app is a stub

`apps/mobile/README.md` lists only "Planned modules" (camera capture, shot detection, upload); `ContentView.swift` renders two lines of static text. There is no capture code anywhere in the repo.

## (b) User stories

The visitor is anyone who opens the link from the hub (a recruiter, a friend, Kalp on his phone). Nobody logs in; there is nothing to configure.

1. **As a visitor I open https://hoops.kalpkan.com and I see** a dashboard of real shooting data from the `hoops` schema within 3 s, marked LIVE, with no "Demo data" banner, no console errors, and totals (shots recorded, made, missed) that match the database.
2. **As a visitor I read the Overview cards and I see** Shots Made, Field Goal %, Consistency and Avg Streak whose numbers I could recompute from the Session History table on the same page (same basis, same rounding).
3. **As a visitor I open the Progress chart and toggle FG% / eFG% / Streak and I see** one bar per session in date order with a readable value and label on each, a sensible axis (0–100 for percentages), and eFG% never above 100 %.
4. **As a visitor I open the Shot Map tab and I see** every recorded shot as a green (made) or red (missed) dot on the top-down hoop, the "tracked attempts" count equal to the shots in the filter, a legend, and Made-rate / Miss-rate tiles that add to 100 %.
5. **As a visitor I tap a session pill (e.g. "Apr 16") and I see** the cards, chart, shot map and table narrow to that one day, with its date shown the same way everywhere on the page and the same in every timezone.
6. **As a visitor I look at Session History and I see** one row per real session with its date, attempts, made, FG%, eFG% and best streak, and nothing that looks like a bug (no "Dec 31 / Jan 1 1970" row from epoch-zero test timestamps, no 150 % eFG).
7. **As a visitor I wonder where the shots come from and I see**, without scrolling far, a plain sentence that the iPhone capture app is not available yet, that these are ingest-API test sessions, and a link to the repo; nothing on the page invites me to download an app that does not exist.
8. **As a visitor on a 390 px phone I see** the whole dashboard (cards stack, pills scroll sideways, table readable or reflowed) with no horizontal page scroll and every tap target at least 40 px tall.
9. **As an operator I post the 3-shot synthetic session from the handoff doc to `hoops-ingest-shot` and I see** `200 accepted: true` for each, `401` with a wrong key, `400` for out-of-range coordinates, and within 10 s the dashboard shows a new session with attempts 3, made 2, missed 1, FG 66.7, eFG 83.3, swish 50.0, streak 1 (a re-POST of the same ids changes nothing).
10. **As an operator when Supabase is unreachable I see** the dashboard say so honestly (a banner that names the data problem, not "set SUPABASE_URL" when the env is set but the DB is paused) instead of quietly rendering sample numbers under a LIVE label.

## (c) Consumer-grade bar per story (measurable)

| # | Bar (all must hold on https://hoops.kalpkan.com, desktop 1440 px and phone 390 px, Chrome + Safari) |
|---|---|
| 1 | `curl -s /api/dashboard` → `source: "live"`, `totalShotsRecorded` = `select count(*) from hoops.shot_events`; page has 0 `Demo data` matches; Lighthouse performance ≥ 0.85 on 3 of 3 runs; browser console has **0 errors** on load (today: React error #418, a hydration mismatch, is thrown on every load). |
| 2 | `python3 tests/compute-expected-metrics.py --check <payload>` exits 0; the Overview Consistency and Avg Streak use the **same basis as the table rows** (UTC-day sessions) so that recomputing from the visible table reproduces the card within ±0.1 (today: Consistency 67.6 is on the raw 5-session basis while the table shows 4 day rows whose basis gives 85.9). Each card states its basis in its meta text (e.g. "over 4 sessions"). |
| 3 | Every bar shows its numeric value (text, not tooltip only) and a date label with year when the year differs from the current one; percentage modes use a fixed 0–100 axis with at least 2 gridlines; Streak mode labels the max; eFG% per session ≤ 100.0 for every session in the corpus (today: session `90000000-…0100` = 150.0 % from the v1 proxy; bar must be **bounded** by redefining the proxy as `min(100, …)` or `(made + 0.5·swish)/(attempts + 0.5·swish)` and the README + Key Metrics text updated to match). 4 or fewer bars must still fill the width legibly; 30 bars must not overflow (test with the 30-session synthetic set). |
| 4 | Dot count on the SVG = `shotMap.length` for the active filter (95 for All Sessions today); every dot inside the viewBox (x, y ∈ [0,1] → 0–200); hovering a dot names result + confidence; Made rate + Miss rate = 100.0 % ± 0.1; the legend and rim are visible at 390 px without clipping. |
| 5 | Selecting any pill changes cards, chart, map and table together within 1 frame; the label on the pill, the bar and the table row is **identical** for the same session and identical between a UTC render and a `TZ=America/Toronto` render (today: "Jan 1" pill/bar vs "Wed, Dec 31" table row for the 1970 session, and the SSR/CSR mismatch is the source of React #418). Fix by formatting dates in one place with an explicit `timeZone: "UTC"` (or the session's own zone) and passing the string down. |
| 6 | No row, pill or bar for a session whose `started_at` is before 2000-01-01 unless it is labelled "(invalid date)" and excluded from the Overview, Progress and Consistency math; ideally such rows are filtered server-side in `getDashboardPayload` and the count of hidden shots is shown in a muted note ("23 shots with an invalid timestamp hidden"). Every remaining row's FG%, eFG%, streak equals `tests/fixtures/hoops-expected-metrics.json` `per_utc_day` for its `day_id`. The table shows the session title (`T1.1 sample`, `Manual Tap Test`) or device when present. |
| 7 | Above the fold on desktop and within the first two screens on a phone, a visible notice reads (in substance) "The iPhone capture app is not available yet; these sessions were recorded through the ingest API for testing" with a link to `https://github.com/KalpKan/Basketball-Stat-Tracker`; no App Store badge, no "download" wording anywhere; the `<title>`/OG description does not promise phone capture. |
| 8 | At 390 px: `document.documentElement.scrollWidth <= 390`; cards stack in one column; the pills row is scrollable with the active pill visible; the Session History table either horizontally scrolls inside its own container or reflows to cards; no text is clipped; every button/pill has a rendered height ≥ 40 px; contrast of secondary text (`text-white/35` today) meets 4.5:1 or is not the only carrier of a number. |
| 9 | Using `tests/fixtures/synthetic-tap-session.json` with fresh UUIDs and a new `deviceId`: three `200` responses with `accepted: true`; re-POST → `200`, DB count unchanged; wrong key → `401`; `x: 1.5` → `400`; `capturedAt: "1970-01-01T00:00:00Z"` → `400` (new: the function must reject timestamps before 2000 or more than 1 day in the future, so the epoch bug can never recur); the dashboard shows the new session with exactly the expected aggregates within 10 s (its 5 s poll). Clean up afterwards with a documented `delete` statement or leave the session titled "Manual Tap Test" and note it in the report. |
| 10 | With the Supabase env present but the query failing (simulate by pointing `SUPABASE_URL` at a paused/invalid project in a preview deployment), `/api/dashboard` returns `source: "mock"` **and** the banner text says the database could not be reached (not "set SUPABASE_URL"); the LIVE badge is not shown; the page still renders. A `/api/health` route exists on the dashboard host returning `{ok, db}` so UptimeRobot can tell DB failures from page failures (today the monitor only checks the HTML). |

Cross-cutting: `npx pnpm test` passes and includes tests for the pure functions in `lib/dashboard-data.ts` (day-merge, streaks, eFG bound, epoch filter) driven by `tests/fixtures/hoops-rows-2026-09-18.json` against `hoops-expected-metrics.json`; `bash supabase/migrations/test_hoops_schema.sh` prints `PASS`; every fix keeps the app a plain Next.js 15 app on Vercel Hobby with Root Directory `apps/web` (no new services, no card, Supabase stays on Project B schema `hoops`, no third project); PostHog `session_viewed` keeps arriving.

## (d) Test assets

All under `/Users/kalp/projects/basketball/tests/` (committed 2026-09-18; all < 100 KB, no git-lfs needed; device ids are test labels, no personal data).

| Path | Purpose | Status |
|---|---|---|
| `/Users/kalp/projects/basketball/tests/fixtures/hoops-rows-2026-09-18.json` | Snapshot of every `hoops.sessions` (5) and `hoops.shot_events` (95) row in Project B on 2026-09-18: the real corpus the live page renders | created |
| `/Users/kalp/projects/basketball/tests/fixtures/hoops-expected-metrics.json` | Ground truth computed independently (pure Python, no SQL, no app code) for those rows: per session, per UTC day, overall; FG%, eFG%, swish rate, best streak, consistency and avg streak on both bases; anomaly counts (23 epoch shots, 1 session with eFG 150 %) | created |
| `/Users/kalp/projects/basketball/tests/compute-expected-metrics.py` | Regenerates the ground truth; `--check <payload.json>` compares a saved `/api/dashboard` response and exits non-zero on any mismatch (run 2026-09-18 against the live payload: all counts, FG%, eFG%, swish rate and streaks match; consistency basis mismatch printed) | created |
| `/Users/kalp/projects/basketball/tests/snapshot-hoops-rows.sh` | Re-snapshots the schema through the Management API SQL endpoint (needs `SUPABASE_ACCESS_TOKEN`; prints no secrets) | created |
| `/Users/kalp/projects/basketball/tests/fixtures/synthetic-tap-session.json` | The 3-event synthetic session from `docs/mobile-backend-handoff.md` with its promised aggregates (verified live as device `t11-sample`) for story 9 | created |
| `/Users/kalp/projects/basketball/tests/fixtures/README.md` | What each fixture is, how to regenerate, and the known anomalies so nobody "fixes" the ground truth | created |
| `/Users/kalp/projects/portfolio/docs/reports/evidence/hoops-spec-desktop-2026-09-18.jpg` | Screenshot of the live page on 2026-09-18 showing the "Dec 31" pill next to "95 shots recorded" (baseline for stories 5–7) | created |
| Baseline numbers (from the live payload 2026-09-18 20:16Z) | overview attempts 95 / made 67 / missed 28 / FG 70.5 / consistency 67.6 / avgStreak 10.3 / swish 13.4; day rows `day-2026-09-18` 3/2/1 66.7/83.3/streak 1, `day-2026-04-16` 12/7/5 58.3/70.8/7, `day-2026-04-15` 57/43/14 75.4/78.1/30 (two devices merged), `day-1970-01-01` 23/15/8 65.2/69.6/3 | recorded |
| Still to create by the fixer (not needed to audit) | a 30-session synthetic generator for the "many bars" case in story 3, and a Vitest/node test file `apps/web/lib/dashboard-data.test.ts` that imports the two fixtures (needs the pure functions exported) | to do |

## Baseline observations (2026-09-18, for the auditor; not a full audit)

- Live payload matches ground truth on every count, FG%, eFG%, swish rate and streak per UTC day (`compute-expected-metrics.py --check` exit 0).
- Console: `Minified React error #418` on every load (hydration text mismatch). Cause: `formatPillLabel`/`formatTableDate` run `Intl.DateTimeFormat` without a `timeZone` in a client component that is server-rendered in UTC, so any session near a UTC day boundary renders differently on the server and in the visitor's browser. The 1970 session shows it plainly: "Jan 1" (server/chart) vs "Dec 31" (client pill and table) on the same page.
- 23 shots (24 % of the corpus) sit on 1970-01-01 and are presented as a normal session; a visitor cannot tell this is corrupt test data.
- Consistency 67.6 % is computed over 5 raw sessions (including a 1-shot 100 % session) while the page shows 4 merged day rows; the same formula over the visible rows gives 85.9 %.
- eFG% v1 proxy exceeds 100 % for any session where most makes are swishes (150 % in the corpus); the Overview never shows overall eFG% at all (only the chart/table do).
- Nothing on the page says the iPhone app does not exist yet; the header copy "Track your shooting performance" and the LIVE badge imply a working capture pipeline.
- Query failures fall back to `buildMockPayload()` (`lib/dashboard-data.ts`) with `source: "mock"`, and the banner then tells the operator to set env vars that are already set; there is no `/api/health` on the dashboard host.
- Repo tests: 4 node tests pass (`npx pnpm test`); none cover the metric math.

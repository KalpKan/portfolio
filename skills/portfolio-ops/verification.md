# Verification

The exact commands and URLs that prove each part of the platform is healthy. Use these to go from "something is wrong" to "this specific thing is wrong" in minutes, and to prove a task is done before reporting it. Paste actual output, not a description of it.

Rows marked **PENDING** target something the plan calls for but that is not live yet; the command is written now so it is ready, and the row is updated (with the real URL and a "confirmed on <date>" note) by the task that makes it live. The source list is `docs/hosting-plan.md` section 10.

Placeholders: `<domain>` is `kalpkan.com` (bought at human checkpoint H1 on 2026-09-18); `<prod-url>` is the `*.vercel.app` URL of an app that has not been moved onto the domain yet.

## Quick triage (the "first 5 checks" from SKILL.md, as commands)

| # | Check | Command | Healthy output | Status |
|---|---|---|---|---|
| 1 | UptimeRobot status page | open `https://stats.uptimerobot.com/a6n3Wx3PBp`; via API (after `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`): `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=804030255-804030256-804030271" \| jq '.monitors[] \| {friendly_name, status}'` | the three platform monitors `status: 2` (up); the six paused `shop.travisscott.com` monitors (`status: 0`) are Kalp's old ones and are not a failure | confirmed 2026-09-18 (T0.3). A custom `status.<domain>` is a paid feature and is not planned |
| 2 | Failing app's health route | `curl -sf https://<prod-url>/api/health` | promptflip: JSON containing `"db":"ok"`; hub: `{"ok":true,"service":"hub","time":"..."}` | promptflip live; hub PENDING (T0.1) |
| 3 | Vercel deployment logs | `npx vercel ls <project> --scope kks-projects-2edcb11a` then `npx vercel inspect <deployment-url> --logs` | newest deployment state `Ready`, no build errors | works now |
| 4 | Supabase project status | Supabase dashboard project list, or Supabase MCP `list_projects` | both projects `ACTIVE_HEALTHY`, none `INACTIVE` (paused) | works now (dashboard); MCP after H0 |
| 5 | Cloudflare DNS record | `dig +short <sub>.kalpkan.com` and `dig +short kalpkan.com` | subdomain: the project-specific `<hash>.vercel-dns-017.com` name that `npx vercel domains verify <host>` printed when the record was created (recorded in `docs/DNS_PENDING.md` §5); apex: `76.76.21.21` | confirmed 2026-09-18: `kalpkan.com` → `76.76.21.21`; `www.kalpkan.com` → `a9e60d5e9d41cb23.vercel-dns-017.com.`; `hoops.kalpkan.com` → `71da701c9c3d8bdf.vercel-dns-017.com.` |

## Per-component checks

### Hub (`KalpKan/portfolio`, Vercel project `portfolio`, https://kalpkan.com)

| Check | Command | Expect | Status |
|---|---|---|---|
| Health route | `curl -sf https://kalpkan.com/api/health` | `{"ok":true,"service":"hub","time":"<ISO>"}` with header `cache-control: no-store` (`curl -sI ... \| grep -i cache-control`) | ✅ 2026-09-18 |
| Page serves | `curl -sI https://kalpkan.com \| head -1` | `HTTP/2 200` | ✅ 2026-09-18 |
| Status proxy | `curl -s https://kalpkan.com/api/status/promptflip` | `{"slug":"promptflip","ok":true,...}`; `ok:false` means promptflip's health route did not answer 2xx JSON `ok: true` (see `lib/health.ts`) | ✅ 2026-09-18 |
| Share card | `curl -sI https://kalpkan.com/opengraph-image \| head -1` and `curl -s https://kalpkan.com \| grep -o 'og:image" content="[^"]*'` | `HTTP/2 200`; an absolute `https://kalpkan.com/opengraph-image?...` URL | ✅ 2026-09-18 (hub polish) |
| Registry valid | `cd ~/projects/portfolio && npm test` | all cases in `lib/projects.test.ts`, `lib/health.test.ts`, `components/ContactRow.test.tsx`, `lib/posthog.test.ts` pass | ✅ 2026-09-18 |
| Build clean | `cd ~/projects/portfolio && npm run lint && npm run build` | no errors | ✅ 2026-09-18 |
| CI green | `gh run list --repo KalpKan/portfolio --limit 1` | latest run `completed success` | ✅ 2026-09-18 |
| Node versions agree | `grep node-version .github/workflows/ci.yml`; `grep -A1 engines package.json`; Vercel → project `portfolio` → Settings → General → Node.js Version | all `22` (pinned 2026-09-18 via `PATCH /v9/projects/<id> {"nodeVersion":"22.x"}`) | ✅ 2026-09-18 |
| Lighthouse performance | `npx lighthouse https://kalpkan.com --only-categories=performance --quiet --chrome-flags="--headless" --output=json \| jq .categories.performance.score` | `>= 0.9` | ✅ 0.92 at T0.1; re-run after the polish batch (see STATUS.md session log) |
| Live marks | open https://kalpkan.com; a `live` app with a `healthUrl` gets a filled cobalt pad and "health-checked" within ~8 s | filled for every live app; dashed for `coming`; triangle for case studies; a flat quiet mark is "no health url", not an error | ✅ 2026-09-18 |
| Layout at four widths | in Chrome, view at 390, 700, 768 and 1440 px wide in light and dark (`document.documentElement.dataset.theme = "dark"` forces dark) | phone: 12-pad strip + first row visible without scrolling; tablet: strip capped at 48px pads; desktop: 4-column sticky map beside the list; no horizontal scroll anywhere | ✅ 2026-09-18 (`docs/images/hub-polish/`) |

### promptflip (`KalpKan/promptflip`, Vercel project `promptflip-35qv` (the only one since H5, 2026-09-18), Supabase Project A)

| Check | Command | Expect | Status |
|---|---|---|---|
| Health (DB-touching) | `curl -sf https://promptflip.kalpkan.com/api/health` | JSON with `"db":"ok"` | confirmed 2026-09-18: `{"ok":true,"db":"ok",...,"commit":"aff55a5...","region":"pdx1"}` (the `promptflip-35qv.vercel.app` alias returns the same) |
| Page serves | `curl -sI https://promptflip.kalpkan.com \| head -1` | `HTTP/2 200` | confirmed 2026-09-18 (Let's Encrypt cert `cert_QAufduOZKLgVC3Bvb9bon3qi`) |
| Env vars present (names only) | `cd ~/projects/promptflip && npx vercel env ls --scope kks-projects-2edcb11a` (linked to `promptflip-35qv` since 2026-09-18) | the six names in `settings-map.md` all listed for `production`; `NEXT_PUBLIC_APP_URL` pulled with `npx vercel env pull --environment production <scratch file>` reads `https://promptflip.kalpkan.com` | confirmed 2026-09-18 |
| Google sign-in works on the new domain | open `https://promptflip.kalpkan.com`, click Sign in with Google | Google consent screen appears with no `redirect_uri_mismatch` / `origin_mismatch` error; after login the redirect returns to `promptflip.kalpkan.com` | confirmed 2026-09-18: from `https://promptflip.kalpkan.com/login` the Google "Choose an account" screen opened (continue to `nhddxonizdxwbvwcxklu.supabase.co`, `redirect_to=https://promptflip.kalpkan.com/auth/callback`), no error; login not completed by the agent, so the round trip back to the host is still unconfirmed by a human |

### basketball / hoops (`KalpKan/Basketball-Stat-Tracker`, Vercel project `v0-basketball-analytics-dashboard`, Supabase Project B schema `hoops`)

| Check | Command | Expect | Status |
|---|---|---|---|
| Dashboard reads real rows | `curl -s https://hoops.kalpkan.com/api/dashboard \| jq -c '{source, totalShotsRecorded}'` | `"source":"live"` and a count > 0 (`95` on 2026-09-18); `"mock"` means the Supabase env vars are missing or Project B is paused | confirmed 2026-09-18 (T1.1); same on the public alias `https://v0-basketball-analytics-dashboard-seven.vercel.app` |
| Demo banner absent | `curl -s https://hoops.kalpkan.com/ \| grep -c 'Demo data'` | `0` (the banner only renders when `/api/dashboard` says `mock`) | confirmed 2026-09-18 |
| Page serves | `curl -sI https://hoops.kalpkan.com \| head -1` | `HTTP/2 200`, `server: Vercel` | confirmed 2026-09-18 |
| PostHog proxy | `curl -sI https://hoops.kalpkan.com/ingest/static/array.js \| head -1`; in a browser, the Network tab shows `POST /ingest/e/` and `/ingest/s/` returning 200 | `HTTP/2 200` | confirmed 2026-09-18 |
| Custom events arrive | `curl -s "$POSTHOG_HOST/api/projects/616829/events/?event=session_viewed&limit=1" -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" \| jq -c '.results[] \| {event, host: .properties["$host"]}'`; same with `event=shot_ingested` | one row each with `host: hoops.kalpkan.com` | confirmed 2026-09-18 (`session_viewed` from a pill click, `shot_ingested` from the Edge Function) |
| Tests and typecheck | `cd ~/projects/basketball && npx pnpm test && npx pnpm --filter @basketball-stat-tracker/web typecheck` | `# pass 4`, `# fail 0`, tsc silent | confirmed 2026-09-18 |
| Migrations never touch `public` | `bash ~/projects/basketball/supabase/migrations/test_hoops_schema.sh` | `PASS` | confirmed 2026-09-18 |
| Numbers match ground truth | `curl -s https://hoops.kalpkan.com/api/dashboard > /tmp/hoops-payload.json && python3 ~/projects/basketball/tests/compute-expected-metrics.py --check /tmp/hoops-payload.json` (re-snapshot first with `tests/snapshot-hoops-rows.sh` if shots were added since 2026-09-18 and point `ROWS` at the new file) | exit 0 and `all counts, FG%, eFG%, swish rate and streaks match the ground truth`; the two printed basis lines show which basis Consistency/Avg Streak use | confirmed 2026-09-18 (SPEC agent): counts/FG/eFG/streaks match; Consistency is on the raw-session basis (67.6) while the table is per UTC day (85.9), see incidents.md |
| No console errors on load | open `https://hoops.kalpkan.com` in a real Chrome tab, read the console | 0 errors | **FAIL 2026-09-18**: `Minified React error #418` (hydration mismatch from timezone-dependent date labels; incidents.md); re-check after the Phase 5 fix |
| Spec + fixtures for the audit | `ls ~/projects/basketball/tests/fixtures/` and `~/projects/portfolio/docs/reports/hoops-spec.md` | `hoops-rows-2026-09-18.json`, `hoops-expected-metrics.json`, `synthetic-tap-session.json`, `README.md`; spec lists 10 user stories with measurable bars | created 2026-09-18 |
| Env names present | `cd ~/projects/basketball && npx vercel env ls production --scope kks-projects-2edcb11a` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | confirmed 2026-09-18 |

### Supabase (two projects, never three)

| Check | Command | Expect | Status |
|---|---|---|---|
| Project count / both active | `set -a; source ~/.config/portfolio-ops/secrets.env; set +a; curl -s https://api.supabase.com/v1/projects -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \| jq -c '.[] \| {name,status}'` | exactly two `ACTIVE_HEALTHY`: `PromptFlip` (A, `nhddxonizdxwbvwcxklu`) and `platform` (B, `yzppfufqaekgaxcrsqxp`); `plato-course-converter` and `KalpKan's Project` stay `INACTIVE` | confirmed 2026-09-18 (T1.1): PromptFlip + platform `ACTIVE_HEALTHY`, other two `INACTIVE` |
| `hoops` schema exposed and populated | `curl -s -X POST https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp/database/query -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query":"select (select count(*) from hoops.sessions) as sessions, (select count(*) from hoops.shot_events) as shots"}'` and `curl -s https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp/postgrest -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \| jq -r .db_schema` (print only `db_schema`; the full response holds the JWT secret) | counts > 0 (5 sessions / 95 shots on 2026-09-18); `db_schema` contains `hoops` | confirmed 2026-09-18 (T1.1) |
| Keep-alive proven | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=804030255-804030499&custom_uptime_ratios=8" \| jq '.monitors[] \| {friendly_name, custom_uptime_ratio}'` (`promptflip health (DB)` = Project A, `platform health (DB, Project B)` = Project B) | `"100.000"` for both (8-day uptime ratio, past the 7-day pause threshold) with no manual restore in `incidents.md` | Project A monitor live since 2026-09-18 (T0.3); Project B monitor `804030499` live since 2026-09-18 (T1.1); earliest confirmation 2026-09-26 |
| Project B health function | `curl -sf https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health` | `{"ok":true,"db":"ok","project":"platform","time":"..."}` (calls `hoops.health_select_one()`, i.e. `select 1`, through PostgREST) | confirmed 2026-09-18 (T1.1); UptimeRobot monitor `804030499` on it |
| Ingest function rejects a bad key | `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/hoops-ingest-shot -H 'content-type: application/json' -H 'x-device-api-key: wrong' -d '{"id":"x","deviceId":"d","sessionId":"s","capturedAt":"2026-01-01T00:00:00Z","result":"made","x":0.5,"y":0.5,"confidence":1}'` | `401` | confirmed 2026-09-18 (T1.1) |
| Quota | Supabase dashboard, Project B, Usage | DB, storage, egress, Realtime each under 10 percent | PENDING (monthly glance once Phase 1 lands) |

### Plato (`KalpKan/Plato`, Vercel project `plato`, Neon database `plato`)

| Check | Command | Expect | Status |
|---|---|---|---|
| Page up | `curl -sI https://plato.kalpkan.com \| head -1` | `HTTP/2 200` | verified 2026-09-18 |
| Health + DB | `curl -s https://plato.kalpkan.com/api/health` | `{"db":"ok","ok":true,"service":"plato"}` (503 with `db: error` means Neon, not Vercel) | verified 2026-09-18 |
| Static via CDN | `curl -sI https://plato.kalpkan.com/static/style.css \| head -1` | `HTTP/2 200` | verified 2026-09-18 |
| Deploy state | `cd ~/projects/plato && npx vercel@latest ls --scope kks-projects-2edcb11a \| head -5` | newest production deployment `● Ready` | verified 2026-09-18 |
| DNS | `dig +short plato.kalpkan.com` | `89cbb06df93ddb6b.vercel-dns-017.com.` then Vercel IPs; `curl -sI https://plato.kalpkan.com \| grep -i ^server:` → `Vercel` | verified 2026-09-18 |
| Real flow (no browser) | `CJ=$(mktemp); curl -s -c $CJ -b $CJ -o /dev/null -w '%{http_code}\n' -F "pdf_file=@<outline>.pdf" https://plato.kalpkan.com/upload; curl -s -c $CJ -b $CJ -o out.ics -w '%{http_code} %{content_type}\n' -d 'lecture_section=0&lab_section=none' https://plato.kalpkan.com/review; grep -c BEGIN:VEVENT out.ics` | `302`, then `200 text/calendar; charset=utf-8`, then a count ≥ 3 | verified 2026-09-18 (KIN 2000 outline → 7 VEVENTs, all inside Jan 8 to Apr 30 2026) |
| Timing | `for i in 1 2 3 4 5; do curl -s -o /dev/null -w '%{time_total}\n' https://plato.kalpkan.com/api/health; done` | warm p50 well under 1 s (measured 0.31 s; `/` 0.17 s); first request after idle 2 to 3 s | verified 2026-09-18 |
| Neon wakes | same health curl after 10 idle minutes | 200, under 3 s | measured 2.2 s on the first request after deploy |
| Analytics | `curl -s -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" "https://us.posthog.com/api/projects/616829/events/?limit=50" \| jq -r '.results[] \| select(.properties.app=="plato") \| [.timestamp,.event] \| @tsv'` after one real upload | rows for `pdf_uploaded`, `pdf_parsed`, `ics_downloaded`; `$pageview`/`$autocapture` rows carry `$current_url` on `plato.kalpkan.com` | verified 2026-09-18 |
| Tests | `cd ~/projects/plato && .venv/bin/pytest -q` | `29 passed` (includes the `/ingest` header-whitelist test, the download guard and the unique-tmp-upload test) | verified 2026-09-18 (fixer) |
| Proxy leaks nothing | `cd ~/projects/plato && .venv/bin/pytest -q tests/test_analytics.py -k cookie` (the live proxy cannot be observed from outside; the test stubs `urlopen` and asserts the forwarded header set is a subset of the whitelist) | `1 passed` | verified 2026-09-18 (fixer) |
| SDK cached through the proxy | `curl -sI https://plato.kalpkan.com/ingest/static/array.js \| grep -iE 'cache-control\|etag'` | `cache-control: public, max-age=...` and an `etag` line (proves the deploy carries commit `de32e96` or later) | verified 2026-09-18 (fixer) |
| Download guard | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://plato.kalpkan.com/download/x.ics` | `302` to `/` with no cookie; with a cookie that has `pdf_hash` but no chosen section, `302` to `/review` | verified 2026-09-18 (fixer) |
| Phone layout | do **not** use `chrome --headless --window-size=390,844 --screenshot` (desktop headless clamps the layout to 500 px and crops; `incidents.md` 2026-09-18). Instead, in a real Chrome tab on the page: inject `<iframe src="/" style="width:390px;height:844px">` and read `contentDocument.querySelector('.hero-card').getBoundingClientRect()` | card `right` <= iframe `clientWidth`, `scrollWidth == clientWidth` at 390/360/320 | verified 2026-09-18 (fixer): card 12-374 at 386 px |
| Neon tables | `DATABASE_URL="$(cat <scratch>/db_url.txt)" .venv/bin/python scripts/init_db.py` | `tables: extraction_cache, user_choices` / `ping: True` | verified 2026-09-18 |

### DNS (Cloudflare, after H1)

| Check | Command | Expect | Status |
|---|---|---|---|
| Every host resolves | `for h in "" www. promptflip. hoops. plato. plantit. pushups. emotes. microtubules.; do echo -n "${h}kalpkan.com: "; dig +short "${h}kalpkan.com" \| head -1; done` | apex `76.76.21.21`, each subdomain the project-specific `<hash>.vercel-dns-017.com` name recorded in `docs/DNS_PENDING.md` §5 | confirmed 2026-09-18 for apex (`76.76.21.21`), www (`a9e60d5e9d41cb23.vercel-dns-017.com.`), hoops (`71da701c9c3d8bdf.vercel-dns-017.com.`), promptflip (`0e6549802006eaa1.vercel-dns-017.com.`); microtubules (`bb0edf923bf938a4.vercel-dns-017.com.`, 2026-09-18); plato per its own row; plantit/pushups/emotes PENDING their Vercel projects |
| TLS valid | `curl -sI https://<sub>.kalpkan.com \| head -1` for each host | `HTTP/2 200`, no certificate error (`HTTP/2 308` + `location: https://kalpkan.com/` for `www`) | confirmed 2026-09-18: `https://kalpkan.com` → `HTTP/2 200`; `https://www.kalpkan.com` → `HTTP/2 308`, `location: https://kalpkan.com/`; `https://hoops.kalpkan.com` → `HTTP/2 200`; `https://promptflip.kalpkan.com` → `HTTP/2 200`; `npx vercel certs ls` lists certs for `kalpkan.com`, `www.kalpkan.com`, `hoops.kalpkan.com`, `promptflip.kalpkan.com`, all `renew: yes`, 90 d |
| Records are DNS-only | `curl -sI https://<sub>.kalpkan.com \| grep -i '^server:'` | `server: Vercel`, not `cloudflare` (an orange-cloud record shows `cloudflare` and breaks TLS issuance) | confirmed 2026-09-18: `kalpkan.com` and `hoops.kalpkan.com` both `server: Vercel`; every record in the zone has `"proxied": false` |
| Vercel sees the domain | `npx vercel domains ls --scope kks-projects-2edcb11a` and `npx vercel domains verify <host> --scope kks-projects-2edcb11a` | `kalpkan.com` listed (Registrar/Nameservers "Third Party" is expected: the zone stays on Cloudflare); `verify` prints no `invalid_configuration` | confirmed 2026-09-18: `1 Domain found` (`kalpkan.com`); hub health over the domain `curl -s https://kalpkan.com/api/health` → `{"ok":true,"service":"hub",...}` |

### Vercel account (monthly)

| Check | Command | Expect | Status |
|---|---|---|---|
| Plan is still Hobby | Vercel dashboard, team settings, Billing | Hobby, $0 | works now |
| Usage under limits | Vercel dashboard, Usage (30-day window) | Fast Data Transfer, invocations, Active CPU all well under Hobby limits (100 GB, 1 M, 4 CPU-hours) | PENDING (30 days after T0.1) |
| Only live projects exist | `npx vercel project ls --scope kks-projects-2edcb11a` | exactly `portfolio`, `promptflip-35qv`, `v0-basketball-analytics-dashboard`; no `tokengamblecoinflip`, no `promptflip` (deleted 2026-09-18, H5) | confirmed 2026-09-18 (T0.2, re-confirmed after H5) |

### GitHub

| Check | Command | Expect | Status |
|---|---|---|---|
| Old coinflip repos archived | `gh repo view KalpKan/token-gamble-coinflip --json isArchived` and same for `token-coinflip` | `{"isArchived":true}` | confirmed 2026-09-18 (T0.2) |
| No secrets committed | run a secret scan (for example `gitleaks detect --source .`) in any repo before it goes public | no findings | run per task |

### UptimeRobot (monitors created 2026-09-18, T0.3; inventory in `docs/monitors.md`)

Load the key first: `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`. Free plan rate limit is 10 requests per minute, so do not loop these.

| Check | Command | Expect | Status |
|---|---|---|---|
| Monitors exist and are up | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=804030255-804030256-804030271&alert_contacts=1" \| jq '.monitors[] \| {id, friendly_name, url, status, alert_contacts: [.alert_contacts[].id]}'` | exactly `promptflip health (DB)` (804030255, url `https://promptflip.kalpkan.com/api/health` since 2026-09-18), `hoops dashboard` (804030256), `hub health` (804030271), each `status: 2` and `alert_contacts: ["5612875"]` | confirmed 2026-09-18 (T0.3) |
| Every platform monitor, whatever its id | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json" \| jq '[.monitors[] \| select(.status != 0) \| {friendly_name, status}]'` | every non-paused monitor `status: 2`; the count matches the rows in `docs/monitors.md` | confirmed 2026-09-18 (T0.3) |
| Alert contact exists and is active | `curl -s -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" https://api.uptimerobot.com/v3/user/alert-contacts \| jq '.[] \| {id, type, status}'` | `{"id":5612875,"type":"Email","status":"Active"}` | confirmed 2026-09-18 (T0.3) |
| Public status page | `curl -sI https://stats.uptimerobot.com/a6n3Wx3PBp \| head -1`, then open it in a browser | `HTTP/2 200`; page titled "Kalp's projects" lists the three monitors, all green | confirmed 2026-09-18 (T0.3). No `status.<domain>` (paid feature) |
| Status page still contains every monitor | `curl -s -X POST https://api.uptimerobot.com/v2/getPSPs -d "api_key=$UPTIMEROBOT_API_KEY&format=json" \| jq '.psps[0] \| {friendly_name, monitors, standard_url}'` | `monitors` lists every id in `docs/monitors.md`; `standard_url` is `https://stats.uptimerobot.com/a6n3Wx3PBp` | confirmed 2026-09-18 (T0.3) |
| Monitor URL is not a protected alias | `curl -sI <monitor url> \| head -1` for each URL in `docs/monitors.md` | `HTTP/2 200`, never a `302` to `vercel.com/sso-api` (that alias is behind Vercel deployment protection and the monitor would be measuring a login page) | confirmed 2026-09-18 (T0.3) |

### PostHog (T0.5, hub; every later app repeats rows 2 to 4 with its own host)

Load the operator key first: `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`. Ingestion lag is 3 to 5 minutes; poll before concluding an event is missing. posthog-js only captures `$pageview` once the tab is visible, so an automation tab hidden behind others sends no pageview (incident 2026-09-18).

| Check | Command | Expect | Status |
|---|---|---|---|
| Project is the shared one, replay + heatmaps on, inputs masked | `curl -s -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" https://us.posthog.com/api/projects/616829/ \| jq '{name, session_recording_opt_in, heatmaps_opt_in, autocapture_opt_out, session_recording_masking_config}'` | `"Kalp portfolio"`, `true`, `true`, `false`, `{"maskAllInputs": true}` | confirmed 2026-09-18 (T0.5) |
| Reverse proxy works on the hub | `curl -sI https://kalpkan.com/ingest/static/array.js \| head -1` | `HTTP/2 200` (proxied to PostHog; an ad blocker cannot see the third-party host) | confirmed 2026-09-18 (T0.5) |
| Requests are first-party and cookieless | in the browser on `https://kalpkan.com`, run `performance.getEntriesByType('resource').filter(e=>e.name.includes('/ingest/')).map(e=>new URL(e.name).origin)` and `document.cookie` | every origin is `https://kalpkan.com`; cookie string is empty, no `ph_*` localStorage key | confirmed 2026-09-18 (T0.5) |
| Pageview and custom event arrive with the right host | visit the hub in a browser, click one project row, then `curl -s -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" "https://us.posthog.com/api/projects/616829/events/?event=project_card_clicked&limit=3" \| jq -c '.results[] \| {event, host: .properties["$host"], slug: .properties.slug}'` and the same with `event=%24pageview` | one row each with `host: "kalpkan.com"` (the click row also carries `slug`) | confirmed 2026-09-18 (T0.5), excerpt in `docs/analytics.md` |
| Dashboard exists with the three insights | `curl -s -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" https://us.posthog.com/api/projects/616829/dashboards/2112106/ \| jq '[.tiles[].insight.name]'` | `["Visitors by site","Visitors by country","Top demos by usage"]` | confirmed 2026-09-18 (T0.5) |
| Still free, no card | `curl -s -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" https://us.posthog.com/api/billing/ \| jq '{has_active_subscription, stripe_customer_id, limits: [.products[] \| {type, custom_limit_usd, free_allocation}]}'` | `false`, `null`, every `custom_limit_usd` null with a non-zero `free_allocation` (the free plan hard-caps there; see runbook "Check PostHog billing") | confirmed 2026-09-18 (T0.5); evidence `docs/images/posthog-billing-limits.png` |
| Hub unit tests cover the contract | `cd ~/projects/portfolio && npx vitest run lib/posthog.test.ts` | 7 passed (cookieless, `/ingest`, autocapture, masking, rewrites, no-op without key, sendBeacon capture) | confirmed 2026-09-18 (T0.5) |

### microtubules (`KalpKan/Microtubule-Quantification` `web/`, Vercel project `microtubules`, https://microtubules.kalpkan.com)

| Check | Command | Expect | Status |
|---|---|---|---|
| Health file | `curl -sf https://microtubules.kalpkan.com/health.json` | `{"ok":true,"service":"microtubules"}` | confirmed 2026-09-18 |
| Page serves | `curl -sI https://microtubules.kalpkan.com \| head -1; curl -sI https://microtubules.kalpkan.com \| grep -i '^server:'` | `HTTP/2 200`, `server: Vercel` | confirmed 2026-09-18 (cert `cert_fmPCbqPPTF39A1OVZLFfn0sV`, 90 d, renew yes) |
| DNS | `dig +short microtubules.kalpkan.com \| head -1` | `bb0edf923bf938a4.vercel-dns-017.com.` | confirmed 2026-09-18 |
| OpenCV served from the site | `curl -sI https://microtubules.kalpkan.com/opencv.js \| grep -iE '^(HTTP\|cache-control\|content-length)'` | `HTTP/2 200`, `cache-control: public, max-age=31536000, immutable`, `content-length: 10964323` | confirmed 2026-09-18 |
| Accuracy vs Python | `cd ~/projects/microtubules/web && npx vitest run --reporter=verbose` | 4 tests pass; the printed table shows `diff 0.0000` for P1_W1_C1 (24.8321 %), P1_W3_C1 (21.1827 %), P3_W2_C3 (34.7120 %) | confirmed 2026-09-18 |
| Python reference still reproduces the paper | `cd ~/projects/microtubules && .venv/bin/python web/scripts/reference.py` (venv: `python3 -m venv .venv && .venv/bin/pip install opencv-python-headless numpy pandas matplotlib`) | three lines ending `matches Results CSV` | confirmed 2026-09-18 |
| `run_analysis.py` flags | `cd ~/projects/microtubules && .venv/bin/python -m unittest tests/test_run_analysis.py -v` | `Ran 3 tests`, `OK` | confirmed 2026-09-18 |
| Build clean | `cd ~/projects/microtubules/web && npm ci && npm run build` | `✓ built`; `dist/` contains `opencv.js`, `samples/`, `health.json` | confirmed 2026-09-18 |
| No server calls after load | in Chrome open the site, click a sample, read the Network tab | only same-origin requests (`/samples/<name>.png`) plus PostHog `POST /ingest/e/`, `/ingest/s/`, `/ingest/i/v0/e/`; `curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' https://microtubules.kalpkan.com/ingest/e/` → `400` (reached PostHog; `404` = rewrite broken) | confirmed 2026-09-18 (Chrome, live host) |
| Phone width | 390 px viewport (a same-origin `<iframe width=390>` harness over `npx vite preview` when the shared Chrome window will not resize) | buttons wrap, no horizontal scroll, result readable; sample gives the same percentage | confirmed 2026-09-18 (Taxol control → 21.18 %) |
| Custom events arrive | `curl -s "$POSTHOG_HOST/api/projects/616829/events/?event=image_analyzed&limit=1" -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" \| jq -c '.results[] \| {event, host: .properties["$host"], percent: .properties.percent}'`; same with `event=sample_loaded` | rows with `host: microtubules.kalpkan.com`; `image_analyzed` carries `percent`, `width`, `height`, `source` and never image data | confirmed 2026-09-18 (`sample_loaded {sample: P1_W1_C1}`, `image_analyzed {percent: 24.83, width: 77, height: 58, source: sample}`) |
| Lighthouse performance | `npx lighthouse https://microtubules.kalpkan.com --only-categories=performance --quiet --chrome-flags="--headless" --output=json \| jq .categories.performance.score` | `>= 0.9` | ✅ 0.98 on 2026-09-18 (FCP 1.5 s, LCP 2.0 s, TBT 60 ms, CLS 0) |
| Env names present | `cd ~/projects/microtubules && npx vercel env ls --scope kks-projects-2edcb11a` | `VITE_PUBLIC_POSTHOG_KEY` (Production, Preview), `VITE_PUBLIC_POSTHOG_HOST` (Production) | confirmed 2026-09-18 |

### Browser-ML demos (pushups, emotes)

| Check | Command | Expect | Status |
|---|---|---|---|
| Runs on a phone with no server calls | open the demo on a phone over cellular; on desktop, open DevTools Network tab and use the demo | no requests after initial load except the PostHog `/ingest` events | PENDING (Phase 3); microtubules done above |
| Lighthouse performance | same Lighthouse command as the hub, per demo | `>= 0.9` | PENDING (Phase 3) |

### Money (month end, every month)

| Check | Command | Expect | Status |
|---|---|---|---|
| Nothing charged | Cloudflare billing (domain only), Vercel $0, Supabase $0, Neon $0, Firebase $0, PostHog $0 | matches the spend tracker in `STATUS.md` | PENDING (first month end after H1) |

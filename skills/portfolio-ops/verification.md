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

### Hub (`KalpKan/portfolio`, Vercel project `portfolio`)

| Check | Command | Expect | Status |
|---|---|---|---|
| Health route | `curl -sf https://<prod-url>/api/health` | `{"ok":true,"service":"hub","time":"<ISO>"}` with header `cache-control: no-store` (`curl -sI ... \| grep -i cache-control`) | PENDING (T0.1) |
| Page serves | `curl -sI https://<prod-url> \| head -1` | `HTTP/2 200` | PENDING (T0.1) |
| Registry valid | `cd ~/projects/portfolio && npm test` | all `lib/projects.test.ts` cases pass | PENDING (T0.1) |
| Build clean | `cd ~/projects/portfolio && npm run lint && npm run build` | no errors | PENDING (T0.1) |
| CI green | `gh run list --repo KalpKan/portfolio --limit 1` | latest run `completed success` | PENDING (T0.1) |
| Lighthouse performance | `npx lighthouse https://<prod-url> --only-categories=performance --quiet --chrome-flags="--headless" --output=json \| jq .categories.performance.score` | `>= 0.9` | PENDING (T0.1) |
| Health badges | open the hub in a browser; each `app` card shows a green dot within 3 s | green for every live app, grey (not an error) for `coming` | PENDING (T0.1) |

### promptflip (`KalpKan/promptflip`, Vercel project `promptflip-35qv` (the live one; see H5), Supabase Project A)

| Check | Command | Expect | Status |
|---|---|---|---|
| Health (DB-touching) | `curl -sf https://promptflip-35qv.vercel.app/api/health` | JSON with `"db":"ok"` | live; URL changes to `https://promptflip.<domain>/api/health` after H1 |
| Page serves | `curl -sI https://promptflip-35qv.vercel.app \| head -1` | `HTTP/2 200` | live |
| Env vars present (names only) | Vercel dashboard, project `promptflip-35qv`, Settings, Environment Variables (note: `cd ~/projects/promptflip && npx vercel env ls` reports the *other*, broken `promptflip` project until H5 is resolved; see `incidents.md` 2026-09-18) | the six names in `settings-map.md` all listed for `production` | live |
| Google sign-in works on the new domain | sign in from a browser at `https://promptflip.<domain>` | redirect returns to the same host, no `redirect_uri_mismatch` | PENDING (post-H1) |

### Supabase (two projects, never three)

| Check | Command | Expect | Status |
|---|---|---|---|
| Project count | Supabase dashboard, or MCP `list_projects` | exactly 2 projects: `promptflip` (A) and `platform` (B, currently still named for basketball, ref `yzppfufqaekgaxcrsqxp`) | works now |
| Both active | same | both `ACTIVE_HEALTHY`; a paused project shows `INACTIVE` | works now |
| Keep-alive proven | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=804030255&custom_uptime_ratios=8" \| jq '.monitors[0].custom_uptime_ratio'` (monitor `promptflip health (DB)`, Project A); Project B gets its own monitor on the `health` Edge Function in T1.1 | `"100.000"` (8-day uptime ratio, past the 7-day pause threshold) with no manual restore in `incidents.md` | monitor live since 2026-09-18 (T0.3); earliest confirmation 2026-09-26. Project B PENDING (T1.1) |
| Project B health function | `curl -sf https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health` | `{"ok":true}` (runs `select 1`) | PENDING (T1.1; then add a monitor on it per runbook "Add an UptimeRobot monitor") |
| Quota | Supabase dashboard, Project B, Usage | DB, storage, egress, Realtime each under 10 percent | PENDING (monthly glance once Phase 1 lands) |

### Neon (Plato)

| Check | Command | Expect | Status |
|---|---|---|---|
| Wakes on request | `curl -sf https://plato.<domain>/api/health` after 10 idle minutes; time it with `curl -o /dev/null -s -w '%{time_total}\n' ...` | 200 in under 3 s (scale-to-zero wake is a few hundred ms) | PENDING (T1.3) |

### DNS (Cloudflare, after H1)

| Check | Command | Expect | Status |
|---|---|---|---|
| Every host resolves | `for h in "" www. promptflip. hoops. plato. plantit. pushups. emotes. microtubules.; do echo -n "${h}kalpkan.com: "; dig +short "${h}kalpkan.com" \| head -1; done` | apex `76.76.21.21`, each subdomain the project-specific `<hash>.vercel-dns-017.com` name recorded in `docs/DNS_PENDING.md` §5 | confirmed 2026-09-18 for apex (`76.76.21.21`), www (`a9e60d5e9d41cb23.vercel-dns-017.com.`), hoops (`71da701c9c3d8bdf.vercel-dns-017.com.`); plato/plantit/pushups/emotes/microtubules PENDING their Vercel projects |
| TLS valid | `curl -sI https://<sub>.kalpkan.com \| head -1` for each host | `HTTP/2 200`, no certificate error (`HTTP/2 308` + `location: https://kalpkan.com/` for `www`) | confirmed 2026-09-18: `https://kalpkan.com` → `HTTP/2 200`; `https://www.kalpkan.com` → `HTTP/2 308`, `location: https://kalpkan.com/`; `https://hoops.kalpkan.com` → `HTTP/2 200`; `npx vercel certs ls` lists certs for `kalpkan.com`, `www.kalpkan.com`, `hoops.kalpkan.com`, `promptflip.kalpkan.com`, all `renew: yes`, 90 d |
| Records are DNS-only | `curl -sI https://<sub>.kalpkan.com \| grep -i '^server:'` | `server: Vercel`, not `cloudflare` (an orange-cloud record shows `cloudflare` and breaks TLS issuance) | confirmed 2026-09-18: `kalpkan.com` and `hoops.kalpkan.com` both `server: Vercel`; every record in the zone has `"proxied": false` |
| Vercel sees the domain | `npx vercel domains ls --scope kks-projects-2edcb11a` and `npx vercel domains verify <host> --scope kks-projects-2edcb11a` | `kalpkan.com` listed (Registrar/Nameservers "Third Party" is expected: the zone stays on Cloudflare); `verify` prints no `invalid_configuration` | confirmed 2026-09-18: `1 Domain found` (`kalpkan.com`); hub health over the domain `curl -s https://kalpkan.com/api/health` → `{"ok":true,"service":"hub",...}` |

### Vercel account (monthly)

| Check | Command | Expect | Status |
|---|---|---|---|
| Plan is still Hobby | Vercel dashboard, team settings, Billing | Hobby, $0 | works now |
| Usage under limits | Vercel dashboard, Usage (30-day window) | Fast Data Transfer, invocations, Active CPU all well under Hobby limits (100 GB, 1 M, 4 CPU-hours) | PENDING (30 days after T0.1) |
| Only live projects exist | `npx vercel project ls --scope kks-projects-2edcb11a` | no `tokengamblecoinflip`; both `promptflip` and `promptflip-35qv` present until H5 is resolved (then only the survivor); `v0-basketball-analytics-dashboard` present | confirmed 2026-09-18 (T0.2) |

### GitHub

| Check | Command | Expect | Status |
|---|---|---|---|
| Old coinflip repos archived | `gh repo view KalpKan/token-gamble-coinflip --json isArchived` and same for `token-coinflip` | `{"isArchived":true}` | confirmed 2026-09-18 (T0.2) |
| No secrets committed | run a secret scan (for example `gitleaks detect --source .`) in any repo before it goes public | no findings | run per task |

### UptimeRobot (monitors created 2026-09-18, T0.3; inventory in `docs/monitors.md`)

Load the key first: `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`. Free plan rate limit is 10 requests per minute, so do not loop these.

| Check | Command | Expect | Status |
|---|---|---|---|
| Monitors exist and are up | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=804030255-804030256-804030271&alert_contacts=1" \| jq '.monitors[] \| {id, friendly_name, url, status, alert_contacts: [.alert_contacts[].id]}'` | exactly `promptflip health (DB)` (804030255), `hoops dashboard` (804030256), `hub health` (804030271), each `status: 2` and `alert_contacts: ["5612875"]` | confirmed 2026-09-18 (T0.3) |
| Every platform monitor, whatever its id | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json" \| jq '[.monitors[] \| select(.status != 0) \| {friendly_name, status}]'` | every non-paused monitor `status: 2`; the count matches the rows in `docs/monitors.md` | confirmed 2026-09-18 (T0.3) |
| Alert contact exists and is active | `curl -s -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" https://api.uptimerobot.com/v3/user/alert-contacts \| jq '.[] \| {id, type, status}'` | `{"id":5612875,"type":"Email","status":"Active"}` | confirmed 2026-09-18 (T0.3) |
| Public status page | `curl -sI https://stats.uptimerobot.com/a6n3Wx3PBp \| head -1`, then open it in a browser | `HTTP/2 200`; page titled "Kalp's projects" lists the three monitors, all green | confirmed 2026-09-18 (T0.3). No `status.<domain>` (paid feature) |
| Status page still contains every monitor | `curl -s -X POST https://api.uptimerobot.com/v2/getPSPs -d "api_key=$UPTIMEROBOT_API_KEY&format=json" \| jq '.psps[0] \| {friendly_name, monitors, standard_url}'` | `monitors` lists every id in `docs/monitors.md`; `standard_url` is `https://stats.uptimerobot.com/a6n3Wx3PBp` | confirmed 2026-09-18 (T0.3) |
| Monitor URL is not a protected alias | `curl -sI <monitor url> \| head -1` for each URL in `docs/monitors.md` | `HTTP/2 200`, never a `302` to `vercel.com/sso-api` (that alias is behind Vercel deployment protection and the monitor would be measuring a login page) | confirmed 2026-09-18 (T0.3) |

### PostHog (after H0 key)

| Check | Command | Expect | Status |
|---|---|---|---|
| Events arrive with the right host | visit a site from a phone and a laptop, then in PostHog Web Analytics filter by host | both visits within 5 minutes, correct host and country | PENDING (T0.5) |
| Custom event fires | trigger the app's core action (for example one `project_card_clicked` on the hub) and search the event in PostHog | event present with the right host | PENDING (T0.5) |
| Reverse proxy works | `curl -sI https://<prod-url>/ingest/static/array.js \| head -1` | `HTTP/2 200` (proxied to PostHog; an ad blocker cannot see the third-party host) | PENDING (T0.5) |
| Billing limits are $0 | PostHog, Organization settings, Billing | every product's limit reads `$0`; screenshot goes in `STATUS.md` | PENDING (T0.5) |

### Browser-ML demos (pushups, emotes, microtubules)

| Check | Command | Expect | Status |
|---|---|---|---|
| Runs on a phone with no server calls | open the demo on a phone over cellular; on desktop, open DevTools Network tab and use the demo | no requests after initial load except the PostHog `/ingest` events | PENDING (Phase 1 and 3) |
| Lighthouse performance | same Lighthouse command as the hub, per demo | `>= 0.9` | PENDING (Phase 1 and 3) |

### Money (month end, every month)

| Check | Command | Expect | Status |
|---|---|---|---|
| Nothing charged | Cloudflare billing (domain only), Vercel $0, Supabase $0, Neon $0, Firebase $0, PostHog $0 | matches the spend tracker in `STATUS.md` | PENDING (first month end after H1) |

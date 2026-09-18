# Verification

The exact commands and URLs that prove each part of the platform is healthy. Use these to go from "something is wrong" to "this specific thing is wrong" in minutes, and to prove a task is done before reporting it. Paste actual output, not a description of it.

Rows marked **PENDING** target something the plan calls for but that is not live yet; the command is written now so it is ready, and the row is updated (with the real URL and a "confirmed on <date>" note) by the task that makes it live. The source list is `docs/hosting-plan.md` section 10.

Placeholders: `<domain>` is the `.com` bought at human checkpoint H1 (not yet bought); `<prod-url>` is the `*.vercel.app` URL of the app until then.

## Quick triage (the "first 5 checks" from SKILL.md, as commands)

| # | Check | Command | Healthy output | Status |
|---|---|---|---|---|
| 1 | UptimeRobot status page | open `https://status.<domain>` or the UptimeRobot dashboard; via API: `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json" \| jq '.monitors[] \| {friendly_name, status}'` | every monitor `status: 2` (up) | PENDING (T0.3) |
| 2 | Failing app's health route | `curl -sf https://<prod-url>/api/health` | promptflip: JSON containing `"db":"ok"`; hub: `{"ok":true,"service":"hub","time":"..."}` | promptflip live; hub PENDING (T0.1) |
| 3 | Vercel deployment logs | `npx vercel ls <project> --scope kks-projects-2edcb11a` then `npx vercel inspect <deployment-url> --logs` | newest deployment state `Ready`, no build errors | works now |
| 4 | Supabase project status | Supabase dashboard project list, or Supabase MCP `list_projects` | both projects `ACTIVE_HEALTHY`, none `INACTIVE` (paused) | works now (dashboard); MCP after H0 |
| 5 | Cloudflare DNS record | `dig +short <sub>.<domain>` and `dig +short <domain>` | subdomain: a `*.vercel-dns*.com` name, specifically whatever `npx vercel domains inspect <host>` printed when the record was created (recorded in `docs/DNS_PENDING.md` §5; general-purpose fallback `cname.vercel-dns-0.com`); apex: `76.76.21.21` | PENDING (H1) |

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
| Keep-alive proven | UptimeRobot monitor history for `promptflip/api/health` and the Project B `health` Edge Function | 100 percent uptime for at least 8 consecutive days (past the 7-day pause threshold) with no manual restore | PENDING (T0.3, then 8 days) |
| Project B health function | `curl -sf https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health` | `{"ok":true}` (runs `select 1`) | PENDING (T1.1 / T0.3) |
| Quota | Supabase dashboard, Project B, Usage | DB, storage, egress, Realtime each under 10 percent | PENDING (monthly glance once Phase 1 lands) |

### Neon (Plato)

| Check | Command | Expect | Status |
|---|---|---|---|
| Wakes on request | `curl -sf https://plato.<domain>/api/health` after 10 idle minutes; time it with `curl -o /dev/null -s -w '%{time_total}\n' ...` | 200 in under 3 s (scale-to-zero wake is a few hundred ms) | PENDING (T1.3) |

### DNS (Cloudflare, after H1)

| Check | Command | Expect | Status |
|---|---|---|---|
| Every host resolves | `for h in "" promptflip. hoops. plato. plantit. pushups. emotes. microtubules.; do echo -n "$h<domain>: "; dig +short "$h<domain>" \| head -1; done` | apex `76.76.21.21`, each subdomain a `*.vercel-dns*.com` name, specifically whatever `npx vercel domains inspect <host>` printed when the record was created (recorded in `docs/DNS_PENDING.md` §5; general-purpose fallback `cname.vercel-dns-0.com`) | PENDING (H1) |
| TLS valid | `curl -sI https://<sub>.<domain> \| head -1` for each host | `HTTP/2 200`, no certificate error | PENDING (H1) |
| Records are DNS-only | `curl -sI https://<sub>.<domain> \| grep -i '^server:'` | `server: Vercel`, not `cloudflare` (an orange-cloud record shows `cloudflare` and breaks TLS issuance) | PENDING (H1) |
| Vercel sees the domain | `npx vercel domains ls --scope kks-projects-2edcb11a` | each domain listed with a valid configuration | PENDING (H1) |

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

### UptimeRobot (after H0 key)

| Check | Command | Expect | Status |
|---|---|---|---|
| Monitors exist and are up | `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json" \| jq '.monitors[] \| {friendly_name, url, status}'` | one monitor per app plus the DB-touching routes, all `status: 2` | PENDING (T0.3) |
| Public status page | open `https://status.<domain>` | all green | PENDING (T0.3 + H1) |

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

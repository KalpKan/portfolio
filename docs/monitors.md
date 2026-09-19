# Monitors (UptimeRobot)

Every uptime monitor for the portfolio platform, what it protects, and its UptimeRobot id. Created 2026-09-18 (task T0.3). Free plan: 50 monitors, 5-minute minimum interval, 10 API requests/minute. Nothing here costs money.

**Why these exist:** Supabase Free projects pause after 7 idle days, and a paused project means a visitor hits an error. A monitor is only a keep-alive if it hits a route that **queries the database** (a plain page view does not count as activity), so the promptflip monitor targets `/api/health`, which runs a DB query and returns `db: ok`. See `docs/hosting-plan.md` § 6 "Database plan", item 6, and `skills/portfolio-ops/architecture.md` "Keep-alive".

## Public status page

| Name | URL | Contains | UptimeRobot PSP id |
|---|---|---|---|
| Kalp's projects | **https://stats.uptimerobot.com/a6n3Wx3PBp** | the nine monitors below | `1263036` |

`status.<domain>` (a custom domain for this page) is NOT configured: custom status-page domains are a paid UptimeRobot feature, and the plan spends $0. The hub does **not** link this page anywhere (checked 2026-09-18: the rendered `kalpkan.com` HTML contains no `uptimerobot` string); it is for Kalp and agents, not visitors. `status.<domain>` stays "optional" in `docs/DNS_PENDING.md`.

## Monitors

All are HTTP(s) monitors (v2 `type: 1`, v3 `type: HTTP`), method `GET`, interval 300 s, timeout 30 s, success codes `2xx` only, redirects not followed (so a redirect to a login page counts as down). Each has the account's default alert contact (id `5612875`, email to Kalp's UptimeRobot account address, up-and-down notifications) attached.

| Name | URL | Interval | What it protects | Keep-alive? | UptimeRobot monitor id |
|---|---|---|---|---|---|
| `promptflip health (DB)` | https://promptflip.kalpkan.com/api/health (moved from `https://promptflip-35qv.vercel.app/api/health` on 2026-09-18 via `PATCH /v3/monitors/804030255`, same id so uptime history is kept) | 5 min | promptflip app on Vercel **and Supabase Project A** (the route runs a DB query; JSON contains `"db":"ok"`) | **Yes** (Project A) | `804030255` |
| `hoops health (DB, Project B)` | https://hoops.kalpkan.com/api/health (renamed and moved from `https://hoops.kalpkan.com/` on 2026-09-19 02:40Z via `POST /v2/editMonitor`, same id; before that moved from `https://v0-basketball-analytics-dashboard-seven.vercel.app/` on 2026-09-18 22:40Z) | 5 min | basketball dashboard on Vercel: the route runs `hoops.health_select_one()` and answers `503` when the database is unreachable, so this monitor now tells a page failure from a DB failure (FIX r1, D8) | Yes, incidentally (the dedicated keep-alive is still `platform health (DB, Project B)` below) | `804030256` |
| `hub health` | https://kalpkan.com/api/health (moved from `https://portfolio-alpha-eight-rjbs2nj1q0.vercel.app/api/health` on 2026-09-18 22:40Z via `PATCH /v3/monitors/804030271`, same id) | 5 min | the hub on Vercel (`{"ok":true,"service":"hub"}`; no database) | n/a (no DB) | `804030271` |
| `platform health (DB, Project B)` | https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health | 5 min | Supabase **Project B** `platform` (the `health` Edge Function calls `hoops.health_select_one()`, a real `select 1`, and returns `{"ok":true,"db":"ok"}`); also proves Edge Functions run | **Yes** (Project B) | `804030499` (added 2026-09-18, T1.1) |
| `plato health (DB, Neon)` | https://plato.kalpkan.com/api/health | 5 min | Plato on Vercel (Python function) **and its Neon database** (the route runs a query and answers `{"db":"ok","ok":true,"service":"plato"}`). Neon Free does not pause data, it only scales compute to zero, so this is liveness plus a cold-start canary rather than a keep-alive | no (Neon does not pause) | `804031239` (created 2026-09-18 22:40Z, Phase 1 audit, v3 API; on the status page) |
| `plantit health (Firestore)` | https://plantit.kalpkan.com/api/health | 5 min | Plant It on Vercel **and Firebase Firestore** (`plant-it-5e2fc`, Spark): the route does a real Firestore read with a 6 s timeout and answers 503 `firestore: error` when it fails; also reports the Supabase photo bucket config and the two spend counters | no (Firebase Spark does not pause; the ping is liveness only) | `804031032` (created 2026-09-18, T2.1, v3 API; on the status page) |
| `pushups health` | https://pushups.kalpkan.com/health.json | 5 min | the pushup tracker (static Vite site on Vercel, no database); `{"ok":true,"service":"pushups"}` | n/a (no DB) | `804031518` (created 2026-09-19 00:20 UTC, Phase 2–4 audit, v3 API; on the status page) |
| `emotes health` | https://emotes.kalpkan.com/health.json | 5 min | the emote detector (static Vite site on Vercel, no database); `{"ok":true,"service":"emotes"}` | n/a (no DB) | `804031519` (created 2026-09-19 00:20 UTC, Phase 2–4 audit; on the status page) |
| `microtubules health` | https://microtubules.kalpkan.com/health.json | 5 min | the microtubule quantifier (static Vite site on Vercel, no database); `{"ok":true,"service":"microtubules"}` | n/a (no DB) | `804031520` (created 2026-09-19 00:20 UTC, Phase 2–4 audit; on the status page) |

### Notes and deviations from the plan

- **hoops URL differs from the plan.** The plan named `https://v0-basketball-analytics-dashboard-kks-projects-2edcb11a.vercel.app/`. That team-scoped alias sits behind Vercel deployment protection and answers `302` to `vercel.com/sso-api`, so a monitor on it would measure Vercel's login page, not the app. The project's public production aliases (`npx vercel alias ls --scope kks-projects-2edcb11a`) are `v0-basketball-analytics-dashboard-seven.vercel.app` and `v0-shootersshoot.vercel.app`, both `HTTP/2 200`; the monitor uses the first. `projects.json` in the hub (owned by T0.1, not changed here) still lists the protected URL as the `basketball` card's `url` (its `healthUrl` is `null`, so no badge is affected); a visitor clicking that card today lands on a Vercel login page, so the card's `url` should switch to the `-seven` alias, or to `hoops.<domain>` once the CNAME lands.
- **After H1 (custom domain):** done. All three original monitors were re-pointed with `PATCH /v3/monitors/{id}` (promptflip during T0.4, hoops and hub during the Phase 1 audit on 2026-09-18), keeping their ids and uptime history. No monitor targets a `*.vercel.app` host any more. The Phase 1 audit had left pushups, emotes and microtubules (static, no database) without a monitor "by design", but `docs/hosting-plan.md` §6/§7 item 11 and the runbook "Add an UptimeRobot monitor" both call for a liveness monitor on every app, so the Phase 2–4 audit added the three `/health.json` monitors on 2026-09-19; the hub's live marks remain the second signal.
- **Pre-existing monitors, not part of the platform:** the account also holds six paused keyword monitors from 2020 (ids `784431015`, `784431036`, `784431038`, `784431041`, `784431055`, `784431056`, all on `shop.travisscott.com`). They are Kalp's, were left untouched, are not on the status page, and count toward the 50-monitor limit (15 of 50 used since 2026-09-19).
- **Which API:** the legacy v2 `newMonitor` endpoint rejects creation on this account with `access_denied: "You are not allowed to use some settings with your current plan."` even with default settings, while v2 `getMonitors` / `getPSPs` work fine. The v3 REST API (`https://api.uptimerobot.com/v3`, `Authorization: Bearer $UPTIMEROBOT_API_KEY`, the same main API key) creates monitors and status pages without complaint, and v2 `getAlertContacts` returns an internal server error where v3 `GET /user/alert-contacts` works. Use v3 for writes, either for reads.

## Verified 2026-09-18

`getMonitors` (v2) for the three ids, after the first check cycle:

```json
{
  "stat": "ok",
  "monitors": [
    { "id": 804030256, "friendly_name": "hoops dashboard", "url": "https://v0-basketball-analytics-dashboard-seven.vercel.app/", "type": 1, "interval": 300, "status": 2, "alert_contacts": ["5612875"], "last_response_ms": 7157 },
    { "id": 804030271, "friendly_name": "hub health", "url": "https://portfolio-alpha-eight-rjbs2nj1q0.vercel.app/api/health", "type": 1, "interval": 300, "status": 2, "alert_contacts": ["5612875"], "last_response_ms": 142 },
    { "id": 804030255, "friendly_name": "promptflip health (DB)", "url": "https://promptflip-35qv.vercel.app/api/health", "type": 1, "interval": 300, "status": 2, "alert_contacts": ["5612875"], "last_response_ms": 299 }
  ]
}
```

`curl -sI https://stats.uptimerobot.com/a6n3Wx3PBp | head -1` → `HTTP/2 200`.

Keep-alive success criterion (from `docs/hosting-plan.md` § 10): 100 percent uptime on `promptflip health (DB)` for 8 consecutive days with no manual restore. Earliest date that can be confirmed: 2026-09-26.

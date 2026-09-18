# Monitors (UptimeRobot)

Every uptime monitor for the portfolio platform, what it protects, and its UptimeRobot id. Created 2026-09-18 (task T0.3). Free plan: 50 monitors, 5-minute minimum interval, 10 API requests/minute. Nothing here costs money.

**Why these exist:** Supabase Free projects pause after 7 idle days, and a paused project means a visitor hits an error. A monitor is only a keep-alive if it hits a route that **queries the database** (a plain page view does not count as activity), so the promptflip monitor targets `/api/health`, which runs a DB query and returns `db: ok`. See `docs/hosting-plan.md` § 6 "Database plan", item 6, and `skills/portfolio-ops/architecture.md` "Keep-alive".

## Public status page

| Name | URL | Contains | UptimeRobot PSP id |
|---|---|---|---|
| Kalp's projects | **https://stats.uptimerobot.com/a6n3Wx3PBp** | the five monitors below | `1263036` |

`status.<domain>` (a custom domain for this page) is NOT configured: custom status-page domains are a paid UptimeRobot feature, and the plan spends $0. After H1 the hub footer links to the `stats.uptimerobot.com` URL above; `status.<domain>` stays "optional" in `docs/DNS_PENDING.md`.

## Monitors

All are HTTP(s) monitors (v2 `type: 1`, v3 `type: HTTP`), method `GET`, interval 300 s, timeout 30 s, success codes `2xx` only, redirects not followed (so a redirect to a login page counts as down). Each has the account's default alert contact (id `5612875`, email to Kalp's UptimeRobot account address, up-and-down notifications) attached.

| Name | URL | Interval | What it protects | Keep-alive? | UptimeRobot monitor id |
|---|---|---|---|---|---|
| `promptflip health (DB)` | https://promptflip.kalpkan.com/api/health (moved from `https://promptflip-35qv.vercel.app/api/health` on 2026-09-18 via `PATCH /v3/monitors/804030255`, same id so uptime history is kept) | 5 min | promptflip app on Vercel **and Supabase Project A** (the route runs a DB query; JSON contains `"db":"ok"`) | **Yes** (Project A) | `804030255` |
| `hoops dashboard` | https://v0-basketball-analytics-dashboard-seven.vercel.app/ | 5 min | basketball dashboard on Vercel (liveness; since T1.1 the page reads Project B, but the keep-alive is the dedicated monitor below). Move to `https://hoops.kalpkan.com/` after the 24 h wait in the decisions log | No (see `platform health (DB, Project B)`) | `804030256` |
| `hub health` | https://portfolio-alpha-eight-rjbs2nj1q0.vercel.app/api/health | 5 min | the hub on Vercel (`{"ok":true,"service":"hub"}`; no database) | n/a (no DB) | `804030271` |
| `platform health (DB, Project B)` | https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health | 5 min | Supabase **Project B** `platform` (the `health` Edge Function calls `hoops.health_select_one()`, a real `select 1`, and returns `{"ok":true,"db":"ok"}`); also proves Edge Functions run | **Yes** (Project B) | `804030499` (added 2026-09-18, T1.1) |
| `plantit health (Firestore)` | https://plantit.kalpkan.com/api/health | 5 min | Plant It on Vercel **and Firebase Firestore** (`plant-it-5e2fc`, Spark): the route does a real Firestore read with a 6 s timeout and answers 503 `firestore: error` when it fails; also reports the Supabase photo bucket config and the two spend counters | no (Firebase Spark does not pause; the ping is liveness only) | `804031032` (created 2026-09-18, T2.1, v3 API; on the status page) |

### Notes and deviations from the plan

- **hoops URL differs from the plan.** The plan named `https://v0-basketball-analytics-dashboard-kks-projects-2edcb11a.vercel.app/`. That team-scoped alias sits behind Vercel deployment protection and answers `302` to `vercel.com/sso-api`, so a monitor on it would measure Vercel's login page, not the app. The project's public production aliases (`npx vercel alias ls --scope kks-projects-2edcb11a`) are `v0-basketball-analytics-dashboard-seven.vercel.app` and `v0-shootersshoot.vercel.app`, both `HTTP/2 200`; the monitor uses the first. `projects.json` in the hub (owned by T0.1, not changed here) still lists the protected URL as the `basketball` card's `url` (its `healthUrl` is `null`, so no badge is affected); a visitor clicking that card today lands on a Vercel login page, so the card's `url` should switch to the `-seven` alias, or to `hoops.<domain>` once the CNAME lands.
- **After H1 (custom domain):** edit each monitor's URL to the new host (`https://promptflip.<domain>/api/health`, `https://hoops.<domain>/`, `https://<domain>/api/health`) with `PATCH /v3/monitors/{id}` (runbook "Add an UptimeRobot monitor" shows the shape); do not create new monitors, or uptime history is lost.
- **Pre-existing monitors, not part of the platform:** the account also holds six paused keyword monitors from 2020 (ids `784431015`, `784431036`, `784431038`, `784431041`, `784431055`, `784431056`, all on `shop.travisscott.com`). They are Kalp's, were left untouched, are not on the status page, and count toward the 50-monitor limit (9 of 50 used).
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

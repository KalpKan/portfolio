# Architecture of Kalp's portfolio platform

This file explains how the platform is put together and, more importantly, **why** each choice was made, so that a future agent does not "fix" a deliberate decision. The authoritative design is `docs/hosting-plan.md` in the hub repo (`~/projects/portfolio`); this file is the operational digest of its sections 3 and 6. When this file and the code disagree, the code is reality and this file must be updated; when this file and `docs/hosting-plan.md` disagree on intent, the hosting plan wins.

## The constraints that shape everything

- **Budget:** about $10 CAD per month target, $15 CAD hard ceiling, including the domain. The design lands at roughly $1.30 CAD per month, which is the `.com` domain and nothing else. Every service is on its free tier, and every free tier has been checked to permit personal, non-commercial portfolio use. Do not upgrade anything; if a task appears to need a paid tier, the task is wrong, not the budget.
- **Non-commercial:** no payments, ads, or affiliate links anywhere. This is what keeps Vercel Hobby legitimately usable.
- **Kalp is not a developer by trade** and will not be watching. Managed dashboards beat custom scripts for anything he will touch. Every repo ends with a plain-English README section "How to run this / How to deploy this / Where the settings live".
- **ML runs in the visitor's browser** (MediaPipe Tasks JS, TF.js, OpenCV.js). No Python inference servers. This is $0 forever, private (video never leaves the device), and scales without limit.

## Layers (chosen independently; a CNAME record is the only coupling)

```
[Domain + DNS]        Cloudflare Registrar + Cloudflare DNS, one zone, one subdomain per project
      |
      +- [Hub]                     Next.js on Vercel Hobby at the apex; renders cards from projects.json
      +- [Static + serverless]     promptflip, hoops, plato, plantit, pushups, emotes, microtubules on Vercel Hobby
      +- [Persistent processes]    none today; reserved slot = Fly.io auto-stop machine (~$2.8 CAD) if ever needed
      +- [ML inference]            in-browser now; HF ZeroGPU (2 free Spaces) or Modal ($30/mo credit) later
      +- [Databases / auth]        Supabase Free x2 (Project A promptflip, Project B platform), Neon Free, Firebase Spark
      +- [Analytics]               one PostHog Cloud project, every site reports to it, $0 billing limit
      +- [Keep-alive + monitoring] UptimeRobot 5-minute pings on every app and on DB-touching health routes
```

Why layers rather than one platform: each layer can be swapped without touching the others. Vercel could become Cloudflare Pages or a VPS in an afternoon because every app is a git repo with a standard framework and the hub only knows a URL per project.

## Hosting: Vercel Hobby for everything web, including Python

- Team "Kk's projects" (slug `kks-projects-2edcb11a`), Hobby plan, already authenticated in the local `vercel` CLI.
- Limits that matter: 200 projects, 100 GB transfer, 1 M function invocations, 4 CPU-hours, 300 s max function, cron once per day, non-commercial only. Nothing in the portfolio approaches these.
- Flask and Express run as Vercel functions (500 MB bundle limit), which is why Plato does not need an always-on server. Plato must become stateless (`/tmp` for uploads, external DB, `SECRET_KEY` from env) to fit; that refactor is Phase 1, not a bug.
- Why not Vercel Pro: $28 CAD per month alone exceeds the ceiling and buys nothing needed (commercial use, per-minute cron).
- Why not a VPS (Hetzner + Coolify): it costs the whole budget on day one and turns Kalp into a sysadmin. It is the documented upgrade path if three or more persistent apps ever exist, not the default.
- Why not Render Free: services sleep after 15 minutes and take about a minute to wake, which is a bad first impression for a recruiter.

Superseded deployments removed in T0.2: Vercel project `tokengamblecoinflip` (old coinflip app, plaintext keys in its DB, unresolved RLS bug), plus archiving GitHub repos `token-gamble-coinflip` and `token-coinflip`. These are the only deletions the plan authorises without a human checkpoint. The plan also listed `promptflip-35qv` as a duplicate of `promptflip` to delete, but T0.2's pre-deletion check found that `promptflip-35qv` is the project actually serving the live promptflip URL, so it was kept and the question of which promptflip project is canonical was human checkpoint H5 in `STATUS.md`; Kalp resolved it 2026-09-18 ("keep 35qv") and the duplicate `promptflip` project was then deleted. Lesson recorded for future agents: always run the "is this the live one" check in the "Delete a Vercel project" runbook before removing anything, even when the plan says it is safe.

## Databases: exactly two Supabase projects, schema per app

Supabase Free allows 2 active projects, and every extra project on Pro costs about $10 per month on top of $25, so four projects would be roughly $55 per month. Kalp expects more backend projects, so the shared pattern is set up now rather than after the third app forces it.

| Supabase project | Role | Contents |
|---|---|---|
| **Project A: `promptflip`** (existing) | Isolated. It is live, has real users, uses Realtime and encrypted third-party keys. Never share its blast radius. | `public` schema, promptflip only |
| **Project B: `platform`** (the existing basketball project `yzppfufqaekgaxcrsqxp`, renamed in T1.1) | Shared home for every other backend, one Postgres schema per app | `hoops` (basketball) first, then `<newapp>` per future project |

Rules (each has a reason; do not relax them):

1. **A new app needing any Supabase feature gets a new schema in Project B**, not a new project. Migration 0001 is `create schema <app>; grant usage on schema <app> to anon, authenticated, service_role; alter default privileges ...`. The schema is exposed in Project B's API settings. The client is `createClient<Database, '<app>'>(url, anonKey, { db: { schema: '<app>' } })`. Edge Functions and Storage buckets are prefixed `<app>-`. RLS on every table keyed on `auth.uid()`; a per-app `<app>.profiles` table scopes which shared users belong to which app. Supabase officially supports this pattern.
2. **A new app needing only a Postgres URL goes to Neon Free** (100 projects, scale-to-zero, wakes in a few hundred milliseconds). Plato goes here. This keeps Project B's 500 MB for apps that use Supabase features.
3. **Never create a third Supabase project.** If an app truly needs isolation (paying users, sensitive data), it has outgrown "portfolio" and needs its own budget line; that is a human checkpoint, not a quiet exception.
4. **Shared `auth.users` in Project B is a feature:** one Google sign-in works across all of Kalp's apps. Per-app authorisation lives in RLS plus `<app>.profiles`.
5. **Pooled quota watch:** Project B shares 500 MB DB, 1 GB storage, 5 GB egress, 200 Realtime connections. Glance at the Supabase usage page monthly. Nothing today approaches 10 percent.
6. **Auth costs nothing.** Supabase Auth and Firebase Auth are bundled, free to 50 k monthly-active users, Google sign-in included. Only phone-based advanced MFA is paid, which nothing here needs. Do not buy an auth product.
7. **Firebase stays on Spark for PlantWater** (Firestore, RTDB, Auth). Firebase Cloud Storage now requires the Blaze plan (card on file, no hard spend cap), so PlantWater photos move to a `plantit-photos` bucket in Project B's Supabase Storage (1 GB free) or Cloudflare R2 (10 GB free, no egress fees). Never enable Blaze.

## Keep-alive: why pings exist and what they must touch

Supabase Free projects pause after 7 days without activity, and a paused project means a recruiter hits an error. The defence is UptimeRobot (free, 50 monitors, 5-minute interval) pinging a **DB-touching** route on every Supabase-backed app: `promptflip/api/health` already queries the DB and returns `db: ok`; Project B gets a tiny `health` Edge Function that runs `select 1` so the ping exercises both the database and functions. A plain page view does not count as database activity, which is why the health route must actually query.

Why not GitHub Actions cron: it is auto-disabled after 60 days of repo inactivity, so it silently stops. Why not Vercel cron: Hobby allows once per day only. cron-job.org (free, 1-minute jobs) is the optional second pinger.

Success criterion from the plan: UptimeRobot shows 100 percent uptime for at least 8 consecutive days on both Supabase-backed apps with no manual restore.

## DNS and subdomain map

Registrar and DNS are Cloudflare (at-cost renewals, free DNS with 200 records, free web analytics, one panel for every subdomain). The domain is a `.com`, name chosen at purchase (human checkpoint H1). Until H1 lands, everything serves from `*.vercel.app` and `docs/DNS_PENDING.md` (T0.4) lists every record to create.

| Host | Target | Notes |
|---|---|---|
| `@` (apex) + `www` | Vercel hub | `A 76.76.21.21` for apex, `www` CNAME handled by Vercel redirect |
| `promptflip.` | Vercel (`promptflip-35qv`) | live 2026-09-18; `NEXT_PUBLIC_APP_URL` and the Supabase Auth URLs were re-pointed the same day (runbook "Re-point OAuth redirects"); the Google OAuth redirect URI is Supabase's own callback and did not change |
| `hoops.` | Vercel | basketball dashboard |
| `plato.` | Vercel | Flask as a Python function |
| `plantit.` | Vercel | React static plus `/api/*` Express function |
| `pushups.`, `emotes.`, `microtubules.` | Vercel | static browser-ML builds |
| `status.` | UptimeRobot public status page | optional |
| future GPU demo | `hf.space` custom domain or Modal URL behind a Vercel route | reserved |

Subdomains are a CNAME to a `*.vercel-dns*.com` name, specifically whatever `npx vercel domains inspect <host>` printed when the record was created (recorded in `docs/DNS_PENDING.md` §5; general-purpose fallback `cname.vercel-dns-0.com`). **Every Vercel-targeted record must be DNS-only (grey cloud).** Proxying through Cloudflare (orange cloud) puts two TLS terminators in series and Vercel's certificate issuance fails or loops. This is the single most likely thing a well-meaning agent will "fix" wrongly.

## The connections layer (hub to projects)

- **Project registry:** `projects.json` in the hub repo. Each entry has `slug`, `name`, `tagline`, `type` (`app` or `showcase`), `status` (`live`, `demo`, `coming`, `archived`), `url`, `repo`, `healthUrl`, `tags`, `hero`. The hub renders cards from it; adding a project is one JSON entry plus a push. Showcase entries (UnPark/Antifreeze, RC car, Yash Birthday PCB, DIY EEG, FlashCards; Outline and classmyschedule were removed 2026-09-18) have no `url` or `healthUrl` and link to `/projects/<slug>` on the hub.
- **Live status badges:** every app exposes `/api/health`; static demos ship a `health.json`. The hub fetches them client-side with a 3-second timeout and shows a green or grey dot; failures are silent. The same URLs feed UptimeRobot, so one route serves both purposes.
- **Shared footer / back-link:** a small `<ProjectBar>` ("part of <domain>") published later so all apps feel like one family.
- **Embeds:** browser-ML demos are static, so the hub can iframe them on case-study pages for free.

## Analytics: one PostHog project for everything

Kalp wants to know how many people visit, which sites, where they are from, and what they interact with. PostHog Cloud free tier (1 M events per month, 5 k session replays, no card, "not a trial") answers all four with one tool.

- One PostHog project ("Kalp portfolio"), one `posthog-js` snippet in the hub, every app, and every static demo. The new-project template ships with it.
- Sites are distinguished by host, so the built-in Web Analytics dashboard filters per site or shows all together.
- Autocapture records clicks, form submits, and page changes with no code. Each project also sends 2 to 4 named custom events for its core action (`rep_counted`, `emote_fired`, `pdf_parsed`, `plant_identified`, `coinflip_played`, `project_card_clicked`).
- **Ad-blocker resilience:** requests are proxied through a Next.js rewrite at `/ingest/*` on each app, per PostHog's documented reverse-proxy setup. Without it, numbers are silently 30 to 50 percent low. If analytics "stopped", check the rewrite before the key.
- **Privacy:** cookieless (`persistence: 'memory'`), geolocation kept at country/city, session replay masks inputs by default, so no cookie banner is needed. The hub's privacy note states this.
- **Budget guard:** a `$0` billing limit is set on every PostHog product so it can never charge. Verify the limits still read `$0` whenever you touch PostHog.

Why not Vercel Web Analytics (no custom events on Hobby, 1-month window), Cloudflare Web Analytics (no events), GA4 (complex, cookie-consent burden), Plausible ($9 USD per month).

## Showcase pages (projects that are not web apps)

UnPark (codename Antifreeze, the Parkinson's freezing-of-gait device: iOS app + Raspberry Pi + Firebase), the Automatic RC Car, the Yash Birthday PCB (KiCad), the DIY EEG (published as "under construction", registry `coming` until H14) and FlashCards (placeholder page, draft content) get case-study pages on the hub, not deployments. Outline (not a real project) and classmyschedule (not Kalp's work) were removed on 2026-09-18. Images are optimised WebP (300 KB or less) committed to the hub repo and served through Vercel image optimisation. **Videos are never committed to git or served from Vercel**: they go to YouTube (unlisted) or a Cloudflare R2 bucket and are referenced by URL, so the hub repo stays small and the Hobby transfer budget is untouched. Kalp supplies media (human checkpoint H3); pages ship with labelled placeholders until then. App Store publication is a separate later project with its own $99 USD per year cost, outside this budget.

## Reserved slots (do not build until needed)

- Fly.io auto-stop machine (about $2.8 CAD per month, near $0 idle) for the first project that needs websockets or a long-running process.
- Hugging Face ZeroGPU (2 free Gradio Spaces) for a future "try my model" demo. Note: plain CPU Gradio Spaces now require PRO; only Static and ZeroGPU Spaces are free.
- Modal ($30 per month free credit, scale-to-zero) for a future GPU API behind a Vercel route.


## Supabase account inventory (verified via Management API 2026-09-18)

| Project ref | Name | Status | Role in this platform |
|---|---|---|---|
| nhddxonizdxwbvwcxklu | PromptFlip | ACTIVE_HEALTHY | Project A: promptflip only, isolated |
| yzppfufqaekgaxcrsqxp | platform (was ShootIt) | ACTIVE_HEALTHY (restored + renamed 2026-09-18, T1.1) | Project B: one schema per app. Schemas: `hoops` (basketball). Old `public.*` basketball tables kept as a copy until a human checkpoint drops them |
| ftcqzuzpyebtwihizqfl | plato-course-converter | INACTIVE (paused) | Not used; Plato moves to Neon. Leave paused. |
| zxjtflnnjxdxiycrdlrv | KalpKan's Project | INACTIVE (paused) | Unknown contents; leave paused, do not delete without a human checkpoint |

Paused projects do not count toward the Free plan's 2-active-project cap. The rule is: at most two ACTIVE projects (A and B), never a third. Restoring a paused project is `POST https://api.supabase.com/v1/projects/{ref}/restore` with the access token, or the dashboard's Restore button.

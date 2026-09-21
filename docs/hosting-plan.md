# Hosting Strategy for Kalp's Project Portfolio

> **How this will be executed:** Kalp wants this run in cmux **goal mode** with minimal involvement. The goal-mode prompt is in the Appendix at the end of this file. It treats this document as the source of truth, splits the work into bite-sized agent tasks, pairs every worker with reviewer/verifier agents, and batches the handful of steps only Kalp can do.

## Context

Kalp wants one coherent place to host every project he has built (and will build), reachable later from a personal portfolio website, with maximum bang-for-buck. Constraints he gave:

- **Budget:** ~$10 CAD/month target, **$15 CAD/month hard ceiling**, *including* the domain.
- **Commercial use:** none. Everything is portfolio/hobby, so free "personal use" tiers are legitimately usable.
- **ML demos:** port to run in-browser wherever possible (visitor's device does the inference).
- **Databases:** several apps use Supabase; he asked whether hosting many of them needs a Supabase subscription or paid auth.
- **Future:** a personal website that links to / embeds all projects, and room for new projects (including ones with AI models).

He was considering paying for Vercel Pro ($20 USD ≈ $28 CAD/mo). **That alone would blow the budget and buys nothing he needs.** Every current project fits on free tiers; the only unavoidable cost is the domain (~$1.30 CAD/mo).

**Bottom line:** total baseline cost ≈ **$1.30 CAD/month** (domain only). Optional add-ons stay under $5 CAD. No Vercel Pro, no Supabase Pro, no paid auth.

---

## 1. What exists today (inventory)

Current Vercel state: team "Kk's projects", **Hobby (free) plan**, 4 projects deployed (`promptflip`, `promptflip-35qv`, `tokengamblecoinflip`, `v0-basketball-analytics-dashboard`), **0 custom domains**. Two Supabase projects already exist (promptflip's, and basketball's `yzppfufqaekgaxcrsqxp`), which is the free-tier limit of 2 active projects.

### Tier A — web apps that can be live within days

| Project | Where | Stack | Backend | AI | State | Hosting shape |
|---|---|---|---|---|---|---|
| **promptflip** | `~/projects/promptflip`, GitHub (private) | Next 16 / React 19 / TS | Supabase (Postgres, Realtime, Google OAuth), 1 daily cron | None hosted; proxies OpenRouter with users' keys | **Already live & healthy** at promptflip-35qv.vercel.app | Vercel serverless + Supabase (as is) |
| **Basketball-Stat-Tracker** | GitHub (public) | pnpm/Turborepo, Next 15 web + SwiftUI stub | Supabase Postgres + 1 Edge Function, shared-secret auth | None (Core ML is aspirational) | Dashboard works; iOS app is a 28-line stub; shows **mock data silently** without env | Vercel serverless + Supabase |
| **PlantWater / "Plant It"** | GitHub (public) | React 18 CRA + MUI / Node Express / ESP8266 firmware | Firebase (Firestore, RTDB, Storage, Auth) | Pl@ntNet API + OpenAI API (HTTP only) | Abandoned mid-deploy (Jun 2025); broken `.firebaserc`; half needs physical hardware | Static frontend + Node API (serverless is fine, requests are one-off) |
| **Plato** | GitHub (public) | Flask 3 + Gunicorn, Python 3.11 | Postgres via `DATABASE_URL` (SQLite fallback), local file uploads | None (rule-based PDF parsing) | Works, dormant since Jan 2026; Railway config ready; `SECRET_KEY` default unsafe | Written as always-on server, but **portable to Vercel Python functions** (Flask/WSGI supported, 500 MB bundle) |

### Tier B — ML demos that need a browser port (per Kalp's choice)

| Project | Where | Models | Port plan | Effort |
|---|---|---|---|---|
| **AI-Pushup-Form-Tracker** | GitHub (public), newer copy in `~/Desktop/Out and About/Sidequest/AI_Pushup_Tracking/` | MediaPipe Pose + 220 KB Keras MLP (36 features) | MediaPipe Tasks JS PoseLandmarker (VIDEO mode, confirmed in official docs) + TF.js-converted MLP + rep state machine in JS → **static site, $0** | 2–4 days |
| **Clash Royale Emote Detector** | `~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/` — **not in git** | MediaPipe face/hand/pose + 9.2 MB MobileNetV2 (68% val acc, 5 epochs); emotion is heuristic | MediaPipe Tasks JS Face/Hand/Pose landmarkers + gesture rules in JS + `<audio>` + canvas → **static site, $0**. Blocker: Supercell IP for art/sounds | 3–5 days |
| **Microtubule-Quantification** | GitHub (public) | **No ML** — classical OpenCV (threshold, morphology) + scipy fits | Option 1: OpenCV.js in-browser (static, $0). Option 2: tiny Python upload→result endpoint as a Vercel Python function | 1–2 days |

### Tier C — not web apps; **showcased as case-study pages on the personal site** (Kalp supplies photos, videos, app screens)

These do not get their own subdomain or deployment. Each becomes a page on the hub built from a shared case-study template (see §6, "Showcase pages"). Kalp confirmed he wants UnPark and the RC car featured this way, and that the iOS apps will go to the App Store later as a separate project.

| Project | What it is | Showcase content | Later |
|---|---|---|---|
| **UnPark / "Antifreeze" — the Parkinson's device** (GitHub `UnPark`, local `Sidequest/Antifreeze/`) | iOS app (SwiftUI) + Raspberry Pi with MPU6050 accelerometer + Flask-SocketIO server + Firebase: real-time freezing-of-gait detection, charts, predictive alerts, notifications | Problem statement, hardware photos, app screenshots, demo video, architecture diagram (Pi → Firebase → app), repo link. Fix the repo-name/content mismatch (rename repo or explain "UnPark, codename Antifreeze") | App Store (needs Apple Developer Program, $99 USD/yr, outside the hosting budget) |
| **Automatic-RC-Car** (943 MB repo) | C++ / CMake, PS4-controller-driven autonomous RC car | Build photos, driving video, repo link **after purging the large committed data** | — |
| FlashCardsApp (private, **has committed `GoogleService-Info.plist`**, remove before any public link) | Native iOS, **under construction** | "Under construction" placeholder page only | App Store, later |
| **Porsche PCB keychain** (`~/Documents/Porsche PCB keychain/`, KiCad) | Custom PCB designed as a gift | Board render, schematic, photos Kalp supplies | — |
| **DIY EEG** (`~/Desktop/EEG Circuit /`, KiCad + LTspice) | Hardware, **under construction** | Case-study page marked under construction: schematic, simulation, plan | — |
| ~~Outline~~ | Removed 2026-09-18: not a real project | — | — |
| ~~classmyschedule~~ | Removed 2026-09-18: not Kalp's work | — | — |
| DDoS Detector, TouchDesigner MediaPipe | Needs Kafka / TouchDesigner | Static plots / video, optional | — |
| token-gamble-coinflip, token-coinflip | Superseded by promptflip; plaintext OpenAI keys in DB; unresolved RLS bug | **Take down tokengamblecoinflip.vercel.app, archive both repos** | — |

---

## 2. Criteria (what "best" means here)

1. **Monthly cost** incl. domain — ≤ $10 CAD typical, ≤ $15 CAD worst case.
2. **Fits each runtime shape** — static, serverless Node, Python, browser ML, future GPU.
3. **Free-tier terms are legally OK** for personal, non-commercial portfolio use. Verified: Vercel Hobby's rule only forbids payments, ads, affiliate sites, or being paid to build the site; donations are explicitly allowed.
4. **No dead links** — a recruiter clicking a link should not wait 60 s or hit a paused database.
5. **Connectability** — every project gets a `*.<domain>` subdomain from one DNS panel; the hub can link/embed them.
6. **Operational load** — few dashboards, few secrets, one keep-alive mechanism.
7. **Headroom** — adding a project must be "push to GitHub + add a CNAME", not "re-architect".
8. **Portability** — Next.js and Dockerised Python deploy anywhere, so no provider is a trap.

---

## 3. System decomposition (layers, not products)

```
[Domain + DNS] ── one registrar, one DNS zone, subdomain per project
      │
      ├─ [Hub / portfolio site]           static/Next.js at the apex domain
      ├─ [Static + serverless apps]       promptflip, basketball, Plato, PlantWater, browser-ML demos
      ├─ [Persistent-process apps]        none today; slot reserved (websockets, workers)
      ├─ [ML inference]                   in-browser now; free GPU-on-demand later
      ├─ [Databases / auth]               Supabase (2 free projects, schema-per-app), Neon, Firebase
      ├─ [Analytics]                      one dashboard: visitors per site, geography, interactions
      └─ [Keep-alive + observability]     uptime pings so free tiers never look dead
```

Each layer is chosen independently; a CNAME record is the only coupling. That is what makes "connections" cheap: the hub links to `pushups.<domain>`, `plato.<domain>`, etc., regardless of which provider serves each one.

---

## 4. Verified pricing (Sept 18, 2026, official pages)

USD unless noted. CAD ≈ USD × 1.37.

### Frontend / serverless

| Platform | Free tier | Key limits | Cold start / sleep | Python? | Verdict |
|---|---|---|---|---|---|
| **Vercel Hobby** | $0 | 200 projects, 50 domains/project, 100 GB transfer, 1 M invocations, 4 CPU-hrs active CPU, 300 s max function, cron once/day, non-commercial only | Serverless, ~instant | Yes: Flask/FastAPI/Django as functions, 500 MB bundle, Python 3.12–3.14 | **Primary host** |
| Vercel Pro | $20/mo/seat | Removes commercial restriction, per-minute cron, 1-day logs | — | — | Not needed |
| **Cloudflare Pages + DNS** | $0 | 100 domains/project, 200 DNS records/zone, 500 builds/mo | Static, instant | Workers only | **DNS + registrar**; backup static host |
| Cloudflare Workers Paid | $5/mo | 10 M requests, Containers with 375 vCPU-min/mo | — | Containers | Too little container time for always-on |

### Containers / VPS (only if a persistent process is ever needed)

| Platform | Price | Notes |
|---|---|---|
| **Fly.io** | shared-cpu-1x 256 MB **$2.02/mo**, 512 MB $3.32/mo; stopped machines ≈ $0.15/GB rootfs; shared IPv4 free | Auto-stop/auto-start ⇒ near-$0 when idle, 1–2 s wake. **Best cheap persistent slot** |
| Render Free | $0 | 750 instance-hrs/mo per workspace (= one service always-on), **sleeps after 15 min, ~1 min wake**, free Postgres expires after 30 days | OK for a rarely-used demo; bad first impression |
| Railway Hobby | $5/mo incl. $5 credit; ≈ $10/GB-mo RAM, $20/vCPU-mo | Two small services exceed the credit. Not bang-for-buck |
| Hetzner CX23 / CAX11 | **€5.49 / €5.99/mo** + IPv4 (raised June 15, 2026) ≈ $9.5–10 CAD | Full VPS (Coolify/Dokploy, unlimited apps). Eats the whole budget; keep as the *upgrade path*, not the default |
| Oracle Always Free | $0 | Now 2 ARM OCPU / 12 GB total, 200 GB disk; **reclaimed if idle (<20 % CPU/net/mem over 7 days)**; capacity often unavailable | Free lottery ticket, not a foundation |

### ML / GPU

| Platform | Free | Notes |
|---|---|---|
| **In-browser (MediaPipe Tasks JS, TF.js, OpenCV.js)** | $0 forever | Covers pushup, emote, microtubule. Confirmed: `@mediapipe/tasks-vision` PoseLandmarker supports live webcam VIDEO mode |
| **Hugging Face ZeroGPU** | 2 Gradio Spaces free on a personal account (verified email, 30+ days old); 48 GB VRAM slices; visitors get 2–5 min GPU/day | Best for a future "try my model" Gradio demo. **Note: plain Gradio/Docker CPU Spaces now require PRO ($9/mo); only Static and ZeroGPU Spaces are free** |
| **Modal** | **$30/mo free compute credit**; T4 $0.59/hr, L4 $0.80/hr, A10 $1.10/hr, scale-to-zero | Best for a future GPU *API* behind a Vercel frontend |

### Databases / auth

| Provider | Free tier | Bites first | To exceed |
|---|---|---|---|
| **Supabase Free** | **2 active projects**, 500 MB DB, 1 GB storage, 5 GB egress, **50 k MAU auth (Google OAuth included, no overage)**, 200 Realtime conns, 500 k edge invocations | 2-project cap; **paused after 7 days inactivity** | Pro $25/mo + $10 compute credit; each extra project ≈ +$10/mo ⇒ **4 projects ≈ $55/mo** |
| **Neon Free** | 100 projects, 0.5 GB & 100 CU-hrs each | Fixed 5-min scale-to-zero, ~few-hundred-ms wake | Pay-as-you-go |
| Turso Free / Cloudflare D1 | 100 DBs, 5 GB / 5 GB, 100 k writes/day | — | $4.99/mo / Workers Paid |
| **Firebase Spark** | Firestore 50 k reads/day, RTDB 1 GB, Auth 50 k MAU, Hosting 10 GB | **Cloud Storage requires Blaze since Feb 3, 2026** (card on file, $0 within quota, no hard spend cap); Functions Blaze-only | — |

**Auth answer:** Supabase Auth and Firebase Auth are bundled products, free to 50 k monthly-active users, Google sign-in included. There is no auth subscription to buy. Only phone-based advanced MFA is paid ($75/mo), which nothing here needs.

### Domain + keep-alive

| Item | Price | Notes |
|---|---|---|
| **.com** | Porkbun $11.08/yr (Cloudflare Registrar sells at cost, likely ≤ this; exact price only at checkout) | ≈ $1.27 CAD/mo |
| .dev | $8.75 first yr, $12.87/yr renew | ≈ $1.47 CAD/mo |
| .ca | $8.80 first yr, $9.17/yr renew | ≈ $1.05 CAD/mo; both registrars support it |
| UptimeRobot Free | $0 | 50 monitors at 5-min interval + public status page |
| cron-job.org | $0 | Down to 1-min jobs; good for DB-touching pings |
| GitHub Actions cron | $0 (public repos) | Auto-disabled after 60 days of repo inactivity ⇒ **not** a reliable keep-alive |
| Vercel Hobby cron | $0 | Once per day only |

---

## 5. Options considered, per layer

### 5a. Where the web apps run

| Option | Monthly (CAD) | Pros | Cons |
|---|---|---|---|
| **A1 — Vercel Hobby for everything web, incl. Python** *(recommended)* | $0 | Already in use (4 projects live); one dashboard; Flask/Express run as functions; custom domains free; instant, no sleep; preview deploys per PR | Non-commercial only (fine); once-a-day cron; Plato needs small refactor to be stateless (`/tmp`, external DB) |
| A2 — Vercel Hobby + Cloudflare Pages split | $0 | Spreads risk across two free tiers | Two dashboards for no gain; nothing is near Vercel's limits |
| A3 — Vercel Pro | $28 | Commercial OK, per-minute cron | **Exceeds budget alone**; buys nothing needed |
| A4 — Hetzner VPS + Coolify for everything | ~$10 | Unlimited apps, Postgres, cron, websockets, full control | Whole budget on day 1; Kalp becomes sysadmin (patches, backups, TLS); Next.js loses preview deploys/edge CDN |

### 5b. Persistent processes (none needed today)

| Option | Monthly (CAD) | When |
|---|---|---|
| **B1 — Fly.io auto-stop machine** *(recommended if ever needed)* | ~$2.8 per 256 MB app, ~$0 idle | First project needing websockets/long jobs/> 500 MB Python deps |
| B2 — Render Free | $0 | Throwaway demos where a 1-min wake is acceptable |
| B3 — Hetzner CX23 + Coolify | ~$10 | When ≥ 3 persistent apps exist; replaces B1 |

### 5c. ML inference

| Option | Monthly (CAD) | Verdict |
|---|---|---|
| **C1 — Browser (MediaPipe JS / TF.js / OpenCV.js)** | $0 | Chosen by Kalp; works for all three current demos; private (video never leaves the visitor's device); scales infinitely |
| C2 — HF ZeroGPU Gradio Space | $0 (2 spaces) | Reserve for a future model that genuinely needs a GPU and suits a Gradio UI |
| C3 — Modal function behind a Vercel route | $0 within $30 credit | Reserve for a future GPU API (custom UI); scale-to-zero |
| C4 — Always-on GPU (HF T4 $0.40/hr, ~$400/mo) | ✗ | Never at this budget |

### 5d. Databases

| Option | Monthly (CAD) | Verdict |
|---|---|---|
| **D1 — Supabase Free: promptflip isolated in project A; project B = shared "platform" with one Postgres schema per app** *(recommended, set up now)* | $0 | Officially supported (`CREATE SCHEMA`, expose in API settings, `db: { schema }` in client). Shared `auth.users` = one Google login across Kalp's apps; per-app profile tables + RLS scope access. Pooled 500 MB / 1 GB / 200 Realtime conns are ample. Unlimited future apps without a subscription |
| D2 — Keep promptflip and basketball on their own free projects (status quo) | $0 | Zero migration risk today, but the very next Supabase app forces the schema refactor anyway. Rejected because Kalp expects more backend projects |
| **D3 — Neon Free for "just give me Postgres" apps (Plato)** | $0 | 100 projects, scale-to-zero, no Supabase slot consumed |
| D4 — Supabase Pro | ≥ $35, ~$75 for 4 projects | Rejected |
| D5 — Self-hosted Postgres on a VPS | $0 marginal | Only if B3 happens anyway; never for Auth/Realtime |

### 5e. Domain + DNS

| Option | Verdict |
|---|---|
| **Cloudflare Registrar + Cloudflare DNS (free)** *(recommended)* | At-cost renewals, free DNS with 200 records, free web analytics, proxy/WAF optional, one panel for every subdomain |
| Porkbun + Cloudflare DNS | Fine alternative; shows prices before buying; .ca on sale first year |
| Vercel Domains | Marked up; ties DNS to Vercel |
| Free subdomains (`*.vercel.app`, `*.pages.dev`) | Not a portfolio; keep as fallbacks only |

---

## 6. Recommended architecture

```
                    Cloudflare Registrar + DNS  (~$1.30 CAD/mo)
                    kalp<name>.com  — the only paid line item
                                │
   ┌────────────────────────────┼──────────────────────────────┐
   │                            │                              │
 Vercel Hobby ($0)          Supabase Free ($0)            Firebase Spark ($0)
 ├─ hub  (apex)             ├─ project A: promptflip      └─ PlantWater Firestore/RTDB/Auth
 ├─ promptflip.             │    (isolated, as is)            (photos → Supabase Storage in B
 ├─ hoops.                  └─ project B: "platform"           or Cloudflare R2; Blaze not needed)
 │                               ├─ schema hoops (basketball)
 │                               └─ schema <newapp> … one per future backend
 ├─ plato.   (Flask fn)     Neon Free ($0)
 ├─ plantit. (React + Express fn)   └─ Plato cache DB
 ├─ pushups. (static, MediaPipe JS)
 ├─ emotes.  (static, MediaPipe JS)
 └─ microtubules. (static OpenCV.js, or Python fn)
                                │
 UptimeRobot ($0): 5-min pings on every app's health route + the DB-touching routes (9 monitors, 2026-09-19)
 Reserved slots: Fly.io auto-stop (~$2.8 CAD) · HF ZeroGPU (free ×2) · Modal ($30 credit)
```

### Why this wins on the criteria
- **Cost:** $1.30 CAD/mo baseline, $4.1 CAD with one Fly machine. Even the "outgrow it" path (Hetzner VPS) fits the $15 ceiling.
- **No sleep anywhere a visitor lands:** Vercel is serverless-instant; Supabase pause is defeated by pings; Neon wakes in milliseconds.
- **One dashboard for deploys** (Vercel), one for DNS (Cloudflare), one for alerts (UptimeRobot).
- **Adding a project** = new Vercel project from GitHub + one CNAME + (if it needs Supabase) `CREATE SCHEMA` in project B.
- **Nothing locks in:** every app is a Git repo with a standard framework; Vercel could be swapped for Cloudflare Pages / Netlify / a VPS in an afternoon.

### DNS & subdomain map

| Host | Target | Notes |
|---|---|---|
| `@` (apex) + `www` | Vercel hub | Portfolio site |
| `promptflip.` | Vercel | Update `NEXT_PUBLIC_APP_URL` + Supabase auth redirect URLs |
| `hoops.` | Vercel | basketball dashboard |
| `plato.` | Vercel | Flask as Python function |
| `plantit.` | Vercel | React static + `/api/*` Express function |
| `pushups.`, `emotes.`, `microtubules.` | Vercel | static browser-ML builds |
| `status.` | UptimeRobot public status page | Optional |
| Future GPU demo | `hf.space` custom domain or Modal URL behind a Vercel route | — |

Cloudflare DNS records should be **DNS-only (grey cloud)** for Vercel targets to avoid double-proxy TLS issues.

### The "connections" layer (hub ↔ projects)
- **Project registry:** `projects.json` in the hub repo (name, tagline, subdomain URL, repo URL, status: live/demo/archived, tags, hero image, `healthUrl`). Hub renders cards from it; adding a project is one JSON entry.
- **Live status badges:** each app exposes `/api/health` (promptflip already returns `db: ok`); static demos ship a `health.json`. Hub fetches them client-side, shows green/grey. Same URLs feed UptimeRobot.
- **Shared analytics:** one PostHog project across the hub and every subdomain (see "Analytics layer" below).
- **Back-links:** a tiny shared footer/`<ProjectBar>` ("← part of <domain>") in each app, published later as a small npm/CSS snippet so all apps feel like one family.
- **Shared identity (optional, later):** because future Supabase apps share one project, one Google login works across them.
- **Embeds:** browser-ML demos are static, so the hub can `<iframe>` them on case-study pages for free.

### Analytics layer (Kalp wants: how many people visit, which sites, where they are from, what they interact with)

Options considered:

| Option | Cost | Visitors per site | Geography | Interactions | Verdict |
|---|---|---|---|---|---|
| **PostHog Cloud, free tier** *(recommended)* | $0: 1 M events/mo, 5 k session replays/mo, no credit card, "not a trial" (verified on posthog.com/pricing) | Yes: one project, every site sends to it, filter/break down by host | Yes: country/region/city from IP (built-in web-analytics dashboard) | **Yes:** autocapture of every click, custom events, heatmaps, session replay, funnels | Single tool that answers all four questions; popular open-source product (~30 k GitHub stars); hosted, so nothing to run |
| Vercel Web Analytics (Hobby) | $0: 50 k events/mo shared across projects | Yes | Country | **No custom events on Hobby**, 1-month window only (verified) | Too limited for "what do they interact with" |
| Cloudflare Web Analytics | $0 | Yes (per site) | Country | No events, no click data | Fine backstop, not the answer |
| Umami (self-host on Vercel + Neon) | $0 | Yes | Yes | Custom events only, no replay | Good fallback if PostHog changes its free tier; more to maintain |
| Google Analytics 4 | $0 | Yes | Yes | Yes | Rejected: complex UI, cookie-consent burden, not "simple" |
| Plausible Cloud | $9 USD/mo | Yes | Yes | Custom events | Rejected on budget |

How it is wired:
- One PostHog project ("Kalp portfolio"), one snippet (`posthog-js`) in the hub, every app, and every static demo; the hub template and the new-project template ship with it pre-installed.
- Each site is distinguished by its host (`pushups.<domain>` vs `plato.<domain>`), so the built-in Web Analytics dashboard shows visitors, pageviews, top pages, referrers, countries and devices **per site or all together**.
- Interactions: autocapture records clicks, form submits and page changes with zero code. Each project additionally sends 2–4 named custom events for its core action (`rep_counted`, `emote_fired`, `pdf_parsed`, `plant_identified`, `coinflip_played`, `project_card_clicked`), so Kalp can see which demos people actually use, not just visit. Heatmaps and session replay are enabled on the hub and demos for "what did they do on the page".
- Ad-blocker resilience: PostHog requests are proxied through a Next.js rewrite (`/ingest/*`) on each app, per PostHog's documented reverse-proxy setup, so the numbers are not silently 30–50 % low.
- Privacy: no cookies banner needed for a personal portfolio if PostHog is configured cookieless (`persistence: 'memory'`) and IP-based geolocation is kept at country/city level; session replay masks all text inputs by default. State this in the hub's privacy note.
- Budget guard: a hobby portfolio generates thousands of events a month, not a million. The orchestrator sets a PostHog billing limit of $0 on every product so it can never charge, and notes the usage in STATUS.md monthly. *(Reality, 2026-09-18 T0.5: a custom `$0` limit is only offered after a credit card is added, which these rules forbid; the free plan has no card, no subscription and hard-caps every product at its free allocation, so that cap is the guardrail. Evidence and the check: `docs/analytics.md`, runbook "Check PostHog billing".)*
- Kalp's view: one bookmark, the PostHog Web Analytics dashboard, plus a saved "Top demos by usage" insight and a "Visitors by country" map. Optionally the hub shows a public "visitors this month" number via PostHog's API.

### Living operations skill (`portfolio-ops`): the project's own repair manual for agents

Kalp wants a skill that is written *during* the build, not after, so that any future agent can be handed it and know the whole system and where to look when something breaks. It is the institutional memory of the project.

- **Location:** `skills/portfolio-ops/` inside the hub repo (versioned with the code), plus a symlink/copy installed to `~/.claude/skills/portfolio-ops/` so it is available in any session. Built and maintained with the `superpowers:writing-skills` skill so it follows the SKILL.md format (frontmatter `name`, `description` with trigger phrases like "portfolio is down", "add a project", "Supabase paused").
- **Structure:**
  - `SKILL.md` — when to use it, the 1-page system map (every subdomain → host → repo → database → env location), the "first 5 checks" triage list, and links to the files below.
  - `architecture.md` — the layers, the two Supabase projects and their schemas, DNS map, analytics wiring, keep-alive wiring, with the *reasons* for each choice (so an agent does not "fix" a deliberate decision).
  - `runbooks.md` — step-by-step procedures: add a new project; add a schema to Project B; rotate a secret; attach a domain; redeploy an app; restore a paused Supabase project; re-point OAuth redirects; regenerate types; purge a large file from git history.
  - `incidents.md` — **append-only log**: date, symptom, what was tried, root cause, fix, prevention added. Every failed verifier run, every reviewer rejection that revealed a real bug, and every production hiccup gets an entry. This is the "log when things go wrong" Kalp asked for.
  - `verification.md` — the exact commands/URLs to prove each part is healthy (dig, curl, health routes, PostHog event check, UptimeRobot API), so an agent can go from "something is wrong" to "this specific thing is wrong" in minutes.
  - `settings-map.md` — for every env var and secret: which app uses it, which dashboard holds it, who can rotate it, what breaks without it. Names only, never values.
- **Update rule (enforced by reviewers):** a task is not "done" until the WORKER has updated the skill (new runbook, new settings, or an incident entry) and the REVIEWER has checked it. The QUALITY AUDITOR re-reads the skill every 5 tasks and fixes anything stale or contradicted by the code.
- **Final acceptance test for the skill:** a fresh agent with *only* the skill and repo access is given three simulated failures (Supabase project paused, a subdomain's CNAME deleted, PostHog key rotated) and must diagnose and fix each using the skill alone. Gaps found become the last edits.

### Showcase pages (for UnPark, RC car, iOS apps)
- **Registry entry type:** `projects.json` entries carry `type: "app" | "showcase"`. Showcase entries have no `healthUrl`; their card links to `/projects/<slug>` on the hub instead of a subdomain.
- **Case-study template** (one MDX/Markdown page per project in the hub repo): hero image, one-paragraph problem, "how it works" with an architecture diagram, photo gallery, app-screen carousel, embedded video, tech list, repo link, and a status line ("App Store: coming", "Hardware prototype").
- **Media storage:** optimized images (WebP, ≤ 300 KB) committed to the hub repo and served through Vercel's image optimization (5 000 transformations/mo free on Hobby, ample). **Videos are not committed to git or served from Vercel**: upload to YouTube (unlisted) and embed, or put MP4s in a Cloudflare R2 bucket (10 GB free, no egress fees) and reference by URL. This keeps the hub repo small and the 100 GB Hobby transfer untouched.
- **Kalp supplies the material** (photos, videos, screenshots) per project; the page template makes each one a content task, not a build task.
- **App Store later:** publishing UnPark/Outline/FlashCards needs the Apple Developer Program ($99 USD/yr). That is a separate project and budget line; nothing on the site depends on it. When apps ship, the registry entry gains an `appStoreUrl` and the card shows a badge.

### Database plan, concretely (Kalp expects more Supabase-backed projects, so the shared pattern is set up now)

**Two-project layout, fixed from day one:**

| Supabase project | Role | Contents |
|---|---|---|
| **Project A — `promptflip`** (existing) | Isolated. It is live, has real users, Realtime, and encrypted third-party keys; never share its blast radius | `public` schema, promptflip only |
| **Project B — `platform`** (rename the existing basketball project) | **Shared home for every other backend, one Postgres schema per app** | `hoops` (basketball, moved in now), then `<newapp>` for each future project |

Rules that make adding a backend "fluid":
1. **New app needing Supabase (DB/Auth/Realtime/Storage/Edge Functions) ⇒ new schema in Project B.** Migration 0001 of every app is `create schema <app>; grant usage on schema <app> to anon, authenticated, service_role; alter default privileges …`. Expose the schema in Project B → API settings. Client: `createClient<Database, '<app>'>(url, anonKey, { db: { schema: '<app>' } })`. Edge Functions and Storage buckets are prefixed `<app>-`. RLS policies per table keyed on `auth.uid()`; a per-app `<app>.profiles` table scopes which shared users belong to which app.
2. **New app needing only a Postgres URL (no Supabase features) ⇒ Neon free project** (100 allowed, scale-to-zero). Plato goes here. Keeps Project B's 500 MB for apps that use it.
3. **Never create a third Supabase project.** If an app truly needs isolation (paying users, sensitive data), that is the signal it has outgrown "portfolio" and its own budget line, not a reason to break the rule silently.
4. **Shared `auth.users` in Project B is a feature:** one Google sign-in works across all of Kalp's apps. Per-app authorization lives in RLS + `<app>.profiles`.
5. **Pooled quota watch:** Project B shares 500 MB DB / 1 GB storage / 5 GB egress / 200 Realtime connections across its apps. Add a monthly glance at the Supabase usage page to the keep-alive checklist; nothing in the current set approaches 10 % of these.
6. **Keep-alive:** UptimeRobot 5-min monitors on `promptflip/api/health` (queries DB) and on a `platform` health route that runs `select 1` (add a tiny Edge Function `health` in Project B so the ping exercises both DB and functions). "What counts as activity" is not defined on Supabase's current docs; a DB-touching HTTP route is the community-standard approach and the monitors will show if it fails.
7. **PlantWater photos:** Firebase Storage now needs Blaze (credit card, no hard cap). Move photo uploads to a `plantit-photos` bucket in Project B's Supabase Storage (1 GB free) or Cloudflare R2 (10 GB free). Firestore, RTDB and Auth stay on Spark. Longer term PlantWater could migrate fully to a `plantit` schema in Project B, but that is a rewrite and not required to ship.

**Migration of basketball into Project B (half a day):** rename the project; rewrite the 4 migrations to target `hoops` schema; move the `ingest-shot` Edge Function to `hoops-ingest-shot`; update the dashboard client's `db.schema`; regenerate types with `supabase gen types --schema hoops`; verify the dashboard reads real rows.

**Reusable "new project" template (build once in Phase 1):** a GitHub template repo with Next.js + Supabase client pre-wired to `{ db: { schema: process.env.NEXT_PUBLIC_APP_SCHEMA } }`, migration 0001 creating the schema, `/api/health` route, PostHog snippet with reverse proxy, shared footer, and a `projects.json` entry stub for the hub. Spinning up a new hosted project becomes: use template → `CREATE SCHEMA` → import to Vercel → add CNAME → add registry entry.

---

## 7. Per-project work plan (what must be fixed before it's presentable)

Effort is for Claude-assisted work; ordered by value ÷ effort.

| # | Project | Work | Effort |
|---|---|---|---|
| 1 | **Domain + DNS + hub skeleton** | Buy domain (Cloudflare), zone with subdomains, minimal Next.js hub with `projects.json`, attach apex + `www` on Vercel | ½ day |
| 1b | **Analytics** | PostHog project + $0 billing limits; `posthog-js` with reverse proxy in hub and template; custom events per app; heatmaps + replay on; saved dashboards "Visitors by site", "Visitors by country", "Top demos by usage" | ½ day + 15 min per app |
| 2 | **promptflip** | Attach `promptflip.<domain>`; update `NEXT_PUBLIC_APP_URL` and Supabase redirect URLs; delete `promptflip-35qv` duplicate project; UptimeRobot monitor; prune `docs/loop` screenshots if repo goes public | ½ day |
| 3 | **Cleanup** | Delete `tokengamblecoinflip` Vercel project; archive `token-gamble-coinflip` + `token-coinflip`; remove committed plist from FlashCardsApp before any public link; scrub project refs from basketball `docs/` | 1 hr |
| 4 | **Basketball → `hoops` schema in Project B** | Rename its Supabase project to `platform`; migrations + Edge Function re-targeted to `hoops`; link repo to the existing Vercel project; wire real env; visible "demo data" banner when unconfigured; README says iOS app is a stub; `hoops.<domain>` | 1 day |
| 4b | **New-project template repo** | Next.js + Supabase schema-scoped client + migration 0001 + `/api/health` + analytics snippet + footer + registry stub | ½ day |
| 5 | **Plato → Vercel Python** | Entrypoint `app` in `src/app.py`; uploads/`.ics` to `/tmp` and stream back; drop server-side session state or use signed cookie; `SECRET_KEY` from env; Neon `DATABASE_URL`; `vercel.json` `excludeFiles` for tests/figma folder; `plato.<domain>` | 1–2 days |
| 6 | **Microtubule demo** | OpenCV.js port of the green-channel/threshold pipeline with 3 committed sample cells + overlay + % area, or a FastAPI upload endpoint as a Vercel Python function (swap `opencv-python` → `opencv-python-headless`, drop matplotlib); `microtubules.<domain>` | 1–2 days |
| 7 | **PlantWater** | Fix `.firebaserc`; production API URL; `apps/web` static + Express as `/api` function on Vercel; photos → R2/Supabase Storage; **simulated-device mode** so moisture/watering works without hardware; OpenAI spend cap + cached responses; delete debug entry points; `plantit.<domain>` | 2–3 days |
| 8 | **Pushup tracker → browser** | New repo (Vite + TS): MediaPipe PoseLandmarker VIDEO mode, convert `pushup_model_augmented.h5` → TF.js, port angle features + rep state machine; purge 230 MB of CSV/video/pkl from the old repo; write README; `pushups.<domain>` | 2–4 days |
| 9 | **Emote detector → browser** | `git init` the local folder first; new Vite app with Face/Hand/Pose landmarkers + gesture rules; convert MobileNetV2 → TF.js or drop it (heuristics carry the 3 working gestures); **keep Supercell art/sounds, ship under Supercell's fan-content policy with attribution and a "not affiliated" notice** (Kalp's decision); delete TASK_*.md docs; `emotes.<domain>` | 3–5 days |
| 10 | **Showcase pages (hub)** | Case-study template + pages for **UnPark/Antifreeze (Parkinson's device)** and **Automatic-RC-Car** first (Kalp provides photos/videos/screens; purge the 943 MB RC-car repo), then Outline, FlashCards, classmyschedule | 2–3 days + Kalp's media |
| 12 | **Living operations skill** (`portfolio-ops`) | Created in Phase 0 with superpowers:writing-skills and updated after every task: architecture map, where every setting lives, runbooks, incident log, verification commands. Final pass at acceptance | 1 hr setup + 10 min per task |
| 11 | **Keep-alive + status** | UptimeRobot monitors for every subdomain + DB-touching routes; cron-job.org 1-min job optional; `status.<domain>` public page | 1 hr |

---

## 8. Cost summary

| Line item | CAD / month | Notes |
|---|---|---|
| Domain (.com at cost) | ~1.30 | Only mandatory spend |
| Vercel Hobby | 0 | All web apps + Python functions |
| Cloudflare DNS / Registrar / R2 / Web Analytics | 0 | |
| Supabase Free ×2 projects | 0 | Auth included |
| Neon Free | 0 | Plato cache |
| Firebase Spark | 0 | PlantWater (no Storage, no Functions) |
| UptimeRobot / cron-job.org | 0 | |
| PostHog Cloud (analytics, replays, heatmaps) | 0 | 1 M events/mo free, $0 billing limit set |
| **Baseline total** | **≈ 1.30** | |
| Optional: Fly.io auto-stop machine | +2.8 | Only when a persistent process appears |
| Optional: HF ZeroGPU ×2 / Modal $30 credit | 0 | Future GPU demos |
| Upgrade path: Hetzner CX23 + Coolify | +9.7 | Replaces Fly when ≥ 3 persistent apps; still ≤ $15 ceiling |

For comparison, the plan Kalp was considering: Vercel Pro ($28 CAD) alone is 2× the ceiling; Vercel Pro + Supabase Pro (~$62 CAD) is 4×.

---

## 9. Phased roadmap

- **Phase 0 (week 1): foundation.** Items 1, 2, 3, 11. Outcome: domain live, hub live, promptflip on its subdomain, old coinflip gone, monitors green.
- **Phase 1 (weeks 2–3): platform + quick wins.** Items 4, 4b, 5, 6. Outcome: Supabase "platform" project established with `hoops` as its first schema, the new-project template exists, three more live subdomains, all $0.
- **Phase 2 (weeks 3–5): PlantWater.** Item 7.
- **Phase 3 (weeks 5–9): browser ML ports.** Items 8, 9.
- **Phase 4 (ongoing): showcase pages + polish.** Item 10 (UnPark and RC car first, as soon as Kalp hands over media, which can happen in parallel with any earlier phase); shared footer/analytics; hub design pass.
- **Separate later project:** Apple Developer Program + App Store submission for UnPark, Outline, FlashCards.

Each phase is an independent brainstorm → spec → implementation cycle (the emote and pushup ports are new codebases and should get their own specs). This document is the *system design*; it does not replace per-project specs.

---

## 10. Verification (how we know it worked)

1. `dig +short <sub>.<domain>` resolves to Vercel for every subdomain; `curl -I https://<sub>.<domain>` returns 200 with a valid TLS cert.
2. Every `/api/health` (or `health.json`) returns OK; hub badges render green.
3. UptimeRobot shows 100 % uptime for **≥ 8 consecutive days** on both Supabase-backed apps (past the 7-day pause threshold) with no manual restore.
4. Supabase dashboard shows both projects "Active"; Neon shows Plato project waking on request.
5. Vercel usage page after 30 days: Fast Data Transfer, invocations and Active CPU all well under Hobby limits.
6. Billing check at month end: Cloudflare (domain only), Vercel $0, Supabase $0, Neon $0, Firebase $0.
7. Browser-ML demos: run on a phone over cellular, no server calls in the Network tab.
8. Lighthouse ≥ 90 performance on hub and each static demo.
9. Analytics: visit each site from a phone and a laptop; within 5 minutes PostHog shows both visits under the right host with the right country, the click autocapture, and each app's custom event (e.g. one `rep_counted`). Billing limits read $0 on every PostHog product.

---

## Decisions confirmed by Kalp (2026-09-18)

12. **Dark mode on the hub (2026-09-21, "implement a dark mode to the portfolio website").** KalpOS has two appearances chosen from KalpOS ▸ Appearance ▸ Light / Dark / Auto (persisted in `localStorage` `kalpos:appearance`, applied pre-paint); every colour is a `light-dark()` token on `:root` in `app/globals.css`. This supersedes DESIGN.md's earlier "black is the only dark surface, the desk never inverts". The default stays **Light** (overnight supervisor ruling: the brief added a capability, not a change to what visitors see) until Kalp says otherwise — STATUS.md "Needs Kalp".

11. **Full redesign at the end.** Kalp has a design theme in mind and will redesign the whole portfolio (hub + case-study pages) once the projects work. Until then, design effort on the hub is limited to correctness and accessibility; all visual decisions stay in DESIGN.md tokens and shared components so the redesign replaces them in one pass.

10. **No paid API keys in public demos.** Kalp's own OpenAI (or similar metered) keys are never set on a hosted project. Demos use a free/canned path by default and may offer an optional bring-your-own-key input that stays in the visitor's browser and is sent per request only. Pl@ntNet (free tier) is fine to set server-side.

1. **Domain:** `.com`, bought at cost via Cloudflare Registrar (exact name chosen at purchase time).
2. **Emote detector assets:** keep Supercell art/sounds, ship with attribution and a "not affiliated" notice under Supercell's fan-content policy.
3. **Supabase:** he expects more backend projects, so the shared "platform" project with schema-per-app is set up now (basketball moves in), and promptflip stays isolated.
4. **Budget:** ~$10 CAD/mo target, $15 hard max, non-commercial, browser-side ML preferred.
5. **Analytics:** he wants to see visitor counts per site, where visitors are from, and what they interact with; PostHog Cloud free tier is the single tool for this.
6. **Minimal involvement:** agents use MCP servers and CLIs (Vercel, Supabase, PostHog, Cloudflare, GitHub) wherever possible, and the Chrome tools for dashboards without an API, so Kalp's input is limited to one batch of one-time logins plus the human checkpoints.
7. **Non-web projects:** UnPark ("Antifreeze") *is* the Parkinson's device. It and the Automatic RC Car are featured as showcase pages on the personal site with media Kalp provides; they need no separate hosting. The iOS apps go to the App Store later as their own project.
8. **Excluded:** the DBS transfer-function research pipeline is not part of this project. (The DIY EEG hardware project IS included as an under-construction showcase, per Kalp 2026-09-18.) Outline is removed. FlashCards is shown as under construction.
9. **Living ops skill:** a `portfolio-ops` skill is created at the start and updated after every task (architecture, runbooks, incident log, verification), so any future agent can keep the system running.

---

## Appendix — Goal-mode prompt (copy everything between the fences into cmux goal mode)

```
# GOAL: Build and launch Kalp's project-hosting platform and portfolio site

You are the orchestrator for a multi-week, multi-agent build. Kalp is NOT a developer by trade
and will not be watching. He values simple tools, no corners cut, and work that is verified,
not claimed. You run autonomously; you only stop for the "HUMAN CHECKPOINT" items below.

## Source of truth
The system design is /Users/kalp/.claude/plans/i-need-a-place-fluttering-eagle.md.
FIRST ACTION: create the hub repo (Next.js, GitHub KalpKan/portfolio, public) and copy that plan
into docs/hosting-plan.md so every agent can read it from the repo. Do not re-litigate the
architecture in that document; execute it. If reality contradicts it (a price changed, an API
is gone), update docs/hosting-plan.md with the evidence and continue.

## Hard constraints (never violate; a reviewer must reject any work that does)
- Money: total recurring spend <= $10 CAD/mo target, $15 CAD hard max. Domain is the only
  planned spend. NEVER upgrade Vercel, Supabase, Firebase, Hugging Face, or any service to a
  paid tier. Never attach a credit card to a service. If a step seems to need money, stop and
  raise a HUMAN CHECKPOINT instead.
- Supabase: exactly two projects. Project A = promptflip (do not touch its schema/data beyond
  domain/redirect URLs). Project B = "platform", one Postgres schema per app. Never create a
  third project. DB-only apps go to Neon Free.
- Non-commercial only: no payments, ads, or affiliate links anywhere.
- Never commit secrets. Every repo gets a .env.example; real values live only in Vercel/host
  env settings. Run a secret scan before any push to a public repo.
- Never delete or force-push anything Kalp made without a HUMAN CHECKPOINT, except the items
  the plan explicitly marks for removal (tokengamblecoinflip Vercel project, promptflip-35qv
  duplicate, archiving the two old coinflip repos).
- ML demos run in the browser (MediaPipe Tasks JS / TF.js / OpenCV.js). No Python inference
  servers.
- Simplicity for Kalp: every repo ends with a plain-English README section "How to run this /
  How to deploy this / Where the settings live" written for a non-developer. Prefer managed
  dashboards (Vercel, Cloudflare, Supabase, UptimeRobot) over custom scripts for anything he
  will touch later. No bespoke infra tooling.

## MCP-first (minimize what Kalp has to do by hand)
- Use an MCP server or CLI for every provider before falling back to asking Kalp:
  * Vercel: the vercel MCP plugin (mcp__plugin_vercel_vercel__authenticate, then its tools) and
    the vercel CLI for projects, env vars, domains, deployments, deletions.
  * Supabase: the supabase MCP server (mcp__supabase__authenticate, then its tools) for
    creating schemas, running migrations, exposing schemas in API settings, Edge Functions,
    storage buckets, renaming project B; the supabase CLI for `gen types`.
  * GitHub: `gh` CLI (already authenticated as KalpKan) for repos, archiving, secrets, Actions.
  * PostHog: install PostHog's official MCP server (https://posthog.com/docs/model-context-protocol)
    with a personal API key Kalp pastes once; use it to create the project, insights,
    dashboards and read usage. Otherwise the PostHog REST API.
  * Cloudflare: install Cloudflare's official MCP server or use an API token (DNS records,
    R2 buckets, Web Analytics). Domain PURCHASE itself is H1 (needs his card).
  * Neon: `neonctl` CLI or Neon's API/MCP for creating Plato's database.
  * UptimeRobot: REST API with an API key Kalp pastes once.
  * Anything with no API (Google Cloud OAuth console, one-off dashboard toggles): drive it
    with the claude-in-chrome skill in Kalp's logged-in browser and screenshot the result,
    rather than writing him instructions.
- H0 (do this FIRST, one batch): list every one-time login/API key needed for the above
  (Vercel MCP auth click, Supabase MCP auth click, PostHog personal API key, Cloudflare API
  token, UptimeRobot API key, Neon API key) in STATUS.md with exact steps, and ask Kalp for
  them all at once. Store them only in the local MCP config / env, never in a repo. Until they
  arrive, work on everything that needs none of them (repo cleanup, code ports, templates,
  READMEs, showcase pages).

## Operating model (how to use agents)
- You (orchestrator) never write product code yourself. You plan, dispatch, review, and track.
- For each phase, invoke superpowers:writing-plans to turn the phase into bite-sized tasks
  (each finishable by one agent in one sitting, with an explicit definition of done and a
  verification command). Then run them with superpowers:subagent-driven-development, using
  superpowers:dispatching-parallel-agents for tasks with no shared files. Use
  superpowers:using-git-worktrees so parallel agents never collide.
- Every task gets THREE agents, in order:
  1. WORKER (general-purpose): receives a full brief (goal, the relevant plan section pasted
     in, repo path, files to touch, definition of done, verification command, constraints
     above). Must follow superpowers:test-driven-development where code is written, and
     superpowers:verification-before-completion before reporting. Reports what it verified
     with actual command output.
  2. REVIEWER (fresh general-purpose agent, no shared context): runs superpowers:
     requesting-code-review style review plus the /code-review skill at high effort on the
     diff. Checks: matches the plan section, no secrets, no paid-tier drift, README updated,
     tests pass, simplicity for a non-developer. Returns APPROVE or a numbered fix list.
  3. VERIFIER (fresh agent): does NOT read the worker's report. Independently runs the
     definition-of-done checks (curl the URL, run the tests, open the page with the
     claude-in-chrome skill and take a screenshot, check DNS with dig). Returns PASS/FAIL
     with evidence.
  A task is done only when REVIEWER approves AND VERIFIER passes. On failure, send the fix
  list back to the same WORKER (SendMessage) at most twice; on a third failure, escalate to a
  new WORKER with the failure history included.
- Every 5 completed tasks, dispatch a QUALITY AUDITOR agent that re-verifies ALL previously
  completed tasks' definitions of done (regressions happen) and reads every README as if it
  were Kalp. It files fix tasks for anything degraded.
- For anything with a user interface (hub site, case-study pages, demo UIs), the WORKER must
  invoke impeccable:impeccable for the design pass, and a design REVIEWER must use
  claude-in-chrome to screenshot desktop AND phone widths and reject anything that looks
  generic, broken, or unreadable in dark mode.
- Use the vercel:* skills (vercel:deploy, vercel:env, vercel:deployments-cicd,
  vercel:vercel-cli, vercel:nextjs) for all Vercel work; use vercel:verification after each
  deploy. Use superpowers:systematic-debugging for any failure before changing code.
- Keep a living STATUS.md in the hub repo: task table (id, phase, status, URL, verified-by,
  date), open HUMAN CHECKPOINT list, spend tracker (must read $0 + domain), and a short
  "what changed this session" log. Update it after every task. This is Kalp's only dashboard.

## LIVING OPS SKILL (the project's repair manual, written as you go)
- In Phase 0, use superpowers:writing-skills to create skills/portfolio-ops/ in the hub repo
  (SKILL.md + architecture.md + runbooks.md + incidents.md + verification.md +
  settings-map.md, per docs/hosting-plan.md section 6 "Living operations skill") and install a
  copy at ~/.claude/skills/portfolio-ops/. SKILL.md's description must list trigger phrases
  ("portfolio is down", "add a project to the portfolio", "Supabase paused", "deploy failed").
- Every task's definition of done includes: WORKER updates the skill (new runbook, settings
  entry, or incident) and REVIEWER confirms it. Every verifier FAIL, reviewer-found bug, and
  production hiccup becomes an append-only incidents.md entry: date, symptom, tried, root
  cause, fix, prevention. Never delete entries.
- The QUALITY AUDITOR re-reads the whole skill every 5 tasks against the real code/dashboards
  and fixes anything stale. Names of env vars only, never values.
- Final acceptance: a fresh agent given ONLY the skill and repo access must diagnose and fix
  three simulated failures (Supabase project paused; a subdomain CNAME removed; PostHog key
  rotated) using the skill alone. Any gap it hits is fixed in the skill before you finish.

## HUMAN CHECKPOINTS (batch them; never block on one when others can proceed)
Collect these into STATUS.md under "Needs Kalp" and notify him ONCE per batch, with exact
click-by-click instructions. Continue all work that does not depend on them.
  H0. One-time logins and API keys for the MCP-first section (single batch, first thing).
  H1. Buy the .com domain at Cloudflare Registrar (needs his card and Cloudflare login). Until
      then, deploy everything to *.vercel.app and keep a DNS_PENDING list of the CNAMEs to add.
  H2. Any OAuth console change (Google Cloud console redirect URIs for promptflip's Google
      login on the new domain) if the CLI/MCP cannot do it.
  H3. Media for showcase pages: photos, videos, app screenshots for UnPark/Antifreeze
      (Parkinson's device), Automatic-RC-Car, Outline, FlashCards. Build the pages with clearly
      labelled placeholders so they ship the moment media arrives.
  H4. Making private repos public (promptflip, FlashCardsApp) is his call; prepare them
      (prune, scrub, README) and list them as ready.
  H5. Anything that would cost money or delete his data.
  Do NOT ask him design or implementation questions; decide, document the decision in
  STATUS.md, and move on.

## Phases and definitions of done (details in docs/hosting-plan.md sections 6-10)
Phase 0 — Foundation
  T0.1 Hub repo + Next.js skeleton + projects.json registry + /api/health + STATUS.md +
       docs/hosting-plan.md. DoD: deployed on Vercel Hobby, returns 200, Lighthouse >= 90,
       README for a non-developer.
  T0.0 Living ops skill scaffold (skills/portfolio-ops/, see LIVING OPS SKILL) created with
       superpowers:writing-skills before any other task; installed to ~/.claude/skills/.
       DoD: a fresh agent loads it and can state the system map and the first 5 triage checks.
  T0.5 Analytics: PostHog Cloud project with $0 billing limits on every product; posthog-js
       via a /ingest reverse-proxy rewrite in the hub (and baked into the new-project
       template); autocapture, heatmaps and session replay on; cookieless config; saved
       dashboards "Visitors by site", "Visitors by country", "Top demos by usage". Every app
       deployed later must add its snippet and 2-4 named custom events (rep_counted,
       emote_fired, pdf_parsed, plant_identified, coinflip_played, project_card_clicked) as
       part of its own DoD. DoD: a verifier visits the hub from a phone and a laptop and both
       appear in PostHog within 5 minutes with correct host and country; a test custom event
       shows up; billing limits screenshot in STATUS.md.
  T0.2 Cleanup: delete Vercel projects tokengamblecoinflip and promptflip-35qv; archive
       GitHub repos token-gamble-coinflip and token-coinflip. DoD: `vercel project ls` shows
       neither; repos show archived.
  T0.3 UptimeRobot monitors (free) for hub, promptflip /api/health, and a platform health
       route; public status page. DoD: monitors green for 24h, screenshot in STATUS.md.
  T0.4 DNS plan file (DNS_PENDING.md) listing every record to create once H1 is done; when H1
       lands, add records (Cloudflare API token supplied by Kalp via env, never committed) and
       attach domains to each Vercel project. DoD: `dig` resolves, HTTPS 200 on every host.
Phase 1 — Platform + quick wins
  T1.1 Supabase project B: rename to platform, `hoops` schema, migrate basketball's 4
       migrations + Edge Function, expose schema, regenerate types. DoD: dashboard shows real
       rows, demo-data banner appears only when env is missing, hoops.<domain> live.
  T1.2 New-project template repo (Next.js + schema-scoped Supabase client + migration 0001 +
       /api/health + PostHog snippet with proxy + footer + registry stub). DoD: template used to spin up a
       throwaway app end-to-end in < 15 min, then deleted.
  T1.3 Plato on Vercel Python functions + Neon Free DB. DoD: upload a real Western course
       outline PDF, download a valid .ics, plato.<domain> live, cold request < 3 s.
  T1.4 Microtubule demo in-browser (OpenCV.js) with 3 sample cells. DoD: works on a phone with
       zero network calls after load; number matches the Python pipeline on the samples
       within 1%.
Phase 2 — PlantWater
  T2.1 Repair + redeploy (frontend static, Express as /api function, photos to Supabase
       Storage bucket in project B, simulated-device mode, OpenAI spend guard + cached
       responses, delete debug entry points). DoD: identify a plant from a photo end-to-end on
       plantit.<domain> with no hardware; Firebase stays on Spark.
Phase 3 — Browser ML ports (each is a NEW codebase: run superpowers:brainstorming ->
  spec in docs/superpowers/specs -> writing-plans before code)
  T3.1 Pushup tracker: MediaPipe PoseLandmarker + TF.js MLP + rep state machine. DoD: counts
       good reps from a webcam on desktop and phone; old repo purged of 230 MB of data files.
  T3.2 Emote detector: git-init the local folder first; Face/Hand/Pose landmarkers + gesture
       rules; Supercell assets kept with attribution + "not affiliated" notice; delete TASK_*.md
       docs. DoD: the 3 working gestures fire on a phone with sound; honest README.
Phase 4 — Showcase pages
  T4.1 Case-study template + pages for UnPark/Antifreeze and Automatic-RC-Car (placeholders
       until H3), then Outline, FlashCards, classmyschedule. Do NOT include the DBS
       transfer-function or EEG research. Purge the RC car repo's large files. DoD: pages pass
       the design review at phone and desktop widths.
Final — Acceptance
  Run docs/hosting-plan.md section 10 verification in full, with evidence pasted into
  STATUS.md, including 8 consecutive days of green UptimeRobot on both Supabase projects.
  Produce a one-page plain-English handover in the hub README: what exists, where each
  setting lives, how to add a project, what costs money (only the domain). Run the living
  ops skill's three-failure acceptance test and close every gap it finds.

## Definition of "very good"
Nothing is reported done without a fresh agent independently reproducing the result. Every
deployed URL has been opened in a real browser by a verifier. Every repo has tests that run in
CI (GitHub Actions, free) and a README a non-developer can follow. Spend stays at domain-only.
Kalp's total involvement: H0 keys once, H1 domain purchase once, media when he has it, and
reading STATUS.md.
```

---

## 11. Phase 5 — Functional audit and defect reports (added 2026-09-18 at Kalp's request)

After every project is deployed and the platform work is done, each project is tested as a real user would use it, and anything that does not work gets a written report. Kalp will then spin up fixing agents that read those reports in parallel.

**Scope:** every entry in `projects.json` with `type: "app"` (promptflip, hoops, plato, plantit, pushups, emotes, microtubules) plus the hub itself. Showcase pages are checked for rendering only.

**Method (one fresh AUDITOR agent per project, no shared context):**
1. Read the project's README and its section in this plan; write down what "working as intended" means in 3–6 user stories (e.g. "upload a course-outline PDF and download a calendar with the right dates").
2. Exercise each story in a real browser via the claude-in-chrome skill at desktop and phone widths, with real inputs (a real PDF, the webcam, a plant photo, a Google login where applicable). Also run the repo's own test suite.
3. Record every failure with: exact steps, expected vs actual, screenshot path, console/network errors, and the file or component most likely responsible (from a quick read of the code).

**Output, one file per project:** `docs/reports/<slug>.md` with this fixed structure so fixing agents can consume it cold:

```
# <Project> functional audit — <date>
Live URL · Repo · Vercel project · Database · Health route
## Verdict: WORKING | PARTIALLY WORKING | BROKEN
## User stories tested (table: story | result | evidence)
## Defects (one per section, numbered)
### D1 — <one-line title>
Severity: blocker | major | minor
Steps to reproduce
Expected / Actual
Evidence (screenshot path, console/network excerpt)
Likely cause (file:line or component, with reasoning)
Suggested fix (1–3 sentences; not implemented)
## Known limitations that are NOT defects (e.g. needs hardware, by-design demo mode)
## How a fixing agent should verify the fix (exact commands/URLs)
```

`docs/reports/INDEX.md` summarises all projects in one table (slug | verdict | blockers | majors | minors | report link) and is linked from STATUS.md.

**Closed loop (added 2026-09-18 at Kalp's request):** Phase 5 is not report-only. Per project a SPEC agent writes `docs/reports/<slug>-spec.md` (user stories + a measurable consumer-grade bar + test assets such as a labelled corpus or ground-truth video clips), then TEST → FIX rounds repeat (up to 4 for the projects Kalp flagged) until every story meets its bar, followed by a code review and an independent verifier. Webcam features are tested end-to-end with Playwright's fake camera fed by ground-truth clips; pipelines are measured on the whole corpus. Kalp's flagged projects: Plato (extraction consistency), pushups (real-time webcam counting, consistent), emotes (detection quality), Plant It (works as intended without hardware).

**Definition of done for Phase 5:** every app project has a report; a REVIEWER confirms each defect is reproducible from the steps alone; INDEX.md is complete; `skills/portfolio-ops/verification.md` gains a "functional smoke test" per project derived from the user stories, so future regressions are caught the same way.

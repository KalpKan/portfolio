# STATUS — Kalp's portfolio platform

_This is Kalp's dashboard. Updated after every task. Newest at top of each section._

## Needs Kalp (human checkpoints)

### H0 — one-time logins and keys: ✅ DONE 2026-09-18
All operator keys received and verified (PostHog, Cloudflare, UptimeRobot, Neon, Supabase access token). Stored only in `~/.config/portfolio-ops/secrets.env` (owner-only). Vercel uses the already-logged-in CLI. The Vercel/Supabase MCP OAuth flows kept expiring, so the CLI + Management API route is used instead; nothing further needed.

### H1 — buy the .com domain: ✅ DONE 2026-09-18 (`kalpkan.com`)
Bought on Cloudflare Registrar (zone active, Free plan). Same day the hub went live at **https://kalpkan.com** (www redirects to it) and the basketball dashboard at **https://hoops.kalpkan.com**, both with valid TLS. Records for the other subdomains are added as each Vercel project is created (`docs/DNS_PENDING.md`).

### H3 — media for showcase pages (whenever convenient)
Photos, videos, app screenshots for: UnPark/Antifreeze, Automatic RC Car, Outline, FlashCards. Drop them in `~/projects/portfolio/media-inbox/<project>/` and tell Claude.

### H4 — decide later
Make `promptflip` and `FlashCardsApp` public on GitHub once Claude marks them "ready".

### H5 — promptflip is deployed twice on Vercel; pick which one to keep (found 2026-09-18, T0.2)
Vercel has two projects auto-deploying from `KalpKan/promptflip`: **`promptflip-35qv` is the live one** (https://promptflip-35qv.vercel.app, health `ok`, DB `ok`) and **`promptflip`** (the one your local checkout is linked to) has a **failed** production build and its URL is a 404. Claude did **not** delete either. Every push currently builds both (2x Hobby build minutes), and any `vercel` command run from `~/projects/promptflip` targets the broken one. Reply with one of:
1. **"keep 35qv"** (recommended, least work): Claude re-links `~/projects/promptflip` to `promptflip-35qv` and deletes the `promptflip` project. The URL people already use stays the same.
2. **"keep promptflip"**: Claude fixes the `promptflip` project's build, confirms its health route, then deletes `promptflip-35qv` (URL changes to `promptflip-kks-projects-2edcb11a.vercel.app` until the domain arrives).
Full evidence: `skills/portfolio-ops/incidents.md`, entry 2026-09-18.

## Spend tracker
| Item | Monthly (CAD) |
|---|---|
| `kalpkan.com` domain (Cloudflare Registrar, at-cost renewal, roughly $10.50 USD/yr) | ~$1.30 |
| Everything else (Vercel, Supabase, Neon, Firebase, UptimeRobot, PostHog) | $0 |

## Tasks
| ID | Phase | Task | Status | URL | Verified by | Date |
|---|---|---|---|---|---|---|
| T0.0 | 0 | Living ops skill scaffold | ✅ verified | skills/portfolio-ops/ (installed to ~/.claude/skills/portfolio-ops/) | verifier 2026-09-18 | 2026-09-18 |
| T0.1 | 0 | Hub repo + Next.js skeleton | done (deployed) | https://portfolio-alpha-eight-rjbs2nj1q0.vercel.app | | 2026-09-18 |
| T0.2 | 0 | Cleanup old Vercel projects + archive repos | ✅ verified (partial by design: `tokengamblecoinflip` deleted; `token-gamble-coinflip` + `token-coinflip` archived; `promptflip-35qv` kept, see H5) | https://github.com/KalpKan/token-gamble-coinflip, https://github.com/KalpKan/token-coinflip (archived) | verifier 2026-09-18 | 2026-09-18 |
| T0.3 | 0 | UptimeRobot monitors | ✅ verified (3 monitors up, email alerts, public status page, $0) | https://stats.uptimerobot.com/a6n3Wx3PBp (inventory: docs/monitors.md) | verifier 2026-09-18 | 2026-09-18 |
| T0.4 | 0 | DNS_PENDING.md | ✅ reviewed (plan); **executed for hub + hoops** 2026-09-18; promptflip waits on H5; plato/plantit/pushups/emotes/microtubules wait on their Vercel projects | https://kalpkan.com, https://hoops.kalpkan.com, docs/DNS_PENDING.md §5 | reviewer 2026-09-18 (plan) | 2026-09-18 |
| T5.x | 5 | Functional audit + defect reports for every project (docs/reports/) | queued (after all deploys) | | | |
| T0.5 | 0 | PostHog analytics | queued (starts after T0.1) | | | |

## Decisions log
- 2026-09-18: DNS records use the project-specific `<hash>.vercel-dns-017.com` CNAME that `vercel domains verify` prints, not the generic `cname.vercel-dns-0.com` from the docs; the apex uses the single `A 76.76.21.21` that `inspect` printed rather than Vercel's newer two-address pair, to keep one record per host. UptimeRobot monitors stay on the `*.vercel.app` hosts for 24 h before being moved.
- 2026-09-18: T0.3 monitors the basketball dashboard at its public alias `v0-basketball-analytics-dashboard-seven.vercel.app`, because the team-scoped alias redirects every visitor to a Vercel SSO page. UptimeRobot v2 write API is blocked on the Free plan; v3 is used for writes (runbook updated).
- 2026-09-18: Supabase Management API shows 4 projects: PromptFlip (active), ShootIt = basketball (paused), plato-course-converter (paused), "KalpKan's Project" (paused). Paused projects do not count toward the 2-active cap. Plan: restore ShootIt as Project B "platform" in T1.1; leave the other two paused (Plato goes to Neon). Never have more than 2 active.
- 2026-09-18: T0.2 kept `promptflip-35qv` instead of deleting it: it is the live promptflip (READY, health+DB ok); the locally-linked `promptflip` project is the broken one. Escalated as H5 rather than guessing.
- 2026-09-18: `/goal` mode rejected the prompt (4000-char limit), so the orchestration runs in the interactive session instead. Same operating model (worker → reviewer → verifier).

## Session log
- 2026-09-18: H1 landed (`kalpkan.com`). T0.4 executed: A + www records for the hub and CNAME for hoops created DNS-only via the Cloudflare API; www → apex 308 set via Vercel API; TLS issued for all three within 2 min. The hoops project needed a `vercel redeploy` of its last Ready build first because its newest production build had errored since April (no deletion). Evidence in `docs/DNS_PENDING.md` §5.
- 2026-09-18: T0.3 done and verified; status page https://stats.uptimerobot.com/a6n3Wx3PBp.
- 2026-09-18: T0.1 hub deployed to Vercel Hobby (project `portfolio`); health, status proxy, 12-entry registry, CI workflow, README for Kalp. Lighthouse perf 0.92.
- 2026-09-18: repo created, plan copied to docs/hosting-plan.md, Phase 0 dispatched.

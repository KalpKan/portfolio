# STATUS — Kalp's portfolio platform

_This is Kalp's dashboard. Updated after every task. Newest at top of each section._

## Needs Kalp (human checkpoints)

### H0 — one-time logins and keys (do all in one sitting, ~10 minutes)
1. **Vercel MCP**: open this link, click Authorize:
   (link is posted in the chat; expires quickly — if it fails, ask Claude for a fresh one)
2. **Supabase MCP**: open this link, click Authorize:
   (link is posted in the chat)
3. **PostHog**: create a free account at https://us.posthog.com/signup (no card). Then Settings → Personal API keys → create key with all scopes → paste the key in chat as `POSTHOG_PERSONAL_API_KEY=...`
4. **Cloudflare**: create a free account at https://dash.cloudflare.com/sign-up. Then My Profile → API Tokens → Create Token → "Edit zone DNS" template (All zones) → paste as `CLOUDFLARE_API_TOKEN=...`. (Domain purchase is H1, separate.)
5. **UptimeRobot**: create a free account at https://uptimerobot.com. Then Integrations & API → Main API key → paste as `UPTIMEROBOT_API_KEY=...`
6. **Neon**: create a free account at https://console.neon.tech (GitHub login is fine). Then Account settings → API keys → create → paste as `NEON_API_KEY=...`

### H1 — buy the .com domain (after H0 item 4)
Cloudflare dashboard → Domain Registration → Register Domains → search your chosen name → buy (~$10–11 USD/yr). Then tell Claude the domain name.

### H3 — media for showcase pages (whenever convenient)
Photos, videos, app screenshots for: UnPark/Antifreeze, Automatic RC Car, Outline, FlashCards. Drop them in `~/projects/portfolio/media-inbox/<project>/` and tell Claude.

### H4 — decide later
Make `promptflip` and `FlashCardsApp` public on GitHub once Claude marks them "ready".

## Spend tracker
| Item | Monthly (CAD) |
|---|---|
| Everything | $0 (domain not bought yet) |

## Tasks
| ID | Phase | Task | Status | URL | Verified by | Date |
|---|---|---|---|---|---|---|
| T0.0 | 0 | Living ops skill scaffold | in progress | | | 2026-09-18 |
| T0.1 | 0 | Hub repo + Next.js skeleton | in progress | | | 2026-09-18 |
| T0.2 | 0 | Cleanup old Vercel projects + archive repos | in progress | | | 2026-09-18 |
| T0.3 | 0 | UptimeRobot monitors | blocked on H0 | | | |
| T0.4 | 0 | DNS_PENDING.md | done (plan written; execution waits on H1) | docs/DNS_PENDING.md | | 2026-09-18 |
| T0.5 | 0 | PostHog analytics | blocked on H0 | | | |

## Decisions log
- 2026-09-18: `/goal` mode rejected the prompt (4000-char limit), so the orchestration runs in the interactive session instead. Same operating model (worker → reviewer → verifier).

## Session log
- 2026-09-18: repo created, plan copied to docs/hosting-plan.md, Phase 0 dispatched.

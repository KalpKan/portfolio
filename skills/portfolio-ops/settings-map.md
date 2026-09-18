# Settings map

Every environment variable and secret in the platform: which app uses it, which dashboard holds the real value, who can rotate it, and what breaks without it. **Names only, never values.** Real values live only in the owning dashboard (Vercel project settings, Supabase, Cloudflare, and so on) or in the local MCP configuration on Kalp's machine; never in a repo, never in this file, never in `STATUS.md` or a chat transcript.

Every task that introduces, renames, or removes a variable updates this table before it counts as done.

**promptflip caveat (until human checkpoint H5 is resolved):** promptflip is deployed as two Vercel projects, `promptflip-35qv` (the live one, serving `https://promptflip-35qv.vercel.app`) and `promptflip` (the one `~/projects/promptflip/.vercel/project.json` links to, whose builds currently fail). Both hold the same six variable names. "Vercel, project promptflip" below means the **live** project, `promptflip-35qv` today. Any `npx vercel env ...` run from `~/projects/promptflip` hits the broken project, so change env vars through the Vercel dashboard on `promptflip-35qv` (or `npx vercel env ... --scope kks-projects-2edcb11a` after relinking) until H5 picks the canonical project. Details: `incidents.md`, entry 2026-09-18. Every app repo also carries a `.env.example` listing its names with empty values, which must agree with this table.

## Application variables

| Variable | Which app | Where it lives | Who can rotate it | What breaks without it |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | promptflip | Vercel, project `promptflip`, Settings, Environment Variables (all environments). Value comes from Supabase Project A, Settings, API. Public (shipped to the browser) | anyone with Vercel team access; the value only changes if the Supabase project is recreated | the app cannot reach Supabase at all: sign-in fails, `/api/health` reports `db` not ok |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | promptflip | Vercel, project `promptflip`. Value from Supabase Project A, Settings, API, `anon` key. Public; safe to expose because RLS scopes it | Supabase dashboard (Project A, Settings, API, regenerate) then re-set in Vercel and redeploy | same as above: no browser-side Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | promptflip (server routes and the daily cron only) | Vercel, project `promptflip`, server-side only (never `NEXT_PUBLIC_`). Value from Supabase Project A, Settings, API, `service_role` key. **Bypasses RLS: treat as root** | Supabase dashboard (Project A) then Vercel, redeploy | server-side admin operations and the cron fail; user-facing pages may still load |
| `KEY_ENCRYPTION_SECRET` | promptflip | Vercel, project `promptflip`, server-side only. Generated locally (random bytes); not held by any provider | anyone with Vercel access, **but rotating it makes every stored user API key undecryptable**; requires a re-encryption migration, so it is a human checkpoint | users' encrypted OpenRouter keys cannot be decrypted; every model call fails |
| `CRON_SECRET` | promptflip | Vercel, project `promptflip`, server-side only. Vercel sends it as a bearer token to the cron route defined in `vercel.json`; generated locally | anyone with Vercel access; set the new value and redeploy, no data impact | the once-per-day cron route rejects Vercel's call with 401, so the daily job silently stops |
| `NEXT_PUBLIC_APP_URL` | promptflip | Vercel, project `promptflip`. Currently the `*.vercel.app` URL; **must be changed to `https://promptflip.<domain>` after H1** together with the Supabase Auth redirect URLs (runbook "Re-point OAuth redirects") | anyone with Vercel access | OAuth redirects and absolute links point at the wrong host; Google sign-in returns to the old URL or fails with `redirect_uri_mismatch` |
| (none) | hub (`portfolio`) | no variables in Phase 0; the hub reads `projects.json` from the repo | n/a | n/a. T0.5 will add the PostHog public key here |

## Operator credentials (local machine only, never in any repo)

These are the one-time keys Kalp supplies at human checkpoint H0. They live in the local MCP configuration or shell environment on Kalp's Mac and are used by agents to drive the provider APIs. They are never committed, never printed, and never placed in Vercel.

| Variable | Used for | Where it lives | Who can rotate it | What breaks without it | Status |
|---|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | creating DNS records and R2 buckets via the Cloudflare API (T0.4 execution after H1) | local MCP config / shell env on Kalp's Mac. Created at Cloudflare, My Profile, API Tokens, "Edit zone DNS" template | Kalp (Cloudflare dashboard) | agents cannot add or fix DNS records; the site keeps serving on existing records | PENDING (H0) |
| `UPTIMEROBOT_API_KEY` | creating monitors and reading status via the UptimeRobot API (T0.3) | local MCP config / shell env. From UptimeRobot, Integrations and API, Main API key | Kalp (UptimeRobot dashboard) | agents cannot add monitors or read uptime; existing monitors keep running | PENDING (H0) |
| `POSTHOG_PERSONAL_API_KEY` | PostHog MCP server: creating the project, insights, dashboards, reading usage (T0.5) | local MCP config. From PostHog, Settings, Personal API keys | Kalp (PostHog dashboard) | agents cannot manage PostHog; the browser snippet (which uses the separate public project key) keeps sending events | PENDING (H0) |
| `NEON_API_KEY` | creating Plato's database via `neonctl` or the Neon API (T1.3) | local MCP config / shell env. From Neon, Account settings, API keys | Kalp (Neon console) | agents cannot create or inspect Neon projects; a running Plato is unaffected because it uses its own `DATABASE_URL` | PENDING (H0) |
| Vercel CLI login | every Vercel operation (`npx vercel ...`) | `~/Library/Application Support/com.vercel.cli/auth.json` on Kalp's Mac (already logged in, team `kks-projects-2edcb11a`) | Kalp (`npx vercel login`) | no deploys, env changes, or domain changes from the CLI; Git-integration deploys still happen | works now |
| Vercel MCP auth | Vercel MCP plugin tools | authorised once via the link in `STATUS.md` H0 | Kalp (re-authorise) | fall back to the CLI | PENDING (H0) |
| Supabase MCP auth | Supabase MCP tools (schemas, migrations, API settings, Edge Functions, renaming Project B) | authorised once via the link in `STATUS.md` H0 | Kalp (re-authorise) | fall back to the Supabase dashboard through the browser tools | PENDING (H0) |
| `gh` CLI login | repos, archiving, secrets, Actions | `gh auth status` on Kalp's Mac, logged in as `KalpKan` | Kalp (`gh auth login`) | no repo operations from the CLI | works now |

## Variables expected in later phases (names reserved, rows filled when the task lands)

| Variable | Which app | Task |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | hub, then every app | T0.5 |
| `NEXT_PUBLIC_APP_SCHEMA` (plus the Supabase URL and anon key for Project B) | every Project B app, starting with basketball (`hoops`) and the new-project template | T1.1, T1.2 |
| `SECRET_KEY`, `DATABASE_URL` (Neon) | Plato | T1.3 |
| Firebase web config, Pl@ntNet API key, OpenAI API key (with a spend cap) | PlantWater | T2.1 |

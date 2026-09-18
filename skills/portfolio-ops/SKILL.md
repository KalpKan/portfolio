---
name: portfolio-ops
description: Use when operating, repairing, or extending Kalp's project-hosting platform (the hub at KalpKan/portfolio plus every project subdomain on Vercel, Supabase, Neon, Cloudflare, UptimeRobot, PostHog). Triggers include "portfolio is down", "add a project to the portfolio", "Supabase paused", "deploy failed", "subdomain not resolving", "analytics missing", "health check failing", "where does this env var live", "rotate a secret", "attach a domain", or any task in the Phase 0-4 plan that must update the ops record afterwards.
---

# portfolio-ops

## Overview

This is the repair manual and institutional memory for Kalp's portfolio platform: one hub site (Next.js on Vercel Hobby) that links to every project he has built, each project living on its own subdomain, all on free tiers, with the `.com` domain as the only paid line item.

Core principle: **this skill is written during the build, not after.** Every task that changes the platform appends to one of the five files below before it counts as done. If you are an agent who has never seen this project, read this file top to bottom, then open the file that matches your problem. The system design that all of this executes is `docs/hosting-plan.md` in the hub repo; do not re-litigate it, execute it, and if reality contradicts it, update the doc with evidence.

## When to use

- Something is broken: a site is down, a badge is grey, a deploy failed, a subdomain does not resolve, Supabase says "paused", analytics stopped arriving.
- Something is being added: a new project, a new subdomain, a new Supabase schema, a new secret.
- A task in `docs/superpowers/plans/` just finished and its runbook, settings, or incident must be recorded.
- A reviewer or verifier needs the exact command that proves a part is healthy.

Do not use this skill for the per-project product code itself (promptflip's features, Plato's parser); those live in each project's own repo and docs. This skill covers hosting, wiring, secrets, DNS, monitoring, and analytics.

## System map

One row per host. "PENDING" means the plan calls for it but it is not live yet; update the row when it goes live. The domain itself is not bought yet (human checkpoint H1), so every host currently serves from a `*.vercel.app` URL.

| Subdomain (planned) | Current URL | Host | Repo | Database | Where env vars live | Status |
|---|---|---|---|---|---|---|
| `@` apex + `www` (hub) | https://portfolio-alpha-eight-rjbs2nj1q0.vercel.app (live; `portfolio-kks-projects-2edcb11a.vercel.app` is the team-scoped alias behind Vercel deployment protection, so use the public one) | Vercel Hobby, team "Kk's projects" (`kks-projects-2edcb11a`), project `portfolio` | `KalpKan/portfolio` (public), local `~/projects/portfolio` | none | Vercel project settings, Environment Variables (currently none; T0.5 adds the two public PostHog names listed in `settings-map.md`) | live on `*.vercel.app` since 2026-09-18 (T0.1); custom domain PENDING (H1) |
| `promptflip.` | `https://promptflip-35qv.vercel.app` | Vercel Hobby. Two projects exist for the same repo: `promptflip` (`prj_rSr9QbGDbB2FLOeAAilYmqO5DKL1; live project `promptflip-35qv` = prj_t2eXoIxI2HN3snfyFpGAkTqHa4VD`, the one `~/projects/promptflip/.vercel/project.json` links to) and `promptflip-35qv` (the one serving the live URL today). The hosting plan assumed `promptflip-35qv` was a duplicate to delete; T0.2's inspection found it is the live one, so **delete neither** until `STATUS.md` records which is canonical (H5) | `KalpKan/promptflip` (private), local `~/projects/promptflip` | Supabase **Project A** (isolated; never share) | Vercel, project `promptflip-35qv` (the live one; see H5), Environment Variables. Six names are listed in `settings-map.md` | live |
| `hoops.` | existing `v0-basketball-analytics-dashboard` Vercel URL | Vercel Hobby, project `v0-basketball-analytics-dashboard` | `KalpKan/Basketball-Stat-Tracker` (public) | Supabase **Project B** `yzppfufqaekgaxcrsqxp` (to be renamed `platform`, schema `hoops`) in T1.1 | Vercel project Environment Variables (currently unset, so the dashboard silently shows mock data) | PENDING (Phase 1) |
| `plato.` | PENDING | Vercel Hobby, Python (Flask) function | `KalpKan/Plato` (public) | Neon Free (`DATABASE_URL`) | Vercel project Environment Variables | PENDING (Phase 1) |
| `plantit.` | PENDING | Vercel Hobby, React static + Express `/api` function | PlantWater repo (public) | Firebase Spark (Firestore, RTDB, Auth); photos to Supabase Storage in Project B or Cloudflare R2 | Vercel project Environment Variables | PENDING (Phase 2) |
| `pushups.` | PENDING | Vercel Hobby, static (MediaPipe JS in browser) | new repo (Phase 3) | none | none | PENDING (Phase 3) |
| `emotes.` | PENDING | Vercel Hobby, static (MediaPipe JS in browser) | new repo (Phase 3) | none | none | PENDING (Phase 3) |
| `microtubules.` | PENDING | Vercel Hobby, static (OpenCV.js) | `KalpKan/Microtubule-Quantification` (public) | none | none | PENDING (Phase 1) |
| `status.` | PENDING | UptimeRobot public status page | n/a | n/a | UptimeRobot dashboard | PENDING (T0.3, blocked on H0 key) |
| DNS zone | PENDING | Cloudflare Registrar + DNS, records DNS-only (grey cloud) | `docs/DNS_PENDING.md` lists every record | n/a | Cloudflare dashboard; API token is `CLOUDFLARE_API_TOKEN` in the local MCP config, never in a repo | PENDING (H1) |
| Analytics | PENDING | PostHog Cloud free tier, one project "Kalp portfolio", `$0` billing limit on every product | snippet in every app, proxied via `/ingest/*` | n/a | PostHog dashboard; `POSTHOG_PERSONAL_API_KEY` in local MCP config | PENDING (T0.5, blocked on H0 key) |
| Showcase pages (`/projects/<slug>` on the hub) | PENDING | hub, rendered from `projects.json` entries with `type: "showcase"` | `KalpKan/portfolio` | none | none | PENDING (Phase 4) |

Fuller reasoning behind every row is in `architecture.md`.

## First 5 checks (triage, in this order)

Run these before changing anything. Each takes under a minute and tells you which layer is broken. Exact commands are in `verification.md`.

1. **UptimeRobot status page.** Open `status.<domain>` (PENDING until T0.3; until then open the UptimeRobot dashboard). If every monitor is red at once, suspect DNS or Vercel; if one is red, go to that app.
2. **The failing app's `/api/health`.** `curl -sf https://<app-url>/api/health`. promptflip returns `db: ok` when its Supabase project is up; the hub returns `{"ok": true, "service": "hub"}`. A 200 here with `db` not ok means the database, not the app. A connection failure means DNS or Vercel.
3. **Vercel deployment logs.** `npx vercel ls <project> --scope kks-projects-2edcb11a` then `npx vercel inspect <deployment-url> --logs`. A failed build shows here; a "Ready" deployment with a failing health route points at env vars or the DB.
4. **Supabase project status.** Open the Supabase dashboard (or the Supabase MCP `list_projects`). Free projects pause after 7 days without activity; a paused project is a one-click restore and then `incidents.md` gets an entry because the keep-alive ping should have prevented it.
5. **Cloudflare DNS record.** `dig +short <sub>.<domain>` should return a `vercel-dns` CNAME target (subdomain) or `76.76.21.21` (apex). Records must be DNS-only (grey cloud); an orange-cloud record breaks TLS between Cloudflare and Vercel. PENDING until H1: no domain exists yet, so until then this check is simply `curl -sI https://<app>.vercel.app | head -1` (expect `HTTP/2 200`) and a `DEPLOYMENT_NOT_FOUND` body means the Vercel project or deployment is gone, not DNS.

If all five are green and the symptom persists, it is application code, not hosting; go to that project's repo.

## Files in this skill

| File | Read it when |
|---|---|
| `architecture.md` | You need to know why something is the way it is before changing it (layers, the two-Supabase-project rule, DNS map, analytics wiring, keep-alive). |
| `runbooks.md` | You need to do a procedure: deploy, add a project, add a schema, rotate a secret, attach a domain, restore a paused project, re-point OAuth, regenerate types, purge git history. |
| `incidents.md` | Something went wrong (append an entry) or you want to know whether this has happened before (read). Append-only. |
| `verification.md` | You need the exact command that proves a part is healthy. |
| `settings-map.md` | You need to know which env var lives in which dashboard and what breaks without it. Names only, never values. |

## Update rule

A task is not done until the worker has added the relevant runbook, settings row, or incident entry here, and the reviewer has checked it. Then install the updated copy so `~/.claude/skills/portfolio-ops/` matches the repo: `bash ~/projects/portfolio/scripts/install-ops-skill.sh` (the script lives in the hub repo, mirrors `skills/portfolio-ops/` with `rsync --delete`, and can be run from any directory). The repo copy is the source of truth; never edit the installed copy directly. Every verifier FAIL, reviewer-found bug, and production hiccup becomes an `incidents.md` entry. Names of env vars only, never values.

## Hard constraints to carry into every fix

- Spend stays at $0 plus the domain. Never upgrade Vercel, Supabase, Firebase, Hugging Face, PostHog, or anything else to a paid tier; never attach a card. If a fix seems to need money, stop and raise a human checkpoint in `STATUS.md`.
- Exactly two Supabase projects, ever. Project A is promptflip and is isolated; Project B (`platform`) holds one schema per other app. A DB-only app goes to Neon.
- Never commit a secret. Real values live only in the host's env settings.
- Never delete or force-push anything Kalp made without a human checkpoint, except the items the plan explicitly marks for removal.

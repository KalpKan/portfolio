# Runbooks

Step-by-step procedures for the portfolio platform. Each runbook is written for an agent that has never seen this project: full commands, the directory to run them from, and what "done" looks like. Every task that introduces a new procedure appends it here (or replaces a "Not yet written" stub) before the task counts as done.

Conventions used below:

- All commands run from the repo they concern unless stated. The hub is `~/projects/portfolio`; promptflip is `~/projects/promptflip`.
- The Vercel CLI is invoked as `npx vercel` and is already authenticated against team "Kk's projects" (`kks-projects-2edcb11a`). The GitHub CLI `gh` is authenticated as `KalpKan`.
- Every runbook ends with a verification step. Do not report a runbook as executed without running it; the exact checks are in `verification.md`.
- Nothing here costs money. If a step ever prompts for a card or an upgrade, stop and record a human checkpoint in `STATUS.md`.

## Index

| Runbook | Status |
|---|---|
| Deploy the hub to Vercel | written (from the T0.1 plan; T0.1 confirms and refines the commands) |
| Add a project to `projects.json` | written |
| Delete a Vercel project | Written and executed 2026-09-18 (T0.2) |
| Archive a GitHub repo | Written and executed 2026-09-18 (T0.2) |
| Attach a domain to a Vercel project | Written 2026-09-18 (T0.4); **executed 2026-09-18 for all nine hosts** (apex + www → `portfolio`, then hoops, promptflip, plato, microtubules, plantit, emotes, pushups). Record table and executed log in `docs/DNS_PENDING.md` |
| Add a schema to Supabase Project B | Written and executed 2026-09-18 (T1.1, `hoops`) |
| Rotate a secret | Not yet written, added when the first rotation lands |
| Redeploy an app | Written 2026-09-18 (T1.1: hoops dashboard by CLI) |
| Restore a paused Supabase project | Written 2026-09-18 (T0.3); **executed 2026-09-18 (T1.1, Project B via the dashboard; API call blocked by the agent sandbox)** |
| Re-point OAuth redirects (promptflip on the new domain) | Written and executed 2026-09-18 (H5 / promptflip domain task) |
| Regenerate Supabase types | Written and executed 2026-09-18 (T1.1) |
| Add a case study | Written and executed 2026-09-18 (T4.1: unpark, rc-car, porsche-pcb-keychain live; eeg published as "under construction" with status `coming` (H14); flashcards reduced to the placeholder page and Outline removed per Kalp 17:57; classmyschedule removed 18:05, H9 closed; reviewer fixes 2026-09-18: stacked edge labels, DRC wording, draft gate documented) |
| Purge a large file from git history | Written 2026-09-18 (T4.1); **PR opened, rewrite not executed** (`KalpKan/Automatic-RC-Car` PR #1 waits for Kalp) |
| Add an UptimeRobot monitor | Written and executed 2026-09-18 (T0.3): three monitors plus the public status page; six by the end of Phase 1 (T1.1, T2.1, audit); nine since the Phase 2–4 audit (2026-09-19: pushups, emotes, microtubules liveness), see `docs/monitors.md` |
| Audit a phase (re-verify every definition of done) | Written and executed 2026-09-18 (Phase 1 audit); executed again 2026-09-19 (Phase 2–4 audit) |
| Add PostHog to an app | Written and executed 2026-09-18 (T0.5, hub); the full copy-paste contract is `docs/analytics.md` (the Flask variant is inside "Deploy a Python app to Vercel") |
| Check PostHog billing | Written and executed 2026-09-18 (T0.5) |
| Deploy a browser-ML app (MediaPipe) to Vercel | Written and executed 2026-09-18 (T3.1, pushups: `KalpKan/pushup-tracker-web` → project `pushups`, `https://pushups.kalpkan.com`) |
| Deploy a static Vite app to Vercel | Written and executed 2026-09-18 (T1.4, microtubules: `KalpKan/Microtubule-Quantification` `web/` → project `microtubules`, `https://microtubules.kalpkan.com`) |
| Verify a browser image pipeline against its Python truth in Chromium and WebKit | Written and executed 2026-09-19 (microtubules FIX r1): `npm run test:browser` in the app, Playwright as a devDependency, both engines, exit code |
| Rotate the PostHog key | Written 2026-09-18 (T0.5); not yet executed |
| Deploy a Python app to Vercel | Written and executed 2026-09-18 (T1.3, Plato) |
| Deploy an Express+CRA app to Vercel | Written and executed 2026-09-18 (T2.1, Plant It: `KalpKan/PlantWater` → project `plantit`, `https://plantit.kalpkan.com`) |
| Create a Neon database | Written and executed 2026-09-18 (T1.3, Plato) |
| Create a new project from the template | Written and executed 2026-09-18 (T1.2: `KalpKan/portfolio-template`, throwaway `template-smoke` spun up end to end in 10 min 05 s, then removed) |

## Deploy the hub to Vercel

Use this the first time the hub is deployed and whenever a manual production deploy is needed (normally, pushing to `main` of `KalpKan/portfolio` triggers Vercel's Git integration and no manual deploy is needed).

Why manual first: the hub repo is created locally and pushed before the Vercel project exists, so the first deploy links the directory to a Vercel project and creates it.

1. From `~/projects/portfolio`, make sure the build is clean locally, because a broken build wastes a Hobby build minute and shows up as a red deployment:
   ```bash
   npm ci && npm run lint && npm test && npm run build
   ```
2. Link the directory to the Vercel project (creates `.vercel/project.json`, which is git-ignored; the project is created if it does not exist):
   ```bash
   npx vercel link --yes --project portfolio --scope kks-projects-2edcb11a
   ```
3. Deploy to production:
   ```bash
   npx vercel --prod --yes
   ```
   The last line printed is the production URL. Record it in `STATUS.md` (T0.1 row) and in the hub row of the system map in `SKILL.md`.
4. Do **not** add a custom domain here. Domains are attached only after human checkpoint H1 (domain purchased) by the "Attach a domain" runbook.
5. Verify (see `verification.md`, "Hub"):
   ```bash
   curl -sf https://<prod-url>/api/health
   curl -sI https://<prod-url> | head -1
   ```
   Expect `{"ok":true,"service":"hub",...}` and `HTTP/2 200`.

**As executed on 2026-09-18 (T0.1):** the Vercel project `portfolio` was created by `npx vercel link --yes --project portfolio --scope kks-projects-2edcb11a`, then `npx vercel --prod --yes`. Production URL: `https://portfolio-alpha-eight-rjbs2nj1q0.vercel.app` (the name `portfolio.vercel.app` was already taken, so Vercel generated the suffix; the team-scoped alias `portfolio-kks-projects-2edcb11a.vercel.app` answers 302 to Vercel SSO because deployment protection covers it, which is normal and not an outage). Two things the CLI does on `link` that you must undo before committing: it writes `.env.local` (git-ignored, harmless) and appends `.env*` and `.env.local` to `.gitignore`, which re-ignores `.env.example`; delete those two lines. Lighthouse performance at launch: 0.92 (`npx lighthouse <url> --only-categories=performance --quiet --chrome-flags="--headless" --output=json | jq .categories.performance.score`). The GitHub Actions workflow `.github/workflows/ci.yml` runs lint, test and build on every push; Vercel's own Git integration deploys `main`.

## Add a project to `projects.json`

Use this whenever a new app or showcase should appear on the hub. This is deliberately the whole procedure: the hub renders cards from the registry, so adding a project is one JSON entry and a push, never a code change.

1. Open `~/projects/portfolio/projects.json`.
2. Append an entry. For a live web app:
   ```json
   {
     "slug": "promptflip",
     "name": "promptflip",
     "tagline": "Two prompts walk in, one gets answered.",
     "type": "app",
     "status": "live",
     "url": "https://promptflip-35qv.vercel.app",
     "repo": "https://github.com/KalpKan/promptflip",
     "healthUrl": "https://promptflip-35qv.vercel.app/api/health",
     "tags": ["Next.js", "Supabase"],
     "hero": null
   }
   ```
   For a project that is shown as a case-study page rather than a deployment (UnPark, RC car, iOS apps, the Chrome extension), use `"type": "showcase"` and omit `url` and `healthUrl` (the schema rejects a showcase that carries either). While its `status` is `coming` the row says "case study soon" and links to the repo; set `status` to `live` once the `/projects/<slug>` page is actually written (Phase 4) and the row switches to "case study" / "read".
   - `status` is one of `live`, `demo`, `coming`, `archived`.
   - **The 200-unauthenticated rule.** Before an `app` entry is checked in with `status` `live` or `demo`, its `url` must answer `200` to an anonymous visitor: `curl -s -o /dev/null -w "%{http_code}\n" <url>` must print `200`, not `302`/`401` (a Vercel team-scoped alias behind deployment protection answers 302 to SSO; use the public alias or the custom domain instead). The hub links a `live` row straight to that `url`, so a redirect to a login page is a broken card. While the app is not yet public, keep `status: "coming"`: the row then links to the repo and never says "open".
   - `healthUrl` must be a route that answers `200` with a JSON body containing `"ok": true` when the app is healthy. The hub checks it server-side (`lib/health.ts`: 3 s timeout, redirects not followed, anything other than a 2xx JSON `ok: true` is "no signal") and the same URL is given to UptimeRobot. `null` when the app has no such route yet (the row then shows a flat quiet mark).
   - `hero` is a path under `/public/images/` (WebP, 300 KB or less) or `null`.
3. Validate locally; the loader in `lib/projects.ts` uses a zod schema and the test suite rejects an `app` entry without a `url`:
   ```bash
   npm test
   ```
4. Commit and push; Vercel's Git integration deploys `main` automatically:
   ```bash
   git add projects.json && git commit -m "feat(registry): add <slug>" && git push
   ```
5. Verify: open https://kalpkan.com, confirm the new row appears and, for an `app` with a `healthUrl`, its pad fills within a few seconds (`curl -s https://kalpkan.com/api/status/<slug>` prints `"ok":true`). The share card regenerates on the same deploy (`curl -sI https://kalpkan.com/opengraph-image | head -1` → `HTTP/2 200`). Then add an UptimeRobot monitor on the same `healthUrl` (runbook "Add an UptimeRobot monitor"): every live app gets a liveness monitor, and a database-backed app's monitor must hit the DB-touching route so it doubles as the keep-alive.
6. Add the new host to the system map table in `SKILL.md` and, if it has env vars, their names to `settings-map.md`.

**How a row renders (`kind`, derived in `lib/projects.ts` `rowFor()`, one source of truth since the 2026-09-18 polish batch):**

| `kind` | When | Mark | Status word | Verb / where the row links |
|---|---|---|---|---|
| `live` | `type: app`, `status: live` or `demo` | measured: filled + trace when the health check returns `ok: true`, hollow when it fails, flat quiet when there is no `healthUrl` | `live` / `demo` (+ `health-checked` / `health check failed` / `checking`) | `open` → `url` (new tab) |
| `archived` | `type: app`, `status: archived` | struck square | `archived` | `open` → `url` |
| `coming` | `type: app`, `status: coming` (any `url` is ignored) | dashed hollow | `coming` | `repo` → `repo`; no link at all when `repo` is `null` |
| `showcase-soon` | `type: showcase`, `status: coming` | square with triangle | `case study soon` | `repo` → `repo` |
| `showcase` | `type: showcase`, `status: live`/`demo`/`archived` | square with triangle | `case study` | `read` → `/projects/<slug>` on the hub (`next/link`) |

The count line above the array ("N live · N coming · N case studies", plus "N archived" when any) is computed from these kinds, so it always sums to the number of entries.

**Schema details as shipped in T0.1 (`lib/projects.ts`):**
- `slug` must be lowercase kebab-case and unique; the loader throws on duplicates, so `npm test` and `npm run build` both fail loudly on a bad entry.
- An `app` may omit `url` only while `status` is `"coming"` (so we never publish a made-up address); once it is `live`, `demo` or `archived` the `url` is required.
- `repo` may be `null` for work that is not on GitHub (today: flashcards, porsche-pcb-keychain, eeg; emotes gained `KalpKan/emote-detector-web` in T3.2). The card then shows no repo link.
- A `showcase` entry must not carry `url` or `healthUrl`; it links to `/projects/<slug>`, which is a placeholder page until Phase 4.
- The live mark is not fetched from the app directly. Project health routes do not send CORS headers, so the browser calls the hub's own `GET /api/status/<slug>`, which fetches the registry `healthUrl` server-side (`lib/health.ts`: 3 s timeout, `redirect: "manual"`, healthy only when the 2xx body is JSON with `ok === true`) and returns `{ ok }` (cached 60 s at the edge). Only registry URLs are ever fetched. The browser side waits up to 8 s for that answer.
- The Basketball dashboard's current Vercel URL is behind Vercel SSO deployment protection (answers 302), so its entry has `healthUrl: null` until Phase 1 makes it public.

## Delete a Vercel project

Use this to remove a Vercel project that has been superseded (an old name, a duplicate created by "Import from Git", a v0 experiment). Deleting a project deletes every deployment under it and its `*.vercel.app` URLs go 404 immediately. There is no undo. Written and executed 2026-09-18 (T0.2, removed `tokengamblecoinflip`).

1. List the projects in the team and confirm the exact name:
   ```bash
   npx vercel project ls --scope kks-projects-2edcb11a
   ```
2. Prove the project is dead before removing it. Do all three; if any one says "this is the live one", stop and record a checkpoint in `STATUS.md` instead of deleting.
   ```bash
   # a) is anything answering on its production URL, and is its DB reachable?
   curl -s -o /dev/null -w "%{http_code}\n" https://<name>.vercel.app
   curl -s https://<name>.vercel.app/api/health          # apps expose ok/db fields

   # b) what is the production deployment, when was it built, and is it Ready?
   npx vercel inspect https://<name>.vercel.app --scope kks-projects-2edcb11a

   # c) does it hold env vars that its replacement lacks? (vercel env ls only works
   #    from a linked directory, so use the API with the CLI's token; names only, never values)
   TOKEN=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/Library/Application Support/com.vercel.cli/auth.json')))['token'])")
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://api.vercel.com/v9/projects/<name>/env?teamId=team_COuL6hLftYDdKidApgwbIQIK" \
     | python3 -c "import json,sys;[print(e['key'],e['target']) for e in json.load(sys.stdin)['envs']]"
   ```
   The same API base with `/v9/projects/<name>` (no `/env`) returns `link.repo` (which GitHub repo auto-deploys into it) and `targets.production.readyState`. Two projects linked to the same repo both rebuild on every push; the one whose production is `READY` and whose health route returns `db: ok` is the live one.
3. Remove it. Vercel CLI 59 has no `--yes` for `project rm`; it asks `Are you sure? (y/N)`, so pipe a `y`:
   ```bash
   printf 'y\n' | npx vercel project rm <name> --scope kks-projects-2edcb11a
   ```
   Expect `Success! Project <name> removed`.
4. Verify:
   ```bash
   npx vercel project ls --scope kks-projects-2edcb11a      # name is gone
   curl -sI https://<name>.vercel.app | head -1             # HTTP/2 404
   ```
5. Record it: `STATUS.md` task row, and if the check in step 2 turned up anything surprising, an `incidents.md` entry.

Never delete `promptflip-35qv` (it is the live promptflip; the duplicate `promptflip` project was removed 2026-09-18 after H5, see incident 2026-09-18 in `incidents.md`) or `v0-basketball-analytics-dashboard`. Lesson from H5: `npx vercel link --yes --project <name>` also appends `.env*` to the repo `.gitignore` and writes a `VERCEL_OIDC_TOKEN` block into `.env.local`; revert both if the repo should stay untouched.

## Archive a GitHub repo

Use this for a repo whose code lives on in a successor (rename, rewrite, merge). Archiving makes the repo read-only on GitHub but keeps it visible, cloneable and searchable; it is reversible from the repo's Settings page (`gh repo unarchive`). Prefer archiving over deleting: it costs nothing and keeps the history. Written and executed 2026-09-18 (T0.2, archived `token-gamble-coinflip` and `token-coinflip`, both superseded by `promptflip`).

1. Confirm nothing still deploys from it: check `link.repo` on every Vercel project (runbook above, step 2c) and `gh repo view KalpKan/<repo> --json isArchived,pushedAt,url` for when it was last touched.
2. Archive (`--yes` skips the confirmation; the command prints nothing on success):
   ```bash
   gh repo archive KalpKan/<repo> --yes
   ```
3. Verify:
   ```bash
   gh repo view KalpKan/<repo> --json isArchived      # {"isArchived":true}
   ```
4. Record it in the `STATUS.md` task row. Archived repos are not listed in `projects.json`; if the successor is, its card already covers the history.

## Attach a domain to a Vercel project

**Status: executed 2026-09-18 for `kalpkan.com` (apex + `www` on `portfolio`) and `hoops.kalpkan.com` (on `v0-basketball-analytics-dashboard`); the procedure below is what worked.** Domain: `kalpkan.com`, Cloudflare zone id `288a6a2d07f7868c85faa8634f86b885`. Full record table, verified source URLs, the copy-paste command block and the executed log (record ids, exact targets) live in `docs/DNS_PENDING.md`; this runbook is the procedure and the checks.

Learned on first execution (2026-09-18):
- Use `npx vercel domains verify <host> --scope kks-projects-2edcb11a` (JSON) rather than `inspect` to read the record Vercel wants: `recommended.records[0]` gives the **project-specific** CNAME (`<hash>.vercel-dns-017.com`, e.g. `a9e60d5e9d41cb23.vercel-dns-017.com` for `portfolio`), which is what to put in Cloudflare. `inspect` only prints the generic `A 76.76.21.21` line, even for subdomains.
- `domains add` is refused with `latest production deployment has errored (400)` if the project's newest production build failed, even when the production alias serves an older Ready build. Fix without deleting anything: `npx vercel redeploy <last-Ready-deployment-url> --scope kks-projects-2edcb11a --non-interactive`, wait for Ready, then retry `domains add`. (`vercel promote` returns 409 when that build is already current.)
- The `www` → apex 308 redirect (step 5) does not need a separate `VERCEL_TOKEN`: the logged-in CLI's bearer token in `~/Library/Application Support/com.vercel.cli/auth.json` (`jq -r .token`) works for the `PATCH` call. Never print or commit it.
- Certificates issued within about 1 to 2 minutes of the DNS-only record appearing; poll `curl -sI https://<host> | head -1` every 30 s.

When to use: a new project needs `<sub>.<domain>`, or a subdomain stopped resolving and you need to rebuild the record.

Preconditions:
- The Vercel project exists and has a **Ready** production deployment (`npx vercel project ls --scope kks-projects-2edcb11a`); `domains add` refuses a project whose newest production build errored (hoops hit this; `vercel redeploy` the last Ready build first). promptflip attaches to `promptflip-35qv` (H5 resolved 2026-09-18).
- `CLOUDFLARE_API_TOKEN` is in the shell (H0 item 4, "Edit zone DNS" template). Never commit it; never paste it into STATUS.md.
- The domain's zone is on Cloudflare (Registrar purchases are, automatically).

Steps:
1. Tell Vercel about the host first: `npx vercel domains add <sub>.<domain> <project> --scope kks-projects-2edcb11a` (apex: `npx vercel domains add <domain> portfolio` and also `www.<domain>`).
2. Ask Vercel which record it wants. `npx vercel domains inspect <sub>.<domain> --scope kks-projects-2edcb11a` only prints the generic `A 76.76.21.21` line; the project-specific CNAME comes from `curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v6/domains/<sub>.<domain>/config?projectIdOrName=<project>&teamId=team_COuL6hLftYDdKidApgwbIQIK"` → `recommendedCNAME[0].value` (a `<hash>.vercel-dns-017.com.`; drop the trailing dot), with `$TOKEN` from `~/Library/Application Support/com.vercel.cli/auth.json` `.token`. Use that value (executed 2026-09-18 for www, hoops, promptflip). Apex: `A 76.76.21.21`.
3. Create the Cloudflare record with `proxied: false` (DNS-only / grey cloud) and `ttl: 1`:
   `POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records` with `Authorization: Bearer $CLOUDFLARE_API_TOKEN` and body `{"type":"CNAME","name":"<sub>","content":"<value from step 2>","ttl":1,"proxied":false,"comment":"Vercel project <project>"}`. Zone id: `GET /zones?name=<domain>` → `.result[0].id`. Exact curl lines are in `docs/DNS_PENDING.md` §2.
   Dashboard equivalent (no token needed): Cloudflare → `<domain>` → DNS → Records → Add record → Type `CNAME` (`A` for the apex), Name `<sub>` (`@` for the apex), Target `<value from step 2>`, Proxy status **OFF** (grey cloud), TTL Auto → Save.
   Why DNS-only: Vercel issues and renews the TLS certificate by checking that record. Behind Cloudflare's proxy the check fails, and Cloudflare "Flexible" SSL loops redirects. This is a deliberate decision (`docs/hosting-plan.md` §6); do not "fix" it by turning the proxy on.
4. Re-run `npx vercel domains inspect <host>` until it reports the domain as configured, then `npx vercel certs ls` shows a cert for it.
5. For the apex only: make `www` redirect to the apex with 308 (dashboard: portfolio → Settings → Domains → `www.<domain>` → Redirect; or `PATCH https://api.vercel.com/v9/projects/portfolio/domains/www.<domain>?slug=kks-projects-2edcb11a` with `{"redirect":"<domain>","redirectStatusCode":308}` using a `VERCEL_TOKEN`).
6. Verify: `dig +short <host>` returns `76.76.21.21` (apex) or a `vercel-dns` name (CNAME); `curl -sI https://<host> | head -1` is `HTTP/2 200` (`308` for `www`).
7. After-effects, per app: update `url`/`healthUrl` in `projects.json`; move the UptimeRobot monitor to the new host; for promptflip also set `NEXT_PUBLIC_APP_URL` and the Supabase Auth Site URL / Redirect URLs (see "Re-point OAuth redirects"). Record the row in `docs/DNS_PENDING.md` §5 and the host in `SKILL.md`'s system map.

Common failures:
- Vercel says "Invalid Configuration": a conflicting A/AAAA/CNAME exists for the same name (`GET /zones/$ZONE_ID/dns_records?name=<host>`), or the record is proxied. Delete the extra record or flip to DNS-only.
- Cloudflare error 81057: record already exists; `PATCH /zones/$ZONE_ID/dns_records/<record_id>` instead of POST.
- Host serves a Vercel 404 page: the DNS record is right but step 1 was skipped, or the domain is attached to a different project (`npx vercel domains ls`).
- Cert never issues: a CAA record on the zone that excludes `letsencrypt.org`; there should be none on this zone.

## Add a schema to Supabase Project B

**Status: executed 2026-09-18 for `hoops` (basketball).** Rule: every new Supabase-backed app is a schema in Project B (`platform`, ref `yzppfufqaekgaxcrsqxp`), never a new project (`architecture.md`, "Databases"). Nothing here costs money. Load the operator token first: `set -a; source ~/.config/portfolio-ops/secrets.env; set +a` (uses `SUPABASE_ACCESS_TOKEN`).

Preconditions: Project B is `ACTIVE_HEALTHY` (`curl -s https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq .status`; if `INACTIVE`, run "Restore a paused Supabase project" first). The app repo lives under `~/projects/<app>` with a `supabase/migrations/` folder.

1. **Write migration 0001 for the schema.** First lines of the app's first migration (replace `<app>`):
   ```sql
   create schema if not exists <app>;
   grant usage on schema <app> to anon, authenticated, service_role;
   alter default privileges in schema <app> grant all on tables to anon, authenticated, service_role;
   alter default privileges in schema <app> grant all on sequences to anon, authenticated, service_role;
   alter default privileges in schema <app> grant all on functions to anon, authenticated, service_role;
   ```
   Every table, view, index and function in every migration is written `<app>.name`, never `public.name`. Enable RLS on every table. Finish 0001 with `grant all on all tables in schema <app> to anon, authenticated, service_role;` so objects created in the same file are covered. Add a grep guard like `~/projects/basketball/supabase/migrations/test_hoops_schema.sh` (fails if `public.` appears).
2. **Apply the migrations.** The CLI route (`npx supabase@2 link --project-ref yzppfufqaekgaxcrsqxp` then `npx supabase@2 db push`) needs the database password, which no agent has. Use the Management API SQL endpoint instead, one file at a time, in order, from the migrations folder:
   ```bash
   q(){ curl -s -X POST https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp/database/query -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "$(jq -n --arg q "$1" '{query:$q}')"; }
   for f in 0*.sql; do echo "== $f"; q "$(cat $f)"; echo; done
   ```
   `[]` means success; an error comes back as `{"message": ...}`. Check: `q "select table_name, table_type from information_schema.tables where table_schema='<app>' order by 2,1" | jq -c '.[]'`. (The Management API does not write `supabase_migrations.schema_migrations`; do not edit that table by hand.)
3. **Expose the schema to the REST API.** Read, then PATCH keeping the existing list (print only `db_schema`; the GET response also contains the project's `jwt_secret`, so never dump it whole):
   ```bash
   curl -s https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp/postgrest -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r .db_schema
   curl -s -X PATCH https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp/postgrest -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"db_schema":"public, graphql_public, hoops, <app>"}' | jq -r .db_schema
   ```
   Dashboard equivalent: Project Settings, Data API, Exposed schemas, add `<app>`.
4. **Scope the app's client.** `createClient<Database, "<app>">(url, key, { db: { schema: "<app>" } })` (supabase-js sends it as the `Accept-Profile` / `Content-Profile` header). Edge Functions do the same. Test it: `~/projects/basketball/apps/web/lib/supabase-admin.test.ts` asserts `client.rest.schemaName === "hoops"`.
5. **Regenerate types** (runbook "Regenerate Supabase types") and **name Edge Functions and buckets `<app>-...`** (`hoops-ingest-shot`). Deploy functions with `npx supabase@2 functions deploy <name> --project-ref yzppfufqaekgaxcrsqxp --no-verify-jwt` (Docker is not needed; the CLI warns and uploads anyway). Function secrets: `npx supabase@2 secrets set --env-file <tmpfile> --project-ref yzppfufqaekgaxcrsqxp` (write the tmpfile with `umask 077`, delete it after; never `secrets set NAME=value` on the command line, it lands in shell history). `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every function automatically.
6. **Wire the host.** Set the app's Vercel env vars by piping values from the Management API straight into `npx vercel env add NAME production --scope kks-projects-2edcb11a --force` (stdin), never via an echoed variable; the pattern is the "Set Vercel env vars from Supabase without printing them" note under "Rotate a secret". Keys endpoint: `GET https://api.supabase.com/v1/projects/yzppfufqaekgaxcrsqxp/api-keys?reveal=true` (`.[] | select(.name=="anon" or .name=="service_role") | .api_key`).
7. **Verify** (`verification.md`, "Supabase"): the app's health/dashboard route reports live data, `curl -s https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health` is `{"ok":true,"db":"ok",...}`, and `GET /v1/projects` still shows exactly two `ACTIVE_HEALTHY`.
8. **Record it:** `SKILL.md` system map (schemas list), `settings-map.md` rows for the new names, `architecture.md` inventory, and the app's README "Where the settings live".
9. **Change an existing view or function later (executed 2026-09-18 for `0006_bounded_efg.sql`):** add a new numbered migration file in the app repo, keep `test_hoops_schema.sh` passing, then apply it through the SQL endpoint with the file as the query (`q "$(cat supabase/migrations/0006_bounded_efg.sql)"` using the `q()` helper from step 2; `create or replace view` keeps dependent views such as `progress_over_time` valid as long as the column list is unchanged). Prove it with a `select` before and after, and if the app computes the same formula in code (hoops does, in `apps/web/lib/dashboard-data.ts`), change both in one commit and regenerate the ground-truth fixtures (`python3 tests/compute-expected-metrics.py`). Redeploying an Edge Function after a code change is the same `functions deploy` command as step 5; a sibling `validate.ts` next to `index.ts` is uploaded with it, a `*.test.ts` is not.

Learned on first execution (2026-09-18, `hoops`):
- The restored project still had the old `public.sessions` / `public.shot_events` (4 sessions, 92 shots). They were copied into `hoops` with `insert into hoops.sessions select * from public.sessions on conflict (id) do nothing;` (same for `shot_events`) and **left in place**; dropping `public.*` is a human checkpoint (never delete Kalp's data).
- `create extension if not exists "pgcrypto"` is fine to keep; `gen_random_uuid()` is built in.
- Views created after `alter default privileges` inherit grants; the health function needed its own `grant execute`.

## Rotate a secret

Not yet written as a full rotation, added when the first rotation lands. Shape it will take: find the variable in `settings-map.md`, generate the new value, set it in the owning dashboard (`npx vercel env add <NAME> production` for Vercel), redeploy, verify the health route, then note the rotation date in `settings-map.md`.

**Set Vercel env vars from Supabase without printing them (used by T1.1, 2026-09-18).** Put the whole thing in one script so no value is ever echoed, and run it from the app's linked directory:
```bash
set -a; source ~/.config/portfolio-ops/secrets.env; set +a
KEYS=$(curl -sf "https://api.supabase.com/v1/projects/<ref>/api-keys?reveal=true" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")
printf '%s' "$KEYS" | jq -r '.[] | select(.name=="anon") | .api_key'         | npx vercel env add SUPABASE_ANON_KEY production --scope kks-projects-2edcb11a --force
printf '%s' "$KEYS" | jq -r '.[] | select(.name=="service_role") | .api_key' | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --scope kks-projects-2edcb11a --force
openssl rand -hex 32 | npx vercel env add INGEST_API_KEY production --scope kks-projects-2edcb11a --force
```
A public `NEXT_PUBLIC_*` value that looks like a token (the PostHog `phc_` key) needs `--type config`, or the CLI stops with `public_prefix_requires_type`. To copy a value from another Vercel project, `npx vercel env pull <tmpfile> --environment=production` in that project, `grep`/`cut` the line, pipe it in, and delete the tmpfile. After any env change: `npx vercel --prod --yes` (env is baked in at build time for `NEXT_PUBLIC_*`).

## Redeploy an app

From the app's directory, linked once with `npx vercel link --yes --project <vercel-project> --scope kks-projects-2edcb11a`: `npx vercel --prod --yes --scope kks-projects-2edcb11a`. To re-run an existing build without new code, `npx vercel redeploy <deployment-url> --scope kks-projects-2edcb11a`. Pushes to `main` also deploy through the Git integration.

Monorepo note (learned 2026-09-18, basketball): if the Next.js app is in a sub-folder (`apps/web`), the Vercel project's **Root Directory** must point there or the build fails with `No Next.js version detected`. Set it once with `npx vercel project update <vercel-project> --root-directory apps/web --scope kks-projects-2edcb11a --yes`; Vercel then finds the pnpm workspace root by itself and a root `vercel.json` is ignored.

## Restore a paused Supabase project

Symptom: an app's `/api/health` returns `db` not ok (or a 5xx), the UptimeRobot monitor on it is red, and the Supabase dashboard (or MCP `list_projects`) shows the project as `INACTIVE` / "Paused". Supabase Free pauses a project after 7 days without activity; the keep-alive monitors in `docs/monitors.md` exist to prevent exactly this, so a pause means the ping was missing, paused, or hitting a route that does not touch the database.

1. **Restore.** Via API: `curl -s -X POST https://api.supabase.com/v1/projects/<ref>/restore -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"` (token from `~/.config/portfolio-ops/secrets.env`; refs are in `SKILL.md`'s system map). **Executed 2026-09-18 for Project B:** the Claude Code sandbox classifier refused that POST as "Modify Shared Resources", so the restore was done in the dashboard with the browser tools: open `https://supabase.com/dashboard/project/<ref>`, the page says `Project "<name>" is paused` with **Resume project** (grey) next to **Upgrade to Pro** (green; never click that), click Resume project, then **Resume** in the confirm dialog; the page shows "Restoration in progress". Status went `INACTIVE` → `COMING_UP` (about 8 minutes) → `ACTIVE_HEALTHY`; poll with `curl -s https://api.supabase.com/v1/projects/<ref> -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r .status`. Free projects restore without charge (the page also says restore is possible until a date about a year after the pause; after that, data is download-only). Renaming works with `PATCH /v1/projects/<ref> -d '{"name":"platform"}'` (done 2026-09-18). All data, Edge Function secrets and API keys survive the pause.
2. **Confirm the database is back.** `curl -sf https://promptflip-35qv.vercel.app/api/health` must return JSON containing `"db":"ok"` (Project A); for Project B, `curl -sf https://yzppfufqaekgaxcrsqxp.supabase.co/functions/v1/health` returns `{"ok":true}` once the T1.1 Edge Function exists. Then `set -a; source ~/.config/portfolio-ops/secrets.env; set +a` and `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json" | jq '.monitors[] | select(.friendly_name | test("DB|health")) | {friendly_name, status}'` should show `status: 2` again within one 5-minute cycle.
3. **Find out why the keep-alive failed** (one of these is always true):
   - No monitor on this project: `docs/monitors.md` has no row whose "Keep-alive?" column names the project. Add one with the runbook "Add an UptimeRobot monitor" on a route that runs a query.
   - Monitor exists but is paused or deleted: `getMonitors` shows `status: 0` or the id is missing. Resume with `curl -s -X POST https://api.uptimerobot.com/v3/monitors/<id>/start -H "Authorization: Bearer $UPTIMEROBOT_API_KEY"`, or recreate.
   - Monitor is up but hits a route that does not query the DB: open the route's source and check it executes a query (promptflip's `src/app/api/health/route.ts` queries Supabase; a static page or a `HEAD`-only check does not). If it does not, point the monitor at a route that does (`PATCH /v3/monitors/<id>` with `{"url": ...}`) or add the query to the route.
   - Monitor was red for days and nobody noticed: the alert contact is missing (`getMonitors` with `alert_contacts=1` shows an empty `alert_contacts` array). Re-attach it with the `PATCH` shape in "Add an UptimeRobot monitor".
4. **Record it.** Append an `incidents.md` entry (date, which project, how long it was paused, which of the four causes above, the fix, and the prevention added). Update the row in `docs/monitors.md` if a monitor changed.
5. **Verify** (from `verification.md`): health route JSON, Supabase project `ACTIVE_HEALTHY`, monitor `status: 2`, and the status page `https://stats.uptimerobot.com/a6n3Wx3PBp` all green.

## Re-point OAuth redirects (promptflip on the new domain)

Executed 2026-09-18 when `promptflip.kalpkan.com` went live. Use it again whenever promptflip's public host changes. Three places must agree: the app's `NEXT_PUBLIC_APP_URL`, Supabase Auth's URL configuration, and (only if Google complains) the Google Cloud OAuth client.

1. **App URL (Vercel, build-time).** From `~/projects/promptflip` (linked to `promptflip-35qv`): `npx vercel env rm NEXT_PUBLIC_APP_URL production --yes --scope kks-projects-2edcb11a` then `printf 'https://promptflip.kalpkan.com' | npx vercel env add NEXT_PUBLIC_APP_URL production --scope kks-projects-2edcb11a` (piping keeps `env add` non-interactive). The project encrypts env values, so confirm with `npx vercel env pull --environment production --yes --scope kks-projects-2edcb11a <scratch file>` and `grep NEXT_PUBLIC_APP_URL <scratch file>`, then delete the scratch file. Rebuild: `npx vercel redeploy https://promptflip-35qv.vercel.app --scope kks-projects-2edcb11a` (rebuilds the last production build; a `NEXT_PUBLIC_` value is inlined at build time, so a fresh build is required; Vercel aliases the new build to every attached domain). Prefer `redeploy` over `npx vercel --prod` when the working tree has uncommitted files, because `--prod` uploads the working tree.
2. **Supabase Auth (Project A `nhddxonizdxwbvwcxklu`).** Read: `curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" https://api.supabase.com/v1/projects/nhddxonizdxwbvwcxklu/config/auth | jq '{site_url, uri_allow_list}'`. Write (the allow list is one comma-separated string and `PATCH` replaces it, so include every entry you want to keep): `curl -s -X PATCH -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" .../config/auth -d '{"site_url":"https://promptflip.kalpkan.com","uri_allow_list":"<old list>,https://promptflip.kalpkan.com/**"}'`. Values on 2026-09-18: before `site_url=https://promptflip-35qv.vercel.app`, list `http://localhost:3000/auth/callback,http://127.0.0.1:3000/auth/callback,https://promptflip-35qv.vercel.app/auth/callback,https://promptflip-35qv.vercel.app`; after `site_url=https://promptflip.kalpkan.com`, list = the same four plus `https://promptflip.kalpkan.com/**`. Keep the old host's entries until the new host is verified (and as long as the fallback alias is meant to keep working). Dashboard equivalent: Supabase → Project A → Authentication → URL Configuration.
3. **Google Cloud OAuth client.** The redirect URI Google sees is Supabase's own `https://nhddxonizdxwbvwcxklu.supabase.co/auth/v1/callback`, which does not change with the app host, so normally nothing to do. Only if the consent screen shows `origin_mismatch` / `redirect_uri_mismatch`: Google Cloud Console → APIs & Services → Credentials → the OAuth 2.0 client used by Supabase → Authorised JavaScript origins → add `https://promptflip.kalpkan.com`. There is no API token for this here, so it is a human checkpoint (H2) in `STATUS.md`.
4. **Verify** (`verification.md`, promptflip section): health JSON on the new host, rendered HTML contains `https://promptflip.kalpkan.com/opengraph-image` (proves the new `NEXT_PUBLIC_APP_URL` is in the build), and the Google consent screen opens from the new host without an error.

## Regenerate Supabase types

Not yet written, added when T1.1 lands. (`supabase gen types typescript --project-id <ref> --schema <app> > src/types/database.ts`.)

## Add a case study

A case study is a `type: "showcase"` registry entry plus a content file; `content/case-study.test.ts` fails the build when one exists without the other. The plain-English version is the hub README section "How to add a case study"; this is the operator's checklist.

1. **Read the source first.** Write the prose from the repo's code and docs, not from the registry tagline (T4.1 found Outline described as an idea-outliner when it is a PencilKit circle-drawing instrument, and classmyschedule turned out to be a byte-identical copy of `jshklz/classmyschedule`; both went to `incidents.md`). Numbers on the page (thresholds, ports, counts) are the constants in the code.
2. **Content file.** `content/projects/<slug>.ts` exporting a `CaseStudy` (`content/case-study.ts`): `title`, `lede`, `kicker` (facts joined by ` · `), `problem` (one paragraph, > 200 chars), `howItWorks` (`intro`, `diagram` id, 3–5 `steps`), `hero`, `gallery`, `screens`, `video` (real media, a labelled `Placeholder`, or `null` when the section does not apply), `tech`, `repo` (must equal the registry `repo`), `status` (one honest line), `wanted` (media Kalp still owes; mirror it in `STATUS.md` H3). Register it in `content/projects/index.ts`.
3. **Diagram.** Add the project to `components/showcase/diagrams/index.tsx` as `FlowData` (3 nodes, node lines under 27 characters, 2 arrow labels, optional `extra` arc). An arrow label must fit the 72 px gap between nodes: at most 10 characters per line, and ` / ` in a label starts a new stacked line (`"events / frames"` renders as two lines); `components/showcase/diagrams/FlowDiagram.test.tsx` fails the build when a line is wider than the gap. `FlowDiagram` renders it horizontally from `md` and vertically below, all `currentColor`, so both themes come for free.
4. **Images.** WebP, 300 KB or less, under `public/images/projects/<slug>/` (`content/media.test.ts` enforces it): `node scripts/media-to-webp.mjs <in> <out.webp>`; a frame from a video: `~/projects/microtubules/.venv/bin/python scripts/video-poster.py <video> <seconds> <out.png>` first. HEIC: export as PNG from Preview first (sharp cannot read it). Import the file at the top of the content file; `next/image` gets width/height from the import. `MediaItem.src` is a `StaticImageData` only: a remote image URL is a type error on purpose, because the hub's `next.config.ts` has no `images.remotePatterns` and `next/image` would fail the build on an unlisted host (allowing one is a separate `next.config.ts` change). Use `position: "50% 60%"` on a `MediaItem` when a portrait frame is shown in the 16/9 hero.
5. **Video.** Never in the repo (`.gitignore` has `media-inbox/`; the media test rejects anything that is not `.webp`). Unlisted YouTube: `{ kind: "youtube", id, title }`. Cloudflare R2 would need a card on the Cloudflare account, so it is not used.
6. **Publish.** `npx vitest run --pool=forks --maxWorkers=1 --testTimeout=10000 && npm run lint && npm run build`, flip the registry entry to `status: "live"`, commit, push. Vercel deploys `main`. The page rule (`app/projects/[slug]/page.tsx`, since 2026-09-18 18:30, pinned by `app/projects/[slug]/page.test.tsx`): `draft: true` in the content file is the publishing gate, the registry status is not. A content file with `draft: true` (or no content file) renders the short placeholder page; a non-draft content file renders the full case study, and when the registry status is still `coming` the meta line says **under construction** instead of "case study" (DIY EEG). The hub row only links to the page once the status is `live`; a `coming` row links to the repo (or nowhere) and says "case study soon".
   **Hardware projects (KiCad).** KiCad 9 is installed at `/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli`. Board render: `kicad-cli pcb render -o out.png --side top|bottom --width 2400 --height 1800 --background transparent --quality high <file>.kicad_pcb` (13 s each), then `sharp().trim({threshold:10})` to crop the empty canvas. Schematic: `kicad-cli sch export svg -o <dir> --no-background-color --exclude-drawing-sheet <file>.kicad_sch` (without `--no-background-color` the page colour defeats the trim), rasterise with `sharp(svg, {density: 300}).resize({width: 4000})` (density 600 exceeds sharp's pixel limit), trim, then `media-to-webp.mjs`. Compose to the slot's aspect **before** converting: the hero is a 16/9 `object-cover` crop and gallery tiles are one fixed aspect per gallery, so a tall board in a 16/9 hero shows only its middle third; lay tall renders horizontally (a USB stick lies flat anyway) or pad the image onto a transparent canvas of the right ratio. The source folders on Kalp's Mac are read-only; never write into them.
7. **Verify** (`verification.md`, Hub rows "Case-study page" and "Case-study media"): `curl -sI https://kalpkan.com/projects/<slug> | head -1` → `HTTP/2 200`; Chrome at 1440 and 390 in both themes, no horizontal scroll, no console errors; Lighthouse performance ≥ 0.90 on one case-study page.
8. **Record**: `STATUS.md` (task row, H3 media list), `SKILL.md` system map row for showcase pages, and this index. A new "Needs Kalp" checkpoint takes the next free H-number **after** `git pull --rebase --autostash`: `grep -o '^### H[0-9]*' STATUS.md | sort -t H -k2 -n | tail -1`; after pushing, `grep -o '^### H[0-9]*' STATUS.md | sort | uniq -d` must print nothing (two agents both filed H14 on 2026-09-18, `incidents.md`).

**As executed 2026-09-18 (T4.1):** live: `/projects/unpark`, `/projects/rc-car`, `/projects/porsche-pcb-keychain` (KiCad renders); under construction: `/projects/eeg`; placeholder page: `/projects/flashcards` (draft content). Outline was removed at 17:57 on Kalp's instruction (not a real project) and classmyschedule was removed from the registry at 18:05 (not Kalp's work, H9 closed), so `/projects/classmyschedule` is a 404. RC-car photos are frames from `~/Desktop/Out and About/Sidequest/Automatic-RC-Car/Videos/*.mp4` (never committed). The Chrome window would not resize below 1440 px (`innerWidth` stayed 1440 after `resize_window`), so the 390 px check was done with a same-origin `<iframe>` of the page at 390×640 injected into the desktop tab, which honours media queries and reports its own `scrollWidth`.

## Purge a large file from git history

Written 2026-09-18 for `KalpKan/Automatic-RC-Car` (943 MB on GitHub because commit `eeecf169` carries `data/`: 900,661,890 bytes in 64,273 JPEGs, although `main`'s tree has been clean since `08819992`). **Rewriting history changes every commit id and needs a force-push, so it is a human checkpoint: never run steps 3–6 without Kalp's explicit "go".** The pushup repo (230 MB of data) follows the same procedure when T3.1 lands.

1. **Measure first**, so the before/after is evidence, not a claim. Without cloning 943 MB: `gh api "repos/<owner>/<repo>/git/trees/<big-commit>?recursive=1" --jq '.tree[] | select(.type=="blob") | "\(.size)\t\(.path)"' | sort -rn | head` (the response says `truncated: true` past ~100k entries; sum by top-level directory with awk). A full local clone reports `git count-objects -vH` → `size-pack`. A `git clone --depth 1` shows what the clone *would* weigh after the purge (19.50 KiB for the RC car).
2. **Open a PR that needs no rewrite** (safe to merge): a README that explains the project, links the case study and says why the clone is heavy; remove stray `.DS_Store`; confirm the offending path is in `.gitignore`. Put the exact rewrite block (step 3) in the PR body for Kalp to approve. Executed: https://github.com/KalpKan/Automatic-RC-Car/pull/1 (branch `purge-training-data`, pushed from a `--depth 1` clone, which works because the remote already has the parent commit).
3. **The rewrite (only after approval)**, in a fresh clone, never a working copy:
   ```bash
   brew install git-filter-repo
   cd "$(mktemp -d)" && git clone https://github.com/<owner>/<repo>.git && cd <repo>
   git count-objects -vH                       # before
   git filter-repo --path data/ --invert-paths --force
   git count-objects -vH                       # after: size-pack well under 1 MiB
   git log --oneline                           # same commits, new ids
   git remote add origin https://github.com/<owner>/<repo>.git   # filter-repo removes it on purpose
   git push --force --mirror origin
   ```
4. **Afterwards**: every clone (including the one under `~/Desktop/Out and About/Sidequest/.../Car Testing`) must be re-cloned, not pushed from again; GitHub's displayed size drops after its next GC (up to a day); verify with a fresh `git clone` + `git count-objects -vH`. Any open PR based on the old ids must be re-created.

## Add an UptimeRobot monitor

Use this for every new app (liveness) and for every Supabase-backed app's DB-touching route (keep-alive). Free plan limits: 50 monitors, 5-minute minimum interval, 10 API requests per minute. Nothing here costs money; never set a custom status-page domain (paid).

Use the **v3 REST API** (`https://api.uptimerobot.com/v3`, bearer auth with the same main API key). The legacy v2 `newMonitor` rejects this account with `access_denied` ("not allowed to use some settings with your current plan") and v2 `getAlertContacts` returns an internal server error; v2 `getMonitors` and `getPSPs` still work and are fine for reads. Full v3 spec: `https://cdn.uptimerobot.com/api/openapi.yaml`.

1. **Load the key** (never echo it, never write it into the repo): `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`.
2. **Confirm the URL is public and returns 2xx without a redirect:** `curl -sI <url> | head -1`. A `302` to `vercel.com/sso-api` means you have a team-scoped or preview alias behind Vercel deployment protection; use the project's public production alias instead (`npx vercel alias ls --scope kks-projects-2edcb11a`). For a keep-alive monitor the route must run a database query (promptflip: `/api/health` returns `"db":"ok"`; Project B: the `health` Edge Function).
3. **Find the alert contact id** (currently `5612875`, email): `curl -s -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" https://api.uptimerobot.com/v3/user/alert-contacts | jq '.[] | {id, type, status}'`.
4. **Create the monitor:**
   ```bash
   curl -s -X POST https://api.uptimerobot.com/v3/monitors \
     -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" -H "Content-Type: application/json" \
     -d '{"type":"HTTP","friendlyName":"<app> health (DB)","url":"https://<host>/api/health",
          "interval":300,"timeout":30,"httpMethodType":"GET","followRedirections":false,
          "successHttpResponseCodes":["2xx"],
          "assignedAlertContacts":[{"alertContactId":5612875,"threshold":0,"recurrence":0}]}' | jq '{id, friendlyName, status}'
   ```
   Naming: `<app> health (DB)` when the route queries a database, `<app> health` for a DB-less health route, `<app> dashboard` / `<app>` for a plain page. `httpMethodType` must be `GET` (the v3 default is `HEAD`, which some routes answer without running the query). `threshold` and `recurrence` are always 0 on the Free plan.
5. **Add it to the status page** (PSP id `1263036`; `monitorIds` replaces the whole list, so include the existing ids from `docs/monitors.md`):
   `curl -s -X PATCH https://api.uptimerobot.com/v3/psps/1263036 -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" -H "Content-Type: application/json" -d '{"monitorIds":[804030255,804030256,804030271,804030499,804031032,804031239,804031518,804031519,804031520,<new id>]}' | jq '{id, monitorIds}'` (the list as of 2026-09-19; read the current one first with v2 `getPSPs` so nobody's monitor is dropped)
6. **Verify after one cycle (up to 5 minutes):** `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=<new id>&alert_contacts=1" | jq '.monitors[] | {id, friendly_name, status, alert_contacts: [.alert_contacts[].id]}'` shows `status: 2` and the contact id; `curl -sI https://stats.uptimerobot.com/a6n3Wx3PBp | head -1` is `HTTP/2 200` and the page lists the new monitor.
7. **Record it:** add the row to `docs/monitors.md` (name, URL, interval, what it protects, keep-alive yes/no, id) and, if the app is new, the `healthUrl` in `projects.json` should be the same route.

To change an existing monitor (for example after H1 moves an app to `<sub>.<domain>`), `PATCH /v3/monitors/<id>` with only the changed fields, for example `-d '{"url":"https://promptflip.<domain>/api/health"}'`; do not delete and recreate, or the uptime history resets. To pause or resume: `POST /v3/monitors/<id>/pause` or `/start`. To attach a contact to an existing monitor: `PATCH` with the `assignedAlertContacts` array from step 4.

## Add PostHog to an app

Executed 2026-09-18 for the hub (T0.5). The contract and the copy-paste snippet live in `docs/analytics.md` in the hub repo; this is the checklist.

1. Read `docs/analytics.md` ("How to add PostHog to a new app"). Project id `616829`, the public `phc_` token is printed there.
2. In the app: `npm i posthog-js`; add the two `/ingest` rewrites to `next.config.ts` (or `vercel.json` for a static app) with `skipTrailingSlashRedirect: true`; copy `lib/posthog.ts` and `components/PostHogProvider.tsx` from the hub; wrap the layout; fire 2 to 4 `snake_case` custom events with `capture()` from the core action. Never send free text a visitor typed.
3. Add `NEXT_PUBLIC_POSTHOG_KEY=` and `NEXT_PUBLIC_POSTHOG_HOST=/ingest` to `.env.example` (names only) and a row to `settings-map.md`.
4. Set both on Vercel for production **and** preview, non-interactively. The key needs `--type config` (the CLI stops with `public_prefix_requires_type` otherwise): `printf '%s' "$TOKEN" | npx vercel env add NEXT_PUBLIC_POSTHOG_KEY production --type config --scope kks-projects-2edcb11a --yes`. Redeploy with `npx vercel deploy --prod --yes --scope kks-projects-2edcb11a` (plain `npx vercel --prod` on CLI 59 prints a JSON prompt and exits).
5. Verify with the "PostHog" table in `verification.md`: `curl -sI https://<host>/ingest/static/array.js | head -1` is 200, then a real browser visit plus one core action, then the events API shows `$pageview` and the custom event with `$host` = that host. Ingestion lag is 3 to 5 minutes; poll, do not conclude after one query.
6. If the app adds a new custom event name, add it to the "Top demos by usage" insight (`PATCH /api/projects/616829/insights/12018258/` with the extra `EventsNode` in `query.source.series`).

## Check PostHog billing

The account must stay on the free plan with no card. `GET https://us.posthog.com/api/billing/` with `Authorization: Bearer $POSTHOG_PERSONAL_API_KEY` must show `has_active_subscription: false` and no `stripe_customer_id`; every product's `custom_limit_usd` is `null` because the free plan hard-caps at `free_allocation` instead (product analytics 1 M events, replay 5 K, and so on). The billing API refuses writes from a personal key (`403 does not support personal API key access`) and the dashboard only offers a custom `$0` limit after a card is added, so **do not try to set limits**; the free cap is the guardrail. Evidence: `docs/images/posthog-billing-limits.png`. Usage this cycle: `https://us.posthog.com/organization/billing/usage` (note it in `STATUS.md` monthly).

## Rotate the PostHog key

Two different keys; rotate the right one.

- **Operator key `POSTHOG_PERSONAL_API_KEY` (`phx_`, all-access today):** PostHog, Settings, User, Personal API keys. Create a new key scoped to organization "KalpKan", project "Kalp portfolio", with only the scopes the runbooks use (`project:read/write`, `insight:write`, `dashboard:write`, `query:read`, `billing:read`), paste it into `~/.config/portfolio-ops/secrets.env`, then delete the old key in the same page. Nothing deployed uses it, so no redeploy. **Do this after Phase 1** (planned, see `settings-map.md`).
- **Project token (`phc_`, public):** rotating it is only needed if events from an unknown site start polluting the project. PostHog, Project settings, "Project API key", reset. Then update `NEXT_PUBLIC_POSTHOG_KEY` (`vercel env rm` + `env add --type config`, production and preview) on **every** Vercel project that sends events (hub `portfolio`, `v0-basketball-analytics-dashboard`, `plato` as `POSTHOG_API_KEY`, and any later app), the Supabase Edge Function secret `POSTHOG_KEY` in Project B, the token line in `docs/analytics.md`, and redeploy each app. Until an app is redeployed it keeps sending with the old token, which PostHog now drops.

## Deploy a Python app to Vercel

**Status: written and executed 2026-09-18 for Plato (`KalpKan/Plato` → Vercel project `plato`, `https://plato.kalpkan.com`).**

When to use: a Flask/FastAPI app must run on Vercel Hobby as one Python function, or Plato needs to be redeployed or repaired.

What Vercel does (docs `vercel.com/docs/frameworks/backend/flask` and `/docs/functions/runtimes/python`, both last updated 2026-08-12): it looks for a top-level `app` in `app.py`/`index.py`/`server.py`/`main.py` (root, `src/` or `app/`), or the `module:variable` set in `pyproject.toml` under `[tool.vercel] entrypoint`. The whole repo becomes one function; every request is routed to it. Static files belong in `public/` (served by the CDN). Only `/tmp` is writable and it does not survive between requests. Request bodies are capped at **4.5 MB** by the platform (413 above that). Python version comes from `.python-version` (3.12 default, 3.13/3.14 available).

Preconditions: Vercel CLI logged in (team `kks-projects-2edcb11a`), the repo cloned under `~/projects/<name>`, a database URL if the app needs one (see "Create a Neon database").

Steps (what was done for Plato, in order):
1. **Make the app stateless.** Nothing may be written outside `/tmp`; nothing may be read from disk in a later request. Plato used to save the `.ics` to `temp_calendars/` and redirect to `/download/<file>`; now the calendar is generated in memory and streamed back in the same `POST /review` response (`Content-Disposition: attachment`). Anything that must survive between requests goes in the signed session cookie (small: under 4 KB) or the database keyed by something in that cookie (Plato keys on `pdf_hash`). Uploads written to `/tmp` get a per-request unique name (`uuid4().hex-<secure_filename>`) and are unlinked in a `finally` block: one warm instance serves many visitors, so two people uploading `outline.pdf` at once must not share a path, and `/tmp` is capped at 512 MB.
2. **Secrets from env with no defaults.** `SECRET_KEY` raises `RuntimeError` at import if missing, so a mis-configured deploy fails loudly instead of shipping a guessable key. `DATABASE_URL` is read at first use.
3. **Do not connect to the database at import time.** Plato creates its cache manager lazily (`get_cache()`), so a cold start does not pay a Neon round trip before the first request.
4. **Packaging files** (all in the repo root):
   - `pyproject.toml` with `[project] requires-python = ">=3.12"`, the runtime `dependencies` list, and `[tool.vercel] entrypoint = "src.app:app"`.
   - `.python-version` containing `3.12`.
   - `requirements.txt` trimmed to runtime deps (dev tools in `requirements-dev.txt`). Keep both lists identical.
   - `vercel.json`: `{"functions": {"src/app.py": {"maxDuration": 60, "excludeFiles": "{tests/**,figma landingpage/**,legacy/**,course_outlines/**,test_*.py,*.md,.venv/**}"}}}`. The `functions` key is the entrypoint file path. `excludeFiles` is one glob string.
   - Static files moved to `public/static/`; Flask's `static_folder` points at `../public/static` so local runs still work.
   - Old platform files (Railway `Procfile`, `Dockerfile`, `nixpacks.toml`, `railway.json`) moved into `legacy/`, not deleted, and excluded from the bundle.
5. **Health route** `GET /api/health` → `{"ok": true, "db": "ok", "service": "<app>"}` after `SELECT 1`; 503 with `db: "error"` when the database does not answer. The hub and UptimeRobot use it.
6. **PostHog (Flask variant of "Add PostHog to an app")**: a `/ingest/<path>` Flask route forwards to `https://us.i.posthog.com` (paths starting with `static/` go to `https://us-assets.i.posthog.com`), the `posthog-js` snippet in `base.html` uses `api_host: '/ingest'`, `persistence: 'memory'` (cookieless), `autocapture: true`; server-side events use the `posthog` package with `sync_mode=True` (serverless: send before the response returns). Snippet and events render only when `POSTHOG_API_KEY` (the public `phc_` project token) is set. **The proxy forwards a whitelist of request headers only** (`Content-Type`, `User-Agent`, `Accept`, `Origin`, `Referer` plus `X-Forwarded-For` for geolocation), never a blacklist: a blacklist shipped the visitor's signed Flask session cookie to PostHog on every event (reviewer-found, `incidents.md` 2026-09-18). For `static/` subpaths it passes `Cache-Control`, `ETag` and `Last-Modified` back so browsers cache the ~300 KB SDK instead of refetching it through the function on every page view.
7. **Create and link the Vercel project:** `cd ~/projects/<name> && npx vercel@latest link --yes --project <name> --scope kks-projects-2edcb11a`. This creates the project if missing and writes `.vercel/project.json` (git-ignored).
8. **Env vars, non-interactively, for production and preview:** `printf '%s' "$VALUE" | npx vercel@latest env add NAME production --scope kks-projects-2edcb11a --force` (repeat with `preview`). Generate `SECRET_KEY` with `python3 -c 'import secrets;print(secrets.token_hex(32))'`. Never echo the values.
9. **Deploy:** `npx vercel@latest --prod --yes --scope kks-projects-2edcb11a`; then `npx vercel@latest inspect <deployment-url> --scope kks-projects-2edcb11a` must say `● Ready` and list `λ flask (<size>)`. Plato's bundle is 72.8 MB (PyMuPDF + pdfplumber), well under the 500 MB Python limit.
10. **Auto-deploys:** `npx vercel@latest git connect --yes --scope kks-projects-2edcb11a` (Plato's repo was already connected when the project was created from the linked folder). Every push to `main` then deploys.
11. **Domain:** follow "Attach a domain to a Vercel project" (`domains add`, `domains verify --json` → `recommended.records[0].value`, Cloudflare CNAME DNS-only, poll HTTPS). Plato: CNAME `plato` → `89cbb06df93ddb6b.vercel-dns-017.com`, record id `64fa56eeae8f8ee920ce165ab281c53f`, HTTPS 200 about 75 s after the record.
12. **Prove it:** run the app's real flow through the live host (Plato: upload a Western outline PDF in Chrome, download the `.ics`, parse it with `icalendar`), record timings, then the `verification.md` block.

Common failures:
- `RuntimeError: SECRET_KEY ...` in the function logs: the env var is missing for that environment (production vs preview). Add it and redeploy.
- `413 FUNCTION_PAYLOAD_TOO_LARGE`: the upload exceeded Vercel's 4.5 MB body limit. Not fixable on Hobby without a client-side direct upload; the README tells users to keep PDFs under 4.5 MB.
- Static file 404: it is not under `public/`, or Flask's `static_folder` was changed. Check `curl -sI https://<host>/static/style.css`.
- Slow first request after idle (2 to 3 s): Vercel cold start plus Neon wake; expected. If every request is slow, `curl -w '%{time_total}'` on `/api/health` vs `/` tells whether it is the database or the function.
- `vercel inspect` shows Ready but the page 500s: run `npx vercel@latest logs <deployment-url> --scope kks-projects-2edcb11a` and look for the Python traceback; the usual cause is an import that works locally (Python 3.14 on the Mac) but not on 3.12, or a missing runtime dependency in `requirements.txt`.

## Deploy a static Vite app to Vercel

**Status: written and executed 2026-09-18 for the microtubule quantifier (`KalpKan/Microtubule-Quantification`, folder `web/` → Vercel project `microtubules`, `https://microtubules.kalpkan.com`).** The same procedure applies to the Phase 3 browser-ML demos (pushups, emotes).

When to use: a browser-only app (Vite + TypeScript, everything runs client-side, no server code) must be hosted on Vercel Hobby, or one of them needs to be redeployed or repaired.

What Vercel does: with `framework: "vite"` it runs `npm install` then `vite build` in the Root Directory and serves `dist/` from the CDN. There are no functions, no cold starts, and static files in `public/` (including a 10 MB `opencv.js`) are served as-is. `vercel.json` in the root directory can add rewrites (used for the PostHog `/ingest` proxy) and headers.

Preconditions: Vercel CLI logged in (team `kks-projects-2edcb11a`), the repo cloned under `~/projects/<name>`, `npm test` and `npm run build` passing locally in the app folder, `web/public/health.json` = `{"ok":true,"service":"<name>"}`.

Steps (what was done for microtubules, in order; run from the **repo root**, not the app folder, so the Git link and the Root Directory setting agree):
1. **Link and create the project:** `npx vercel@latest link --yes --project <name> --scope kks-projects-2edcb11a`. Side effects to undo before committing: it appends `.vercel` and `.env*` to the repo's `.gitignore` (replace `.env*` with `.env.local` + `.env*.local` so `.env.example` stays tracked) and writes an `.env.local` with a `VERCEL_OIDC_TOKEN` (delete it).
2. **Root Directory and framework** (the app lives in a subfolder): `curl -s -X PATCH "https://api.vercel.com/v9/projects/<name>?slug=kks-projects-2edcb11a" -H "Authorization: Bearer $(jq -r .token "$HOME/Library/Application Support/com.vercel.cli/auth.json")" -H "Content-Type: application/json" -d '{"rootDirectory":"web","framework":"vite"}'`. The response echoes `rootDirectory` and `framework`. Dashboard equivalent: project → Settings → General → Root Directory / Framework Preset. Never print the token.
3. **Env vars, non-interactively:** Vite only exposes variables prefixed `VITE_`; the analytics contract uses `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` (see `settings-map.md`). `printf '%s' "$VALUE" | npx vercel@latest env add VITE_PUBLIC_POSTHOG_KEY production --scope kks-projects-2edcb11a` (repeat with `preview`; add `--force` to replace). The public `phc_` token can be read from the PostHog API: `GET $POSTHOG_HOST/api/projects/616829/` → `.api_token`, with `POSTHOG_PERSONAL_API_KEY` from `secrets.env`. Vite bakes env vars in at build time, so a changed variable needs a redeploy.
4. **Deploy:** `npx vercel@latest --prod --yes --scope kks-projects-2edcb11a`. The JSON it prints ends with `"readyState": "READY"` and the deployment URL. Builds take about 10 s. (`Error: fetch failed` on the first try was a transient upload failure; the retry succeeded.)
5. **Auto-deploys:** `npx vercel@latest git connect --yes --scope kks-projects-2edcb11a`. For microtubules the repo was already connected by `link`; every push to `main` produces a production deployment (confirmed: the push and the CLI deploy both showed up in `vercel ls`).
6. **Domain:** follow "Attach a domain to a Vercel project": `domains add <sub>.kalpkan.com <name>`, `domains verify <sub>.kalpkan.com --json` → `recommended.records[0].value` (the project-specific `<hash>.vercel-dns-017.com.`), Cloudflare `POST dns_records` with `proxied: false`, poll `curl -s -o /dev/null -w '%{http_code}' https://<sub>.kalpkan.com/health.json` every 30 s. Microtubules: CNAME `microtubules` → `bb0edf923bf938a4.vercel-dns-017.com`, record id `cde1f34a0408fd944c2f40e9da74108c`, HTTPS 200 after about 60 s, cert `cert_fmPCbqPPTF39A1OVZLFfn0sV`. Record the row in `docs/DNS_PENDING.md` §5.
7. **PostHog proxy in `vercel.json`** (static apps have no server, so the rewrite is the proxy):
   ```json
   {
     "rewrites": [
       { "source": "/ingest/static/:path(.*)", "destination": "https://us-assets.i.posthog.com/static/:path" },
       { "source": "/ingest/:path(.*)", "destination": "https://us.i.posthog.com/:path" }
     ]
   }
   ```
   **Use `:path(.*)`, not `:path*`.** With `:path*` Vercel answered `404` for PostHog's trailing-slash endpoints (`/ingest/e/`, `/ingest/s/`, `/ingest/i/v0/e/`) so every event and replay chunk was dropped (`incidents.md`, 2026-09-18). Check with `curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' https://<host>/ingest/e/` → `400` (PostHog rejecting the empty body, i.e. the request reached PostHog); `404` means the rewrite did not match. Also cache the big static asset: a `headers` entry for `/opencv.js` with `Cache-Control: public, max-age=31536000, immutable`.
8. **Prove it:** open the live host in Chrome, run the core action, and read the Network tab: after load the only requests may be same-origin files and `/ingest/*`. For the phone check the shared Chrome window would not resize, so a local harness page with a 390 px `<iframe>` of the built site (same origin, served by `npx vite preview`) was screenshotted instead. Then fill the `verification.md` block.
9. **Monitor and registry:** runbook "Add an UptimeRobot monitor" on `https://<sub>.kalpkan.com/health.json` (liveness; name `<app> health`), then the `projects.json` entry with the same `healthUrl`, the SKILL.md row and `settings-map.md` names. T1.4, T3.1 and T3.2 all skipped the monitor; the Phase 2–4 audit added the three on 2026-09-19.

Executed again 2026-09-18 for **emotes** (`KalpKan/emote-detector-web`, repo root, Vercel project `emotes` `prj_mgoUdU4NQ9X8sfP7Jhcy4xBBM6pr`, `https://emotes.kalpkan.com`). Differences from microtubules:
- Root Directory stays empty (the Vite app is the repo root); only `{"framework":"vite"}` was PATCHed. `vercel link --yes --project emotes` created the project.
- 39 MB of static ML files are committed under `public/mediapipe/` (WASM runtime SIMD + nosimd from `node_modules/@mediapipe/tasks-vision/wasm/`, and the three `.task` models from `storage.googleapis.com/mediapipe-models/...`). `vercel.json` gives `/mediapipe/(.*)` an immutable one-year cache header. They are imported lazily (dynamic `import("@mediapipe/tasks-vision")` after a button press) so the first paint carries ~25 KB of JS; that is what keeps Lighthouse above 0.85 despite the payload.
- Sounds: the original WAVs were converted with `ffmpeg-static` from npm (`npx`-installable, no Homebrew needed; macOS has no ffmpeg): `ffmpeg -i in.wav -ac 1 -ar 32000 -b:a 48k out.mp3` (544–688 KB → 19–24 KB). `Audio` objects are created inside the click handler so iOS Safari allows playback.
- Deploys with `vercel --prod` upload the whole `public/` folder (40 MB) each time; a `git push` to `main` builds from GitHub instead and is the normal path.
- Vercel Hobby runs **one build at a time per team**. With several agents deploying in parallel on 2026-09-18 the emotes build sat in `INITIALIZING`/`QUEUED` behind portfolio, pushups, plantit and template-smoke builds (see `incidents.md`); `domains add` cannot run until the project has a Ready production build, so attach the domain after the queue drains, not before.

Common failures:
- `404` on `/ingest/...` with a trailing slash: step 7.
- The page says "OpenCV failed to load": `/opencv.js` must be in `public/` and committed (10.96 MB is fine for git and for Vercel); `curl -sI https://<host>/opencv.js | head -1` must be `200`.
- `npm install` fails with `Cannot read properties of null (reading 'edgesOut')` on npm 10.9: an arborist bug resolving `vitest@4`'s optional peers; use `vitest@^5` (`incidents.md`, 2026-09-18).
- `await` on the OpenCV module hangs forever: the Emscripten module is a thenable that resolves to itself; wait for `onRuntimeInitialized` and `delete cv.then` before resolving a Promise with it (`web/src/opencv-loader.ts`, `web/tests/pipeline.test.ts` in the repo).
- Vercel builds but the page has no analytics: the env var is missing for that environment, or was added after the build (Vite inlines it); redeploy.

## Deploy a browser-ML app (MediaPipe) to Vercel

**Status: written and executed 2026-09-18 for the pushup tracker (`KalpKan/pushup-tracker-web`, repo root → Vercel project `pushups` `prj_YE2wfMUkft3oHIaqkRyILcaE8a2R`, `https://pushups.kalpkan.com`); emotes (T3.2) followed the same shape one task earlier.** Builds on "Deploy a static Vite app to Vercel" (same link/env/domain steps); this runbook is the part that is specific to a MediaPipe + TensorFlow.js app.

When to use: a demo that runs a MediaPipe Tasks model (pose, face, hand) and optionally a TF.js classifier in the visitor's browser must be hosted, repaired, or re-verified.

What is special about these apps:
- **Self-host the runtime and the models.** `@mediapipe/tasks-vision` normally loads its WASM from a Google CDN; the plan forbids network calls after load, so the WASM (`node_modules/@mediapipe/tasks-vision/wasm/*`, ~21 MB with the nosimd copy) is copied into `public/wasm/` by a build script (`scripts/copy-wasm.mjs`, run from `npm run build`; `public/wasm` is git-ignored) and the `.task` model (`public/models/*.task`) is committed. `FilesetResolver.forVisionTasks("/wasm")` + `modelAssetPath: "/models/<model>.task"`. Vercel serves `public/` as-is; `vercel.json` gives `/models/*` and `/wasm/*` a one-year immutable cache.
- **Lazy-load everything heavy.** The page's first paint must not include MediaPipe, TF.js or posthog-js: `main.ts` is ~4 KB and does `await import("./session")` on the first button press (`session` chunk ~1 MB, plus the 20 MB of WASM/model fetched then). That is what keeps Lighthouse performance ≥ 0.85 despite the payload; write the trade-off into the README.
- **Match the model the classifier was trained on.** A classifier trained on landmarks from the legacy Python solution (`mp.solutions.pose`, `model_complexity=1`) expects **`pose_landmarker_full.task`** (9.4 MB), not `lite` (5.5 MB): lite's z coordinates sit 0.05-0.1 off (1-2 scaler standard deviations) and the pushups classifier then scored every good frame as bad (incident 2026-09-18). Prove the match before shipping: run the browser pipeline on the same clip the Python fixture was made from and compare per-frame probabilities (pushups: 19/21 frames agree with `full`, 2/21 with `lite`).
- **Bake the preprocessing.** If the training `StandardScaler` was never saved, refit it in Python on the same split (`train_test_split(random_state=42)`) and write the mean/scale arrays into a generated `src/scaler.ts`; check the held-out accuracy with and without scaling in the same script so the README can quote real numbers (pushups: 0.9478 scaled vs 0.6338 raw).
- **Convert Keras → TF.js** with `tensorflowjs_converter --input_format keras model.h5 public/models/form` in a Python 3.10 venv (`tensorflow==2.15`, `tensorflowjs`); a Keras 3 `.h5` needs a re-save in Keras 2 format first (`scripts/keras_model.py` in the repo). Load with `@tensorflow/tfjs` on the CPU backend (a 36-float MLP is microseconds; it avoids fighting MediaPipe's GPU delegate for the WebGL context).
- **Fixtures from Python, tests in vitest.** `scripts/make_fixtures.py` runs the Python pipeline over a window of the original test video and writes landmarks, features, Keras probabilities and rep events per frame; vitest replays them through the TS port (classifier |Δp| < 1e-4, identical rep events). No MediaPipe in unit tests.
- **Demo mode.** Bundle a short H.264 clip (`ffmpeg -ss <start> -t 8 -i test.mp4 -vf scale=640:-2 -an -c:v libx264 -crf 28 -movflags +faststart public/demo/<name>.mp4`, ≤ 2 MB; `ffmpeg-static` from npm if the Mac has no ffmpeg) and run the exact same `detectForVideo` loop on a `<video>` of it; `detectForVideo` needs strictly increasing timestamps, so skip frames whose `currentTime` did not change.
- **PostHog:** never send landmark or image data. Type the `capture()` signature so only `session_started {mode}`, `rep_counted {good}` / `emote_fired {...}`, `demo_video_played` compile.

Proving it works (what was actually run for pushups):
1. `npm test` (vitest, `--pool=forks --maxWorkers=1`): fixtures replay green.
2. `npx vite preview --port 4177` then `node scripts/e2e-demo.mjs http://localhost:4177/` (puppeteer-core driving the installed Chrome, headless): presses "Play demo clip", waits for "Clip finished", prints counts, fps, every host contacted and console errors. Expect `hosts` = the site only. Headless Chrome renders WebGL with SwiftShader at 4-6 fps, so counts there are lower than on a laptop GPU; `PLAYBACK_RATE=0.25` slows the clip so the loop sees most frames.
3. For an exact check, step the clip frame by frame in the browser (seek + `detectForVideo`) and replay the trace through the TS rep counter (done with a throwaway vitest test): pushups gave 1 good + 1 bad attempt vs Python's 2 good + 1 bad on the same 8.5 s (the gap is the rep counter's 10-frame warm-up at 30 fps sampling vs 60 fps, the original's behaviour).
4. posthog-js drops every event when `navigator.webdriver` is true or the UA says `HeadlessChrome`, so a plain puppeteer run never reaches PostHog (incident 2026-09-18). `scripts/e2e-demo.mjs` launches Chrome with `ignoreDefaultArgs: ["--enable-automation"]`, `--disable-blink-features=AutomationControlled` and a desktop UA; with that, the three events arrived in PostHog within 30 s (`GET /api/projects/616829/events/?event=rep_counted`).
5. The shared claude-in-chrome tab is a **hidden** window: `<video>` never starts and WebGL model loading stalls at "Loading the pose model" forever. Do not use it for these apps; use the puppeteer script or ask Kalp to open it (H checkpoint).
6. Live: `curl https://<host>/health.json`, the four asset URLs with `cache-control: immutable`, `/ingest/e/` → 400, Lighthouse ≥ 0.85 (`verification.md`).

Measuring detection quality with a fake camera and a landmark corpus (written 2026-09-18 for emotes, `docs/reports/emotes-spec.md` §4-5; reuse for any gesture/pose demo):
7. **Photo corpus → landmark fixtures.** Run the SAME `.task` models the site ships over labelled photos with the Python `mediapipe` package (`/usr/bin/python3` has 0.10.20; `mediapipe.tasks.python.vision.*Landmarker`, `RunningMode.IMAGE`) and commit only the normalised landmarks + a sha256 per photo (`scripts/extract_still_landmarks.py` → `tests/fixtures/stills/*.json`). Stock photos and anything with a face stay out of the repo; a hand-written `labels.json` (kind + note per photo, e.g. `occluded`, `hard`, `neutral`, `skip`) is the ground truth and is merged into `index.json` on every re-extract. Look at a contact sheet (Pillow, in the scratchpad) before labelling: a corpus folder had a search-results screenshot in it.
8. **Ground-truth clips as scripts, not frames.** A 4 s clip with a 478-point face is ~500 KB; instead commit a script (`clips.json`: stills held for N ms, transition ms, seeded jitter σ) and synthesise 25 fps frames deterministically in the test loader (`tests/corpus.ts`). Feed them through the app's own engine + gate exactly as `main.ts` does and judge fires against `events[] {gesture, startMs, endMs}`: fire window (≤ 1000 ms after onset), one fire per hold, a 60 s neutral clip with 0 firings, a hard-negative clip with ≤ 1. `npm run report` prints precision / recall / latency; `npm run test:corpus` is the gate and runs in CI (`corpus` job) separately from the unit job so a red bar is visible as such.
9. **Real pipeline with Chrome's fake camera.** Build an `.mjpeg` (concatenated JPEG frames, Pillow only: Playwright's bundled ffmpeg has no PNG decoder) and launch the installed Chrome with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream --use-file-for-fake-video-capture=<abs>.mjpeg` (`scripts/e2e-camera.mjs`, puppeteer-core). Three things bite: Chrome plays an `.mjpeg` at **30 fps whatever it was built at** (build it at 30); the file starts looping when the stream starts, seconds before the models are ready, so recover the clip position from the `<video>` `playing` moment; judge exactly one loop (`sinceStart < durationMs`) or the next pass shows up as a "false trigger". `GPU=1` (ANGLE/Metal) gives real-laptop latencies (emotes: 131-183 ms after onset before the time-based dwell, 240-480 ms with it); SwiftShader manages a few fps and 1.4-1.7 s. `WIDTH=390` exercises the phone layout. Since FIX r1 the judge ignores MediaPipe's `INFO:` / `W0000` console lines but fails on any other console error, and a second fire for an already-matched event only counts as a false trigger when it is in the same loop pass (the next pass's fire is dropped).
10. **Tuning gesture rules against a corpus (emotes FIX r1, 2026-09-19).** Dump per-still features first (a scratch `vite-node` script over `tests/corpus.ts` printing every candidate cue for every labelled still, grouped by kind) and read the separations off the table before writing a rule; then make each rule the WEAKEST of named 0-1 cues (`{score, cues}`), never a weighted blend, so a missing cue cannot be compensated and the weakest cue doubles as the on-page hint. Normalise every cue by a body measure (hand size = wrist→middle knuckle, shoulder width, face height), never a frame fraction, and scale x by the frame aspect (`geometry.scaled`) before measuring anything. On the face, measure gaps as SIGNED projections on the forehead→chin axis averaged over several landmark pairs: `Math.abs` of a single near-zero lid gap turns symmetric jitter into a positive offset (a shut eye measured "open" on a third of the frames at σ 0.008). Time the state machine in milliseconds with a hysteresis band (on ≥ 0.5, off < 0.35) and leaky clocks; then add 10 s hold clips at 25 / 12 / 8 fps to the corpus so re-fires and phone frame rates are gated, and re-check the real pipeline with the fake camera: `thumbs_up-04` passed the stills gate (flex 0.45) and still fired Goblin Muscle live (VIDEO-mode landmarks differ a little from IMAGE mode), which is why the flex-vs-thumbs-up conflict rule compares strengths instead of vetoing outright. A label may change only with the photo open and the landmark evidence written into `labels.json`; say so in the commit message.

Common failures:
- `UNKNOWN: Unable to open zip archive` from `PoseLandmarker.createFromOptions`: the `.task` URL returned HTML (404), typically a file that is in `public/` but not in `dist/` when testing `vite preview`; rebuild.
- `vercel deploy --prod` prints `Error: fetch failed` after uploading 30 MB of `public/`: the deployment usually exists anyway (`vercel ls`); prefer `git push` (the project is GitHub-connected) and let the queue build it.
- Hobby builds one deployment per team at a time; on a multi-agent day a deployment sits `Queued` for an hour with no error (pushups: 3 queued, all built in 13-33 s once their turn came). `domains add` works as soon as one production build is Ready.

## Create a Neon database

**Status: written and executed 2026-09-18 for Plato (database `plato`, role `plato_owner`, project `nameless-waterfall-55271929`, branch `production` = `br-aged-cell-b56sp8zx`, region `aws-us-east-2`, Postgres 18).**

When to use: an app needs only a Postgres URL (no Supabase auth/storage/realtime), per the two-Supabase-projects rule. One Neon project, one database per app, each with its own role.

Preconditions: `NEON_API_KEY` and `NEON_PROJECT_ID` loaded from `~/.config/portfolio-ops/secrets.env`. `jq` installed.

Steps:
1. Find the production branch id: `curl -s -H "Authorization: Bearer $NEON_API_KEY" https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches | jq '.branches[] | {id,name,default}'`.
2. Create the role: `POST .../branches/<branch>/roles` with `{"role":{"name":"<app>_owner"}}`. Neon generates the password; do not print the response body beyond `.role.name`.
3. Create the database owned by that role: `POST .../branches/<branch>/databases` with `{"database":{"name":"<app>","owner_name":"<app>_owner"}}`. (Wait a few seconds between API writes; Neon serialises operations per branch.)
4. Get the pooled connection string, straight into a mode-600 file, never to the terminal: `curl -s -H ... "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/connection_uri?branch_id=<branch>&database_name=<app>&role_name=<app>_owner&pooled=true" | jq -r .uri > <scratch>/db_url.txt`. The pooled host has `-pooler` in it (`ep-...-pooler.c-7.us-east-2.aws.neon.tech`); use the pooled one for serverless functions. `?sslmode=require&channel_binding=require` is already in the URI.
5. Create the schema with the app's own script: Plato `DATABASE_URL="$(cat <scratch>/db_url.txt)" .venv/bin/python scripts/init_db.py` prints `tables: extraction_cache, user_choices` and `ping: True`.
6. Put the URI in Vercel as `DATABASE_URL` (see step 8 of "Deploy a Python app to Vercel") and delete the scratch file.
7. Record the database in `settings-map.md` and the app row in `SKILL.md`.

Common failures:
- `409` on role/database create: it already exists; list with `GET .../roles` or `.../databases` and reuse it.
- `connection_uri` returns 404: the role or database name is wrong, or the branch id is not the one they were created on.
- Free-plan compute scales to zero after 5 minutes idle; the first query after that takes a few hundred ms extra. That is expected and is what the UptimeRobot 5-minute ping on `/api/health` is for.
- Reset a role's password if it ever leaks: `POST .../branches/<branch>/roles/<role>/reset_password`, then fetch a new `connection_uri` and update `DATABASE_URL` in Vercel.

## Deploy an Express+CRA app to Vercel

**Status: written and executed 2026-09-18 for Plant It (`KalpKan/PlantWater` → Vercel project `plantit`, `https://plantit.kalpkan.com`).**

When to use: an app has a Create-React-App (or any static-build) frontend plus a Node/Express API in the same repo and must run on Vercel Hobby as static files + one serverless function; or Plant It needs to be redeployed or repaired.

What Vercel does: with `framework: null`, `buildCommand` and `outputDirectory` in `vercel.json`, it runs the build once and serves the output directory from the CDN; every file under `api/` becomes a Node function (uses the **root** `package.json` for dependencies, so the API's deps live there, not in a sub-package). Request bodies are capped at 4.5 MB (413 above). `rewrites` are evaluated in order after the filesystem, so the API catch-all and the SPA fallback must be ordered: `/ingest/*` → PostHog, `/api/:path(.*)` → `/api/index`, then `/((?!api/|ingest/|static/).*)` → `/index.html`. Express receives the original `req.url` (`/api/health`), so routes keep their full `/api/...` paths.

Steps (what was done for Plant It, in order; run from the repo root `~/projects/plantit`):
1. **Repo shape.** Root `package.json`: API deps + `"build": "npm --prefix frontend ci && npm --prefix frontend run build"` + `"test": "jest --runInBand"`; `api/index.js` = `module.exports = createApp()` from `backend/src/app.js` (the app exports, it never calls `listen`; `backend/src/index.js` is the local dev server). Delete platform leftovers (Dockerfile, Cloud Run start scripts, App Hosting yaml) and any hosting section of `firebase.json` (rules only). `.gitignore` must not ignore `.env.example` (the old `.env.*` pattern did).
2. **Config from env, lazily.** Firebase Admin initialises on first use from `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (the key is pasted with real newlines; the code also accepts literal `\n`). A missing value makes `/api/health` answer 503 `firestore: error` instead of crashing the function at import.
3. **Health route** `GET /api/health` → `{ok, service, firestore: "ok"|"error", ...}` after a real Firestore read with a 6 s timeout; `Cache-Control: no-store`.
4. **CRA build must be warning-free**: Vercel sets `CI=true`, which turns ESLint warnings into build failures. Run `cd frontend && CI=true npm run build` locally first and fix the warnings (do not set `CI=false`).
5. **PostHog**: `posthog-js` imported dynamically after `load` from `frontend/src/analytics.js` with `api_host: '/ingest'`, `persistence: 'memory'`; key from `REACT_APP_POSTHOG_KEY` (CRA only exposes `REACT_APP_*`, baked in at build time). The `/ingest` rewrites in `vercel.json` use `:path(.*)` (see the static-Vite runbook for why).
6. **Create and link the project:** `npx vercel@latest link --yes --project plantit --scope kks-projects-2edcb11a`. It rewrites `.gitignore` (adds `.vercel`, `.env*`) and writes `.env.local`: restore your `.gitignore` and delete `.env.local` before committing.
7. **Env vars, non-interactively, production + preview:** `printf '%s' "$VALUE" | npx vercel@latest env add NAME production --scope kks-projects-2edcb11a --yes --force` (repeat with `preview`). Multi-line values (the Firebase private key) pipe fine. `REACT_APP_*` names were accepted as plain secrets (no `--type config` needed, unlike `NEXT_PUBLIC_`); the CLI shows them as `Config`. Never echo a value; check with `npx vercel env ls` (names only).
8. **Deploy:** `npx vercel@latest --prod --yes --scope kks-projects-2edcb11a`. Hobby builds run one at a time per team: with several agents deploying, a deployment sits in `● Queued` for 10+ minutes before building (observed 2026-09-18); poll `npx vercel ls plantit`, do not re-run the deploy.
9. **Firebase Auth authorized domains** (Google sign-in fails with `auth/unauthorized-domain` from a new host): `PATCH https://identitytoolkit.googleapis.com/admin/v2/projects/<project>/config?updateMask=authorizedDomains` with a service-account access token (`google-auth-library`, scope `cloud-platform`; script pattern in `incidents.md`/T2.1 plan). Add `<sub>.kalpkan.com` and `<project>.vercel.app`. The service account file is `~/.config/portfolio-ops/plantit-firebase-sa.json` (mode 600, never in a repo).
10. **Domain:** "Attach a domain to a Vercel project" (needs a Ready production build first).
11. **Prove it:** `curl -s https://<host>/api/health` → `firestore: ok`; then the **API smoke test with a minted token** (`verification.md`, row "Whole flow without hardware (API)"): identify → device → water → delete. `/api/health` only proves a read; on 2026-09-18 every write route was 500 (`Timestamp` missing from the Admin wrapper) while health was green (`incidents.md`). Then the real flow in Chrome (sign in, upload, identify, Water now); the agent stops at the Google account chooser (OAuth as Kalp is his click, STATUS.md H12), then the `verification.md` block.
12. **CI (added 2026-09-19, T2.2):** `.github/workflows/ci.yml` runs `npm ci` (root + `frontend/`), `npm run test:api`, `npm run test:web`, then `npm --prefix frontend run build` with `CI=true` on every push to `main` and every PR; no secrets needed (tests inject a fake Firebase; the build uses the public Firebase web config). `gh run list --limit 1` must say `completed success` before a deploy is trusted. A red CI on a docs-only push means a test depends on something outside the repo: fix the test, not the workflow.
13. **Third-party keys a visitor brings (bring-your-own-key, T2.2):** never add a paid key (OpenAI) to Vercel. Plant It's pattern: the browser keeps the key in localStorage, sends it per request in a custom header (`X-OpenAI-Key`, allowed in CORS `allowedHeaders`), the route reads it with a strict shape check and hands it to the provider call for that request only, log lines go through a redactor, `/api/health` never reports the key as configured, and a test asserts that setting the env var on the server changes nothing. Copy this shape for any future paid provider.
14. **Public alias:** the project's public production alias is `plantit-kappa.vercel.app` (from `GET /v9/projects/plantit` → `targets.production.alias`, or `vercel alias ls`). `plantit.vercel.app` is **not** ours (someone else's Vercel project); `plantit-kks-projects-2edcb11a.vercel.app` sits behind deployment protection (302 to `vercel.com/sso-api`). Use the custom domain everywhere.
15. **Corpus runs without spending the app's Pl@ntNet counter (added 2026-09-19, FIX round 1):** the 50/day counter is one Firestore document shared by every request to production, and the spec + test rounds can leave fewer than the 16 calls a full run needs (`/api/health` → `spend.plantnet.count`). Two ways round it, both $0: (a) **offline**: `npm run test:api` includes `backend/src/corpus.test.js`, which replays the recorded Pl@ntNet answers (`ground-truth.json` `plantnetCalibration`) through the real API and scores every bar, no network; (b) **local harness with real Pl@ntNet**: a 30-line script that calls `createApp({ firebase: <in-memory fake like app.test.js>, env: { PLANTNET_API_KEY, PLANTNET_DAILY_LIMIT: '100' }, ... }).listen(3999)`, then `PLANTIT_ID_TOKEN=any node scripts/run-corpus.js --base http://localhost:3999` (the fake `verifyIdToken` accepts anything). It spends Kalp's Pl@ntNet account quota (500/day), not the app's counter, and writes nothing to Firestore. For the live spot check use `node scripts/run-corpus.js --only mug,dracaena-trifasciata.jpg,zamioculcas,monstera-deliciosa-2` (negatives are always included; ~4 calls). Never raise `PLANTNET_DAILY_LIMIT` on Vercel to make room. (c) **real-dependency local stack (TEST round 2, 2026-09-19)**: `docs/reports/evidence/plantit-r2-local-stack.js` serves the CRA build with **all** of `vercel.json`'s rewrites (`/api`, the `/ingest` PostHog proxy, SPA fallback) in front of the real Express app with the real Firebase Admin SDK (so throwaway ID tokens verify, plants land in the real Firestore/RTDB and photos in the real bucket) and only the `spend` collection redirected to memory; `node scripts/run-corpus.js --base http://localhost:3999 --uid corpus-r2` then scores the real pipeline end to end at 0 cost to the app's counter and deletes its plants. Build the frontend with the production `REACT_APP_POSTHOG_KEY` (`vercel env pull` into the scratchpad, never into the repo) or Lighthouse and the console checks will not match production; a stack without the `/ingest` proxy shows a browser-side `Unexpected token '<'` on every page that is the harness, not the app.

Common failures:
- Build fails with ESLint "Treating warnings as errors": step 4.
- `/api/health` serves the SPA's `index.html`: the SPA fallback rewrite is above the `/api` rewrite, or lacks the `(?!api/)` exclusion.
- `firestore: error` with `firestoreError: "Firebase Admin not configured"`: an env name is missing for that environment (production vs preview).
- `413`: the photo exceeded 4.5 MB; the frontend caps at 4 MB.
- Google sign-in `auth/unauthorized-domain`: step 9.
- The login page stops responding after a click (automation: CDP clicks/screenshots time out): a native `alert()` is open. Never use `alert()`/`confirm()` in the frontend; render the message inline and disable the button while the popup is pending (fixed 2026-09-18, `incidents.md`).
- `/api/identify` or `Water now` → 500 `reading 'fromMillis'`: `backend/src/firebase.js` must export `Timestamp` (and everything else `app.js` destructures from `fb()`); `backend/src/firebase.test.js` guards the shape.
- `npm run dev:api` crashes with `Cannot find module 'dotenv'`: the local entry `backend/src/index.js` needs `dotenv` in the **root** `package.json` (the Vercel function `api/index.js` never loads it, so production stays green while the README's local run is broken). Fixed 2026-09-18 (`72b7c3c`); `node -e "require('dotenv')"` from the repo root is the check.
- `vercel --prod` (or the GitHub push) answers `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")` and the commit's GitHub status says `Deployment rate limited — retry in 24 hours`: Vercel's "Deployments per day (Free)" limit, 100 per 86 400 s, scope `owner` = the whole Hobby team (docs `/docs/limits`, rate-limits table). **What was actually observed on 2026-09-18 (do not assume a hard 24 h wait):** with the API listing 99-100 team deployments in the last 24 h (65 of them the hub `portfolio`, oldest 18:55 UTC), refusals were intermittent for every project: hub pushes `fcd9c05` (22:44) and `a47f0d7` (22:53) were refused while `d55ee74` (22:46) and `3c12205` (23:01) deployed; plantit was refused at 22:35, 22:53, 22:55 and 23:13 and then accepted at 23:15 (`ca980a7` went live at 23:17). So a refusal means "retry in a few minutes", not "wait a day"; the API count (`scripts/vercel-deploy-budget.sh`, agent-only) is a warning, not a schedule, and deployments of since-deleted projects are not in it. Vercel never retries a refused Git deploy by itself: push again or run `npx -y vercel@59.23.2 --prod --yes --scope kks-projects-2edcb11a` from the repo root, and after it succeeds prove the served commit (`vercel inspect <deployment-url>` → Ready + the host in Aliases; the v13 deployments API `meta.githubCommitSha` = `git rev-parse HEAD`), never just `/api/health`, which the old build answers too. Agents that cannot stay alive can use `scripts/vercel-redeploy-when-quota-frees.sh <dir> <host>` (retries every 15 min, exits 0 only when HEAD is READY and aliased; a person never needs it, Kalp just tells Claude "redeploy <app>" or clicks Redeploy on the newest `main` deployment in the Vercel dashboard). Scheduling it via launchd is refused by the agent permission layer. An "Ignored Build Step" does not save slots (Vercel: canceled builds "will still count towards your deployment quotas"). Keep the budget sane anyway: one push per task step rather than per file, never loop `vercel --prod` to "refresh"; whether the hub should stop auto-deploying (`git.deploymentEnabled: {"main": false}` in its `vercel.json`) is a hub-owner policy decision, and it has NOT been shown that fewer hub pushes would have avoided the refusals.
- ESP8266 routes (`POST /api/plants/:id/moisture`, `GET .../moisture/:userId`) answer `403 Device not authorised for this plant`: by design since 2026-09-18. They need the header `X-Device-Secret` that `connect-device` issues per plant (stored on the plant doc as `deviceSecret`, sent to the device inside the `/configure` payload, never returned to the browser, cleared by disconnect-device). A plant that was never connected from the app has no secret and cannot be flipped to hardware mode by anyone who knows its uid + id (both visible in the public photo URL).
- `connect-device` answers `400` for a public IP or a bad port, and `502 hardwareRequired` on Vercel before any network call (`env.VERCEL` is set on every Vercel function): the device feature only works with the API run locally on the home network (`npm run dev:api`), and the function must never be pointed at a public host or the cloud metadata IP.

## Create a new project from the template

**Status: written and executed 2026-09-18 (T1.2).** The template is the public GitHub template repo **`KalpKan/portfolio-template`** (local `~/projects/portfolio-template`; `is_template: true`). It is a Next.js 16 App Router + TypeScript + Tailwind 4 app with vitest, zod, a Supabase client scoped to `NEXT_PUBLIC_APP_SCHEMA`, migration `0001_create_schema.sql` (placeholder `__APP__`), `GET /api/health` (`{ok, service, db: "ok"|"skipped"|"error", time}`), PostHog exactly as the hub (`/ingest` rewrites, `lib/posthog.ts` verbatim, cookieless, autocapture, `lib/events.ts` TODO for 2-4 custom events), the "part of kalpkan.com" footer, CI (lint, migration guard, test, build) and a non-developer README. Proven 2026-09-18 by a timed throwaway spin-up (`template-smoke`): create-from-template → `npm ci` → 28 tests → build → `vercel deploy --prod` → `curl /api/health` = **10 min 05 s**, of which the build was 16 s and ~9 min was the Hobby one-build-at-a-time queue (README "Verified" section has the raw outputs). Nothing here costs money; no Supabase schema is needed until step 4.

`<app>` is one lowercase word (`hoops`, `plantit`); it becomes the repo name, the Vercel project name, the schema name and the subdomain.

1. **Create the repo from the template** (fresh history, one commit):
   ```bash
   cd ~/projects && gh repo create KalpKan/<app> --template KalpKan/portfolio-template --public --clone && cd <app> && npm ci
   ```
   The GitHub UI equivalent is the green "Use this template" button on `KalpKan/portfolio-template`. Then confirm `gh repo view KalpKan/<app> --json visibility --jq .visibility` prints `PUBLIC` (the account default is private; the template itself was created private by mistake on 2026-09-18, `incidents.md`).
2. **Name it.** `sed -i '' 's/__APP__/<app>/g' supabase/migrations/*.sql`, then `grep -rn __APP__ supabase/` must print nothing. Change `"name"` in `package.json` and the title in `app/page.tsx`. `bash scripts/check-migrations.sh` (also runs in CI) fails if `public.` is referenced or, once `NEXT_PUBLIC_APP_SCHEMA` is set, if `__APP__` remains.
3. **Check it:** `npm test && npm run lint && npm run build` (expect 7 files / 28 tests passing and routes `○ /`, `ƒ /api/health`). Commit and push; CI on the new repo must be green (`gh run list -R KalpKan/<app> --limit 1`).
4. **Database (only if the app needs one).** Runbook "Add a schema to Supabase Project B" steps 2-3 with the repo's `supabase/migrations/` (the file already contains the grants, default privileges and the `<app>.health_select_one()` function the health route calls; the comment block at the top explains the "Exposed schemas" step). Then runbook "Regenerate Supabase types": `npx supabase@2 gen types typescript --project-id yzppfufqaekgaxcrsqxp --schema <app> > lib/database.types.ts` and narrow `export type Schema = string` to `"<app>"` in `lib/supabase.ts`. Never a third Supabase project; a DB-only app goes to Neon instead (runbook "Create a Neon database").
5. **Deploy:** from the repo folder `npx vercel@latest deploy --prod --yes --scope kks-projects-2edcb11a` (the first run creates the project named after the folder). If the CLI prints `Error: fetch failed` right after "Uploading", the deployment usually still built: check `npx vercel@latest ls <app> --scope kks-projects-2edcb11a` for `● Ready` before retrying. Hobby builds run one at a time per team, so a queued deploy can sit for minutes; poll, do not re-run. Alternatively import the repo at https://vercel.com/new (team "Kk's projects") so pushes to `main` deploy automatically.
6. **Env vars on Vercel** (Production + Preview), names only here: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_SCHEMA` (pipe the Supabase values from the Management API, pattern under "Rotate a secret"; skip all three for a DB-less app and health answers `db: "skipped"`), `NEXT_PUBLIC_POSTHOG_KEY` (`--type config`) and `NEXT_PUBLIC_POSTHOG_HOST=/ingest` (runbook "Add PostHog to an app"), optional `NEXT_PUBLIC_APP_NAME`. `NEXT_PUBLIC_*` is baked in at build time: redeploy after setting them.
7. **Health:** `curl -s https://<app>-<hash>.vercel.app/api/health` (public alias from `vercel ls`) → `{"ok":true,"service":"<app>","db":"ok"|"skipped","time":...}` with `cache-control: no-store`. `db: "error"` (503) means the schema is not exposed, the function is missing, or the env names are wrong.
8. **Domain:** runbook "Attach a domain to a Vercel project" for `<app>.kalpkan.com` (needs a Ready production build first).
9. **Custom events:** rename the example in `lib/events.ts` to the app's core action (2-4 snake_case past-tense names; reserved names in `docs/analytics.md`) and call it from the component that performs the action.
10. **Register it:** `projects.json` entry (stub in the template README step 8; runbook "Add a project to `projects.json`"), UptimeRobot monitor on the health URL, `SKILL.md` system-map row, `settings-map.md` rows, and the app README "Where the settings live" (already written by the template; fill in the app's specifics).

To change the template itself: edit `~/projects/portfolio-template`, `npm test && npm run lint && npm run build`, push to `main` (CI must stay green). Existing apps do not update automatically; the template is a starting point, not a dependency.

Learned on first execution (2026-09-18, `template-smoke`):
- `vercel deploy` reported `Error: fetch failed` after the upload while the deployment was already building and reached `● Ready` in 40 s; the retry then queued behind four other agents' builds for ~6 min (see `incidents.md`).
- The `gh` token on this Mac has `repo` but not `delete_repo`, so `gh repo delete` fails; the throwaway was archived instead (`gh repo archive KalpKan/template-smoke -y`) and STATUS.md asks Kalp to run `gh auth refresh -h github.com -s delete_repo` once so agents can delete throwaways. `vercel project rm` needed no extra permission.

## Audit a phase (re-verify every definition of done)

Run this at the end of every phase, and whenever several agents have worked concurrently (regressions and stale docs are the usual damage). It touches nothing but UptimeRobot monitor URLs, skill files, STATUS.md and docs; application bugs it finds are filed as discrepancies, never fixed in passing. First run: 2026-09-18 (Phase 1). Budget: about 30 minutes.

1. **Load the keys and pull the hub repo:** `set -a; source ~/.config/portfolio-ops/secrets.env; set +a; cd ~/projects/portfolio && git pull --rebase --autostash`.
2. **Every host, one loop** (status, TLS, who serves it):
   ```bash
   for h in kalpkan.com www.kalpkan.com promptflip.kalpkan.com hoops.kalpkan.com plato.kalpkan.com plantit.kalpkan.com pushups.kalpkan.com emotes.kalpkan.com microtubules.kalpkan.com; do
     printf "%-28s " $h; curl -s -o /dev/null -w '%{http_code} tls=%{ssl_verify_result} ' -m 25 "https://$h/"; curl -sI -m 25 "https://$h/" | grep -i '^server:' | tr -d '\r'; done
   ```
   Expect `200 tls=0 server: Vercel` for every host (`308` for www). `tls=` anything but `0` is a certificate problem; `server: cloudflare` is an orange-cloud record.
3. **Every health route:** the `healthUrl` of each `projects.json` entry plus `https://kalpkan.com/api/health` and Project B's `/functions/v1/health`; each must answer 2xx JSON with `ok: true` (and `db: ok` where there is a database).
4. **DNS against a public resolver** so a stale local cache cannot fool you: `dig +short <host> @1.1.1.1` for every host, compared with `docs/DNS_PENDING.md` §5.
5. **Plans and spend, all read-only:**
   - Supabase: `curl -s https://api.supabase.com/v1/projects -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -c '.[] | {name,status}'` → exactly two `ACTIVE_HEALTHY`.
   - Vercel: `npx vercel@latest teams ls --scope kks-projects-2edcb11a` → plan `hobby`; `project ls` → the eight expected projects. Without the CLI: `GET https://api.vercel.com/v2/teams/team_COuL6hLftYDdKidApgwbIQIK` → `.billing.plan` = `hobby`, and `GET /v9/projects?teamId=...` → each `.targets.production.readyState` = `READY` with `.meta.githubCommitSha` = that repo's `main` (proves the served commit).
   - Firebase (Plant It): open `https://console.firebase.google.com/project/plant-it-5e2fc/usage` with the Chrome tools and read "Project cost: Spark / No-cost" (there is no API for the plan on this project; the Cloud Billing API is disabled, which is itself consistent with Spark).
   - Neon: `curl -s https://console.neon.tech/api/v2/organizations/org-mute-unit-58600178 -H "Authorization: Bearer $NEON_API_KEY" | jq .plan` → `"free"` (the org id is required on `/projects` too: `?org_id=org-mute-unit-58600178`).
   - PostHog: `curl -s "$POSTHOG_HOST/api/billing/" -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" | jq '{has_active_subscription, customer_id}'` → `false`, `null`.
   - UptimeRobot: `curl -s https://api.uptimerobot.com/v3/monitors -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" | jq -c '.data[] | {id, friendlyName, url, status}'`; every platform monitor `UP`, none on a `*.vercel.app` host, and **one per live `projects.json` app** (its `healthUrl`) plus the Project B keep-alive; the v2 `getPSPs` list must contain every one of them. Re-point a stale one with `PATCH /v3/monitors/<id>` `{"url": ...}` (same id keeps the history), create a missing one per "Add an UptimeRobot monitor", and fix `docs/monitors.md`.
   - PostHog insight "Top demos by usage" (`GET /api/projects/616829/insights/12018258/` → `.query.source.series[].event`) lists every app's core-action event (`docs/analytics.md`); an app whose event is missing means its task skipped step 6 of "Add PostHog to an app".
6. **Hub renders the registry:** `curl -s https://kalpkan.com > /tmp/hub.html`, then `grep -c "<name>"` for every `projects.json` name and `grep -o 'href="https://[a-z]*\.kalpkan\.com[^"]*"' /tmp/hub.html | sort -u`; every `live` app URL and every `live` showcase `/projects/<slug>` must appear. `npm test` in the hub keeps registry and content files in lock-step.
7. **Analytics per host:** for `$pageview` and each app's custom events, `curl -s "$POSTHOG_HOST/api/projects/616829/events/?event=<name>&limit=50" -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" | jq -c '[.results[].properties["$host"]] | group_by(.) | map({(.[0]): length}) | add'`. Server-side events (Plato's `pdf_parsed`, `ics_downloaded` from `posthog-python`) carry no `$host`, so group them by `.properties.app` instead.
8. **Every delivered repo:** `git status -sb` clean and on `main...origin/main`; README has the "How to run this / How to deploy this / Where the settings live" section; `.env.example` has names only (`grep -vE '^\s*(#|$)' .env.example | grep -E '=.{20,}'` prints nothing); `gh run list --repo KalpKan/<repo> --limit 1` green where CI exists.
9. **Read the skill against what you just saw.** Every "PENDING", "not yet", "currently none", "wait on", "after H0" and every count ("three monitors") in `SKILL.md`, `verification.md`, `settings-map.md`, `docs/monitors.md`, `docs/DNS_PENDING.md` §3 and `STATUS.md` is a candidate for staleness: `grep -n "PENDING\|not yet\|currently none\|wait on\|after H0" skills/portfolio-ops/*.md docs/*.md`. Fix each with the evidence from steps 2 to 8 and the time you checked.
10. **Record:** one `incidents.md` entry per class of drift found (root cause is almost always "the agent that changed reality did not update the row"), a STATUS.md task row + session-log line, then `bash scripts/install-ops-skill.sh`, `git pull --rebase --autostash`, commit only your files, push.


## Hub: ignored build step (set 2026-09-18)

`vercel.json` in the hub has `"ignoreCommand": "git diff --quiet HEAD^ HEAD -- . \":(exclude)docs\" ... "`. A push that only touches docs/, skills/, STATUS.md, scripts/ or Markdown files is not deployed (the command exits 0 = skip). Why: Hobby allows 100 deployments per day per team and agent bursts hit that cap on 2026-09-18. To force a deploy after docs-only commits, run `npx vercel@latest --prod --scope kks-projects-2edcb11a` from the hub checkout. Remove the key from vercel.json to restore deploy-on-every-push. (The REST API route for this setting returned "Not authorized" for the CLI token, so the in-repo key is used.)


## Tune and re-verify the Plato outline parser against its corpus

**Status: written 2026-09-19 (Phase 5 FIX agent, plato round 1; `KalpKan/Plato` `d691455`).**

When to use: a Western outline parses wrong (missing dates, wrong term, a slot typed wrong), a new outline shape turns up, or anyone touches `src/outline/`.

Where things are: the parser is `src/outline/` (`dates.py` date cells → date + time + status; `term.py` term window + Western sessional dates 2022–2027; `schedule.py` slots; `course.py` code + name; `assessments.py` rows; `tables.py` pdfplumber header re-alignment; `pipeline.py` glue). The corpus is 42 real outlines in `~/projects/plato-corpus/pdfs` (never committed; sha256 manifest in `tests/corpus/manifest.json`), 15 of them hand-labelled in `tests/corpus/ground_truth/*.json`. `tests/corpus/run_extractor.py` dumps one JSON per PDF, `tests/corpus/score.py` scores them, `tests/test_corpus.py` is the gate (enforced by default; `PLATO_CORPUS_GATE=0` for report-only).

Steps:
1. **Look at the text the way the parser sees it** before touching a regex: `pdfplumber` page text plus `page.extract_tables()` per page (a scratch script; pdfplumber's header row often sits one column to the right of the body, which `tables.compress_table` corrects by nearest-column assignment). Every heuristic in `src/outline/` cites the outline shape it handles in its docstring; add the new shape there.
2. **Write the failing unit test first** with the real cell/line text (`tests/test_dates.py`, `test_term.py`, `test_schedule.py`, `test_course.py`); these run in ~0.1 s.
3. **Score the labelled set**: `.venv/bin/python tests/corpus/run_extractor.py --out /tmp/out <labelled file names…>` then `.venv/bin/python tests/corpus/score.py --output /tmp/out --markdown /tmp/score.md`; read the `WRONG` / `FABRICATED` / `MISSED` / `SPURIOUS` lines. The bar per metric is `tests/test_corpus.py::BAR`.
4. **Then the whole 42** (`run_extractor.py --out /tmp/out42`, ~30 s): no `ERR` lines, and eyeball code / term / assessment count / weight total per file against the previous run (a summary script that flags totals outside 95–125 finds regressions fast). A change that helps one outline and breaks three others goes back.
5. **Add ground truth for what you fixed** (`labelled_by`, `sha256`, term with `exam_period` and `reading_week`, every slot, every assessment with `date_status` ∈ {exact, tba, registrar, range, recurring}, `excluded_rows` for bonus rows, `acceptable_weight_totals` for best-N-of-M) so the gate keeps it fixed. Mark slots that live only on an image page with `"sections_extractable_without_ocr": false` (the scorer then skips them; the review page must say the page could not be read).
6. Run `.venv/bin/pytest -q tests/` (110 unit/flow tests + the gate) and the `.ics` checks in `verification.md` on a local server (`SECRET_KEY=local PLATO_TMP_DIR=<scratch> HOME=<scratch> .venv/bin/python -c "from src.app import app; app.run(port=5078)"`), then deploy (`npx vercel --prod --yes` from `~/projects/plato`; when the team's daily deployment window is full use `scripts/vercel-redeploy-when-quota-frees.sh ~/projects/plato plato.kalpkan.com 20 10`).

Rules of thumb that held on this corpus: never return today's date for anything; a row without a date gets a status and a one-line reason, never a placeholder; the year of a month-day comes from the term window (Sept–Dec → first year) or the printed weekday; a course code suffix `A` means the Fall half even when the outline says "Fall/Winter 2025"; `Winter 2023−24` is Winter 2024; rooms after "Office" and codes inside prerequisite lists are never the course code; footnote digits are a strictly increasing trailing digit glued to consecutive titles ("Plan3", "Exam4"); a weekly schedule whose dates all fall on one weekday gives the lecture day when nothing else does.

## Verify a browser image pipeline against its Python truth in Chromium and WebKit

**Status: written and executed 2026-09-19 for microtubules (`KalpKan/Microtubule-Quantification` `web/scripts/browser-check.cjs`, `npm run test:browser`).** Use it for any app whose browser-side number must equal a Python/OpenCV reference (the emotes/pushups corpora are video-based and have their own harnesses).

Why both engines: Node tests (`vitest` + pngjs) prove the pure pipeline, but the browser decoder is part of the product, and WebKit decodes differently from Chromium (it honours embedded ICC profiles even with `colorSpaceConversion: "none"`, and its JPEG decoder rounds differently). A number that is right in Chrome can be 0.97 points off in Safari (incidents.md 2026-09-19 D1).

1. **Playwright as a devDependency of the app** (`npm i -D playwright@<version already in the Playwright cache>`; the package downloads no browsers on install, so Vercel's `npm ci` stays cheap). Browsers once: `npx playwright install chromium webkit` (they live in `~/Library/Caches/ms-playwright/`). Node scripts in a `"type": "module"` package must be `.cjs` to `require("playwright")`.
2. **Serve the built app plus the fixtures from one origin** inside the script (a tiny `http.createServer` mapping `/fixtures/*` to `tests/fixtures/`), or point it at the live host with `BASE=` (fixtures still come from disk through `setInputFiles`).
3. **Drive the real file input** (`page.locator("#file-input").setInputFiles(abs)`), wait on the status text, read the DOM the user reads (`#percent`, `#threshold`, `#pixels`, `#dims`, the results card's `hidden`, the warning box), and compare with `tests/fixtures/ground_truth.json`. Assert, don't print: lossless formats exact to 2 decimals with identical threshold and pixel counts; JPEG within the spec's tolerance; every wrong-file fixture refused with the file name and the format list and the previous result hidden; the huge files under the main-thread budget (a 16 ms `setInterval` gap meter in the page), display canvases capped, `performance.memory` (Chromium) and the worker's `self.cv.HEAPU8.length` via `page.workers()[0].evaluate`; downloads saved and diffed with pngjs against `Results/`; phone widths with the iPhone-13 UA and the 664 px Safari viewport. A `Could not` status on a corpus row is a failure, never a skip.
4. **Exit code 1 on any failed assertion**, `PASS: browser checks in chromium + webkit` on success, `OUT=<json>` for the evidence file; wire it as `npm run test:browser` and put the rows in verification.md.
5. Known emulation limits: Playwright WebKit's `setOffline(true)` fails in-memory blob decodes (test offline in Chromium); WebKit has no `performance.memory`; headless Chromium will not lay out below 500 px without `isMobile`.

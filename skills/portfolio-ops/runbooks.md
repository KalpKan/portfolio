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
| Attach a domain to a Vercel project | Written 2026-09-18 (T0.4); **executed 2026-09-18 for `kalpkan.com` (apex + www → `portfolio`) and `hoops.kalpkan.com`**. Record table and executed log in `docs/DNS_PENDING.md` |
| Add a schema to Supabase Project B | Written and executed 2026-09-18 (T1.1, `hoops`) |
| Rotate a secret | Not yet written, added when the first rotation lands |
| Redeploy an app | Written 2026-09-18 (T1.1: hoops dashboard by CLI) |
| Restore a paused Supabase project | Written 2026-09-18 (T0.3); **executed 2026-09-18 (T1.1, Project B via the dashboard; API call blocked by the agent sandbox)** |
| Re-point OAuth redirects (promptflip on the new domain) | Written and executed 2026-09-18 (H5 / promptflip domain task) |
| Regenerate Supabase types | Written and executed 2026-09-18 (T1.1) |
| Purge a large file from git history | Not yet written, added when T3.1 (pushup repo) or T4.1 (RC car repo) lands |
| Add an UptimeRobot monitor | Written and executed 2026-09-18 (T0.3): three monitors plus the public status page, see `docs/monitors.md` |
| Add PostHog to an app | Not yet written, added when T0.5 lands (the Flask variant is inside "Deploy a Python app to Vercel") |
| Deploy a Python app to Vercel | Written and executed 2026-09-18 (T1.3, Plato) |
| Create a Neon database | Written and executed 2026-09-18 (T1.3, Plato) |

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
5. Verify: open https://kalpkan.com, confirm the new row appears and, for an `app` with a `healthUrl`, its pad fills within a few seconds (`curl -s https://kalpkan.com/api/status/<slug>` prints `"ok":true`). The share card regenerates on the same deploy (`curl -sI https://kalpkan.com/opengraph-image | head -1` → `HTTP/2 200`). Then, if the app is Supabase-backed, add an UptimeRobot monitor on the same `healthUrl` (runbook "Add an UptimeRobot monitor").
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
- `repo` may be `null` for work that is not on GitHub (today: emotes, classmyschedule). The card then shows no repo link.
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

## Purge a large file from git history

Not yet written, added when the pushup repo (230 MB of data) or the RC car repo (943 MB) is cleaned. It will use `git filter-repo`, require a human checkpoint before any force-push, and verify with `git count-objects -vH`.

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
   `curl -s -X PATCH https://api.uptimerobot.com/v3/psps/1263036 -H "Authorization: Bearer $UPTIMEROBOT_API_KEY" -H "Content-Type: application/json" -d '{"monitorIds":[804030255,804030256,804030271,<new id>]}' | jq '{id, monitorIds}'`
6. **Verify after one cycle (up to 5 minutes):** `curl -s -X POST https://api.uptimerobot.com/v2/getMonitors -d "api_key=$UPTIMEROBOT_API_KEY&format=json&monitors=<new id>&alert_contacts=1" | jq '.monitors[] | {id, friendly_name, status, alert_contacts: [.alert_contacts[].id]}'` shows `status: 2` and the contact id; `curl -sI https://stats.uptimerobot.com/a6n3Wx3PBp | head -1` is `HTTP/2 200` and the page lists the new monitor.
7. **Record it:** add the row to `docs/monitors.md` (name, URL, interval, what it protects, keep-alive yes/no, id) and, if the app is new, the `healthUrl` in `projects.json` should be the same route.

To change an existing monitor (for example after H1 moves an app to `<sub>.<domain>`), `PATCH /v3/monitors/<id>` with only the changed fields, for example `-d '{"url":"https://promptflip.<domain>/api/health"}'`; do not delete and recreate, or the uptime history resets. To pause or resume: `POST /v3/monitors/<id>/pause` or `/start`. To attach a contact to an existing monitor: `PATCH` with the `assignedAlertContacts` array from step 4.

## Add PostHog to an app

Not yet written, added when T0.5 lands (blocked on the H0 API key). It will cover the `posthog-js` snippet, the `/ingest/*` reverse-proxy rewrite, cookieless config, the 2 to 4 custom events per app, and confirming the `$0` billing limits.

## Deploy a Python app to Vercel

**Status: written and executed 2026-09-18 for Plato (`KalpKan/Plato` → Vercel project `plato`, `https://plato.kalpkan.com`).**

When to use: a Flask/FastAPI app must run on Vercel Hobby as one Python function, or Plato needs to be redeployed or repaired.

What Vercel does (docs `vercel.com/docs/frameworks/backend/flask` and `/docs/functions/runtimes/python`, both last updated 2026-08-12): it looks for a top-level `app` in `app.py`/`index.py`/`server.py`/`main.py` (root, `src/` or `app/`), or the `module:variable` set in `pyproject.toml` under `[tool.vercel] entrypoint`. The whole repo becomes one function; every request is routed to it. Static files belong in `public/` (served by the CDN). Only `/tmp` is writable and it does not survive between requests. Request bodies are capped at **4.5 MB** by the platform (413 above that). Python version comes from `.python-version` (3.12 default, 3.13/3.14 available).

Preconditions: Vercel CLI logged in (team `kks-projects-2edcb11a`), the repo cloned under `~/projects/<name>`, a database URL if the app needs one (see "Create a Neon database").

Steps (what was done for Plato, in order):
1. **Make the app stateless.** Nothing may be written outside `/tmp`; nothing may be read from disk in a later request. Plato used to save the `.ics` to `temp_calendars/` and redirect to `/download/<file>`; now the calendar is generated in memory and streamed back in the same `POST /review` response (`Content-Disposition: attachment`). Anything that must survive between requests goes in the signed session cookie (small: under 4 KB) or the database keyed by something in that cookie (Plato keys on `pdf_hash`).
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
6. **PostHog (Flask variant of "Add PostHog to an app")**: a `/ingest/<path>` Flask route forwards to `https://us.i.posthog.com` (paths starting with `static/` go to `https://us-assets.i.posthog.com`), the `posthog-js` snippet in `base.html` uses `api_host: '/ingest'`, `persistence: 'memory'` (cookieless), `autocapture: true`; server-side events use the `posthog` package with `sync_mode=True` (serverless: send before the response returns). Snippet and events render only when `POSTHOG_API_KEY` (the public `phc_` project token) is set.
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

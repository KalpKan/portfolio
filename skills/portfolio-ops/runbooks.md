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
| Attach a domain to a Vercel project | Written 2026-09-18 (T0.4); not yet executed, waits on H1. Record table in `docs/DNS_PENDING.md` |
| Add a schema to Supabase Project B | Not yet written, added when T1.1 lands |
| Rotate a secret | Not yet written, added when the first rotation lands |
| Redeploy an app | Not yet written, added when T0.1 lands |
| Restore a paused Supabase project | Not yet written, added when T0.3 lands |
| Re-point OAuth redirects (promptflip on the new domain) | Not yet written, added when the post-H1 domain task lands |
| Regenerate Supabase types | Not yet written, added when T1.1 lands |
| Purge a large file from git history | Not yet written, added when T3.1 (pushup repo) or T4.1 (RC car repo) lands |
| Add an UptimeRobot monitor | Not yet written, added when T0.3 lands |
| Add PostHog to an app | Not yet written, added when T0.5 lands |

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
   For a project that is shown as a case-study page rather than a deployment (UnPark, RC car, iOS apps, the Chrome extension), use `"type": "showcase"` and omit `url` and `healthUrl`; the card then links to `/projects/<slug>` on the hub.
   - `status` is one of `live`, `demo`, `coming`, `archived`.
   - `healthUrl` must be a route that returns 200 when the app is healthy. The hub polls it client-side for the green dot and the same URL is given to UptimeRobot.
   - `hero` is a path under `/public/images/` (WebP, 300 KB or less) or `null`.
3. Validate locally; the loader in `lib/projects.ts` uses a zod schema and the test suite rejects an `app` entry without a `url`:
   ```bash
   npm test
   ```
4. Commit and push; Vercel's Git integration deploys `main` automatically:
   ```bash
   git add projects.json && git commit -m "feat(registry): add <slug>" && git push
   ```
5. Verify: open the hub URL, confirm the new card appears and, for an `app`, its dot turns green within a few seconds. Then, if the app is Supabase-backed, add an UptimeRobot monitor on the same `healthUrl` (runbook "Add an UptimeRobot monitor").
6. Add the new host to the system map table in `SKILL.md` and, if it has env vars, their names to `settings-map.md`.

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

Never delete `promptflip-35qv` (it is the live promptflip, see incident 2026-09-18 in `incidents.md`), `promptflip` (until Kalp resolves H5) or `v0-basketball-analytics-dashboard`.

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

**Status: not yet executed. Written 2026-09-18 (T0.4); waits on H1 (domain purchase).** Full record table, verified source URLs and the copy-paste command block live in `docs/DNS_PENDING.md`; this runbook is the procedure and the checks.

When to use: a new project needs `<sub>.<domain>`, or a subdomain stopped resolving and you need to rebuild the record.

Preconditions:
- The Vercel project exists and has a production deployment (`npx vercel project ls --scope kks-projects-2edcb11a`). For promptflip, H5 (STATUS.md) must be resolved first: attach to `promptflip-35qv` if Kalp said "keep 35qv", or to `promptflip` only once its build is fixed.
- `CLOUDFLARE_API_TOKEN` is in the shell (H0 item 4, "Edit zone DNS" template). Never commit it; never paste it into STATUS.md.
- The domain's zone is on Cloudflare (Registrar purchases are, automatically).

Steps:
1. Tell Vercel about the host first: `npx vercel domains add <sub>.<domain> <project> --scope kks-projects-2edcb11a` (apex: `npx vercel domains add <domain> portfolio` and also `www.<domain>`).
2. Ask Vercel which record it wants: `npx vercel domains inspect <sub>.<domain> --scope kks-projects-2edcb11a`. Use the value it prints. General-purpose values if it prints them: apex `A 76.76.21.21`, subdomain `CNAME cname.vercel-dns-0.com` (Vercel docs, 2026-08/09; the older `cname.vercel-dns.com` in the Phase 0 plan is superseded).
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

Not yet written, added when T1.1 lands. Rule it will implement: every new Supabase-backed app is a schema in Project B, never a new project (see `architecture.md`, "Databases").

## Rotate a secret

Not yet written, added when the first rotation lands. Shape it will take: find the variable in `settings-map.md`, generate the new value, set it in the owning dashboard (`npx vercel env add <NAME> production` for Vercel), redeploy, verify the health route, then note the rotation date in `settings-map.md`.

## Redeploy an app

Not yet written, added when T0.1 lands. (`npx vercel --prod --yes` from the app's linked directory, or `npx vercel redeploy <deployment-url>` for an existing build.)

## Restore a paused Supabase project

Not yet written, added when T0.3 lands. It will cover the dashboard restore click, confirming the health route returns `db: ok` again, checking why the UptimeRobot ping did not keep it alive, and appending an `incidents.md` entry.

## Re-point OAuth redirects (promptflip on the new domain)

Not yet written, added when the post-H1 domain task lands. It covers Supabase Auth URL configuration (Site URL and Redirect URLs) and the Google Cloud console OAuth client (human checkpoint H2 if it cannot be done via API or the browser tools).

## Regenerate Supabase types

Not yet written, added when T1.1 lands. (`supabase gen types typescript --project-id <ref> --schema <app> > src/types/database.ts`.)

## Purge a large file from git history

Not yet written, added when the pushup repo (230 MB of data) or the RC car repo (943 MB) is cleaned. It will use `git filter-repo`, require a human checkpoint before any force-push, and verify with `git count-objects -vH`.

## Add an UptimeRobot monitor

Not yet written, added when T0.3 lands (blocked on the H0 API key).

## Add PostHog to an app

Not yet written, added when T0.5 lands (blocked on the H0 API key). It will cover the `posthog-js` snippet, the `/ingest/*` reverse-proxy rewrite, cookieless config, the 2 to 4 custom events per app, and confirming the `$0` billing limits.

# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the portfolio hub on Vercel Hobby, the living ops skill, the cleanup of dead deployments, and the DNS plan, so every later phase has a home.

**Architecture:** One public GitHub repo `KalpKan/portfolio` (local `~/projects/portfolio`) holds the Next.js hub, `projects.json` registry, `STATUS.md`, `docs/hosting-plan.md`, and `skills/portfolio-ops/`. Hub deploys to Vercel Hobby under team "Kk's projects". Every other project keeps its own repo and gets a subdomain later.

**Tech Stack:** Next.js (latest stable, App Router, TypeScript, Tailwind), npm, Vercel CLI (`npx vercel`, already authenticated), `gh` CLI (authenticated as KalpKan), Vitest for unit tests, Playwright not required in Phase 0.

**Spec:** `docs/hosting-plan.md` (sections 6, 7, 10 and the Appendix).

## Global Constraints

- Spend: $0. Never upgrade any plan. Never attach a card.
- Non-commercial: no payments, ads, affiliate links.
- No secrets in git. `.env.example` with names only.
- Every repo gets a README section "How to run this / How to deploy this / Where the settings live" for a non-developer.
- Every task updates `skills/portfolio-ops/` (runbook, settings entry, or incident) and `STATUS.md`.
- Commit messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- Workers push to `main` of `KalpKan/portfolio` directly for Phase 0 (single-writer per file set; tasks below touch disjoint paths).

---

### Task T0.0: Living ops skill scaffold

**Files:**
- Create: `skills/portfolio-ops/SKILL.md`
- Create: `skills/portfolio-ops/architecture.md`
- Create: `skills/portfolio-ops/runbooks.md`
- Create: `skills/portfolio-ops/incidents.md`
- Create: `skills/portfolio-ops/verification.md`
- Create: `skills/portfolio-ops/settings-map.md`
- Create: `scripts/install-ops-skill.sh` (copies the skill dir to `~/.claude/skills/portfolio-ops/`)

**Interfaces:**
- Produces: the six files above; every later task appends to `runbooks.md`, `settings-map.md`, `incidents.md`, `verification.md`.

- [x] **Step 1:** Invoke `superpowers:writing-skills` and read its format rules.
- [x] **Step 2:** Write `SKILL.md` with frontmatter `name: portfolio-ops`, a `description` that includes trigger phrases: "portfolio is down", "add a project to the portfolio", "Supabase paused", "deploy failed", "subdomain not resolving", "analytics missing". Body: (a) purpose, (b) 1-page system map table (subdomain → host → repo → DB → where env lives) seeded from `docs/hosting-plan.md` §6 with "PENDING" for anything not yet live, (c) "First 5 checks" triage list (UptimeRobot status page, `/api/health` of the failing app, Vercel deployment logs, Supabase project status, Cloudflare DNS record), (d) links to the other five files.
- [x] **Step 3:** Write `architecture.md` from `docs/hosting-plan.md` §3 and §6 (layers, two Supabase projects and schema-per-app rule, DNS map, analytics wiring, keep-alive). Include the *reasons* for each choice so no agent "fixes" a deliberate decision.
- [x] **Step 4:** Write `runbooks.md` with headings only for now plus the two runbooks that exist today: "Deploy the hub to Vercel" and "Add a project to `projects.json`". Other headings (add schema to Project B, rotate a secret, attach a domain, restore paused Supabase project, re-point OAuth redirects, regenerate Supabase types, purge a large file from git history) get the line "Not yet written — added when the task lands".
- [x] **Step 5:** Write `incidents.md` with the entry template (Date / Symptom / What was tried / Root cause / Fix / Prevention) and an "Append only. Never delete." banner.
- [x] **Step 6:** Write `verification.md` with the commands from `docs/hosting-plan.md` §10, marked PENDING where the target doesn't exist yet.
- [x] **Step 7:** Write `settings-map.md` as a table: variable name | which app | where it lives (dashboard) | what breaks without it. Seed with promptflip's six vars (names only, from `docs/hosting-plan.md` §1).
- [x] **Step 8:** Write `scripts/install-ops-skill.sh` (`rsync -a --delete skills/portfolio-ops/ ~/.claude/skills/portfolio-ops/`) and run it.
- [x] **Step 9:** Verify: `ls ~/.claude/skills/portfolio-ops/` shows six files; `head -5 ~/.claude/skills/portfolio-ops/SKILL.md` shows the frontmatter.
- [x] **Step 10:** Commit and push: `git add skills scripts && git commit -m "feat(ops): scaffold portfolio-ops living skill" && git push`.

---

### Task T0.1: Hub Next.js skeleton + registry + health + deploy

**Files:**
- Create: Next.js app at repo root (`app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind` config)
- Create: `projects.json` (repo root)
- Create: `app/api/health/route.ts`
- Create: `lib/projects.ts` (typed loader for `projects.json`)
- Create: `lib/projects.test.ts`
- Create: `app/page.tsx` (renders project cards from the registry)
- Create: `README.md`
- Create: `.env.example` (empty except comments; hub needs no secrets in Phase 0)
- Create: `.github/workflows/ci.yml` (npm ci, lint, test, build)
- Modify: `skills/portfolio-ops/settings-map.md`, `runbooks.md` (append)
- Modify: `STATUS.md` (task row → done, URL)

**Interfaces:**
- Produces: `projects.json` schema:
  ```json
  {
    "projects": [
      {
        "slug": "promptflip",
        "name": "promptflip",
        "tagline": "Two prompts walk in, one gets answered.",
        "type": "app",            // "app" | "showcase"
        "status": "live",         // "live" | "demo" | "coming" | "archived"
        "url": "https://promptflip-35qv.vercel.app",
        "repo": "https://github.com/KalpKan/promptflip",
        "healthUrl": "https://promptflip-35qv.vercel.app/api/health",
        "tags": ["Next.js", "Supabase"],
        "hero": "/images/promptflip.png"
      }
    ]
  }
  ```
  `type: "showcase"` entries omit `url`/`healthUrl` and are linked to `/projects/<slug>` (pages built in Phase 4).
- Produces: `GET /api/health` → `{ "ok": true, "service": "hub", "time": "<ISO>" }` with `Cache-Control: no-store`.
- Produces: `loadProjects(): Project[]` in `lib/projects.ts`, validated with zod; throws on invalid registry.
- **As shipped (2026-09-18, after the hub polish batch):** the schema above is the interface; the exact zod rules (kebab-case unique slugs, `url` required unless `status` is `coming`, showcases must omit `url`/`healthUrl`, `repo` nullable) live in `lib/projects.ts`, and how each row renders is derived there too by `rowFor()` -> `kind` (`live` | `archived` | `coming` | `showcase` | `showcase-soon`). The runbook "Add a project to `projects.json`" in `skills/portfolio-ops/runbooks.md` has the schema section and the 200-unauthenticated rule for an `app` `url`. `hero` is still `null` for every entry.

- [x] **Step 1:** In `~/projects/portfolio`, run `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --yes` (it will complain the dir is non-empty; if so, scaffold in a temp dir and move files in, keeping existing `STATUS.md`, `docs/`, `skills/`, `.gitignore` entries merged).
- [x] **Step 2:** Add `zod` and `vitest`: `npm i zod && npm i -D vitest @vitejs/plugin-react jsdom`. Add `"test": "vitest run"` script and `vitest.config.ts`.
- [x] **Step 3:** Write failing test `lib/projects.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { parseProjects } from "./projects";
  describe("parseProjects", () => {
    it("accepts a valid registry", () => {
      const r = parseProjects({ projects: [{ slug: "a", name: "A", tagline: "t", type: "app", status: "live", url: "https://a.example", repo: "https://github.com/x/a", tags: [] }] });
      expect(r[0].slug).toBe("a");
    });
    it("rejects an app without url", () => {
      expect(() => parseProjects({ projects: [{ slug: "a", name: "A", tagline: "t", type: "app", status: "live", repo: "https://github.com/x/a", tags: [] }] })).toThrow();
    });
    it("accepts a showcase without url", () => {
      const r = parseProjects({ projects: [{ slug: "b", name: "B", tagline: "t", type: "showcase", status: "coming", repo: "https://github.com/x/b", tags: [] }] });
      expect(r[0].type).toBe("showcase");
    });
  });
  ```
- [x] **Step 4:** Run `npm test` → expect FAIL (module not found).
- [x] **Step 5:** Implement `lib/projects.ts` with a zod discriminated union on `type`, export `parseProjects(raw: unknown): Project[]` and `loadProjects()` that imports `../projects.json`.
- [x] **Step 6:** Run `npm test` → PASS.
- [x] **Step 7:** Write `projects.json` seeded with all entries from `docs/hosting-plan.md` §1: promptflip (live), basketball (`coming`, url = existing vercel URL), plato (coming), plantit (coming), pushups (coming), emotes (coming), microtubules (coming), and showcases: unpark (name "UnPark — Parkinson's freeze detection", codename Antifreeze), rc-car, outline, flashcards, classmyschedule. Hero images may be `null` for now.
- [x] **Step 8:** Implement `app/api/health/route.ts` returning the JSON above with `no-store`.
- [x] **Step 9:** Implement `app/page.tsx`: hero with Kalp's name and one line ("Projects I've built — click any card"), a grid of cards from `loadProjects()`; cards show name, tagline, tags, status badge; `app` cards link to `url`, `showcase` cards link to `/projects/<slug>` (create a minimal `app/projects/[slug]/page.tsx` that renders name + "Case study coming soon" for now). Invoke `impeccable:impeccable` for the design pass: distinctive but restrained, dark-mode correct, phone-first, 16px gutters, no horizontal scroll. Client-side health badge: fetch `healthUrl` with a 3 s timeout and show green/grey dot; failures silent.
- [x] **Step 10:** `npm run build` → success; `npm run lint` → clean.
- [x] **Step 11:** Write `README.md` with: what this repo is, the plain-English section "How to run this / How to deploy this / Where the settings live", how to add a project (edit `projects.json`, push), and links to `STATUS.md` and `docs/hosting-plan.md`.
- [x] **Step 12:** Write `.github/workflows/ci.yml`: on push/PR, Node 22, `npm ci`, `npm run lint`, `npm test`, `npm run build`.
- [x] **Step 13:** Deploy: `npx vercel link --yes --project portfolio` (team `kks-projects-2edcb11a`), then `npx vercel --prod --yes`. Capture the production URL. Do NOT add any custom domain yet. Use the `vercel:deploy` and `vercel:verification` skills.
- [x] **Step 14:** Verify: `curl -sf <prod-url>/api/health` returns `ok: true`; `curl -sI <prod-url>` is 200. Run Lighthouse via `npx lighthouse <prod-url> --only-categories=performance --quiet --chrome-flags="--headless" --output=json | jq .categories.performance.score` ≥ 0.9.
- [x] **Step 15:** Append to `skills/portfolio-ops/runbooks.md` ("Deploy the hub", "Add a project") with the exact commands; append hub row to `settings-map.md` (no vars yet) and the system-map row in `SKILL.md`; update `STATUS.md` T0.1 row → done with URL.
- [x] **Step 16:** Commit and push.

---

### Task T0.2: Cleanup of superseded deployments and repos

**Files:**
- Modify: `STATUS.md`, `skills/portfolio-ops/incidents.md` (if anything surprising), `skills/portfolio-ops/runbooks.md` ("Archive a repo", "Delete a Vercel project")

**Interfaces:** none.

- [x] **Step 1:** `npx vercel project ls` and confirm `tokengamblecoinflip` and `promptflip-35qv` exist. **Before deleting `promptflip-35qv`**, check which project the domain-less production traffic uses: `npx vercel inspect https://promptflip-35qv.vercel.app` and `npx vercel inspect https://promptflip-kks-projects-2edcb11a.vercel.app`. `~/projects/promptflip/.vercel/project.json` links to `promptflip` (prj_rSr9QbGDbB2FLOeAAilYmqO5DKL1). If `promptflip-35qv` has the newer deployment or env vars that `promptflip` lacks, STOP, record in STATUS.md under "Needs Kalp / H5", and skip its deletion. Otherwise proceed.
- [x] **Step 2:** `npx vercel project rm tokengamblecoinflip --yes`. `npx vercel project rm promptflip-35qv --yes` (only if Step 1 cleared it).
- [x] **Step 3:** `gh repo archive KalpKan/token-gamble-coinflip --yes` and `gh repo archive KalpKan/token-coinflip --yes`.
- [x] **Step 4:** Verify: `npx vercel project ls` no longer lists the removed projects; `gh repo view KalpKan/token-gamble-coinflip --json isArchived` → true (same for token-coinflip). `curl -sI https://tokengamblecoinflip.vercel.app` → 404.
- [x] **Step 5:** Append runbooks "Delete a Vercel project" and "Archive a GitHub repo" with the exact commands; update `STATUS.md` T0.2 → done.
- [x] **Step 6:** Commit and push.

---

### Task T0.4: DNS plan file

**Files:**
- Create: `docs/DNS_PENDING.md`
- Modify: `skills/portfolio-ops/runbooks.md` ("Attach a domain to a Vercel project" — written now, marked "not yet executed")

**Interfaces:** consumed by the post-H1 domain task.

- [x] **Step 1:** Write `docs/DNS_PENDING.md`: a table of every record from `docs/hosting-plan.md` §6 "DNS & subdomain map" with columns Host | Type | Target | Proxy (must be DNS-only / grey cloud) | Vercel project | Status (pending). Vercel targets: apex `A 76.76.21.21`, subdomains `CNAME cname.vercel-dns.com`. Include `www` → CNAME to apex handled by Vercel redirect.
- [x] **Step 2:** Add the exact CLI sequence to run after H1: `npx vercel domains add <domain> portfolio`, `npx vercel domains add <sub>.<domain> <project>` per row, and the Cloudflare API `curl` (using `$CLOUDFLARE_API_TOKEN`) to create each record. Note promptflip needs `NEXT_PUBLIC_APP_URL` and Supabase Auth redirect URLs updated afterwards (link to runbook).
- [x] **Step 3:** Append the runbook "Attach a domain" to `skills/portfolio-ops/runbooks.md`.
- [x] **Step 4:** Update `STATUS.md` T0.4 → done (waiting on H1 for execution). Commit and push.

---

### Tasks T0.3 (UptimeRobot) and T0.5 (PostHog)

H0 keys arrived 2026-09-18; T0.3 executed the same day (see below). T0.5 follows T0.1.

---

### Task T0.3: UptimeRobot keep-alive monitors and status page

**Files:**
- Create: `docs/monitors.md` (table of every monitor: name, URL, interval, what it protects, UptimeRobot monitor id)
- Modify: `skills/portfolio-ops/runbooks.md` (replace the "Keep-alive / restore paused Supabase project" stub with a real runbook), `settings-map.md` (UPTIMEROBOT_API_KEY row), `verification.md` (uptime section), `SKILL.md` (First-5-checks item 1 gets the real status-page URL)
- Modify: `STATUS.md` (T0.3 row; spend stays $0)

**Credentials:** `UPTIMEROBOT_API_KEY` in `~/.config/portfolio-ops/secrets.env` (load with `set -a; source ~/.config/portfolio-ops/secrets.env; set +a`). Never print it, never write it to the repo.

**Interfaces:**
- Produces: a public status page URL (`https://stats.uptimerobot.com/<id>`) recorded in `docs/monitors.md`; consumed by the hub footer later.

- [x] **Step 1:** Read UptimeRobot API v2 docs for `newMonitor`, `getMonitors`, `newPSP`, `getAlertContacts` (https://uptimerobot.com/api/). Free plan: 50 monitors, 5-minute minimum interval (verified 2026-09-18).
- [x] **Step 2:** Create HTTP(s) monitors (type 1, interval 300) for: `https://promptflip-35qv.vercel.app/api/health` (name "promptflip health (DB)"), `https://v0-basketball-analytics-dashboard-kks-projects-2edcb11a.vercel.app/` (name "hoops dashboard"), and the hub production URL from STATUS.md T0.1 row + `/api/health` (name "hub health"). If T0.1's URL is not in STATUS.md yet, `git pull` and poll for up to 10 minutes; if still absent, create the other two and leave a clearly marked TODO row for the hub in `docs/monitors.md` with the exact curl to add it.
- [x] **Step 3:** Verify with `getMonitors` that each is status 2 (up) after one cycle; capture ids.
- [x] **Step 4:** Create a public status page (`newPSP`) named "Kalp's projects" containing all monitors; record its URL.
- [x] **Step 5:** Attach the account's default alert contact (from `getAlertContacts`) to each monitor so Kalp gets downtime emails.
- [x] **Step 6:** Write `docs/monitors.md`; append/replace runbooks: "Add an uptime monitor" (exact curl with `$UPTIMEROBOT_API_KEY`) and "Restore a paused Supabase project" (Supabase dashboard → project → Restore; confirm health route; check the monitor was actually hitting a DB-touching route). Update settings-map, verification, SKILL.md check #1.
- [x] **Step 7:** Verify: `curl -s <status page url> | head -c 300` shows the page; `docs/monitors.md` lists ≥ 2 monitors with ids. Update STATUS.md. Commit and push only your files (`git pull --rebase --autostash` first).

---

### Task T0.5: PostHog analytics (project, guardrails, hub snippet, dashboards)

**Files:**
- Modify (hub): `app/layout.tsx` (PostHog provider), `next.config.ts` (reverse-proxy rewrites `/ingest/*`), `lib/posthog.ts` (client init, cookieless), `.env.example` (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`), `README.md` (Where the settings live: PostHog)
- Create: `docs/analytics.md` (project id, dashboard URLs, custom-event naming convention, how each future app adds the snippet)
- Modify: `skills/portfolio-ops/runbooks.md` ("Add PostHog to an app", "Rotate the PostHog key"), `settings-map.md`, `verification.md`, `SKILL.md`
- Modify: `STATUS.md`

**Credentials:** `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_HOST` in `~/.config/portfolio-ops/secrets.env`. This is an ALL-ACCESS personal key: use it only for the API calls below, never print it, never commit it. The **project API key** (`phc_...`) is public by design and goes in `NEXT_PUBLIC_POSTHOG_KEY` on Vercel, but still not in git.

**Interfaces:**
- Produces: `posthog` client exported from `lib/posthog.ts`, `capture(event: string, props?: Record<string, unknown>)` helper; event names are snake_case verbs (`project_card_clicked`); `docs/analytics.md` is the contract every later app follows.

- [ ] **Step 1:** Via the PostHog API (https://posthog.com/docs/api) list organizations/projects; create (or reuse if one exists) a project named "Kalp portfolio" in the US cloud. Record project id and the `phc_` project token in `docs/analytics.md`.
- [ ] **Step 2:** Set billing limits to $0 for every product that supports a limit (product analytics, session replay, feature flags, data warehouse, surveys) via the billing API or, if the API cannot, via the claude-in-chrome skill in the PostHog dashboard (Organization → Billing). Screenshot to `docs/images/posthog-billing-limits.png`. Confirm no credit card is attached.
- [ ] **Step 3:** Read https://posthog.com/docs/libraries/next-js and https://posthog.com/docs/advanced/proxy/nextjs. In the hub: `npm i posthog-js`; add `rewrites()` in `next.config.ts` for `/ingest/static/:path*` → `https://us-assets.i.posthog.com/static/:path*`, `/ingest/:path*` → `https://us.i.posthog.com/:path*` (plus `skipTrailingSlashRedirect: true`); `lib/posthog.ts` initialising with `api_host: '/ingest'`, `ui_host: 'https://us.posthog.com'`, `persistence: 'memory'` (cookieless), `capture_pageview: true`, `autocapture: true`, session recording on with default input masking. Wrap the app in a client provider in `app/layout.tsx`. Fire `project_card_clicked` with `{ slug, type }` from the project card component.
- [ ] **Step 4:** Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST=/ingest` on the Vercel `portfolio` project (production + preview) non-interactively: `printf '%s' "$VALUE" | npx vercel env add NAME production`. Redeploy `npx vercel --prod --yes`.
- [ ] **Step 5:** Enable heatmaps and session replay in project settings via API. Create three saved insights on one dashboard via API: "Visitors by site" (unique users by `$host`), "Visitors by country" (world map by `$geoip_country_name`), "Top demos by usage" (events `project_card_clicked` and the reserved names rep_counted, emote_fired, pdf_parsed, plant_identified, coinflip_played, broken down by event). Record URLs in `docs/analytics.md`.
- [ ] **Step 6:** Verify end-to-end: open the deployed hub with the claude-in-chrome skill, click a project card, then query the events API for `$pageview` and `project_card_clicked` in the last 10 minutes with `$host` = the hub host; paste a JSON excerpt (no keys) into `docs/analytics.md` "Verified" section. Confirm in the Network tab that requests go to `/ingest/` on the hub's own origin.
- [ ] **Step 7:** Write `docs/analytics.md` including "How to add PostHog to a new app" and the naming convention. Update runbooks, settings-map (both PostHog var names, the operator key's location, and the rotation note: "the phx_ key is all-access; rotate to a project-scoped key after Phase 1"), verification, SKILL.md.
- [ ] **Step 8:** `npm test && npm run build`, update STATUS.md (T0.5 row, spend still $0), commit, push (only your files; `git pull --rebase --autostash` first).

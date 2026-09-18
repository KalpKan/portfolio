# portfolio

The hub for every project Kalp Kansara has shipped. One page, one URL, one
card per project. Live web apps link out to their own deployment; hardware and
iOS work gets a case-study page here.

- **Live site:** see the `T0.1` row in [STATUS.md](STATUS.md) for the current URL.
- **Plan and reasoning:** [docs/hosting-plan.md](docs/hosting-plan.md)
- **Dashboard of what is done and what needs Kalp:** [STATUS.md](STATUS.md)
- **Ops skill (runbooks, settings, incidents):** [skills/portfolio-ops/](skills/portfolio-ops/)

## What is in here

| Path | What it is |
|---|---|
| `projects.json` | The registry. Every card on the site comes from this file. |
| `lib/projects.ts` | Reads and validates `projects.json` (it refuses to build if an entry is malformed). |
| `app/page.tsx`, `components/` | The home page: hero, the site map and project list, footer. |
| `app/api/health/route.ts` | `GET /api/health` returns `{ ok: true, service: "hub", time }`. Uptime monitors ping this. |
| `app/api/status/[slug]/route.ts` | Checks one project's own health URL (3 s timeout) so the page can show a live/no-signal mark. |
| `app/projects/[slug]/page.tsx` | Placeholder case-study page for showcase projects (real pages come in Phase 4). |
| `docs/` | Hosting plan and phase plans. |
| `skills/portfolio-ops/` | The living ops skill: runbooks, settings map, incidents, verification commands. |
| `.github/workflows/ci.yml` | On every push: install, lint, test, build. |

## How to run this / How to deploy this / Where the settings live

Written for Kalp, who does not need to know Next.js to keep this running.

### How to run this on your Mac

1. Open Terminal and go to the folder: `cd ~/projects/portfolio`
2. First time only, install the dependencies: `npm install`
3. Start it: `npm run dev`
4. Open http://localhost:3000 in your browser. Edits to files show up as you save.
5. Stop it with `Ctrl+C` in the Terminal.

Other commands you may be asked to run:

- `npm test` runs the checks on `projects.json` and the loader.
- `npm run lint` looks for code mistakes.
- `npm run build` makes the production version (this is what Vercel runs).

### How to deploy this

You normally do nothing. Pushing to the `main` branch on GitHub
(`KalpKan/portfolio`) makes Vercel build and publish the site automatically
within about a minute. To check what happened, open https://vercel.com, pick
the team "Kk's projects", then the project `portfolio`, and look at
"Deployments".

To deploy by hand from the Terminal (for example if the GitHub link is broken):

```
cd ~/projects/portfolio
npx vercel --prod --yes
```

It prints the production URL at the end. The full runbook, with what to do when
it fails, is in `skills/portfolio-ops/runbooks.md` under "Deploy the hub to Vercel".

### Where the settings live

- **The list of projects** is `projects.json` in this folder. That is the only
  content file. See "How to add a project" below.
- **Environment variables (secrets):** the hub has none right now. When it gets
  some (analytics keys, for example) their *names* are listed in `.env.example`
  and their *values* live on Vercel: project `portfolio` -> Settings ->
  Environment Variables. Never paste a real value into any file in this repo.
- **The domain:** not bought yet. When it is, the plan for every DNS record is
  in `docs/DNS_PENDING.md`.
- **Hosting plan (Vercel Hobby, free):** `docs/hosting-plan.md`. The plan is to
  spend $0 on hosting. Do not upgrade the Vercel plan; nothing here needs it.
- **Which variable belongs to which app:** `skills/portfolio-ops/settings-map.md`.

## How to add a project

1. Open `projects.json`.
2. Copy an existing entry and change the fields:
   - `slug`: short, lowercase, hyphens only. Used in the URL for case-study pages.
   - `name`, `tagline`: what shows on the card.
   - `type`: `"app"` (it is deployed somewhere and has a `url`) or `"showcase"`
     (hardware or iOS work; it gets a page on this site instead).
   - `status`: `"live"`, `"demo"`, `"coming"`, or `"archived"`.
   - `url`: the deployed address. Required unless the status is `"coming"`.
   - `repo`: the GitHub link, or `null` if the code is not on GitHub.
   - `healthUrl`: the app's `/api/health` address, or `null`. When set, the card
     shows a live-signal mark and UptimeRobot can monitor it.
   - `tags`: a few words about the stack.
   - `hero`: leave `null` for now.
3. Run `npm test`. If the entry is malformed it tells you which field.
4. Commit and push. Vercel redeploys on its own.

The step-by-step version is in `skills/portfolio-ops/runbooks.md` under
"Add a project to projects.json".

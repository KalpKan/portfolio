# portfolio

The hub for every project Kalp Kansara has shipped. One page, one URL, one
card per project. Live web apps link out to their own deployment; hardware and
iOS work gets a case-study page here.

- **Live site:** https://kalpkan.com
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
| `app/api/status/[slug]/route.ts` | Checks one project's own health URL (3 s timeout, `lib/health.ts`) so the page can show a live mark. |
| `app/opengraph-image.tsx` | The picture shown when the link is shared (iMessage, LinkedIn, Slack): the array plus the name, generated from `projects.json` at build time. |
| `lib/site.ts` | Your name, the site URL and the contact links (email / GitHub / LinkedIn). Empty contact values show nothing. |
| `app/projects/[slug]/page.tsx` | The case-study page for a showcase project (`/projects/unpark` and so on). Shows the full page once the registry says `live`; a short "coming" page before that. |
| `content/projects/<slug>.ts` | The words and pictures of one case study (see "How to add a case study"). `content/case-study.ts` is the shape every file follows. |
| `components/showcase/` | The case-study template: hero, problem, how-it-works diagram, photos, app screens, video, tech, status. |
| `public/images/projects/<slug>/` | Case-study images, WebP only, 300 KB or less each (a test enforces it). Videos are never put here. |
| `scripts/media-to-webp.mjs`, `scripts/video-poster.py` | Turn a photo (or one frame of a video) into a WebP that fits the rule above. |
| `docs/` | Hosting plan and phase plans. |
| `skills/portfolio-ops/` | The living ops skill: runbooks, settings map, incidents, verification commands. |
| `.github/workflows/ci.yml` | On every push: install, lint, test, build. |

## How to run this / How to deploy this / Where the settings live

Written for Kalp, who does not need to know Next.js to keep this running.

### How to run this on your Mac

1. First time only: install Node 22 from https://nodejs.org (the "LTS" download). The site is built with Node 22 everywhere (your Mac, GitHub CI, Vercel), so do not pick a different major version.
2. Open Terminal and go to the folder: `cd ~/projects/portfolio`, then, first time only, install the dependencies: `npm install`
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
- **Environment variables:** their *names* are listed in `.env.example` and
  their *values* live on Vercel: project `portfolio` -> Settings ->
  Environment Variables. Never paste a real value into any file in this repo.
  Right now there are two, both for analytics: `NEXT_PUBLIC_POSTHOG_KEY` and
  `NEXT_PUBLIC_POSTHOG_HOST`.
- **Analytics (PostHog):** every visit, click and project-card click on this
  site is counted in PostHog (free plan, no card, hard-capped so it can never
  charge). Your bookmark is the "Kalp portfolio" dashboard linked in
  `docs/analytics.md`, which also explains how a new app joins the same
  project. The site works fine with analytics switched off (no key set); it
  uses no cookies, so no cookie banner is needed.
- **The domain:** `kalpkan.com`, bought on Cloudflare. Every DNS record, with
  its id, is listed in `docs/DNS_PENDING.md`.
- **Hosting plan (Vercel Hobby, free):** `docs/hosting-plan.md`. The plan is to
  spend $0 on hosting. Do not upgrade the Vercel plan; nothing here needs it.
- **Which variable belongs to which app:** `skills/portfolio-ops/settings-map.md`.

## How to add a project

1. Open `projects.json`.
2. Copy an existing entry and change the fields:
   - `slug`: short, lowercase, hyphens only. Used in the URL for case-study pages.
   - `name`, `tagline`: what shows on the card.
   - `type`: `"app"` (it is deployed somewhere and has a `url`) or `"showcase"`
     (hardware or iOS work; it gets a page on this site instead). A showcase
     entry must **not** have `url` or `healthUrl` at all; the checks reject it.
   - `status`: `"live"`, `"demo"`, `"coming"`, or `"archived"`. For a showcase,
     `"coming"` means its case-study page is not written yet (the row says
     "case study soon" and links to the repo); `"live"` means the page exists.
   - `url`: the deployed address. Required unless the status is `"coming"`.
     It must open for anyone, without logging in, before you set the status to
     `"live"`; a row that is `"coming"` links to the repo, not to the `url`.
   - `repo`: the GitHub link, or `null` if the code is not on GitHub.
   - `healthUrl`: the app's `/api/health` address, or `null`. When set, the row
     shows a live mark only while that address answers with `{"ok": true}`,
     and UptimeRobot can monitor it.
   - `tags`: a few words about the stack.
   - `hero`: leave `null` for now.
3. Run `npm test`. If the entry is malformed it tells you which field.
4. Commit and push. Vercel redeploys on its own.

The step-by-step version is in `skills/portfolio-ops/runbooks.md` under
"Add a project to projects.json".

## How to add a case study

A case study is a page on this site for something that cannot be linked to
(hardware, an iOS app, a Chrome extension). It needs two things: a registry
entry and a content file. A test refuses to build if one exists without the
other.

1. **Registry.** In `projects.json` add (or find) the entry with
   `"type": "showcase"`. Leave `"status": "coming"` until the page is written;
   the row then links to the repo and says "case study soon".
2. **Content.** Copy `content/projects/unpark.ts` to
   `content/projects/<slug>.ts` (the file name must equal the `slug`) and fill
   in each field in plain English:
   - `title`, `lede` (one sentence), `kicker` (a few facts separated by
     ` · `, e.g. `Hardware · iOS · 2025`).
   - `problem`: one paragraph on who has the problem and why it matters.
   - `howItWorks`: an intro sentence, a `diagram` id (add the boxes and arrows
     for a new project in `components/showcase/diagrams/index.tsx`, three
     nodes and two arrow labels is plenty) and 3–5 `steps`.
   - `hero`, `gallery`, `screens`, `video`: real media, or a placeholder
     `{ kind: "placeholder", label: "Photos coming: Kalp will add", aspect: "4/3", count: 2 }`
     that is drawn at the size the real thing will take. Use `null` for a
     section that does not apply (a car has no app screens).
   - `tech` (a short list), `repo` (must match the registry, `null` hides
     the link), `status` (one honest line: prototype / App Store: no / …).
   - `wanted`: the media you still owe this page; copy it into `STATUS.md`
     under H3.
3. **Register it.** Import the file in `content/projects/index.ts` and add it
   to the `caseStudies` map.
4. **Pictures.** Put photos through the converter so they are WebP and under
   300 KB, then import them at the top of the content file:
   ```bash
   node scripts/media-to-webp.mjs ~/Desktop/photo.png public/images/projects/<slug>/photo.webp
   ```
   For a frame from a video: `~/projects/microtubules/.venv/bin/python scripts/video-poster.py video.mp4 12 frame.png`
   (12 = seconds into the video), then the converter. iPhone HEIC files: open
   in Preview, File → Export as PNG first.
5. **Video.** Never commit the file. Upload it to YouTube as *Unlisted* and
   set `video: { kind: "youtube", id: "<the id after v=>", title: "…" }`.
6. **Publish.** `npm test`, then set the registry `status` to `"live"`, commit
   and push. The row on the home page switches to "case study" / "read" and
   `/projects/<slug>` shows the full page.

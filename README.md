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
| `app/page.tsx`, `components/kalpos/` | The home page is **KalpOS**: a power screen ("press any key to start"; the key sounds the chime), a macOS-style boot (`BootScreen.tsx`: white KK mark, a progress bar that fills with the real health round), then a lock screen (type anything, Enter) over a desk with folders, widgets, a dock and draggable windows. `KalpOS.tsx` is the root; `Desk.tsx`, `Window.tsx`, `windows/ProjectsWindow.tsx` and `PhoneSheet.tsx` (below 768 px) are the parts; `app/kalpos.css` holds every value copied from the design mock (`docs/design/`). `DESIGN.md` describes the system. |
| `lib/vfs.ts`, `lib/shell.ts`, `lib/fake-claude.ts`, `components/kalpos/windows/TerminalWindow.tsx` | The Terminal in the dock is a real (read-only) shell: `ls`, `cd`, `cat`, `tree`, `open <project>`, `status`, `neofetch`, Tab completion, history. Its filesystem is built from `projects.json` and the case studies at render time, so a new project is a new folder with no extra work. **Easter egg:** it has a couple of things to find; `help` is the honest starting point. |
| `components/kalpos/KalpOSMenu.tsx`, `RestartSheet.tsx` | The **KalpOS** word in the menubar (■ KalpOS on a phone) is a menu: About, **Lock Screen** (⌘L) and **Restart…** (⌃⌘R), which replays the whole boot (chime, logo, progress bar, lock; no power screen, since the click was the gesture) without reloading the page. The terminal's `reboot` and `lock` do the same. |
| `lib/tiles.ts`, `lib/signal.ts`, `lib/windows.ts`, `lib/boot.ts`, `lib/chime.ts`, `lib/clock.ts` | Pure logic under the desk: registry → tiles and filter counts, health check → tile mark, the window manager, the boot (the power-button gesture, readiness, the macOS-style bar's timing, the deep-link policy and the pre-paint script), the startup chime (Web Audio, played inside the power-button gesture) and its mute, the two clocks. All tested. |
| `app/api/health/route.ts` | `GET /api/health` returns `{ ok: true, service: "hub", time }`. Uptime monitors ping this. |
| `app/api/status/[slug]/route.ts` | Checks one project's own health URL (3 s timeout, `lib/health.ts`) so the page can show a live mark. |
| `app/opengraph-image.tsx` | The picture shown when the link is shared (iMessage, LinkedIn, Slack): a small KalpOS desk with the name and the registry counts, generated from `projects.json` at build time. |
| `lib/site.ts` | Your name, the note on the desk, the one-line identity, the résumé link, **the songs on repeat** (`PLAYLIST`: one `{ title, artist, tag? }` per song; `tag: "unreleased"` shows as a small pill; `musicTitle` is the Music window's heading), a photo path and the contact links (email / GitHub / LinkedIn). Every empty value hides its element: no Résumé pill, no NOW PLAYING widget / ♪ icon / dock Music tile while the playlist is empty, no contact rows until you fill them in. **To change the songs, edit `PLAYLIST` in `lib/site.ts` and push**: the widget, the Music window, the phone sheet and the terminal's `/about/music.md` all read it. |
| `components/kalpos/NowPlaying.tsx`, `components/kalpos/windows/MusicWindow.tsx`, `components/kalpos/usePlayer.ts`, `lib/player.ts` | The Music app. The NOW PLAYING widget shows the current song with a pulsing dot and a progress line that walks a fake 3:20 loop (no audio, ever); clicking it opens the Music window: a generated square cover (a two-tone gradient hashed from title + artist plus the song's initials, never a fetched image), the track list, ⏮ ▶︎/⏸ ⏭, ↑/↓ Enter Space. One shared player store keeps the widget and the window on the same song; the reducer is pure and tested. |
| `app/projects/[slug]/page.tsx` | The deep link to a case study (`/projects/unpark` and so on): it opens the desk with that case study already in a window, rendered on the server so shared links and crawlers see the content. Shows the full case study as soon as its content file has no `draft: true` (the registry status only changes the meta line and whether the Projects window opens it as a case study); a short placeholder while the content is a draft. See "How to add a case study". |
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
   - `name`, `tagline`: what shows on the tile (the tagline is its tooltip and is searchable).
   - `type`: `"app"` (it is deployed somewhere and has a `url`) or `"showcase"`
     (hardware or iOS work; it gets a case study inside a window instead). A
     showcase entry must **not** have `url` or `healthUrl` at all; the checks
     reject it.
   - `status`: `"live"`, `"demo"`, `"coming"`, or `"archived"`. For a showcase,
     `"coming"` means its case study is not written yet (a dashed "Coming"
     tile); `"live"` means the tile opens the case study in a window.
   - `url`: the deployed address. Required unless the status is `"coming"`.
     It must open for anyone, without logging in, before you set the status to
     `"live"`; a row that is `"coming"` links to the repo, not to the `url`.
   - `repo`: the GitHub link, or `null` if the code is not on GitHub.
   - `healthUrl`: the app's `/api/health` address, or `null`. When set, the
     tile turns cyan and draws its trace only while that address answers with
     `{"ok": true}`, and UptimeRobot can monitor it.
   - `tags`: a few words about the stack. A hardware word (`Hardware`, `KiCad`,
     `PCB`, `Raspberry Pi`, `Robotics`, `ESP8266`, `MPU6050`, `LTspice`,
     `Arduino`) puts the tile under the "Hardware" filter.
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
   the tile is then dashed and says "Coming". The status only controls the
   tile and the wording of the case study's meta line; what stops an
   unfinished page from being published is `draft: true` in the content file
   (step 2), not the status.
2. **Content.** Copy `content/projects/unpark.ts` to
   `content/projects/<slug>.ts` (the file name must equal the `slug`), put
   `draft: true` in it while you are writing (a draft renders only the short
   "case study coming soon" placeholder, whatever the registry says), and fill
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
     section that does not apply (a car has no app screens). Images are always
     local WebP files imported from `public/images/projects/<slug>/` (step 4);
     an image on another website cannot be used, because `next/image` refuses
     hosts that are not listed in `next.config.ts`, and adding one there is a
     separate change. Only videos are hosted elsewhere (step 5).
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
6. **Publish.** `npm test`, then remove `draft: true` from the content file
   and set the registry `status` to `"live"`, commit and push. The row on the
   home page switches to "case study" / "read" and `/projects/<slug>` shows the
   full page. The two switches are independent, and the test in
   `app/projects/[slug]/page.test.tsx` pins the rule:
   - `draft: true` (or no content file): the short placeholder page, always.
   - no `draft`, status `"coming"`: the full page is published with the meta
     line **under construction** (the DIY EEG page), but the home-page row
     does not link to it yet.
   - no `draft`, status `"live"`: the full page, meta line "case study", row
     linked.
   So removing `draft: true` publishes the page even before the status flips;
   keep the draft flag on until the words are ready to be read.

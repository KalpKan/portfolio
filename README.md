# portfolio

The hub for every project Kalp Kansara has built. One page, one URL, one
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
| `components/kalpos/DeskIcons.tsx`, `useIconLayout.ts`, `lib/icons.ts` | The desk icons can be dragged anywhere on the desk (1:1, then a snap to the 22 px dots, never on another icon, off the menubar and the dock); arrow keys move a focused icon one cell; positions persist in `localStorage` `kalpos:icons` and survive Lock / Restart; **Clean Up** (KalpOS menu, ⌥⌘1) restores the card 2c grid. |
| `lib/swat.ts`, `components/kalpos/TrashSwat.tsx` | Drag an icon onto the Trash (desk icon or dock tile): it crumples, sinks, a drawn hand pops out of the basket and swats it back to its cell along an arc, with an original whoosh and a one-line toast. Reduced motion: a plain 200 ms return. |
| `components/kalpos/Window.tsx` | Windows open from their icon (380 ms FLIP), **close in place** (scale .96 + fade, 160 ms) and **minimise into their own dock tile** (320 ms), one animation per beat (`docs/reports/evidence/kalpos-close-check.mjs` proves it). |
| `components/kalpos/KalpOSMenu.tsx`, `RestartSheet.tsx` | The **KalpOS** word in the menubar (■ KalpOS on a phone) is a menu: About, **Lock Screen** (⌃⌘Q, the real macOS lock shortcut; ⌘L stays the browser's address bar), **Restart…** (⌃⌘R), which replays the whole boot (chime, logo, progress bar, lock; no power screen, since the click was the gesture) without reloading the page, and **Appearance ▸ Light / Dark / Auto**. The terminal's `reboot`, `lock` and `theme` do the same. |
| `lib/appearance.ts`, `app/globals.css` | **Dark mode.** The desk has two appearances. Pick one in **KalpOS ▸ Appearance ▸ Light / Dark / Auto** (Auto follows your Mac's or phone's own setting), on the phone menu, or in the Terminal with `theme dark` / `theme light` / `theme auto` (`theme` alone tells you which one you are on). The choice is remembered in this browser (`localStorage` `kalpos:appearance`) and is applied before the page paints, so there is never a white flash. **The default is Light** — nobody sees dark unless they ask for it; to make Auto the default, change the one line `DEFAULT_APPEARANCE` in `lib/appearance.ts` and push. Every colour is a token on `:root` in `app/globals.css` with its light and dark value on the same line, so there is no second stylesheet to keep in step; `DESIGN.md` has the full palette. The boot, the lock and the power screen were always black and are unchanged. |
| `lib/tiles.ts`, `lib/signal.ts`, `lib/windows.ts`, `lib/boot.ts`, `lib/chime.ts`, `lib/clock.ts` | Pure logic under the desk: registry → tiles and filter counts, health check → tile mark, the window manager, the boot (the power-button gesture, readiness, the macOS-style bar's timing, the deep-link policy and the pre-paint script), the startup chime (Web Audio, played inside the power-button gesture) and its mute, the two clocks. All tested. |
| `app/api/health/route.ts` | `GET /api/health` returns `{ ok: true, service: "hub", time }`. Uptime monitors ping this. |
| `app/api/status/[slug]/route.ts` | Checks one project's own health URL (3 s timeout, `lib/health.ts`) so the page can show a live mark. |
| `app/opengraph-image.tsx` | The picture shown when the link is shared (iMessage, LinkedIn, Slack): a small KalpOS desk with the name and the registry counts, generated from `projects.json` at build time. |
| `lib/site.ts` | Your name, the note on the desk, the one-line identity, the résumé link, **the songs on repeat** (`PLAYLIST`: one `{ title, artist, tag?, spotifyUrl? }` per song; `tag: "unreleased"` shows as a small pill; `spotifyUrl` is a real `https://open.spotify.com/track/<id>` link — a double-click on the row, or Enter when it is already the current track, opens it in a new tab, and a small "open ↗" hint shows on hover/focus while it is set; `musicTitle` is the Music window's heading), the desk photo (`photo`, a square WebP), the About-window portrait (`portrait`, 3:4), **what you are reading** (`READING`: one `{ title, authors, cover, url }` per book, the first is the one on the desk), **your hobbies** (`HOBBIES`: one `{ slug, name, line }` each; `slug` picks the drawn glyph and names the terminal file) and the contact links (`contact`: email / GitHub / LinkedIn, each a handle or a full URL). Every empty value hides its element: no Résumé pill, no NOW PLAYING widget / ♪ icon / dock Music tile while the playlist is empty, no contact rows until you fill them in. **To change the songs, edit `PLAYLIST` in `lib/site.ts` and push**: the widget, the Music window, the phone sheet and the terminal's `/about/music.md` all read it. **To change your contact details, the book you are reading or your hobbies, edit `contact` / `READING` / `HOBBIES` in the same file** — see "How to change the contact details, the book or the hobbies" below. |
| `components/kalpos/NowPlaying.tsx`, `components/kalpos/windows/MusicWindow.tsx`, `components/kalpos/usePlayer.ts`, `lib/player.ts` | The Music app. The NOW PLAYING widget shows the current song with a pulsing dot and a progress line that walks a fake 3:20 loop (no audio, ever); clicking it opens the Music window: a generated square cover (a two-tone gradient hashed from title + artist plus the song's initials, never a fetched image), the track list, ⏮ ▶︎/⏸ ⏭, ↑/↓ Enter Space. One shared player store keeps the widget and the window on the same song; the reducer is pure and tested. |
| `components/kalpos/Reading.tsx`, `components/kalpos/windows/ReadingWindow.tsx` | **What Kalp is reading.** The frosted READING card under NOW PLAYING (cover thumbnail, title, authors) opens a small Reading window with the jacket at 180 px and a link out to the book. On a phone it is a row under the note. Covers are real jackets committed under `public/images/reading/`. |
| `components/kalpos/HobbyGlyph.tsx`, `components/kalpos/windows/HobbiesWindow.tsx` | **Hobbies.** A two-column list, one row per entry in `HOBBIES`, each with its own original drawn mini-glyph (no emoji). The desk's Hobbies folder badge is the count. |
| `app/projects/[slug]/page.tsx` | The deep link to a case study (`/projects/unpark` and so on): it opens the desk with that case study already in a window, rendered on the server so shared links and crawlers see the content. Shows the full case study as soon as its content file has no `draft: true` (the registry status only changes the meta line and whether the Projects window opens it as a case study); a short placeholder while the content is a draft. See "How to add a case study". |
| `content/projects/<slug>.ts` | The words and pictures of one case study (see "How to add a case study"). `content/case-study.ts` is the shape every file follows. |
| `components/showcase/` | The case-study template: hero, problem, how-it-works diagram, photos, app screens, video, tech, status. |
| `public/images/projects/<slug>/` | Case-study images and each live app's `hero.webp` (the Quick Look screenshot), WebP only, 300 KB or less each (a test enforces it). Videos are never put here. |
| `scripts/media-to-webp.mjs`, `scripts/video-poster.py` | Turn a photo (or one frame of a video) into a WebP that fits the rule above. |
| `components/kalpos/windows/QuickLook.tsx`, `scripts/app-screenshots.mjs` | **Quick Look** in the Projects window: press Space on a tile (or click its ⓘ) for a frosted panel with a real screenshot of the app in use, its tagline, tags and an Open / Read button. The script takes those screenshots from the live apps (see "How to refresh the app screenshots"). |
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
   - `hero`: `"/images/projects/<slug>/hero.webp"` once the app has a
     screenshot (see "How to refresh the app screenshots"), otherwise `null`;
     Quick Look then shows the tile's own art instead of a picture.
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
5. **Video.** Never commit the file. Either upload it to YouTube as *Unlisted* and
   set `video: { kind: "youtube", id: "<the id after v=>", title: "…" }`, or hand
   Claude the file: it is compressed with ffmpeg and hosted in Supabase Storage
   (public bucket `portfolio-media`, the RC car's driving video lives there) and
   the page gets `video: { kind: "file", url, poster, title }` with a committed
   WebP poster frame (ops runbook "Host a video for a case study"). A PDF such as
   a pitch deck goes under `public/docs/` and is linked from the status line via
   `links: [{ label: "Pitch deck (PDF)", href: "/docs/…" }]`.
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

## How to change the contact details, the book or the hobbies

All three live in `lib/site.ts`; nothing else has to change, and every empty
value hides its element.

**Contact.** Edit `SITE.contact`:

```ts
contact: {
  email: "Kalpkansara123@gmail.com",
  github: "https://github.com/KalpKan",              // a bare handle works too
  linkedin: "https://www.linkedin.com/in/kalp-kansara123/",
},
```

The Contact window (a mail-style To / GitHub / LinkedIn header), the About
window's contact row, the phone's Contact sheet and the terminal's
`cat /about/README.md` all read the same three values. The email becomes a
`mailto:` link and the two off-site links get `rel="noreferrer"`. The address
is deliberately shown in full, not obfuscated.

**What you are reading.** Edit `READING` (the first entry is the one on the
desk), then put the jacket in `public/images/reading/`:

```bash
# the real cover, from Open Library's cover API, by ISBN:
curl -sL -o /tmp/cover.jpg "https://covers.openlibrary.org/b/isbn/9781946885111-L.jpg"
# check it is a real jacket and not their 1x1 "no cover" placeholder (must be > 5 KB), then:
node -e 'require("sharp")("/tmp/cover.jpg").resize({height:500,withoutEnlargement:true}).jpeg({quality:86,mozjpeg:true}).toFile("public/images/reading/<slug>.jpg")'
```

A test refuses a cover over 120 KB or under 5 KB. The READING widget, the
Reading window, the phone row and the terminal's `/about/reading.md` all read
`READING`; `url` is where "Look it up ↗" goes (the book's Open Library page).

**Hobbies.** Edit `HOBBIES`: one `{ slug, name, line }` per hobby, `line` in
your own voice and short (a test keeps it to one sentence). `slug` must be one
of the ids `HobbyGlyphId` lists, because it picks the drawn mini-glyph in
`components/kalpos/HobbyGlyph.tsx` and names the terminal's
`/hobbies/<slug>.md`. **A new hobby needs a new drawing** in that file (add
the id to `HobbyGlyphId`, then a `case` with the SVG paths): the desk never
uses emoji. The Hobbies window, the phone sheet, the folder's count badge and
the terminal folder all follow.

## How to change the tab icon

`app/icon.svg` is the favicon (a drawn MacBook on a transparent ground, so it
reads on a light and a dark tab strip). After editing it, regenerate the iOS
touch icon, which must be opaque:

```bash
node -e 'const sharp=require("sharp"),fs=require("fs");(async()=>{const a=await sharp(fs.readFileSync("app/icon.svg"),{density:342}).resize(152,152).png().toBuffer();await sharp({create:{width:180,height:180,channels:4,background:"#f3f2f2"}}).composite([{input:a,left:14,top:14}]).png().toFile("app/apple-icon.png");})()'
```

Check it at 16, 32 and 180 px before committing: at 16 px only the silhouette
survives, so the shape has to carry it.

## How to refresh the app screenshots

Quick Look (Space on a tile in the Projects window) shows one real screenshot
of each live app in use: `public/images/projects/<slug>/hero.webp`, pointed to
by the `hero` field in `projects.json`. The originals are under
`docs/images/apps/<slug>/`. Redo them whenever an app's look changes:

```bash
cd ~/projects/portfolio
# the flip stage needs promptflip's own preview page, so start its dev server first (optional):
(cd ~/projects/promptflip && npm run dev) &
node scripts/app-screenshots.mjs            # all five apps; or: node scripts/app-screenshots.mjs plato hoops
node scripts/app-screenshots.mjs --hero     # only rebuild the webp files from the originals
npm test && git add docs/images/apps public/images/projects && git commit -m "app screenshots refreshed"
```

The script drives a headless Chrome at 1440×900 (2×) through each app's real
flow: it uploads a course outline to Plato and waits for the review page,
opens the Shot Map on hoops, runs the "Untreated" sample cell on
microtubules, and takes PromptFlip's lobby plus its flip stage. Nobody is
signed in: Plant It is captured at its login screen on purpose, and the flip
stage comes from promptflip's dev-only preview page (the real one needs two
signed-in players). It borrows Playwright from `~/projects/promptflip`
(`PLAYWRIGHT_ROOT` to point elsewhere) and reads a corpus PDF from
`~/projects/plato-corpus/pdfs` (`PLATO_PDF` to use another). The hero for a
slug is the frame named in `HERO_FRAME` at the top of the script; change that
line to pick a different moment.

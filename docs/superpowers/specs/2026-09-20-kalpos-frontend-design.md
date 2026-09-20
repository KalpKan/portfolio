# KalpOS front end — implementation spec (from Kalp's Claude Design project "Mac-inspired Portfolio Design")

Source of truth: `docs/design/KalpOS-Mockups.dc.html` (open it with `docs/design/support.js` beside it, e.g. `python3 -m http.server 8931` in `docs/design/` and visit `http://127.0.0.1:8931/KalpOS-Mockups.dc.html#2c`). The markup of every option card is plain HTML+CSS: **copy its colors, radii, blur values, shadows, fonts and timings verbatim**; do not re-invent them. Kalp asked for this design to be implemented as given.

## Which cards compose the site (the design conversation has three turns; later turns supersede earlier ones)

| Beat | Card | Notes |
|---|---|---|
| Lock screen (entry, `/`) | **3c** (interactive) with **3b** storyboard timings | Black lock: date line, very large clock (real local time), KK avatar, name, frosted "Enter Password" pill, caption "It's a portfolio — type anything, then Enter". Click/Enter also unlocks. |
| Unlock transition | **3b** beats 2–4, **2a** "desk breathes in" | 1.2–3.0 s dots pop in 120 ms apart (scale .3→1); field pulses once; clock lifts and everything blurs out; desk scales 1.06→1 as blur clears; menubar drops in, dock rises last, icons pop staggered 40 ms. ~~Returning visitors (localStorage) skip the lock and get a 400 ms crossfade to the desk.~~ **Changed 2026-09-20 (Kalp):** the lock shows on every plain visit, preceded by the card 2a boot (mark from blur, hairline = real readiness); only `/projects/<slug>` and `?desk` skip both. See the plan's "As executed" 14–16. |
| Desk | **2c** | Frosted menubar (KalpOS · File · Edit · View · Go · Window · right: "Résumé ↓" pill, visits count, wifi, battery, "Sat 20 Sep 11:42" real clock); dotted ground; folders Projects (badge = count) and Hobbies; About me (document icon), Contact (@ tile), Now playing (♪ tile), Trash; widgets: yellow NOTE, "photo of Kalp" frame, NOW PLAYING card; frosted dock with 8 tiles (Finder/Projects, Notes, Mail, Music, Photos, Terminal, PDF/Résumé, Trash) with running-dot indicators. |
| Projects window | **2d** | Rounded window, traffic lights, frosted sidebar "REGISTRY" with filters All / Live signal / Hardware / Case studies / Coming (counts from the real registry), header "Projects · N items, M live", search field; tile grid: live apps = cyan tile with the spike-trace mark (drawn once, 1.6 s, when the health check answers ok, exactly as the current hub's `/api/status/<slug>`), case studies = grey tile with ▲, coming = dashed tile with ○ "Checking…" / "Coming". Clicking a live tile opens the app in a new tab; clicking a case study opens it **inside a window** (see below). A second, behind window shows the stacked-windows effect only when two are open. |
| Motion | **2e** | One curve for all geometry: `cubic-bezier(.2,.8,.2,1)` (or spring 260/28). Open folder 380 ms from the icon's rect, icon dips .94 for 90 ms first, content fades 120 ms; close/minimise 320 ms reverse, minimise into its dock tile; drag 1:1 with inertia on release, icons snap to the 22 px dot grid; focus 180 ms (shadow sm→lg, frost brightens, traffic lights fill); dock hover 160 ms (tile 1.18, neighbours 1.08, label above); live tile trace 1.6 s once; trash lid lifts 220 ms on hover. `prefers-reduced-motion`: boot is a 400 ms crossfade, windows appear in place, dock does not magnify. |
| Phone (< 768 px) | **1e** restyled with the turn-2 chrome | The desk folds to one sheet: compact top bar (■ KalpOS, ↓, time), name + one line, 2×3 folder grid (Projects, Hobbies, About, Contact, Music, Trash), yellow note, and a **Projects bottom sheet** (drag handle, "Projects · 12 items · 7 live", close) listing rows (tile, name, status word, →). Folders open as full-height sheets, not floating windows. No lock screen on phone? — keep it, it is 3 taps of delight; but the unlock must be a single tap (the pill is a button). |

Not mocked, needed for a complete site (design them in the same idiom, minimal):
- **About me** window: the current hub's bio + identity line (from `lib/site.ts`) and the contact row; a "Résumé ↓" link if `site.resumeUrl` is set (else hidden).
- **Contact** window: mail-style: email, GitHub, LinkedIn from `lib/site.ts` (renders nothing that is empty).
- **Hobbies** window: empty state "Nothing filed yet" (content later).
- **Trash** window: "Scrapped ideas": the two archived coinflip repos (token-gamble-coinflip, token-coinflip) with one line each and links.
- **Now playing** widget/window: static track from `lib/site.ts` (`nowPlaying: {title, artist}`); if empty, the widget hides. (Mock shows Bloom / Radiohead as placeholder; do not hardcode it.)
- **Case study inside a window**: reuse `components/showcase/*` and `content/projects/*` rendered in a scrollable window body; `/projects/<slug>` deep links still work (they open the desk with that window already open, so shared links and OG cards keep working).
- **Résumé**: menubar pill links to `site.resumeUrl` (hidden when empty). Visits count: read from PostHog via the existing analytics contract if a cheap endpoint exists; otherwise omit the number rather than fake it.

## Keep from the current hub (wire underneath, don't rebuild)
`lib/projects.ts` (registry, kinds, counts), `app/api/status/[slug]` + `lib/health.ts` (health proxy), `lib/posthog.ts` + provider + `lib/track.ts` (events: keep `project_card_clicked`, add `window_opened {slug}`, `unlocked`), `content/projects/*` + `components/showcase/*` (case studies), `app/opengraph-image.tsx` (update the art to the KalpOS mark), `next.config.ts` rewrites, `lib/site.ts` (extend), tests in `lib/` and `content/`. Remove `components/Board.tsx`, `components/marks.tsx` (fold the spike-trace mark into the new tile), the old `app/page.tsx` layout, old `DESIGN.md` direction (rewrite DESIGN.md to describe KalpOS).

## Hard requirements
- Next.js App Router, TypeScript, Tailwind allowed but the mock's CSS values win. Fonts: the mock uses the system sans (-apple-system/SF Pro) for chrome plus Source Serif 4 and Geist Mono where the cards use them; self-host the two web fonts as the hub already does.
- Icons: Phosphor duotone (the mock links `@phosphor-icons/web` duotone); use `@phosphor-icons/react` duotone weight.
- Dark surfaces: only the lock screen and boot are black (the mock says black is the only dark surface). No dark-mode variant of the desk needed.
- Accessibility: every window/tile/dock item is keyboard reachable; windows are `role="dialog"` with focus trap and Esc to close; folders are buttons; skip-to-content; `prefers-reduced-motion` respected as in 2e.
- Performance: Lighthouse performance ≥ 0.90 on `/` (lock) and on the desk after unlock; no layout shift on the clock.
- Widths: 390, 768, 1024, 1440 all verified in real Chrome (claude-in-chrome; use same-origin iframes if window resize is stuck) with screenshots saved to `docs/images/kalpos/`.
- Tests: vitest for registry→tile mapping, filter counts, health→trace state, localStorage returning-visitor logic, window open/close state; keep existing tests green (`npx vitest run --pool=forks --maxWorkers=1`).
- Analytics, health badges, case-study content and OG image must keep working (the T0.5 and T4.1 verifications are the bar).
- Deploy to production (push to main; `vercel.json` ignoreCommand skips docs-only pushes, code pushes deploy).

## Out of scope
Real Hobbies content, real Now Playing integration, dark desk, admin/CMS.

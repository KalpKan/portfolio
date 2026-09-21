# Resume here

Written 2026-09-21 by the T6.9 worker at wind-down. Everything below is
unstarted work, in the order it was handed over.

## Done and live

T6.9 (KalpOS personal info) is merged (`985705c`) and live on
https://kalpkan.com via deployment `portfolio-hkb795k89`. Its done-criteria
checklist, evidence and deviations are at the top of `STATUS.md` and in the
T6.9 task row; screenshots are in `docs/images/kalpos/personal/` (taken
against production).

## Not started — T6.10, dark mode (assigned, then reassigned away from the
T6.9 worker; nothing exists yet)

Kalp's brief, verbatim in substance:

1. macOS-style dark appearance: dark desk ground (near-black, same 22 px dot
   grid at low alpha), dark frosted menubar and dock (dark rgba frost, the
   same blur/saturate values as light), dark window chrome / frames /
   sidebars with the same radii and shadows retuned for a dark ground,
   widgets (the note stays yellow but muted; photo, reading and now-playing
   cards go dark), the phone sheet; the terminal is already dark. Text
   contrast AA everywhere. The drawn icons (folders, envelope, trash, hobby
   glyphs) keep their tints but get dark-appropriate shading. Lock and boot
   are unchanged: they are already black.
2. Appearance control: an "Appearance ▸ Light / Dark / Auto" row in the
   KalpOS menu (Auto = `prefers-color-scheme`), persisted in `localStorage`
   `kalpos:appearance`, applied by a pre-paint script on
   `<html data-appearance>` so there is no flash on load. The phone menu gets
   the same row. Terminal: `theme dark|light|auto`.
3. Tokens: lift the light values already in `app/kalpos.css` into CSS custom
   properties on `:root`, override them under `[data-appearance="dark"]` and
   under `(prefers-color-scheme: dark)` when `data-appearance="auto"`. No
   per-component hex duplication.
4. The OG image stays as it is.
5. Tests: appearance state and persistence, the pre-paint attribute, the menu
   row, and a snapshot of the key components in dark.
6. Verify in claude-in-chrome at 1440 and 390 in dark (screenshots to
   `docs/images/kalpos/dark/`), console clean, Lighthouse ≥ 0.90. At most one
   extra deploy (push to `main`).
7. Update `DESIGN.md` (dark tokens + the appearance beat; say that it
   supersedes the earlier "no dark desk" decision), `README.md`,
   `docs/hosting-plan.md` decisions list (one line),
   `skills/portfolio-ops/verification.md` (a row), `STATUS.md` (a T6.10 row).
   PostHog `menu_action { item: "appearance", value }`.

Note for whoever picks this up: `app/kalpos.css` is 2139 lines of literal hex
copied from the design mock, and `app/kalpos-extras.css` another 750. The
token lift is the bulk of the work; do it first and prove light is unchanged
(the existing screenshots in `docs/images/kalpos/` are the before-picture)
before adding a single dark value.

## Not started — Spotify links in the Music app (small; Kalp wanted this on a
Sonnet sub-agent)

In the Music window and the phone Music sheet, **double-clicking** a song (and,
for the keyboard, Enter on a focused row that is already the current track;
a single click keeps selecting/playing as it does now) opens that song on
Spotify in a new tab.

- Add `spotifyUrl` to each `PLAYLIST` entry in `lib/site.ts`.
- Find the real track URLs (`open.spotify.com/track/<id>`) with WebSearch:
  "Suffer" by BEX (2025 single), "These Words" by Badger & Natasha Bedingfield
  (2024 single), "Sleep" by The Kid LAROI. **Verify each** with Spotify's
  keyless oEmbed endpoint (`https://open.spotify.com/oembed?url=<track url>`
  returns JSON whose title matches the song and artist) and record the
  verification in the commit message. If a track cannot be verified, leave its
  `spotifyUrl` empty and add a line under "Needs Kalp" in `STATUS.md`.
- A tiny "open ↗" hint on the row on hover and focus (text, never a Spotify
  logo asset), and `open <n>` in the terminal's `music.md` listing.
- PostHog `music_opened_spotify { index }`.
- Tests for the double-click handler and a URL guard that accepts only
  `https://open.spotify.com/track/` URLs.

## House rules in force

- Overnight protocol: `docs/night-protocol.md`. Done-criteria first, no retry
  loops past two attempts, stop your own processes and worktrees at the end.
- Model rule (2026-09-21): easy/routine features go to a Sonnet sub-agent
  (`subagent_type: "kalpos"`), Haiku only for lookups, Opus for end-to-end
  apps and full UI overhauls (dark mode counts).
- Two Vercel deploys per app per batch, $0 spend.

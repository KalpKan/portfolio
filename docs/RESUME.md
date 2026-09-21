# Resume here

Updated 2026-09-21 by the kalpos fixes-batch worker (T6.12a/b/c) at wind-down.
It replaces the T6.10 dark-mode worker's hand-over: all three items that
worker left open — the live dark-mode defect, the power screen's contrast, and
the `ignoreCommand` root cause — are now done and live. That worker's earlier
write-up follows below, kept for the "Before you touch KalpOS colours again"
section, which is still current.

## Done and live

- **T6.9** (KalpOS personal info) — merge `985705c`, deployment
  `portfolio-hkb795k89`.
- **T6.11** (Spotify links on the Music songs) — code `93fc69a`. Its own push
  never deployed (`STATUS.md` H19: the pushed range's tip commit was docs-only,
  so `vercel.json`'s `ignoreCommand` cancelled the build). The T6.10 merge
  carried it to production; all three rows show the "open ↗" hint on the live
  site, so **H19 is resolved** and can be struck. Re-confirmed live 2026-09-21
  (kalpos fixes batch): a real double-click on "These Words" opened
  `open.spotify.com/track/7leW1Dmvs9A4oDh9i5Qwpz` in a new tab.
- **T6.10** (dark mode) — merges `3025ac9` and the follow-up fix. Done-criteria,
  evidence, deviations are at the top of `STATUS.md` and in the T6.10 task row;
  screenshots in `docs/images/kalpos/dark/`.
- **T6.12a** (dark mode's one live defect) — an already-open window now
  correctly changes background when appearance is switched under it. See
  "Before you touch KalpOS colours again" below for the fix.
- **T6.12b** (`vercel.json` `ignoreCommand` root cause) — fixed; see
  `skills/portfolio-ops/runbooks.md` ("Hub: ignored build step") and
  `skills/portfolio-ops/incidents.md`.
- **T6.12c** (power screen caption contrast) — fixed; Lighthouse accessibility
  on `/` is now **1.00** live.

Nothing is half-finished and no branch is waiting to be picked up.

## Before you touch KalpOS colours again

The one rule: **`app/kalpos.css` and `app/kalpos-extras.css` must not contain a
colour literal.** Every colour is a token on `:root` in `app/globals.css`:

```css
--paper: #f3f2f2;                        /* light, and the no-light-dark() fallback */
--paper: light-dark(#f3f2f2, #121214);   /* the pair */
```

used as `var(--paper)`. `app/appearance.test.ts` fails the build if a literal
appears outside the documented exceptions (the power / boot / lock / restart
layers, the Terminal, the drawn icons, the folder and dock tile tints), and the
exception list lives in that test so adding one is a decision, not an accident.

Four things that cost real time and are worth not rediscovering:

1. **Do not transition a property whose value comes from an appearance token.**
   Chrome does not start a transition, and leaves the property at its old used
   value, when the only thing that changed is a custom property referenced by a
   transitioned property. A test forbids the `background` *shorthand* (the lock
   screen's pill is the one stated exemption, since the lock is black in both
   appearances). Narrowing to the `background-color` *longhand* was not enough
   either — the fix (T6.12a, 2026-09-21) is to drop `background-color` from the
   *persistent* `transition` list entirely on any selector whose colour is an
   appearance token: `.kos-window`, `.kos-light`, `.kos-transport button` and
   `.kos-track` all had this and are now fixed (other transitioned properties —
   `box-shadow`, `transform` — are unaffected). The appearance switch itself
   still cross-fades every colour through the temporary `.kos-appearance-shift`
   class (`app/globals.css`), so nothing is lost except an
   instant-instead-of-eased colour change on hover/focus/current-row. If you add
   a new persistent transition anywhere in KalpOS, it must not include
   `background-color` (or `background`) if the colour comes from a
   `light-dark()` token — `app/appearance.test.ts` has a guard for the four
   known selectors but not a blanket one, so a new offender would not be caught
   automatically.
2. **`light-dark()` returns a colour**, so it cannot hold a whole `box-shadow` or
   a `filter`. Shadows are split: `--c-sh-lg` is the colour pair,
   `--sh-lg: 0 12px 32px var(--c-sh-lg)` the geometry shared by both. Do the
   same for any new shadow.
3. **Not every `#fff` is the same `#fff`.** White that is *text on an accent
   fill* is `--on-accent` and stays white; white that is *a sheet of paper* (the
   About document, the photo frame, the folder slip, the Music dock tile) is
   `--card` and goes dark. Likewise `#f3f2f2`: as a desk ground it is `--paper`,
   but on the Restart mark and the Terminal dock tile it is ink on a surface
   that is black in *both* appearances, which is `--on-dark`.
4. **A scrim is not a tint.** `--scrim` and `--scrim-sheet` get *darker* in dark;
   the `--tint-*` ladder flips from ink to white. Their light values look alike
   and they behave oppositely.

## Open items, smallest first

- **`STATUS.md` H20 — "default auto?"** Dark mode defaults to **Light**, so
  nobody sees the dark desk unless they choose it. If Kalp says *"default auto"*:
  change `DEFAULT_APPEARANCE` in `lib/appearance.ts` to `"auto"`, update the test
  that deliberately pins `"light"` (it will fail and tell you), close H20, and fix
  the one sentence in `README.md` and `DESIGN.md`. Nothing else depends on it.
  This is the only item this worker left untouched — it needs Kalp's word, not
  a fix.
- **`startViewTransition`** is still not implemented (T6.12a's brief explicitly
  excluded it). The persistent-transition fix above is sufficient and live; a
  real compositor-level crossfade via `document.startViewTransition(() =>
  applyAppearance(a))` inside `setAppearanceWithCrossfade`
  (`lib/appearance.ts`) remains a "better, not needed" option for whoever wants
  it — see the git history of this file (2026-09-21, T6.10 worker's original
  write-up) for the full sketch of what that would involve (deleting
  `.kos-appearance-shift` and its class handling, keeping the reduced-motion
  branch).

Everything else this file used to list here — the live dark-mode defect, the
power screen's caption contrast, and the `vercel.json` `ignoreCommand` root
cause — was fixed 2026-09-21 by the kalpos fixes batch (T6.12a/b/c, one merge,
one production deploy). See the T6.12a/b/c rows in `STATUS.md` for the
evidence and `skills/portfolio-ops/incidents.md` for the `ignoreCommand`
incident write-up.

## Verifying dark mode still works

`skills/portfolio-ops/verification.md` → the row **"Dark mode: the Appearance
row, the pre-paint attribute, the dark desk (T6.10)"** has the exact commands,
including how to run Lighthouse *in dark* (seed `kalpos:appearance` in a Chrome
started on a debugging port, then `lighthouse --port`), which is not obvious.
Note that Chrome clamps the shared window to ~1200 px, so 390 px checks go
through a same-origin iframe.

## House rules in force

- Overnight protocol: `docs/night-protocol.md`. Done-criteria first, no retry
  loops past two attempts, stop your own processes and worktrees at the end.
- Model rule (2026-09-21): easy/routine features go to a Sonnet sub-agent
  (`subagent_type: "kalpos"`), Haiku only for lookups, Opus for end-to-end apps
  and full UI overhauls.
- Two Vercel deploys per app per batch, $0 spend. If a live-only defect forces a
  third, ask the overnight supervisor rather than shipping something broken —
  that is what happened here, and the ruling is in
  `docs/overnight-supervisor-log.md`.

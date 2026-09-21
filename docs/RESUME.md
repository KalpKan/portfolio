# Resume here

Written 2026-09-21 by the T6.10 (dark mode) worker at wind-down. It replaces
the T6.9 worker's hand-over, whose two "not started" items — dark mode and the
Spotify links — are both now done and live.

## Done and live

- **T6.9** (KalpOS personal info) — merge `985705c`, deployment
  `portfolio-hkb795k89`.
- **T6.11** (Spotify links on the Music songs) — code `93fc69a`. Its own push
  never deployed (`STATUS.md` H19: the pushed range's tip commit was docs-only,
  so `vercel.json`'s `ignoreCommand` cancelled the build). The T6.10 merge
  carried it to production; all three rows show the "open ↗" hint on the live
  site, so **H19 is resolved** and can be struck.
- **T6.10** (dark mode) — merges `3025ac9` and the follow-up fix. Done-criteria,
  evidence, deviations and the one known issue are at the top of `STATUS.md`
  and in the T6.10 task row; screenshots in `docs/images/kalpos/dark/`.

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
   transitioned property. A test now forbids the `background` *shorthand* (the
   lock screen's pill is the one stated exemption, since the lock is black in
   both appearances), but narrowing to `background-color` is **not** enough —
   see the open item below.
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
- **An already-open window keeps its old background when you switch appearance.**
  The only thing still wrong with dark mode, and it is live. The desk, dots,
  menubar, dock, sidebar, widgets, note and phone all follow; a window opened
  *after* the switch is correct; closing and reopening it, or reloading, fixes
  it. Cause, isolated on the live page: Chrome does not start a transition, and
  keeps the old used value, when the only change is a custom property that a
  transitioned property references. Proved with a minimal probe — two divs with
  `transition: background-color`, one reading a plain custom property and one a
  property registered with `@property { syntax: "<color>" }`; flipping an
  attribute on `:root` left **both** at the old colour, so `@property` is not
  the answer either. `.kos-sidebar` follows correctly only because it has no
  background transition, and `style.transition = "none"` on the window snaps it
  to the right colour both ways.
  Affected selectors: **`.kos-window`** (the visible one), `.kos-light`,
  `.kos-transport button`, `.kos-track`.
  Two fixes, neither applied (the deploy budget was spent and the supervisor's
  condition was to record and stop):
  1. one line — drop `background-color` from `.kos-window`'s persistent
     transition in `app/kalpos.css`, keeping `box-shadow 180ms`; the frost then
     changes instantly on focus while the shadow still lifts. Proven by the
     `transition: none` probe.
  2. better — wrap the swap in `document.startViewTransition(() =>
     applyAppearance(a))` inside `setAppearanceWithCrossfade` (`lib/appearance.ts`).
     The DOM change happens with styles recalculated, so the pin cannot occur,
     and it replaces the per-property crossfade with a real compositor-level
     one. Whoever does this should delete the `.kos-appearance-shift` rule in
     `app/globals.css` and the class handling in `lib/appearance.ts` with it,
     and keep the reduced-motion branch (View Transitions must be skipped under
     `prefers-reduced-motion`).

- **The power screen's caption** is the only thing between the hub and a 1.00
  Lighthouse accessibility score: `.kos-power-caption`, `rgba(243,242,242,.45)`
  on black, 4.05:1 against a 4.5:1 bar. Pre-existing, identical in light and
  dark, and left alone only because the T6.10 brief said that screen is
  unchanged. Raising the alpha to `.55` (~5.2:1) is a one-line fix.
- **`vercel.json`'s `ignoreCommand`** diffs only `HEAD^..HEAD`, so any push whose
  tip commit is docs-only cancels its own deploy. This has now bitten T4.1, T6.1
  and T6.11. The root fix is to diff against the last *deployed* commit; until
  someone does it, make sure the last commit of a push touches code — a
  `--no-ff` merge commit whose first-parent diff includes `app/` or
  `components/` is enough.

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

# Hub polish batch (from T0.1 code review + design review, 2026-09-18)

> For the worker: one task, apply everything, TDD where code changes, verify with claude-in-chrome at 390 / 700 / 768 / 1440 widths in both themes, keep Lighthouse >= 90. Ordered by severity. Do not change the mark vocabulary or the array metaphor; refine them.

## Layout / UX
- [x] H1 Tablet range (640–1023px): cap the array (`max-w-xs`, left-aligned) below `lg`, or render a 12x1 / 6x2 strip of 40–48px pads; never a ~550px-tall grid of empty squares.
- [x] H2 Phone first viewport (390x812): compact 12-pad strip (24–32px) directly under the hero, legend collapsed to one caption line (full legend via `aria-describedby`/`title`), bio trimmed to 2 lines on mobile, so the first project row is visible without scrolling.
- [x] M1 One source of truth for row state: derive mark + status word + verb from one `kind` (live → filled/"live"/"open"; repo-only → dashed/"coming"/"repo"; showcase → triangle/"case study"/"read"). A "coming" entry never shows "open/read".
- [x] M2 Text/targets: meta text 11px → 12–13px; "repo"/"open"/"read" links get a ≥40px hit area (`-m-2 p-2` or `min-h-10`) with unchanged visual size; footer links likewise.
- [x] M3 Open Graph / Twitter metadata in the Next `metadata` export + `app/opengraph-image.tsx` rendering the array + name.
- [x] L1 Jargon: rename the "signal" chip to "health-checked" (or drop it), keep one stamp line ("updated <date>"), footer line plain English.
- [x] L2 `:target` highlight for `[id^="site-"]` rows after a pad click.
- [x] L3 Placeholder case studies: rows whose `/projects/<slug>` page is still the placeholder link straight to the repo with verb "repo" and status "case study soon"; use `next/link` for internal navigation.
- [x] L4 Count line: "12 sites · 1 live" → "N live · N repos · N case studies" computed from the registry.
- [ ] Hero identity/contact (contact row built and hidden until `lib/site.ts` is filled; hero copy untouched): pending Kalp's answer (see STATUS.md "Needs Kalp"): keep/edit/cut the bio line; add a mono contact row (email / GitHub / LinkedIn) only with the values he gives.

## Code hardening (from code review)
- [x] components/Board.tsx: client health timeout 3000 → 8000 ms (server bound stays 3 s).
- [x] app/api/status/[slug]/route.ts: healthy only if parsed JSON has `ok === true`; `redirect: "manual"` so an SSO 302 is not counted healthy.
- [x] Runbook "Add a project": an `app` `url` must answer 200 unauthenticated before check-in.
- [x] PRODUCT.md / .impeccable: remove "[Inferred from the orchestrator brief…]" style notes; move design working notes under docs/design/ with a one-line header.
- [x] Plan file T0.1 Interfaces block: add "As shipped" note pointing at lib/projects.ts and the runbook schema section.
- [x] README: live URL inline (https://kalpkan.com), "install Node 22 from nodejs.org first", note that showcase entries must omit url/healthUrl.
- [x] Vercel project Node version pinned to 22.x (or CI bumped to 24) so CI and production match.

## Done when
- All boxes ticked, screenshots at four widths x two themes attached in the PR/commit message or docs/images/, `npm test && npm run lint && npm run build` pass, Lighthouse >= 90, deployed to production (https://kalpkan.com), STATUS.md + ops skill updated.

## As executed (2026-09-18, worker)
Commits `6b8081e` (code), `e905bb0` (fonts + deferred PostHog for Lighthouse), `889ef32` (docs, screenshots, ops skill, STATUS). Screenshots in `docs/images/hub-polish/`. Deviations: the count line says "N coming" rather than "N repos" (the same word the rows use, so one vocabulary); `.impeccable/` stays in place because the design tool loads the surface brief from that path, with `docs/design/README.md` as the pointer; the "signal" chip became `health-checked` / `health check failed` / `checking`. Lighthouse: see STATUS.md session log for the measured value and the machine-load caveat.

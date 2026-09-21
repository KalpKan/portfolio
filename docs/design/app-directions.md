# App UI design directions

Art direction for the seven live app subdomains. One audit and two competing directions per app.
Written 2026-09-21 against production, at 1440 and 390, using MengTo's skills
(`design-first-ui-prompting`, `no-ai-design-slop`, `audit-ai-design-slop`,
`build-awwwards-quality-sites`, `animation-systems`, plus the ~80 technique skills at
`~/.claude/skills/mengto/`).

**This is a brief, not a build.** Nothing in any app repo was changed. Kalp picks a lane per app first.

**House rules that bind every direction below.** These are not negotiable and are not repeated in
each spec's CONSTRAINTS unless the app has a specific twist on them:

- $0 hosting. Static or serverless only; no new always-on service, no paid font licence, no paid CDN.
- No Three.js / WebGL on `pushups`, `emotes` or `microtubules` — they already spend the GPU budget on
  MediaPipe / OpenCV.js. Everywhere else, WebGL needs a reason a still image cannot serve.
- `prefers-reduced-motion: reduce` must land on a complete static final state, not a shortened animation.
  Today only `promptflip` does this. Five of seven apps animate with no reduced-motion path at all.
- Keyboard focus visible on every control, one skip link per app, contrast checked at rendered size.
- No copyrighted assets. `emotes` currently ships Supercell PNG/MP3 under the Fan Content Policy with a
  disclosure — every direction below moves the *interface* off those assets and treats them as content
  the page displays, never as the brand.
- Siblings of KalpOS, not clones of it. KalpOS is paper (`#f3f2f2`), frost, a system face, one measured
  cyan, one geometry curve `cubic-bezier(.2,.8,.2,1)`. The apps inherit the *restraint* and the
  *"live" means measured* rule. They do not have to inherit the palette, and three of them should not.

---

## Summary

| App | Slop 1–5 | Primary direction thesis | Alternate thesis | Key MengTo techniques |
|---|---|---|---|---|
| **promptflip** | 2 | **The table, not the app.** A felt surface with one brass coin on it; the whole page is the wager and the flip is the only loud moment. | **The receipt.** A two-column technical split — your prompt, their prompt, the verifiable hash between them. | `high-contrast-skeuomorphic-clean`, `beam-glow-states`, `number-details`, `animation-systems` |
| **hoops** | 4 | **Gym scoreboard.** A matte slab with one lit number, dated and honest, that reads from across the room. | **Shooter's stat sheet.** A paper practice log: a court diagram, a ruled table, no chrome. | `tech-green-dark-mode-modern`, `high-contrast-skeuomorphic-clean`, `number-details`, `beautiful-shadows` |
| **plato** | 5 | **Registrar's ledger.** Warm paper, ruled rows, a serif term header — a document you proof-read and sign. | **The term wall.** A dark 13-week planner grid where every extracted date lands on a square you can see. | `light-mode-paper-technical`, `book-serif-index`, `container-lines`, `number-details` |
| **plantit** | 4 | **Nursery tag.** A warm card stock label per plant — species, water, light — with the photo doing the work. | **Greenhouse instrument.** A dark bench panel where the moisture dial is a real gauge, not a progress bar. | `clean-minimal-beige-light-mode`, `image-first-grid-layout`, `number-details` |
| **pushups** | 2 | **Gym mirror.** The video is the page; the count, the verdict and the fault live on the glass as a HUD. | **Coach's clipboard.** Light paper; the camera is a pinned photo and the reps are a marked-up rep sheet. | `technical-wireframe-info-layout`, `beam-glow-states`, `number-details`, `animation-systems` |
| **emotes** | 3 | **Your own arena.** An original purple-and-gold cartoon stage, drawn here, where the emote is the payload. | **Broadcast booth.** A dark control-room split: live feed left, three confidence meters right, on air. | `funky-purple-container-tech`, `skeuomorphic-ui`, `corner-diagonals`, `beam-glow-states` |
| **microtubules** | 2 | **Lab bench.** Neutral paper and rules so the specimen's green is the only green on the page. | **Viewfinder.** A dark room with reticle brackets: the image is lit, the chrome is not. | `light-mode-paper-technical`, `framed-grid-layout`, `container-lines`, `number-details` |

**Score key.** 1 = specific and disciplined; 5 = a generic template wearing this product's words.
Score is a triage aid for Kalp's ordering, not a design verdict — `audit-ai-design-slop` forbids
publishing a numeric taste score as the finding, so every row above is backed by evidence below.

**The systemic finding across the portfolio.** Four of the seven (`hoops`, `plato`, `plantit`, and to a
lesser degree `promptflip`) are the same page: near-black background, 14–18 px-radius cards on a slightly
lighter panel, a single saturated accent, a three-up "How it works" row of icon-tile + heading +
description, and a headline that could be swapped between them without anyone noticing. Three of the
seven use a green accent. Two of them (`hoops`, `plantit`) name Inter in CSS and never load it, so they
render in the same system face as the other five — the "different apps" are not even different
typefaces. **Fixing this is worth more than any single app's redesign: give at least three of them a
non-dark ground.** `plato`, `plantit` and `microtubules` are the three that gain most from light.

---

## 1. promptflip — https://promptflip.kalpkan.com

*Repo `~/projects/promptflip` · Next.js 16 App Router, Tailwind v4 CSS-first `@theme`, next-themes.
Has its own `DESIGN.md` (codename "Instrument").*

### Audit (`audit-ai-design-slop`)

**Verdict.** This is the most mature of the seven — real theme toggle, real reduced-motion handling, a
skip link, a hand-rolled UI kit, and a genuinely good `/how-to` page built from real OpenRouter
screenshots. The problem is not slop in the parts, it is that the *idea* is missing from the first
viewport: a game about a coin flip opens with an empty right half and no coin. The coin exists — it is
fully built in `src/components/coin/coin.css` with brass and ice faces and seven keyframes — and the
lobby never shows it. Remove the second accent colour and put the coin on the table.

**Checked scope.** `/` lobby (signed out) at 1440 and 390, `/how-to` at 1440, nav a11y tree, theme
toggle present. Not checked: `/flip/[id]` room, `/flip/[id]/verify`, `/history`, `/keys` (all behind
Google sign-in).

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Slop pattern | Hero with no subject | At 1440 the hero occupies x≈243–675 of a 1440 viewport; the right 55 % of the first viewport is empty `#0a0e13`. The product's one image — the coin — is never shown. | The page cannot explain itself above the fold; "Tails, you pay." reads as a slogan with nothing to anchor it. | Put the existing `Coin.tsx` in the hero at rest (static, brass face up). It is already written and already reduced-motion-safe. |
| P1 | Quality defect | Competing primary actions | Three sign-in affordances in one viewport: nav "Sign in" (`/login`), hero "Sign in with Google" (`/login`), and "Sign in to create" (`/login?next=/flip/new`) — plus "Never used OpenRouter? Start here" styled as an underlined link beside the primary button. | Four things to click, two of which go to the same URL; the eye has no single target. | Keep one primary ("Sign in with Google", hero) and demote the nav one to text. "Sign in to create" restates it — delete it and let the empty-state card carry the CTA. |
| P2 | Slop pattern | Two accents, no roles | The brand mark is brass `#e8b93c`; the step numerals `1 2 3`, the primary button and the "live" dot are ice cyan `#3cd3fe`. Both read as "the accent". | Neither colour means anything; the coin's own brass identity is contradicted by the button that starts the game. | One accent rule: brass = the coin and the wager; cyan = system/interactive only (or drop cyan for brass entirely in the lobby). Tokens already exist in `globals.css`; this is a reassignment, not a new palette. |
| P2 | Slop pattern | Status pill with no data | "0 waiting • live" with a coloured dot, on an empty table. | Signals liveness where there is none — the KalpOS "measured accent" rule says the opposite. | Make the dot static when the count is 0, or drop the word "live" and let "0 waiting" stand. |
| P3 | Quality defect | Measure inconsistency on `/how-to` | Prose column ≈ 800 px left-aligned; the embedded OpenRouter screenshot cards are centred at a different width and the first one is ≈ 735 px while the divider runs the full 800. | Small but visible ragged left edge down a long page. | One measure for prose and figures. |

**Largest single improvement:** show the coin in the hero.

### Primary direction — "The table, not the app"

> **Visual thesis.** The page is the felt the wager sits on: one brass coin, two prompts face-down, and
> a single tense second where nobody can act.

```text
GOAL
- Lobby + flip room for a two-player prompt wager settled by a provably fair coin flip.
- For: Kalp and his friends, each bringing their own OpenRouter key; strangers second.
- Success: a signed-out visitor understands "two prompts, one coin, loser's key pays" from the first
  viewport without reading the three numbered steps; the flip itself feels worth waiting for.

FORMAT
- Responsive web, 1440 reference, 390 floor. No fixed canvas.
- Page gutter 24px mobile / 48px desktop; content max-width 1120px; the flip room narrows to 720px.

LAYOUT (wireframe in words)
- Hero: 7/5 asymmetric split, NOT centred. Left 7 cols: h1 "Tails, you pay.", one-line sub, the three
  numbered steps as a single ruled row, one primary button. Right 5 cols: the coin, at rest, brass face
  up, ~280px, sitting on its own shadow with nothing behind it.
- Below one full-bleed hairline rule: "Open flips" as a TABLE, not cards — columns Model / Tier /
  Stake / Waiting, one row per flip, the row is the click target.
- Flip room: the coin is the page. Two prompt panels sit left and right of it, both face-down until the
  flip resolves; the verify hash sits under the coin in mono.
- Hierarchy H1 -> coin -> primary CTA -> steps -> table.

TYPE SYSTEM
- Keep Archivo (--font-sans) and JetBrains Mono (--font-mono) exactly as loaded by next/font today.
- H1 Archivo 700, --text-3xl, leading 1.05, tracking -0.02em. Sub Archivo 400 --text-base at ink-2.
- Steps: the numeral in mono 600 brass at --text-2xs, the label in sans 400 ink-2. The numeral is the
  only decoration the steps get.
- Mono is reserved, as today, for hashes, keys, stakes and the verify line. Never for section labels.
- --text-numeral (6rem) is spent once per screen: the flip result.

COLOR + MATERIAL
- Keep the existing dark ground bg #0a0e13 / bg-2 #12181f / line #232c36 and the light theme as shipped.
- ONE accent, and it is brass: --brass #e8b93c for the coin, the wager, the winning side, the CTA border.
  Cyan --accent #3cd3fe demotes to a system colour: focus rings and links only.
- felt #30d158 / ember #ff6b57 keep their semantic jobs (won / lost) and appear nowhere else.
- Material: the coin is the only object with real depth — a two-stop metal gradient (--coin-hi #ffe9a3
  -> --coin-mid #e2b53c -> --coin-lo #77570d) and a single contact shadow. Everything else is flat
  surface + 1px line. No glass, no glow on cards.
- Texture: a very low-contrast felt grain (<=2% alpha, CSS-only) on the page ground so the coin has
  something to sit on. If it is visible as "noise", it is too strong.

IMAGERY / UI STYLE
- Minimal + one skeuomorphic object. The coin is the only rendered thing; it is CSS, already built.
- The /how-to page keeps its real OpenRouter screenshots at one measure, one crop rule, one caption style.
- Icons stay lucide-react at current stroke; no icon tiles, no icon in a rounded square, ever.

COPY (render EXACTLY, these are already live and already good)
- "Tails, you pay."
- "Two prompts walk in. One gets answered. The other one buys."
- "Bring an OpenRouter key" / "Bet a prompt against a stranger" / "Coin lands, winner reads, loser pays"
- "Sign in with Google"
- "Never used OpenRouter? Start here"
- Empty table: "The table is empty." / "Nobody's put a coin down yet. Be the one they all have to beat."

CONSTRAINTS
- FONT: Archivo + JetBrains Mono (already loaded — do not add a third)
- STYLE: skeuomorphic-object-on-flat-surface
- MODE: dark default, light theme must stay complete (both are shipped today)

NEGATIVE PROMPT
- No second hero illustration, no abstract SVG, no gradient blob behind the coin.
- No glass cards, no purple, no cyan-on-dark "futuristic" treatment.
- No casino iconography beyond the coin itself: no chips, no cards, no dice, no neon, no green felt
  cliché rendered literally.
- No new colour, radius, shadow or font token outside globals.css.
- No fake player counts, no invented leaderboard, no "1,204 flips today".
```

**MengTo techniques, and exactly where.**
- `high-contrast-skeuomorphic-clean` — **only** on the coin and on the flip room's result slab: molded
  surface, crisp light separation, tactile inset. The rest of the page stays flat.
- `beam-glow-states` — the *"deciding"* state. Between "both prompts in" and "the coin lands", the flip
  panel's edge carries one animated brass beam. This is the one place a glow is earned, because it is
  the only moment in the product where the user must wait and cannot act. CSS/`border-beam`; it must be
  a static brass hairline under reduced motion.
- `number-details` — the `1 2 3` step numerals in the hero and the flip's sequence number in the room
  (`flip #0142`). Both already have real content; this just gives them a consistent treatment.
- `animation-systems` — the flip choreography: coin first (800–1200 ms, one hero beat), result numeral
  second (+120 ms), the winner's prompt panel opening third (+200 ms). `coin.css` already has the
  keyframes and the `prefers-reduced-motion: reduce { animation: none !important }` guard; this is
  ordering, not new motion.

**Do NOT use:** `webgl-laser`, `dither-laser-dark-mode`, `mesh-gradient-dark-blue-clean`,
`atmosphere-background`, `threejs*`, `globe-*`, `ambient-section-particles`, `gooey-blob-system`. A coin
flip does not need a shader; `canvas-confetti` on a win is already there and is already enough.

**Kept from today:** the whole `/how-to` page (real screenshots, honest prose, numbered sections); the
Archivo + JetBrains Mono pairing; the `globals.css` token set and both themes; `Coin.tsx` + `coin.css`
in full; the skip link, the `focus-visible:outline-2 outline-offset-2 outline-accent` convention, the
`useReducedMotion` hook and the `prefers-reduced-transparency` block; all lobby copy quoted above.

**Primary action:** *Sign in with Google* while signed out; *Put a coin down* (create a flip) once
signed in. Exactly one of these is the visually strongest control on the lobby at any time.

**Mobile (390):** the split collapses to coin-above-headline, not headline-above-coin — the object is
the hook. The three steps go from a row to a 3-row ruled list (they already wrap correctly). The Open
flips table becomes one row per card with Model + Tier on line 1 and Stake + Waiting in mono on line 2;
do not re-introduce a card shell for it. The coin caps at 200 px so the CTA stays above the fold.

### Alternate direction — "The receipt"

> **Visual thesis.** A provably fair bet is a document: two prompts, one hash, one outcome — printed,
> auditable, and impossible to argue with.

```text
GOAL
- Same product, but the trust story leads instead of the game story: the flip is verifiable, and the
  interface looks like the proof.
- Success: a stranger believes the flip is fair before they sign in.

FORMAT
- Responsive web, 1440 / 390. Content max-width 1240px (wider — it is a two-column document).

LAYOUT
- Strict 12-col with visible container lines. Hero is a single full-width band: h1 left, the commit
  hash and the seed in mono right, on the same baseline, separated by a vertical rule.
- The page's spine is a permanent two-column split: LEFT = your side, RIGHT = theirs. It persists from
  the lobby (your record vs the table) into the flip room (your prompt vs theirs) into verify (your
  seed vs the server's). Same geometry every time, so the user learns the room.
- The coin is small and lives in the gutter between the columns, as a 64px seal at the split point.
- Open flips is a dense mono table with a rule between every row.

TYPE SYSTEM
- Archivo for headings only; JetBrains Mono carries ALL data, labels and the table. This is the inversion
  of the primary direction and is the whole point.
- H1 Archivo 700 --text-3xl. Every label is mono 400 --text-2xs uppercase, tracking 0.06em — used
  sparingly enough that it stays a signal (max 1 per column header, never above a heading).
- Body Archivo 400 --text-base, measure capped at 68ch.

COLOR + MATERIAL
- Ground stays dark; --line #232c36 becomes structural and visible, not incidental.
- One accent: cyan --accent #3cd3fe, because this direction is about instrumentation, not metal. Brass
  retracts to the coin seal alone.
- felt/ember keep won/lost. No third colour.
- Material: no depth at all. Rules, insets and a 1px border define everything. The only shadow in the
  product is --shadow-overlay on dialogs.

IMAGERY / UI STYLE
- Technical/editorial. No objects, no illustration. The proof IS the imagery: the hash, the seed, the
  timestamp, the model id, rendered large enough to read.

COPY
- Keep "Tails, you pay." as the h1. Add one line under the hash: "Both seeds were committed before
  either prompt was written." (only if that is literally true of the implementation — verify in
  src/app/flip/[id]/verify before shipping it).

CONSTRAINTS
- FONT: Archivo + JetBrains Mono, mono-dominant
- STYLE: technical document
- MODE: dark default, light complete

NEGATIVE PROMPT
- No skeuomorphism anywhere, including the coin (it becomes a flat seal).
- No mono micro-labels sprinkled decoratively — every mono label must name a real field.
- No "trust badges", no shields, no lock icons, no security theatre.
```

**MengTo techniques, and exactly where.**
- `split-layout-technical` — the persistent you/them spine across lobby, room and verify.
- `container-lines` — the 1240px container's vertical guides with corner squares, which is what makes
  the document read as ruled rather than empty.
- `framed-grid-layout` — L-brackets on the verify panel only, so the one page that proves fairness is
  visibly framed off from the rest.

**Do NOT use:** `high-contrast-skeuomorphic-clean`, `skeuomorphic-ui`, `beam-glow-states`,
`liquid-metal-border`, any WebGL skill. This direction's credibility comes from having no effects.

**Kept from today:** identical to the primary direction — `/how-to`, tokens, both themes, a11y
scaffolding, all copy. `Coin.tsx` survives but renders flat at 64 px.

**Primary action:** *Verify this flip* is the loudest control in the room after a result; *Sign in with
Google* on the lobby.

**Mobile (390):** the two-column spine cannot survive 390. It becomes a stacked pair with a heavy rule
and a persistent "YOU / THEM" mono label above each half — the labels are what carry the metaphor when
the geometry cannot. Mono tables get one row per record, never a horizontal scroller.

---

## 2. hoops — https://hoops.kalpkan.com

*Repo `~/projects/basketball/apps/web` · Next.js 15, Tailwind v3, Supabase. Single route, two tabs.*

### Audit (`audit-ai-design-slop`)

**Verdict.** There is one genuinely excellent thing on this page — the top-down shot map, with the rim
as a glowing ring and made/missed dots scattered against it. It is product-specific, honest and drawn
from real coordinates. Everything around it is a stock dark dashboard, and two things around it are
actively dishonest: a red pulsing **LIVE DATA** badge over four sessions whose most recent is three days
old, and a stat table whose session names are the developer's own test artifacts. Remove the badge and
rename or relabel the sessions before touching anything visual.

**Checked scope.** `/` Analytics tab and Shot Map tab at 1440; `/` at 390 (iframe-rendered). Both tabs
scrolled to the footer.

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P0 | Slop pattern | Fake liveness / deceptive proof | A `LIVE DATA` pill with an `animate-ping` red dot sits top-right on both tabs. The sessions behind it are Apr 15, Apr 15, Apr 16 and Sep 18; today is Sep 21. The page's own disclaimer, in 12px grey directly below, says "The iPhone capture app is not available yet. These sessions were recorded through the ingest API for testing." | The loudest signal on the page contradicts the page's own fine print. Under KalpOS's Measured Accent Rule this is exactly the thing not to do. | Delete the pill and the ping. Replace with a static, honest line at the same position: "Last session Sep 18 · 4 sessions · 72 shots". The disclaimer is good and should move up to sit with it, not below the tabs. |
| P1 | Quality defect | Test artifacts presented as product data | Session filter pills and the Session History table read "Apr 15 · shootit-ios-manual-test", "Apr 15 · Frontend Backend Smoke Test", "T1.1 sample". The chart's x-axis labels are those same strings, truncated to "Apr 1…" at 390. | The whole dataset looks like a staging environment. It also makes the impressive numbers (75.0 %, best streak 30) read as fabricated. | Either give the sessions human names in the data, or show only the date and move the internal name to a `title`. Label the set honestly: "Test captures from the ingest API". |
| P1 | Slop pattern | Card apocalypse + nested cards | Every block is a rounded panel: the logo+title lockup, each of 4 metric tiles, "Progress" (which then contains a second rounded card holding the chart), "Key Metrics", "Session History" (which contains a bordered table). Radii drift 12–24 px between them. | Nothing is emphasised because everything is. The chart is two containers deep for no hierarchical reason. | Delete the outer shells on Progress, Key Metrics and Session History; keep spacing + one hairline rule between sections. Keep card treatment only on the 4 metric tiles, where it separates peer values. |
| P2 | Slop pattern | Arbitrary selected state | The "Field Goal %" metric tile has a green border and green-tinted background; the other three do not. Nothing on the page explains why FG% is selected, and clicking it does nothing. | A selected state that is not selectable teaches the user the wrong affordance. | Remove the border/tint, or make the tile actually drive the Progress chart (it already has FG% / eFG% / Streak toggles — wire the tiles to them and the state becomes real). |
| P2 | Quality defect | Redundancy + colour-only state | 72.2 % appears three times (Overview tile, Shot Map "Made rate", and implicitly as the Analytics figure); "Miss rate 27.8 %" is arithmetically 100 − 72.2 and adds nothing. The chart prints each bar's value above the bar *and* keeps a 0–100 % labelled axis *and* dashed gridlines. Best Streak values in the table are coloured green with no legend. | Repetition flattens hierarchy; the triple-labelled chart is noisier than the four numbers it carries. | Drop "Miss rate". Keep either the axis or the printed values, not both, and drop the dashed gridlines. Give streak a non-colour cue (weight, or a "×" glyph) alongside the colour. |
| P3 | Quality defect | Missing reduced-motion + unlabelled brand | `animate-ping` and heavy `backdrop-blur-xl` run with no `prefers-reduced-motion` guard anywhere in the app. The brand mark is a 🏀 emoji inside a rounded-square tile. | Motion discomfort; an emoji in a tile is the canonical AI-default logo. | Guard the ping (or delete it per P0). Replace the emoji tile with a drawn mark — a rim-and-net glyph in the same line weight as the shot map's rim would tie the brand to the one good asset. |

**Largest single improvement:** delete the LIVE DATA pill.

### Primary direction — "Gym scoreboard"

> **Visual thesis.** A mini-hoop in a bedroom deserves a real scoreboard: a matte slab where one number
> is lit, the date is stamped, and nothing else asks for attention.

```text
GOAL
- A personal shooting log Kalp reads after a session, on a laptop or a phone propped on the desk.
- For: Kalp, alone. There is no audience, no sharing, no "team". Design for one returning reader who
  already knows what FG% means.
- Success: from across the room he can read today's make count and whether it beat last time.

FORMAT
- Responsive web, 1440 / 390. Content max-width 1120px, gutter 24/48.
- The scoreboard band is full-bleed; everything below it is inside the container.

LAYOUT
- Band 1 (full-bleed, ~200px): the scoreboard. Left: MADE / ATTEMPTS as one huge fraction. Centre:
  FG% at the same optical weight. Right: BEST STREAK. Under the band, one mono line: the session date,
  the shot count, and the honesty note. No card, no border — the band's darker ground IS the container.
- Band 2: the shot map, promoted out of its tab to sit directly under the scoreboard at 1440. It is the
  best asset in the app and it is currently one click away.
- Band 3: Progress — one bar per session, on a baseline, no card, no gridlines, no printed values;
  the hovered/focused bar reveals its value in the band's own mono line.
- Band 4: Session History as a plain ruled table, full container width, no shell.
- "Key Metrics" becomes a <details> at the foot titled "How these are calculated" — it is a glossary,
  not a feature.
- Tabs (Shot Map / Analytics) disappear at 1440 because everything fits on one scroll; they survive at
  390 as a two-item segmented control.

TYPE SYSTEM
- Actually load one face. Inter is named in tailwind.config.ts and globals.css and never imported —
  either import it (variable, self-hosted, latin subset) or delete the name and own the system stack.
  Recommend: self-host Inter Variable; it is free, it is what the CSS already claims, and it gives the
  tabular figures this app lives on.
- Add ONE mono for the score readouts and the table: JetBrains Mono or Geist Mono, latin subset,
  weights 400/600 only.
- Scoreboard fraction: mono 600, clamp(56px, 9vw, 104px), tabular-nums, tracking -0.02em, leading 0.9.
- Metric labels: sans 500 11px uppercase tracking 0.08em at muted. Section heads: sans 600 20px.
- Table: mono 400 13px for all numerals; sans 400 13px for names. Every numeric column right-aligned.

COLOR + MATERIAL
- Keep the existing matte ground: bg #050505, panel #0b0b0b, line #1d1d1d. This part is right.
- ONE accent: the existing emerald #23c552 — but it means exactly one thing: a shot that went in.
  It appears on made dots, on the made count, and nowhere else. Streak stops being green.
- The rim keeps #ff6f55 — it is the hoop, it is not an accent, and it should be the only warm thing.
- Kill the glow: the rim's current drop-shadow halo is ~40px of orange bloom. Cut it to a tight 6px
  or remove it; the ring reads fine as a solid stroke.
- Material: matte, not glass. Replace `backdrop-blur-xl` + inset-highlight panels with flat #0b0b0b and
  a 1px #1d1d1d rule. The only depth is the scoreboard band, which sits 1px proud on a top highlight.

IMAGERY / UI STYLE
- The shot map is the imagery. Nothing else is added.
- Brand mark: an original drawn rim + net glyph (two arcs and four net lines) at the same stroke weight
  as the shot map rim. No emoji, no icon tile, no photograph of a basketball.

COPY (render EXACTLY where quoted, these are live today and honest)
- "Hoops Analytics" / "Mini-hoop shooting sessions, shot by shot"
- "Top-down view of where shots landed in the basket"
- "The iPhone capture app is not available yet. These sessions were recorded through the ingest API
  for testing." + "Source and API on GitHub"
- "23 shots with an invalid timestamp hidden"
- New, replacing the LIVE DATA pill: "Last session Sep 18 · 4 sessions · 72 shots"

CONSTRAINTS
- FONT: Inter Variable (self-hosted) + one mono
- STYLE: matte scoreboard
- MODE: dark only (keep — a scoreboard is dark, and this app has no light theme to preserve)

NEGATIVE PROMPT
- No LIVE badge, no pulsing dot, no "real-time" language.
- No glassmorphism, no backdrop-blur, no inset white highlights.
- No card around anything that is not a peer-value tile.
- No invented sessions, no seeded demo data, no projected trend line, no "you're improving!" copy.
- No team sports iconography: no jerseys, no courts Kalp does not have, no NBA reference.
```

**MengTo techniques, and exactly where.**
- `tech-green-dark-mode-modern` — as the discipline for what is already here: matte-black surfaces,
  emerald as a *signal* accent, mono system labelling, restrained glow. Apply its rules to the whole
  page, especially "restrained glow" on the rim.
- `high-contrast-skeuomorphic-clean` — **only** the scoreboard band: molded dark surface, one crisp
  light separation at the top edge, tactile inset for the number well. Nothing else on the page.
- `number-details` — session numbering in the Session History table (`01 02 03 04`, mono, muted) so the
  rows have an ordinal that is not the raw date string.
- `beautiful-shadows` — exactly one layered elevation, on the scoreboard band. Every other surface is
  shadowless.

**Do NOT use:** `glass-dark-ui`, `dark-glass-clean-layout`, `blue-laser-clean-glass-layout`,
`webgl-laser`, `corner-lasers`, `beam-glow-states`, `mesh-gradient-dark-blue-clean`, any particle or
Three.js skill. The current build's `backdrop-blur-xl` is already the wrong material and adding a laser
to a shooting app would be a pun, not a design.

**Kept from today:** the shot-map SVG and its geometry, the made/miss dot colours and the `<title>` per
shot, the eFG% and Consistency definitions and their honest explanatory copy, the disclaimer sentence
and the GitHub link, the "23 shots with an invalid timestamp hidden" caveat, `tabular-nums`, the
`role="img"` / `aria-label="Shot map"` labelling, the session filter concept.

**Primary action:** there is no write action in this app — it is read-only. So the primary *element* is
the scoreboard's make count, and the primary *control* is the session filter. Nothing else should
compete with those two.

**Mobile (390):** the scoreboard band stacks to two rows — fraction on row 1 at clamp minimum, FG% and
streak sharing row 2. Session filter pills become a horizontally scrollable row with a visible fade mask
(`css-alpha-masking`) and a left gutter that is never lost. The Progress chart keeps 4 bars but drops
the x labels to a legend below, because "Apr 1…" truncation is worse than no label. The Session History
table becomes one block per session (Date + name on line 1, the five numerals in a mono row on line 2),
not a horizontal scroller.

### Alternate direction — "Shooter's stat sheet"

> **Visual thesis.** A practice log on paper: a court diagram you mark up, a ruled table, and a pencil
> line of progress — the thing a coach would actually hand you.

```text
GOAL
- Same read-only log, but light, printable, and calm. It is a record, not a broadcast.
- Success: the page prints to one clean A4 page and reads the same on paper as on screen.

FORMAT
- Responsive web, 1440 / 390, plus a real print stylesheet (this direction earns one).
- Content max-width 980px — a sheet, not a dashboard.

LAYOUT
- Sheet header: "Shooting log" left, date range right, one rule under both.
- Two-column body at 1440: LEFT 5 cols = the court/rim diagram, drawn as a technical figure with the
  dots as small open/filled circles. RIGHT 7 cols = the numbers, as a definition list, not tiles.
- Progress is a single thin line chart on a ruled baseline, x = session, y = FG%, with the four points
  marked. No fill, no glow, no gridlines beyond the baseline and a 50% reference rule.
- Session History is the page's spine: a full-width ruled table, alternating row tint at 2% ink.
- Glossary moves to a marginal note column at 1440 and a <details> at 390.

TYPE SYSTEM
- One serif for the sheet header and section names (Newsreader — free, Google Fonts, and specifically
  the "one type move that signals taste" this app currently has none of).
- One sans for body and labels (Inter, self-hosted).
- One mono for every numeral (tabular).
- Serif h1 600 32px; sans body 14/1.55; mono 13 tabular for all data; labels sans 500 11 uppercase 0.06em.

COLOR + MATERIAL
- Warm paper ground #faf8f5, sheet white #ffffff, ink #1a1a19, rule #ddd8d2.
- ONE accent: the rim orange #d4502e — used for the rim arc and for a made shot's fill. Misses are open
  circles, not red. Colour carries one meaning and shape carries the other, so the diagram survives
  greyscale printing and colour-blind reading.
- No shadows at all. Rules and tint only.
- Texture: none. Paper is the tone, not a noise layer.

IMAGERY / UI STYLE
- Technical figure style: the rim diagram becomes a measured drawing with a scale note, not a glowing ring.
- No icons at all except the one drawn rim mark.

COPY
- Keep every honest string from today. Add a sheet subtitle: "Mini-hoop, bedroom, no calibration."

CONSTRAINTS
- FONT: Newsreader + Inter + one mono
- STYLE: printed stat sheet
- MODE: light only (this is a real divergence from today and from the primary direction — pick one)

NEGATIVE PROMPT
- No dark mode retrofit; if it needs dark, pick the primary direction instead.
- No cards, no pills, no badges, no rounded corners above 4px.
- No colour-coded "good/bad" numbers.
```

**MengTo techniques, and exactly where.**
- `light-mode-paper-technical` — the whole page: warm paper surface, precise bracketed geometry,
  restrained accent signals.
- `framed-grid-layout` — L-corner brackets around the rim diagram only, marking it as a figure.
- `container-lines` — the 980px sheet's vertical guides, which is what makes it read as a ruled form.
- `split-layout-technical` — the 5/7 figure-and-data split at 1440.

**Do NOT use:** `tech-green-dark-mode-modern`, `glass-dark-ui`, `beautiful-shadows`, `beam-glow-states`,
anything WebGL. This direction has no elevation model at all.

**Kept from today:** the shot coordinates and their semantics, all metric definitions and the honest
explanatory copy, the disclaimer, the caveat line, the session filter, `tabular-nums`, the SVG a11y
labelling.

**Primary action:** the session filter; plus a genuinely useful new one this direction unlocks — *Print*.

**Mobile (390):** the sheet is already one column, so this direction degrades best of the two. The rim
figure goes full-width at the top, the definition list becomes two columns of label/value, and the table
becomes one ruled block per session. The margin-note glossary folds into `<details>`.

---

## 3. plato — https://plato.kalpkan.com

*Repo `~/projects/plato` · Flask + Jinja2 + vanilla JS, Lucide via CDN. Routes `/`, `/review`, `/manual`.*

### Audit (`audit-ai-design-slop`)

**Verdict.** Two different products are wearing one domain. `/review` and `/manual` are a real, dense,
honest tool — amber "Not found" fields, a "Needs a date" flag, a plain-spoken warning about labs living
on draftmyschedule — and they are the reason anyone would use this. `/` is a stock generated SaaS
landing page bolted on in front of them: tracked pill eyebrow, an oversized centred sentence headline, a
blue gradient CTA, a decorative fake-calendar background, three interchangeable icon-tile feature cards,
and an animated "workflow" diagram that is visibly broken. Delete the landing page's marketing layer and
let the tool start at the top of the page.

**Checked scope.** `/` at 1440 and 390, `/review` at 1440 (four scroll positions), `/manual` at 1440.

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Quality defect | Broken decorative diagram | In "How It Works" the connector diagram renders two nodes ("Course Outline", "Processing") and **two** connector lines — the second line runs right and terminates in a floating dot attached to no third node. The three real steps are then repeated in full, immediately below, as icon cards. | A visibly incomplete graphic is the first interactive-looking thing on the page, and it duplicates the content beneath it. | Delete the diagram entirely. The three cards below already say it, and the real three-step proof is the `/review` screen. |
| P1 | Slop pattern | Generic AI-SaaS hero cluster | All five markers in one viewport: pill eyebrow "Automatic Course Calendar Generation" with a calendar icon, centred 2-line sentence headline "From Course Outline to Calendar in Seconds", centred 2-line sub, one blue gradient CTA "Get Started", and a decorative faux-calendar grid behind with fabricated "Lecture 1" / "Assignment 1" chips. | The pill restates the headline restates the sub. The fake calendar chips are invented product evidence. The whole first viewport could be pasted onto any scheduling startup. | Remove the pill and the fake-calendar background. If a hero image is wanted, use a real cropped screenshot of the `/review` screen — the product has a genuinely good screen and is hiding it. |
| P1 | Slop pattern | Card apocalypse on the real screen | `/review` renders each of 9 assessments as its own rounded card containing a full-width text input, a % and a date. One card ("Final Exam") additionally carries a thick amber left stripe plus a "Needs a date" pill. The four summary figures sit in tiles inside an outer card. | Nine cards to express nine rows of a table. The reader cannot scan weights or dates down a column, which is the entire task. | Flatten to a ruled table: Name / Weight / Date / (flag). Keep the amber, but as a row tint + the pill, not a stripe on a card. Drop the outer shell around the four figures. |
| P2 | Quality defect | Two unrelated visual languages | `/` is centred, 1080px, marketing-spaced, gradient-accented. `/review` and `/manual` are left-aligned, ~1000px, dense, form-styled, with a small "Plato / Course outline to calendar" lockup that does not appear on `/` at all. | The tool feels like a different site than the page that sold it; the brand lockup is missing exactly where a first-time visitor is. | One layout, one header, one measure across all three routes. |
| P2 | Quality defect | Unguarded motion | style.css defines `modalSlideIn`, `calendarPulse`, `workflowStep1/2/3`, `rotateProcessing`, `processingPulse`, `arrowLine1/2`, `arrowParticle1/2` plus ~30 `transition: all` rules, and contains **no** `prefers-reduced-motion` block. Two of those keyframes drive perpetual animation in the hero. | Perpetual motion behind a headline, with no opt-out, on a page students will read while stressed about deadlines. | Add the media query; under reduce, render all final states. Most of these keyframes belong to the diagram being deleted anyway. |
| P2 | Quality defect | Confusing summary copy | `/review` top band reads "100% / OF 100% FOUND (+1.0 BONUS)" and "1 / 0 / 0 / LECTURE / LAB / TUTORIAL SLOTS". | The most important reassurance on the page ("did it find everything?") is expressed as an unparseable fraction. | Rewrite as sentences: "All 9 assessments found — weights total 101 %." / "1 lecture slot, no lab, no tutorial." |
| P3 | Quality defect | Thin accessibility | One `role="alert"` in the whole app. No skip link, no aria-live on the upload progress ("Reading your outline… this takes 10–25 seconds on the free hosting"), no custom focus-visible. | A 25-second async operation with no announced status. | `aria-live="polite"` on the progress line; a skip link; a visible focus ring token. |

**Largest single improvement:** delete the hero's fake-calendar background and the broken workflow
diagram, and put a real `/review` screenshot in their place.

### Primary direction — "Registrar's ledger"

> **Visual thesis.** A course outline is a legal-ish document, and this is the clerk's ledger you proof
> it against before you sign: warm paper, ruled rows, a serif term header, and a stamp where something
> is missing.

```text
GOAL
- Turn a PDF course outline into a checked .ics. Three screens: drop the PDF, proof the extraction,
  download the file.
- For: a Western undergrad at the start of term, doing this once per course, four times in an evening,
  probably on a laptop, in a hurry, and slightly anxious about missing a deadline.
- Success: the user can scan nine assessment rows and spot the one with no date in under three seconds,
  and trusts the .ics enough to import it without re-checking the PDF.

FORMAT
- Responsive web, 1440 / 390. Sheet max-width 900px for the ledger; 1080px for the drop screen.
- Generous top margin (96px) so the sheet reads as a page, not a viewport.

LAYOUT
- One header on all three routes: the "Plato / Course outline to calendar" lockup left, the current step
  right as "1 Upload · 2 Review · 3 Download" with the active one in ink and the rest at 45%.
- Screen 1 (/): no marketing. The drop zone IS the hero — a full-measure ruled rectangle at the top of
  the page with the sample constraints under it, and one real, cropped, captioned screenshot of the
  review ledger beside it at 1440 to show what happens next.
- Screen 2 (/review): the ledger. A masthead block (course code, name, term, first/last day) as a
  definition grid with hairline rules. Then ONE table: Assessment / Weight / Date / Flag, ruled between
  every row, right-aligned numerals, the total weight in the footer row. Slots (lecture/lab/tutorial)
  are a second, three-row table above it, not three separate cards.
- Screen 3: the download, as a single confirmation block naming the file, the event count and the range.
- No section is a card. Ever. Grouping is rules and spacing.

TYPE SYSTEM
- ONE serif for course names, the sheet masthead and section heads: Newsreader (Google Fonts, free,
  self-host the latin subset). This is the type move; it is what makes it a ledger and not a dashboard.
- ONE sans for controls, labels and helper text: Inter or the system stack (the app has no webfont today,
  so adding exactly one is affordable).
- ONE mono for dates, weights, times and the file name: JetBrains Mono, tabular.
- Masthead course name: serif 600 30/1.1. Section head: serif 600 19. Table body: sans 400 14/1.5,
  numerals mono 13 tabular. Field labels: sans 500 11 uppercase tracking 0.06em, used only as column
  headers and form labels — never as an eyebrow above a heading.

COLOR + MATERIAL
- Invert to light. Paper #faf8f4, sheet #ffffff, ink #1c1a17, ink-2 #5c574f, rule #e0dad0.
- ONE accent, and it is the flag colour: amber #9a6a00 on a #fff6e0 row tint, used exclusively to mark
  "Plato could not read this — you must check it." It appears nowhere decorative.
- One secondary, blue #1f5fbf, for links and focus only. The current #2563eb gradient CTA becomes a flat
  solid; gradients leave the product.
- Material: paper. No shadows except a 0 1px 2px lift under the sticky header once scrolled. No glow
  (`--shadow-glow: 0 0 24px rgba(59,130,246,0.15)` is deleted).

IMAGERY / UI STYLE
- Two real screenshots total, both of Plato's own review screen, cropped tight, captioned, at one
  aspect ratio. No illustration, no fake calendar, no abstract SVG, no device mockup.
- Icons: keep Lucide but drop to 1.5px stroke at 16px, inline with text, never in a rounded tile.
  Delete every icon that sits above a heading.

COPY (render EXACTLY where quoted, these are live and good)
- "Plato" / "Course outline to calendar"
- "Drag and drop your course outline here" / "PDF only, up to 4 MB. Not a PDF, or a scan?
  Enter the course by hand."
- "Review & Confirm" / "Check every date against your outline; click any highlighted field to correct
  it. Your edits are saved for you only."
- "What could not be read from the PDF"
- "Reading your outline… this takes 10–25 seconds on the free hosting."
- "No lab time was found in the outline (labs are usually only on draftmyschedule.uwo.ca). Add one if
  you have a lab."
- "Generate calendar"
- "This tool is not affiliated with Western University" / "Developed by Kalp Kansara"
- REWRITE (currently unparseable): "100% OF 100% FOUND (+1.0 BONUS)" -> "All 9 assessments found.
  Weights total 101 %." ; "1 / 0 / 0 LECTURE / LAB / TUTORIAL SLOTS" -> "1 lecture slot. No lab, no
  tutorial."
- DELETE: the eyebrow pill "Automatic Course Calendar Generation"; the h1 "From Course Outline to
  Calendar in Seconds" (replace with "Check your outline, then take the calendar."); the three
  interchangeable feature-card descriptions.

CONSTRAINTS
- FONT: Newsreader + Inter + JetBrains Mono
- STYLE: ruled ledger on warm paper
- MODE: light (and add a dark variant only via prefers-color-scheme, never a toggle)

NEGATIVE PROMPT
- No hero pill, no gradient text, no gradient buttons, no radial lights, no dark glass.
- No card around anything. Nine assessments are nine table rows.
- No animated connector diagrams, no pulsing calendar, no floating particles.
- No fabricated calendar chips, no invented course names in decoration, no "trusted by 10,000 students".
- No accent stripe welded to the side of a container.
```

**MengTo techniques, and exactly where.**
- `light-mode-paper-technical` — the whole system: warm paper surfaces, precise geometry, restrained
  accent signals. This is the single biggest lever on this app.
- `book-serif-index` — the `/review` masthead and the assessments table: serif-led page, mono index
  column, margin notes for the "could not be read" explanations. The review screen IS an index of a
  document, which is exactly what this skill is for.
- `container-lines` — the 900px sheet's vertical guides with corner squares; what makes a rule-based
  layout feel authored rather than unstyled.
- `number-details` — the `01 02 03` on the three-step progress in the header and the assessment ordinals
  in the ledger's first column.

**Do NOT use:** `gsap-scrolltrigger-storytelling`, `cinematic-scroll-storytelling`,
`mesh-gradient-dark-blue-clean`, `atmosphere-background`, `dark-blue-contrasting-clean`,
`funky-purple-container-tech`, `beam-glow-states`, any WebGL or particle skill. A deadline tool must not
scroll-jack, and the current hero's animated background is the thing being removed.

**Kept from today:** the entire extraction/flagging model and its amber "Not found" / "Needs a date"
semantics; the draftmyschedule explanation; the honest free-hosting timing note; the "Enter the course
by hand" escape hatch and the whole `/manual` form; the Western sessional-dates helper line; the
non-affiliation footer; every copy string quoted above; Lucide as the icon source; the `role="alert"`
on upload error.

**Primary action:** `/` → *Drag and drop your course outline here* (the drop zone itself, not a button).
`/review` → *Generate calendar*. One primary per screen; "Add another assessment" and "Add Section" are
secondary and should stop being filled pills.

**Mobile (390):** the ledger table is the hard part. Each assessment becomes one ruled block: name on
line 1 at 15px, weight and date on line 2 in mono, the flag as a trailing pill — the block must keep the
row tint so flags still scan. The masthead definition grid goes to a two-column label/value list. The
three-step header collapses to "Step 2 of 3 · Review". The drop zone stays full-width and keeps its
44 pt tap target. Never a horizontal scroller.

### Alternate direction — "The term wall"

> **Visual thesis.** Every date the parser found lands on a square of a 13-week wall planner, so the
> term is something you look at rather than a list you read.

```text
GOAL
- Same three screens, but the review step is spatial: the proof that extraction worked is seeing the
  term fill up.
- Success: a missing date is obvious because its square is empty, not because a pill says so.

FORMAT
- Responsive web, 1440 / 390. Full-bleed planner at 1440; the planner is the page.

LAYOUT
- Screen 2 becomes a 13-column × 5-row grid (weeks × weekdays) filling the viewport width, with the
  assessment list as a narrow right rail that stays in sync: hover/focus a row, its square lights.
- Undated assessments sit in a "no date yet" tray under the grid — they are literally off the calendar,
  which is the clearest possible statement of the problem.
- Screen 1 keeps the drop zone but drops all marketing; screen 3 is a confirmation strip.

TYPE SYSTEM
- No serif. One sans (Inter) + one mono (JetBrains). The grid does the expressing.
- Week numbers mono 11 at 45%; day chips sans 500 11; assessment names sans 400 13 truncated with a
  title; the date in mono 12.

COLOR + MATERIAL
- Dark, but a *considered* dark: ground #0e0f11, grid cell #15171a, rule #23262b — a real tonal system,
  not black plus neon.
- ONE accent blue #4d8dff for a placed assessment; amber #d79b22 for an undated one in the tray.
  Weight is encoded as square fill density, not a second colour.
- Material: flat cells, 1px rules, no shadow, no glass, no blur.

IMAGERY / UI STYLE
- The grid is the image. Zero icons except the three Lucide glyphs already used for lecture/lab/tutorial.

COPY
- Keep all honest strings. The tray heading: "Not on the calendar yet" (plainer than "Needs a date").

CONSTRAINTS
- FONT: Inter + JetBrains Mono
- STYLE: dense planner grid
- MODE: dark

NEGATIVE PROMPT
- No hero, no marketing section, no feature cards, no gradient.
- No animation on the grid beyond a 120 ms highlight; no cascading cell reveal on load.
- No fabricated events to make the grid look full.
```

**MengTo techniques, and exactly where.**
- `framed-grid-layout` — the planner: thin visible boundary lines, L-corner brackets on the term, strict
  alignment. This is the skill the whole direction rests on.
- `split-layout-technical` — the planner / right-rail split and its fine frame lines.
- `technical-wireframe-info-layout` — the connector treatment between a rail row and its square
  (a hairline leader, not an animated arrow).

**Do NOT use:** `light-mode-paper-technical`, `book-serif-index` (they belong to the primary direction —
do not blend the two), plus everything on the primary's do-not list.

**Kept from today:** identical to the primary direction.

**Primary action:** *Generate calendar*, pinned to the bottom-right of the planner.

**Mobile (390):** a 13×5 grid cannot survive 390 and must not be pinch-zoomed. It becomes a vertical
week list — one row per week, dates as inline chips — with the "Not on the calendar yet" tray pinned
above it. This is a genuine re-prioritisation, not a collapse of the desktop grid.

---

## 4. plantit — https://plantit.kalpkan.com

*Repo `~/projects/plantit` · React 18 CRA + MUI v5 (dark), Firebase Auth, Supabase Storage,
react-dropzone. Routes `/login`, `/`, `/plants`, `/add-plant`, `/plant-details`.*

### Audit (`audit-ai-design-slop`)

**Verdict.** An app whose entire premise is *photograph your plant* has no photograph, no plant and no
green thing on any screen except a button. It is MUI's dark theme with two action cards and a three-step
explainer, and it is visually indistinguishable from `hoops` and `plato`. The theme file is actually
careful — it ships its own `contrastRatio()` helper and documents 9.6:1 on the button text — so the
craft is present; it is aimed at the wrong target. The fix is not more polish, it is committing to a
subject: plants, photographed, on a warm ground.

**Checked scope.** `/` at 1440 and 390, `/plants` (empty state) at 1440, `/add-plant` at 1440, `/add`
(404) at 1440. `/plant-details` not reachable — no plants in the account.

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Slop pattern | No product imagery anywhere | Across `/`, `/plants` and `/add-plant` there is not one image, illustration or photograph. The only green is the `#00DC82` gradient button. The `/add-plant` drop zone — where a photo is literally the input — is an empty dashed rectangle with a line of text. | The product's one distinguishing feature (visual identification) is invisible; the page reads as a generic form. | Show a plant. On `/` use one real photo of a plant Kalp or Yash actually identified, with the species name and the moisture target beside it as a live example. On `/add-plant` show a worked example thumbnail beside the drop zone. |
| P1 | Slop pattern | Three interchangeable step cards | "1. Upload" / "2. Identify" / "3. Care and water", each a rounded card with a heading and one sentence of filler ("Our AI will analyze the image and identify the plant species."). | The canonical generated-landing-page block. It restates the two action cards directly above it. | Delete the row. The two action cards already say Upload and View; the third fact (watering) belongs on a plant's detail page where it is real. |
| P2 | Quality defect | Disabled control with no explanation | `/add-plant` renders "Identify Plant" in the disabled grey (`rgba(255,255,255,0.45)` on `rgba(255,255,255,0.12)`) with nothing saying why. It is the page's only primary action. | A first-time visitor sees a dead primary button and no cause. | Either hide it until a file is chosen, or label the reason beneath it ("Choose a photo first"). |
| P2 | Quality defect | Vast dead space + page-height scroll on one-screen content | `/` ends at y≈580 of a 1440×780 viewport and leaves the remaining ~60 % of the page black; `/plants` shows a 3-line empty state and then ~600 px of nothing, yet still scrolls. | The layout was designed before the content; the empty state floats in a void. | Constrain the content column and vertically centre the empty state in the available height, or fill the space with the one thing the app should show: the example plant. |
| P2 | Slop pattern | Generic headline + AI buzzword | "Welcome to Plant It" is the least specific possible h1; "Our AI will analyze the image" names the vendor, not the outcome. | Neither line tells a visitor what number they get or what the hardware does. | Lead with the real differentiator, which is already in Kalp's own description and in the intro paragraph: species-specific moisture targets driven to a microcontroller. e.g. "Photograph a plant. Get its species, its water number, and a sensor that holds it there." |
| P3 | Quality defect | Unguarded MUI motion + missing skip link | No `prefers-reduced-motion` handling; MUI transitions plus the `plantit-fade-in` route keyframe run unconditionally. No skip link; only MUI default focus rings. | Minor, but it is the least accessible of the seven. | Add the media query and a skip link. The rest of the a11y story is MUI's and is adequate. |

**Largest single improvement:** put a real plant photo on the home screen.

### Primary direction — "Nursery tag"

> **Visual thesis.** Every plant gets the little card-stock tag that comes stuck in the pot — species,
> light, water number — except this one knows the actual soil moisture right now.

```text
GOAL
- Identify a plant from a photo, keep a shelf of identified plants, and hold each one at its own
  moisture target (simulated until an ESP8266 is attached).
- For: Kalp and Yash, and anyone who has killed a plant by guessing. Someone standing at a windowsill
  with a phone in one hand.
- Success: the shelf view answers "which of my plants needs water right now" in one glance, and a new
  plant's tag is readable and trustworthy the moment identification finishes.

FORMAT
- Responsive web, mobile-first (this is a phone app used standing up); 390 is the design target and
  1440 is the wide case.
- Content max-width 1080px; card grid 2-up at 768+, 3-up at 1200+, 1-up at 390.

LAYOUT
- Home = the shelf. A grid of plant tags, each: photo (4:5 crop, the plant filling the frame), common
  name, species in italics, and one moisture bar with the target marked on it. Nothing else.
- The empty shelf is not a void: it shows ONE example tag at 60% opacity, captioned "This is what a tag
  looks like", above the "Add a plant" button. Honest placeholder, not fake proof — the caption says so.
- Add = camera-first. At 390 the drop zone is a full-width tappable frame with the camera affordance
  primary. The worked example sits beneath, not beside.
- Detail = the tag at full size: photo top, species block, then the care numbers as a definition list
  (Water at / Light / Soil), then the live moisture read and ONE button.
- Nav stays the MUI AppBar (Home / My Plants / Add Plant / Logout) — it works; it just gets the new palette.

TYPE SYSTEM
- ONE humanist sans, actually loaded: Inter is already named in theme.js and never imported. Import it
  (variable, self-hosted, latin subset) or replace the name with the system stack. Do not keep lying.
- Species names set in the sans's italic at 0.95em in ink-2 — botanical convention, and it is free
  hierarchy that costs no new typeface.
- Numbers (moisture %, target %) in tabular figures at 600.
- Tag name 600 17/1.2; species italic 400 14; care labels 500 11 uppercase tracking 0.06em; body 15/1.5.
- MUI's `textTransform: 'none'` on buttons stays.

COLOR + MATERIAL
- Invert to warm light. Ground #f6f4ef (card stock), card #ffffff, ink #1f241f, ink-2 #5f6b5f,
  rule #dfe0d8.
- ONE accent, and it is the existing #00DC82's darker sibling for contrast on light: #0a7a4a. It is
  spent on the primary button and on the moisture bar's *target marker* — nothing else.
- State colours are earned, not decorative: dry = terracotta #b2542c, at target = the accent, wet =
  slate #4a6b86. These three are the only other colours and they only ever appear on a moisture read.
- Material: matte card stock. One 1px rule per card and a 0 1px 2px contact shadow. No gradient buttons
  (the current `linear-gradient(90deg,#00DC82,#00b86b)` goes flat), no glass, no glow.
- MUI `shape.borderRadius: 18` drops to 10 — 18 on a small tag is a blob.

IMAGERY / UI STYLE
- Photography is the whole visual system. One crop rule (4:5, subject centred, plant fills ≥70 % of
  frame), one grade (slightly warm, not filtered), one fallback (a flat ink-2 leaf silhouette on card
  stock when a user's upload fails to load — clearly a placeholder, never a stock photo).
- Icons: MUI icons at 20px inline only. No icon tiles. Delete the rounded-square icon containers.

COPY (quote the good lines, replace the generic ones)
- KEEP: "Your personal plant identification and care assistant. Upload a photo to identify a plant, get
  care instructions, and keep an eye on its soil moisture. No hardware needed: every plant gets a
  simulated sensor you can water; a real ESP8266 takes over when you connect one." — this paragraph is
  specific and honest and is currently buried under a generic headline.
- KEEP: "Sign in with Google" / "Opening Google sign-in…" / "Add New Plant" / "View Plants" /
  "Water now" / "JPEG, PNG or WebP, between 10 KB and 4 MB. One plant per photo works best."
- REPLACE h1 "Welcome to Plant It" -> "Every plant, watered to its own number."
- REPLACE "Our AI will analyze the image and identify the plant species." -> delete with its card.
- REPLACE empty state "No plants yet" -> keep, but add the example tag and the caption
  "This is what a tag looks like. Yours will use your photo."
- ADD under a disabled Identify button: "Choose a photo first."

CONSTRAINTS
- FONT: Inter Variable (self-hosted), one face, italic used for species
- STYLE: warm card stock, photo-led
- MODE: light (MUI `palette.mode: 'light'` — this is a real inversion of today's theme.js)

NEGATIVE PROMPT
- No dark mode. A plant app on near-black with a neon-green gradient button is the thing being removed.
- No three-step "How it works" row, no icon tiles, no feature cards.
- No stock photography of plants that are not Kalp's; no AI-generated plant images presented as
  identifications; no invented species results; no fake moisture readings presented as live hardware.
- No gradient buttons, no glow, no glass, no radius above 12.
- No leaf/sprout mascot, no hand-coded SVG plant.
```

**MengTo techniques, and exactly where.**
- `clean-minimal-beige-light-mode` — the ground, the shells and the restrained accent. This is the
  system-level move that takes the app out of the generic-dark family.
- `image-first-grid-layout` — the shelf: full-bleed photography, structural guide lines, anchored
  content blocks, restrained overlays. It is exactly the shelf described above.
- `number-details` — the moisture target marked as a labelled tick on the bar (`42%`), and the care
  numbers set as a small ordered definition set on the detail tag.

**Do NOT use:** `glass-dark-ui`, `dark-glass-clean-layout`, `funky-purple-container-tech`,
`tech-green-dark-mode-modern`, `mesh-gradient-dark-blue-clean`, `falling-leaves` (a literal falling-leaf
particle system on a plant app is the exact "reached for by reflex" failure `no-ai-design-slop` names),
`ambient-section-particles`, any WebGL skill.

**Kept from today:** the `theme.js` discipline — the `contrastRatio()` / `luminance()` helpers and
`theme.test.js` are genuinely good practice and should be re-pointed at the light palette, not deleted;
the documented button-contrast rule; MUI as the component layer; react-dropzone; the lazy route chunks
and their `aria-label="Loading page"` spinner; the `role="alert"` on the login error; the honest
"simulated until an ESP8266 reports" language everywhere it appears; the existing `/add-plant` file
constraints copy; the "Use your own OpenAI key (optional)" disclosure.

**Primary action:** *Add New Plant* on an empty shelf; *Water now* on a plant that is below target.
Exactly one of those is the strongest control on any given screen, and which one depends on state — the
shelf should promote *Water now* into the tag itself when a plant is dry.

**Mobile (390):** this direction is designed at 390 first. One tag per row, photo 4:5 full-width,
name/species/moisture stacked beneath. The AppBar collapses to the existing MUI drawer (keep it). The
`/add-plant` drop zone becomes a large tap target with the device camera as the default input. "Water
now" is a full-width 48 pt button on the detail tag. The example-tag empty state is what fills the
otherwise-dead 600 px noted in the audit.

### Alternate direction — "Greenhouse instrument"

> **Visual thesis.** The plant is a process under control: one dial per pot, a target line, and a valve
> you can open — the moisture number is an instrument reading, not a progress bar.

```text
GOAL
- Same product, but the hardware story leads: this is the front panel of a watering controller that
  happens to identify species from a photo.
- Success: the relationship between "species target", "current reading" and "water now" is legible as a
  control loop.

FORMAT
- Responsive web, 1440 / 390. Panel max-width 1120px.

LAYOUT
- Home = a bench of instrument modules, one per plant, in a 2/3-up grid. Each module: a small photo
  thumbnail top-left, the species label, and a REAL dial — a 220° arc gauge with a target tick and a
  needle — occupying most of the module. Below the dial: last watered, and the valve button.
- Detail = one module at full size with the arc gauge large, plus a 24 h reading trace beneath it.
- Add = unchanged in structure, restyled.

TYPE SYSTEM
- One sans (Inter) + one mono (JetBrains) for all readings. Mono is what makes it an instrument.
- Gauge numeral mono 600 clamp(32px,4vw,48px) tabular; target tick label mono 11; species sans italic 14.

COLOR + MATERIAL
- Keep dark, but make it a complete tonal system rather than black+neon: ground #101112 stays,
  panel #191b1a, panel-2 #22262a, rule #2e3330.
- ONE accent #00DC82 for "at target" only. Dry #e0803a, wet #5a8fb5. The gauge arc is rule-coloured;
  only the needle and the target tick take a state colour.
- Material: molded panel — this is the one app where skeuomorphism is honest, because there is a real
  physical device behind it. Inset gauge well, a crisp top light separation, no glass, no glow.

IMAGERY / UI STYLE
- Photo thumbnails only (56px), because the instrument is the subject here, not the plant.
- No icons beyond a valve/drop glyph on the water button.

COPY
- Keep everything from the primary direction's KEEP list. Add unit honesty on every gauge:
  "simulated" or "ESP8266" as a mono suffix under the reading. Never let a simulated reading look live.

CONSTRAINTS
- FONT: Inter + JetBrains Mono
- STYLE: molded dark instrument panel
- MODE: dark (keeps theme.js's mode; a smaller change than the primary direction)

NEGATIVE PROMPT
- No decorative dials — if a gauge is on screen it must be driven by a real (or clearly-labelled
  simulated) value.
- No pulsing "live" dot on a simulated reading.
- No neon glow on the needle, no lens flare, no carbon-fibre texture.
```

**MengTo techniques, and exactly where.**
- `tech-green-dark-mode-modern` — the matte panel system, emerald as signal, mono labelling.
- `high-contrast-skeuomorphic-clean` — the gauge well and the valve button: molded surface, tactile
  inset depth, restrained signal accents. This is the only app in the seven where a physical device
  justifies it beyond a single object.
- `beautiful-shadows` — one layered elevation for the module against the bench; nothing else.

**Do NOT use:** `clean-minimal-beige-light-mode`, `image-first-grid-layout` (they belong to the primary
direction), `glass-dark-ui`, `falling-leaves`, `liquid-metal-border`, any WebGL skill. The gauge is SVG
and CSS.

**Kept from today:** as the primary direction, plus `theme.js`'s dark palette survives largely intact.

**Primary action:** *Water now* — in this direction it is a valve, and it is the loudest control on
every module whose needle is below target.

**Mobile (390):** one module per row; the gauge shrinks to 140 px and keeps the needle and target tick
but drops the minor ticks. The 24 h trace becomes a 64 px sparkline. Valve button full-width, 48 pt.

---

## 5. pushups — https://pushups.kalpkan.com

*Repo `~/projects/pushups` · Vite + TS, no framework. MediaPipe PoseLandmarker (full, ~20 MB, self-hosted).*

### Audit (`audit-ai-design-slop`)

**Verdict.** The least slopped page of the seven and also the least designed. It is honest to a fault:
"Nothing loads until you press a button", a stated 20 MB model download, a frank paragraph explaining
that the trained classifier was retired on 2026-09-19 because it scored 50/50 on held-out bad reps. That
paragraph is the best writing in the whole portfolio. The problem is that 1,400 words of it sit under a
black rectangle, the four live numbers are four identical grey tiles, and the one moment that matters —
a rep landing, good or bad — has no visual treatment at all. This app needs art direction, not cleanup.

**Checked scope.** `/` at 1440 (three scroll positions) and 390 (iframe-rendered). Camera not started;
the demo clip was not played, so the live overlay, the counting state and the verdict states are
**unknown** and must be designed against the source (`src/draw.ts`, `src/hints.ts`) before building.

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Slop pattern | The product's key moment is undesigned | GOOD REPS / ATTEMPTS / FORM NOW / SPEED render as four identical `#171a22` tiles with an 11px uppercase label and a value; three of the four read "0" or "—" at rest. Nothing distinguishes the count (the point) from speed (a detail). | A rep counter whose count is the same size as everything else. The user's eye has nowhere to go while doing pushups on the floor. | Make GOOD REPS a single large numeral, at least 4× the others, and put FORM NOW next to it as a word, not a tile. ATTEMPTS and SPEED become one mono line. |
| P2 | Quality defect | Stage is an empty black box above the fold | The `#stage` is ~4:3 and ~560 px tall at 1440, entirely `#000` with one line of centred grey placeholder text, and it occupies the middle of the first viewport before anything is started. | The largest element on first paint carries no information. | Put the demo clip's first frame in the stage as a poster image with the skeleton pre-drawn — it shows exactly what the tool does, costs one static asset, and the clip is already in `/public/demo`. |
| P2 | Quality defect | Broken utility class | `index.html` uses `.visually-hidden` on the section headings (alongside `hidden`) but `.visually-hidden` **is not defined** in `src/style.css`. | The accessible-name scaffolding is half-wired; `aria-labelledby` points at elements that are `hidden` from the a11y tree. | Define `.visually-hidden` (the `emotes` repo already has a correct one at ~line 310 — copy it) and drop the `hidden` attribute. |
| P2 | Slop pattern | Explanation outweighs the tool | "How it decides" + "Tips" run ~1,400 words as two flat bullet lists, several bullets exceeding 90 words, below the fold at 1440 and running to roughly five screens at 390. | The best content in the portfolio is formatted so it will not be read. | Keep every word — it is genuinely valuable — but structure it: four named rules with a heading each, the geometry thresholds pulled into a small mono table (torso fraction, knee angle 130°, etc.), and the classifier-retirement story as its own short note. |
| P3 | Quality defect | No focus styles, no skip link | `src/style.css` has no `:focus-visible` rule and no skip link. Buttons do meet 48 px. | Keyboard users get the UA default on a dark ground. | Add a `:focus-visible` outline in the accent, and a skip link. |
| P3 | Slop pattern | Eyebrow doing no work | "BROWSER ML · MEDIAPIPE POSE LANDMARKS" in accent uppercase at 0.12em above the h1. | A tracked eyebrow above the heading, the exact catalog pattern — and it restates what the lede says better. | Either delete it, or demote it to a mono line *under* the h1 where it reads as provenance rather than ceremony. |

**Largest single improvement:** make GOOD REPS one big number.

### Primary direction — "Gym mirror"

> **Visual thesis.** The camera feed is the mirror; the count, the verdict and the fault are drawn on the
> glass in front of you, and everything else on the page gets out of the way.

```text
GOAL
- Count pushups from a phone or laptop on the floor and say why a bad rep was bad, entirely on-device.
- For: one person on the floor, side-on to a device 1–2 m away, who cannot read 13px type from there
  and cannot touch the screen mid-set.
- Success: from a plank position, at arm's length, the user can read the count and the verdict without
  squinting, and can tell a counted rep from a rejected one without hearing anything.

FORMAT
- Responsive web, 1440 / 390. The stage is the page: at 1440 the video is capped at 960px wide and
  centred; at 390 it is edge-to-edge.
- Reading content below the stage is capped at a 68ch measure.

LAYOUT
- Above the stage: h1 + one-line lede + two buttons. That is all. The current 5-line lede moves below
  the stage into "How it decides" where it belongs.
- The stage is a single frame with the video, the skeleton overlay, and a HUD drawn INSIDE it:
  · top-left: the count, huge, mono, tabular.
  · top-right: the placement hint when one is active ("turn side-on", "too dark"), otherwise nothing.
  · bottom-centre: FORM NOW as a word on a plate — "clean", "hips sagging", "go lower".
  · bottom-right: attempts and speed as one small mono line.
- Below the stage: "How it decides" as four named rules, each with a heading, plus one mono threshold
  table. Then "Tips" as four short rules. Then the classifier-retirement note as a bordered aside — it
  is the most interesting thing on the page and deserves to look deliberate.

TYPE SYSTEM
- Keep the system stack for prose (`system-ui, -apple-system, "Segoe UI"`) — it costs nothing and
  renders fast, which matters on a page that is already downloading 20 MB of model.
- ADD one mono, self-hosted latin subset, for the HUD and the thresholds: JetBrains Mono 400/600.
- Count: mono 600, clamp(64px, 12vw, 132px), tabular-nums, leading 0.85. This is the only thing on the
  page allowed to be that size.
- Verdict word: sans 600 clamp(20px, 3vw, 30px).
- HUD micro-labels: mono 400 11 uppercase 0.06em.
- Body 16/1.55; rule headings sans 600 18; threshold table mono 13 tabular.

COLOR + MATERIAL
- Keep the existing ground: --bg #0f1116, --panel #171a22, --text #f2f3f5, --muted #9aa3b2.
- Keep --accent #ffe66d (yellow) as the one accent — it is the most distinctive colour choice in the
  portfolio and it belongs to this app. It marks a COUNTED rep and nothing else.
- --good #5ee38a and --bad #ff6b6b keep their verdict jobs and appear only in the HUD, never in chrome.
- HUD material: a single dark plate behind each HUD element, `rgba(15,17,22,0.72)` with a 1px
  `rgba(255,255,255,0.12)` edge. This is the one place a translucent layer is honest, because there
  genuinely is video behind it.
- No glow, no gradient, no shadow anywhere else. The stage frame is a 1px rule at radius 14 (as today).

IMAGERY / UI STYLE
- The skeleton overlay IS the illustration. Treat it as a designed object: consistent stroke (3px
  joints, 2px bones), joints as filled dots, and the documented grey state when counting is paused.
- Stage poster: the demo clip's first frame with the skeleton drawn on it, shipped as one static WebP.
- No icons at all. This page needs none.

COPY (all of this is live today and should be kept verbatim)
- "Pushup Form Tracker"
- "Phone or laptop on the floor, side-on (facing either way), whole body in frame, one person." (the
  rest of the current lede moves below the stage)
- "Start camera" / "Play demo clip" / "Stop"
- "Nothing loads until you press a button."
- "Your camera (mirrored) or the demo clip appears here with the skeleton, the rep count and the form
  verdict drawn on top."
- "How it decides" / "Tips"
- The entire classifier-retirement paragraph, verbatim — it is the page's strongest asset.
- The verdict vocabulary exactly as the tracker emits it: "hips sagging", "hips too high", "knees down",
  "dropped to the floor", "go lower", "turn side-on".

CONSTRAINTS
- FONT: system stack + JetBrains Mono (one added face, subset)
- STYLE: HUD on live video
- MODE: dark only

NEGATIVE PROMPT
- No Three.js, no WebGL, no shader. MediaPipe already owns the GPU on this page.
- No celebratory confetti, no streak flames, no "Nice rep!" copy, no gamification, no badges.
- No progress ring around the count.
- No pulsing/breathing animation on the counter at rest.
- No fabricated rep history, no leaderboard, no fake "personal best".
- No stock gym photography, no silhouette athlete illustration.
```

**MengTo techniques, and exactly where.**
- `technical-wireframe-info-layout` — the skeleton overlay and its annotation: sparse information labels,
  precise diagnostic framing, connector annotations from a joint to its fault label ("knee 118°"). The
  overlay is already a wireframe; this makes it a designed one.
- `beam-glow-states` — one place only: a single 180 ms accent edge pulse on the stage frame when a rep
  is **counted**. It is the only confirmation the user gets while face-down, it communicates state
  (the definition of earned motion in `animation-systems`), and it must be a static border under
  `prefers-reduced-motion` with the count increment doing the work instead.
- `number-details` — the four rules in "How it decides" numbered `01–04`, which is what turns the wall
  of bullets into a readable structure.
- `animation-systems` — the motion budget: rep-count increments are instant (no count-up tween — a
  tween would lie about when the rep landed); the verdict word cross-fades at 120 ms; the placement
  hint fades in at 200 ms and out at 400 ms. Nothing else on the page moves.

**Do NOT use:** every `threejs*`, `webgl-*`, particle, globe, shader and cursor-trail skill;
`cinematic-gsap-lenis-motion-system`, `scroll-scrubbed-visual-sequence`, `animation-on-scroll`,
`ambient-section-particles`. Also **no smooth-scroll engine** — a page that must respond to a physical
person on the floor cannot add scroll latency.

**Kept from today:** the entire "How it decides" and "Tips" copy including the classifier-retirement
paragraph; the privacy statement and the stated 20 MB cost; "Nothing loads until you press a button" and
the lazy-load behaviour it describes; the yellow accent; the `aria-live="polite"` status line and the
canvas `aria-label="Pose overlay"`; the grey-skeleton pause behaviour; the demo clip; the 48 px buttons;
the Python-original credit link.

**Primary action:** *Start camera*. It is already the only filled button on the page — keep that, and
make *Play demo clip* visibly secondary rather than a same-size outlined twin.

**Mobile (390):** 390 is the real device for this app and the stage must go edge-to-edge with zero side
gutter (the one place the 16 px gutter rule is suspended, because the video is the content). The count
sits top-left inside the video at clamp minimum 64 px. The two buttons stack full-width above the stage
and stay reachable with a thumb. Everything below the stage is one column at 68ch. The threshold table
becomes a two-column definition list, never a horizontal scroller.

### Alternate direction — "Coach's clipboard"

> **Visual thesis.** A rep sheet on light paper: the camera is a pinned photo, and every attempt is a
> marked line — ticked, or annotated with what went wrong.

```text
GOAL
- Same tool, but the record leads: the set you just did, written down, with reasons.
- Success: after a set, the user scrolls one screen and sees exactly which reps failed and why.

FORMAT
- Responsive web, 1440 / 390. Sheet max-width 940px.

LAYOUT
- Two columns at 1440: LEFT 7 = the video, presented as a pinned photograph (a 1px rule, a small
  shadow, a caption "live · mirrored"). RIGHT 5 = the rep sheet, one ruled line per attempt, appended
  as they happen: "07 ✓ clean", "08 ✗ hips sagging". The sheet is the HUD.
- Below: the explanation, set as a real document with numbered rules and a thresholds table.

TYPE SYSTEM
- One sans (system stack) + one mono (JetBrains) + optionally one serif (Newsreader) for the rule
  headings, which is what makes it read as a coach's document rather than a form.
- Rep sheet entirely mono 14 tabular. Count total in mono 600 40.

COLOR + MATERIAL
- Light: paper #f7f6f2, sheet #ffffff, ink #191b18, rule #dedbd3.
- ONE accent, the yellow retained but darkened for light-ground contrast: #8a6b00 for a counted rep's
  tick. Faults are ink, not red — the fault text says what is wrong; colour is not needed and red on a
  form sheet reads as an error the user cannot fix.
- No shadow except the photo pin. No glow.

IMAGERY / UI STYLE
- The video reads as a photograph on paper. The skeleton overlay switches to ink lines on light.
- No icons; ✓ and ✗ are type.

COPY
- Identical to the primary direction.

CONSTRAINTS
- FONT: system stack + JetBrains Mono (+ Newsreader, optional)
- STYLE: paper rep sheet
- MODE: light only

NEGATIVE PROMPT
- No dark HUD retrofit.
- No red error styling on a fault line.
- Same WebGL/Three.js/particle ban as the primary direction.
```

**MengTo techniques, and exactly where.**
- `light-mode-paper-technical` — the sheet ground and the bracketed geometry.
- `split-layout-technical` — the 7/5 photo-and-sheet split with fine frame lines and mono metadata.
- `container-lines` — the 940px sheet's vertical guides.

**Do NOT use:** `technical-wireframe-info-layout` and `beam-glow-states` (they belong to the primary
direction; a glow has no place on paper), plus the full WebGL/particle ban.

**Kept from today:** identical to the primary direction.

**Primary action:** *Start camera*.

**Mobile (390):** the two-column split inverts to video-then-sheet, with the sheet's most recent three
lines pinned directly under the video and the rest scrollable — the live feedback must not require a
scroll. Below that, the document. The `✓ / ✗` column stays left so the eye can run down it.

---

## 6. emotes — https://emotes.kalpkan.com

*Repo `~/projects/emotes` · Vite + TS, three MediaPipe landmarkers (face 478, hands 21×2, pose 33),
~40 MB of self-hosted models. Ships Supercell emote PNG/MP3 under the Fan Content Policy, disclosed.*

### Audit (`audit-ai-design-slop`)

**Verdict.** This has the most distinctive palette in the portfolio — deep purple `#120b1f` with gold
`#ffc43d` and a cyan link — and it is the only app whose colour actually belongs to its subject. It also
has the most severe layout failure: at 1440 the primary control is below the fold, because a 560 px
empty black stage sits between the lede and the buttons. Fix the fold, then lean harder into the arcade
palette that is already there, and get the interface off Supercell's art.

**Checked scope.** `/` at 1440 (three scroll positions) and 390 (iframe-rendered). Camera not started
and demo not played, so the live overlay, the emote pop, the meter-filling states and the audio
behaviour are **unknown** and must be designed against `src/draw.ts`, `src/emotes.ts` and
`src/gestures/*` before building.

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Quality defect | Primary action below the fold at 1440 | The masthead ends at y≈130; the stage runs y≈140–630; "Start camera" sits at y≈655 in a ~780 px viewport, clipped to a sliver on first paint. At 390 it is correctly above the fold — the desktop case is the broken one. | On a desktop the first screen is a large empty black rectangle and a paragraph, with no visible way to begin. | Move the controls above the stage (as `pushups` already does), or cap the stage height to `min(60vh, 520px)`. The stage does not need to be 4:3 before there is a video in it. |
| P1 | Slop pattern | Empty stage carrying no information | 490 px tall, pure `#0b0714`, one line of centred muted text. | The largest element on the page at first paint says nothing about what the three gestures look like. | Use the demo clip's first frame as a poster, or — better for this app — show the three gesture illustrations in the stage as a triptych until the camera starts. |
| P2 | Quality defect | Unreadable explanation block | "How it works" step 3 is a single paragraph of roughly 350 words, unbroken, covering debounce windows, score averaging, arbitration between flex and thumbs-up, and cooldowns. At 390 it runs about two full screens. | The content is excellent engineering writing and nobody will finish it. | Break into four sub-points with mono headings (Threshold / Hold / Arbitration / Cooldown) and pull the timings (0.15 s, 0.4 s, 0.5 s, 0.7 s, 2 s, 0.9×) into a mono table. Keep every fact. |
| P2 | Slop pattern | Interface built from someone else's IP | The three gesture rows use Supercell's Clash Royale emote PNGs as their identifying thumbnails, at 48 px, as the app's primary visual vocabulary. The footer disclosure is correct and complete. | Legally covered as fan content, but design-wise the app has no visual identity of its own — its "brand" is borrowed art. | Draw three original gesture marks (a thumb, a flexed arm, a yawning mouth) in one stroke system for the UI's own vocabulary. The Supercell emote remains as the *payload* that pops in the stage when a gesture fires, which is the honest framing: their art is the content, not the chrome. |
| P2 | Quality defect | Unguarded motion | One `@keyframes pop` (scale 0.4→1 with a `cubic-bezier(0.2,1.4,0.4,1)` overshoot) plus `transition: transform 0.12s linear` on the meter fills, with **no** `prefers-reduced-motion` block. Audio plays on fire. | A bouncing overshoot plus sound with no motion opt-out. | Under reduce: the emote appears at full scale with a 120 ms opacity fade; the meters snap. Mute already exists and is correctly `aria-pressed`. |
| P3 | Quality defect | Disabled control reads as broken | "Stop" renders permanently greyed at very low contrast beside two active buttons, before anything has started. | A dead control in the primary control group. | Hide it until a session is running, or raise the disabled contrast and pair it with the status line. |
| P3 | Slop pattern | Three identical meter rows at rest | "Thumbs Up 0%", "Goblin Muscle 0%", "Princess Yawn 0%" — three identical cards with an empty bar. | At rest the section is three empty repeats. | At rest, show the gesture illustration and the hint and suppress the 0% bar until the camera is live. |

**Largest single improvement:** get "Start camera" above the fold at 1440.

### Primary direction — "Your own arena"

> **Visual thesis.** A cartoon arena drawn here, in this app's own hand: a purple-and-gold stage where
> your face is the player and the emote is the thing that gets lobbed over the wall.

```text
GOAL
- Fire an emote with a thumbs-up, a flex or a yawn, using three on-device MediaPipe models.
- For: someone who plays Clash Royale, sitting at a laptop, who will try this for ninety seconds and
  either laugh or leave. Also for Kalp, as a computer-vision demo he wants read.
- Success: within five seconds of landing, the visitor knows the three gestures and has pressed
  "Start camera"; within twenty seconds an emote has fired and they have seen why.

FORMAT
- Responsive web, 1440 / 390. Stage capped at min(60vh, 520px) and max-width 880px.
- Page gutter 20/40.

LAYOUT
- Masthead: h1 + a two-line lede (the current lede is already two lines — keep it).
- Controls IMMEDIATELY under the masthead, above the stage: Start camera (primary), Play demo, Stop
  (hidden until running), Mute. Status line under them.
- Stage: the arena. A framed panel with chamfered corners, the video inside, and the three gesture marks
  arranged along the bottom edge as a permanent HUD strip — each mark fills with gold as its score
  rises, so the meters ARE the arena's scoreboard and the separate "three gestures" section below can
  shrink to hints only.
- The fired emote pops centre-stage, large, over the video.
- Below: "The three gestures" as three rows of mark + name + hint (no percentage at rest).
- Below: "How it works" restructured into four named sub-points plus a mono timings table.
- Footer keeps the Supercell disclosure verbatim.

TYPE SYSTEM
- Keep the system stack for prose. ADD one display face with actual personality — this is the one app in
  the seven where a display face is right, because the subject is a cartoon game. Use a free chunky
  geometric or rounded sans from Google Fonts (e.g. Bricolage Grotesque or Fredoka), self-hosted latin
  subset, weight 700 ONLY, used ONLY for the h1 and the gesture names. Everything else stays system.
- ADD one mono for the timings table and the meter percentages.
- h1 display 700 clamp(30px, 6vw, 44px), tracking -0.01em. Gesture names display 700 17. Lede sans 400
  17/1.55. Hints sans 400 14 at muted. Timings mono 13 tabular.
- The eyebrow "COMPUTER VISION, IN THE BROWSER" stays but moves below the h1 as mono provenance.

COLOR + MATERIAL
- Keep the palette wholesale — it is the best thing here: --bg #120b1f, --bg-elev #1c1230,
  --bg-stage #0b0714, --text #f3edff, --muted #b3a6cc, --line #2f2246, --accent #ffc43d,
  --accent-ink #2a1c00, --cyan #66e3ff (links), --pink #ff7ab6.
- Discipline it: gold = a gesture firing or about to fire, and the primary button. Pink = the second
  gesture's meter only, or delete pink entirely. Cyan = links only, as today.
- Material: chamfered arena panels with a 1px gold-tinted edge on the stage and flat elevated surfaces
  elsewhere. One contact shadow under the arena. No glass over the video except the HUD strip's plate.
- Texture: none. The palette is already doing the expressing.

IMAGERY / UI STYLE
- THREE ORIGINAL MARKS, drawn for this app, in one stroke system (3px, rounded caps, gold on purple):
  a thumb, a flexed arm, an open yawning mouth. These become the app's vocabulary — HUD strip, gesture
  rows, favicon, OG image. They are simple interface marks, which `build-awwwards-quality-sites`
  explicitly permits as authored brand marks.
- The Supercell emote PNG remains, unchanged, as the thing that pops in the stage when a gesture fires —
  content, credited, never chrome, never a logo, never in the favicon.
- The landmark overlay (face mesh / hand points / pose) is drawn in --muted at low alpha so it reads as
  machinery behind the cartoon, not as a second focal point.

COPY (keep all of this verbatim — it is live and it is good)
- "Emote Detector"
- "Give your camera a thumbs-up, flex beside your head, or yawn, and the matching Clash Royale emote
  pops up with its sound. MediaPipe's face, hand and pose landmarkers run on your device; no video
  ever leaves it."
- "Start camera" / "Play demo" / "Stop" / "Mute"
- "Press "Start camera" (about 40 MB of models load once) or "Play demo"."
- "Your camera shows here. Nothing is recorded or uploaded."
- "Thumbs Up" / "Fingers folded, thumb straight up."
- "Goblin Muscle" / "Flex: bend one arm, fist up beside your head."
- "Princess Yawn" / "A big yawn: mouth wide, eyes closed."
- "The three gestures" / "How it works"
- The full Supercell Fan Content Policy disclosure, verbatim, in the footer.
- The corpus note: "rewritten against a corpus of 95 real photos and 70 ground-truth clips" and the
  honest "the original's six-class MobileNetV2 reached 68 % validation accuracy, so it stayed out."

CONSTRAINTS
- FONT: system stack + one display 700 + one mono
- STYLE: original cartoon arena, purple and gold
- MODE: dark only

NEGATIVE PROMPT
- No Three.js, no WebGL, no shader, no particle system. Three MediaPipe models already run per frame.
- No Supercell art, colours, typography, card frames, king/tower imagery, or arena backdrops in the
  interface chrome. Their emote is the payload; their brand is not ours.
- No confetti, no screen shake, no chromatic aberration on fire.
- No fabricated "emotes fired today" counter, no leaderboard, no streaks.
- No neon glow on the purple, no laser, no dither field, no scanlines.
- No mascot.
```

**MengTo techniques, and exactly where.**
- `funky-purple-container-tech` — the system: dark container-led layout, fuchsia/gold accents, layered
  rounded shells, crisp frame lines, playful focal object. This app is already 80 % of the way there;
  the skill supplies the discipline it is missing.
- `skeuomorphic-ui` — the emote pop plate only: a molded arena badge the emote lands on, with a
  reflective edge and an embossed shadow, so the payload feels thrown rather than faded in. One object,
  one place.
- `corner-diagonals` — chamfered corners on the arena frame and the primary button, giving the app a
  shape language that is neither KalpOS's rounded windows nor the generic 16 px card.
- `beam-glow-states` — the *"almost there"* state. The app already computes a score and already tells
  you what to change when a gesture is close; a gold edge beam on the relevant HUD mark while
  `score > 0.35 && < 0.5` makes that legible at arm's length. Static gold border under reduced motion.

**Do NOT use:** every `threejs*` and `webgl-*` skill, `ambient-section-particles`,
`build-interactive-particle-trail`, `pointer-trail-emitter`, `shaders-cursor-ripples`,
`gooey-blob-system`, `dither-laser-dark-mode`, `webgl-laser`. Also no smooth-scroll engine — the page
must stay responsive to a live camera loop.

**Kept from today:** the entire purple/gold/cyan palette; every copy string above; the Supercell
disclosure and its placement; the `.visually-hidden` class (this repo's is correct — `pushups` should
copy it); `aria-live="polite"` on status and hints and `aria-live="assertive"` on the emote;
`aria-hidden` on the overlay canvas; `aria-pressed` on Mute; the mute control existing at all; the
44 px pill buttons; the honest model-size warning; the demo path; the three gesture names and hints.

**Primary action:** *Start camera*. *Play demo* is the fallback for a user who will not grant camera
access and must stay visibly secondary.

**Mobile (390):** already the better of the two viewports — keep the current stacking order (masthead →
stage → controls is acceptable at 390 because the stage is short there; but verify the stage caps at
60vh so the buttons stay reachable). The HUD strip's three marks shrink to 28 px and drop their labels,
keeping only the fill. "Mute" joins the button row rather than wrapping to its own line. The timings
table becomes a definition list.

### Alternate direction — "Broadcast booth"

> **Visual thesis.** A control room: the feed on the left, three confidence meters on the right, and a
> red ON AIR state when a gesture is holding.

```text
GOAL
- Same toy, framed as an instrument — for the CV-demo audience rather than the Clash Royale audience.
- Success: a reader who cares about how it works can watch the three scores move in real time and see
  the arbitration happen.

FORMAT
- Responsive web, 1440 / 390. Console max-width 1200px.

LAYOUT
- 8/4 split at 1440: LEFT = the feed with the landmark overlay at full opacity (here the machinery IS
  the point). RIGHT = a permanent rail of three horizontal meters with live numeric scores in mono,
  the active hold timer, and the cooldown countdown.
- Under the rail: the arbitration state in words ("flex suppressed — thumbs-up leading 0.72 vs 0.61").
  This is the one thing today's page explains in 350 words and never shows.
- Controls sit in a top bar above both columns.

TYPE SYSTEM
- No display face. System sans + one mono, and the mono dominates — every score, timer and threshold.
- Meter scores mono 600 20 tabular; labels mono 11 uppercase 0.06em; prose sans 16/1.55.

COLOR + MATERIAL
- Keep the purple ground but cool it toward neutral so the meters read as instruments:
  #120b1f ground stays, panels shift to a desaturated #1a1826.
- Gold #ffc43d = a gesture over threshold. Muted purple = below. One red #ff5470 for the ON AIR /
  cooldown state. Cyan stays links-only.
- Flat panels, 1px rules, no chamfers, no skeuomorphism, one translucent plate over the video for the
  overlay legend.

IMAGERY / UI STYLE
- No cartoon marks. The meters and the landmark overlay are the visual system.
- The Supercell emote still pops, but small and in the corner, with its filename and the cue timing in
  mono beside it — it is logged, not celebrated.

COPY
- Keep everything. Add live-state strings the engine already computes: hold time, cooldown remaining,
  the losing gesture's suppression reason.

CONSTRAINTS
- FONT: system stack + one mono
- STYLE: control-room console
- MODE: dark

NEGATIVE PROMPT
- No cartoon, no display face, no chamfers, no skeuomorphic plate.
- Same WebGL/Three.js/particle ban.
- No fake VU meters or oscilloscope decoration — every meter must be a real score.
```

**MengTo techniques, and exactly where.**
- `split-layout-technical` — the 8/4 feed-and-rail console with mono metadata.
- `container-lines` — the console's vertical guides and corner markers.
- `glass-dark-ui` — the overlay legend plate over the video, and only there. This is the rare case the
  skill is for: a real foreground/background relationship exists because there is live video behind it.
- `beam-glow-states` — the ON AIR edge while a gesture is held past threshold.

**Do NOT use:** `funky-purple-container-tech`, `skeuomorphic-ui`, `corner-diagonals` (they belong to the
primary direction), plus the full WebGL/particle ban.

**Kept from today:** identical to the primary direction.

**Primary action:** *Start camera*.

**Mobile (390):** the 8/4 console collapses to feed-on-top, meters-below, with the three meters as a
compact three-row block that stays visible without scrolling while the camera is live. The arbitration
line sits directly under them.

---

## 7. microtubules — https://microtubules.kalpkan.com

*Repo `~/projects/microtubules/web` · Vite + TS, OpenCV.js self-hosted and worker-threaded. The only
light-first app of the seven, and the only one that respects `prefers-color-scheme`.*

### Audit (`audit-ai-design-slop`)

**Verdict.** The most rigorous page in the portfolio. It states its method as six numbered steps, links
the Python pipeline it reproduces, reports agreement to four decimal places on three samples and within
0.01 points on a 60-image test set, publishes the group's own reference ranges with standard deviations,
and warns that those ranges only hold within one imaging session. It also has a defined `:focus-visible`
rule and a working `.visually-hidden`. Two things undercut it: the page's chrome is the same green as
the scientific signal it is measuring, and the three bundled sample cells are 77×58 px images blown up
to ~430 px, so the evidence looks broken. Make the page neutral and the specimen the only green thing.

**Checked scope.** `/` at 1440 before analysis, and after running the "Untreated" sample (result
24.83 %, 77×58 px, Otsu 36, 1,109/4,466 px, nucleus removed 8.6 %). `/` at 390 via iframe. Dark theme
observed (the test browser is in dark mode); the light theme is **unknown** and must be checked, since
it is the documented default.

| P | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Quality defect | Sample images render as broken | The "Untreated" sample reports `77 × 58 px` and is displayed at roughly 430 × 310 in the Input and Detected figures, so it is visibly blocky — individual source pixels are ~5.5 px squares. | The app's own bundled evidence looks like a failed upload, on the very screen that has to establish trust. | Ship the samples at a usable resolution, or display them at 1:1 (or 2:1) inside a bordered figure with a "77 × 58 px, shown at 4×" caption, and state the scale. A stated magnification reads as rigour; an unlabelled blow-up reads as a bug. |
| P1 | Slop pattern | Chrome and data share one colour | `--accent`/`--accent-text` are `#178a4c` (light) / `#3ddc84` (dark); the 24.83 % readout, the "Choose an image" button, every link, the focus ring and the detected-microtubule mask are all green, and the mask is near-pure `#00ff00`. | Green is the measurement. When the button, the number, the links and the specimen are all green, the reader cannot tell interface from data at a glance. | Make the chrome neutral (ink + one non-green accent, or no accent at all) and reserve green exclusively for fluorescence and the derived mask. This is the single highest-leverage change on the page. |
| P2 | Quality defect | Horizontal overflow at 390 | The three sample buttons ("Untreated", "Nocodazole 25 µM", "Taxol control") sit in a non-wrapping row; at 390 the third is clipped mid-word at the viewport edge with no scroll affordance and no fade. | A primary entry point into the tool is invisible and unreachable-looking on a phone. | Wrap the row, or make it a scroller with a `css-alpha-masking` edge fade and a preserved gutter. |
| P2 | Quality defect | Alignment inconsistency on the result | The `24.83 %` readout and its caption are centred; the detail grid, the `<dl>` explainer, the figures' captions, the reference paragraph and the method list are all left-aligned. | The page's most important number is the only centred thing on it, which reads accidental rather than emphatic. | Left-align the readout to the same rule as everything else and let size carry the emphasis, or centre the whole result card deliberately. Pick one. |
| P3 | Quality defect | Two figures at a small size in a wide viewport | At 1440 the Input and Detected figures occupy ~430 px each inside a ~900 px column, with the remaining ~540 px of viewport empty. | The comparison that proves the tool works is smaller than it needs to be. | Widen the figure pair to the full container at 1440 and let the caption row sit beneath both. |
| P3 | Slop pattern | Eyebrow above the heading | "IMAGE ANALYSIS, IN THE BROWSER" in accent uppercase 0.12em above the h1 — the same pattern as `pushups` and `emotes`. | The three Vite apps share an eyebrow that adds nothing the lede does not say better. | Move it below the h1 as mono provenance, or delete it in all three. |

**Largest single improvement:** take green away from the interface and give it only to the specimen.

### Primary direction — "Lab bench"

> **Visual thesis.** A neutral bench under a neutral light, so the only green on the page is the one
> coming out of the microscope.

```text
GOAL
- Measure the share of a fluorescence image that is microtubule, in the browser, with a number that
  matches the group's Python pipeline.
- For: a Western undergrad in a cell-biology lab, on a laptop, comparing a handful of images from one
  imaging session — and, secondarily, a marker or a lab head deciding whether to believe the number.
- Success: the reader gets a number, understands what it excludes, and can see from the page alone that
  it agrees with the Python script.

FORMAT
- Responsive web, 1440 / 390. Bench max-width 1120px; the figure pair is allowed the full width.
- Light default; dark via prefers-color-scheme, as today.

LAYOUT
- Masthead: h1, one-line lede, provenance in mono under it.
- Input bar: a single full-width row — "Choose an image" / "Take a photo" / the three samples — all on
  one baseline with a rule under it. It is a control strip, not a card.
- Result, once run, in a strict three-band figure:
  · Band 1: the number, left-aligned at the same rule as everything else, with "of the image is
    microtubule" beneath, and the four detail values as a four-column mono grid on one line.
  · Band 2: the figure pair, full container width, side by side, equal size, one caption rule beneath
    both, with the stated magnification.
  · Band 3: "Is that high or low?" as a short table of the three reference conditions with their means
    and SDs, plus the caveat sentence. A table, not a paragraph — the numbers are comparable and should
    be comparable on screen.
- Method: the six numbered steps, kept exactly, with the agreement claims beneath them.

TYPE SYSTEM
- Keep the system stack for prose and keep `--mono` for the readout — the app already has a real
  sans/mono split and uses it correctly.
- Promote mono: every measured value on the page is mono and tabular. The 24.83 % headline number is
  mono 600 clamp(48px, 7vw, 76px), tabular-nums, tracking -0.02em.
- Detail labels mono 400 11 uppercase 0.06em (as today). Method steps sans 16/1.55. Reference table mono
  14 tabular with SDs at 0.85em.
- Do not add a webfont. This page's credibility is served by the system face; spend the budget on
  OpenCV.js instead.

COLOR + MATERIAL
- Neutralise the chrome. Light: ground #f5f5f3, surface #ffffff, surface-2 #eceeeb, ink #16191a,
  muted #5a625e, rule #d5d9d6. Dark: ground #101312, surface #191d1c, surface-2 #212725, ink #e9eceb,
  muted #9aa4a0, rule #2b312f. These are the current tokens with the green cast taken out.
- ONE non-green accent for interactive chrome: a desaturated slate-blue #2f6a8f (light) / #7fb8d8
  (dark) — buttons, links, focus ring. It cannot be confused with a fluorescence channel.
- GREEN IS DATA ONLY: the fluorescence in the input, and the detected mask. Nothing in the UI is green.
- Keep the warn tokens (#fff4d6 / #e0b400 / #5c4300) for the "could not read" and size warnings, and
  --error #b42318.
- The mask's near-pure #00ff00 is too hot at magnification — take it to a legible #2fd35f at 85 % over
  the source, so the underlying texture stays visible and the boundary is readable.
- Material: flat bench. 1px rules, no shadows, no glass, no glow, no gradient. The only elevation is the
  figure's 1px frame.

IMAGERY / UI STYLE
- Scientific figure discipline throughout: both figures at one aspect ratio, one scale, a stated
  magnification, a caption under each, a scale bar if the pixel size is ever known.
- No icons at all. This page currently has none; keep it that way.

COPY (all live today; keep verbatim)
- "Microtubule Quantifier"
- "Pick a fluorescent cell image (green = microtubules, blue = nucleus) and get the share of the
  picture that is microtubule. Nothing is uploaded: the picture never leaves your device."
- "Choose an image" / "Take a photo" / "Untreated" / "Nocodazole 25 µM" / "Taxol control"
- "PNG, JPEG, WebP, BMP or GIF, up to 30 megapixels. TIFF or HEIC: convert to PNG first."
- "of the image is microtubule" + "Share of all pixels counted as microtubule after the nucleus is
  removed. Background is in the denominator, so a tighter crop around the cell gives a higher number."
- "What these numbers mean" and all four definitions
- "Input" / "Detected microtubules (green), nucleus excluded"
- "Is that high or low?" and the full reference paragraph including "27.9 ± 4.6 %", "17.2 ± 2.6 %",
  "30.7 ± 9.5 %" and the caveat "compare images within one experiment rather than against this table."
- "How the number is computed" and all six steps
- The agreement paragraph: "the browser result equals the Python script's result to four decimal
  places, and on a 60-image test set every picture matches within 0.01 point"
- "Download overlay" / "Download mask" / "Copy result"
- ADD, beside each figure: "77 × 58 px, shown at 4×" (or the real numbers)

CONSTRAINTS
- FONT: system sans + system mono (add nothing)
- STYLE: neutral lab bench
- MODE: light default, dark via prefers-color-scheme (keep exactly as shipped)

NEGATIVE PROMPT
- No green in the interface. Not the button, not the links, not the focus ring, not the big number.
- No Three.js, no WebGL, no shader. OpenCV.js already owns the worker thread.
- No glow on the mask, no neon, no "scientific" grid background, no DNA helix, no hexagon pattern,
  no microscope illustration.
- No card around the method or the reference table.
- No claim the tool is validated beyond what the repo can show; do not round "within 0.01 point" up
  into "identical".
- No progress spinner theatre — the worker is fast; a status line is enough.
```

**MengTo techniques, and exactly where.**
- `light-mode-paper-technical` — the bench ground, the precise bracketed geometry and the restrained
  accent signals. It is the system for the whole page.
- `framed-grid-layout` — thin boundary lines and L-corner brackets around the figure pair only, marking
  it as the figure. Everything else is unframed.
- `container-lines` — the 1120px bench's vertical guides with corner squares, which gives a rule-based
  page visible structure without adding containers.
- `number-details` — the six method steps as `01–06` in mono, and the four detail values as a labelled
  numeric row. The page already numbers its steps; this makes the numbering a designed element.

**Do NOT use:** `tech-green-dark-mode-modern`, `bright-green-tech-system-webgl` (the name is tempting and
it is exactly wrong — a WebGL green system on a page whose data is green), `beam-glow-states`,
`glass-dark-ui`, `dither-background`, `background-grid-webgl`, every `threejs*`/`webgl-*` skill,
`ambient-section-particles`.

**Kept from today:** every copy string above; the six-step method and the Python-pipeline link; the
agreement claims and the accuracy-table link; the group's reference ranges with SDs and the
within-session caveat; the `:focus-visible { outline: 3px solid ... ; outline-offset: 2px }` rule
(re-coloured to the new accent); the `.visually-hidden` definition; `role="status" aria-live="polite"`
on #status and `role="alert"` on #warnings; the `tabindex="-1"` focus-on-result behaviour; the native
`<dl>` / `<details>` / `<figure>` semantics; `prefers-color-scheme` support; the "Download overlay /
Download mask / Copy result" trio; the privacy statement; the offline-after-load note.

**Primary action:** *Choose an image*. The three sample buttons are the honest secondary path and must
stay visible at 390 (see the overflow finding).

**Mobile (390):** the sample row wraps to two lines — never a clipped row. The figure pair stacks
vertically with "Input" above "Detected", each full-width with its own caption, so the before/after
comparison survives. The four detail values become a two-column mono grid. The reference table becomes
three rows of condition + value. The big number stays left-aligned and caps at 48 px so the detail grid
is visible in the same screen.

### Alternate direction — "Viewfinder"

> **Visual thesis.** A darkened microscope room: reticle brackets, a lit specimen, and chrome that does
> not compete with the only lit thing in the frame.

```text
GOAL
- Same tool, but optimised for looking rather than reading — for the moment of comparing input to mask.
- Success: the reader's eye goes to the specimen first and the number second, and the interface is
  invisible.

FORMAT
- Responsive web, 1440 / 390. Full-bleed specimen stage; a 900px reading column beneath.

LAYOUT
- The specimen is the hero: at 1440 the input and mask sit side by side, full-bleed, with a draggable
  divider between them so the reader can wipe between original and detection. (One interaction, and it
  is the one the task actually wants.)
- Reticle brackets at the four corners of each frame with the magnification in mono at the bottom-left
  of each — a real measurement annotation, not decoration.
- The readout sits in the gutter between controls and stage as a single mono line.
- Method, references and definitions live below, in a plain reading column.

TYPE SYSTEM
- System sans + system mono, mono-dominant for everything numeric — same as the primary direction.
- The number is smaller here (mono 600 40) because the image is the hero.

COLOR + MATERIAL
- Dark only, and genuinely dark: ground #0a0c0b, panel #121514, rule #232826, ink #e8ecea.
- ONE chrome accent, amber #d79b22 for controls and the reticle brackets — amber because it is the
  darkroom convention and because it cannot be confused with a fluorescence channel.
- Green remains data-only, exactly as in the primary direction. Blue nucleus stays as captured.
- Material: matte, unlit chrome. No shadows, no glass. The brackets are 1px.

IMAGERY / UI STYLE
- The specimen, at the largest size the viewport allows. Nothing else.

COPY
- Identical to the primary direction, including the added magnification caption.

CONSTRAINTS
- FONT: system sans + system mono
- STYLE: darkroom viewfinder
- MODE: dark only (a real divergence from today's light-default — pick one)

NEGATIVE PROMPT
- No light theme retrofit; if light is wanted, take the primary direction.
- No green chrome, no glow, no vignette, no lens-flare, no simulated eyepiece circle.
- Same Three.js/WebGL/shader ban.
- No auto-playing wipe animation on the divider — the reader drags it, or it does not move.
```

**MengTo techniques, and exactly where.**
- `split-layout-technical` — the dual-panel specimen stage with fine frame lines and mono metadata.
- `technical-wireframe-info-layout` — the corner annotations and connector labels on the specimen
  (magnification, threshold, pixel counts) as sparse information labels in precise diagnostic framing.
- `corner-diagonals` — the reticle brackets as chamfered corner marks on the two frames, and only there.
- `reveal-hover-effect` — the input/mask wipe. This skill is literally built for exposing a second
  aligned image through a mask, which is exactly the before/after this tool needs. It must degrade to a
  static side-by-side pair with no JavaScript and under reduced motion.

**Do NOT use:** `light-mode-paper-technical`, `framed-grid-layout`, `container-lines` (they belong to the
primary direction), plus everything on the primary's do-not list.

**Kept from today:** identical to the primary direction.

**Primary action:** *Choose an image*.

**Mobile (390):** the side-by-side wipe does not work at 390 — it becomes a two-state toggle
("Input / Detected") on one full-width frame, which is the same comparison with a tap instead of a drag.
Reticle brackets shrink to 12 px. The sample row wraps. The reading column is unchanged from the
primary direction's mobile treatment.

---

## What to decide first

1. **Ground.** `plato`, `plantit` and `microtubules` should stop being dark. That one decision breaks up
   the four-app sameness more than anything else in this document, and all three have a primary
   direction that depends on it.
2. **Honesty fixes, before any visual work.** `hoops`'s LIVE DATA pill and test-named sessions, and
   `plato`'s broken workflow diagram and fake calendar chips, are correctness problems, not taste
   problems. They should be fixed whichever direction Kalp picks, and they are cheap.
3. **Reduced motion.** Five of seven apps animate with no `prefers-reduced-motion` path. `promptflip`'s
   implementation is the reference; copy its pattern into `plato`, `plantit`, `hoops` and `emotes`.
4. **Typefaces.** `hoops` and `plantit` name Inter and never load it. Either load it or stop claiming it.
   Only two directions in this document add a display face (`plato`'s Newsreader, `emotes`'s one display
   700), and both are load-bearing.
5. **Then pick a lane per app.** The primary and alternate for each app are mutually exclusive by design
   — they carry different grounds, different type systems and different do-not lists. Blending them
   produces the reference-mismatch cluster `no-ai-design-slop` warns about.

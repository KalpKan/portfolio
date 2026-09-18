---
name: Kalp Kansara — projects
description: A microelectrode-array channel map of shipped projects; live is a measured signal, not a claim.
colors:
  sheet: "#f1f3f6"
  sheet-raised: "#ffffff"
  ink: "#15171d"
  ink-2: "#4d5261"
  ink-3: "#62677a"
  rule: "#c3c7cf"
  rule-soft: "#d9dde4"
  pad: "#e1e4ea"
  signal: "#1d3fd6"
  signal-ink: "#ffffff"
  signal-soft: "#d9defb"
  quiet: "#8b909c"
  sheet-dark: "#0e1014"
  sheet-raised-dark: "#14171d"
  ink-dark: "#e9eae4"
  ink-2-dark: "#aab0bd"
  ink-3-dark: "#7c8291"
  rule-dark: "#2c303a"
  rule-soft-dark: "#1f232b"
  pad-dark: "#1b1f27"
  signal-dark: "#7e97ff"
  signal-ink-dark: "#0b1030"
  signal-soft-dark: "#1f2a5a"
  quiet-dark: "#5d626e"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem / 4.5rem (md)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'opsz' 96, 'wdth' 92"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem / 1.5rem (md)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.03em"
    fontVariation: "'opsz' 96, 'wdth' 92"
  lede:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem / 1.375rem (md)"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.12em"
  meta:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0em"
  caption:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.625
rounded:
  none: "0px"
  ring: "2px"
spacing:
  hair: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
  3xl: "56px"
  4xl: "64px"
components:
  pad:
    backgroundColor: "{colors.pad}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px"
  pad-active:
    backgroundColor: "{colors.signal-soft}"
    textColor: "{colors.ink}"
  pad-lit:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
  channel-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "16px 12px"
  channel-row-active:
    backgroundColor: "{colors.sheet-raised}"
    textColor: "{colors.ink}"
  column-head:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0 0 8px"
  quiet-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.caption}"
  quiet-link-hover:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
---

# Design System: Kalp Kansara — projects

## Overview

**Creative North Star: "The Channel-Map Sheet"**

The site is the bench sheet a neuro lab prints after an impedance test: every project is one recording site on a microelectrode array, and "live" is a signal the page measured a moment ago, not a word someone typed. Light mode is that sheet under room light (cool paper, blue-cast ink); dark mode is the same sheet on the bench monitor with the ink logic inverted. Nothing is decorated. Hairline rules, a pad grid, mono site IDs and a single grotesque carry the whole page.

Density is editorial-instrument: one array map, one ruled channel list, both sharing the same site IDs so the map reads as a map, not a pattern. The one accent (signal cobalt) is spent only on sites returning a live health check. Every other state (coming, archived, case study, no signal, quiet) is a drawn mark at one stroke weight, never a colour. Motion is a single authored gesture: a live pad draws its spike trace once; everything else brightens in place.

**Key Characteristics:**
- Printout ground: flat sheet, hairline rules, no cards, no shadows, no radius.
- One accent, measured: signal cobalt appears only where a health check returned ok.
- State is a mark, never a hue (filled+trace, dashed, struck, reference triangle, flat quiet).
- Two faces: Bricolage Grotesque (opsz 96, wdth 92) for names; Geist Mono for IDs, labels, counts.
- Phone-first: 16px gutters, no horizontal scroll, dark mode from `prefers-color-scheme`.

## Colors

A cool paper sheet with blue-cast ink and one cobalt accent; dark mode swaps the sheet for a bench monitor and lifts the accent to a lighter periwinkle so it stays legible on near-black.

### Primary
- **Signal Cobalt** (`signal`, light `#1d3fd6` / dark `#7e97ff`): fill of a live pad, the "signal" word in a channel row, the inset backlight on an active row, `::selection` and the focus ring. Appears only on measured live signal or on focus.
- **Signal Ink** (`signal-ink`, `#ffffff` / `#0b1030`): the trace and site ID drawn on top of a lit pad.
- **Signal Soft** (`signal-soft`, `#d9defb` / `#1f2a5a`): the backlight tint of a pad whose channel row is hovered or focused. Never used as a text colour.

### Neutral
- **Sheet** (`sheet`, `#f1f3f6` / `#0e1014`): page ground, pad gap colour on the grid, the browser theme colour.
- **Sheet Raised** (`sheet-raised`, `#ffffff` / `#14171d`): the active channel row lifts to this; the only "surface" in the system.
- **Ink** (`ink`, `#15171d` / `#e9eae4`): names, display headline, lede, hover colour of quiet links.
- **Ink 2** (`ink-2`, `#4d5261` / `#aab0bd`): taglines, bio, column heads, row IDs and status word.
- **Ink 3** (`ink-3`, `#62677a` / `#7c8291`): sheet metadata line, footer, tag leads, quiet links at rest.
- **Rule** (`rule`, `#c3c7cf` / `#2c303a`): section borders under headers and column heads; scrollbar thumb.
- **Rule Soft** (`rule-soft`, `#d9dde4` / `#1f232b`): row dividers and the 1px grid between pads.
- **Pad** (`pad`, `#e1e4ea` / `#1b1f27`): resting fill of an unlit pad.
- **Quiet** (`quiet`, `#8b909c` / `#5d626e`): the flat filled mark for a site that is checking or has no health URL.

### Named Rules
**The Measured Accent Rule.** Signal cobalt is spent only on a site whose health check returned ok, on the "signal" word next to it, and on the row backlight and focus ring. Static status (live, demo, coming, archived) never gets the accent.

**The Mark-Not-Hue Rule.** Every non-live state is drawn: hollow square (down), dashed hollow (coming), struck (archived), square with reference triangle (case study), flat quiet fill (checking). No green, red, amber or grey dots.

## Typography

**Display Font:** Bricolage Grotesque (variable, `opsz` and `wdth` axes loaded; fallback ui-sans-serif, system-ui)
**Body Font:** Bricolage Grotesque (same face, default axes)
**Label/Mono Font:** Geist Mono (fallback ui-monospace, SF Mono, Menlo)

**Character:** A compact, slightly condensed grotesque for names, set tight at the display optical size; a plain mono for everything the sheet "measured" (IDs, counts, dates, status words, tags). Weight is 400 everywhere; hierarchy comes from size, width and face, not boldness.

### Hierarchy
- **Display** (400, `2.75rem` → `4.5rem` at md, line-height 0.95, `-0.03em`, `opsz 96 / wdth 92`, `text-wrap: balance`): the name on the hub; the project name on a case-study page (`2.25rem` → `3.5rem`, 0.98).
- **Headline** (400, `1.25rem` → `1.5rem` at md, leading-tight, same `.display` axes): a project name in its channel row.
- **Lede** (400, `1.125rem` → `1.375rem`, leading-snug, max 34ch): the one-line instruction under the name.
- **Body** (400, `0.95rem`, leading-snug for taglines / leading-relaxed for prose, max 52–60ch): taglines, bio, case-study prose.
- **Label** (mono 400, `11px`, `0.12em`, uppercase, tabular-nums): column heads, the array count, the "updated" stamp, the back link.
- **Meta** (mono 400, `12px`, no tracking, tabular-nums): lower-case site IDs, status words, health words, tag leads, destination verbs and repo/contact links. On a compact pad (phone strip) the ID drops to `10px`; nothing else on the sheet is smaller than 12px.
- **Caption** (400, `12px`, leading-relaxed): pad-map legend and footer; mono 12px for repo links.

### Named Rules
**The Two Faces Rule.** Anything measured or indexed (site ID, count, date, status, tag, destination word) is Geist Mono with `tabular-nums`. Anything named or described is Bricolage Grotesque. No third face, no weights above 400.

## Layout

One centred column, `max-w-[72rem]`, with `px-4` (16px) gutters on phones and `px-8` (32px) from md. Top padding 40px → 64px; bottom 64px. The hub is header, board, footer stacked; the header closes with a 1px `rule` and 32px → 40px of padding.

The board is a single column below lg (gap 32px → 40px at md) and a two-column grid at lg: a `17rem` pad map that sticks at `top-6`, then the channel list filling the rest, column gap 56px. Below lg the pad map is a **12-wide strip**: on phones the pads are whatever twelfth of the gutter width remains (24–32px, `p-1`, 10px ID, 8px mark, 8px trace), and from sm the section is capped at `max-w-[37rem]` so the pads stop at 48px (`p-2`, 11px ID, 12px mark, 12px trace). At lg the strip becomes the 4-column map (pads about 67px, 24px trace). Pads are always separated by 1px of `rule-soft` (gap-px on a `rule-soft` background, 1px inner padding). The legend under the map is one truncated caption line on phones (`filled = live signal · dashed = coming · triangle = case study`, full text in `title` and referenced by `aria-describedby`) and the full three-sentence legend from sm. The array header ("Array" + count line) stacks into two lines at lg because the count line is nearly as wide as the map column. Each channel row is a three-column grid (`3.25rem` ID column, fluid name column, auto destination column), `gap-x-3`, `py-4` → `py-5`, and bleeds `-mx-3` so its active fill runs edge to edge of the list.

Rhythm is a 4px base with the steps actually used: 4, 8, 12, 16, 24, 32, 40, 56, 64. No horizontal scroll: `html { overflow-x: hidden }`, `body { overflow-x: clip }`, and every fluid column is `minmax(0, 1fr)`.

## Elevation & Depth

No shadows. The sheet is flat; depth is tonal and one step deep. An active channel row rises from `sheet` to `sheet-raised` and gains a 2px inset signal edge on its left (`box-shadow: inset 2px 0 0 0 var(--signal)`), which is a drawn rule, not a drop shadow. A row reached from its pad (`#site-<slug>`) keeps the same raised fill and edge via `:target`. Pads brighten (pad → signal-soft → signal) rather than lift. Focus is a 2px `ring` outline offset 3px; inside a row the outline is inset by 2px so it never causes overflow.

### Named Rules
**The Brighten, Don't Move Rule.** Hover, focus and live state change colour over 300ms and nothing else. No translate, no scale, no shadow growth. The only animated geometry is the spike trace drawing once (1.6s, `cubic-bezier(0.16, 1, 0.3, 1)`), disabled under `prefers-reduced-motion`.

## Shapes

Square everywhere. Pads are `aspect-square` with 0 radius; rows and section borders are 1px hairlines; the only radius in the system is the 2px on the `:focus-visible` outline. Marks are 16-unit SVG squares at 12px (in the pad) or 14px (in the row) with a single 1.25 stroke, `vectorEffect: non-scaling-stroke`, round joins and caps. The destination arrow shares that stroke. Links underline at 1px with `text-underline-offset: 0.18em`.

## Components

### Pad (Site Map cell)
- **Shape:** square, 0 radius, `p-2`, ID top-left in mono 11px, mark bottom-right at 12px.
- **Rest:** `pad` background, `ink` text.
- **Active (row hovered/focused):** `signal-soft` background; text stays `ink`.
- **Lit (health ok):** `signal` background, `signal-ink` text, the 64×24 spike trace path drawn once via `.trace`.
- **Focus:** global 2px `ring` outline, offset 3px. Transition `colors 300ms`.

### Channel Row
- **Shape:** three-column grid, `-mx-3 px-3 py-4 md:py-5`, `rule-soft` divider, `scroll-mt-6` anchor.
- **Columns:** mono 12px ID + 14px mark (ink-2); headline name with a stretched pseudo-link (an external `<a>` or a `next/link`; plain text when the row has nowhere to go yet), tagline (ink-2, 0.95rem), then a mono 12px meta line (status word in ink-2, the health word `health-checked` in `signal` when ok / `health check failed` / `checking`, tags led by middle dots in ink-3); destination verb + arrow (`open` / `repo` / `read`, or an em dash when there is no destination), optional "repo" link.
- **One kind per row:** mark, status word, verb and href all derive from `rowFor()` in `lib/projects.ts` (`live`, `archived`, `coming`, `showcase-soon`, `showcase`). A "coming" row never says "open"; a case study that is not written yet says "case study soon" and links to its repo.
- **Hit areas:** the whole row is the link; the small "repo" link, the footer links and the contact links are drawn at 12px but padded to a 40px-tall target with negative margins so the visual rhythm does not change.
- **Active:** `sheet-raised` background plus the inset 2px signal edge; both sides of the board set `active` for each other.
- **Focus:** row outline 2px `signal`, inset 2px, via `has-[a:focus-visible]`.

### Column Head / Sheet Metadata
- **Style:** mono 11px uppercase `0.12em` in ink-2 (column heads) or ink-3 (the "updated <date>" stamp), `tabular-nums`, closed by a 1px `rule` and `pb-2`. Used above the pad map ("Array" + "N live · N coming · N case studies", computed from the registry, one line below lg and two lines at lg) and the channel list ("Site / Project / Go").

### Site Marks
- Six drawn states at one stroke (1.25): filled square with trace (live, `signal`), hollow square (down), dashed hollow (coming), struck square (archived), square with filled triangle (case study), flat `quiet` fill (checking / no health URL). Colour inherits `currentColor` except live (`signal`) and quiet (`quiet`).

### Quiet Links
- **Style:** inherit size from context (12px footer, 11px mono back link), `ink-3` at rest, `ink` + underline on hover, always a 40px-tall target. External links open in a new tab with `rel="noreferrer"`. There are no buttons, inputs or chips in the system.

### Contact Row
- **Style:** a mono 12px line of quiet links (email, `github.com/<handle>`, LinkedIn) under the bio, `ink-2` at rest. Rendered by `components/ContactRow.tsx` from `lib/site.ts`; renders nothing while every value is empty.

### Share Card
- `app/opengraph-image.tsx` (1200×630): the light sheet, the display name at 108px, the lede, then the 12-pad strip with the same marks and the count line, drawn with Bricolage Grotesque and Geist Mono fetched at build (bundled fallback offline). A pad is filled when the registry says `live`, since a build cannot measure a signal.

## Do's and Don'ts

### Do:
- **Do** keep 16px gutters on phones (`px-4`) and 32px from md; every fluid grid column is `minmax(0, 1fr)`.
- **Do** ship both themes: every colour is a paired `--token` in `globals.css`, switched by `prefers-color-scheme` and overridable with `data-theme`.
- **Do** set anything measured (IDs, counts, dates, status, tags) in Geist Mono with `tabular-nums`; names and prose in Bricolage Grotesque.
- **Do** apply `.display` (opsz 96, wdth 92, -0.03em) to any name-sized heading, and only there.
- **Do** express a new state as a new drawn mark at stroke 1.25 inside the 16-unit square.

### Don't:
- **Don't** use signal cobalt for anything that is not a measured live signal, a focus ring, or the active-row edge.
- **Don't** add status colours (green/red/amber dots) or a second accent.
- **Don't** add shadows, radii, gradients, or cards; the sheet is flat and square.
- **Don't** animate position or size; only colour transitions (300ms) and the one-shot trace draw.
- **Don't** use weights above 400 or a third typeface.

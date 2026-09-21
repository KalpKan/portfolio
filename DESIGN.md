---
name: KalpOS
description: A desk, not a page. A black lock screen unlocks into frosted chrome, tinted folders and rounded windows; every number is copied from Kalp's Claude Design mock and "live" is still a measured signal.
colors:
  paper: "#f3f2f2"
  paper-raised: "#f8f4f4"
  ink: "#201e1d"
  ink-2: "#605d5d"
  ink-3: "#8a8686"
  rule: "#d7d3d3"
  rule-soft: "#e4e1e1"
  pad: "#eae7e7"
  cyan: "#0088b0"
  teal: "#006786"
  magenta: "#d6006c"
  note: "#f6e7ae"
  black: "#000000"
  frost: "rgba(248,244,244,0.72)"
  frost-dock: "rgba(248,244,244,0.62)"
  frost-sidebar: "rgba(234,233,233,0.7)"
  frost-edge: "rgba(255,255,255,0.65)"
  light-close: "#ff5f57"
  light-min: "#febc2e"
  light-zoom: "#28c840"
  light-off: "#d7d3d3"
typography:
  chrome:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.2
  brand:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
  lock-clock:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "128px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  lock-date:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "21px"
    fontWeight: 500
    lineHeight: 1.2
  tile-name:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.2
  tile-status:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
  widget-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.06em"
  note-body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  window-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  window: "12px"
  widget: "18px"
  dock: "22px"
  dock-tile: "14px"
  tile: "10px"
  filter: "7px"
  pill: "999px"
  lock-pill: "18px"
spacing:
  grid: "22px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "26px"
components:
  menubar:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.ink}"
    typography: "{typography.chrome}"
    padding: "0 18px"
  dock:
    backgroundColor: "{colors.frost-dock}"
    rounded: "{rounded.dock}"
    padding: "9px"
  window-focused:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.window}"
  window-behind:
    backgroundColor: "rgba(248,244,244,0.9)"
    rounded: "{rounded.window}"
  sidebar:
    backgroundColor: "{colors.frost-sidebar}"
    padding: "12px 12px 14px"
  tile-live:
    backgroundColor: "{colors.cyan}"
    textColor: "#ffffff"
    rounded: "{rounded.tile}"
  tile-grey:
    backgroundColor: "{colors.pad}"
    rounded: "{rounded.tile}"
  note:
    backgroundColor: "{colors.note}"
    textColor: "{colors.ink}"
    typography: "{typography.note-body}"
    rounded: "{rounded.widget}"
    padding: "18px 20px"
  resume-pill:
    backgroundColor: "{colors.cyan}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  lock-pill:
    backgroundColor: "rgba(255,255,255,0.14)"
    textColor: "#f3f2f2"
    rounded: "{rounded.lock-pill}"
    padding: "0 7px 0 16px"
---

# Design System: KalpOS

## Overview

**Creative North Star: "A desk you unlock"**

The hub is an operating system, not a page. It starts from a power button: pure black with a faint ⏻ and "press any key to start"; the first key, click or tap sounds the startup chime and boots the machine the way a Mac does (a solid white KK mark, a thin progress bar that fills with the real health round), then a black lock screen shows the visitor's own time over a very large clock, Kalp's avatar and a frosted password pill; typing anything and pressing Enter blurs the lock away while the desk breathes in behind it. Every plain visit boots and locks; only a shared link (`/projects/<slug>`, or `?desk`) lands on the desk directly. The desk is paper (`#f3f2f2`) with a 22 px dot grid, a frosted menubar, two tinted folders, a document, an @ tile, a trash can, a yellow note, a photo frame and a frosted dock. Folders open rounded windows that can be dragged, stacked, minimised into the dock and closed with Esc. Below 768 px the desk folds into one sheet with a bottom "Projects" drawer.

The source of truth is Kalp's Claude Design project (`docs/design/KalpOS-Mockups.dc.html`, cards 3c, 3b, 2a, 2c, 2d, 2e, 1e). Every colour, radius, blur, shadow, size and timing in `app/kalpos.css` is copied from those cards; where the mock does not cover a surface (About, Contact, Hobbies, Trash, Music, Terminal, a case study inside a window) the same tokens are reused with nothing new invented.

**Key Characteristics:**
- **The desk has two appearances, Light and Dark (T6.10, 2026-09-21).** This supersedes the original "black is the only dark surface, the desk never inverts" decision, at Kalp's request ("implement a dark mode to the portfolio website"). Light is still the default and still the mock; Dark is the same desk with the same geometry on a near-black ground. The power screen, the boot and the lock are black in both, as they always were.
- Chrome is the system sans (SF Pro on Apple devices); Geist Mono only where card 1e uses it (phone top bar and sheet meta) and in the Terminal window.
- Frost everywhere chrome floats: `backdrop-filter: blur(20px) saturate(1.4)` on the menubar, widgets and window sidebar; `blur(24px)` on the dock.
- "Live" is still measured: a project tile turns cyan and draws its spike trace only when the hub's `/api/status/<slug>` proxy answers `ok: true`.
- One motion curve for geometry, `cubic-bezier(.2,.8,.2,1)`; opacity and blur use a plain ease.

## Colors

### Appearance (T6.10)

Every colour below is a **token** declared once on `:root` in `app/globals.css` as a `light-dark()` pair — the light value is the mock's, the dark value is beside it on the same line, which is what stops the two appearances drifting. `app/kalpos.css` and `app/kalpos-extras.css` contain no colour literal at all any more, except the boot / lock / power / restart layers (black in both), the Terminal (its own dark surface in both), and the drawn icons, whose shading is part of the drawing. A test enforces that (`app/appearance.test.ts`, "no component carries its own colour any more").

Which half is used is decided by `color-scheme`, set by exactly three selectors:

```
:root                                                   -> light   (the default)
:root[data-appearance="dark"]                           -> dark
@media (prefers-color-scheme: dark) { [data-appearance="auto"] } -> dark
```

`<html data-appearance>` is written **before the first paint** by `APPEARANCE_SCRIPT` (`lib/appearance.ts`, inlined in `app/layout.tsx` beside `BOOT_SCRIPT`), so a dark visitor never sees a white frame. The attribute carries the *choice*, not the resolved value: `auto` is resolved by CSS, so the desk follows the machine live with no listener. The choice is persisted in `localStorage` `kalpos:appearance`; **the default is Light**, so nothing changes for a visitor who has not chosen (overnight supervisor ruling 2026-09-21 — the brief added a capability, not a change to what visitors see; flipping `DEFAULT_APPEARANCE` in `lib/appearance.ts` to `auto` is the one-line change if Kalp wants it).

`light-dark()` is Baseline 2024 and Lightning CSS compiles it away into the `--lightningcss-light` / `--lightningcss-dark` pair, so the built stylesheet needs no modern-browser support at all.

**What dark is.** Ground `#121214` with the same 22 px dot grid at `rgba(255,255,255,.085)` and the sheen at `.045`; windows `rgba(32,32,36,.9)` unfocused and `#2a2a2e` focused; the menubar `rgba(34,34,38,.72)`, the dock and the menus `rgba(28,28,32,.68)`, the window sidebar and Quick Look `rgba(22,22,26,.72–.9)` — all at the same blur and saturation as light. Cards (the About document, the photo frame, the folder slip) `#1e1e22`; pads `#2b2b2f`. Ink `#ededec` / `#a9a5a5` / `#9a9696`. Every hover tint and hairline flips from ink-at-α to white-at-α (`--tint-06` … `--tint-28`, the alpha in the name). Radii never move.

**What does not move.** Cyan `#0088b0` and magenta `#d6006c` are *fills* carrying white text, so they are identical in both (white on cyan is the same 4.08:1; cyan on the dark ground is 4.59:1). What moves is accent **text**: `--teal` goes `#006786 → #5cc3ec`, link hover `#0a303e → #a8e2f6`, the Music dock tile's note `#d6006c → #ff7fb0`. The traffic lights keep macOS's three colours; only the unfocused grey moves.

**Shadows** keep the mock's geometry and change colour only: warm grey at .06–.25 becomes pure black at .5–.7, because a grey shadow is invisible on a near-black ground, and the hairline ring (`--hair`, white at .09) does more of the separating.

**Contrast** is measured, not asserted by eye: `app/appearance.test.ts` flattens every frosted surface onto the ground it floats over and records the ratio for 27 pairs in a snapshot. Every piece of text clears AA (4.5:1) in dark — including `--ink-3` meta, which is 4.89:1 in dark against the 3.30:1 the mock shipped in light.

### Surfaces
- **Paper** (`#f3f2f2`, dark `#121214`): the desk ground and the phone sheet ground.
- **Paper Raised** (`#f8f4f4`, dark `#2a2a2e`): a focused window, the phone bottom sheet, the dock's PDF tile gradient end.
- **Black** (`#000`): the power screen, the boot, the lock screen and the restart fade; the same in both appearances.
- **Frost** (`rgba(248,244,244,.72)` + `blur(20px) saturate(1.4)`, edge `rgba(255,255,255,.65)`): menubar and the NOW PLAYING widget. The dock is `rgba(248,244,244,.62)` + `blur(24px)` with a `rgba(255,255,255,.75)` edge. The window sidebar is `rgba(234,233,233,.7)` + `blur(20px)`.
- **Note** (`#f6e7ae`, dark a muted `#54492a` with its own `#f3e9c6` ink at 7.31:1): the yellow NOTE widget and the phone note; also the Notes dock tile gradient (`#fff6d6 → #f6e7ae`, dark `#6b5d33 → #54492a`). The note stays yellow in dark rather than inverting: it is a piece of paper.

### Ink
- **Ink** (`#201e1d`, dark `#ededec`): every label; menubar items at `.72` opacity; sidebar labels at `.5`.
- **Ink 2 / Ink 3** (`#605d5d` / `#8a8686`, dark `#a9a5a5` / `#9a9696`): case-study prose and meta inside windows (the legacy `ink-2`/`ink-3` tokens the showcase components use).
- **Rule / Rule Soft / Pad** (`#d7d3d3` / `#e4e1e1` / `#eae7e7`, dark `#3d3d42` / `#2f2f33` / `#2b2b2f`): unfocused traffic lights, About-me document lines, phone row tiles, the grey project tile.

### Accents
- **Cyan** (`#0088b0`): a live tile, the Résumé pill, the Contact tile (the envelope's ground) and the hobby glyph chips' ink, the NOW PLAYING progress bar, focus rings. Spent only on measured signal and primary actions.
- **Teal** (`#006786`, dark `#5cc3ec` — the one accent that must move, since teal on a dark window is 1.9:1): the "Live signal" status word, links inside windows, the Projects folder tab, the phone "close" / "↓".
- **Magenta** (`#d6006c`): the Now-playing tile and dot; the Hobbies folder is `#aa0b56 / #8e0f4a / #ff90b1→#ff458e→#d82071`.
- **Traffic lights**: `#ff5f57`, `#febc2e`, `#28c840` on the focused window in both appearances; all three `#d7d3d3` behind (dark `#4a4a4f`).

### Named Rules
**The Measured Accent Rule.** Cyan on a project tile means its health check returned `ok: true` a moment ago (browser check of `/api/status/<slug>`, once per load). Checking, no signal, case studies and coming tiles are grey or dashed with a drawn mark.

**The Frost Rule.** Anything that floats over the desk (menubar, dock, widgets, window sidebar) is frosted paper, never opaque white and never a drop-shadowed card without blur.

## Typography

**Chrome font:** the system stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, sans-serif`), as the mock renders it.
**Mono:** Geist Mono 400 (self-hosted latin subset, `app/fonts/GeistMono-400-latin.woff2`).

### Hierarchy
- **Lock clock** 500 / 128 px / 1.1 / `-0.035em` (96 px below 480 px). **Lock date** 500 / 21 px at `.92`. Name 400 / 14 px. Pill placeholder 13 px at `.6`; caption 12 px at `rgba(255,255,255,.55)`.
- **Menubar** 13 px; brand 600; items `.72`; clock 12.5 px tabular; Résumé pill 12 px.
- **Desk labels** 13 px under each icon (Trash at `.65`); folder badge 10 px white `.8`.
- **Widgets**: label 10.5 px `.06em` uppercase `.55`; note body 15/1.45; NOW PLAYING title 600 14, artist 12 `.6`; READING title 600 14/1.25, authors 12/1.3 `.6`; photo caption 10 px italic `#605d5d`.
- **Window**: title 600 13 px centred (`.5`, `.85` when focused); sidebar REGISTRY label 10.5 px; filter rows 13 px; header "Projects" 600 14 + count 12 `.5`; search 12 px; tile name 600 13.5/1.2; tile status 11 px (`#006786` for Live signal, `.55` otherwise); footer hint 11.5 `.5`; sidebar foot 11/1.5 `.5`.
- **Window bodies** (About, Contact, Trash): 13.5/1.55, h2 600 20 px. **Music**: the same body; rows are title 600 at 13.5 over the artist at 12 / `.6`, the index and the "—" duration in Geist Mono 11 at `.55` / `.45`, the "unreleased" pill Geist Mono 10 upper-case `.06em` in a 1 px `rgba(32,30,29,.28)` ring, the times under the progress line Geist Mono 10 tabular, the footer 10.5 at `.45`; the cover's initials are the system sans at 600 / 64 px / `-0.04em` in white with a soft `0 2px 12px rgba(0,0,0,.25)` shadow. **Terminal**: Geist Mono 12/1.7 on the dock tile's `#2b2929 → #201e1d`; output cyan `#62c5ee` for directories, ok and the mark, `#ff90b1` for errors, `.55` for the prompt and dim lines; the caret is a drawn block that blinks at 1.1 s only while the input has focus.
- **Case study in a window**: title 600 26/1.1, lede 15, prose 14.5/1.6, section labels the 10.5 px uppercase label, meta and tech in Geist Mono 11 px.
- **Phone**: top bar Geist Mono 11 px with the 600 12 px brand; name 600 26/1.1; line 13/1.45 `.65`; folder labels 12 px; note 14/1.5; sheet title 600 16 with Geist Mono 10.5 meta and 11 px "close"; rows 600 14 + Geist Mono 10 status + 12 arrow `.45`.

### Named Rules
**The System Face Rule.** No display webfont. The chrome is whatever the visitor's system draws menus in; only the mono is shipped.

## Layout

The desk is `position: fixed; inset: 0`; it never scrolls (windows scroll inside). Menubar 32 px. **Icons live on the 22 px dot grid** (`lib/icons.ts`): each is a 96 px-wide button placed absolutely at `(38, 64) + cell × 22`, owning a 5 × 5-cell footprint (110 × 110 px) that no other icon may overlap; the default layout is the card's two-column grid (Projects `c0 r0`, Hobbies `c5 r0`, About me `c0 r5`, Contact `c5 r5`, Now playing `c0 r10`, Trash `c5 r10`). An icon can be dragged anywhere on the desk (1:1 while held; the release snaps to the nearest free cell, never above the 44 px menubar line, never into the dock's band (bottom ≤ vh − 106), 12 px inside the sides; a drop on another icon nudges to the nearest free cell, rings outward); arrow keys on a focused icon move it one cell (through a neighbour to its far side). Positions persist per icon in `localStorage` `kalpos:icons`, are re-fitted on resize, survive Lock and Restart, and **Clean Up** (KalpOS menu, ⌥⌘1) restores the default. Widgets never move. Icon boxes: (folder 70×56, document 50×62, app tile 58×58, trash 48×56; the phone grid adds a 58×58 Terminal tile since it has no dock). Widgets at `right 48 / top 64` in a `150px 150px` grid with 16 px gaps (note spans both; **READING** spans both too, under NOW PLAYING, so the whole column is note / photo + now / reading and stays ≤ 490 px tall — it clears the dock at 900 and at 1024 px of viewport height, checked). Dock centred at `bottom 16`, 54 px tiles, 10 px gaps, 9 px padding, one 1 px separator before Trash.

Windows: Projects 760 px wide with a 184 px sidebar (`12px 12px 14px` padding) and a 3-column tile grid (`padding 18; gap 18px 16px`, tiles 4:3); other windows 460–560 px with a 38 px title bar (Reading is 470: the 120 × 180 jacket beside the title, authors and the link out; Hobbies is 520: a two-column list) (Music is 520: a `180px 1fr` grid with a 20 px gutter, the 180 px cover with its progress line and transport stacked on the left, the list on the right, the footer pinned to the bottom of the body). The first window opens at `top 86`, centred; each further window steps 28 px down and right. Windows never run under the dock (`max-height: 100dvh − 202px`); their bodies scroll. **Quick Look** (T6.6) is a panel inside the Projects window's main pane under its 46 px header: 300 px on the right at viewports ≥ 1024 px, the whole pane below that; the sidebar's frost (`rgba(234,233,233,.88)` + `blur(20px)`, a `rgba(32,30,29,.08)` left rule), `12px 16px 14px` padding, a 16:10 frame (radius 10, the sm shadow + hairline, `#eae7e7` under the picture; at most 380 px wide as an overlay), then name 600/15, the status word at `.55`, the tagline, tags as `rgba(32,30,29,.08)` pills at 11 px, one `#0088b0` button (the confirm sheet's) and a hint line at `.5`. Every tile carries a 22 px ⓘ (`rgba(248,244,244,.9)`, sm shadow, an italic *i*) at `top 6 / right 6` of its art that appears on hover, on focus and while its panel is open; the previewed tile's art wears a 2 px `#0088b0` outline at 2 px. The first window opens at `top 86`, centred; each further window steps 28 px down and right. Windows never run under the dock (`max-height: 100dvh − 202px`); their bodies scroll.

Phone (≤ 768 px): 30 px frosted top bar; content padded 20 px; 3-column folder grid (`gap 22px 12px`); the note rotated −1°; the Projects sheet peeks 230 px up from the bottom and expands to `top 30px`; other sheets are full height.

The dot grid is 22 px (`radial-gradient(rgba(32,30,29,.18) 1.1px, transparent 1.3px)`), 20 px at `.20` on the phone; desk icons snap to it when dragged.

## Elevation & Depth

Depth is frost plus three shadows: **sm** `0 1px 2px rgba(45,43,43,.14)` (icons, dock tiles, tiles), **md** `0 3px 10px rgba(45,43,43,.12–.16)` + `0 0 0 1px rgba(32,30,29,.08)` (widgets, an unfocused window), **lg** `0 12px 32px rgba(45,43,43,.22)` + `0 0 0 1px rgba(32,30,29,.1)` (the focused window, the dock at `.2`). Folders use `drop-shadow(0 2px 3px rgba(45,43,43,.25))`. Focus lifts a window from md to lg in 180 ms while its traffic lights fill from grey and its frost brightens to `#f8f4f4`.

## Shapes

Rounded, in a small family: windows 12, widgets 18, dock 22 with 14 px tiles, project tiles 10, filter rows 7, the search field 7, the Résumé pill 999, the lock pill 18. Folder tabs are `7px 10px 0 0`, bodies `0 8px 10px 10px`, fronts `4px 4px 10px 10px`. Marks stay drawn: the spike trace (`M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18`, white 1.6 stroke at the bottom of a live tile), ○ 10 px `#9b9797` (checking), — (no signal), ▲ `#444141` (case study), a `1.5px dashed #bab6b6` outline (coming).

## Motion

One curve for geometry, `cubic-bezier(.2,.8,.2,1)`; opacity and blur `ease`.

- **Power screen** (2026-09-20, Kalp: "make the chime play on the starting-up animation"; a browser starts audio only inside a gesture, so the machine starts from a power button): pure black (`#000`). Centred: a drawn ⏻ (SVG, a 2.4 px round-capped arc with a gap at the top and a stem, 40 × 40, `rgba(243,242,242,.35)`) and, 40 px under it, "press any key to start" (400 / 12 px system, `+0.01em`, `rgba(243,242,242,.45)`; "tap to start" on a coarse pointer). Nothing moves. Any key (not a lone modifier, not Escape, never a ⌘/Ctrl chord: ⌘L and ⌘R stay the browser's), click or tap: the AudioContext is created and resumed inside that gesture, the chime sounds at once, and the boot starts. A Restart already had its gesture (the click, the terminal's Enter): no power screen, the chime sounds as the boot appears. If audio still cannot start the boot runs silently.
- **Boot** (the macOS idiom, 2026-09-20; this replaces card 2a's blur-resolve at Kalp's request, "make the starting-up animation look more like macOS"): pure black (`#000`). The KK mark (600 / 96 px / 1, `-0.02em`, `#f3f2f2`) as a solid white silhouette, centred 35 % from the top, fades in over 400 ms (opacity only: no blur, no scale, no hairline). 300 ms after that a thin rounded bar appears at 62 % of the height (300 ms fade): 22 vw wide (160–320 px), 5 px tall, radius 3, track `rgba(243,242,242,.18)`, fill `#f3f2f2` from the left (`transform-origin: left`, `cubic-bezier(.4,0,.2,1)`). The fill is real readiness, never moving backwards: one step for the registry, one per health check, 400 ms per step, and the step to 100 % is one 1.4 s glide (checks usually answer before the bar is shown, so the bar is always seen filling for at least 1.4 s and the boot ends with the glide: never before 2.1 s from the power button, at most 4 s regardless). At 100 % it holds 250 ms, then the whole layer fades over 600 ms while the lock's status, clock and user fade up under it (black stays black). Deep links and `?desk` skip the power screen and the boot (the pre-paint script hides them before the first paint).
- **Appearance** (T6.10): choosing Light, Dark or Auto cross-fades the whole desk over **160 ms** — one `.kos-appearance-shift` class put on `<html>` for exactly that long carries a single transition list for every painted property in the chrome (background, border, shadow, colour, fill, stroke, outline), so the desk changes as one surface rather than as a hundred independent tweens. Geometry is not in the list, so nothing moves. Under reduced motion the swap is instant: a crossfade of a full-screen frosted desk is exactly what that setting asks us to drop.
- **KalpOS menu**: the brand word is a menu button. The dropdown is the dock's frost (`rgba(248,244,244,.62)` + `blur(24px) saturate(1.4)`, radius 12, `rgba(255,255,255,.75)` edge, `0 12px 32px rgba(0,0,0,.2)`), 6 px padding, 13 px rows with 6 px vertical padding and a 7 px radius, hover/focus tint `rgba(32,30,29,.09)`, 1 px separators at `rgba(32,30,29,.1)`, shortcut hints at `.5`; it drops in over 140 ms from `translateY(-4px) scale(.96)` on the one curve. Rows: About KalpOS · Clean Up (⌥⌘1, desk only) · Lock Screen (⌃⌘Q) · Restart… (⌃⌘R) · **Appearance ▸** · Mute / Unmute chime. Appearance is a real submenu (T6.10): the row carries `aria-haspopup="menu"` and a `▸`, and opens a second frosted panel one pixel to its right holding Light / Dark / Auto as `role="menuitemradio"` rows with a ✓ on the chosen one; → or Enter opens it on the row already chosen, ↑/↓ wrap, ← or Esc goes back to the row without choosing. On the phone there is no room beside a 240 px panel, so the same three rows lay out indented under the row instead of flying out. The terminal's `theme light|dark|auto` is the same switch (`theme` alone reports the current one). Shortcuts are ⌃⌘ or ⌥⌘ chords only: ⌘L stays the browser's address bar and is never intercepted (Kalp, 2026-09-20). It is portalled beside the bar, never inside it: a frosted bar is a backdrop root, so a child's blur could not see the desk. On the phone the ■ KalpOS in the top bar opens the same menu with 44 px rows and no shortcut hints.
- **Lock Screen** (the unlock in reverse): the desk goes to `opacity 0; blur(10px); scale(1.06)` over 320 ms on the one curve while the lock comes back from `opacity 0; blur(14px); scale(1.05)`; then the windows (or the phone's sheets) are cleared, `data-boot` is dropped so the chrome drop-in replays on the next unlock, and the password field takes focus. No chime: it is the same boot.
- **Restart** ("Restart KalpOS? The desk will reboot.", a 300 px window-idiom sheet, `#f8f4f4`, radius 12, the lg shadow, over a `rgba(32,30,29,.18)` scrim, Restart focused, Esc / scrim / Cancel back out): the whole desk fades under `#0b0b0c` over 300 ms, then the stage machine is set back to `boot` and everything the boot owns is reset (windows, the health round, the chime, the pre-paint attribute), so the mark, the hairline, the chime, the lock and the unlock replay exactly as a fresh visit without a page load. The terminal's `reboot` / `restart` does the same with no sheet after printing "Restarting…"; `lock` / `logout` are Lock Screen.
- **Chime**: an original G major spread (G3 · D4 · G4 · B4, triangle/sine, ±4 cents), 120 ms attack, 500 ms swell, 1.8 s release, low-pass 2.2 kHz, master 0.3, from the Web Audio API. Once per boot, at the boot (2026-09-20: no longer at unlock): inside the power-button gesture on a fresh visit, or at the boot mark after a Restart (a Restart is a new boot; locking and unlocking again is not). A speaker toggle in the menubar's right cluster mutes it (`kalpos:mute`). It plays under reduced motion (sound is not motion).
- **Unlock** (3c/3b/2a): the pill pulses once (400 ms, `box-shadow 0 0 0 3px rgba(255,255,255,.35)`); the clock lifts 30 px; the lock goes to `opacity 0; blur(14px); scale(1.05)` over `.6s / .7s / .8s` while the desk comes from `opacity 0; blur(10px); scale(1.06)` over `.7s / .8s / .9s`; then the menubar drops in from −10 px (300 ms delay), icons and widgets pop 40 ms apart from 420 ms, the dock rises 24 px last (560 ms). A deep link or `?desk` gets a 400 ms crossfade instead; there is no returning-visitor skip.
- **Open a window** (2e): the icon dips to `.94` for 90 ms; the frame grows from the icon's rect in 380 ms (`kos-win-open`); content fades in over 120 ms behind it.
- **Close** (2026-09-20, like macOS): in place, `scale(1) → scale(.96)` and `opacity 1 → 0` over 160 ms on the one curve (`kos-win-close`), then the unmount; it never travels toward the icon. A case-study window closing also restores `/`.
- **Minimise**: the frame travels into its own dock tile (`[data-window]`, the Finder tile for a case study) over 320 ms, scaling to the tile and fading to `.4` (`kos-win-min`), then the tile shows the running dot. Each beat has its own keyframes and runs exactly once: CSS only restarts an animation when its *name* changes, so a "reverse of the open" that shared the name never played (incidents.md 2026-09-20). Whatever is still running on the frame is cancelled first, and a leaving frame ignores further close / minimise.
- **Phone sheets**: a sheet closes with a plain slide to `100%` (380 ms), then the Projects sheet peeks back; nothing swaps mid-slide.
- **Quick Look** (2d, T6.6): Space on a focused tile, or its ⓘ, fades the panel in over 160 ms (`ease`, opacity only; the ⓘ itself fades in 120 ms). Arrow keys move the focus one tile (← →) or one row (↑ ↓, three columns, the edges stop) and the panel follows the focus with no animation of its own; Space or Esc closes it in place, Esc never reaching the window. The Open / Read button does exactly what clicking the tile does, a case study growing from the panel's frame.
- **Drag**: 1:1 with the pointer; on release the window coasts with its throw velocity (capped at 2.5 px/ms) and settles inside the desk; icons snap to the 22 px dots (see Layout for the free layout).
- **Trash swat** (2026-09-20, `lib/swat.ts`, `TrashSwat.tsx`): while an icon is held over the Trash (desk icon or dock tile, 6 px slop) the rim lifts 7 px / −12° and the icon **crumples**: `rotate(0) → −6° → +6°` with `scale(1 → .92 → .85)` over 240 ms plus the paper filter (`feTurbulence` fractal noise `0.06 0.09`, 2 octaves, through `feDisplacementMap` scale 7). Dropped inside: the icon **sinks** into the basket's opening (translate + `rotate(14deg) scale(.25)`, opacity → 0, 200 ms); the **hand** rises out of a slot clipped at the rim (260 ms, overshoot on the spring) and flicks (180 ms, −30° → 12°); the icon **flies home** along a quadratic arc whose apex is 140 px above the higher end, 13 sampled keyframes on the spring curve over 520 ms, un-crumpling from `rotate(6deg) scale(.85)` to upright; the hand withdraws (200 ms) and the rim closes. The icon never changes cell. A toast under the trash for 1.6 s (dock frost, 12 px 500): "Nice try — that one's staying." Sound: an original whoosh (220 ms of noise through a band-pass sweeping 2200 → 380 Hz, master .35), silent when the chime is muted. Reduced motion: the icon simply returns with a 200 ms fade; the hand still shows briefly.
- **Music**: the NOW PLAYING dot breathes (`scale 1 → .72`, opacity `1 → .55`, 1.6 s ease-in-out, forever) while a song "plays" and goes still and grey (`#9b9797`) on pause; the progress line (widget and window alike) walks a fake 3:20 loop, its width set from the player every 250 ms and eased over 260 ms linear so it reads as continuous; at 3:20 the player moves to the next song by itself. The widget lifts its shadow on hover (`0 6px 16px rgba(45,43,43,.16)`) and dips to `.985` on press; transport buttons dip to `.94`. Skipping swaps the cover in place (no transition: a new song is a cut, not a fade).
- **Focus**: 180 ms. **Dock**: hovered tile 1.18, neighbours 1.08, label above, 160 ms; a launch bounces once. **Trash**: the rim lifts 3 px and tilts −4° in 220 ms on hover (desk icon and dock tile alike). **Terminal**: a fake-Claude reply lands chunk by chunk, 300–600 ms apart. **Live tile**: trace draws once in 1.6 s (`cubic-bezier(.16,1,.3,1)`) when the check answers ok.
- **Reduced motion**: the power screen is unchanged (it is the gesture); the boot shows the logo and the full bar statically for 800 ms then a 400 ms crossfade to the lock, and the unlock is a 400 ms crossfade to the desk (Lock Screen and Restart, the menu and the confirm sheet are 400 ms fades too), windows appear and vanish in place, the dock does not magnify, the trace is pre-drawn, dots and pulses are static (the NOW PLAYING dot included; its progress line still advances, in 250 ms steps, since a position is information, not motion), the crumple is skipped. Quick Look and its ⓘ appear at once.

## Drawn icons

**Trash.** The one icon that is an SVG rather than CSS (`components/kalpos/DeskIcons.tsx`, styles in `app/kalpos-extras.css`): an original drawing in the macOS idiom, not Apple's asset. A basket tapering from a 34 px-wide mouth to a 27 px base in a 48×56 box, filled with a six-stop horizontal "brushed steel" gradient (`#9a9aa0 → #d9d9dd → #f3f3f5 → #cbcbd0 → #a4a4aa → #85858b`) so it reads as a cylinder, a 3.2 px perforated-mesh `<pattern>` of `0.66` px holes at `.42` clipped to the body, a base darkening gradient, one mid rib and a bright base ring, a thick top rim (outer ellipse 17×4.2, opening 14.6×3.1, its own top-lit gradient) over a radial dark interior, and a `drop-shadow(0 2px 3px rgba(45,43,43,.22))`. Two states: `empty`, and `full` with two crumpled paper scraps (`#fbfbfc` and `#f4efe0`, creased) poking above the rim; the desk derives the state from the Trash window's list (`lib/scrapped.ts`), so the icon and the window always agree. The dock tile is the same drawing at 26×30. The rim, opening and paper form one group that lifts on hover and while an icon is held over it.

**Hand.** The Trash swat's hand (`components/kalpos/TrashSwat.tsx`) is an original cartoon, never an emoji or a platform glyph: an open palm in a 64 × 84 box (drawn at 52 × 68), four spread fingers with rounded tips, a thumb out to the left, two palm creases, in `#f4e2d0` with a `#b98f74` 1.8 px outline, on a `#0088b0` sleeve cuff with a white `.55` highlight so it reads as KalpOS's. It rises out of a 52 × 74 slot clipped at the basket's rim, so the wrist is never seen below the opening.

**Envelope (Contact).** The Contact tile stopped being an "@" on 2026-09-21 ("change the icon for the contact app"). `MailGlyph` in `components/kalpos/DeskIcons.tsx` draws an original envelope in the Mail idiom, as paper rather than as a glyph so it reads on the desk's flat `#0088b0` tile and on the dock's `#38a6cf → #006786` one alike: a 34 × 24 sheet (radius 3.4) in `#fbfbfc` with a `rgba(10,60,76,.22)` hairline edge, the opened flap as a `#8fb6c4` 1.7 px V from both top corners to the middle, the two side creases in `#d2e0e5` 1.3 px folding up from the bottom corners, and a `drop-shadow(0 1px 1px rgba(10,60,76,.28))`. One drawing at two sizes: 32 × 23.1 on the desk tile, 30 × 21.7 in the dock (a test pins that the paths are identical).

**Hobby glyphs.** One original 26 × 26 line drawing per hobby (`components/kalpos/HobbyGlyph.tsx`), never an emoji and never an icon-set import: `currentColor` strokes at 1.8 (details 1.0–1.5), round caps and joins, cyan `#0088b0` on a 34 px `#eae7e7` chip (radius 10, `inset 0 0 0 1px rgba(32,30,29,.06)`). Swimming is a head over a windmilling arm with two water lines; tennis a strung head at −34° with the throat and handle continuing along its long axis and the ball leaving it; sim racing a flat-bottomed wheel with a hub and three spokes; Clash Royale a three-point crown on a band (drawn from scratch, no Supercell art); reselling a price tag with its eyelet and a fold.

**Book jacket.** A real cover is a photograph of an object, so it is given an object's edge: `.kos-book` stacks four 1 px shadows to its right (`#fff .75`, `rgba(32,30,29,.14)`, `#fff .6`, `rgba(32,30,29,.1)`) as the fore-edge's page lines, over `0 3px 8px rgba(45,43,43,.22)`, with a `2px 3px 3px 2px` radius (spine square, fore-edge round). 44 × 66 in the widget, 120 × 180 in the window, 96 × 144 on the phone sheet. Covers are the publishers' art, fetched once from the Open Library cover API, committed under `public/images/reading/` and shown for identification only (a test holds each under 120 KB and refuses the 1 × 1 "no cover" placeholder).

**Tab icon.** `app/icon.svg` (2026-09-21, "the icon that shows up on the tab: change that to a macbook or something") is a thin open laptop on **transparent**, so a light and a dark tab strip both work: the lid is a 21 × 14.6 rounded rect in ink `#201e1d` with a `#f3f2f2` 0.9 px rim (the rim is what carries it on a dark strip), the KK mark inside it drawn as four `#f3f2f2` 1.3 px paths rather than text (no font has to be present), a `#8a8686` hinge bar, and the deck a trapezoid in `#e4e1e1` with an ink 0.9 px edge and a `#8a8686` finger notch. Checked at 16, 32 and 180 px on both grounds (`docs/images/kalpos/personal/favicon-16-32-180.jpg`). `app/apple-icon.png` is the same drawing at 152 px inset on a 180 px paper square, because iOS puts a transparent touch icon on black.

**Music (cover art).** No album art is fetched or committed (it would be someone's copyrighted image): every song gets a generated square, `coverFor(title, artist)` in `lib/player.ts`. The string "title — artist" is FNV-1a hashed, the hash is remixed by the golden-ratio constant (Fibonacci hashing, so near-identical titles land far apart on the wheel) and read as: first hue anywhere on the wheel at `hsl(h 70% 48–57%)`, second hue 40–100° further at 72 % and 18 points darker, angle 115–204°; a `radial-gradient` white sheen at `.22` from the top-left corner, radius 10, the md shadow plus a 1 px `rgba(255,255,255,.35)` inner top edge; over it the initials of the first two words of the title (leading punctuation skipped, so "Choosin' Texas" is CT and "'til dawn" is TD). The same function draws the 180 px cover in the window and the 200 px one on the phone sheet; the pink ♪ tile on the desk and the dock's duotone notes are unchanged. Deterministic: the same song always gets the same square (tested).

**Terminal.** The window is the dock tile's dark gradient at Geist Mono 12/1.7, 400 px tall with its own scroll pinned to the newest line; the prompt is `kalp@kalpos ~ %`, a real `<input>` overlaid on a mirror span that carries the block caret. Directories, ok and the spike mark are cyan; errors are the pink used for "no signal". On a phone the same component fills the Terminal sheet edge to edge at 13 px. Inside it, `claude` restyles the prompt to the CLI's `>` behind a 1 px left rule with a `? for shortcuts` hint under it; replies use `⏺` in cyan and `⎿` results at `.55`.

## Accessibility

A "Skip to the desk" link is first in the DOM. Every icon, dock tile, filter and tile is a `<button>` or `<a>`; a live tile is a real link (new tab, `rel=noreferrer`). Windows are `role="dialog"` with `aria-label`, take focus when opened, wrap Tab inside themselves and close on Esc (Esc on the desk closes the top window). The lock's password field has a label and takes the keyboard the moment the lock is interactive (not on touch, where focus would raise the keyboard); on touch devices one tap of the empty pill unlocks and the caption says so. Window traffic lights are real buttons that a held click reaches: the drag handle captures the pointer only once a drag has started. The READING widget is a `<button>` labelled with the book ("Currently reading: The Molecule of More by …. Open Reading") whose thumbnail is `alt=""` (decoration beside the title it already names), while the Reading window's 180 px jacket carries a real alt ("<title> book cover"). The Hobbies list is a `<ul>` whose glyphs are `aria-hidden` (the name and line carry the meaning). The NOW PLAYING widget is a `<button>` labelled with the song ("Now playing: Suffer by Bex. Open Music"); in the Music window the cover is `role="img"` with an alt saying the art is generated, the rows are buttons with `aria-current="true"` on the playing one, the transport is a labelled `role="group"` whose play button carries `aria-pressed` and a Play / Pause label that follows the state, ↑/↓ move between rows (wrapping, focus visible as the cyan ring), Enter plays the focused row, Space pauses or resumes (and never scrolls). The KalpOS menu is a WAI-ARIA menu button (`aria-haspopup="menu"`, `aria-expanded`, `role="menu"` / `role="menuitem"`): Enter, Space or ↓ open it on the first row, ↑/↓ wrap, Home/End jump, Esc, Tab and a click outside close it, and focus returns to the button. Its Appearance row is a submenu button with its own `role="menu"` of `role="menuitemradio"` rows carrying `aria-checked`; → opens it, ← and Esc close only the submenu and return focus to the row, and the whole menu closes only once a choice is made. **Both appearances are held to AA**: every piece of text in dark clears 4.5:1 measured against the surface it sits on after that surface is flattened onto the ground it floats over, and the 27-pair table is a snapshot in `app/appearance.test.ts` so a regression in either appearance fails the build. The restart confirm is `role="alertdialog"` with Restart focused, Tab wrapping and Esc cancelling. Text never drops below 10 px and only the Geist Mono meta uses that size. The Terminal's prompt is a labelled `<input>`, its output a `role="log"` region, Tab is completion (it never leaves the field) and Esc still closes the window unless a reply is playing, in which case it interrupts the reply.

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

The hub is an operating system, not a page. It boots: on black the KK mark resolves from a blur over one hairline that fills with the real health round, then a black lock screen shows the visitor's own time over a very large clock, Kalp's avatar and a frosted password pill; typing anything and pressing Enter sounds the startup chime and blurs the lock away while the desk breathes in behind it. Every plain visit boots and locks; only a shared link (`/projects/<slug>`, or `?desk`) lands on the desk directly. The desk is paper (`#f3f2f2`) with a 22 px dot grid, a frosted menubar, two tinted folders, a document, an @ tile, a trash can, a yellow note, a photo frame and a frosted dock. Folders open rounded windows that can be dragged, stacked, minimised into the dock and closed with Esc. Below 768 px the desk folds into one sheet with a bottom "Projects" drawer.

The source of truth is Kalp's Claude Design project (`docs/design/KalpOS-Mockups.dc.html`, cards 3c, 3b, 2a, 2c, 2d, 2e, 1e). Every colour, radius, blur, shadow, size and timing in `app/kalpos.css` is copied from those cards; where the mock does not cover a surface (About, Contact, Hobbies, Trash, Music, Terminal, a case study inside a window) the same tokens are reused with nothing new invented.

**Key Characteristics:**
- Black is the only dark surface (lock + boot). The desk has no dark mode.
- Chrome is the system sans (SF Pro on Apple devices); Geist Mono only where card 1e uses it (phone top bar and sheet meta) and in the Terminal window.
- Frost everywhere chrome floats: `backdrop-filter: blur(20px) saturate(1.4)` on the menubar, widgets and window sidebar; `blur(24px)` on the dock.
- "Live" is still measured: a project tile turns cyan and draws its spike trace only when the hub's `/api/status/<slug>` proxy answers `ok: true`.
- One motion curve for geometry, `cubic-bezier(.2,.8,.2,1)`; opacity and blur use a plain ease.

## Colors

### Surfaces
- **Paper** (`#f3f2f2`): the desk ground and the phone sheet ground.
- **Paper Raised** (`#f8f4f4`): a focused window, the phone bottom sheet, the dock's PDF tile gradient end.
- **Black** (`#000`): the lock screen and the boot backdrop; nothing else.
- **Frost** (`rgba(248,244,244,.72)` + `blur(20px) saturate(1.4)`, edge `rgba(255,255,255,.65)`): menubar and the NOW PLAYING widget. The dock is `rgba(248,244,244,.62)` + `blur(24px)` with a `rgba(255,255,255,.75)` edge. The window sidebar is `rgba(234,233,233,.7)` + `blur(20px)`.
- **Note** (`#f6e7ae`): the yellow NOTE widget and the phone note; also the Notes dock tile gradient (`#fff6d6 → #f6e7ae`).

### Ink
- **Ink** (`#201e1d`): every label; menubar items at `.72` opacity; sidebar labels at `.5`.
- **Ink 2 / Ink 3** (`#605d5d` / `#8a8686`): case-study prose and meta inside windows (the legacy `ink-2`/`ink-3` tokens the showcase components use).
- **Rule / Rule Soft / Pad** (`#d7d3d3` / `#e4e1e1` / `#eae7e7`): unfocused traffic lights, About-me document lines, phone row tiles, the grey project tile.

### Accents
- **Cyan** (`#0088b0`): a live tile, the Résumé pill, the Contact tile, the NOW PLAYING progress bar, focus rings. Spent only on measured signal and primary actions.
- **Teal** (`#006786`): the "Live signal" status word, links inside windows, the Projects folder tab, the phone "close" / "↓".
- **Magenta** (`#d6006c`): the Now-playing tile and dot; the Hobbies folder is `#aa0b56 / #8e0f4a / #ff90b1→#ff458e→#d82071`.
- **Traffic lights**: `#ff5f57`, `#febc2e`, `#28c840` on the focused window; all three `#d7d3d3` behind.

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
- **Widgets**: label 10.5 px `.06em` uppercase `.55`; note body 15/1.45; NOW PLAYING title 600 14, artist 12 `.6`; photo caption 10 px italic `#605d5d`.
- **Window**: title 600 13 px centred (`.5`, `.85` when focused); sidebar REGISTRY label 10.5 px; filter rows 13 px; header "Projects" 600 14 + count 12 `.5`; search 12 px; tile name 600 13.5/1.2; tile status 11 px (`#006786` for Live signal, `.55` otherwise); footer hint 11.5 `.5`; sidebar foot 11/1.5 `.5`.
- **Window bodies** (About, Contact, Trash, Music): 13.5/1.55, h2 600 20 px. **Terminal**: Geist Mono 12/1.8 on `#201e1d`.
- **Case study in a window**: title 600 26/1.1, lede 15, prose 14.5/1.6, section labels the 10.5 px uppercase label, meta and tech in Geist Mono 11 px.
- **Phone**: top bar Geist Mono 11 px with the 600 12 px brand; name 600 26/1.1; line 13/1.45 `.65`; folder labels 12 px; note 14/1.5; sheet title 600 16 with Geist Mono 10.5 meta and 11 px "close"; rows 600 14 + Geist Mono 10 status + 12 arrow `.45`.

### Named Rules
**The System Face Rule.** No display webfont. The chrome is whatever the visitor's system draws menus in; only the mono is shipped.

## Layout

The desk is `position: fixed; inset: 0`; it never scrolls (windows scroll inside). Menubar 32 px. Icons at `left 38 / top 64` in a `repeat(2, 96px)` grid with `26px 22px` gaps; each icon is a 96 px-wide button (folder 70×56, document 50×62, app tile 58×58, trash 48×56). Widgets at `right 48 / top 64` in a `150px 150px` grid with 16 px gaps (note spans both). Dock centred at `bottom 16`, 54 px tiles, 10 px gaps, 9 px padding, one 1 px separator before Trash.

Windows: Projects 760 px wide with a 184 px sidebar (`12px 12px 14px` padding) and a 3-column tile grid (`padding 18; gap 18px 16px`, tiles 4:3); other windows 420–560 px with a 38 px title bar. The first window opens at `top 86`, centred; each further window steps 28 px down and right. Windows never run under the dock (`max-height: 100dvh − 202px`); their bodies scroll.

Phone (≤ 768 px): 30 px frosted top bar; content padded 20 px; 3-column folder grid (`gap 22px 12px`); the note rotated −1°; the Projects sheet peeks 230 px up from the bottom and expands to `top 30px`; other sheets are full height.

The dot grid is 22 px (`radial-gradient(rgba(32,30,29,.18) 1.1px, transparent 1.3px)`), 20 px at `.20` on the phone; desk icons snap to it when dragged.

## Elevation & Depth

Depth is frost plus three shadows: **sm** `0 1px 2px rgba(45,43,43,.14)` (icons, dock tiles, tiles), **md** `0 3px 10px rgba(45,43,43,.12–.16)` + `0 0 0 1px rgba(32,30,29,.08)` (widgets, an unfocused window), **lg** `0 12px 32px rgba(45,43,43,.22)` + `0 0 0 1px rgba(32,30,29,.1)` (the focused window, the dock at `.2`). Folders use `drop-shadow(0 2px 3px rgba(45,43,43,.25))`. Focus lifts a window from md to lg in 180 ms while its traffic lights fill from grey and its frost brightens to `#f8f4f4`.

## Shapes

Rounded, in a small family: windows 12, widgets 18, dock 22 with 14 px tiles, project tiles 10, filter rows 7, the search field 7, the Résumé pill 999, the lock pill 18. Folder tabs are `7px 10px 0 0`, bodies `0 8px 10px 10px`, fronts `4px 4px 10px 10px`. Marks stay drawn: the spike trace (`M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18`, white 1.6 stroke at the bottom of a live tile), ○ 10 px `#9b9797` (checking), — (no signal), ▲ `#444141` (case study), a `1.5px dashed #bab6b6` outline (coming).

## Motion

One curve for geometry, `cubic-bezier(.2,.8,.2,1)`; opacity and blur `ease`.

- **Boot** (2a, then 3b/3c): on `#0b0b0c` the mark (600 / 96 px / 1, `-0.02em`, `#f3f2f2`) resolves from `opacity 0; blur(16px); scale(1.1)` in 600 ms (the one curve). 34 px under it a 180 × 2 px hairline (track `rgba(243,242,242,.14)`, fill `#f3f2f2`, `transform-origin: left`, `cubic-bezier(.4,0,.2,1)` 400 ms per step) fills with real readiness: one step for the registry, one per health check. The boot ends once everything answered and at least 900 ms passed, or at 3 s; then the mark goes to `opacity 0; blur(8px); scale(.94)` and the layer fades over 600 ms while the lock's status, clock and user fade in under it. Deep links and `?desk` skip it (the pre-paint script hides it before the first paint).
- **Chime**: an original G major spread (G3 · D4 · G4 · B4, triangle/sine, ±4 cents), 120 ms attack, 500 ms swell, 1.8 s release, low-pass 2.2 kHz, master 0.3, from the Web Audio API. Once per page load: at the boot mark when the browser already allows audio, otherwise on the unlock gesture, 400 ms later with the blur-out. A speaker toggle in the menubar's right cluster mutes it (`kalpos:mute`). It plays under reduced motion (sound is not motion).
- **Typing** (3b): each character pops in a dot, `scale .3→1`, 160 ms.
- **Unlock** (3c/3b/2a): the pill pulses once (400 ms, `box-shadow 0 0 0 3px rgba(255,255,255,.35)`); the clock lifts 30 px; the lock goes to `opacity 0; blur(14px); scale(1.05)` over `.6s / .7s / .8s` while the desk comes from `opacity 0; blur(10px); scale(1.06)` over `.7s / .8s / .9s`; then the menubar drops in from −10 px (300 ms delay), icons and widgets pop 40 ms apart from 420 ms, the dock rises 24 px last (560 ms). A deep link or `?desk` gets a 400 ms crossfade instead; there is no returning-visitor skip.
- **Open a window** (2e): the icon dips to `.94` for 90 ms; the frame grows from the icon's rect in 380 ms; content fades in over 120 ms behind it. Close is the 320 ms reverse; minimise runs it toward the dock.
- **Drag**: 1:1 with the pointer; on release the window coasts with its throw velocity (capped at 2.5 px/ms) and settles inside the desk; icons snap to the 22 px dots.
- **Focus**: 180 ms. **Dock**: hovered tile 1.18, neighbours 1.08, label above, 160 ms; a launch bounces once. **Trash**: lid lifts 220 ms on hover. **Live tile**: trace draws once in 1.6 s (`cubic-bezier(.16,1,.3,1)`) when the check answers ok.
- **Reduced motion**: the boot is a 400 ms crossfade to the lock and the unlock a 400 ms crossfade to the desk, windows appear in place, the dock does not magnify, the trace is pre-drawn, dots and pulses are static.

## Accessibility

A "Skip to the desk" link is first in the DOM. Every icon, dock tile, filter and tile is a `<button>` or `<a>`; a live tile is a real link (new tab, `rel=noreferrer`). Windows are `role="dialog"` with `aria-label`, take focus when opened, wrap Tab inside themselves and close on Esc (Esc on the desk closes the top window). The lock's password field has a label and takes the keyboard the moment the lock is interactive (not on touch, where focus would raise the keyboard); on touch devices one tap of the empty pill unlocks and the caption says so. Window traffic lights are real buttons that a held click reaches: the drag handle captures the pointer only once a drag has started. Text never drops below 10 px and only the Geist Mono meta uses that size.

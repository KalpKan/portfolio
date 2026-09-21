# Claude Design prompts — one per app

Each block below is a complete, self-contained brief to paste into Claude Design. They are written from
`docs/design/app-directions.md` (the PRIMARY direction of each app) and carry every token, measurement,
copy string and rule from those directions, plus what Claude Design needs that the directions assumed:
what the app is, which screens and states to mock, and the deliverables.

Order of value: promptflip, hoops, plato, plantit, pushups, emotes, microtubules. The hub (KalpOS) and
Sift are not in this set; they had their own design work.

---

## 1. promptflip — "The table, not the app"

```text
Design high-fidelity mockups for PromptFlip, a two-player web game.

WHAT IT IS
Two people each bring their own OpenRouter API key and each write a prompt. A provably fair coin flip
decides whose prompt gets answered by the AI model, and the LOSER's key pays for the call. There is a
lobby (a list of open flips you can join or create), a flip room (where the two prompts sit face-down
until the coin lands), and a verify page (a hash proves the flip was fair). Sign-in is Google. Built in
Next.js with Tailwind; fonts Archivo (sans) and JetBrains Mono (mono) are already loaded.

WHO IT IS FOR
Kalp and his friends first; strangers second. Success: a signed-out visitor understands "two prompts,
one coin, loser's key pays" from the first viewport without reading the numbered steps, and the flip
itself feels worth waiting for.

VISUAL THESIS
The page is the felt the wager sits on: one brass coin, two prompts face-down, and a single tense second
where nobody can act. Skeuomorphic object (the coin) on a flat dark surface. Nothing else has depth.

DELIVERABLES (mock every one)
1. Lobby, signed out, desktop 1440 wide.
2. Lobby, signed out, mobile 390 wide.
3. Lobby, signed in, with three open flips in the table, 1440.
4. Lobby, signed in, empty table state, 1440.
5. Flip room, "waiting for the second prompt", 1440.
6. Flip room, "deciding" state (both prompts in, coin about to land, brass beam on the panel edge), 1440.
7. Flip room, resolved: coin landed, result numeral, winner's prompt panel open, loser's still
   face-down, verify hash under the coin, 1440.
8. Flip room resolved, 390.
9. Light theme version of screens 1 and 7 (the app ships a complete light theme; keep it complete).

FORMAT
Responsive web. 1440 reference, 390 floor. Page gutter 24px on mobile, 48px on desktop. Content
max-width 1120px. The flip room narrows to 720px.

LAYOUT
- Lobby hero: a 7/5 asymmetric split, NOT centred. Left 7 columns: the h1 "Tails, you pay.", a one-line
  sub, the three numbered steps as ONE ruled row (numeral + label, hairline rules between), and ONE
  primary button. Right 5 columns: the coin at rest, brass face up, about 280px, sitting on its own
  contact shadow with nothing behind it.
- Below the hero: one full-bleed hairline rule, then "Open flips" as a TABLE, not cards. Columns:
  Model / Tier / Stake / Waiting. One row per flip. The whole row is the click target; a hover state
  tints the row, nothing else.
- Flip room: the coin is the page, centred. Two prompt panels sit left and right of it, both face-down
  (a flat panel with a mono "prompt sealed" line) until the flip resolves. The verify hash sits under
  the coin in mono. The flip sequence is NOT shown as a number (the data has none; do not invent one).
- Hierarchy: h1 -> coin -> primary button -> steps -> table.
- Navigation: a thin top bar with the wordmark left and, when signed out, a plain text "Sign in" link
  (not a button; the hero has the only button). When signed in: History, Keys, avatar.

TYPE SYSTEM
- Archivo for everything except mono content. JetBrains Mono ONLY for hashes, keys, stakes and the
  verify line. Never mono for section labels.
- h1: Archivo 700, about 48px, line-height 1.05, letter-spacing -0.02em.
- Sub: Archivo 400, 16px, secondary ink.
- Steps: numeral in mono 600 brass at 11px; label in Archivo 400 secondary ink. The numeral is the only
  decoration the steps get.
- Result numeral in the flip room: 96px, spent once per screen, on the result only.

COLOUR
Dark theme (default): bg #0a0e13, bg-2 #12181f, line #232c36, ink #e9eef5, ink-2 #9aa7b8.
Light theme: paper #f7f8fa, surface #ffffff, line #dde3ea, ink #101418, ink-2 #5b6672 (same structure).
ONE accent, and it is brass #e8b93c: the coin, the wager, the winning side, the primary button's
border and fill. Cyan #3cd3fe is demoted to a system colour: focus rings and links only, never a
button, never a numeral.
Won = felt green #30d158, lost = ember #ff6b57; those two appear only on a resolved flip, nowhere else.
Coin metal gradient: highlight #ffe9a3 -> mid #e2b53c -> low #77570d, with one soft contact shadow.
In light theme brass darkens to #8a6410 wherever it is text on a light ground so it stays readable.
Ground texture: an extremely faint felt grain on the page background, at most 2% opacity. If it reads
as "noise", it is too strong.

MATERIAL
The coin is the only object with real depth (two-stop metal gradient, crisp light edge, one contact
shadow). Everything else is flat surface plus a 1px line. No glass, no glow on cards, no card shells
around the table. The resolved-flip result sits on one molded slab (a tactile inset panel) directly
under the coin; that slab and the coin are the only skeuomorphic objects on the site.

MOTION (show as annotated frames, not as a video)
- Deciding state: the flip panel's edge carries one animated brass beam travelling around the border.
  Under reduced motion it is a static brass hairline.
- Resolution choreography: coin lands first (800–1200ms), result numeral appears second (+120ms), the
  winner's prompt panel opens third (+200ms). Nothing else on the page moves, ever.

COPY (render exactly)
- "Tails, you pay."
- "Two prompts walk in. One gets answered. The other one buys."
- Steps: "Bring an OpenRouter key" / "Bet a prompt against a stranger" / "Coin lands, winner reads,
  loser pays"
- Button: "Sign in with Google"
- Small link beside it: "Never used OpenRouter? Start here"
- Empty table: "The table is empty." then "Nobody's put a coin down yet. Be the one they all have to
  beat."
- Table headers: Model, Tier, Stake, Waiting. Example rows: "gpt-5 / Pro / 0.40 / 1 waiting",
  "claude-sonnet-5 / Standard / 0.25 / 0 waiting", "llama-4 / Free / 0.10 / 2 waiting".
- Signed-in primary button: "Put a coin down".
- Flip room labels: "Your prompt", "Their prompt", "prompt sealed", "Verify this flip".

NEGATIVE
No second hero illustration, no abstract SVG, no gradient blob behind the coin. No glass cards, no
purple, no cyan-on-dark "futuristic" treatment. No casino iconography beyond the coin: no chips, cards,
dice, neon, or literal green felt. No fake player counts, no leaderboard, no "1,204 flips today". No
status pill with a live dot on an empty table. No icon tiles, no icons in rounded squares.

MOBILE (390)
The split collapses to coin-above-headline (the object is the hook), coin capped at 200px so the button
stays above the fold. The three steps become a 3-row ruled list. The Open flips table becomes one ruled
row per flip: Model + Tier on line 1, Stake + Waiting in mono on line 2. Do not put a card shell around
it.
```

---

## 2. hoops — "Gym scoreboard"

```text
Design high-fidelity mockups for Hoops, a personal basketball shooting log.

WHAT IT IS
Kalp has a mini-hoop. His phone, propped anywhere in the room, watches the hoop with an on-device
computer-vision model and logs every shot as a make or a miss. The public page (hoops.kalpkan.com) is a
read-only dashboard of those sessions: made/attempted, field-goal percentage, best streak, a top-down
shot map of where shots landed relative to the rim, a per-session progress chart, and a session
history table. There is also a private page, /track, that runs on his phone during a session. Next.js,
Tailwind, dark only. All data is real; there is no demo data and there must be none in the mockups.

WHO IT IS FOR
Kalp alone, reading after a session on a laptop or a phone propped on the desk. No audience, no team,
no sharing. Success: from across the room he can read today's make count and whether it beat last time.

VISUAL THESIS
A matte scoreboard slab where one number is lit, the date is stamped, and nothing else asks for
attention. Matte, not glass. Emerald means exactly one thing: a shot that went in.

DELIVERABLES
1. Dashboard, 1440, with four real-looking sessions (dates in Apr and Sep 2026; e.g. 52/72 made, 72.2%,
   best streak 30).
2. Dashboard, 390 (the two-item segmented control Shot map / Analytics appears only here).
3. Dashboard with the session filter set to one session, 1440.
4. Progress band with one bar hovered, showing its value in the band's mono line, 1440 (crop is fine).
5. "How these are calculated" details expanded at the foot, 1440 (crop is fine).
6. /track on a phone, 390: (a) model loading with a determinate thin progress bar and the byte count,
   (b) "finding the hoop" state with the rim-lock indicator, (c) live session: scoreboard band on top,
   camera view, last shot chip, (d) an unresolved shot shown as a tappable "?" chip with Make / Miss
   choices.

FORMAT
Responsive web, 1440 / 390. Content max-width 1120px, gutters 24/48. The scoreboard band is full-bleed;
everything below it is inside the container.

LAYOUT (dashboard)
- Band 1, full-bleed, about 200px tall: the scoreboard. Left: MADE / ATTEMPTS as one huge fraction
  ("52 / 72"). Centre: FG% at the same optical weight ("72.2%"). Right: BEST STREAK ("30"). Under the
  band one mono line: "Last session Sep 18 · 4 sessions · 72 shots". No card, no border; the band's
  darker ground is the container, sitting 1px proud on a top highlight.
- Directly under the band: the honesty line "The iPhone capture app is not available yet. These
  sessions were recorded through the ingest API for testing." with "Source and API on GitHub".
- Band 2: the shot map, promoted out of any tab: a top-down view, the rim as a solid warm ring (no
  bloom), made shots as emerald dots, misses as neutral grey dots. Caption: "Top-down view of where
  shots landed in the basket".
- Band 3: Progress: one bar per session on a baseline. No card, no gridlines, no printed values; the
  hovered or focused bar reveals its value in the band's own mono line. FG% / eFG% / Streak toggles
  above it as plain text tabs.
- Band 4: Session history as a plain ruled table, full container width, no shell. Columns: an ordinal
  "01 02 03 04" in muted mono, Date, Made, Attempts, FG%, eFG%, Best streak. Every numeric column right
  aligned. Streak gets a non-colour cue (a "×" glyph or weight), not green.
- Foot: "How these are calculated" as a collapsed details block (it is a glossary, not a feature).
- No tabs at 1440; everything is one scroll.

LAYOUT (/track, phone)
Same scoreboard band at the top (MADE / ATTEMPTS huge, FG% and streak smaller), the camera view filling
the middle with a thin rim-lock indicator (a small ring outline that turns solid when the hoop is
found), and a bottom strip: last shot chip ("Make", "Miss", or "?" with two tap targets Make / Miss).
Model loading is a thin determinate bar with real bytes ("4.1 of 6.2 MB"). Never a spinner.

TYPE SYSTEM
- Inter Variable for everything except numbers; JetBrains Mono 400/600 for all score readouts, the
  mono status line and every table numeral.
- Scoreboard fraction: mono 600, clamp(56px, 9vw, 104px), tabular figures, letter-spacing -0.02em,
  line-height 0.9.
- Metric labels: sans 500, 11px, uppercase, letter-spacing 0.08em, muted. Section heads: sans 600 20px.
- Table: mono 400 13px numerals, sans 400 13px names.

COLOUR
Ground #050505, panel #0b0b0b, line #1d1d1d, ink #f2f2f2, muted #8a8a8a.
ONE accent: emerald #23c552, meaning "a shot that went in". It appears on made dots and on the made
count and nowhere else. Streak is not green. Buttons and links are ink, not emerald.
The rim is #ff6f55; it is the hoop, not an accent, and the only warm thing on the page. Its glow is
gone: at most a tight 6px shadow, ideally none.

MATERIAL
Matte. Flat #0b0b0b surfaces with 1px #1d1d1d rules. No backdrop blur, no inset white highlights, no
glass. The only depth is the scoreboard band: a molded dark surface with one crisp light separation at
the top edge and a tactile inset well for the numbers; exactly one layered shadow, on that band only.
Brand mark: an original drawn rim-and-net glyph (two arcs and four net lines) at the same stroke as the
shot-map rim. No emoji, no icon tile, no basketball photo.

MOTION
None on the dashboard. The only motion is on /track: the make count increments instantly (no count-up
tween) and the last-shot chip fades in at 150ms. Honour reduced motion.

COPY (render exactly)
- "Hoops Analytics" / "Mini-hoop shooting sessions, shot by shot"
- "Last session Sep 18 · 4 sessions · 72 shots"
- "Top-down view of where shots landed in the basket"
- "The iPhone capture app is not available yet. These sessions were recorded through the ingest API
  for testing." / "Source and API on GitHub"
- "23 shots with an invalid timestamp hidden"
- "How these are calculated"
- Labels: MADE, ATTEMPTS, FG%, BEST STREAK, eFG%, Consistency.

NEGATIVE
No LIVE badge, no pulsing dot, no "real-time" language. No glassmorphism, no backdrop blur. No card
around anything that is not a peer-value tile. No invented sessions, no seeded demo data, no projected
trend line, no "you're improving!" copy. No team-sports iconography: no jerseys, courts, or NBA
references. No selected-looking tile that is not selectable.

MOBILE (390)
Scoreboard band stacks to two rows: fraction on row 1 at the clamp minimum, FG% and streak sharing row
2. Session filter pills become a horizontally scrollable row with a visible edge fade and a preserved
left gutter. Progress chart keeps its bars but drops x labels to a legend below. Session history becomes
one block per session: date and ordinal on line 1, the five numerals in a mono row on line 2. Never a
horizontal-scrolling table.
```

---

## 3. plato — "Registrar's ledger"

```text
Design high-fidelity mockups for Plato, a tool that turns a university course outline (PDF) into a
checked calendar file.

WHAT IT IS
A Western University student drops a course outline PDF on the page. Plato extracts the assessments
(name, weight, date), the weekly lecture/lab/tutorial slots, and the term dates; shows them on a review
screen where anything it could not read is flagged for the student to fix; then generates an .ics file
they import into their calendar. Three routes: "/" (upload), "/review" (proof the extraction),
"/manual" (enter a course by hand if there is no PDF). Flask + plain HTML/CSS. Free hosting, so the
extraction takes 10–25 seconds and says so.

WHO IT IS FOR
A Western undergrad at the start of term, doing this once per course, four times in an evening, on a
laptop, in a hurry, slightly anxious about missing a deadline. Success: they can scan nine assessment
rows and spot the one with no date in under three seconds, and trust the .ics enough to import it
without re-checking the PDF.

VISUAL THESIS
A course outline is a legal-ish document, and this is the clerk's ledger you proof it against before you
sign: warm paper, ruled rows, a serif term header, and a stamp where something is missing. Light mode,
paper-technical. No cards anywhere.

DELIVERABLES
1. "/" upload screen, 1440: the drop zone as the hero with a real, captioned crop of the review ledger
   beside it.
2. "/" upload screen, 390.
3. "/" during extraction: the progress line "Reading your outline… this takes 10–25 seconds on the free
   hosting." with the drop zone quieted, 1440.
4. "/review" ledger, 1440, for a course with 8 assessments where 2 have no date (amber row tint + flag
   pill), one lecture slot and one tutorial slot, weights totalling 100%.
5. "/review", 390: each assessment as one ruled block, tint preserved.
6. "/review" with the "Add Section" dialog open (a modal with a proper close, focus trap), 1440.
7. Download confirmation block: file name, event count, date range, 1440 and 390.
8. "/manual" form, 1440 (a hand-entry form in the same ledger language).
9. Optional: the dark variant of screen 4 (dark exists only via the system setting, never a toggle).

FORMAT
Responsive web, 1440 / 390. The ledger sheet is max 900px wide; the upload screen 1080px. Generous top
margin (96px) so the sheet reads as a page, not a viewport.

LAYOUT
- One header on all three routes: the lockup "Plato / Course outline to calendar" left; the step
  indicator right as "01 Upload · 02 Review · 03 Download" with the active step in ink and the others
  at 45% opacity. At 390 it collapses to "Step 2 of 3 · Review".
- "/": no marketing. The drop zone IS the hero: a full-measure ruled rectangle at the top with the file
  constraints under it ("PDF only, up to 4 MB…") and, at 1440, one real cropped, captioned screenshot of
  the review ledger beside it showing what happens next. Below: the honest timing note and the
  "Enter the course by hand" escape hatch as a text link. Footer: "This tool is not affiliated with
  Western University" / "Developed by Kalp Kansara".
- "/review": a masthead block (course code, course name in serif, term, first day, last day) as a
  definition grid with hairline rules. Then a three-row Slots table (Lecture / Lab / Tutorial: day, time,
  location) with the note about labs. Then ONE assessments table: ordinal (01…) / Assessment / Weight /
  Date / Flag, hairline rules between rows, right-aligned numerals in mono, total weight in a footer
  row. Flagged rows carry an amber tint and a small "Needs a date" pill; the flagged field is editable
  inline. Under the tables, two summary SENTENCES (not fractions): "All 8 assessments found. Weights
  total 100 %." and "1 lecture slot. 1 tutorial slot. No lab." A third, when relevant: "2 assessments
  still need a date." Then the section "What could not be read from the PDF" as margin-note style
  explanations. Primary button: "Generate calendar". Secondary text buttons: "Add another assessment",
  "Add Section" (not filled pills).
- Sheet structure: the 900px sheet has faint vertical guide lines at its edges with tiny corner squares,
  so the rule-based layout looks authored, not unstyled.
- Download: a single confirmation block: file name in mono, "74 events", "Aug 29 – Dec 10, 2025", a
  download button, and a line on how to import.
- Nothing is a card. Grouping is rules and spacing only.

TYPE SYSTEM
- Serif: Newsreader, for course names, the sheet masthead and section heads. This is the type move.
- Sans: Inter, for controls, labels and helper text.
- Mono: JetBrains Mono, tabular, for dates, weights, times and the file name.
- Masthead course name: serif 600, 30px, line-height 1.1. Section head: serif 600, 19px. Table body:
  sans 400, 14px, line-height 1.5; numerals mono 13px tabular. Field labels: sans 500, 11px, uppercase,
  letter-spacing 0.06em, used only as column headers and form labels, never as an eyebrow above a
  heading.

COLOUR
Paper #faf8f4, sheet #ffffff, ink #1c1a17, ink-2 #6f6a61, rule #e0dad0.
ONE accent, the flag colour: amber #8a5f00 on a #fff6e0 row tint, used exclusively to mark "Plato
could not read this; you must check it." Never decorative.
One secondary, blue #1f5fbf, for links and focus rings only. Buttons are flat solid ink or flat solid
blue; no gradients anywhere.
Dark variant (system setting only): paper #17150f, sheet #1f1c16, ink #efe9de, rule #3a352b, amber tint
#3a2d0a.

MATERIAL
Paper. No shadows except a 1px lift under the sticky header once scrolled. No glow, no glass, no
gradient. Icons: Lucide at 16px, 1.5px stroke, inline with text, never in a rounded tile, never above a
heading.

IMAGERY
Exactly two real screenshots on the whole site, both of Plato's own review ledger, cropped tight,
captioned, same aspect ratio. No illustration, no fake calendar, no device mockup.

MOTION
A single reveal on the ledger (rows fade up 120ms staggered 20ms) and a 160ms cross-fade when a flag
retires after its date is filled. Under reduced motion everything renders in its final state.

COPY (render exactly)
- "Plato" / "Course outline to calendar"
- h1 on "/": "Check your outline, then take the calendar."
- "Drag and drop your course outline here" / "PDF only, up to 4 MB. Not a PDF, or a scan? Enter the
  course by hand."
- "Reading your outline… this takes 10–25 seconds on the free hosting."
- "Review & Confirm" / "Check every date against your outline; click any highlighted field to correct
  it. Your edits are saved for you only."
- "What could not be read from the PDF"
- "No lab time was found in the outline (labs are usually only on draftmyschedule.uwo.ca). Add one if
  you have a lab."
- "All 8 assessments found. Weights total 100 %." / "1 lecture slot. 1 tutorial slot. No lab." /
  "2 assessments still need a date."
- "Generate calendar" / "Add another assessment" / "Add Section"
- "This tool is not affiliated with Western University" / "Developed by Kalp Kansara"
- Example ledger rows: "Quiz 1 · 5 % · Sep 26", "Midterm · 25 % · Oct 24", "Lab report · 10 % ·
  Needs a date", "Final exam · 40 % · Needs a date".

NEGATIVE
No hero pill, no gradient text, no gradient buttons, no radial lights, no dark glass. No card around
anything: nine assessments are nine table rows. No animated connector diagrams, no pulsing calendar,
no particles. No fabricated calendar chips, no invented course names in decoration, no "trusted by
10,000 students". No accent stripe welded to the side of a container. No icon above a heading.

MOBILE (390)
Each assessment becomes one ruled block: name on line 1 at 15px, weight and date on line 2 in mono, the
flag as a trailing pill; the block keeps the amber tint so flags still scan. The masthead becomes a
two-column label/value list. The drop zone stays full width with a 44pt tap target. Never a horizontal
scroller.
```

---

## 4. plantit — "Nursery tag"

```text
Design high-fidelity mockups for Plant It, a plant identification and watering app.

WHAT IT IS
You photograph a plant; the app identifies the species (Pl@ntNet), shows care guidance and the moisture
target for that species, and keeps a shelf of your plants. Each plant has a soil-moisture reading, from
a real ESP8266 sensor if one is attached, otherwise a simulated sensor you can "water". Screens: /login
(Google sign-in), / (home), /plants (the shelf), /add-plant (camera-first upload), /plant-details (one
plant's tag). React + Material UI. There is an optional "Use your own OpenAI key" field for richer care
text; it is disclosed, never required.

WHO IT IS FOR
Kalp and Yash, and anyone who has killed a plant by guessing. Someone standing at a windowsill with a
phone in one hand. Success: the shelf answers "which of my plants needs water right now" in one glance,
and a new plant's tag is readable and trustworthy the moment identification finishes.

VISUAL THESIS
Every plant gets the little card-stock tag that comes stuck in the pot: species, light, water number,
except this one knows the soil moisture right now. Warm light card stock, photo-led, one green.

DELIVERABLES (design at 390 FIRST, then 1440)
1. /login, 390 and 1440: one sign-in tag with the honest paragraph and "Sign in with Google".
2. Home "/", 390 and 1440: headline, the kept paragraph, the two actions, and ONE example tag clearly
   captioned as an example (dashed edge, the word EXAMPLE, caption below). Not dimmed; it must pass
   contrast.
3. /plants shelf with four plants, 390 (1-up) and 1440 (3-up): one dry (terracotta reading, "Water now"
   promoted into the tag), two at target, one wet.
4. /plants empty state, 390: the example tag plus "Add a plant".
5. /add-plant, 390: camera-first full-width tappable frame; the "Identify plant" button disabled with
   "Choose a photo first." beneath; the worked example beneath the frame. Also 1440.
6. /add-plant result: the freshly identified tag with species, confidence, care numbers, "Add to shelf".
7. /plant-details, 390 and 1440: the tag at full size: photo, species block, care definition list
   (Water at / Light / Soil), live moisture bar with the target tick, one button "Water now".
8. The "Use your own OpenAI key (optional)" field as a quiet disclosure row (crop is fine).

FORMAT
Mobile-first. 390 is the design target, 1440 the wide case. Content max-width 1080px. Tag grid 1-up at
390, 2-up at 768+, 3-up at 1200+.

LAYOUT
- Nav: the Material AppBar (Home / My Plants / Add Plant / Logout) in the new palette; at 390 it is the
  standard drawer.
- A plant tag: photo at 4:5 filling the top of the tag, common name, species in italics, one moisture
  bar with the species' target marked as a labelled tick ("42%"), and the current reading as a number.
  Nothing else. When the plant is dry the tag also carries "Water now" as its own button.
- Home is the bench: headline, the kept paragraph, two actions ("Add New Plant" primary, "View Plants"
  secondary), one example tag.
- /plants is the shelf: the grid of tags. Empty shelf: the example tag with the caption "This is what a
  tag looks like. Yours will use your photo." above the "Add a plant" button.
- /add-plant: at 390 the drop zone is a full-width tappable frame with the camera affordance primary and
  a "choose from library" path visible. The worked example sits beneath, not beside.
- /plant-details: the tag at full size, then the care numbers as a definition list, then the live
  moisture read and ONE button.

TYPE SYSTEM
- Inter Variable, one face, actually loaded. Species names in Inter italic at 0.95em, secondary ink
  (botanical convention). Numbers (moisture %, target %) in tabular figures at 600.
- Tag name 600, 17px, line-height 1.2. Species italic 400, 14px. Care labels 500, 11px, uppercase,
  letter-spacing 0.06em. Body 15px, line-height 1.5. Buttons keep normal case (no uppercase).

COLOUR
Ground #f6f4ef (card stock), card #ffffff, ink #1f241f, ink-2 #5f6b5f, rule #dfe0d8.
ONE accent #0a7a4a, spent on the primary button and on the moisture bar's target tick. Nothing else.
State colours appear ONLY on a moisture reading: dry = terracotta #b2542c, at target = the accent,
wet = slate #4a6b86.
Focus ring: the accent at 2px with a 2px offset, on every control including Material buttons.

MATERIAL
Matte card stock. One 1px rule per tag and one faint contact shadow (0 1px 2px). Corner radius 10. No
gradient buttons, no glass, no glow, no radius above 12. Icons: Material icons at 20px inline only; no
icon tiles.

IMAGERY
Photography is the whole visual system. One crop rule (4:5, subject centred, plant filling at least 70%
of the frame), one grade (slightly warm, not filtered). One fallback when a photo fails to load: a flat
ink-2 leaf silhouette on card stock, clearly a placeholder. Use obviously placeholder photo frames in the
mockups; Kalp will supply his own plant photos.

MOTION
Tags reveal on scroll with a 240ms fade-up, below the fold only. The moisture bar animates its fill
once over 400ms on first paint. A masked headline reveal on the home screen (words slide up from behind
a mask, 500ms). Under reduced motion everything renders in its final state.

COPY (render exactly)
- h1: "Every plant, watered to its own number."
- Paragraph (keep): "Your personal plant identification and care assistant. Upload a photo to identify a
  plant, get care instructions, and keep an eye on its soil moisture. No hardware needed: every plant
  gets a simulated sensor you can water; a real ESP8266 takes over when you connect one."
- "Sign in with Google" / "Opening Google sign-in…" / "Add New Plant" / "View Plants" / "Water now"
- "JPEG, PNG or WebP, between 10 KB and 4 MB. One plant per photo works best."
- "Choose a photo first."
- "No plants yet" + "This is what a tag looks like. Yours will use your photo."
- "Use your own OpenAI key (optional)"
- Example tag: "Monstera" / "Monstera deliciosa" / target 42% / reading 38% (dry).
- Care labels: "Water at", "Light", "Soil".

NEGATIVE
No dark mode. No three-step "How it works" row, no icon tiles, no feature cards. No stock plant
photography presented as Kalp's, no AI-generated plants presented as identifications, no fake moisture
readings presented as live hardware. No gradient buttons, no glow, no glass. No leaf or sprout mascot,
no hand-drawn SVG plant. No falling-leaf particles.

MOBILE (390)
One tag per row, photo 4:5 full width, name/species/moisture stacked beneath. "Water now" is a
full-width 48pt button on the detail tag. The drop zone is a large tap target with the device camera as
the default input.
```

---

## 5. pushups — "Gym mirror"

```text
Design high-fidelity mockups for Pushup Form Tracker, an in-browser rep counter.

WHAT IT IS
You put a phone or laptop on the floor, side-on, and do pushups. MediaPipe pose tracking runs on the
device (a 20 MB model downloaded once, nothing uploaded), draws a skeleton over the video, counts good
reps, and says why a bad rep was bad ("hips sagging", "go lower"). There is a demo clip for people who
will not grant camera access. Below the tool is a long, genuinely good explanation of how it decides,
including a note that a trained classifier was retired because it scored 50/50 on held-out bad reps.
Plain Vite + TypeScript, dark only.

WHO IT IS FOR
One person on the floor, side-on to a device 1–2 m away, who cannot read 13px type from there and cannot
touch the screen mid-set. Success: from a plank position, at arm's length, they can read the count and
the verdict without squinting, and can tell a counted rep from a rejected one without hearing anything.

VISUAL THESIS
The camera feed is the mirror; the count, the verdict and the fault are drawn on the glass in front of
you, and everything else on the page gets out of the way. The video is the page.

DELIVERABLES
1. Page at rest before anything starts, 1440: h1, one-line lede, two buttons, the stage showing the demo
   clip's first frame with the skeleton pre-drawn as a poster (not an empty black box).
2. Same at 390: the stage edge-to-edge with zero side gutter, buttons stacked full width above it.
3. Live counting, 1440: video with skeleton, HUD: count top-left, no hint, verdict "clean" on its plate
   bottom-centre, "attempts 12 · 0.8 rep/s" bottom-right.
4. Live, a bad rep, 1440: verdict "hips sagging" on the plate, the skeleton's hip joint annotated with a
   thin connector to its measured number ("HIP +0.21 T"), the placement hint area empty.
5. Live, placement hint active, 390: hint "turn side-on" top-right of the stage.
6. The moment a rep is counted, 1440: the stage frame carries a single 180ms yellow edge pulse
   (show it as an annotated frame) and the count has just incremented.
7. Paused state: the skeleton in grey, verdict plate hidden, 1440.
8. Below the stage, 1440 and 390: "How it decides" as four named rules numbered 01–04, one mono
   threshold table, "Tips" as four short rules, and the classifier-retirement note as a bordered aside.

FORMAT
Responsive web, 1440 / 390. At 1440 the video stage is capped at 960px wide and centred; at 390 it is
edge to edge. Reading content below the stage is capped at a 68-character measure.

LAYOUT
- Above the stage: h1, a one-line lede, two buttons ("Start camera" filled primary, "Play demo clip"
  visibly secondary, text-weight). That is all. The provenance line "Browser ML · MediaPipe pose
  landmarks" sits UNDER the h1 in mono, not above it as an eyebrow.
- The stage: one frame with the video, the skeleton overlay, and a HUD drawn inside it:
  top-left the count, huge, mono, tabular; top-right the placement hint when one is active, otherwise
  nothing; bottom-centre the form verdict as a word on a plate ("clean", "hips sagging", "go lower");
  bottom-right attempts and speed as one small mono line.
- Below: "How it decides" as four named rules with headings and a mono threshold table (torso fraction,
  knee angle 130°, elbow angle, hold time); "Tips" as four short rules; the classifier-retirement note
  as a bordered aside. Then the privacy statement and the 20 MB note.

TYPE SYSTEM
- System sans (system-ui) for prose. JetBrains Mono 400/600 for the HUD and the thresholds.
- Count: mono 600, clamp(64px, 12vw, 132px), tabular figures, line-height 0.85. The only thing on the
  page allowed to be that size.
- Verdict word: sans 600, clamp(20px, 3vw, 30px). HUD micro-labels: mono 400, 11px, uppercase, 0.06em.
- Body 16px, line-height 1.55; rule headings sans 600 18px; threshold table mono 13px tabular.

COLOUR
Ground #0f1116, panel #171a22, text #f2f3f5, muted #9aa3b2.
ONE accent, yellow #ffe66d: it marks a COUNTED rep (the count itself and the 180ms frame pulse) and
nothing else. Good #5ee38a and bad #ff6b6b are used only inside the HUD verdict plate, never in chrome.
Primary button: yellow fill with dark text. Secondary: text only.

MATERIAL
HUD plates: one dark translucent plate behind each HUD element, rgba(15,17,22,0.78) with a 1px
rgba(255,255,255,0.12) edge; this is the one honest translucent layer because there is video behind it.
Stage frame: a 1px rule at 14px radius. No glow, gradient or shadow anywhere else.
The skeleton is a designed object: 2px bones, 3–4px filled joint dots, grey when paused; a faulted joint
gets a thin connector line to its measured number in mono.

MOTION
Count increments instantly (no count-up tween). Verdict word cross-fades in 120ms. Placement hint fades
in at 200ms and out at 400ms. The counted-rep frame pulse is 180ms. Nothing else moves. Under reduced
motion the pulse is a static border and the count increment does the work.

COPY (render exactly)
- "Pushup Form Tracker"
- Lede: "Phone or laptop on the floor, side-on (facing either way), whole body in frame, one person."
- "Start camera" / "Play demo clip" / "Stop"
- "Nothing loads until you press a button."
- "Your camera (mirrored) or the demo clip appears here with the skeleton, the rep count and the form
  verdict drawn on top."
- Labels: "GOOD REPS", "FORM NOW", "ATTEMPTS", "SPEED", "How it decides", "Tips".
- Verdict vocabulary: "clean", "hips sagging", "hips too high", "knees down", "dropped to the floor",
  "go lower", "turn side-on", "too dark".
- Aside heading: "Why there is no trained classifier" with placeholder body text (Kalp's real paragraph
  will be dropped in).

NEGATIVE
No Three.js, WebGL or shader. No confetti, streak flames, "Nice rep!" copy, badges or gamification. No
progress ring around the count. No pulsing or breathing animation on the counter at rest. No fabricated
rep history, leaderboard or personal best. No stock gym photography, no silhouette athlete. No icons.
No eyebrow above the h1. No four identical stat tiles.

MOBILE (390)
Stage edge to edge with zero side gutter (the one place the gutter rule is suspended). Count top-left
inside the video at 64px minimum. The two buttons stack full width above the stage, thumb-reachable.
Everything below is one column at 68ch; the threshold table becomes a two-column definition list.
```

---

## 6. emotes — "Your own arena"

```text
Design high-fidelity mockups for Emote Detector, a browser toy for Clash Royale players.

WHAT IT IS
You give your webcam a thumbs-up, flex beside your head, or yawn, and the matching Clash Royale emote
pops up on screen with its sound. Three MediaPipe models (face, hands, pose; about 40 MB, loaded once)
run on the device; no video leaves it. There is a demo clip for people who will not grant camera access,
a mute button, and a long "How it works" explanation covering thresholds, hold times, arbitration
between flex and thumbs-up, and cooldowns. Supercell's emote art and sounds are used under their Fan
Content Policy and credited in the footer; they must appear ONLY as the payload that pops up, never as
interface chrome. Plain Vite + TypeScript, dark only.

WHO IT IS FOR
Someone who plays Clash Royale, at a laptop, who will try this for ninety seconds and either laugh or
leave; also a computer-vision demo Kalp wants read. Success: within five seconds of landing the visitor
knows the three gestures and has pressed "Start camera"; within twenty seconds an emote has fired and
they have seen why.

VISUAL THESIS
A cartoon arena drawn here, in this app's own hand: a purple-and-gold stage where your face is the
player and the emote is the thing that gets lobbed over the wall. Chamfered corners, gold as the signal,
three original gesture marks as the app's own vocabulary.

DELIVERABLES
1. Page at rest, 1440: masthead, controls above the stage (Start camera primary, Play demo, Mute; Stop
   hidden), the arena stage showing the three gesture marks as a triptych with their hints (not an
   empty black box), HUD strip along the stage's bottom edge.
2. Page at rest, 390.
3. Live, 1440: video inside the arena, landmark overlay drawn faintly in muted purple, the HUD strip's
   three marks with fill levels (e.g. thumb 20%, flex 70%, yawn 5%).
4. "Almost there" state, 1440: the flex mark at 0.35–0.5 score carries a thin gold edge beam on its HUD
   mark and the hint "Fist up beside your head" shows.
5. Fired, 1440: the Supercell emote lands centre-stage on a molded arena plate (a badge with a
   reflective edge and an embossed shadow) over the video; the status line names it.
6. Fired, 390.
7. "The three gestures" section: three rows of original mark + name + hint, no percentages, 1440.
8. "How it works" restructured: four sub-points with mono headings (Threshold / Hold / Arbitration /
   Cooldown) plus a mono timings table (0.15 s, 0.4 s, 0.5 s, 0.7 s, 2 s, 0.9×), 1440 and 390.
9. The three original gesture marks as a small sheet: thumb, flexed arm, yawning face, one stroke system
   (3px, rounded caps, gold on purple), at 64px, 28px and as a favicon.

FORMAT
Responsive web, 1440 / 390. Stage capped at min(60vh, 520px) and max-width 880px. Page gutter 20/40.

LAYOUT
- Masthead: h1 in the display face, then the two-line lede, then the provenance line "Computer vision,
  in the browser" in mono UNDER the h1.
- Controls immediately under the masthead, above the stage: Start camera (primary, gold, chamfered
  corners), Play demo (secondary), Stop (hidden until running), Mute (toggle with pressed state). Status
  line under them.
- Stage: the arena. A framed panel with chamfered corners, a 1px gold-tinted edge, one contact shadow;
  the video inside; the three gesture marks arranged along the bottom edge as a permanent HUD strip on a
  plate. Each mark fills with gold as its score rises, so the meters ARE the scoreboard.
- The fired emote pops centre-stage, large, on a molded plate.
- Below: "The three gestures" as three rows of mark + name + hint. Then "How it works" in four named
  sub-points plus the timings table. Footer: the Supercell disclosure verbatim.

TYPE SYSTEM
- System sans for prose. ONE display face, Bricolage Grotesque 700 (or Fredoka 700), used ONLY for the
  h1 and the three gesture names. ONE mono for the timings table, the provenance line and meter
  percentages.
- h1 display 700, clamp(30px, 6vw, 44px), letter-spacing -0.01em. Gesture names display 700 17px. Lede
  sans 400 17px, line-height 1.55. Hints sans 400 14px muted. Timings mono 13px tabular.

COLOUR
bg #120b1f, bg-elevated #1c1230, stage #0b0714, text #f3edff, muted #b3a6cc, line #2f2246,
accent gold #ffc43d with ink-on-gold #2a1c00, cyan #66e3ff for links only. No pink.
Gold means: a gesture firing or about to fire, and the primary button. Nothing else is gold.

MATERIAL
Chamfered arena panels (one chamfer family on every surface, including the primary button), 1px
gold-tinted edge on the stage, flat elevated surfaces elsewhere, one contact shadow under the arena.
The emote plate is the ONE skeuomorphic object: a molded badge with a reflective edge and an embossed
shadow. No glass over the video except the HUD strip's plate. No texture.

IMAGERY
Three original gesture marks drawn for this app in one stroke system; they are the vocabulary for the
HUD strip, the gesture rows, the favicon and the OG image. The Supercell emote PNG appears unchanged only
as the payload that pops up when a gesture fires; use a clearly labelled placeholder square for it in
the mockups. The landmark overlay (face mesh, hand points, pose) is drawn in muted purple at low
opacity so it reads as machinery behind the cartoon.

MOTION
Emote pop: scale 0.4 to 1 with a single overshoot, 260ms, plus the sound. Meter fills move at 120ms
linear. The "almost there" beam travels the mark's edge. Under reduced motion the emote appears at full
scale with a 120ms opacity fade, meters snap, and the beam is a static gold border.

COPY (render exactly)
- "Emote Detector"
- Lede: "Give your camera a thumbs-up, flex beside your head, or yawn, and the matching Clash Royale
  emote pops up with its sound. MediaPipe's face, hand and pose landmarkers run on your device; no video
  ever leaves it."
- "Start camera" / "Play demo" / "Stop" / "Mute"
- Status: "Press "Start camera" (about 40 MB of models load once) or "Play demo"."
- Stage placeholder: "Your camera shows here. Nothing is recorded or uploaded."
- "Thumbs Up" / "Fingers folded, thumb straight up."
- "Goblin Muscle" / "Flex: bend one arm, fist up beside your head."
- "Princess Yawn" / "A big yawn: mouth wide, eyes closed."
- "The three gestures" / "How it works"
- Sub-point headings: "Threshold", "Hold", "Arbitration", "Cooldown".
- Footer: a Supercell Fan Content Policy disclosure block (placeholder text is fine; the real one is
  fixed).

NEGATIVE
No Three.js, WebGL, shader or particle system. No Supercell art, colours, typography, card frames,
king/tower imagery or arena backdrops in the interface chrome. No confetti, screen shake or chromatic
aberration on fire. No "emotes fired today" counter, leaderboard or streaks. No neon glow on the
purple, no laser, no dither, no scanlines. No mascot. No three identical empty meter rows at rest. No
permanently greyed Stop button.

MOBILE (390)
Keep masthead, then controls, then stage (stage capped at 60vh so the buttons stay reachable). The HUD
strip's marks shrink to 28px and drop their labels, keeping only the fill. Mute joins the button row.
The timings table becomes a definition list.
```

---

## 7. microtubules — "Lab bench"

```text
Design high-fidelity mockups for Microtubule Quantifier, an in-browser scientific image tool.

WHAT IT IS
A cell-biology student picks a fluorescence microscope image (green = microtubules, blue = nucleus) and
the tool computes, with OpenCV.js in the browser, the share of the image that is microtubule after the
nucleus is removed. It shows the number, four detail values (threshold, pixel counts, nucleus share), the
input image beside the detected mask, reference ranges from the lab group's own data, and the six-step
method, and states that its result matches the group's Python pipeline to four decimal places. Three
bundled sample images (Untreated, Nocodazole 25 µM, Taxol control). Nothing is uploaded. Plain Vite +
TypeScript; light by default with a dark variant via the system setting.

WHO IT IS FOR
A Western undergrad in a cell-biology lab, on a laptop, comparing a handful of images from one imaging
session; secondarily a marker or lab head deciding whether to believe the number. Success: the reader
gets a number, understands what it excludes, and can see from the page alone that it agrees with the
Python script.

VISUAL THESIS
A neutral bench under a neutral light, so the only green on the page is the one coming out of the
microscope. Green is data. The interface has no green at all.

DELIVERABLES
1. Page before analysis, 1440 (light): masthead, the input control strip, the samples, the method.
2. Same at 390: the sample row wraps to two lines, never clipped.
3. After running "Untreated", 1440 (light): the three-band result figure (number band, figure pair,
   reference table).
4. Same at 390: figure pair stacked, number capped at 48px, detail values as a two-column mono grid.
5. Dark variant of screen 3.
6. A warning state: an unsupported file ("TIFF or HEIC: convert to PNG first.") shown as a status line
   with the warn tokens, 1440 (crop is fine).
7. The figure pair alone at full container width with L-corner brackets, captions and the stated
   magnification "77 × 58 px, shown at 4×".

FORMAT
Responsive web, 1440 / 390. Bench max-width 1120px; the figure pair may use the full width. Light
default; dark via the system setting only.

LAYOUT
- Masthead: h1, one-line lede, provenance in mono under it ("Image analysis, in the browser").
- Input bar: a single full-width row on one baseline: "Choose an image", "Take a photo", then the three
  sample buttons, with a hairline rule under the row. A control strip, not a card. Under it the file
  constraints line.
- Result, once run, as a strict three-band figure:
  Band 1: the number, left-aligned to the same rule as everything else, with "of the image is
  microtubule" beneath and the explanatory sentence, then the four detail values as a four-column mono
  grid on one line (Otsu threshold 36 / microtubule px 1,109 / total px 4,466 / nucleus removed 8.6%).
  Band 2: the figure pair, full container width, side by side, equal size, thin boundary lines with
  L-corner brackets marking it as the figure, one caption rule beneath both with the stated
  magnification. Left "Input", right "Detected microtubules (green), nucleus excluded".
  Band 3: "Is that high or low?" as a table of the three reference conditions with means and SDs
  (Untreated 27.9 ± 4.6 %, Nocodazole 17.2 ± 2.6 %, Taxol 30.7 ± 9.5 %) plus the caveat sentence.
- Then "How the number is computed": six numbered steps (01–06 in mono) with the agreement paragraph
  beneath. Then the "Download overlay / Download mask / Copy result" trio as text buttons.
- The 1120px bench has faint vertical guide lines at its edges with tiny corner squares.
- No card around the method or the reference table.

TYPE SYSTEM
- System sans for prose, system mono for every measured value. Add no webfont.
- Headline number: mono 600, clamp(48px, 7vw, 76px), tabular figures, letter-spacing -0.02em.
- Detail labels: mono 400, 11px, uppercase, 0.06em. Method steps: sans 16px, line-height 1.55.
  Reference table: mono 14px tabular with SDs at 0.85em.

COLOUR
Light: ground #f5f5f3, surface #ffffff, surface-2 #eceeeb, ink #16191a, muted #5a625e, rule #d5d9d6.
Dark: ground #101312, surface #191d1c, surface-2 #212725, ink #e9eceb, muted #9aa4a0, rule #2b312f.
ONE accent for interactive chrome: slate blue #2f6a8f (light) / #7fb8d8 (dark) for buttons, links and
the 3px focus ring. It cannot be confused with a fluorescence channel.
Green is data only: the fluorescence in the input and the detected mask, drawn as #2fd35f at 85% over
the source so the texture stays visible.
Warn tokens: background #fff4d6, border #e0b400, text #5c4300. Error #b42318.

MATERIAL
Flat bench. 1px rules, no shadows, no glass, no glow, no gradient. The only elevation is the figure's
1px frame. No icons anywhere.

IMAGERY
Scientific figure discipline: both figures at one aspect ratio, one scale, a stated magnification, a
caption under each. Use a placeholder green-on-black cell image with a blue nucleus; Kalp has the real
samples.

MOTION
None, except a 150ms fade of the result bands on first render and the status line updating. Under
reduced motion, none at all.

COPY (render exactly)
- "Microtubule Quantifier"
- Lede: "Pick a fluorescent cell image (green = microtubules, blue = nucleus) and get the share of the
  picture that is microtubule. Nothing is uploaded: the picture never leaves your device."
- "Choose an image" / "Take a photo" / "Untreated" / "Nocodazole 25 µM" / "Taxol control"
- "PNG, JPEG, WebP, BMP or GIF, up to 30 megapixels. TIFF or HEIC: convert to PNG first."
- "24.83 %" + "of the image is microtubule" + "Share of all pixels counted as microtubule after the
  nucleus is removed. Background is in the denominator, so a tighter crop around the cell gives a higher
  number."
- "What these numbers mean" / "Input" / "Detected microtubules (green), nucleus excluded"
- "77 × 58 px, shown at 4×"
- "Is that high or low?" and "compare images within one experiment rather than against this table."
- "How the number is computed"
- "the browser result equals the Python script's result to four decimal places, and on a 60-image test
  set every picture matches within 0.01 point"
- "Download overlay" / "Download mask" / "Copy result"

NEGATIVE
No green in the interface: not the button, the links, the focus ring or the big number. No Three.js,
WebGL or shader. No glow on the mask, no neon, no "scientific" grid background, no DNA helix, no hexagon
pattern, no microscope illustration. No card around the method or the reference table. No claim beyond
what is stated; never round "within 0.01 point" up to "identical". No progress spinner; a status line is
enough. No eyebrow above the h1.

MOBILE (390)
Sample row wraps to two lines. Figure pair stacks vertically, Input above Detected, each full width
with its own caption. Detail values become a two-column mono grid. Reference table becomes three rows of
condition + value. The big number stays left-aligned and caps at 48px so the detail grid is visible on
the same screen.
```

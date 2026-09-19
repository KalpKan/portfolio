# Plato (course outline → calendar) functional audit — 2026-09-18 (TEST + CRITIQUE round 1)

Live URL https://plato.kalpkan.com · Repo `KalpKan/Plato` (local `~/projects/plato`, audited at commit `a5a3260` = `origin/main`, clean; the parser is byte-identical to the `de32e96` baseline) · Vercel project `plato` (one Python 3.12 function `src.app:app`, `maxDuration` 60 s, production deployment `dpl_62HRCwCUTNM9gn1wdp2uQF4i8FQk` Ready, 2026-09-18 17:37 EDT) · Database Neon `plato` (extraction cache + user choices only) · Health `https://plato.kalpkan.com/api/health` → `{"db":"ok","ok":true,"service":"plato"}` (`HTTP/2 200`, `server: Vercel`).

Spec and bars: `docs/reports/plato-spec.md` (10 stories, section C bar table, `tests/test_corpus.py::BAR`). Method: the repo's own tests (`pytest`, 30 tests); the whole 42-PDF corpus through `tests/corpus/run_extractor.py` and `score.py` against the 10 hand-labelled ground-truth files; the five synthetic edge files POSTed to the live `/upload`; real Chrome 151 (claude-in-chrome, macOS, the site is dark-only) on the live URL for the upload → review → edit → download flow; Playwright Chromium 1.63 headless on the live URL at 390 / 360 / 320 / 1280 px (mobile emulation, DPR 2) measuring `scrollWidth` vs `clientWidth` and taking full-page screenshots; `curl` with cookie jars for the cache/consistency/cross-visitor tests and for timing uncached parses on the Vercel function; the `icalendar` library plus a hand check of RFC 5545 requirements on the downloaded files. Evidence: `docs/reports/evidence/plato-r1-*` (scores, Playwright JSON + script, three live `.ics` downloads, four screenshots); the full-resolution PNGs at all widths and the live `.ics` files are also in `~/projects/plato-corpus/evidence/` (outside git). `impeccable:impeccable` critique ran in degraded single-context mode (no sub-agent tool in this session); `impeccable detect --json templates` → 0 findings (it could not resolve the Jinja `url_for` stylesheet, so colour/token rules were skipped); the browser overlay injection froze the Chrome tab and was abandoned.

## Verdict: PARTIALLY WORKING

The hosting and the flow shell are sound: every corpus PDF and every edge file gets a response without a 500 (the one exception is Vercel's own raw `413 FUNCTION_PAYLOAD_TOO_LARGE` for a 14.6 MB file, D8), uncached parses of the heaviest outlines finish in 13.5–20.7 s on the function (bar < 45 s), a cached re-upload takes 1.2–2.0 s, the same PDF gives a byte-identical review page whether cached, uncached or force-refreshed, inline edits, added assessments, section choice and custom lead times all land in the downloaded `.ics`, and at 390 px nothing scrolls horizontally on `/`, `/review` or `/manual`. But the product does not do the one thing it is for. On the labelled corpus the parser meets 2 of the 12 bar metrics (`files_ok` 100 %, `weights` 98 %): it reads the due date of **4 of 29** dated assessments (14 %), gets **0 of 10** term windows, **3 of 10** course codes and **3 of 11** timetable slots, and the `.ics` then invents a date for every assessment it could not date: the term end (KIN 2000, CS 2301B: 6 + 3 `DUE:` events on `20260430T235900`) or **today** (HS 2800: `20260919T235900`, because the term fell back to `date.today()`). Across all 42 outlines 11 get term "Unknown" with today's date, 12 get no course code, and only 35 of 222 extracted assessments carry any date. On top of the parser, three flow defects would stop a stranger: after any successful inline edit the "Download Calendar" button pops a native alert "Please refresh to save your changes." and downloads nothing (D5); the edits one visitor makes are written into the shared cache and served to the next visitor who uploads the same outline (D6); and "manual mode", which the app's own copy points to when extraction fails, discards the form and says it is "not yet fully implemented" (D7). Nothing has been fixed since the spec baseline (`a5a3260` is still HEAD); the corpus gate fails on 10 of 12 metrics.

## User stories tested

| # | Story | Result | Evidence |
|---|---|---|---|
| S1 | Upload a real outline → review page with course code, name, term with the right start/end dates, within the Vercel limit; bar `files_ok` 100 %, `course_code` ≥ 90 %, `term` ≥ 90 %, parse < 45 s | **FAIL** (parser) / PASS (hosting) | `files_ok` 10/10 labelled, 42/42 corpus (`plato-r1-run-extractor-2026-09-18.log`); `course_code` **3/10 = 30 %** (`ROME 2025`, `MC 113`, `MC 110`, `None` ×4); `term` **0/10 = 0 %** (every window is the hard-coded Sep 1–Dec 15 / Jan 8–Apr 30 or `date.today()`); KIN 2000 live review shows "Winter 2026, Jan 08 – Apr 30, 2026" (outline: Jan 5 – Apr 9). Uncached parse on the function: Biochem 3381A 19.3 / 19.2 s, PP3000E 20.7 / 19.1 s, KIN 2000 13.8 / 13.5 s (two runs each, `curl -F force_refresh=on`); cached 1.2–2.0 s. Real Chrome: KIN 2000 lands on `/review` (`plato-r1-review-desktop-editing-2026-09-18.jpg`). The review page never shows the course code as its own field (only "Course Name: KIN 2000 Physical Activity and Health"), so a wrong code cannot be corrected (D10) |
| S2 | Every lecture/lab/tutorial slot listed and typed right; each becomes a weekly RRULE that stops on the last day of classes; bar recall/precision ≥ 90 %, `UNTIL` = last class day, `SUMMARY` carries the course code, tutorial has its own type | **FAIL** | `sections_recall` **3/11 = 27 %**, `sections_precision` **3/10 = 30 %** (`plato-r1-corpus-score-2026-09-18.md`); KIN 2000 live: the one Thursday lecture is offered again as a lab ("Section N/A: Thu 10:30 AM – 12:20 PM" in the Lab dropdown); no location shown on the review page (outline: SSC-2050); live `.ics`: `SUMMARY:Lecture -`, `RRULE:FREQ=WEEKLY;UNTIL=20260430;BYDAY=TH` (exam-period end, not Apr 9), `DESCRIPTION:Lecture section N/A` (`plato-r1-kin2000-live-edited-2026-09-18.ics`). ECE 2240A tutorial typed lab; Biochem 3381A "MWF 12:30–1:20 pm" → 0 slots; CS 3340B → 5 wrong slots (scorer details) |
| S3 | Every assessment with a clean title, weight and the stated due date (day, month, right year, time); each a `DUE:` event; bar recall/precision ≥ 95 %, weights ≥ 98 %, `dates_exact` ≥ 95 %, `clean_titles` ≥ 95 % | **FAIL** | `assessments_recall` 47/51 = 92 %, `assessments_precision` 47/57 = 82 %, `weights` 46/47 = 98 % (pass), **`dates_exact` 4/29 = 14 %**, `clean_titles` 36/47 = 77 %. KIN 2000: all five dated rows → `None` although the extractor's own `source_evidence` contains the date ("Tracker 11 Complete Template 5% **Jan 16th** 72-hour no late penalty", in the `.ics` DESCRIPTION); titles carry footnote digits (`Physical Activity Tracker 11`, `Mid-term Exam4`, `Final Exam7`). Biochem 3381A: spurious `6 x` row; Peer Evaluations undated. HS 2800: 6 reading-list rows (`Jacobsen 2021: C.1 TBA`, `On OWL Brightspace`, `TBA`) exported as `DUE:` events dated Sep–Oct **2026** for a 2025-26 outline (`plato-r1-hs2800-live-2026-09-18.ics`). Whole corpus: 35 of 222 extracted assessments carry a date |
| S4 | TBA / Registrar / exam-period items are marked "needs a date" with a one-line reason and never get an invented date in the `.ics` (not the term end, not today) | **FAIL (blocker)** | Extractor scorer `no_fabricated` 18/18 (it returns `None`), but the product invents a date for every one: CS 2301B (all three "Date TBA" / Registrar) live download = 3 `DUE:` events at `20260430T235900` (`plato-r1-cs2301b-live-2026-09-18.ics`); KIN 2000 Final Exam ("Registrar") = `20260430T235900`; HS 2800 "End of term test", "Mid-term test", "End of year assessment" = **`20260919T235900`** = the audit day (term Unknown → `date.today()`); the DESCRIPTION admits it: "Note: No due date found. Using end of term as placeholder. Please update manually." The review page shows only a yellow "Review" badge and "Add date": no reason, nothing says "the outline says Registrar" |
| S5 | Weekly quizzes with listed dates → one `DUE:` per date; "24 h after each lab" → one event per lab occurrence or a "choose the lab slot first" note | **FAIL** | Biochem 3381A: one `Weekly Quizzes` row dated 2025-09-12 only (scorer: `recurring -> 2025-09-12`), not seven; ECE 2240A: rule text captured, 0 lab slots found, no per-lab events, no prompt (`corpus-out/ECE-2240A…json`: `dated 1 of 3`, sections 2 both typed wrong) |
| S6 | Review page states the weights total and it equals the outline's total; bonus/optional rows shown but not counted; bar `weight_total` ≥ 90 % | **FAIL (partial)** | `weight_total` 7/10 = 70 %: HS 2800 110 % (reading rows counted), Math 1228 80 % (`Bonus*` and an instructor's name are rows), Biochem 102 % (`6 x`). The "WEIGHT FOUND" tile is the only total and it turns **green at 107 %** after I added a 7 % row (real Chrome), i.e. it never warns above 100 (template `completeness-high` for ≥ 95). No optional/bonus marking exists |
| S7 | Correct any field inline, add a slot or assessment, pick a section, set lead times, download an `.ics` that reflects every edit and imports into Google/Apple Calendar without warnings, titles carrying the course code | **FAIL (partial)** | PASS: title edit ("Physical Activity Tracker 11" → "…Tracker 1"), date edit (2026-01-16 23:59), added "Audit Test Quiz 7 % 2026-02-27 14:00", lead time 0–5 % → 2 days, lecture section chosen; the download reflects all of it (`DUE: Physical Activity Tracker 1 … 20260116T235900`, `DUE: Audit Test Quiz … 20260227T140000`, `START: Physical Activity Tracker 1 … 20260114T235900`, `START: Audit Test Quiz … 20260220T140000`). FAIL: (a) **after any successful inline save without a page reload, "Download Calendar" shows the native alert "Please refresh to save your changes." and nothing downloads** — reproduced twice in real Chrome (after the lead-time edit and after a weight edit; the CDP click timed out 30 s on the modal dialog) → D5; (b) `SUMMARY` lines never carry the course code (`Lecture -`, `DUE: Final Exam7`); (c) no `DTSTAMP` in any VEVENT (RFC 5545 §3.6.1 MUST), no `VTIMEZONE` for `TZID=America/Toronto`, and `RRULE … UNTIL=20260430` is a DATE while `DTSTART` is a local DATE-TIME (RFC 5545 §3.3.10 requires a UTC date-time; Google Calendar is known to mishandle this) → D9; (d) course code, term name, slot day/time/location are not editable (D10); (e) filename says `LecNone_LabNone` after a lecture was chosen. Google / Apple import was **not exercised** (importing test calendars into Kalp's accounts was out of bounds); the RFC check above is the substitute |
| S8 | Scanned, password-protected, non-PDF, oversize and unreadable files each give a plain-language message; never a blank review page or a 500; landing copy promises only accepted formats | **FAIL** | Live `POST /upload` with each edge file: `not-a-pdf.txt` → 302 `/` "Invalid file type. Please upload a PDF file." (ok); `password-protected.pdf` → 302 `/` "**Error extracting PDF:** " (empty reason); `scanned-no-text-layer.pdf` → 302 **`/review`** showing "Course Name Not found · Term Unknown · Start Date Sep 18, 2026 · End Date Sep 18, 2026 · 0 assessments" with no explanation; `blank-one-page.pdf` → same blank review page; `oversize-6mb.pdf` (14.6 MB) → raw **`413 Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE`** plain text from Vercel (the app's own limit says 16 MB, the platform's is 4.5 MB, no client-side check). CS 3342A (image-only page 1) → review page with no code/term and no note. Landing page still says "Support for PDF, DOCX, and TXT formats" and "AI-powered parsing" while the drop zone says "Supports PDF files" (`plato-r1-landing-desktop-2026-09-18.jpg`). "Manual mode" is not linked from any page and its POST discards the form ("Manual mode is not yet fully implemented.") → D7 |
| S9 | Same PDF → same result (cached, uncached, force refresh); two outlines never share cached results | **FAIL (partial)** | PASS: for Biochem 3381A, PP3000E and KIN 2000 the normalised review page is byte-identical across force-refresh → cached → force-refresh (sha `eb0dd769…`, `6929044a…`, `3c43a4c0…`); different outlines never mixed. FAIL: (a) the README's "force refresh option" does not exist in the UI (`templates/index.html:175` is `<input type="hidden" name="force_refresh" value="">`), so a visitor can never bypass the cache; (b) **cross-visitor leak**: visitor A (cookie jar A) uploads KIN 2000 and renames assessment 2 to "EDITED BY VISITOR A" via `/api/update-field`; visitor B (fresh cookie jar) uploads the same PDF and the review page shows "EDITED BY VISITOR A" (2 hits) under "Found cached extraction data for this PDF." → D6 (restored afterwards with a force refresh) |
| S10 | On a 390 px phone: upload, review (no table overflow), edit, download without horizontal scrolling | **PASS (partial)** | Playwright Chromium mobile emulation on the live URL: `/`, `/review` (KIN 2000), `/review` with the date editor open, `/manual`: `scrollWidth == clientWidth` at **390** and **360** (`plato-r1-playwright-widths-2026-09-18.json`; `plato-r1-review-phone-390-2026-09-18.jpg`, `plato-r1-manual-phone-390-2026-09-18.jpg`). At 320 px the open date editor overflows (`scrollWidth` 345 > 320, `form.inline-edit-form right=336`) and the landing calendar cells sit 3 px outside. Every input is ≥ 16 px on `/review` (no iOS zoom), but the landing file input and the manual weight field are 13.3 px. The download itself was not clicked at 390 px (D5 makes it unreliable after an edit); the page has no theme switch and no light theme, so "both themes" = dark only |

Cross-cutting: `pytest -q tests/` → **30 passed** (54.8 s); `PLATO_CORPUS_GATE=1 pytest tests/test_corpus.py` → **FAILS on 10 of 12 metrics** (only `files_ok` and `weights` pass); pooled score reproduces the baseline table exactly (`diff` of the metric rows is empty). Console: no page errors; two `WARNING: No editable fields found! Check HTML structure.` warnings on every page load plus 36 debug `console.log`/`console.warn` calls left in `public/static/app.js`. PostHog: `pdf_uploaded` / `pdf_parsed` fire server-side (not re-verified this round). Spend unchanged ($0, Vercel Hobby, Neon Free).

## Defects

### D1 — The `.ics` invents a due date for every assessment the parser could not date (term end, or today)

Severity: **blocker** (S4 bar "no fabricated dates in the `.ics`" = 0 %; this is the calendar a student would trust)

Steps to reproduce: upload `~/projects/plato-corpus/pdfs/CS2301B Course Outline 25-26.pdf` (every assessment "Date TBA" / Registrar), click Download Calendar. Or `curl` as in verification.md "Silent-failure guard (live)".

Expected / Actual: no `DUE:` event for a TBA item (or an all-day "date TBA" marker the spec allows), and the review page says why. Actual: `DUE: Midterm Test 1`, `DUE: Midterm Test 2`, `DUE: Final Exam` all at `DTSTART;TZID=America/Toronto:20260430T235900`; for HS 2800 (term Unknown) the same three tests land on **`20260919T235900`**, the audit day.

Evidence: `docs/reports/evidence/plato-r1-cs2301b-live-2026-09-18.ics`, `plato-r1-hs2800-live-2026-09-18.ics`, `plato-r1-kin2000-live-edited-2026-09-18.ics` (DESCRIPTION: "Note: No due date found. Using end of term as placeholder. Please update manually.").

Likely cause: `src/icalendar_gen.py:76-99` — both the `elif assessment.due_rule` branch and the final `else` build `fallback_datetime` from `term.end_date` and add the event; `src/pdf_extractor.py:258` `extract_term` returns `date.today()` for both bounds when no "Fall/Winter YYYY" string matches, so "end of term" becomes today.

Suggested fix: drop both fallbacks; emit no timed event for an undated assessment, or an all-day event on the first day of the stated window with `SUMMARY: [date TBA] …` only when the outline gives a window (Registrar → exam period); carry a `date_status` on `AssessmentTask` so the review page can print "Outline says: scheduled by the Registrar" per row.

### D2 — Due-date cells are not parsed (14 % of dated assessments get a date)

Severity: **blocker** (S3 bar `dates_exact` ≥ 95 %)

Steps to reproduce: `cd ~/projects/plato && .venv/bin/python tests/corpus/run_extractor.py --out /tmp/out "FHS Course Outline 2000.pdf" && .venv/bin/python tests/corpus/score.py --output /tmp/out`.

Expected / Actual: KIN 2000's five dated rows → 2026-01-16, 01-21, 02-12, 03-15, 03-20. Actual: all five `None`, although the row's own `source_evidence` reads "… 5% Jan 16th 72-hour no late penalty". Physiology 3120 0/7, CS 3342A 0/5, CS 1000 0/2, Classical Studies outline26 0/2, ECE 2240A `Nov.29th` → wrong year in the legacy path.

Evidence: `plato-r1-corpus-score-2026-09-18.md` "Details" per file; `.ics` DESCRIPTION lines quote the unparsed date text.

Likely cause: `src/assessment_extractor.py:492` `_extract_date` hands the raw cell to `dateparser.parse` with no `RELATIVE_BASE`/term-year context and returns `None` for cells that carry a weekday, ordinal ("16th"), or a time; multi-line cells ("Author: Mon, Oct. 27th by 11:59 PM") are never joined; `src/pdf_extractor.py:2382` `_parse_date_from_text` hard-codes 2025/2026.

Suggested fix: a single date resolver that strips ordinals/weekdays, joins wrapped cells, tries `%b %d`, `%B %d`, `%d %B`, `Mon., Oct. 27` forms, resolves the year from the term window (Sept–Dec → term start year, Jan–Apr → term end year) and keeps a `date_status` (`exact` / `tba` / `registrar` / `range`) instead of `None`.

### D3 — Term window is guessed, never read; 11 of 42 outlines fall back to today

Severity: **blocker** (S1 `term` 0 %; drives D1's "today" dates and the `RRULE UNTIL` into the exam period)

Steps to reproduce: upload KIN 2000; read "Start Date / End Date" on the review page.

Expected / Actual: Jan 5 – Apr 9, 2026 (the outline's "Important Dates" table). Actual: Jan 08 – Apr 30, 2026 (hard-coded Winter). HS 2800, Math 1228, CS 3342A, HS 2250A, HS 2610G, HS 3250F, B2382, B3603A, Calc 1301B, CS 1000, outline26 → "Unknown", Sep 18 – Sep 18, 2026. ECE-2240A_Fall-2025 and MSE-2201_Fall-2025 come back "Winter 2025".

Evidence: corpus summary table in this audit's log (`code None 12, term Unknown 11, start today 11`); `plato-r1-corpus-score-2026-09-18.md` term column all ✗.

Likely cause: `src/pdf_extractor.py:258` `extract_term`: the "Classes begin / Classes end" and date-range matches are discarded (`pass`), seasons are mapped to fixed dates, and the no-match path uses `date.today()`; the season regex also picks the first "Fall/Winter" word on the page rather than the outline's own header.

Suggested fix: read "Classes begin/end" tables and "Sept 4 – Apr 9" ranges first; otherwise use a small table of Western sessional dates per term (2022–2026) keyed by the year found next to the course code or in the file's first page; never return `today`; when unknown, mark the field "Not found" so the review page asks for it and the `.ics` has no recurring events until it is set.

### D4 — Timetable slots: 27 % recall, duplicated lecture-as-lab, tutorial typed as lab, no location, `SUMMARY:Lecture -`

Severity: **major** (S2 bar ≥ 90 %/90 %)

Steps to reproduce: upload KIN 2000; open the Lab dropdown. Run the scorer for ECE 2240A, Biochem 3381A, CS 3340B.

Expected / Actual: one Thursday lecture at SSC-2050, no lab; a `SUMMARY` like `KIN 2000 Lecture` with `LOCATION:SSC-2050` and `UNTIL` = 2026-04-09. Actual: the lecture is also offered as "Section N/A: Thu 10:30 AM – 12:20 PM" under Lab; no location; `SUMMARY:Lecture -`; `UNTIL=20260430`. ECE 2240A "Friday 12.30–1.30 pm UCC-56" tutorial → lab; Biochem "MWF 12:30 – 1:20 pm" → nothing; CS 3340B → 5 wrong slots.

Evidence: `plato-r1-kin2000-live-edited-2026-09-18.ics`; scorer sections rows.

Likely cause: `SectionOption` has no tutorial type and `src/pdf_extractor.py` section extraction feeds the same matched row to both lecture and lab lists; dotted times (`12.30`) and day-letter groups (`MWF`) are not in the time regex; `src/icalendar_gen.py:151-156` builds the summary from `section_id` (empty) and never adds the course code or location.

Suggested fix: add `tutorial` to the type enum, de-duplicate by (days, start, end), parse `MWF`/`TTh`/dotted times, keep `location`, and build `SUMMARY` as `<course code> <Lecture|Lab|Tutorial>` with `LOCATION`.

### D5 — After any successful inline edit, "Download Calendar" is blocked by a native alert and nothing downloads

Severity: **major** (breaks S7 for the exact user the review page is designed for; a native `alert()` freezes the tab)

Steps to reproduce (real Chrome): upload KIN 2000 → on `/review` click a weight (or a lead-time cell) → type a value → Save (the field shows "10%" in a blue chip, i.e. saved) → click "Download Calendar".

Expected / Actual: the `.ics` downloads with the new weight. Actual: modal alert "Please refresh to save your changes.", no download; the CDP click timed out for 30 s on the dialog both times. Adding an assessment reloads the page, which is why the earlier edits in the same session did not trigger it.

Evidence: reproduced twice (after the lead-time edit and after a weight edit); no new file in `~/Downloads` until the page was reloaded and the download clicked again.

Likely cause: `public/static/app.js:698-704` — the success path of `saveField()` updates the display but never removes the `editing` class (only the two error paths at `:710` and `:717` do), so `generateBtn`'s click handler (`app.js:26-31`) finds `.editable-field.editing`, then no `.inline-edit-input` inside it, and hits the `alert('Please refresh to save your changes.')` branch at `:70`.

Suggested fix: `fieldElement.classList.remove('editing')` in the success branch (and in `updateFieldDisplay`); replace the four `alert()`s in the review flow with the page's own inline notice; disable the Download button while a save is in flight instead of guessing.

### D6 — One visitor's inline edits are written into the shared extraction cache and served to the next visitor who uploads the same outline

Severity: **major** (S9; any student can rename, re-date or delete another student's assessments for a whole class's outline; also a data-integrity risk for the corpus tests that hit the live site)

Steps to reproduce: cookie jar A: `curl -F pdf_file=@"FHS Course Outline 2000.pdf" /upload` then `curl -H 'Content-Type: application/json' -d '{"field_type":"assessment_title","assessment_index":2,"value":"EDITED BY VISITOR A"}' /api/update-field`; cookie jar B (fresh): upload the same PDF and `GET /review`.

Expected / Actual: B sees the parser's output. Actual: B's review page shows "EDITED BY VISITOR A" under "Found cached extraction data for this PDF." (verified live 2026-09-18 21:52 EDT, then reverted with a force refresh).

Likely cause: `src/app.py:126-130` `save_extracted()` upserts the edited `ExtractedCourseData` into `extraction_cache` keyed only by `pdf_hash` (called at the end of `/api/update-field`, `/api/add-assessment`, `/api/remove-assessment`); the per-session table (`user_choices`, keyed by `pdf_hash + session_id`) is used only for section choices and lead times.

Suggested fix: keep the parser's output immutable in `extraction_cache`; store edits as a per-session overlay (the `user_choices` row already has the right key) and merge on read; or key the edited copy by `(pdf_hash, session_id)`.

### D7 — "Manual mode" discards the form and says it is not implemented, and nothing links to it

Severity: **major** (S8: it is the fallback the README, the scanned-PDF path and the review page's "Add one manually" copy rely on)

Steps to reproduce: open `/manual`, fill term, one assessment, click Generate Calendar.

Expected / Actual: an `.ics`. Actual: 302 to `/` with the info banner "Manual mode is not yet fully implemented."; the form is lost. The landing page has no link to `/manual` at all (grep of `templates/index.html` finds none).

Evidence: `curl -d 'term_name=…&assessment_title[]=Quiz 1…' https://plato.kalpkan.com/manual` → `302 /`, banner text above; `plato-r1-manual-phone-390-2026-09-18.jpg`.

Likely cause: `src/app.py:923-939` `manual()` POST branch is a stub.

Suggested fix: either wire the POST to build an `ExtractedCourseData` and redirect to `/review` (the review page already has "Add Section"/"Add Assessment", so the simplest honest version is a "Start from scratch" button that opens `/review` with an empty course and the term fields marked missing), or remove the page and every reference to it.

### D8 — Edge files: raw Vercel 413 for big files, empty "Error extracting PDF: " for a protected PDF, blank review page for image-only and empty PDFs

Severity: **major** (S8 bar: a specific plain-language message for each of the five)

Steps to reproduce: POST each file in `~/projects/plato-corpus/edge/` to `/upload` (commands in "How to verify").

Expected / Actual: image-only → "this PDF has no text layer, use manual entry"; password → "this PDF is password-protected, remove the password and try again"; 14.6 MB → "files over 4.5 MB cannot be uploaded on this free hosting" before the request leaves the browser; blank → "no course information found". Actual: `scanned-no-text-layer.pdf` and `blank-one-page.pdf` → `/review` with "Course Name Not found, Term Unknown, Start Date Sep 18, 2026, End Date Sep 18, 2026, 0 assessments" and no message; `password-protected.pdf` → "Error extracting PDF: " (the exception's `str()` is empty); `oversize-6mb.pdf` → HTTP 413 plain text `Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE` (Vercel's body cap is 4.5 MB; the app's `MAX_FILE_SIZE` is 16 MB and `app.js:238` only checks 16 MB client-side).

Likely cause: `src/app.py:616-642` treats an extraction that returns nothing as success; the `except Exception as e` at `:640` flashes `str(e)`; `MAX_FILE_SIZE`/`app.js:238` use 16 MB although the function limit is 4.5 MB; no "page has no text" check after `PDFExtractor.extract_all()`.

Suggested fix: after extraction, if no text was found on page 1 (or no course/term/assessments at all) redirect to `/` with a specific message and a "enter it by hand" link; map `pdfplumber`/`fitz` password errors to their own message; set the client and server limit to 4 MB and say so on the drop zone.

### D9 — `.ics` does not meet RFC 5545: no `DTSTAMP`, no `VTIMEZONE`, `UNTIL` type mismatch, no course code in titles

Severity: **major** (S7 "imports into Google and Apple Calendar without warnings"; the `UNTIL` mismatch is the one that changes behaviour)

Steps to reproduce: download any calendar; `python -c "from icalendar import Calendar; ..."` as in this audit.

Expected / Actual: each VEVENT has `DTSTAMP` (§3.6.1 MUST), the file carries a `VTIMEZONE` for `America/Toronto` (§3.6.5) and a recurring event with a `DTSTART` in local time has `UNTIL` as a UTC date-time (§3.3.10). Actual: 0/10 events have `DTSTAMP`, no `VTIMEZONE`, `RRULE:FREQ=WEEKLY;UNTIL=20260430;BYDAY=TH` (DATE) against `DTSTART;TZID=America/Toronto:20260108T103000`; `SUMMARY` is `Lecture -` / `DUE: …` with no course code, so a student with five courses gets five identical "Lecture -" series.

Evidence: `plato-r1-kin2000-live-edited-2026-09-18.ics` and the `icalendar` check in the audit log (`missing DTSTAMP: 10`, `UNTIL … date | DTSTART … datetime`).

Likely cause: `src/icalendar_gen.py` never adds `dtstamp`; `_create_recurring_section_events` passes `'UNTIL': end_date` (a `date`); no `VTIMEZONE` component is built; summaries omit `course_code`.

Suggested fix: `event.add('dtstamp', datetime.now(timezone.utc))`; `UNTIL` = `tz.localize(datetime.combine(end_date, section.end_time)).astimezone(utc)`; add a `VTIMEZONE` via `icalendar`'s `Timezone.from_ical`/`zoneinfo` helper; prefix every `SUMMARY` with the course code.

### D10 — Review page: course code, term name and slot details cannot be edited; "Review" badge and "Add date" give no reason; the total turns green above 100 %

Severity: **minor** (S6/S7 completeness; D1–D3 make these edits necessary far more often than they should be)

Steps to reproduce: upload Classical Studies `outline26.pdf` (code extracted as `MC 110`); try to fix the code; add a 7 % assessment to KIN 2000 and look at the "WEIGHT FOUND" tile.

Expected / Actual: code, term name, slot days/times/location editable; a row that says "Registrar" or "TBA" shows that reason; a total of 107 % is flagged. Actual: only course name, start/end date, assessment title/weight/date and lead times are editable (`templates/review.html:40-77`, `:183`); the only signal on an undated row is a yellow "Review" badge; 107 % renders green (`review.html:19` uses `completeness-high` for ≥ 95).

Likely cause: template fields; `completeness.total_weight` colour classes.

Suggested fix: make the code and term editable, expose slot rows as editable fields, print `date_status` text per row, colour the tile red above 102 % and show "of 100 %".

### D11 — Landing page: promises DOCX/TXT and "AI-powered" parsing, contradicts itself, has a broken "How it works" strip and no progress state for a 15–20 s parse

Severity: **minor** (S8 copy; trust)

Steps to reproduce: open `/` at desktop width; pick a PDF; click Generate Calendar and watch the button.

Expected / Actual: one truthful format line; the three-step strip; a "Reading your outline…" state. Actual: "Support for PDF, DOCX, and TXT formats" and "AI-powered parsing" in the feature row, "Supports PDF files" in the drop zone; the "How It Works" workflow shows only a stray "Course Outline" icon at the left with "Processing" and "Calendar File" invisible (`plato-r1-landing-desktop-2026-09-18.jpg`, `templates/index.html:85-90`); the submit button gives no feedback for the 13–21 s uncached parse and can be clicked again; dropping a non-PDF triggers a native `alert('Please select a PDF file.')` (`index.html:256`).

Likely cause: Figma copy carried over (`templates/index.html` "How It Works" cards); workflow strip CSS at desktop widths; no submit handler on the upload form.

Suggested fix: "PDF only, up to 4 MB", "rule-based extraction, check every date before you import"; fix or remove the strip; disable the button and show a progress line on submit.

### D12 — At 320 px the inline date editor overflows; two inputs are under 16 px; debug warnings in the production console

Severity: **minor**

Evidence: `plato-r1-playwright-widths-2026-09-18.json` `review-editing@320` (`scrollWidth 345`, `form.inline-edit-form right=336`), `index@320` (`div.calendar-day right=323`), `index@360` (`div.hero-glow right=372`, decorative); input font sizes 13.33 px on the landing file input and the manual weight field (iOS zooms on focus below 16 px); `WARNING: No editable fields found! Check HTML structure.` ×2 on every page (`app.js`, 36 debug `console.*` calls).

Suggested fix: `max-width: 100%` on `.inline-edit-form`; `font-size: 16px` on inputs; strip the debug logging.

## Known limitations that are NOT defects

- Lab and tutorial slots that exist only on draftmyschedule or in a separate timetable (ECE 2240A labs, Math 1228 tutorials with blank cells) cannot be extracted from the outline; the app must say so and offer manual entry (which D7 currently blocks).
- Registrar-scheduled finals never have a date in the outline; "best N of M" and bonus rows legitimately make row sums ≠ 100 (the ground truth lists the acceptable totals).
- Uncached parses take 13–21 s on the Vercel function (about 2× the local time); that is inside the 45 s bar and the 60 s `maxDuration`, but it needs a visible progress state (D11), not a faster parser.
- The site is dark-only by design (no theme switch, no `prefers-color-scheme` rules); the spec's "both themes" collapses to one.
- Google Calendar and Apple Calendar import screenshots are still pending: importing audit calendars into Kalp's own accounts was not done; the RFC 5545 check (D9) stands in until a fixer creates a throwaway calendar for it.
- Ground truth for 5 more outlines (spec section d, "pick the ones the fixed parser scores worst on") is deferred to the fix round by design, since choosing them needs the fixed parser.

## How a fixing agent should verify the fix

```bash
cd ~/projects/plato
.venv/bin/pytest -q tests/ -p no:cacheprovider                                   # 30 passed today; keep green
.venv/bin/python tests/corpus/run_extractor.py --out /tmp/plato-out             # all 42 PDFs, ~3 min, every line "OK"
.venv/bin/python tests/corpus/score.py --output /tmp/plato-out --markdown /tmp/after.md
diff <(sed -n '3,16p' tests/corpus/baseline-2026-09-18.md) <(sed -n '3,16p' /tmp/after.md)   # must differ, upward
PLATO_CORPUS_GATE=1 .venv/bin/pytest -q tests/test_corpus.py -s -p no:cacheprovider          # D1-D4: 1 passed, every line ≥ its bar

# D1 (live, no invented dates) — expect no DUE: line dated 20260430 or today's date
CJ=$(mktemp); curl -s -c $CJ -b $CJ -o /dev/null -F "pdf_file=@$HOME/projects/plato-corpus/pdfs/CS2301B Course Outline 25-26.pdf" -F force_refresh=on https://plato.kalpkan.com/upload
curl -s -c $CJ -b $CJ -d 'lecture_section=none&lab_section=none' https://plato.kalpkan.com/review | grep -E '^(SUMMARY|DTSTART)'
# same for HS-2800-Research-Methods.pdf (term Unknown today) and "FHS Course Outline 2000.pdf" (Registrar final)

# D6 (no cross-visitor leak) — expect 0
A=$(mktemp); B=$(mktemp); P="$HOME/projects/plato-corpus/pdfs/FHS Course Outline 2000.pdf"
curl -s -c $A -b $A -o /dev/null -F "pdf_file=@$P" https://plato.kalpkan.com/upload
curl -s -c $A -b $A -H 'Content-Type: application/json' -d '{"field_type":"assessment_title","assessment_index":2,"value":"EDITED BY VISITOR A"}' https://plato.kalpkan.com/api/update-field
curl -s -c $B -b $B -o /dev/null -F "pdf_file=@$P" https://plato.kalpkan.com/upload
curl -s -c $B -b $B https://plato.kalpkan.com/review | grep -c "EDITED BY VISITOR A"
curl -s -c $B -b $B -o /dev/null -F "pdf_file=@$P" -F force_refresh=on https://plato.kalpkan.com/upload   # clean up

# D7 (manual mode) — expect 302 to /review (or the page gone and unlinked), never "not yet fully implemented"
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -d 'term_name=Fall 2026&term_start=2026-09-08&term_end=2026-12-08&assessment_title[]=Quiz 1&assessment_type[]=quiz&assessment_due[]=2026-10-01T10:00&assessment_weight[]=10' https://plato.kalpkan.com/manual

# D8 (edge files) — each must redirect to / with its own message; none to /review; the 14.6 MB file must be refused in the browser before upload
for f in scanned-no-text-layer.pdf password-protected.pdf blank-one-page.pdf not-a-pdf.txt oversize-6mb.pdf; do CJ=$(mktemp); echo "== $f"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -c $CJ -b $CJ -F "pdf_file=@$HOME/projects/plato-corpus/edge/$f" https://plato.kalpkan.com/upload; curl -s -c $CJ -b $CJ https://plato.kalpkan.com/ | grep -o 'alert alert-[a-z]*">[^<]*'; done

# D9 (RFC 5545) — expect missing DTSTAMP 0, a VTIMEZONE, UNTIL a UTC datetime, every SUMMARY starting with the course code
.venv/bin/python - <<'EOF'
from icalendar import Calendar; c=Calendar.from_ical(open('/path/to/download.ics','rb').read()); ev=list(c.walk('VEVENT'))
print('missing DTSTAMP', sum('DTSTAMP' not in e for e in ev), 'VTIMEZONE', bool(list(c.walk('VTIMEZONE'))))
print([ (str(e['SUMMARY']), e['RRULE'].get('UNTIL')) for e in ev if 'RRULE' in e])
EOF

# D5 (download after an inline edit), D10, D11, D12 — real Chrome on https://plato.kalpkan.com: upload KIN 2000, edit a weight, Save, click Download Calendar:
#   the .ics must download with no alert. Then Playwright: node docs/reports/evidence/plato-r1-playwright-widths.js  (scrollWidth == clientWidth at 390/360/320 incl. review-editing)
```

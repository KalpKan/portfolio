# Plato (course outline → calendar) — product spec for the Phase 5 fix loop

_Written 2026-09-18 by the SPEC agent; re-verified 2026-09-18 by the resumed SPEC run (workflow restart): `KalpKan/Plato` is still at `a5a3260` (parser unchanged since the `de32e96` baseline), all 42 corpus PDFs on disk match `tests/corpus/manifest.json` sha256, `score.py` reproduces the baseline table below exactly, the report-only gate test passes, and no `docs/reports/plato.md` audit exists yet, so the first audit round starts from this baseline._ Read this before auditing or fixing https://plato.kalpkan.com. The audit report that follows it is `docs/reports/plato.md` (format: `docs/hosting-plan.md` section 11)._

Live URL https://plato.kalpkan.com · Repo `KalpKan/Plato` (local `~/projects/plato`) · Vercel project `plato` (one Python 3.12 function, `src.app:app`, 60 s max duration) · Database Neon `plato` (extraction cache only) · Health `https://plato.kalpkan.com/api/health` → `{"db":"ok","ok":true,"service":"plato"}` · GitHub description: "Automatic Calendar Maker For Western Students"

Focus set by Kalp: _"the extraction pipeline needed work, it was not extracting everything it should consistently."_ Consumer grade for this project = given any Western University course outline PDF, every recurring lecture/lab/tutorial slot and every dated assessment (with its weight) lands in the `.ics` correctly and consistently; anything the app cannot extract is explained to the student on the review page, never silently invented.

Hosting constraint for every fix: the app stays one Vercel Hobby Python function (500 MB bundle, 60 s configured / 300 s hard limit, 4.5 MB request body). No OCR service, no LLM API, no always-on server; a parse must finish well inside 60 s on Vercel (a 12-page outline currently takes about 16 s there).

## (a) What the project is supposed to do, in its own words

From `README.md` (repo root):

> A web application that automatically extracts course information from Western University course outline PDFs and generates iCalendar (.ics) files compatible with Google Calendar, Apple Calendar, and Outlook.

> Plato processes course outline PDFs to extract: Course information (code, name, term) · Lecture and lab schedules (days, times, locations) · Assessments (assignments, quizzes, exams with due dates and weights) · Relative date rules (e.g., "24 hours after lab"). The extracted data is then converted into a calendar file with: Recurring lecture and lab events · Assessment due dates · Study plan events (configurable lead times based on assessment weights)

> Features: Automatic PDF extraction using multi-layered approach · Document structure analysis with layout-aware extraction · Section segmentation for accurate field extraction · Policy text filtering to reduce false positives · Constrained selection to ensure assessment weights total ~100% · Interactive review interface with inline editing · Manual section and assessment addition · Configurable study plan lead times · Session-based caching for performance · Force refresh option · Dark mode, responsive design

> Usage: 1. Upload PDF 2. Review Extraction 3. Edit Fields (click on any field to edit inline) 4. Add Missing Data ("Add Section" / "Add Assessment") 5. Select Sections (if multiple lecture/lab sections exist) 6. Review Assessments 7. Configure Lead Times 8. Generate Calendar → download the .ics file. Manual Mode: if PDF extraction fails or you prefer to enter data manually.

> Performance (README claim, on 39 outlines): Extraction Success 100% · Perfect Weight Accuracy (90-110%) 87% · Assessment Extraction (2+ assessments) 97% · Course Name Extraction 100%. Limitations: PDF format only · Maximum file size 5MB · works best with clear assessment tables · Lecture/lab schedules rarely included in PDFs (manual entry available).

From `PROJECT_OVERVIEW.md`:

> Primary Objective: Transform Western University course outline PDFs into structured calendar events (.ics files) that students can import into Google Calendar, Apple Calendar, or Outlook. Target Success Criteria: 80% Extraction Rate (4 out of 5 course outlines should be automatically extractable) · Time Savings: faster than manually reading and plotting on a calendar · Accuracy: better than manual transcription (no typos, date errors).

From `EXTRACTION_PLAN.md` section 1 (the fields the pipeline is designed to extract):

> Course Code, Course Name, Term, Term Dates (start, end, reading week, exam period), Timezone America/Toronto · Lecture Sections / Lab Sections / Tutorial Sections: days of week, start time, end time, location, section ID · For each assessment: Title, Type (quiz, midterm, final, assignment, lab_report, project, other), Weight, Due Date(s) (date and time if specified; secondary dates such as PeerWise "Author" and "Answer"; date ranges such as "December exam period"; relative dates such as "24 hours after lab").

From the live landing page (`templates/index.html`, copied from the Figma design in `figma landingpage/components/`):

> From Course Outline to Calendar in Seconds. Upload your course outline and instantly generate a calendar file with all assignments, lectures, labs, and due dates automatically extracted. · How It Works: Upload Course Outline ("Support for PDF, DOCX, and TXT formats") → Automatic Extraction ("AI-powered parsing of assignments, lectures, and labs") → Calendar Export ("Download .ics file compatible with all calendar apps").

From `docs/hosting-plan.md` section 1 (Tier A row): Flask 3, Postgres via `DATABASE_URL`, "None (rule-based PDF parsing)", "Works, dormant since Jan 2026". Section 7 row 5 moved it to Vercel Python + Neon (done 2026-09-18, T1.3).

Spec conflict to resolve in the fix: the landing page promises DOCX and TXT and "AI-powered" parsing; `src/app.py` `allowed_file` accepts `.pdf` only and the parser is rule-based. Either add the formats or change the copy (the README says "PDF format only"). A promise the app does not keep is a defect (story 8).

## (b) User stories

1. **Upload a real outline.** As a visitor I drop a Western course outline PDF on the upload page and, within the Vercel time limit, I land on a review page that shows the course code, course name and term with the right start and end dates.
2. **Recurring slots.** As a visitor I see every lecture, lab and tutorial slot printed in the outline (day(s), start, end, location) listed on the review page, each typed correctly (a tutorial is not a lab), and after download each one is a weekly recurring event in the `.ics` that starts in the first week of classes and stops at the last day of classes, not at the end of the exam period.
3. **Dated assessments with weights.** As a visitor I see every assessment in the outline's evaluation table or list with its title (clean, no footnote digits or stray "(" tails), its weight, and the due date the outline states (day, month, the right year, and the time when the outline gives one), and after download each one is a `DUE:` event on that date.
4. **Undated assessments are explained, not invented.** As a visitor whose outline says "Final exam: scheduled by the Registrar", "Date TBA" or "during the December exam period", I see that assessment on the review page marked as needing a date, with a one-line reason, and the `.ics` never contains an invented date for it (in particular not the term end date and not today's date).
5. **Recurring and relative assessments.** As a visitor whose outline lists weekly quizzes with explicit dates (Biochem 3381A: seven Fridays) I get one `DUE:` event per listed date; for a rule such as "lab report due 24 hours after each lab session" (ECE 2240A) I get one event per lab occurrence once I have chosen the lab slot, or a clear note that the lab day/time must be entered first.
6. **Weights add up.** As a visitor I see the weights total (the review page states it) and it equals the outline's total (100 %, or the outline's own figure when it uses "best N of M" or bonus rows); extras such as "Bonus 10 %" are shown as optional and not counted.
7. **Editing and download.** As a visitor I can correct any field inline, add a missing slot or assessment, pick my lecture/lab section, set study lead times, and download an `.ics` that reflects every edit; the file imports into Google Calendar and Apple Calendar without warnings and its event titles carry the course code.
8. **Honest failures.** As a visitor who uploads a scanned (image-only) PDF, a password-protected PDF, a non-PDF, a file over the size limit, or an outline the parser cannot read, I see a plain-language message saying what went wrong and what to do (use manual mode, try another PDF, file too large for the free hosting), never a blank review page, a 500, or a calendar full of placeholder dates. The landing page only promises formats the app accepts.
9. **Consistency.** As a visitor I get the same result every time I upload the same PDF (with or without the cache, with "force refresh"), and two different outlines never share cached results.
10. **Phone.** As a visitor on a 390 px phone I can upload, review (tables do not overflow), edit and download without horizontal scrolling.

## (c) Consumer-grade bar per story (measurable)

Measured on the labelled corpus (section d) with `tests/corpus/score.py`, pooled across the 10 labelled outlines, plus live checks in Chrome for the flow stories. Numbers in brackets are the 2026-09-18 baseline at commit `de32e96`.

| Story | Bar | Baseline |
|---|---|---|
| 1 | `files_ok` 100 % (no exception on any corpus PDF); `course_code` ≥ 90 %; `term` (start and end both equal the outline's own "Classes begin/end" dates, or Western sessional dates when the outline gives none) ≥ 90 %; every labelled parse completes in < 45 s on Vercel (`pdf_parsed` PostHog event carries the duration) | files_ok 10/10; course_code 3/10 (30 %); term 0/10 (0 %); slowest local parse 8.1 s |
| 2 | `sections_recall` ≥ 90 % and `sections_precision` ≥ 90 % (match = type + day set + start time); every recurring `.ics` event has `RRULE:FREQ=WEEKLY;UNTIL=<last day of classes>` and a `SUMMARY` that includes the course code; a tutorial slot has its own type | recall 3/11 (27 %), precision 3/10 (30 %); KIN 2000 lecture duplicated as a lab; ECE tutorial typed as lab; live `SUMMARY:Lecture -` with `UNTIL=20260430` (exam period end) |
| 3 | `assessments_recall` ≥ 95 % and `assessments_precision` ≥ 95 %; `weights` ≥ 98 % of matched rows; `dates_exact` ≥ 95 % of assessments the outline dates (right day, month and year; time when stated); `clean_titles` ≥ 95 % | recall 47/51 (92 %), precision 47/57 (82 %); weights 46/47; **dates_exact 4/29 (14 %)**; clean_titles 36/47 (77 %) |
| 4 | `no_fabricated` = 100 % (no matched TBA/Registrar/range item carries a date outside its stated window); live `.ics` for `CS2301B Course Outline 25-26.pdf` (every assessment "Date TBA") contains **no** `DUE:` event dated on the term end; review page shows a per-row reason ("Outline says: scheduled by the Registrar") | scorer 18/18 because the extractor returns `None`; **but the live `.ics` dates all six KIN 2000 assessments `20260430T235900`** (`src/icalendar_gen.py:80,92` fall back to `term.end_date`), so the product fails this story |
| 5 | Biochem 3381A quizzes → 7 `DUE:` events on the seven listed Fridays (13:00); ECE 2240A labs → one event per lab session or an explicit "enter your lab day first" prompt; `rule_resolver` output verified on both | one "Weekly Quizzes" row dated 2025-09-12 only; ECE lab rule captured as text, no events |
| 6 | `weight_total` ≥ 90 % of outlines within ±2 of an acceptable total; excluded rows (bonus, optional) shown but not counted | 7/10 (70 %); Math 1228 counts "Bonus*" and an instructor's name; HS 2800 = 110 % from reading rows |
| 7 | Chrome flow: edit a date, add an assessment, pick a section, download; the `.ics` reflects all three; `icalendar` parses it and Google Calendar import shows no warning; `SUMMARY` lines carry the course code | works for edits (T1.3 proof); summaries lack the course code |
| 8 | Each of the five edge files in `~/projects/plato-corpus/edge/` produces a specific message (image-only → "this PDF has no text layer, use manual mode"; password → "protected PDF"; `.txt` → "PDF only"; 14 MB → the size limit stated in MB, before the request is sent when possible; blank → "no course information found"); no 500s; landing-page copy matches the accepted formats | image-only CS 3342A page 1 silently yields no code/term; landing page promises DOCX/TXT; other cases untested |
| 9 | Same PDF twice (second run cached) → identical review JSON; "force refresh" → identical; two different PDFs in the same browser session never mix (cache keyed by SHA-256 already) | untested |
| 10 | Real-Chrome iframe at 390/360/320 px: `scrollWidth == clientWidth` on `/`, `/review`, `/manual` | `/` verified (T1.3); `/review` and `/manual` untested |

**Consumer-grade bar, in one paragraph:** On the labelled corpus the parser must reach at least 95 % recall and 95 % precision on assessments, 95 % correct due dates on the assessments the outline actually dates, 100 % "no fabricated dates" for TBA/Registrar items (in the `.ics`, not just in the extractor), 90 % recall and precision on lecture/lab/tutorial slots with correct types and an `UNTIL` on the last day of classes, 90 % correct term windows and course codes, 95 % clean titles and 90 % correct weight totals; every corpus PDF and every edge-case file must produce either a correct review page or a plain-language explanation, never a 500 or a placeholder-dated calendar; each parse must finish in under 45 s on the Vercel function; and the review, edit and download flow must work in real Chrome at desktop and 390 px widths with `.ics` files that Google and Apple Calendar import cleanly. The gate is `PLATO_CORPUS_GATE=1 .venv/bin/pytest -q tests/test_corpus.py` in `KalpKan/Plato` (thresholds in `tests/test_corpus.py::BAR`).

## (d) Test assets

All PDFs live **outside the repo** (they name instructors and TAs; `*.pdf` is also git-ignored in the Plato repo). Everything that is committed holds only course codes, slots, weights and dates.

| Asset | Path | Status |
|---|---|---|
| Corpus of 42 real Western outlines (2022-2026; Science, Math, CS, Engineering, Health Sciences, Kinesiology, Physiology, Biochemistry, Classical Studies, Applied Math, MSE, ECE) | `~/projects/plato-corpus/pdfs/*.pdf` (copied from `~/Desktop/Out and About/Sidequest/Plato/{course_outlines,test_course_outlines}` and `~/Downloads`; originals untouched). Override with `PLATO_CORPUS_DIR` | created 2026-09-18; `~/projects/plato/tests/corpus/manifest.json` lists every file with sha256 and size |
| Hand-written ground truth for 10 outlines (KIN 2000, Classical Studies 1000, CS 2301B, CS 3340B, CS 3342A, ECE 2240A, Math 1228, Physiology 3120, Health Sciences 2800, Biochem 3381A): term window, every slot, every assessment with weight and `date_status` ∈ {exact, tba, registrar, range, recurring}, excluded rows, notes on traps | `~/projects/plato/tests/corpus/ground_truth/<stem>.json` | created 2026-09-18 by reading each PDF (page-1 image of CS 3342A read visually) |
| Extractor runner (one JSON per PDF, same shape as ground truth) | `~/projects/plato/tests/corpus/run_extractor.py` | created |
| Scorer (recall/precision per event type, markdown + JSON report) | `~/projects/plato/tests/corpus/score.py` | created |
| Baseline snapshot (extractor output for all 42 PDFs at `de32e96`) and its score | `~/projects/plato/tests/corpus/baseline-2026-09-18/`, `baseline-2026-09-18.md`, `baseline-2026-09-18.json` | created; re-score any time with `score.py --output tests/corpus/baseline-2026-09-18` |
| Gate test | `~/projects/plato/tests/test_corpus.py` (report-only unless `PLATO_CORPUS_GATE=1`) | created; skips when the corpus folder is absent |
| Edge-case files for story 8 (synthetic, no personal data): image-only PDF, password-protected PDF, 14 MB PDF, blank PDF, `.txt` | `~/projects/plato-corpus/edge/{scanned-no-text-layer.pdf, password-protected.pdf (pw: secret), oversize-6mb.pdf (14.6 MB), blank-one-page.pdf, not-a-pdf.txt}` | created 2026-09-18 |
| Live-flow evidence for story 4 | `~/projects/plato-corpus/evidence/kin2000-live-2026-09-18.ics` (copy of the live download) | created (see baseline observations) |
| Still to create by the fixer/auditor | ground truth for 5 more outlines from the unlabelled 32 (pick the ones the fixed parser scores worst on, to avoid tuning to the labelled 10); Google/Apple Calendar import screenshots for story 7; iframe measurements for story 10 | pending |

How to measure (before and after):

```bash
cd ~/projects/plato
.venv/bin/python tests/corpus/run_extractor.py --out tests/corpus/output        # all 42 PDFs, ~3 min
.venv/bin/python tests/corpus/score.py --output tests/corpus/output --markdown /tmp/after.md
diff <(sed -n '3,16p' tests/corpus/baseline-2026-09-18.md) <(sed -n '3,16p' /tmp/after.md)
PLATO_CORPUS_GATE=1 .venv/bin/pytest -q tests/test_corpus.py -s                  # the gate
```

## Baseline observations (2026-09-18, for the fixer; not a full audit)

Pooled baseline (10 labelled outlines, commit `de32e96`): course_code 30 % · term 0 % · sections 27 % R / 30 % P · assessments 92 % R / 82 % P · weights 98 % · **dates_exact 14 %** · no_fabricated 100 % (extractor) · clean_titles 77 % · weight_total 70 %. Per-file table and per-row details: `tests/corpus/baseline-2026-09-18.md`.

Defect candidates, each with the evidence the scorer printed and the code most likely responsible (logged in `skills/portfolio-ops/incidents.md` 2026-09-18):

- **B1 Missing due dates are silently replaced by the term end date in the `.ics`.** Live upload of `FHS Course Outline 2000.pdf`: extractor returns `due=None` for all six rows, review page shows six "Add date" warnings, yet the download has six `DUE:` events at `20260430T235900`. `src/icalendar_gen.py:80` and `:92` (`fallback_date = term.end_date`). Blocks story 4.
- **B2 Due-date cells are not parsed.** 25 of 29 dated assessments come back with no date across KIN 2000 (table column "Due Date" with "Jan 16th"), Physiology 3120 ("Author: Mon, Oct. 27th by 11:59 PM" over four lines), CS 3340B ("Thursday, January 29" in a two-column table), CS 3342A and Classical Studies 1000 (inline "Assignment 1 (10%) -- due Oct. 9", "First test: 20% (12 November 2025)"). `src/assessment_extractor.py:492` `_extract_date` hands the raw cell to `dateparser.parse` with no term/year context and returns `None` on cells that carry a weekday, ordinal, or time; the legacy `src/pdf_extractor.py:2382` `_parse_date_from_text` hard-codes year 2025/2026 (ECE 2240A "Nov.29th" became 2026-11-29). Blocks story 3.
- **B3 Term window is guessed, never read.** `src/pdf_extractor.py:258` `extract_term`: the date-range match is discarded (`pass`), Fall is hard-coded to Sept 1-Dec 15 and Winter to Jan 8-Apr 30, and when no "Fall/Winter YYYY" string is found the term becomes `Unknown` with `date.today()` for both dates (Classical Studies 1000, CS 3342A, Math 1228, HS 2800 all got 2026-09-18). Outlines print "Classes Begin / Classes End" tables (KIN 2000, Physiology 3120, CS 3340B) that are ignored. Consequence: `RRULE UNTIL` runs into the exam period. Blocks stories 1 and 2.
- **B4 Slots: duplicates, wrong type, dotted times.** KIN 2000's single Thursday lecture appears as both a lecture and a lab; ECE 2240A's tutorial ("Friday 12.30-1.30 pm UCC-56") is typed lab; there is no tutorial type in `SectionOption`; Biochem 3381A "MWF 12:30 - 1:20 pm" and "W 5:30 - 6:20 pm" and CS 3340B "Tuesday 2:30-3:30pm, Thursday 2:30-4:30pm" produce no slots (CS 3340B gets five wrong ones); the `.ics` summary is `Lecture -` (`src/icalendar_gen.py:154` uses `section_id`, empty). Blocks story 2.
- **B5 Spurious and dirty assessments.** HS 2800's weekly Reading column yields six "assessments" (`Jacobsen 2021: C.1 TBA`, `On OWL Brightspace`); Math 1228 yields an instructor's name and "Bonus*"; Biochem yields "6 x" (2.5 %) and titles like `I. Quizzes (` / `* Final Written Report: Wed. December 8th. (`; KIN 2000 keeps footnote digits (`Tracker 11`, `Plan3`, `Exam4`); CS 3342A titles end in ` (`. `AssessmentCandidateGenerator._from_tables` accepts any table with a %-like column; title cleaning does not strip roman numerals, bullets, footnote superscripts or parenthesis tails. Blocks stories 3 and 6.
- **B6 Course code from the wrong tokens.** `ROME 2025` (Classical Studies 1000), `MC 113` (Math 1228, a room), `MC 110` (CS 3340B, already in incidents.md), `None` for Biochem 3381A / Physiology 3120 / CS 3342A (image page). `src/course_extractor.py` ranks any `WORD dddd` pair by font size. Blocks story 1.
- **B7 Honest-failure gaps.** CS 3342A page 1 is an image: the app shows a review page with no code, no term and no slots and never says the first page had no text. Landing page promises DOCX/TXT. The five edge files in `~/projects/plato-corpus/edge/` have not been run through the live site yet (auditor: do this first).

Known limitations that are NOT defects: lab/tutorial slots that exist only on draftmyschedule (ECE 2240A labs, Math 1228 tutorials with blank cells) cannot be extracted; the app must say so and offer the manual "Add Section" path. "Best 3 of 4" and bonus rows legitimately make row sums ≠ 100 (ground truth lists the acceptable totals). Registrar-scheduled finals never have a date in the outline.

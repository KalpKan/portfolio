# Resume the app-hardening pipeline (Phase 5 closed loop)

_Paused 2026-09-18 17:51 EDT by Kalp's instruction (usage reset). State below is exact._

## State at pause (run 1, wf_b18077e2-674)
| Project | Spec | Test r1 | Fix r1 | Open work |
|---|---|---|---|---|
| plato | done (`docs/reports/plato-spec.md`, corpus + ground truth) | done, verdict **not-yet** (report was being written; if `docs/reports/plato.md` is missing, re-run the test stage: the spec + corpus are committed) | not started | extraction recall/precision below bar |
| hoops | done (`docs/reports/hoops-spec.md`) | done: **PARTIALLY WORKING**, 10 defects in `docs/reports/hoops.md` | **interrupted mid-way** (check `~/projects/basketball` git log for partial commits and the plan checkboxes) | remaining defects D1–D10 |
| microtubules | done (`docs/reports/microtubules-spec.md`) | done (report may not have been committed; re-run if `docs/reports/microtubules.md` is missing) | not started | per report |

Resume with `buildModel: "opus", checkModel: "opus"` (Kalp: normal setup from now on, be economical). Because the fix stages were in flight, the resumed run re-executes them; the FIX prompt already tells the agent to read the repo state first.

## What this pipeline is
Per project: SPEC agent → (TEST+CRITIQUE → FIX) × up to N rounds → CODE REVIEW → independent VERIFY. Script: `portfolio-harden` (Workflow tool). Every stage commits its artifacts to this repo, so state survives a stop:

| Artifact | Path |
|---|---|
| Spec + consumer-grade bar + test assets | `docs/reports/<slug>-spec.md` |
| Latest defect report (section 11 format) | `docs/reports/<slug>.md` |
| Fixes | commits in the project repo (`~/projects/<slug>`), deployed to `https://<slug>.kalpkan.com` |
| Incidents (root cause + prevention per defect) | `skills/portfolio-ops/incidents.md` |

## Run 1 (started 2026-09-18 16:15 EDT)
- Run id: `wf_b18077e2-674`; task id `w2dp8einj`
- Script: `/Users/kalp/.claude/projects/-Users-kalp-projects-portfolio/6a491b3c-d386-4c83-9fec-6077672a40f8/workflows/scripts/portfolio-harden-wf_b18077e2-674.js`
- Journal (per-agent return values): `/Users/kalp/.claude/projects/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/subagents/workflows/wf_b18077e2-674/journal.jsonl`
- Projects: plato (4 rounds), hoops (2), microtubules (2). Models: build=fable, check=opus.

## How to resume run 1 (same session)
```
Workflow({ scriptPath: "<script path above>", resumeFromRunId: "wf_b18077e2-674",
           args: <same args JSON as the original launch; stored in the script's sibling .args.json if present, else in STATUS.md T5.a> })
```
Completed stages return cached results instantly; the stage that was in flight re-runs. Set `buildModel`/`checkModel` in args to `"opus"` after the usage reset.

## How to resume in a NEW session (no workflow cache)
1. Read `docs/reports/<slug>.md` for each project: the "Defects" section is the work list; "Verdict" says whether it reached consumer grade.
2. Re-launch `portfolio-harden` with only the unfinished projects in `args.projects` (copy the project objects from `docs/hardening-args.json`), rounds = remaining rounds. The SPEC stage will find the existing spec and reuse it (tell it so in `focus`).
3. Second run (T5.b, not yet started): plantit, pushups, emotes — args prepared in `docs/hardening-args.json` under `run2`.

## Known-good invariants to check first when resuming
`skills/portfolio-ops/verification.md` (per-project rows) and `STATUS.md` spend tracker ($0 + domain).

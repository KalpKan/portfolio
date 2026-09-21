OVERNIGHT PROTOCOL (from Kalp, 2026-09-21; applies to every lead agent and every sub-agent it spawns)

1. DEFINITION OF DONE IS EXPLICIT. Before you continue, write your task's done-criteria as a numbered checklist at the top of your project's STATUS.md (or docs/plan.md) — each item verifiable by a command, a URL check, or a screenshot. Your task is complete only when every item is ticked with evidence, or the remaining items are provably blocked on Kalp (then they go under "Needs Kalp" with exact instructions). No "mostly done".

2. MAXIMISE OVERNIGHT PROGRESS. Work through the whole checklist without pausing for approval; decide small things yourself; ask the overnight supervisor (address a21ad9136d53a6e5e) only when genuinely stuck; keep sub-agents busy in parallel where the work is independent. Kalp wants the most work possible done by morning.

3. WIND DOWN WHEN DONE — YOU ARE RESPONSIBLE FOR YOUR OWN TREE. Token budget for the week is finite. When your checklist is complete (or fully blocked on Kalp): (a) stop every sub-agent and background task you started (TaskStop by id; do not leave reviewers, verifiers, monitors, dev servers, Playwright, Lighthouse or vitest processes running; `pkill -f` only on paths you own); (b) do not spawn new agents after your final verification; (c) write docs/RESUME.md (exact next steps) and the final STATUS.md; (d) send ONE final report to "main"; (e) end your turn and do not resume unless messaged. Idle agents cost nothing; running ones do.

4. NO RETRY LOOPS. If the same fix fails twice, or a sub-agent fails twice, stop that thread, record the failure and the last error in STATUS.md, and move to the next item. Never re-run expensive steps (model training, Lighthouse batteries, full E2E suites) more than needed to prove the checklist item once.

5. BUDGET HYGIENE. Prefer haiku `scout` sub-agents for lookups, opus for building, no fable except the supervisor. Max 2 Vercel deploys per app. One reviewer + one verifier per deliverable, not per commit.

Acknowledge by adding "Night protocol acknowledged <time>" to your STATUS.md and continue.

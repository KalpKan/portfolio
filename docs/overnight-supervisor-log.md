# Overnight supervisor log

Decisions handed to worker agents while Kalp slept. One entry per question: UTC timestamp, the asking agent's address, what it asked, what was decided and why. Nothing here spends money, deletes Kalp's data, touches his accounts, or makes a public claim about him; those go to `STATUS.md` "Needs Kalp" instead.

---

## 2026-09-21 — Overnight supervisor online

- **Time:** 2026-09-21 06:12 UTC
- **Grounding read:** `~/.claude/skills/portfolio-ops/{SKILL,architecture,runbooks}.md`, `docs/hosting-plan.md` "Decisions confirmed by Kalp", `docs/content/project-descriptions.md`, `docs/design/app-directions.md` (house rules + summary), MengTo `no-ai-design-slop` and `animation-systems`.
- **Standing rules applied to every answer:** $0 hosting (no upgrades, no card); real data over fake; the simpler tool; the spec or direction doc beats the worker's own preference; Kalp's own words on his pages; MengTo motion/design skills for UI; reversible over irreversible; money / deletions / accounts / public claims about Kalp are never authorised here and go to `STATUS.md` "Needs Kalp".

---

## 2026-09-21 06:20 UTC — Rule update: Kalp's overnight protocol adopted

- **From:** the orchestrator (main), relaying Kalp's night protocol (scratchpad `night-protocol.md`, 2026-09-21).
- **Effect on every ruling from here:** (1) every agent must hold an explicit, verifiable done-checklist in its STATUS.md; "mostly done" is not a state. (2) Prefer "record it and move on" over further iteration; the same fix or the same sub-agent failing twice ends that thread with the last error written to STATUS.md. (3) When an agent reports done, the answer includes: stop every sub-agent and background process you own (TaskStop, dev servers, Playwright, Lighthouse, vitest), spawn nothing new, write docs/RESUME.md and the final STATUS.md, send one report to main, end your turn. (4) Budget hygiene: haiku `scout` for lookups, opus for building, max 2 Vercel deploys per app, one reviewer and one verifier per deliverable. (5) Supervisor address for workers: `a21ad9136d53a6e5e`.

---

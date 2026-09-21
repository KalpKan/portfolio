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

## 2026-09-21 06:21 UTC — emotes redesign: Playwright vs existing puppeteer harness; CSS beam

- **From:** `a7ce614dc674e707a` (emotes redesigner, "Your own arena").
- **Asked:** (1) Brief says "Playwright + fake camera", but `scripts/e2e-camera.mjs` (puppeteer-core, fake device, committed .mjpeg, 1000/390) already is the detection gate. Keep it or port? (2) `beam-glow-states` is a React package; app is vanilla TS. Hand-write the behaviour in CSS?
- **Decision:** (1) Keep puppeteer-core and extend it to assert the redesigned HUD/arena DOM at 1440 and 390; no Playwright. The brief's intent is fake-camera e2e, not the vendor; a second automation dep re-validates nothing and costs CI time (simpler tool, night-protocol budget hygiene). One-line deviation note in STATUS.md. (2) Yes, CSS only, no React. Beam runs only while score is genuinely 0.35–0.5 (measured, never decorative); reduced-motion lands on the static gold border as a complete final state; one beam per viewport.
- **Reversible by:** a later Playwright port; assertions target the page's own DOM ids either way.

---

## 2026-09-21 06:59 UTC — KalpOS dark mode (T6.10): default appearance

- **From:** `af1d1317d7912d4e1` (KalpOS dark-mode worker, branch `kalpos-dark`).
- **Asked:** With nothing in localStorage, should `DEFAULT_APPEARANCE` be "auto" (follow prefers-color-scheme) or "light"?
- **Decision:** "light". The brief adds a capability; it does not change what visitors see. Kalp reviewed the light desk all week and has never seen the dark one, so switching the default for every dark-Mac visitor is an unreviewed public change to his site. Dark/Auto stay opt-in from a visible Appearance menu; STATUS.md gets a "Needs Kalp" line with a 1440 dark-desk screenshot and the reply "default auto" to flip it.
- **Reversible by:** the single `DEFAULT_APPEARANCE` constant in `lib/appearance.ts`.

---

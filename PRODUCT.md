# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: someone who has just met Kalp Kansara (a professor, lab PI, admissions reader, hackathon judge, recruiter) and opens the link from his email signature or CV to see what he has actually shipped. They are on a phone as often as a laptop, and give it under a minute.

Secondary: Kalp himself and his agents, who add a project by editing `projects.json`.

## Product Purpose
The hub is the one URL that lists every project Kalp has built: live web apps on their own subdomains, browser-ML demos, and hardware/iOS work presented as case-study pages. Success: a visitor lands, understands in one glance that these are real shipped things, and clicks through to one.

## Positioning
Every card is backed by a running deployment with a health endpoint the hub actually pings, so "live" is a measured fact, not a claim. Hardware and iOS work that cannot be linked is shown honestly as a case study, never as a fake app link. Kalp is a Western University student aiming to be a physician-scientist in neurotech; the site reads as his lab notebook of shipped work, not a corporate landing page.

## Operating Context
Registry-driven: `projects.json` (schema in `lib/projects.ts`) is the only content source. Apps expose `/api/health`; the hub checks it and turns a tile cyan only when the check returns `ok: true`. Deployed on Vercel Hobby with a $0 budget; served at `kalpkan.com` with one subdomain per app (`docs/hosting-plan.md` section 6). Since 2026-09-20 the hub is KalpOS (`DESIGN.md`, `docs/superpowers/specs/2026-09-20-kalpos-frontend-design.md`): a lock screen over a desk; the Projects folder is the registry, case studies open inside windows, `/projects/<slug>` deep-links to one.

## Capabilities and Constraints
- Next.js 16 App Router, TypeScript, Tailwind 4. No CMS, no database. Analytics is PostHog, cookieless, proxied through `/ingest` (`docs/analytics.md`).
- Must work on a phone (≤ 768 px the desk folds to one sheet with a bottom drawer), no horizontal scroll, `prefers-reduced-motion` respected. Black is the only dark surface (the lock screen); the desk has no dark mode by design.
- No payments, ads, or affiliate links. No secrets in the repo.
- Hero images are `null` in Phase 0; the design cannot depend on photography that does not exist yet.
- Statuses: live, demo, coming, archived. Types: app, showcase.

## Brand Commitments
Name: "Kalp Kansara". No logo, no brand palette, no existing visual identity. Tone from the brief: personal, honest, restrained, notebook-like.

## Evidence on Hand
- 12 real projects in `projects.json` with real repo links and one live health endpoint (promptflip). No testimonials, metrics, or photos exist yet; do not invent any.

## Product Principles
1. Registry is truth: the page renders what `projects.json` says and nothing more.
2. Measured over claimed: status comes from health checks where they exist.
3. Honest about what is not shipped: "coming" and "showcase" are first-class, not hidden.
4. Cheap to keep: no build-time services, no paid tiers, one JSON edit adds a project.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: someone who has just met Kalp Kansara (a professor, lab PI, admissions reader, hackathon judge, recruiter) and opens the link from his email signature or CV to see what he has actually shipped. They are on a phone as often as a laptop, and give it under a minute. [Inferred from the orchestrator brief; not confirmed by Kalp.]

Secondary: Kalp himself and his agents, who add a project by editing `projects.json`.

## Product Purpose
The hub is the one URL that lists every project Kalp has built: live web apps on their own subdomains, browser-ML demos, and hardware/iOS work presented as case-study pages. Success: a visitor lands, understands in one glance that these are real shipped things, and clicks through to one.

## Positioning
Every card is backed by a running deployment with a health endpoint the hub actually pings, so "live" is a measured fact, not a claim. Hardware and iOS work that cannot be linked is shown honestly as a case study, never as a fake app link. Kalp is a Western University student aiming to be a physician-scientist in neurotech; the site reads as his lab notebook of shipped work, not a corporate landing page. [Framing from the orchestrator brief.]

## Operating Context
Registry-driven: `projects.json` (schema in `lib/projects.ts`) is the only content source. Apps expose `/api/health`; the hub shows a green/grey dot from it. Deployed on Vercel Hobby with a $0 budget; later gets a custom apex domain with one subdomain per app (`docs/hosting-plan.md` section 6). Phase 0 ships hero + cards + footer only; case-study pages come in Phase 4.

## Capabilities and Constraints
- Next.js 16 App Router, TypeScript, Tailwind 4. No CMS, no database, no analytics yet (PostHog arrives in T0.5).
- Must work phone-first with 16px side gutters, no horizontal scroll, and correct dark mode from `prefers-color-scheme`.
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

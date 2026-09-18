---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Surface brief: app/page.tsx (hub home)

Scope: the hub home page, hero + project cards + footer. Visitor mode: Experience (the shipped work leads; chrome recedes).
Audience: someone who just met Kalp, on a phone as often as a laptop, under a minute. Job: see that these are real shipped things and click one.
Proof/content: 12 registry entries, one live health endpoint today. No photos, metrics, or testimonials exist; none are invented.
Constraints: phone-first, 16px gutters, no horizontal scroll, prefers-color-scheme dark, $0, no images required.

## Direction contract

seed: ad31fa30 (assigned, candidate 3 of 7, mode experience)

THESIS: The page is a microelectrode array channel map, the bench sheet a neuro lab prints after an impedance test: every project is one recording site, and "live" is a measured signal, not a marketing claim. It refuses the developer-portfolio arrangement of same-size icon cards under a headline and a gradient.

OWN-WORLD: Printout ground (cool paper white, near-black ink with a blue cast; in dark mode the sheet becomes the dark bench monitor with the same ink logic inverted). One accent, signal cobalt, spent only on sites that are actually returning signal. Hairline rules and a pad grid draw the array; site IDs and measurements set in a mono face; names and taglines in Bricolage Grotesque. State is a mark, never a hue: filled pad + trace = live signal, hollow dashed pad = coming (not yet implanted), pad with reference mark = case study (off-array), struck pad = archived.

STORY: "This person has a working array of shipped projects and he checks the signal on each." The visitor reads the array at a glance, then steps up to one site.

FIRST VIEWPORT: The array itself: Kalp's name and one line set inside the sheet header (session date, site count), then the pad map of all 12 sites, pads lighting as their health checks return. Below, the channel list: one ruled row per site with ID, mark, name, tagline, leads (tags), and the destination.

SIGNATURE INTERACTION: Hovering or focusing a channel row backlights its pad in the map, and vice versa; live pads carry a slowly drawn spike trace. Nothing slides; things brighten (raise from the glazier partition). Status is a mark (raise from the cutting bench).

RISK: A pad map with no photography can read as abstract decoration if the pad-to-row link is weak; the IDs must be visible in both places so it reads as a map, not a pattern.

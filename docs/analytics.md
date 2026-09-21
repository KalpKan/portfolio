# Analytics (PostHog) — the contract every app on kalpkan.com follows

_Written 2026-09-18 (T0.5). One PostHog project receives every visit, click and custom event from the hub and every subdomain, so Kalp can answer four questions from one dashboard: how many people visit, which sites, where they are from, and what they interact with._

## The project

| Item | Value |
|---|---|
| PostHog Cloud region | US (`https://us.posthog.com`, ingest `https://us.i.posthog.com`) |
| Organization | KalpKan (`01a0b5d7-1978-0000-284e-f302da034a29`) |
| Project | **Kalp portfolio**, id **`616829`** (renamed from the auto-created "Default project"; the free plan allows one project, so every app shares it) |
| Project API token (public by design; it ships in every page's JavaScript) | `phc_xCXynPYRpsuUVEsyWQ7NhQuCXbL6Lt4S7gPBDogPzNkT` |
| Plan | Free, no card, no subscription (`GET /api/billing/`: `has_active_subscription: false`, `stripe_customer_id: null`) |
| Dashboard (Kalp's bookmark) | https://us.posthog.com/project/616829/dashboard/2112106 |
| Web analytics (built-in, per host) | https://us.posthog.com/project/616829/web |
| Session replays | https://us.posthog.com/project/616829/replay/home |
| Project settings (replay, heatmaps, autocapture) | https://us.posthog.com/project/616829/settings/project |
| Billing evidence | `docs/images/posthog-billing-limits.png` |

### Insights on the "Kalp portfolio" dashboard

| Insight | What it shows | URL |
|---|---|---|
| Visitors by site | unique visitors per day, split by `$host` (`kalpkan.com`, `hoops.kalpkan.com`, `plato.kalpkan.com`, ...) | https://us.posthog.com/project/616829/insights/cQytKBLD |
| Visitors by country | world map of unique visitors by `$geoip_country_name` (PostHog derives it from the IP; the IP itself is not stored in event properties) | https://us.posthog.com/project/616829/insights/yLzNtpbM |
| Top demos by usage | bar chart of the core-action events across every app: `project_card_clicked` (hub rows), `case_study_repo_clicked` (hub case studies), `rep_counted` (pushups), `emote_fired` (emotes), `pdf_parsed` (plato), `plant_identified` (plantit), `image_analyzed` (microtubules), `session_viewed` (hoops). Updated 2026-09-19 (Phase 2–4 audit): the three missing apps were added and `coinflip_played` dropped (that app was deleted in T0.2 and never sent an event) | https://us.posthog.com/project/616829/insights/jKe2OFYN |

### Spend guardrail ($0, verified)

PostHog's free plan has **no payment method and no subscription**. On the billing page every product shows "Billing limit" equal to its "Free tier limit" (product analytics 1 M events, session replay 5 K recordings, feature flags 1 M, surveys 1.5 K, error tracking 100 K, ...): usage above the free allocation is dropped, nothing is charged. A custom `$0` limit is only offered *after* adding a credit card ("Add your credit card to remove usage limits ... Set billing limits as low as $0"), and the billing API rejects personal API keys (`403 This action does not support personal API key access`). Attaching a card is forbidden by the platform rules, so the free plan's hard cap is the guardrail, and it is stricter than a $0 limit on a paid plan (which would still require a card on file). Check it any time with the "Check PostHog billing" runbook.

## Settings and where they live

| Name | Value | Where |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | the `phc_` token above | Vercel, each Next.js project, Production + Preview, type **config** (the CLI refuses a `NEXT_PUBLIC_` token without `--type config`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `/ingest` (always; never the posthog.com host) | same |
| `POSTHOG_API_KEY` / `POSTHOG_HOST` | same token / `https://us.i.posthog.com` | non-Next apps (Plato's Flask variant) |
| `POSTHOG_PERSONAL_API_KEY` (`phx_`, all-access operator key) | never written down | `~/.config/portfolio-ops/secrets.env` only. Rotate to a project-scoped key after Phase 1 (runbook "Rotate the PostHog key") |

## Naming convention for custom events

- `snake_case`, past tense, `<object>_<verb>`: `project_card_clicked`, `rep_counted`, `emote_fired`, `pdf_parsed`, `plant_identified`, `coinflip_played`, `shot_ingested`.
- 2 to 4 events per app, only for the app's **core action** (the thing a visitor came to do). Autocapture already records every click, so do not add events for navigation.
- Properties are `snake_case` too and small: ids, enums, counts. Never free text a visitor typed, never an email.
- Reserved names (already on the "Top demos by usage" insight): `project_card_clicked` and `case_study_repo_clicked` (hub), `rep_counted` (pushups), `emote_fired` (emotes), `pdf_parsed` (plato), `plant_identified` (plantit), `image_analyzed` (microtubules), `session_viewed` (hoops). Use those exact names so the insight picks them up without editing; a new app's core event must be added to the insight in the same task (runbook "Add PostHog to an app", step 6).
- Hub desk (T6 KalpOS, 2026-09-20): `unlocked` (the lock screen was passed; since the 2026-09-20 fixes every plain visit locks, so every unlock sends it), `chime_played { at: "boot" }` (the startup chime sounded, once per boot; since the 2026-09-20 boot rework it plays inside the power-button gesture, a key, click or tap on the black "press any key to start" screen, or at the boot mark after a Restart, never at unlock: `at` is always `"boot"` now, and `"unlock"` values are pre-rework; nothing is sent when audio is blocked or muted), `window_opened { slug }` (`projects`, `about`, `contact`, `hobbies`, `reading`, `trash`, `music`, `terminal` or `case:<slug>`; the phone sheets send the same names. `reading` is new in T6.9, 2026-09-21: the READING widget and the phone row open that window, and no new event was added for them — `window_opened { slug: "reading" }` is the whole signal. Nothing is sent for the Hobbies list or the contact links beyond the autocaptured click), and `project_card_clicked { slug, type, kind }` is unchanged: a live tile (new tab) or a case-study tile (opens a window) in the Projects window or the phone sheet.
- Hub terminal (T6.1, 2026-09-20): `terminal_command { name }`, one per line entered at the zsh prompt of the Terminal window or phone sheet, carrying the command word only (`ls`, `cd`, `cat`, `open`, `claude`, an unknown word as typed); arguments are never sent. Lines typed inside the fake `claude` session are not tracked. Since T6.2 (2026-09-20) `reboot`, `restart`, `lock` and `logout` are ordinary command words here.
- Hub desk (T6.3, 2026-09-20): `trash_swat { icon }`, `icon` one of `projects`, `hobbies`, `about`, `contact`, `music`: a desk icon was dropped into the Trash (desk icon or dock tile) and swatted back out; sent at the drop, once per drop. Nothing is sent for ordinary icon moves.
- Hub KalpOS menu (T6.2, 2026-09-20): `menu_action { item }` with `item` one of `about`, `cleanup` (T6.3: Clean Up, ⌥⌘1, the icons back to their grid), `lock`, `restart`, `mute`: a row chosen in the KalpOS menu (menubar brand word, or ■ KalpOS on a phone), or its keyboard shortcut (⌃⌘Q → `lock`, ⌃⌘R → `restart`; ⌘L is the browser's address bar and is never intercepted, remapped 2026-09-20). `restart` is sent when the row is chosen, before the confirm sheet, so a cancelled restart still counts as one `restart`; a completed restart is followed by a second `chime_played { at }` and `unlocked`, since the boot replays. Nothing carries which chime state was toggled. **T6.10 (2026-09-21)** adds `appearance`, the one row that also carries a value: `menu_action { item: "appearance", value }` with `value` one of `light`, `dark`, `auto`, sent when a row of the Appearance submenu is chosen (opening the submenu sends nothing). The terminal's `theme` sends no event: it is already covered by `terminal_command { name: "theme" }`.
- Hub Music app (T6.7, 2026-09-20): `music_track_selected { index }`, the zero-based position in `SITE.playlist` of the song a visitor moved to, from a row click / Enter in the Music window (desk or phone sheet) or ⏮ / ⏭ (the index it landed on after wrapping). Nothing is sent for play / pause, for the fake loop advancing on its own, or for opening the window (`window_opened { slug: "music" }` covers that). No titles: the index is enough to see which of the three songs gets clicked.
- Hub Music app, Spotify links (T6.11, 2026-09-21): `music_opened_spotify { index }`, the zero-based position in `SITE.playlist` of the song a visitor opened on Spotify, from a double-click on its row or Enter on a row that is already the current track (desk or phone sheet). Fires once per open, only after the URL guard (`isSpotifyTrackUrl` in `MusicWindow.tsx`) accepts the link; nothing is sent for a track with no `spotifyUrl`.
- Hub Quick Look (T6.6, 2026-09-20): `quicklook_opened { slug }`, sent by the Projects window each time its Quick Look panel comes to show a project: opened with Space on a focused tile or the tile's ⓘ, or reached with the arrow keys while the panel is open (one event per project shown; closing sends nothing). The panel's Open / Read button sends the same `project_card_clicked { slug, type, kind }` as clicking the tile, so "Top demos by usage" needs no change.
- Hub case-study pages (T4.1, 2026-09-18): `case_study_repo_clicked { slug }`, fired by `components/showcase/RepoLink.tsx` when a visitor leaves `/projects/<slug>` for the source repository, which is the page's one core action. Page views of `/projects/<slug>` are ordinary `$pageview`s (filter by `$pathname`); scrolling, gallery and carousel interaction are left to autocapture, per the rule above.

## How every app is wired (the contract)

1. **First-party proxy.** The browser talks to `/ingest/*` on the app's own origin; the app forwards to PostHog. Ad blockers do not see `posthog.com`, so the numbers are not 30-50 % low.
2. **Cookieless.** `persistence: "memory"`: nothing stored in the browser, no cookie banner needed. Each page load is a new anonymous person; that is fine for a portfolio.
3. **Autocapture on, pageviews on, session replay on with every input masked** (`maskAllInputs: true`, also enforced project-wide in PostHog settings).
4. **2 to 4 custom events** for the core action, sent with `send_instantly: true, transport: "sendBeacon"` so an event fired by a click that navigates away is not lost with the page.
5. **Works with the key unset.** Local dev or a fork without `NEXT_PUBLIC_POSTHOG_KEY` runs with analytics silently off.

## How to add PostHog to a new app (Next.js, copy-paste)

```bash
npm i posthog-js
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
};
export default nextConfig;
```

`lib/posthog.ts` (copy the hub's file verbatim: `~/projects/portfolio/lib/posthog.ts`), then `components/PostHogProvider.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { initPostHog(); }, []);
  return <>{children}</>;
}
```

Wrap `{children}` in `app/layout.tsx` with `<PostHogProvider>`. Fire the core action from the component that performs it:

```ts
import { capture } from "@/lib/posthog";
capture("rep_counted", { count: 12 });
```

Set the two env vars on Vercel (production and preview), then redeploy; `NEXT_PUBLIC_*` is baked in at build time:

```bash
printf '%s' "<phc_ token from this doc>" | npx vercel env add NEXT_PUBLIC_POSTHOG_KEY production --type config --scope kks-projects-2edcb11a --yes
printf '%s' "/ingest" | npx vercel env add NEXT_PUBLIC_POSTHOG_HOST production --scope kks-projects-2edcb11a --yes
# repeat both with "preview", then: npx vercel deploy --prod --yes --scope kks-projects-2edcb11a
```

Add the names to the app's `.env.example` and to `skills/portfolio-ops/settings-map.md`. **Static apps (no Next.js):** use the PostHog HTML snippet with `api_host: '/ingest'` and add the two rewrites to `vercel.json` (`"rewrites": [{"source":"/ingest/static/:path*","destination":"https://us-assets.i.posthog.com/static/:path*"},{"source":"/ingest/:path*","destination":"https://us.i.posthog.com/:path*"}]`). **Flask:** see runbook "Deploy a Python app to Vercel", step 6.

## Verified (2026-09-18, T0.5)

Method: opened `https://kalpkan.com` in Chrome (claude-in-chrome) and clicked a project row. In the page, `performance.getEntriesByType('resource')` showed every PostHog request on the hub's own origin (`https://kalpkan.com/ingest/array/<token>/config.js`, `/ingest/static/1.434.2/posthog-recorder.js`, `/ingest/s/` for replay, `/ingest/i/v0/e/` for events: one `sendBeacon` at the click, then the `fetch` batch), **zero requests to any third-party host**, `document.cookie` empty and no `ph_*` localStorage key. Ingestion lag was 3 to 5 minutes. Then `GET /api/projects/616829/events/?event=<name>` (personal key in the header, never in the URL) returned, trimmed to the interesting properties:

```json
[
  {
    "event": "$pageview",
    "timestamp": "2026-09-18T19:53:03.744000+00:00",
    "distinct_id": "01a0b611...",
    "properties": {
      "$host": "kalpkan.com",
      "$current_url": "https://kalpkan.com/?v=focused",
      "$pathname": "/",
      "$lib": "web",
      "$lib_version": "1.434.2",
      "$geoip_country_name": "Canada",
      "$geoip_city_name": "London",
      "$browser": "Chrome",
      "$os": "Mac OS X",
      "$device_type": "Desktop"
    }
  },
  {
    "event": "project_card_clicked",
    "timestamp": "2026-09-18T19:47:45.238000+00:00",
    "distinct_id": "01a0b60f...",
    "properties": {
      "$host": "kalpkan.com",
      "$current_url": "https://kalpkan.com/?v=beacon2",
      "$pathname": "/",
      "$lib": "web",
      "$lib_version": "1.434.2",
      "$geoip_country_name": "Canada",
      "$geoip_city_name": "London",
      "$browser": "Chrome",
      "$os": "Mac OS X",
      "$device_type": "Desktop",
      "slug": "basketball",
      "type": "app"
    }
  }
]
```

`$host` is the hub host, the country comes from PostHog's GeoIP, and the click carries `slug` and `type`.

Two things learned while verifying, both recorded in `skills/portfolio-ops/incidents.md`:

1. The first deployment lost the click event: the row click navigated away before posthog-js flushed its 3 s batch. `capture()` now sends with `send_instantly` + `sendBeacon`, and the excerpt above is from the fixed build. Re-checked after the hub started booting posthog-js lazily after `load` (commit `e905bb0`, `lib/track.ts`): a click on the live build still produced an immediate beacon to `/ingest/i/v0/e/`.
2. posthog-js only captures `$pageview` once the document is **visible**. The automation tab was hidden behind other agents' tabs (`document.visibilityState === "hidden"`), so `$pageleave` and `$autocapture` arrived but no `$pageview` did. For the `$pageview` row above, visibility was simulated in that tab (`visibilityState` overridden to `visible` and a `visibilitychange` event dispatched), which runs the same code path a visitor triggers by switching to the tab; real visitors on a visible tab (phone visits by other agents the same day) produced pageviews with no help.

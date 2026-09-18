"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/projects";
import { countKinds, rowFor } from "@/lib/projects";
import { track } from "@/lib/track";
import { Arrow, SiteMark, healthWord, type Signal } from "./marks";

// The browser waits longer than the server (lib/health.ts, 3 s) so a slow
// upstream still reports "down" rather than the fetch being cut off mid-check.
const HEALTH_TIMEOUT_MS = 8000;

const TRACE = "M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18";

const LEGEND =
  "A filled pad is a site returning a live signal right now. Dashed means not yet deployed. A triangle marks a reference site: hardware or iOS work documented here rather than hosted.";

function siteId(i: number): string {
  return String(i + 1).padStart(2, "0");
}

function hasHealth(p: Project): boolean {
  return p.type === "app" && !!p.healthUrl;
}

function initialSignals(projects: Project[]): Record<string, Signal> {
  const out: Record<string, Signal> = {};
  for (const p of projects) out[p.slug] = hasHealth(p) ? "checking" : "none";
  return out;
}

function countLine(projects: Project[]): string {
  const c = countKinds(projects);
  const parts = [
    `${c.live} live`,
    c.archived ? `${c.archived} archived` : null,
    `${c.coming} coming`,
    `${c.caseStudies} case ${c.caseStudies === 1 ? "study" : "studies"}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

/**
 * The array: a pad map of every site plus one ruled row per site.
 * Hovering or focusing either side backlights the other. Health checks run
 * once on mount, silently; a failure is just "no signal".
 *
 * Below lg the map is a 12-wide strip (compact 24-32px pads on phones, capped
 * at 48px pads on tablets) so the first project row is visible without
 * scrolling; at lg it becomes the 4-column sticky map beside the list.
 */
export default function Board({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [signals, setSignals] = useState<Record<string, Signal>>(() =>
    initialSignals(projects),
  );

  useEffect(() => {
    const controllers: AbortController[] = [];
    for (const p of projects) {
      if (!hasHealth(p)) continue;
      const c = new AbortController();
      controllers.push(c);
      const timer = setTimeout(() => c.abort(), HEALTH_TIMEOUT_MS);
      fetch(`/api/status/${p.slug}`, { signal: c.signal })
        .then((r) => (r.ok ? r.json() : { ok: false }))
        .then((body: { ok?: unknown }) =>
          setSignals((s) => ({ ...s, [p.slug]: body.ok === true ? "ok" : "down" })),
        )
        .catch(() => setSignals((s) => ({ ...s, [p.slug]: "down" })))
        .finally(() => clearTimeout(timer));
    }
    return () => controllers.forEach((c) => c.abort());
  }, [projects]);

  const rows = projects.map((p) => rowFor(p));

  return (
    <div className="grid gap-8 md:gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
      {/* Pad map */}
      <section
        aria-label="Site map"
        className="sm:max-w-[37rem] lg:sticky lg:top-6 lg:max-w-none lg:self-start"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 tabular lg:flex-col lg:items-start">
          <span>Array</span>
          <span>{countLine(projects)}</span>
        </div>
        <ol
          className="mt-3 grid grid-cols-12 gap-px bg-rule-soft p-px lg:grid-cols-4"
          aria-label="Pads"
          aria-describedby="array-legend"
        >
          {projects.map((p, i) => {
            const isActive = active === p.slug;
            const sig = signals[p.slug];
            const row = rows[i];
            const lit = row.kind === "live" && sig === "ok";
            return (
              <li key={p.slug} className="bg-sheet">
                <a
                  href={`#site-${p.slug}`}
                  onMouseEnter={() => setActive(p.slug)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(p.slug)}
                  onBlur={() => setActive(null)}
                  aria-label={`Site ${siteId(i)}: ${p.name}`}
                  className={[
                    "group relative flex aspect-square flex-col justify-between p-1 transition-colors duration-300 sm:p-2",
                    lit
                      ? "bg-signal text-signal-ink"
                      : isActive
                        ? "bg-signal-soft text-ink"
                        : "bg-pad text-ink",
                  ].join(" ")}
                >
                  <span className="font-mono text-[10px] leading-none tabular sm:text-[11px]">
                    {siteId(i)}
                  </span>
                  {lit ? (
                    <svg
                      viewBox="0 0 64 24"
                      preserveAspectRatio="xMaxYMax meet"
                      className="h-2 w-full sm:h-3 lg:h-6"
                      aria-hidden
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    >
                      <path className="trace" d={TRACE} />
                    </svg>
                  ) : (
                    <span className="flex justify-end">
                      <SiteMark kind={row.kind} signal={sig} className="size-2 sm:size-3" />
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
        {/* One caption line on phones; the full legend from sm, and always for assistive tech. */}
        <p
          aria-hidden
          title={LEGEND}
          className="mt-3 truncate text-[12px] leading-relaxed text-ink-3 sm:hidden"
        >
          filled = live signal · dashed = coming · triangle = case study
        </p>
        <p
          id="array-legend"
          className="mt-3 hidden max-w-[38ch] text-[12px] leading-relaxed text-ink-3 sm:block"
        >
          {LEGEND}
        </p>
      </section>

      {/* Channel list */}
      <section aria-label="Projects">
        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-baseline border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 tabular">
          <span>Site</span>
          <span>Project</span>
          <span className="text-right">Go</span>
        </div>
        <ol className="divide-y divide-rule-soft">
          {projects.map((p, i) => {
            const isActive = active === p.slug;
            const sig = signals[p.slug];
            const row = rows[i];
            const health = healthWord(hasHealth(p), sig);
            const linkProps = {
              onFocus: () => setActive(p.slug),
              onBlur: () => setActive(null),
              onClick: () =>
                track("project_card_clicked", {
                  slug: p.slug,
                  type: p.type,
                  kind: row.kind,
                }),
              className:
                "after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none",
            };
            return (
              <li
                key={p.slug}
                id={`site-${p.slug}`}
                data-kind={row.kind}
                onMouseEnter={() => setActive(p.slug)}
                onMouseLeave={() => setActive(null)}
                className={[
                  "relative -mx-3 grid scroll-mt-6 grid-cols-[3.25rem_minmax(0,1fr)_auto] gap-x-3 px-3 py-4 transition-colors duration-300 md:py-5",
                  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[-2px] has-[a:focus-visible]:outline-signal",
                  isActive ? "bg-sheet-raised shadow-[inset_2px_0_0_0_var(--signal)]" : "",
                ].join(" ")}
              >
                <div className="flex flex-col gap-2 pt-1 font-mono text-[12px] leading-none text-ink-2 tabular">
                  <span>{siteId(i)}</span>
                  <SiteMark kind={row.kind} signal={sig} size={14} />
                </div>

                <div className="min-w-0">
                  <h2 className="display text-[1.25rem] leading-tight md:text-[1.5rem]">
                    {row.href === null ? (
                      p.name
                    ) : row.external ? (
                      <a href={row.href} target="_blank" rel="noreferrer" {...linkProps}>
                        {p.name}
                      </a>
                    ) : (
                      <Link href={row.href} {...linkProps}>
                        {p.name}
                      </Link>
                    )}
                  </h2>
                  <p className="mt-1 max-w-[60ch] text-[0.95rem] leading-snug text-ink-2">
                    {p.tagline}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px] text-ink-3 tabular">
                    <span className="text-ink-2">{row.statusWord}</span>
                    {health && (
                      <>
                        <span aria-hidden>·</span>
                        <span className={sig === "ok" ? "text-signal" : ""}>{health}</span>
                      </>
                    )}
                    {p.tags.map((t) => (
                      <span key={t} className="before:mr-2 before:content-['·']">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 pt-1 font-mono text-[12px] leading-none text-ink-2 tabular">
                  {row.verb ? (
                    <span aria-hidden className="inline-flex items-center gap-1">
                      {row.verb}
                      <Arrow />
                    </span>
                  ) : (
                    <span aria-hidden className="text-ink-3">
                      —
                    </span>
                  )}
                  {row.repoLink && (
                    <a
                      href={row.repoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="relative z-10 -mx-2 -mt-2 -mb-5 inline-flex min-h-10 items-center px-2 pt-2 pb-5 text-ink-3 hover:text-ink hover:underline"
                    >
                      repo
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

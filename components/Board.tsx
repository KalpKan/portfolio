"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/projects";
import { projectHref } from "@/lib/projects";
import {
  Arrow,
  SiteMark,
  destinationWord,
  signalWord,
  statusWord,
  type Signal,
} from "./marks";

const HEALTH_TIMEOUT_MS = 3000;

function siteId(i: number): string {
  return String(i + 1).padStart(2, "0");
}

function initialSignals(projects: Project[]): Record<string, Signal> {
  const out: Record<string, Signal> = {};
  for (const p of projects) {
    out[p.slug] = p.type === "app" && p.healthUrl ? "checking" : "none";
  }
  return out;
}

/**
 * The array: a pad map of every site plus one ruled row per site.
 * Hovering or focusing either side backlights the other. Health checks run
 * once on mount, silently; a failure is just "no signal".
 */
export default function Board({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [signals, setSignals] = useState<Record<string, Signal>>(() =>
    initialSignals(projects),
  );

  useEffect(() => {
    const controllers: AbortController[] = [];
    for (const p of projects) {
      if (p.type !== "app" || !p.healthUrl) continue;
      const c = new AbortController();
      controllers.push(c);
      const timer = setTimeout(() => c.abort(), HEALTH_TIMEOUT_MS);
      fetch(`/api/status/${p.slug}`, { signal: c.signal })
        .then((r) => (r.ok ? r.json() : { ok: false }))
        .then((body: { ok?: boolean }) =>
          setSignals((s) => ({ ...s, [p.slug]: body.ok ? "ok" : "down" })),
        )
        .catch(() => setSignals((s) => ({ ...s, [p.slug]: "down" })))
        .finally(() => clearTimeout(timer));
    }
    return () => controllers.forEach((c) => c.abort());
  }, [projects]);

  // Measured, not claimed: the count is sites currently returning a signal.
  const checking = Object.values(signals).some((s) => s === "checking");
  const litCount = Object.values(signals).filter((s) => s === "ok").length;

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
      {/* Pad map */}
      <section
        aria-label="Site map"
        className="lg:sticky lg:top-6 lg:self-start"
      >
        <div className="flex items-baseline justify-between border-b border-rule pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 tabular">
          <span>Array</span>
          <span>
            {projects.length} sites ·{" "}
            {checking ? "checking" : `${litCount} live`}
          </span>
        </div>
        <ol
          className="mt-3 grid grid-cols-4 gap-px bg-rule-soft p-px"
          aria-label="Pads"
        >
          {projects.map((p, i) => {
            const isActive = active === p.slug;
            const sig = signals[p.slug];
            const lit = p.type === "app" && sig === "ok";
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
                    "group relative flex aspect-square flex-col justify-between p-2 transition-colors duration-300",
                    lit
                      ? "bg-signal text-signal-ink"
                      : isActive
                        ? "bg-signal-soft text-ink"
                        : "bg-pad text-ink",
                  ].join(" ")}
                >
                  <span className="font-mono text-[11px] leading-none tabular">
                    {siteId(i)}
                  </span>
                  {lit ? (
                    <svg
                      viewBox="0 0 64 24"
                      className="h-6 w-full"
                      aria-hidden
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    >
                      <path
                        className="trace"
                        d="M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18"
                      />
                    </svg>
                  ) : (
                    <span className="flex justify-end">
                      <SiteMark project={p} signal={sig} size={12} />
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 max-w-[38ch] text-[12px] leading-relaxed text-ink-3">
          A filled pad is a site returning a live signal right now. Dashed
          means not yet deployed. A triangle marks a reference site: hardware
          or iOS work documented here rather than hosted.
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
            const href = projectHref(p);
            const external = href.startsWith("http");
            const sigWord = signalWord(p, sig);
            return (
              <li
                key={p.slug}
                id={`site-${p.slug}`}
                onMouseEnter={() => setActive(p.slug)}
                onMouseLeave={() => setActive(null)}
                className={[
                  "relative -mx-3 grid scroll-mt-6 grid-cols-[3.25rem_minmax(0,1fr)_auto] gap-x-3 px-3 py-4 transition-colors duration-300 md:py-5",
                  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[-2px] has-[a:focus-visible]:outline-signal",
                  isActive ? "bg-sheet-raised shadow-[inset_2px_0_0_0_var(--signal)]" : "",
                ].join(" ")}
              >
                <div className="flex flex-col gap-2 pt-1 font-mono text-[11px] leading-none text-ink-2 tabular">
                  <span>{siteId(i)}</span>
                  <SiteMark project={p} signal={sig} size={14} />
                </div>

                <div className="min-w-0">
                  <h2 className="display text-[1.25rem] leading-tight md:text-[1.5rem]">
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      onFocus={() => setActive(p.slug)}
                      onBlur={() => setActive(null)}
                      className="after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
                    >
                      {p.name}
                    </a>
                  </h2>
                  <p className="mt-1 max-w-[60ch] text-[0.95rem] leading-snug text-ink-2">
                    {p.tagline}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-3 tabular">
                    <span className="text-ink-2">{statusWord(p)}</span>
                    {sigWord && (
                      <>
                        <span aria-hidden>·</span>
                        <span className={sig === "ok" ? "text-signal" : ""}>
                          {sigWord}
                        </span>
                      </>
                    )}
                    {p.tags.map((t) => (
                      <span key={t} className="before:mr-2 before:content-['·']">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 pt-1 font-mono text-[11px] text-ink-2 tabular">
                  <span aria-hidden className="inline-flex items-center gap-1">
                    {destinationWord(p)}
                    <Arrow />
                  </span>
                  {p.repo && p.repo !== href && (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="relative z-10 text-ink-3 hover:text-ink hover:underline"
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

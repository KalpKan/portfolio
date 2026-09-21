import type { CaseStudy as CaseStudyT } from "@/content/case-study";
import { isPlaceholder } from "@/content/case-study";
import { Diagram } from "./diagrams";
import { Gallery } from "./Gallery";
import { Figure, PlaceholderBlock } from "./Media";
import { RepoLink } from "./RepoLink";
import { ScreenCarousel } from "./ScreenCarousel";
import { VideoEmbed } from "./VideoEmbed";

/**
 * The case-study body (docs/hosting-plan.md §6 "Showcase pages"): hero,
 * one-paragraph problem, how it works with a diagram, photo gallery, app
 * screen carousel, video, tech list, repo link, status line.
 *
 * Since KalpOS it renders inside a desk window (components/kalpos/windows/
 * CaseStudyWindow.tsx) and on the phone as a full-height sheet, so it owns
 * no page chrome: no <main>, no back link, no footer. Sections stack with a
 * small uppercase label above each, in the desk's system type.
 */

function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-head`} className="border-t border-rule-soft pt-5">
      <h2 id={`${id}-head`} className="kos-label tabular">
        {label}
      </h2>
      <div className="mt-3 min-w-0">{children}</div>
    </section>
  );
}

function siteId(i: number): string {
  return String(i + 1).padStart(2, "0");
}

export default function CaseStudy({
  study,
  underConstruction = false,
}: {
  study: CaseStudyT;
  /** True when the registry still says "coming": the page is published as a work in progress. */
  underConstruction?: boolean;
}) {
  const hero = study.hero;
  return (
    <article className="kos-case">
      <header className="pb-6">
        <h1 className="display mt-2 text-[26px] leading-[1.1]">{study.title}</h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-snug text-ink-2">{study.lede}</p>
        {/* The meta line: status word, then the kicker facts. */}
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-3 tabular">
          <span className="text-ink-2">{underConstruction ? "under construction" : "case study"}</span>
          {study.kicker.split(" · ").map((t) => (
            <span key={t} className="before:mr-2 before:content-['·']">
              {t}
            </span>
          ))}
        </p>
      </header>

      <div className="overflow-hidden rounded-[10px]">
        {isPlaceholder(hero) ? (
          <PlaceholderBlock placeholder={hero} />
        ) : (
          <Figure item={hero} aspect="16/9" sizes="(min-width: 800px) 760px, 100vw" priority />
        )}
      </div>

      <div className="mt-8 flex flex-col gap-8">
        <Section id="problem" label="Problem">
          <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink">{study.problem}</p>
        </Section>

        <Section id="how" label="How it works">
          <p className="max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">{study.howItWorks.intro}</p>
          <div className="mt-5">
            <Diagram id={study.howItWorks.diagram} />
          </div>
          <ol className="mt-5 divide-y divide-rule-soft border-t border-rule-soft">
            {study.howItWorks.steps.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 py-3.5">
                <span className="pt-1 font-mono text-[11px] leading-none text-ink-2 tabular">{siteId(i)}</span>
                <div className="min-w-0">
                  <h3 className="display text-[15px] leading-tight">{s.title}</h3>
                  <p className="mt-1 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {study.gallery && (
          <Section id="photos" label="Photos">
            <Gallery gallery={study.gallery} />
          </Section>
        )}

        {study.screens && (
          <Section id="screens" label="App screens">
            <ScreenCarousel screens={study.screens} />
          </Section>
        )}

        {study.video && (
          <Section id="video" label="Video">
            <VideoEmbed video={study.video} />
          </Section>
        )}

        <Section id="tech" label="Built with">
          <ul className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px] text-ink-2 tabular">
            {study.tech.map((t, i) => (
              <li key={t} className={i ? "before:mr-2 before:content-['·'] before:text-ink-3" : ""}>
                {t}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="status" label="Status">
          <p className="max-w-[62ch] font-mono text-[11.5px] leading-relaxed text-ink-2">
            {study.status}
            {study.links?.map((l) => (
              <span key={l.href}>
                {" · "}
                <a href={l.href} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                  {l.label}
                </a>
              </span>
            ))}
          </p>
          {study.repo && (
            <p className="mt-4">
              <RepoLink slug={study.slug} href={study.repo} />
            </p>
          )}
        </Section>
      </div>
    </article>
  );
}

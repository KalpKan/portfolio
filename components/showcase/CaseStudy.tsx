import Link from "next/link";
import type { CaseStudy as CaseStudyT } from "@/content/case-study";
import { isPlaceholder } from "@/content/case-study";
import { Diagram } from "./diagrams";
import { Gallery } from "./Gallery";
import { Figure, PlaceholderBlock } from "./Media";
import { RepoLink } from "./RepoLink";
import { ScreenCarousel } from "./ScreenCarousel";
import { VideoEmbed } from "./VideoEmbed";

/**
 * The case-study page body (docs/hosting-plan.md §6 "Showcase pages"):
 * hero, one-paragraph problem, how it works with a diagram, photo gallery,
 * app-screen carousel, video, tech list, repo link, status line.
 *
 * Layout mirrors the hub board: below lg the sections stack; at lg each
 * section is a two-column row, its mono label in the 17rem column the pad
 * map uses on the home page, content in the rest.
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
    <section
      aria-labelledby={`${id}-head`}
      className="grid gap-4 border-t border-rule-soft pt-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14 lg:pt-8"
    >
      <h2
        id={`${id}-head`}
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 tabular lg:pt-1"
      >
        {label}
      </h2>
      <div className="min-w-0">{children}</div>
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
    <main className="mx-auto w-full max-w-[72rem] flex-1 px-4 pb-16 pt-10 md:px-8 md:pt-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
        <Link href="/" className="-my-3 inline-flex min-h-10 items-center hover:text-ink hover:underline">
          &larr; back to the array
        </Link>
      </p>

      <header className="border-b border-rule pb-8 md:pb-10">
        <h1 className="display mt-6 text-[2.25rem] leading-[0.98] md:text-[3.5rem]">
          {study.title}
        </h1>
        <p className="mt-4 max-w-[52ch] text-[1.125rem] leading-snug text-ink-2 md:text-[1.375rem]">
          {study.lede}
        </p>
        {/* The same meta line a channel row carries on the hub: status word, then the kicker facts. */}
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px] text-ink-3 tabular">
          <span className="text-ink-2">{underConstruction ? "under construction" : "case study"}</span>
          {study.kicker.split(" · ").map((t) => (
            <span key={t} className="before:mr-2 before:content-['·']">
              {t}
            </span>
          ))}
        </p>
      </header>

      <div className="pt-8 md:pt-10">
        {isPlaceholder(hero) ? (
          <PlaceholderBlock placeholder={hero} />
        ) : (
          <Figure
            item={hero}
            aspect="16/9"
            sizes="(min-width: 1152px) 72rem, 100vw"
            priority
          />
        )}
      </div>

      <div className="mt-10 flex flex-col gap-10 md:mt-12 md:gap-12">
        <Section id="problem" label="Problem">
          <p className="max-w-[60ch] text-[1.05rem] leading-relaxed text-ink">
            {study.problem}
          </p>
        </Section>

        <Section id="how" label="How it works">
          <p className="max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-2">
            {study.howItWorks.intro}
          </p>
          <div className="mt-6">
            <Diagram id={study.howItWorks.diagram} />
          </div>
          <ol className="mt-6 divide-y divide-rule-soft border-t border-rule-soft">
            {study.howItWorks.steps.map((s, i) => (
              <li
                key={s.title}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 py-4"
              >
                <span className="pt-1 font-mono text-[12px] leading-none text-ink-2 tabular">
                  {siteId(i)}
                </span>
                <div className="min-w-0">
                  <h3 className="display text-[1.25rem] leading-tight">{s.title}</h3>
                  <p className="mt-1 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-2">
                    {s.body}
                  </p>
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
          <ul className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[12px] text-ink-2 tabular">
            {study.tech.map((t, i) => (
              <li key={t} className={i ? "before:mr-2 before:content-['·'] before:text-ink-3" : ""}>
                {t}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="status" label="Status">
          <p className="max-w-[60ch] font-mono text-[12px] leading-relaxed text-ink-2">
            {study.status}
          </p>
          {study.repo && (
            <p className="mt-4">
              <RepoLink slug={study.slug} href={study.repo} />
            </p>
          )}
        </Section>
      </div>

      <footer className="mt-16 border-t border-rule pt-6 text-[12px] leading-relaxed text-ink-3 md:mt-20">
        <p>
          <Link href="/" className="-my-3 inline-flex min-h-10 items-center hover:text-ink hover:underline">
            every project, on one sheet &rarr;
          </Link>
        </p>
      </footer>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudy from "@/components/showcase/CaseStudy";
import { getCaseStudy } from "@/content/projects";
import { isPlaceholder } from "@/content/case-study";
import { loadProjects } from "@/lib/projects";

// /projects/<slug>: the case-study page for a showcase entry. A showcase whose
// registry status is still "coming" (or has no content file) renders the
// short placeholder, so nothing unfinished is ever published; the hub row
// only links here once the status is "live" (lib/projects.ts rowFor()).

export function generateStaticParams() {
  return loadProjects().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

function publishable(slug: string) {
  const p = loadProjects().find((x) => x.slug === slug);
  if (!p) return null;
  const study = getCaseStudy(slug);
  const live = p.type === "showcase" && p.status !== "coming" && study && !study.draft;
  return { p, study: live ? study : undefined };
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = publishable(slug);
  if (!found) return { title: "Project" };
  const { p, study } = found;
  const title = `${study?.title ?? p.name} — Kalp Kansara`;
  const description = study?.lede ?? p.tagline;
  const heroSrc = study && !isPlaceholder(study.hero) ? study.hero.src : null;
  const image = typeof heroSrc === "string" ? heroSrc : heroSrc?.src;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: "article",
      url: `/projects/${slug}`,
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const found = publishable(slug);
  if (!found) notFound();
  const { p, study } = found;

  if (study) return <CaseStudy study={study} />;

  return (
    <main className="mx-auto w-full max-w-[72rem] flex-1 px-4 pb-16 pt-10 md:px-8 md:pt-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
        <Link href="/" className="hover:text-ink hover:underline">
          &larr; back to the array
        </Link>
      </p>
      <h1 className="display mt-6 text-[2.25rem] leading-[0.98] md:text-[3.5rem]">
        {p.name}
      </h1>
      <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-snug text-ink-2">
        {p.tagline}
      </p>
      <p className="mt-8 max-w-[52ch] border-t border-rule pt-6 text-[0.95rem] leading-relaxed text-ink-2">
        Case study coming soon. Photos, screenshots and a walkthrough of how it
        works will live here.
      </p>
      {p.repo && (
        <p className="mt-4 font-mono text-[12px]">
          <a
            href={p.repo}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            source repository &rarr;
          </a>
        </p>
      )}
    </main>
  );
}

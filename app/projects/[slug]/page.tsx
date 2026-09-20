import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KalpOS from "@/components/kalpos/KalpOS";
import { CasePlaceholder } from "@/components/kalpos/windows/CaseStudyBody";
import CaseStudy from "@/components/showcase/CaseStudy";
import { getCaseStudy } from "@/content/projects";
import { isPlaceholder } from "@/content/case-study";
import { loadProjects } from "@/lib/projects";

// /projects/<slug>: the deep link to a case study. It opens the desk with that
// window already open (no lock screen), with the case-study body rendered on
// the server so shared links, crawlers and OG cards keep working.
//
// Publishing rule (unchanged since T4.1): a showcase whose content file is a
// draft (or missing) renders the short placeholder, so nothing unfinished is
// ever published. A showcase whose registry status is still "coming" but
// whose content is not a draft is published as "under construction" (DIY EEG,
// 2026-09-18); the desk tile only opens it as a case study once the status is
// "live" (lib/tiles.ts), but the deep link always works.

export function generateStaticParams() {
  return loadProjects().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

function publishable(slug: string) {
  const p = loadProjects().find((x) => x.slug === slug);
  if (!p) return null;
  const study = getCaseStudy(slug);
  const publishable = p.type === "showcase" && study && !study.draft;
  return { p, study: publishable ? study : undefined, underConstruction: p.status === "coming" };
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
  const image = study && !isPlaceholder(study.hero) ? study.hero.src.src : undefined;
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
  const { p, study, underConstruction } = found;
  const projects = loadProjects();

  const body = study ? (
    <CaseStudy study={study} underConstruction={underConstruction} />
  ) : (
    <CasePlaceholder name={p.name} tagline={p.tagline} repo={p.repo} />
  );

  return <KalpOS projects={projects} skipLock initialWindow={`case:${slug}`} initialBody={body} />;
}

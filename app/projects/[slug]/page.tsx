import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadProjects } from "@/lib/projects";

// Case-study pages are built in Phase 4. Until then every showcase slug gets
// this placeholder so the hub never links to a 404.

export function generateStaticParams() {
  return loadProjects().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = loadProjects().find((x) => x.slug === slug);
  return { title: p ? `${p.name} — Kalp Kansara` : "Project" };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = loadProjects().find((x) => x.slug === slug);
  if (!p) notFound();

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

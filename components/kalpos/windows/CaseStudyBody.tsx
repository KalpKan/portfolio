"use client";

import CaseStudy from "@/components/showcase/CaseStudy";
import { getCaseStudy } from "@/content/projects";
import type { Tile } from "@/lib/tiles";

/**
 * The case study for a tile, resolved on the client and code-split behind
 * next/dynamic (CaseStudyWindow.tsx) so the desk's first load carries no
 * case-study content. The publishing rule is the same as the deep-link page
 * (app/projects/[slug]/page.tsx): a draft (or missing) content file renders
 * the short placeholder; a written one whose registry status is still
 * "coming" is published as under construction.
 */
export default function CaseStudyBody({ tile }: { tile: Tile }) {
  const study = getCaseStudy(tile.slug);
  if (!study || study.draft) return <CasePlaceholder name={tile.name} tagline={tile.tagline} repo={tile.repo} />;
  return <CaseStudy study={study} underConstruction={tile.kind === "coming"} />;
}

export function CasePlaceholder({ name, tagline, repo }: { name: string; tagline: string; repo: string | null }) {
  return (
    <div className="kos-body">
      <h2>{name}</h2>
      <p className="kos-muted">{tagline}</p>
      <p>Case study coming soon. Photos, screenshots and a walkthrough of how it works will live here.</p>
      {repo ? (
        <p>
          <a href={repo} target="_blank" rel="noreferrer">
            source repository →
          </a>
        </p>
      ) : null}
    </div>
  );
}

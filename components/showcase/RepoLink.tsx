"use client";

import { track } from "@/lib/track";

/**
 * The repo link on a case study. Leaving for the source is the page's core
 * action, so it fires `case_study_repo_clicked { slug }` (docs/analytics.md).
 * Everything else is covered by autocapture and $pageview.
 */
export function RepoLink({ slug, href }: { slug: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("case_study_repo_clicked", { slug })}
      className="-my-3 inline-flex min-h-10 items-center gap-1 font-mono text-[12px] text-teal hover:underline"
    >
      source repository
      <svg width={12} height={12} viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 8h11M9.5 4l4 4-4 4" />
      </svg>
    </a>
  );
}

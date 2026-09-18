"use client";

import { track } from "@/lib/track";
import { Arrow } from "@/components/marks";

/**
 * The repo link on a case-study page. Leaving for the source is the page's
 * core action, so it fires `case_study_repo_clicked { slug }` (docs/analytics.md).
 * Everything else on the page is covered by autocapture and $pageview.
 */
export function RepoLink({ slug, href }: { slug: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("case_study_repo_clicked", { slug })}
      className="-my-3 inline-flex min-h-10 items-center gap-1 font-mono text-[12px] text-ink hover:underline"
    >
      source repository
      <Arrow />
    </a>
  );
}

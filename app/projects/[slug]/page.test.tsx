import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectPage from "./page";
import { loadProjects } from "@/lib/projects";
import { getCaseStudy } from "@/content/projects";

// The publishing rule of app/projects/[slug]/page.tsx, pinned so the README
// ("How to add a case study") and the code cannot drift apart:
//   draft: true (or no content file)      → the short placeholder page
//   content not a draft, registry coming  → full page, meta says "under construction"
//   content not a draft, registry live    → full page, meta says "case study"

async function render(slug: string) {
  const el = await ProjectPage({ params: Promise.resolve({ slug }) } as never);
  return renderToStaticMarkup(el);
}

describe("case-study page publishing rule", () => {
  it("publishes DIY EEG (registry live, content flagged underConstruction) as under construction", async () => {
    const entry = loadProjects().find((p) => p.slug === "eeg");
    expect(entry?.status).toBe("live");
    expect(getCaseStudy("eeg")?.underConstruction).toBe(true);
    expect(getCaseStudy("eeg")?.draft).not.toBe(true);
    const html = await render("eeg");
    expect(html).toContain("under construction");
    expect(html).toContain('id="problem-head"');
    expect(html).not.toContain("Case study coming soon");
  });

  it("404s a removed slug like any unknown one", async () => {
    expect(loadProjects().some((p) => p.slug === "flashcards")).toBe(false);
    expect(getCaseStudy("flashcards")).toBeUndefined();
    await expect(render("flashcards")).rejects.toThrow();
  });

  it("labels a live, non-draft page as a case study", async () => {
    const entry = loadProjects().find((p) => p.slug === "unpark");
    expect(entry?.status).toBe("live");
    const html = await render("unpark");
    expect(html).toContain(">case study<");
    expect(html).not.toContain("under construction");
  });
});

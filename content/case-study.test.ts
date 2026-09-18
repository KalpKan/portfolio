import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import { loadProjects } from "@/lib/projects";
import { caseStudies } from "@/content/projects";

// The two halves of a case study live in different files: the registry row
// (projects.json) and the prose (content/projects/<slug>.ts). This test keeps
// them in lock-step so the hub can never link to a page with no content, and
// no content can sit unlinked because someone forgot the registry entry.

const dir = path.resolve(__dirname, "projects");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts")
  .map((f) => f.replace(/\.ts$/, ""));
const showcases = loadProjects().filter((p) => p.type === "showcase");

describe("showcase registry <-> content", () => {
  it("every showcase entry has a content file", () => {
    for (const p of showcases) {
      expect(files, `missing content/projects/${p.slug}.ts`).toContain(p.slug);
    }
  });

  it("every content file is a showcase entry", () => {
    const slugs = showcases.map((p) => p.slug);
    for (const f of files) {
      expect(slugs, `content/projects/${f}.ts has no registry entry`).toContain(f);
    }
  });

  it("the index exports exactly the files, keyed by slug", () => {
    expect(Object.keys(caseStudies).sort()).toEqual([...files].sort());
    for (const [k, v] of Object.entries(caseStudies)) expect(v.slug).toBe(k);
  });

  it("a live showcase is never a draft and has real prose", () => {
    for (const p of showcases) {
      const c = caseStudies[p.slug];
      if (p.status === "coming") continue;
      expect(c.draft, `${p.slug} is live in the registry but its content is a draft`).not.toBe(true);
      expect(c.problem.length, `${p.slug} problem paragraph`).toBeGreaterThan(200);
      expect(c.howItWorks.steps.length, `${p.slug} how-it-works steps`).toBeGreaterThanOrEqual(3);
      expect(c.tech.length, `${p.slug} tech list`).toBeGreaterThanOrEqual(2);
      expect(c.status.length, `${p.slug} status line`).toBeGreaterThan(0);
    }
  });

  it("content repo links agree with the registry", () => {
    for (const p of showcases) {
      expect(caseStudies[p.slug].repo).toBe(p.repo);
    }
  });

  it("never mentions the excluded DBS research (the DIY EEG project is included by Kalp)", () => {
    const text = JSON.stringify(caseStudies).toLowerCase();
    expect(text).not.toMatch(/transfer.function|deep brain stimulation|dbs_transfer/);
  });
});

import { describe, it, expect } from "vitest";
import { parseProjects } from "./projects";

describe("parseProjects", () => {
  it("accepts a valid registry", () => {
    const r = parseProjects({
      projects: [
        {
          slug: "a",
          name: "A",
          tagline: "t",
          type: "app",
          status: "live",
          url: "https://a.example",
          repo: "https://github.com/x/a",
          tags: [],
        },
      ],
    });
    expect(r[0].slug).toBe("a");
  });

  it("rejects an app without url", () => {
    expect(() =>
      parseProjects({
        projects: [
          {
            slug: "a",
            name: "A",
            tagline: "t",
            type: "app",
            status: "live",
            repo: "https://github.com/x/a",
            tags: [],
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts a showcase without url", () => {
    const r = parseProjects({
      projects: [
        {
          slug: "b",
          name: "B",
          tagline: "t",
          type: "showcase",
          status: "coming",
          repo: "https://github.com/x/b",
          tags: [],
        },
      ],
    });
    expect(r[0].type).toBe("showcase");
  });
});

describe("parseProjects extras", () => {
  const app = {
    slug: "a",
    name: "A",
    tagline: "t",
    type: "app",
    status: "live",
    url: "https://a.example",
    repo: "https://github.com/x/a",
    tags: [],
  };

  it("rejects duplicate slugs", () => {
    expect(() => parseProjects({ projects: [app, app] })).toThrow(/duplicate/);
  });

  it("rejects a showcase that carries a url", () => {
    expect(() =>
      parseProjects({
        projects: [{ ...app, type: "showcase", slug: "s" }],
      }),
    ).toThrow();
  });
});

describe("projectHref", () => {
  it("sends apps off-site and showcases to /projects/<slug>", async () => {
    const { projectHref } = await import("./projects");
    expect(
      projectHref({
        slug: "a",
        name: "A",
        tagline: "t",
        type: "app",
        status: "live",
        url: "https://a.example",
        repo: "https://github.com/x/a",
        tags: [],
      }),
    ).toBe("https://a.example");
    // A showcase whose page is written (status live) reads on the hub...
    expect(
      projectHref({
        slug: "b",
        name: "B",
        tagline: "t",
        type: "showcase",
        status: "live",
        repo: "https://github.com/x/b",
        tags: [],
      }),
    ).toBe("/projects/b");
    // ...while one still "coming" goes straight to its repo (L3 in the polish plan).
    expect(
      projectHref({
        slug: "b",
        name: "B",
        tagline: "t",
        type: "showcase",
        status: "coming",
        repo: "https://github.com/x/b",
        tags: [],
      }),
    ).toBe("https://github.com/x/b");
  });
});

describe("registry honesty rules", () => {
  it("accepts an app with status coming and no url yet", () => {
    const r = parseProjects({
      projects: [
        {
          slug: "c",
          name: "C",
          tagline: "t",
          type: "app",
          status: "coming",
          repo: "https://github.com/x/c",
          tags: [],
        },
      ],
    });
    expect(r[0].status).toBe("coming");
  });

  it("accepts repo: null for work that is not on GitHub", () => {
    const r = parseProjects({
      projects: [
        {
          slug: "d",
          name: "D",
          tagline: "t",
          type: "showcase",
          status: "coming",
          repo: null,
          tags: [],
        },
      ],
    });
    expect(r[0].repo).toBeNull();
  });
});

describe("loadProjects", () => {
  it("loads the committed projects.json without throwing", async () => {
    const { loadProjects } = await import("./projects");
    const all = loadProjects();
    expect(all.length).toBeGreaterThan(0);
    expect(all.find((p) => p.slug === "promptflip")?.status).toBe("live");
  });
});

describe("rowFor (one source of truth for kind, mark, status word, verb)", () => {
  const base = { name: "X", tagline: "t", tags: [] as string[] };

  it("a live app opens its url", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "a",
      type: "app",
      status: "live",
      url: "https://a.example",
      repo: "https://github.com/x/a",
    });
    expect(row).toMatchObject({
      kind: "live",
      statusWord: "live",
      verb: "open",
      href: "https://a.example",
      external: true,
    });
  });

  it("a demo app is kind live with status word demo", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "a",
      type: "app",
      status: "demo",
      url: "https://a.example",
      repo: null,
    });
    expect(row.kind).toBe("live");
    expect(row.statusWord).toBe("demo");
    expect(row.verb).toBe("open");
  });

  it("an archived app still opens its url, with the archived word", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "a",
      type: "app",
      status: "archived",
      url: "https://a.example",
      repo: null,
    });
    expect(row).toMatchObject({ kind: "archived", statusWord: "archived", verb: "open" });
  });

  it("a coming app never says open, even when it has a url; it goes to the repo", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "b",
      type: "app",
      status: "coming",
      url: "https://b.example",
      repo: "https://github.com/x/b",
    });
    expect(row).toMatchObject({
      kind: "coming",
      statusWord: "coming",
      verb: "repo",
      href: "https://github.com/x/b",
      external: true,
    });
  });

  it("a coming app with no repo has no destination at all", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "c",
      type: "app",
      status: "coming",
      repo: null,
    });
    expect(row.kind).toBe("coming");
    expect(row.verb).toBeNull();
    expect(row.href).toBeNull();
  });

  it("a showcase whose page is not written yet (status coming) links to its repo and says case study soon", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "d",
      type: "showcase",
      status: "coming",
      repo: "https://github.com/x/d",
    });
    expect(row).toMatchObject({
      kind: "showcase-soon",
      statusWord: "case study soon",
      verb: "repo",
      href: "https://github.com/x/d",
      external: true,
    });
  });

  it("a published showcase (status live) reads on the hub via an internal link", async () => {
    const { rowFor } = await import("./projects");
    const row = rowFor({
      ...base,
      slug: "e",
      type: "showcase",
      status: "live",
      repo: "https://github.com/x/e",
    });
    expect(row).toMatchObject({
      kind: "showcase",
      statusWord: "case study",
      verb: "read",
      href: "/projects/e",
      external: false,
    });
  });

  it("only shows a separate repo link when the row itself does not already go there", async () => {
    const { rowFor } = await import("./projects");
    const live = rowFor({
      ...base,
      slug: "a",
      type: "app",
      status: "live",
      url: "https://a.example",
      repo: "https://github.com/x/a",
    });
    expect(live.repoLink).toBe("https://github.com/x/a");
    const coming = rowFor({
      ...base,
      slug: "b",
      type: "app",
      status: "coming",
      repo: "https://github.com/x/b",
    });
    expect(coming.repoLink).toBeNull();
  });
});

describe("countKinds", () => {
  it("counts live, coming and case studies from the registry, summing to every site", async () => {
    const { countKinds, loadProjects } = await import("./projects");
    const all = loadProjects();
    const c = countKinds(all);
    expect(c.live + c.coming + c.caseStudies + c.archived).toBe(all.length);
    // Live apps grow as Phase 1+ tasks land (promptflip, plato, hoops, ...);
    // pin only the invariant, not today's count.
    expect(c.live).toBeGreaterThanOrEqual(1);
    expect(c.caseStudies).toBe(5);
  });
});

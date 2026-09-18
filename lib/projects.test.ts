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
    ).toBe("/projects/b");
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

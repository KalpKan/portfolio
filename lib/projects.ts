import { z } from "zod";
import registry from "../projects.json";

/**
 * Registry schema for projects.json.
 *
 * Two kinds of entries, discriminated on `type`:
 *  - "app": a deployed thing with its own URL (and usually a healthUrl).
 *  - "showcase": a case-study page on this hub at /projects/<slug>; no url/healthUrl.
 *
 * These names are an interface other tasks depend on. Do not rename them.
 */

const base = {
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  name: z.string().min(1),
  tagline: z.string().min(1),
  status: z.enum(["live", "demo", "coming", "archived"]),
  // null = not on GitHub (yet). Cards then show no repo link.
  repo: z.url().nullable(),
  tags: z.array(z.string()),
  hero: z.string().nullable().optional(),
};

const AppProject = z
  .object({
    ...base,
    type: z.literal("app"),
    // Required once the app is live/demo/archived; may be absent while "coming"
    // so we never publish a made-up URL.
    url: z.url().optional(),
    healthUrl: z.url().nullable().optional(),
  })
  .refine((p) => p.status === "coming" || typeof p.url === "string", {
    message: 'an app that is not "coming" must have a url',
    path: ["url"],
  });

const ShowcaseProject = z.object({
  ...base,
  type: z.literal("showcase"),
  // A "url"/"healthUrl" here is a mistake: showcases live on the hub.
  url: z.never().optional(),
  healthUrl: z.never().optional(),
});

export const ProjectSchema = z.discriminatedUnion("type", [
  AppProject,
  ShowcaseProject,
]);

export const RegistrySchema = z.object({
  projects: z.array(ProjectSchema),
});

export type Project = z.infer<typeof ProjectSchema>;
export type AppProjectT = z.infer<typeof AppProject>;
export type ShowcaseProjectT = z.infer<typeof ShowcaseProject>;
export type ProjectStatus = Project["status"];

/** Validate any value against the registry schema. Throws on invalid input. */
export function parseProjects(raw: unknown): Project[] {
  const result = RegistrySchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `projects.json is invalid:\n${z.prettifyError(result.error)}`,
    );
  }
  const slugs = new Set<string>();
  for (const p of result.data.projects) {
    if (slugs.has(p.slug)) {
      throw new Error(`projects.json is invalid: duplicate slug "${p.slug}"`);
    }
    slugs.add(p.slug);
  }
  return result.data.projects;
}

/** Load and validate the committed registry. Throws if projects.json is invalid. */
export function loadProjects(): Project[] {
  return parseProjects(registry);
}

/**
 * One source of truth for how a row renders. Every visible state word, mark
 * and destination verb is derived from this single `kind`, so a "coming"
 * entry can never show "open" and a case study that is not written yet can
 * never show "read".
 *
 *  - live          app, status live|demo, has url        -> mark by signal, "open" its url
 *  - archived      app, status archived, has url          -> struck mark, "open" its url
 *  - coming        app, status coming (url ignored)       -> dashed mark, "repo" if it has one
 *  - showcase-soon showcase whose page is not written yet -> triangle, "case study soon", "repo"
 *  - showcase      showcase with a written page (status live|demo|archived)
 *                                                         -> triangle, "case study", "read" on the hub
 */
export type Kind = "live" | "archived" | "coming" | "showcase" | "showcase-soon";

export type Verb = "open" | "repo" | "read";

export interface Row {
  kind: Kind;
  /** Lower-case mono word shown in the row's meta line. */
  statusWord: string;
  /** Destination word next to the arrow; null when there is nowhere to go yet. */
  verb: Verb | null;
  /** Where the whole row links; null when there is nowhere to go yet. */
  href: string | null;
  /** True when href leaves the hub (new tab, rel=noreferrer). */
  external: boolean;
  /** A secondary "repo" link, only when the row itself does not already go there. */
  repoLink: string | null;
}

export function projectKind(p: Project): Kind {
  if (p.type === "showcase") return p.status === "coming" ? "showcase-soon" : "showcase";
  if (p.status === "coming") return "coming";
  if (p.status === "archived") return "archived";
  return "live";
}

export function rowFor(p: Project): Row {
  const kind = projectKind(p);
  switch (kind) {
    case "live":
    case "archived": {
      // The schema guarantees a url once an app is not "coming".
      const href = p.type === "app" && p.url ? p.url : null;
      return {
        kind,
        statusWord: p.status,
        verb: href ? "open" : null,
        href,
        external: true,
        repoLink: p.repo && p.repo !== href ? p.repo : null,
      };
    }
    case "coming":
    case "showcase-soon":
      return {
        kind,
        statusWord: kind === "coming" ? "coming" : "case study soon",
        verb: p.repo ? "repo" : null,
        href: p.repo,
        external: true,
        repoLink: null,
      };
    case "showcase":
      return {
        kind,
        statusWord: "case study",
        verb: "read",
        href: `/projects/${p.slug}`,
        external: false,
        repoLink: p.repo,
      };
  }
}

/** Where a row links; kept for callers that only need the destination. */
export function projectHref(p: Project): string | null {
  return rowFor(p).href;
}

export interface KindCounts {
  live: number;
  archived: number;
  coming: number;
  caseStudies: number;
}

/** The count line above the array, computed from the registry, not claimed. */
export function countKinds(projects: Project[]): KindCounts {
  const c: KindCounts = { live: 0, archived: 0, coming: 0, caseStudies: 0 };
  for (const p of projects) {
    const k = projectKind(p);
    if (k === "live") c.live += 1;
    else if (k === "archived") c.archived += 1;
    else if (k === "coming") c.coming += 1;
    else c.caseStudies += 1;
  }
  return c;
}

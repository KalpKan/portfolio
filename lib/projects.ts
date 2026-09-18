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
 * Where a project card points. Apps go off-site to their deployment; showcases
 * stay on the hub; an app that is still "coming" falls back to its repo, or to
 * its future hub page if there is no repo either.
 */
export function projectHref(p: Project): string {
  if (p.type === "app" && p.url) return p.url;
  if (p.type === "app" && p.repo) return p.repo;
  return `/projects/${p.slug}`;
}

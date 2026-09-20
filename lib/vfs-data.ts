import { caseStudies } from "@/content/projects";
import { loadProjects } from "./projects";
import { SCRAPPED } from "./scrapped";
import { SITE } from "./site";
import { buildVfs, type VDir } from "./vfs";

/**
 * The terminal's filesystem built from the hub's real data. Kept apart from
 * lib/vfs.ts (pure, testable with fixtures) and loaded lazily by the Terminal
 * window so the case-study text stays out of the desk's first bundle.
 */
export function buildKalpVfs(): VDir {
  return buildVfs({ projects: loadProjects(), caseStudies, site: SITE, scrapped: SCRAPPED });
}

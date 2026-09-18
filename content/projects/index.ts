import type { CaseStudy } from "@/content/case-study";
import unpark from "./unpark";
import rcCar from "./rc-car";
import outline from "./outline";
import flashcards from "./flashcards";
import classmyschedule from "./classmyschedule";

/**
 * Every case study, keyed by registry slug. content/case-study.test.ts checks
 * that this map, the files in this folder and the `type: "showcase"` entries
 * in projects.json are the same set.
 *
 * To add one: create content/projects/<slug>.ts, import it here, add the
 * registry entry (README "How to add a case study").
 */
export const caseStudies: Record<string, CaseStudy> = {
  [unpark.slug]: unpark,
  [rcCar.slug]: rcCar,
  [outline.slug]: outline,
  [flashcards.slug]: flashcards,
  [classmyschedule.slug]: classmyschedule,
};

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies[slug];
}

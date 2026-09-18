import type { StaticImageData } from "next/image";

/**
 * The shape of one case study (a `type: "showcase"` project on the hub).
 *
 * One file per project under content/projects/<slug>.ts exports a CaseStudy;
 * content/projects/index.ts collects them by slug and the page at
 * app/projects/[slug]/page.tsx renders them through components/showcase.
 *
 * Media rules (docs/hosting-plan.md §6):
 *  - images are static imports from public/images/projects/<slug>/ (WebP,
 *    300 KB or less, checked by content/media.test.ts) rendered with next/image,
 *    never remote URLs (see MediaItem.src);
 *  - videos are never committed: a YouTube id (unlisted) or a hosted file URL;
 *  - anything Kalp has not supplied yet is a Placeholder, drawn at the size
 *    the real media will take and labelled so nobody mistakes it for content.
 */

export type MediaItem = {
  /**
   * A static import of a WebP under public/images/projects/<slug>/ (next/image
   * reads width and height from it). Never a URL string: the hub's
   * next.config.ts lists no images.remotePatterns, so next/image would throw
   * "hostname is not configured" at build time for a remote src. Allowing a
   * remote host is a separate next.config.ts change, not a content change.
   */
  src: StaticImageData;
  alt: string;
  caption?: string;
  /** CSS object-position for a crop, e.g. "50% 60%" to keep a subject low in a portrait frame. */
  position?: string;
  /**
   * "document": a white sheet (a KiCad schematic, a printed page). In the dark
   * theme it is inverted with its hues kept, so the page stays one dark surface
   * instead of showing a glaring white rectangle. Photos and renders leave it unset.
   */
  tone?: "document";
};

export type Aspect = "16/9" | "4/3" | "9/19.5" | "1/1" | "9/16";

export type Placeholder = {
  kind: "placeholder";
  /** Shown inside the block, e.g. "Photos coming: Kalp will add". */
  label: string;
  aspect: Aspect;
  /** How many blocks to draw (a gallery of three placeholders). */
  count?: number;
};

export type Gallery = { items: MediaItem[]; aspect?: Aspect } | Placeholder;

export type Video =
  | { kind: "youtube"; id: string; title: string }
  | { kind: "file"; url: string; poster?: MediaItem; title: string }
  | Placeholder;

export type DiagramId =
  | "unpark"
  | "rc-car"
  | "flashcards"
  | "yash-birthday-pcb"
  | "eeg";

export type Step = { title: string; body: string };

export type CaseStudy = {
  slug: string;
  /** Mono label above the title, e.g. "Hardware · iOS · 2025". */
  kicker: string;
  title: string;
  /** One sentence under the title. */
  lede: string;
  hero: MediaItem | Placeholder;
  /** One paragraph: who has the problem and why it matters. */
  problem: string;
  howItWorks: { intro: string; diagram: DiagramId; steps: Step[] };
  /** Photos of the thing (device, car, bench). null = the section is left out (nothing to photograph). */
  gallery: Gallery | null;
  /** App screens, drawn as a phone-shaped carousel. null = the project has no app screens. */
  screens: Gallery | null;
  /** null = no video is planned. */
  video: Video | null;
  tech: string[];
  /** Must equal the registry entry's repo (null hides the link). */
  repo: string | null;
  /** The status line, e.g. "Hardware prototype · App Store: not yet". */
  status: string;
  /** True while the page must not be published (registry stays "coming"). */
  draft?: boolean;
  /** What media Kalp should supply; mirrored in STATUS.md under H3. */
  wanted?: string[];
};

export function isPlaceholder(x: unknown): x is Placeholder {
  return typeof x === "object" && x !== null && (x as Placeholder).kind === "placeholder";
}

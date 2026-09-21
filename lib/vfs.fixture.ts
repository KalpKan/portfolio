import type { CaseStudy } from "@/content/case-study";
import type { Project } from "./projects";
import { buildVfs, type VDir } from "./vfs";

/** A small registry + one written and one draft case study for the vfs and shell tests. */
const projects: Project[] = [
  {
    slug: "promptflip",
    name: "promptflip",
    tagline: "Two prompts walk in, one gets answered.",
    type: "app",
    status: "live",
    url: "https://promptflip.kalpkan.com",
    repo: "https://github.com/KalpKan/promptflip",
    healthUrl: "https://promptflip.kalpkan.com/api/health",
    tags: ["Next.js"],
  },
  { slug: "unpark", name: "UnPark", tagline: "A wearable.", type: "showcase", status: "live", repo: "https://github.com/KalpKan/UnPark", tags: ["SwiftUI"] },
  { slug: "eeg", name: "DIY EEG", tagline: "Under construction.", type: "showcase", status: "coming", repo: null, tags: [] },
  { slug: "later", name: "Later", tagline: "Not yet.", type: "app", status: "coming", repo: null, tags: [] },
];

export const unpark: CaseStudy = {
  slug: "unpark",
  kicker: "Hardware · iOS · 2025",
  title: "UnPark, codename Antifreeze",
  lede: "A wearable accelerometer.",
  hero: { kind: "placeholder", label: "x", aspect: "16/9" },
  problem: "Freezing of gait.",
  howItWorks: { intro: "Three parts.", diagram: "unpark", steps: [{ title: "Sense", body: "Read the MPU6050." }, { title: "Decide", body: "Compare." }] },
  gallery: null,
  screens: null,
  video: null,
  tech: ["SwiftUI", "Python"],
  repo: "https://github.com/KalpKan/UnPark",
  status: "Hardware prototype.",
};
const eeg: CaseStudy = { ...unpark, slug: "eeg", title: "DIY EEG", draft: true, repo: null };

export function fixtureVfs(): VDir {
  return buildVfs({
    projects,
    caseStudies: { unpark, eeg },
    site: {
      name: "Kalp Kansara",
      note: "Open a folder.",
      tagline: "Western University.",
      musicTitle: "On repeat",
      playlist: [
        { title: "Suffer", artist: "Bex" },
        { title: "Choosin' Texas", artist: "Drake & Don Toliver", tag: "unreleased" },
      ],
      reading: [{ title: "The Molecule of More", authors: "Lieberman & Long", cover: "/images/reading/molecule-of-more.jpg", url: "https://openlibrary.org/isbn/9781946885111" }],
      hobbies: [
        { slug: "swimming", name: "Swimming", line: "I love swimming." },
        { slug: "tennis", name: "Tennis", line: "And playing tennis." },
      ],
      contact: { email: "k@example.com", github: "https://github.com/KalpKan", linkedin: "https://www.linkedin.com/in/kalp-kansara123/" },
    },
    scrapped: [{ name: "token-coinflip", line: "The first cut.", href: "https://github.com/KalpKan/token-coinflip" }],
    hostname: "kalpkan.com",
  });
}

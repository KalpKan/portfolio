/**
 * What Kalp does outside class (2026-11-18): the "Outside class" desk folder.
 * Entries are grouped under three headings (Building, Caring, Teaching), in
 * that order. Edit the text here and nowhere else: the window, the phone
 * sheet and the terminal's /outside/<slug>.md all read this file and render it
 * exactly as written. An empty `dates` (or role/where) renders nothing.
 */
export type OutsideEntry = {
  slug: string;
  title: string;
  role: string;
  where: string;
  dates: string;
  text: string;
  /** Which drawn mark leads the card (OutsideGlyph.tsx); missing or unknown falls back to a neutral mark. */
  glyph?: OutsideGlyphId;
};

export type OutsideSection = {
  heading: string;
  entries: readonly OutsideEntry[];
};

export const OUTSIDE_GLYPH_IDS = ["dna", "ribbon", "chess", "heart-hand", "hospital", "chalkboard", "pencil-book", "neutral"] as const;
export type OutsideGlyphId = (typeof OUTSIDE_GLYPH_IDS)[number];

export const OUTSIDE_INTRO = "What I do outside class: starting things, looking after people, and teaching, which I love.";

const BUILDING: readonly OutsideEntry[] = [
  {
    slug: "western-igem",
    glyph: "dna",
    title: "Western iGEM",
    role: "Director of Lab and Research",
    where: "Western University",
    dates: "2026 – present",
    text: "Helping launch Western's iGEM team, for the international synthetic biology competition, under the Western Engineering Biomedical Club. We reached out to faculty across campus to find our advisors: Dr. Karas is our primary PI and Dr. Pearce our secondary PI, and Dr. Pyne is also working with us. Through Dr. Pearce's FAST lab, our project is about upcycling post-consumer PLA plastic into yeast biomass. In January the team pitches ideas for where the project should go to a panel of faculty judges.",
  },
  {
    slug: "students-fight-parkinsons",
    glyph: "ribbon",
    title: "Students Fight Parkinson's",
    role: "Director of Events",
    where: "Western University",
    dates: "",
    text: "Director of Events for Western's Students Fight Parkinson's club, running events like a sports night, a trivia night, podcasts and a charity run.",
  },
  {
    slug: "tdsb-chess-league",
    glyph: "chess",
    title: "TDSB Chess League",
    role: "Tournament organizer",
    where: "Toronto District School Board",
    dates: "Oct 2022 – Jun 2023",
    text: "Helped plan and host four chess tournaments for 32 Toronto schools, with more than 250 people taking part.",
  },
];

const CARING: readonly OutsideEntry[] = [
  {
    slug: "hospice-vaughan",
    glyph: "heart-hand",
    title: "Hospice Vaughan",
    role: "Receptionist and residence volunteer",
    where: "Vaughan, Ontario",
    dates: "Jun 2025 – present",
    text: "At the front desk and with residents, helping with whatever they need, whether that's support, food or getting a nurse.",
  },
  {
    slug: "lhsc-victoria",
    glyph: "hospital",
    title: "LHSC Victoria Hospital",
    role: "Helping Hand volunteer",
    where: "London, Ontario",
    dates: "Jun 2026 – present",
    text: "Delivering devices to patients.",
  },
];

const TEACHING: readonly OutsideEntry[] = [
  {
    slug: "ipro-tutoring",
    glyph: "chalkboard",
    title: "iPro Tutoring",
    role: "Private tutor",
    where: "Online",
    dates: "2019 – present",
    text: "I've been tutoring since high school: elementary English, math and science, one student at a time. Teaching is one of my favourite things to do.",
  },
  {
    slug: "tdsb-math",
    glyph: "pencil-book",
    title: "TDSB math tutoring",
    role: "Math tutor",
    where: "Toronto District School Board",
    dates: "2022",
    text: "Worked alongside teachers with grade 10 students who were at risk of not getting their math credit.",
  },
];

/** In the order the window lists them. */
export const OUTSIDE_SECTIONS: readonly OutsideSection[] = [
  { heading: "Building", entries: BUILDING },
  { heading: "Caring", entries: CARING },
  { heading: "Teaching", entries: TEACHING },
];

/** Every entry, section by section (the folder's badge counts these; /outside lists them). */
export const OUTSIDE: readonly OutsideEntry[] = OUTSIDE_SECTIONS.flatMap((s) => s.entries);

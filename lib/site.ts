/** One song per line; `tag` shows as a small pill ("unreleased"). */
export type Track = { title: string; artist: string; tag?: string; /** Official single artwork under public/images/music (Apple Music artwork, displayed for identification; unreleased tracks keep the generated cover). */ cover?: string };

/** The songs Kalp has on repeat, in the order the desk plays them. */
export const PLAYLIST: readonly Track[] = [
  { title: "Suffer", artist: "BEX", cover: "/images/music/suffer.jpg" },
  { title: "These Words", artist: "Badger & Natasha Bedingfield", cover: "/images/music/these-words.jpg" },
  { title: "Sleep", artist: "The Kid LAROI", cover: "/images/music/sleep.jpg" },
];

/**
 * One book on the READING widget. `cover` is the real jacket, committed under
 * public/images/reading/ (Open Library's cover API, shown for identification);
 * `url` is where a reader can go and look the book up.
 */
export type Book = { title: string; authors: string; cover: string; url: string };

/** What Kalp is reading right now; the first entry is the one on the desk. */
export const READING: readonly Book[] = [
  {
    title: "The Molecule of More",
    authors: "Daniel Z. Lieberman & Michael E. Long",
    cover: "/images/reading/molecule-of-more.jpg",
    url: "https://openlibrary.org/isbn/9781946885111",
  },
];

/**
 * One hobby: `slug` picks the drawn mini-glyph (components/kalpos/HobbyGlyph)
 * and names the terminal's /hobbies/<slug>.md, `line` is Kalp's own sentence.
 */
export type Hobby = { slug: HobbyGlyphId; name: string; line: string };
export type HobbyGlyphId = "swimming" | "tennis" | "sim-racing" | "clash-royale" | "reselling";

/** What Kalp does when he is not at the desk. */
export const HOBBIES: readonly Hobby[] = [
  { slug: "swimming", name: "Swimming", line: "I love swimming." },
  { slug: "tennis", name: "Tennis", line: "And playing tennis." },
  { slug: "sim-racing", name: "Sim racing", line: "Really into sim racing." },
  { slug: "clash-royale", name: "Clash Royale", line: "Ten years in, 14K trophies." },
  { slug: "reselling", name: "Reselling", line: "Clothing and shoes. I love the hunt." },
];

/**
 * Hub identity, copy and links. Every optional field renders nothing while it
 * is empty, so Kalp can fill these in later with a one-line edit and a push:
 * no code change is needed (STATUS.md H6).
 *
 *  - note:      the yellow NOTE widget on the desk (and the phone note).
 *  - tagline:   the one-line identity under the name (About window, phone).
 *  - resumeUrl: the menubar "Résumé ↓" pill, the dock PDF tile and the About
 *               link; all hidden while empty.
 *  - photo:     a path under /public for the desk photo frame (a 640×640 WebP,
 *               public/images/kalp/desk.webp); the striped "photo of Kalp"
 *               placeholder shows while empty.
 *  - portrait:  a path under /public for the small portrait beside the bio in
 *               the About window (a 3:4 WebP, 720 px tall); hidden while empty.
 *  - playlist:  the songs on repeat: the NOW PLAYING widget, the ♪ desk icon,
 *               the dock Music tile and the Music window; all hidden while
 *               the list is empty. One `{ title, artist, tag? }` per song; the
 *               first entry is what the desk plays first. `nowPlaying` is a
 *               getter on the first entry for anything that still reads it.
 *  - musicTitle: the heading of the Music window ("On repeat").
 *  - reading:   the books on the READING widget and the Reading window; the
 *               widget, the window, the phone row and the terminal's
 *               /about/reading.md all hide while the list is empty.
 *  - hobbies:   the Hobbies window, the phone sheet and the terminal's
 *               /hobbies/<slug>.md; the folder badge counts them.
 *  - contact:   email / GitHub handle or URL / LinkedIn handle or URL.
 */
export const SITE = {
  name: "Kalp Kansara",
  url: "https://kalpkan.com",
  repo: "https://github.com/KalpKan/portfolio",
  note: "Hi — I'm Kalp. Western University, headed for physician-scientist work in neurotech. Open a folder.",
  tagline: "Western University. I build things that measure something real.",
  resumeUrl: "",
  photo: "/images/kalp/desk.webp",
  portrait: "/images/kalp/about.webp",
  musicTitle: "On repeat",
  playlist: PLAYLIST,
  reading: READING,
  hobbies: HOBBIES,
  /** The first song of the playlist (empty strings while the list is empty). */
  get nowPlaying(): NowPlaying {
    return PLAYLIST[0] ?? { title: "", artist: "" };
  },
  contact: {
    email: "Kalpkansara123@gmail.com",
    github: "https://github.com/KalpKan",
    linkedin: "https://www.linkedin.com/in/kalp-kansara123/",
  },
} as const;

export type Contact = { email: string; github: string; linkedin: string };
export type NowPlaying = { title: string; artist: string };

/** The subset of SITE the KalpOS components read (tests pass their own). */
export type SiteConfig = {
  name: string;
  note: string;
  tagline: string;
  resumeUrl: string;
  photo: string;
  /** Optional so older fixtures that only set photo still type-check. */
  portrait?: string;
  nowPlaying: NowPlaying;
  /** Optional so older fixtures that only set nowPlaying still type-check. */
  playlist?: readonly Track[];
  musicTitle?: string;
  /** Optional so older fixtures still type-check; empty hides the widget. */
  reading?: readonly Book[];
  /** Optional so older fixtures still type-check; empty is the Hobbies empty state. */
  hobbies?: readonly Hobby[];
  contact: Contact;
};

/**
 * The songs a component should show: the playlist when one is set, else the
 * single nowPlaying track (when it has a title), else nothing.
 */
export function playlistOf(site: Pick<SiteConfig, "nowPlaying" | "playlist">): readonly Track[] {
  if (site.playlist) return site.playlist;
  return site.nowPlaying?.title ? [site.nowPlaying] : [];
}

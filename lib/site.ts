/** One song per line; `tag` shows as a small pill ("unreleased"). */
export type Track = { title: string; artist: string; tag?: string };

/** The songs Kalp has on repeat, in the order the desk plays them. */
export const PLAYLIST: readonly Track[] = [
  { title: "Suffer", artist: "Bex" },
  { title: "These Words", artist: "Badger & Natasha Bedingfield" },
  { title: "Choosin' Texas", artist: "Drake & Don Toliver", tag: "unreleased" },
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
 *  - photo:     a path under /public for the photo frame; the striped
 *               "photo of Kalp" placeholder shows while empty.
 *  - playlist:  the songs on repeat: the NOW PLAYING widget, the ♪ desk icon,
 *               the dock Music tile and the Music window; all hidden while
 *               the list is empty. One `{ title, artist, tag? }` per song; the
 *               first entry is what the desk plays first. `nowPlaying` is a
 *               getter on the first entry for anything that still reads it.
 *  - musicTitle: the heading of the Music window ("On repeat").
 *  - contact:   email / GitHub handle or URL / LinkedIn handle or URL.
 */
export const SITE = {
  name: "Kalp Kansara",
  url: "https://kalpkan.com",
  repo: "https://github.com/KalpKan/portfolio",
  note: "Hi — I'm Kalp. Western University, headed for physician-scientist work in neurotech. Everything on this desk shipped.",
  tagline: "Western University. I build things that measure something real.",
  resumeUrl: "",
  photo: "",
  musicTitle: "On repeat",
  playlist: PLAYLIST,
  /** The first song of the playlist (empty strings while the list is empty). */
  get nowPlaying(): NowPlaying {
    return PLAYLIST[0] ?? { title: "", artist: "" };
  },
  contact: {
    email: "",
    github: "",
    linkedin: "",
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
  nowPlaying: NowPlaying;
  /** Optional so older fixtures that only set nowPlaying still type-check. */
  playlist?: readonly Track[];
  musicTitle?: string;
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

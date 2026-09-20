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
 *  - nowPlaying: the NOW PLAYING widget and the "Now playing" icon; hidden
 *               while the title is empty (never hardcode a track).
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
  nowPlaying: { title: "", artist: "" },
  contact: {
    email: "",
    github: "",
    linkedin: "",
  },
} as const;

export type Contact = { email: string; github: string; linkedin: string };
export type NowPlaying = { title: string; artist: string };

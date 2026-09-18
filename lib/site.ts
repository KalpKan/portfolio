/**
 * Hub identity and contact links. Empty strings render nothing, so the header
 * contact row stays hidden until Kalp fills these in (STATUS.md H6). No code
 * change is needed later: set the values and redeploy.
 */
export const SITE = {
  name: "Kalp Kansara",
  url: "https://kalpkan.com",
  repo: "https://github.com/KalpKan/portfolio",
  contact: {
    email: "",
    github: "",
    linkedin: "",
  },
} as const;

export type Contact = { email: string; github: string; linkedin: string };

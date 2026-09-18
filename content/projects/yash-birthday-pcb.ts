import type { CaseStudy } from "@/content/case-study";

const yashBirthdayPcb: CaseStudy = {
  slug: "yash-birthday-pcb",
  kicker: "Hardware · KiCad · Gift",
  title: "Yash Birthday PCB",
  lede:
    "A custom printed circuit board designed in KiCad and fabricated as a birthday present for a friend.",
  hero: { kind: "placeholder", label: "Photo coming: the finished board", aspect: "16/9" },
  problem:
    "A birthday present that could not be bought: a small circuit board designed from scratch, with the friend's name in the silkscreen, ordered from a board house and assembled by hand.",
  howItWorks: {
    intro:
      "The board went through the usual KiCad flow. Details and photos will be added by Kalp; the design files live in his KiCad workspace.",
    diagram: "yash-birthday-pcb",
    steps: [
      { title: "Schematic", body: "Parts and connections drawn in KiCad's schematic editor." },
      { title: "Layout", body: "Footprints placed and traces routed in the board editor, with custom artwork on the silkscreen." },
      { title: "Fabrication", body: "Gerber files exported and sent to a PCB fab; components soldered on by hand." },
    ],
  },
  gallery: { kind: "placeholder", label: "Photos coming: board top and bottom, KiCad layout screenshot", aspect: "4/3", count: 3 },
  screens: null,
  video: null,
  tech: ["KiCad", "PCB design", "Soldering"],
  repo: null,
  status: "Finished and gifted · Design files: KiCad · Photos to come",
  draft: false,
  wanted: [
    "2 photos of the finished board (top and bottom)",
    "a screenshot of the KiCad layout and one of the schematic",
    "one sentence on what the board does"
  ],
};

export default yashBirthdayPcb;

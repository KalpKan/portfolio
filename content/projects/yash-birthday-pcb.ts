import type { CaseStudy } from "@/content/case-study";
import renderBoth from "@/public/images/projects/yash-birthday-pcb/render-both.webp";
import renderTop from "@/public/images/projects/yash-birthday-pcb/render-top.webp";
import renderBottom from "@/public/images/projects/yash-birthday-pcb/render-bottom.webp";
import layout from "@/public/images/projects/yash-birthday-pcb/layout.webp";
import schematic from "@/public/images/projects/yash-birthday-pcb/schematic.webp";

// Written from the KiCad project on Kalp's Mac (~/Documents/Yash Birthday PCB:
// .kicad_sch, .kicad_pcb, the Gerber job, BOM and pick-and-place exports,
// DRC report of 2025-07-14) and the Gerber/BOM folder used for the order
// (~/Desktop/Out and About/Sidequest/Yash Bday Gerber). The renders are
// `kicad-cli pcb render` of the board file and `kicad-cli sch export svg`
// of the schematic; the layout view is Kalp's own KiCad screenshot from
// 2025-07-15. No photo of the physical board exists on disk yet.

const yashBirthdayPcb: CaseStudy = {
  slug: "yash-birthday-pcb",
  kicker: "Hardware · KiCad · July 2025",
  title: "Yash Birthday PCB",
  lede:
    "A 12 × 37 mm circuit board shaped like a USB stick, with a basketball player cut clean through it and three LEDs behind the cut, designed in KiCad as a birthday present for a friend.",
  hero: {
    src: renderBoth,
    alt: "3D render of the board from KiCad: front on the left, back on the right. A tall green board with a USB-C plug at the bottom, a basketball player mid-dunk and a ball cut through the board, and three small LEDs on the back beside the cut-out",
    caption: "Front and back of the board, rendered from the KiCad file. The player and the ball are holes in the board, not printed on it.",
  },
  problem:
    "A present you cannot buy: a board that plugs into any USB-C port and lights up a basketball player going for a dunk. The constraints were the ones any first real PCB has. It had to be small enough to be a keychain-sized thing (12 × 37 mm, 1.6 mm FR4), it had to draw power from USB-C without a chip (which means getting the two configuration-channel resistors right, or the port never turns on), and the artwork had to survive the trip from a drawing to a board outline a fab will actually cut. Everything is surface-mount (0402 resistors, 0603 LEDs), so the parts go on from a pick-and-place file at the fab rather than by hand.",
  howItWorks: {
    intro:
      "Nine parts, one sheet. The circuit is deliberately simple so the board could be about the shape: a USB-C plug on the bottom edge supplies 5 V, three LEDs sit on the back along the cut-out, and the silhouette itself is the design.",
    diagram: "yash-birthday-pcb",
    steps: [
      {
        title: "Schematic",
        body:
          "A USB-C 2.0 plug (Molex 105444) feeds VBUS to three 0603 LEDs, each through its own 220 Ω 0402 resistor to ground. The two CC pins carry 5.1 kΩ pull-downs (R1, R2): that is the USB-C rule that tells a laptop or charger a device is attached and asks for 5 V. D+ and D− are left unconnected; the board never talks data. The first electrical-rules run (July 12) flagged unconnected D− and shield pins and a stray label, all expected for a power-only plug; the final schematic marks D+ and D− as no-connect.",
      },
      {
        title: "Board outline as artwork",
        body:
          "The player and the ball are not silkscreen. They are on the Edge.Cuts layer, so the fab routes them out of the board: a roughly 1,700-point polygon for the figure and a 3.5 mm circle for the ball, inside a 12 × 37 mm rectangle. That keeps the board two-layer and cheap (no extra copper art), and the LEDs on the back sit right at the cut edge, so the figure is lit from behind.",
      },
      {
        title: "Layout",
        body:
          "All nine components sit on the back of the board (the front is clean apart from the cut-out) with the three LEDs spaced along the figure's edge, the plug pads at the very bottom, and the CC resistors right behind the connector. Traces run on the back copper, with eight vias to the front for the paths the cut-out gets in the way of. The design-rule check on 2025-07-14 reported zero violations.",
      },
      {
        title: "Fabrication files",
        body:
          "KiCad's fabrication export produced the Gerber set (front and back copper, mask, paste, silkscreen, edge cuts), plated and non-plated drill files, a BOM and a pick-and-place file in JLCPCB's column format, zipped for the order. Two versions of the zip were made on July 16, 2025, after the layout screenshot of July 15.",
      },
    ],
  },
  gallery: {
    aspect: "9/16",
    items: [
      {
        src: renderTop,
        alt: "Render of the front of the board: bare green solder mask with the player-and-ball cut-out and the USB-C plug fingers at the bottom edge",
        caption: "Front: nothing but the cut-out and the connector.",
      },
      {
        src: renderBottom,
        alt: "Render of the back of the board: three LEDs and their resistors beside the cut-out, two resistors behind the USB-C plug",
        caption: "Back: three LEDs along the figure, 220 Ω each, and the 5.1 kΩ CC pull-downs by the plug.",
      },
      {
        src: layout,
        alt: "KiCad board editor screenshot of the layout: the cut-out polygon in white, back-copper traces in blue, front copper in red, the USB-C footprint at the bottom",
        caption: "The layout in KiCad's board editor, from Kalp's screenshot the day before the order.",
      },
      {
        src: schematic,
        alt: "KiCad schematic: a USB-C plug symbol with 5.1 kΩ resistors on CC and VCONN, VBUS feeding three LEDs each with a 220 Ω resistor to ground",
        caption: "The whole schematic, nine parts, on one sheet.",
      },
    ],
  },
  screens: null,
  video: null,
  tech: ["KiCad 9", "USB-C (5.1 kΩ CC pull-downs)", "0402 / 0603 SMD", "JLCPCB Gerbers + pick-and-place", "3D render: kicad-cli"],
  repo: null,
  status: "Designed July 2025, fabrication files prepared for JLCPCB · Design files on Kalp's Mac, not in a repo · Photos of the real board: coming",
  wanted: [
    "2 photos of the real board (front lit up in a USB-C port, and the back)",
    "one sentence on which LED colours were used",
  ],
};

export default yashBirthdayPcb;

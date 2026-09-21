import type { CaseStudy } from "@/content/case-study";
import renderBoth from "@/public/images/projects/porsche-pcb-keychain/render-both.webp";
import renderTop from "@/public/images/projects/porsche-pcb-keychain/render-top.webp";
import renderBottom from "@/public/images/projects/porsche-pcb-keychain/render-bottom.webp";
import layout from "@/public/images/projects/porsche-pcb-keychain/layout.webp";
import schematic from "@/public/images/projects/porsche-pcb-keychain/schematic.webp";
import kicadLayout from "@/public/images/projects/porsche-pcb-keychain/kicad-layout.webp";
import renderFront from "@/public/images/projects/porsche-pcb-keychain/render-front.webp";
import renderBack from "@/public/images/projects/porsche-pcb-keychain/render-back.webp";

// Kalp's own description (docs/content/project-descriptions.md, 2026-09-20)
// sets the framing: a Porsche cut through the board, a keychain hole, three
// LEDs on the underside, USB-C, made for Yash's birthday. The earlier page
// text that called the cut-out a basketball player was wrong; the KiCad
// render shows a Porsche 911 side profile and the 3.5 mm circle at the far
// end is the keychain hole. Technical specifics are from the KiCad project on
// Kalp's Mac (~/Documents/Yash Birthday PCB: .kicad_sch, .kicad_pcb, the
// Gerber job, BOM and pick-and-place exports, DRC report of 2025-07-14, which
// predates the final LED footprints) and the Gerber/BOM folder used for the
// order (~/Desktop/Out and About/Sidequest/Yash Bday Gerber). The renders are
// `kicad-cli pcb render` of the board file and `kicad-cli sch export svg` of
// the schematic; the layout view is Kalp's own KiCad screenshot from
// 2025-07-15. The three `kicad-layout`, `render-front` and `render-back`
// images are Kalp's own screenshots (2026-09-20) of the KiCad board editor
// and 3D viewer. No photo of the physical board exists on disk yet.

const porschePcbKeychain: CaseStudy = {
  slug: "porsche-pcb-keychain",
  kicker: "Hardware · KiCad · July 2025",
  title: "Porsche PCB keychain",
  lede:
    "A small PCB with a keychain hole, a Porsche cut clean through it, three LEDs on the underside and a USB-C plug: plug it into your phone and the Porsche glows. One of my first PCB designs, made for my friend Yash's birthday.",
  hero: {
    src: renderBoth,
    alt: "3D render of the board from KiCad, lying on its side: front on top, back below. A green board with a USB-C plug at the right end, a Porsche 911 side profile cut through the board, a round keychain hole at the left end, and three small LEDs on the back beside the cut-out",
    caption: "Front and back of the board, rendered from the KiCad file. The Porsche and the keychain hole are cut through the board, not printed on it.",
  },
  problem:
    "I made this for my friend Yash's birthday, and it was one of my first PCB-design projects. The idea: a small PCB with a hole so you can attach it to a keychain, a Porsche cut out of the board, three LEDs on the underside and a USB-C port, so when you plug it into your phone the LEDs light up through the cutout and a Porsche glows. The constraints were the ones any first real PCB has. It had to be keychain-sized (12 × 37 mm, 1.6 mm FR4), it had to draw power from USB-C without a chip (which means getting the two configuration-channel resistors right, or the phone never turns the port on), and the car had to survive the trip from a drawing to a board outline a fab will actually cut. Everything is surface-mount (0402 resistors, 0603 LEDs), so the parts go on from a pick-and-place file at the fab rather than by hand.",
  howItWorks: {
    intro:
      "Nine parts, one sheet. The circuit is deliberately simple so the board could be about the shape: a USB-C plug at one end takes 5 V from the phone, three LEDs sit on the underside along the cut-out, and the Porsche silhouette itself is the design.",
    diagram: "porsche-pcb-keychain",
    steps: [
      {
        title: "Schematic",
        body:
          "A USB-C 2.0 plug (Molex 105444) feeds VBUS to three 0603 LEDs, each through its own 220 Ω 0402 resistor to ground. The two CC pins carry 5.1 kΩ pull-downs (R1, R2): that is the USB-C rule that tells a phone, laptop or charger a device is attached and asks for 5 V. D+ and D− are left unconnected; the board never talks data. The first electrical-rules run (July 12) flagged unconnected D− and shield pins and a stray label, all expected for a power-only plug; the final schematic marks D+ and D− as no-connect.",
      },
      {
        title: "The Porsche is the board outline",
        body:
          "The Porsche is not silkscreen. It is on the Edge.Cuts layer, so the fab routes it out of the board: a roughly 1,700-point polygon tracing a 911 side profile, plus a 3.5 mm circle at the far end for the keychain ring, inside a 12 × 37 mm rectangle. That keeps the board two-layer and cheap (no extra copper art), and the LEDs on the underside sit right at the cut edge, so the car is lit from behind and glows through the cutout.",
      },
      {
        title: "Layout",
        body:
          "All nine components sit on the underside of the board (the top is clean apart from the cut-out and the keychain hole) with the three LEDs spaced along the car's outline, the plug pads at the very end, and the CC resistors right behind the connector. Traces run on the back copper, with eight vias to the front for the paths the cut-out gets in the way of. The design-rule check of 2025-07-14 reported no rule violations but 17 unconnected pads, because it ran on an earlier revision that used data-driven four-pad LEDs (DIN/DOUT nets); the LEDs were swapped to plain 0603 parts before the Gerbers were exported on 2025-07-16, and the board file was last saved on 2025-08-27, after that export, so the report is not a statement about the final board.",
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
        alt: "Render of the top of the board: bare green solder mask with the Porsche cut-out, the round keychain hole and the USB-C plug fingers at the end",
        caption: "Top: nothing but the Porsche, the keychain hole and the connector.",
      },
      {
        src: renderBottom,
        alt: "Render of the underside of the board: three LEDs and their resistors beside the Porsche cut-out, two resistors behind the USB-C plug",
        caption: "Underside: three LEDs along the car, 220 Ω each, and the 5.1 kΩ CC pull-downs by the plug.",
      },
      {
        src: layout,
        alt: "KiCad board editor screenshot of the layout: the cut-out polygon in white, back-copper traces in blue, front copper in red, the USB-C footprint at the bottom",
        caption: "The layout in KiCad's board editor, my screenshot the day before the order.",
      },
      {
        src: schematic,
        tone: "document",
        alt: "KiCad schematic: a USB-C plug symbol with 5.1 kΩ resistors on CC and VCONN, VBUS feeding three LEDs each with a 220 Ω resistor to ground",
        caption: "The whole schematic, nine parts, on one sheet.",
      },
      {
        src: kicadLayout,
        alt: "Screenshot of the KiCad board editor: the board outline on a dark background with the cutout drawn in pale grey, three LED footprints along it and the USB-C pads and traces at the bottom end",
        caption: "KiCad layout: the cutout, the three LED footprints and the USB-C traces",
      },
      {
        src: renderFront,
        alt: "Screenshot of KiCad's 3D viewer showing the top of the green board on a grid, with the cutout through it, the keychain hole at the top and the USB-C plug at the bottom",
        caption: "3D render, top",
      },
      {
        src: renderBack,
        alt: "Screenshot of KiCad's 3D viewer showing the underside of the green board, the cutout, the small components beside it and the USB-C plug at the bottom",
        caption: "3D render, bottom, USB-C plug",
      },
    ],
  },
  screens: null,
  video: null,
  tech: ["KiCad 9", "USB-C (5.1 kΩ CC pull-downs)", "3 × 0603 LEDs on the underside", "0402 / 0603 SMD", "JLCPCB Gerbers + pick-and-place", "3D render: kicad-cli"],
  repo: null,
  status: "Designed July 2025 as a birthday gift, fabrication files prepared for JLCPCB · Design files on my Mac, not in a repo · Photos of the real board: coming",
  wanted: [
    "1 photo of the board plugged into a phone with the Porsche glowing (dim room helps)",
    "1 photo of the underside showing the three LEDs, and one on the keychain",
    "one line: which LED colour(s) went on, and whether Yash has it",
  ],
};

export default porschePcbKeychain;

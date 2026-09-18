import type { CaseStudy } from "@/content/case-study";

const eeg: CaseStudy = {
  slug: "eeg",
  kicker: "Neurotech hardware · KiCad + LTspice · Under construction",
  title: "DIY EEG",
  lede:
    "Under construction: a home-built EEG front end, from electrode to waveform, simulated in LTspice and being laid out in KiCad.",
  hero: { kind: "placeholder", label: "Photo coming: breadboard prototype", aspect: "16/9" },
  problem:
    "Commercial EEG hardware is expensive and closed. The goal is a single-channel amplifier chain good enough to see alpha waves with eyes closed, built from parts, understood stage by stage, and documented so the next version can be a proper board.",
  howItWorks: {
    intro:
      "The signal path is the classic one: an instrumentation amplifier for the microvolt scalp signal, then filtering to remove mains hum and drift, then digitizing. The analog chain has been simulated; the physical build is in progress.",
    diagram: "eeg",
    steps: [
      { title: "Simulate", body: "The amplifier and filter stages were modelled in LTspice to check gain, bandwidth and the 60 Hz notch before buying parts." },
      { title: "Prototype", body: "The chain is being built on a breadboard against the KiCad schematic and tested with a signal generator first, then real electrodes." },
      { title: "Digitize", body: "An ADC feeds a microcontroller so the waveform can be viewed and recorded on a laptop." },
    ],
  },
  gallery: { kind: "placeholder", label: "Photos coming: breadboard, KiCad schematic, LTspice plot", aspect: "4/3", count: 3 },
  screens: null,
  video: null,
  tech: ["KiCad", "LTspice", "Analog design", "Instrumentation amplifier"],
  repo: null,
  status: "Under construction · Schematic + simulation done · Board and firmware planned",
  draft: false,
  wanted: [
    "a photo of the current breadboard build",
    "a screenshot of the KiCad schematic and one LTspice plot",
    "the project plan PDF from the EEG Circuit folder, if it can be shared"
  ],
};

export default eeg;

import type { CaseStudy } from "@/content/case-study";
import schematic from "@/public/images/projects/eeg/schematic.webp";

// Under construction. Written from the files in ~/Desktop/EEG Circuit/ on
// Kalp's Mac (read-only): the KiCad schematic (last edited 2026-08-14), the
// LTspice netlist EEG_Simulation.cir (2026-08-28) and the 17-page project
// plan PDF (October 2025). The board file is still empty, so there is no
// layout to show. The schematic image is `kicad-cli sch export svg` of the
// .kicad_sch. Registry status stays "coming" until Kalp says otherwise; the
// page is published as "under construction".

const eeg: CaseStudy = {
  slug: "eeg",
  kicker: "Neurotech hardware · KiCad + LTspice · 2026",
  title: "DIY EEG",
  lede:
    "A single-channel EEG amplifier built from an AD620, two filters and an op-amp gain stage, feeding a 16-bit ADC on a Raspberry Pi: simulated in LTspice, drawn in KiCad, not yet on a board.",
  hero: {
    src: schematic,
    tone: "document",
    alt: "KiCad schematic of the EEG front end: two 9 V batteries, a DIN-3 electrode connector with 10 kΩ safety resistors into an AD620 instrumentation amplifier, a 1 µF / 330 kΩ high-pass and 33 kΩ / 100 nF low-pass filter, a TL084 non-inverting gain stage, AC coupling and a 1.65 V bias into an ADS1115 ADC wired to a Raspberry Pi 4 over I2C",
    caption: "The full schematic as it stands (August 2026). Left to right: batteries and electrodes, AD620, filters, TL084, ADC, Raspberry Pi.",
  },
  problem:
    "Scalp EEG is tens of microvolts riding on tens of millivolts of electrode offset and a volt or more of mains pickup, so the interesting part of the signal is about a million times smaller than the junk around it. Commercial front ends hide that behind a chip like the ADS1299; the point here is the opposite: a two-electrode amplifier chain assembled from parts you can buy for a few dollars each and understand stage by stage, safe because it runs on two 9 V batteries and never touches mains, and good enough to see alpha waves (8 to 12 Hz) appear when the wearer closes their eyes. The plan calls it a learning project and not a medical device, and sets the success test as toggling an LED from eyes-open to eyes-closed on a budget of $200 to $300 CAD.",
  howItWorks: {
    intro:
      "One channel, five stages. The numbers below are the ones in the schematic and in the LTspice netlist, which models the same chain with a 50 µV, 10 Hz alpha wave on top of a 20 mV electrode offset and checks that the ADC input lands at 1.65 V plus or minus about 24 mV.",
    diagram: "eeg",
    steps: [
      {
        title: "Electrodes in, safely",
        body:
          "A three-pin DIN socket brings in the active electrode, the reference and a body ground. Each electrode passes through a 10 kΩ resistor (R2, R3, and R4 on the body ground) before anything else, so no fault can push more than a fraction of a milliamp into the wearer. Power is two 9 V batteries in series giving ±9 V; there is no mains connection anywhere in the design.",
      },
      {
        title: "AD620 instrumentation amplifier",
        body:
          "The AD620 takes the difference between the two electrodes and rejects what they share (mains hum, mostly). Its gain is set by one resistor, 1 + 49.4 kΩ / Rg; with Rg = 1 kΩ that is about 50. The simulation exists partly to justify that choice: at Rg = 100 Ω (gain 495) the 20 mV electrode offset alone slams the output into the ±8 V rails, at 1 kΩ it sits near −1 V with room to spare.",
      },
      {
        title: "Two RC filters",
        body:
          "A 1 µF capacitor into 330 kΩ (C1, R5) is a 0.48 Hz high-pass that strips the slow electrode drift and DC offset the amplifier has just multiplied. Then 33 kΩ into 100 nF (R6, C2) is a 48 Hz low-pass that rolls off muscle noise and most of the 60 Hz mains residue. Both are plain RC stages; a dedicated notch filter is in the plan but not in the schematic yet.",
      },
      {
        title: "TL084 gain and re-bias",
        body:
          "A TL084 op-amp in a non-inverting stage with 100 kΩ over 10 kΩ multiplies the filtered signal by 11, for a total gain of about 550 (50 µV of alpha becomes roughly 27 mV). The output is AC-coupled through 1 µF and pulled to a 1.65 V bias through 100 kΩ, because the ADC only reads positive voltages; the bias is the Pi's 3.3 V rail split in half and decoupled with 10 µF and 100 nF.",
      },
      {
        title: "Digitize on the Raspberry Pi",
        body:
          "An ADS1115 (16-bit, I2C) reads the biased signal on AIN0 (the simulation adds a 10 kΩ protection resistor in front of the pin; the schematic does not have it yet) and hands samples to a Raspberry Pi 4 over SDA and SCL. The Pi side (recording, a bandpass in software, an eyes-closed alpha detector driving an LED) is described in the plan and not written yet.",
      },
      {
        title: "What exists and what does not",
        body:
          "Done: the schematic, an electrical-rules report, and the LTspice model with automatic pass/fail measurements (AD620 DC level, ADC high and low over the last four simulated seconds). Not done: the board layout (the .kicad_pcb file is empty), the parts order, the breadboard build and any code on the Pi. The plan's timeline is 10 to 12 weeks from the first order.",
      },
    ],
  },
  gallery: {
    kind: "placeholder",
    label: "Coming: LTspice plot of the simulated ADC input, and a breadboard photo once parts arrive",
    aspect: "4/3",
    count: 2,
  },
  screens: null,
  video: null,
  tech: [
    "AD620 instrumentation amplifier",
    "TL084 op-amp",
    "ADS1115 16-bit ADC (I2C)",
    "Raspberry Pi 4",
    "KiCad 9",
    "LTspice",
    "2 × 9 V battery power",
  ],
  repo: null,
  status:
    "Under construction · Schematic and LTspice simulation done (August 2026) · Board layout, parts and Pi software not started",
  wanted: [
    "an LTspice plot of V(ain0) and V(ad_out) from EEG_Simulation.cir (File > Export as PNG, or a screenshot)",
    "a photo of the breadboard once the parts arrive",
    "the project-plan PDF, if it can be shared publicly (currently only on the Mac)",
  ],
};

export default eeg;

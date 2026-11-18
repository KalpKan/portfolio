import type { CaseStudy } from "@/content/case-study";
import schematic from "@/public/images/projects/eeg/schematic.webp";
import simulation from "@/public/images/projects/eeg/simulation.webp";
import stageInput from "@/public/images/projects/eeg/stage-input.webp";
import stageFilters from "@/public/images/projects/eeg/stage-filters.webp";
import stageAdc from "@/public/images/projects/eeg/stage-adc.webp";

// Under construction. Written from the files in ~/Desktop/EEG Circuit/ on
// Kalp's Mac (read-only): the KiCad schematic (last edited 2026-08-14), the
// LTspice netlist EEG_Simulation.cir (2026-08-28) and the 17-page project
// plan PDF (October 2025). The board file is still empty, so there is no
// layout to show. The schematic images are `kicad-cli sch export svg` of the
// .kicad_sch (full sheet and three crops); simulation.webp is a matplotlib
// plot of EEG_Simulation.cir run headless in LTspice 17.2.4 (2026-11-18, on a
// scratch copy), every point a solver time point. Registry status is "live"
// so the tile opens this page (a "coming" showcase tile opens nothing);
// `underConstruction` keeps the meta line honest.

const eeg: CaseStudy = {
  slug: "eeg",
  underConstruction: true,
  kicker: "Neurotech hardware · KiCad + LTspice · 2026",
  title: "DIY EEG",
  lede:
    "Under construction: a single-channel EEG amplifier I am building from an AD620, two filters and an op-amp gain stage, feeding a 16-bit ADC on a Raspberry Pi. The schematic is drawn in KiCad and simulated in LTspice; the board and the firmware are next.",
  hero: {
    src: schematic,
    tone: "document",
    alt: "KiCad schematic of the EEG front end: two 9 V batteries, a DIN-3 electrode connector with 10 kΩ safety resistors into an AD620 instrumentation amplifier, a 1 µF / 330 kΩ high-pass and 33 kΩ / 100 nF low-pass filter, a TL084 non-inverting gain stage, AC coupling and a 1.65 V bias into an ADS1115 ADC wired to a Raspberry Pi 4 over I2C",
    caption: "The full schematic as it stands (August 2026). Left to right: batteries and electrodes, AD620, filters, TL084, ADC, Raspberry Pi.",
  },
  problem:
    "Scalp EEG is tens of microvolts riding on tens of millivolts of electrode offset and a volt or more of mains pickup, so the interesting part of the signal is about a million times smaller than the junk around it. Commercial front ends hide that behind a chip like the ADS1299; I wanted the opposite: a two-electrode amplifier chain assembled from parts you can buy for a few dollars each and understand stage by stage, safe because it runs on two 9 V batteries and never touches mains, and good enough to see alpha waves (8 to 12 Hz) appear when I close my eyes. My plan calls it a learning project and not a medical device, and sets the success test as toggling an LED from eyes-open to eyes-closed on a budget of $200 to $300 CAD.",
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
          "A TL084 op-amp in a non-inverting stage with 100 kΩ over 10 kΩ multiplies the filtered signal by 11, for a total gain of about 550 (50 µV of alpha is about 25 mV at the output in the simulation, a little under the nominal 27.5 mV because the filters take a bit off at 10 Hz). The output is AC-coupled through 1 µF and pulled to a 1.65 V bias through 100 kΩ, because the ADC only reads positive voltages; the bias is the Pi's 3.3 V rail split in half and decoupled with 10 µF and 100 nF.",
      },
      {
        title: "Digitize on the Raspberry Pi",
        body:
          "An ADS1115 (16-bit, I2C) reads the biased signal on AIN0 (the simulation adds a 10 kΩ protection resistor in front of the pin; the schematic does not have it yet) and hands samples to a Raspberry Pi 4 over SDA and SCL. The Pi side (recording, a bandpass in software, an eyes-closed alpha detector driving an LED) is described in the plan and not written yet.",
      },
      {
        title: "What exists and what does not",
        body:
          "Done: the schematic and an electrical-rules report, and the LTspice model, which I ran start to finish: the AD620 output averages −1.0075 V and the ADC input stays between 1.6256 V and 1.6744 V (1.65 V ± 24 mV) over the last four simulated seconds, as I wanted. Not done: the board layout (the .kicad_pcb file is empty, no layout has been started), the parts order, the breadboard build and any code on the Pi. The plan's timeline is 10 to 12 weeks from the first order.",
      },
    ],
  },
  gallery: {
    aspect: "4/3",
    items: [
      {
        src: simulation,
        tone: "document",
        alt: "Four plots from the LTspice run. Top left: the 50 microvolt, 10 hertz alpha input. Top right: the AD620 output, a 5 millivolt wave around minus 1.0075 volts. Bottom left: the signal after the filters (about 2 millivolts) and after the TL084 (about 25 millivolts). Bottom right: the ADC input, a wave between 1.6256 and 1.6744 volts around the 1.65 volt bias",
        caption:
          "LTspice, EEG_Simulation.cir, run for 8 simulated seconds (half a second shown). The 50 µV alpha wave becomes about 25 mV at the ADC pin, centred on 1.65 V. Measured over 4 to 8 s: AD620 average −1.0075 V, ADC low 1.6256 V, ADC high 1.6744 V.",
      },
      {
        src: stageInput,
        tone: "document",
        alt: "Close-up of the KiCad schematic: the DIN-3 electrode socket with 10 kilohm resistors R2 and R3 on the active and reference lines, the AD620 with its 1 kilohm gain resistor R1, and the two 9 volt batteries with a 10 kilohm resistor R4 on the body ground",
        caption: "Electrodes in and the AD620: R2 and R3 (10 kΩ) protect the electrodes, R1 (1 kΩ) sets the gain, two batteries give ±9 V.",
      },
      {
        src: stageFilters,
        tone: "document",
        alt: "Close-up of the KiCad schematic: the AD620 output through C1 (1 microfarad) and R5 (330 kilohms) to ground, then R6 (33 kilohms) and C2 (100 nanofarads), into the TL084 op-amp, then a 1 microfarad coupling capacitor and a 100 kilohm bias resistor",
        caption: "Filters and gain: C1 and R5 high-pass, R6 and C2 low-pass, the TL084 stage, then C_EEG1 and R_Bias1 re-bias the signal.",
      },
      {
        src: stageAdc,
        tone: "document",
        alt: "Close-up of the KiCad schematic: the ADS1115 analog-to-digital converter with its AIN0 input, 3.3 volt supply, a divider of two 100 kilohm resistors R7 and R8 with C3 and C4 making the VBIAS node, and the SCL and SDA lines leaving toward the Raspberry Pi",
        caption: "The ADS1115: AIN0 reads the biased signal, R7 and R8 (100 kΩ each) with C3 and C4 make the 1.65 V bias from 3.3 V, SCL and SDA go to the Pi.",
      },
    ],
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
    "Under construction · Schematic and LTspice simulation done (August 2026) · Board layout and firmware planned, parts not ordered",
  wanted: [
    "1 photo of the breadboard once the parts arrive",
    "yes/no: may the 17-page project-plan PDF go public (it is only on the Mac)",
  ],
};

export default eeg;

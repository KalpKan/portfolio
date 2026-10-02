/**
 * Kalp's volunteer research, kept apart from the apps on this desk
 * (2026-10-02: "put it in a research folder on the website... in a separate
 * folder"). One entry per project; `slug` names the terminal's
 * /research/<slug>.md and the Research window row's key. This is Kalp's own
 * summary of unpublished and in-progress work — render it exactly as given,
 * nothing added, nothing reworded.
 */
export type ResearchEntry = {
  slug: string;
  title: string;
  role: string;
  where: string;
  status: string;
  description: string;
};

/** The Research window's header line. */
export const RESEARCH_HEADER =
  "Volunteer research in Dr. Alexandre Boutet's group at the University Health Network (Toronto), on epilepsy and neuromodulation, alongside work at Western.";

/** In the order the Research window and /research list them. */
export const RESEARCH: readonly ResearchEntry[] = [
  {
    slug: "neuromod-sca",
    title: "Neuromodulation for spinocerebellar ataxia: a systematic review",
    role: "Co-first author (with Malin Daunt)",
    where: "University Health Network / Western University",
    status: "In progress — writing",
    description:
      "Systematic review of deep brain stimulation, transcranial direct current stimulation and transcranial magnetic stimulation for the symptoms of spinocerebellar ataxia. Screening and data extraction complete; manuscript in preparation.",
  },
  {
    slug: "dbs-mri-heating",
    title: "RF heating of deep brain stimulation systems in MRI at 0.5 T and 7 T",
    role: "Undergraduate research assistant",
    where: "University Health Network",
    status: "In progress",
    description:
      "Phantom study of radiofrequency heating of an implanted DBS system during MRI at low and ultra-high field. Led by MSc candidate Hezekiah Au; PI Dr. Alexandre Boutet.",
  },
  {
    slug: "seeg-mri-heating",
    title: "RF heating of stereo-EEG electrodes in MRI at 0.5 T and 3 T",
    role: "Undergraduate research assistant",
    where: "University Health Network",
    status: "In progress",
    description: "Companion phantom study of radiofrequency heating of stereo-EEG electrode systems during MRI. Same group as the DBS study.",
  },
  {
    slug: "gp63-leishmaniasis",
    title: "Computational identification and optimization of GP63 inhibitors for leishmaniasis",
    role: "Co-author (Biochem 3381 group project)",
    where: "Western University",
    status: "Written",
    description:
      "Structure-based virtual screening against the HEXXH catalytic motif of the Leishmania surface metalloprotease GP63, with docking, interaction analysis and ADME/toxicity profiling of optimised leads.",
  },
];

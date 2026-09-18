import type { CaseStudy } from "@/content/case-study";

// Written from KalpKan/Outline (Methods.md, DevelopmentPhases.md,
// Outline/Models.swift, Outline/MSECalculator.swift, Outline/ContentView.swift,
// analysis/README.md). The registry used to describe this app as a tool for
// "structuring ideas before you write them"; it is not. It is a motor-control
// measurement instrument.

const outline: CaseStudy = {
  slug: "outline",
  kicker: "iPadOS · Research tool · 2025",
  title: "Outline, a circle variability analyzer",
  lede:
    "An iPad app that asks you to draw circles with an Apple Pencil and scores how far each one strays from a perfect circle, so the drift in someone's hand can be measured instead of eyeballed.",
  hero: {
    kind: "placeholder",
    label: "iPad screenshot coming: the canvas with a drawn circle and its MSE",
    aspect: "4/3",
  },
  problem:
    "Drawing a circle is a standard bedside test of fine motor control: tremor, fatigue and some neurological conditions all show up as wobble. But a clinician looking at a page can only say \"a bit shaky\". Outline turns the same task into numbers. A participant rates their fatigue from 1 to 10, draws circles on an iPad, and each drawing becomes a single score for shape error and, across a session, a score for consistency, with the raw pen path exported so the analysis can be redone in Python. The app records exactly what the hand did; PencilKit's smoothing and shape recognition are switched off.",
  howItWorks: {
    intro:
      "The app is one PencilKit canvas, one number per drawing, and an export button. The mathematics is deliberately simple enough to repeat in NumPy, and the Swift implementation follows the pseudocode in the repo's Methods.md line for line.",
    diagram: "outline",
    steps: [
      {
        title: "Session start",
        body:
          "A prompt asks \"How tired are you feeling?\" on a 1–10 scale; the answer is stored as session metadata and stamped on every trial, so fatigue can be correlated with drawing error later.",
      },
      {
        title: "Five practice circles",
        body:
          "The first five trials show an animated guide circle of 250 pt radius so the participant learns the target size. Those five are excluded from every metric and from the export.",
      },
      {
        title: "Test trials from memory",
        body:
          "The guide disappears. Each drawing is captured as raw stroke points (x, y and a time offset from the first touch), Pencil or finger, with no assistance.",
      },
      {
        title: "Shape-only error",
        body:
          "The points are centred on their centroid, scaled so their mean radius is 250 px (so a small circle is not penalised for being small), resampled to one radius per degree, and compared with a perfect circle: MSE = mean of (r(θ) − 250)² over 360 angles. The score appears on screen the moment the stroke ends.",
      },
      {
        title: "Consistency across a session",
        body:
          "The session score is the variance of the trial MSEs, which says whether the participant draws the same circle every time regardless of whether it is a good one. Export writes one JSON per trial plus session-metadata.json through the share sheet; the analysis notebook in the repo adds RMSE, circular variance, Hausdorff distance, ICC and mixed-effects models on top.",
      },
    ],
  },
  gallery: {
    kind: "placeholder",
    label: "Photos coming: an iPad with Apple Pencil mid-trial",
    aspect: "4/3",
    count: 1,
  },
  screens: {
    kind: "placeholder",
    label: "Screenshots coming: fatigue prompt, practice guide, test trial with MSE, Manage Trials",
    aspect: "4/3",
    count: 4,
  },
  video: {
    kind: "placeholder",
    label: "Short screen recording coming (20–30 s): one practice and one test trial",
    aspect: "4/3",
  },
  tech: ["Swift", "SwiftUI", "PencilKit", "iPadOS", "JSON export", "Python / NumPy analysis"],
  repo: "https://github.com/KalpKan/Outline",
  status:
    "Phase 2 of the repo's plan is done (live MSE, fatigue prompt, export) · Trial management is in progress · Not on the App Store · Research instrument, not a clinical device",
  wanted: [
    "4 iPad screenshots (fatigue prompt, practice guide, test trial with MSE, Manage Trials)",
    "1 photo of the iPad and Pencil in use",
    "optional 20–30 s screen recording",
  ],
};

export default outline;

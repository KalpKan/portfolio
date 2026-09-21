import type { CaseStudy } from "@/content/case-study";
import enclosureRender from "@/public/images/projects/unpark/enclosure-render.webp";
import demoPiPhone from "@/public/images/projects/unpark/demo-pi-phone.webp";
import whiteboard from "@/public/images/projects/unpark/whiteboard.webp";
import boxExploded from "@/public/images/projects/unpark/box-exploded.webp";
import boxHalves from "@/public/images/projects/unpark/box-halves.webp";
import appAnalytics from "@/public/images/projects/unpark/app-analytics.webp";
import appRisk from "@/public/images/projects/unpark/app-risk.webp";

// Kalp's own description (docs/content/project-descriptions.md) sets the
// framing; the technical specifics are from KalpKan/UnPark (README,
// server_template.py, functions/index.js, Antifreeze/Models/FreezeDataManager.swift,
// ViewModels/FreezeAnalyticsViewModel.swift, Views/SettingsView.swift,
// Utilities/NotificationManager.swift). Numbers below are the constants in
// that code, not estimates. The haptic cue lives on the device, not in the
// committed code. The team, the competition (MedSprint), the tagline, the box
// contents and every image are from the team's pitch deck
// (public/docs/unpark-medsprint-pitch.pdf, 12 slides, 2026-09-20): the
// enclosure CAD renders, the whiteboard sketch, the demo frame and the two
// iPad screenshots of the app were extracted from it at their embedded
// resolution, so the demo frame and the first screenshot are soft.

const unpark: CaseStudy = {
  slug: "unpark",
  kicker: "Hardware · iOS · MedSprint 2025",
  title: "UnPark, codename Antifreeze",
  lede:
    "A haptic device worn on the ankle that catches freezing-of-gait episodes in Parkinson's with an accelerometer, logs each one to your phone on its own, and lets an AI model find the patterns in the background. Built for the MedSprint competition with Yash Panchal and Ishpreet Bal. Detect. Log. Predict. Empower.",
  hero: {
    src: enclosureRender,
    alt: "CAD render of the UnPark ankle enclosure: a rounded light-grey box with a lid, two small slots on one side and a strap loop on top, on a pale blue background",
    caption: "The ankle box, rendered from the CAD model: one enclosure for the accelerometer, the vibration motor, the battery pack and the Raspberry Pi 4.",
  },
  problem:
    "I built this for a competition. It helps people with Parkinson's who get freezing-of-gait episodes: the moment you want to walk and your feet stay planted, which tends to happen in doorways, on turns and in crowds, and is the leading cause of falls in the disease. A clinic only sees a freeze if it happens in the room; at home nobody is counting. So the device is a haptic device worn on the ankle with an accelerometer that detects a freeze, and when it detects one it automatically logs it and sends it to your phone (auto-logging, no button to press). On the phone the data populates a dashboard, an AI model runs in the background deriving insights people never thought about, and you can export everything that was collected, so monitoring disease progression gets easier. UnPark is the repo's name; the app is called Antifreeze. We built it as a team of three (Kalp Kansara, Yash Panchal, Ishpreet Bal) for the MedSprint competition, under the line \"Detect. Log. Predict. Empower.\"",
  howItWorks: {
    intro:
      "Three parts, joined by Firebase: the ankle device, a Raspberry Pi 4 with an MPU6050 accelerometer, a vibration motor for the haptic cue and a battery pack in one box, runs the detector and writes each freeze to Firestore (the cloud sync); a scheduled Cloud Function turns the last 30 days into AI insights in the background; the SwiftUI app listens to both, also takes live events straight from the device over Wi-Fi, and exports the record as CSV.",
    diagram: "unpark",
    steps: [
      {
        title: "Sense",
        body:
          "The MPU6050 on the ankle sits on the I²C bus at 0x68 and is read every 100 ms. A running baseline follows the reading with exponential smoothing (α = 0.05), so slow drift in how the device is worn does not count as motion.",
      },
      {
        title: "Decide",
        body:
          "Each sample is compared two ways: distance from the smoothed baseline (motion if over 4.8 m/s²) and distance from the previous sample (motion if over 3.8 m/s²). If neither trips for 3 seconds, the wearer has stopped, and the detector records one freeze rather than re-firing every tick.",
      },
      {
        title: "Auto-log",
        body:
          "Nobody has to press anything. The Pi writes a freezeEpisodes document to Firestore with a server timestamp, the motion level, the derivative and the duration, and a Flask-SocketIO server on port 5000 emits a freeze_event to any phone on the same network, so the app shows the episode immediately, even before Firestore syncs.",
      },
      {
        title: "Insights in the background",
        body:
          "A Firebase Cloud Function runs every hour over the last 30 days of episodes and writes freezeInsights/latest: the peak hour, the distribution by hour and by activity, and a tip matched to the most common trigger (turning, doorways, standing up, crowds). The point is to surface patterns a person would never sit down and work out for themselves.",
      },
      {
        title: "Dashboard, warnings and export",
        body:
          "The SwiftUI app keeps a live Firestore listener, fills a dashboard that charts episodes by day, time of day, weekday and activity, and lets the wearer add notes and a location to each one. Every minute it checks whether the current activity accounts for more than 30 % of past episodes and, if so, posts a local risk notification; a follow-up notification one minute after each detected freeze asks what was happening. Settings has an Export to CSV button (date, time, duration, activity, notes, location) that hands the whole record to the share sheet, so a clinician or the wearer can track disease progression over months instead of guessing.",
      },
    ],
  },
  gallery: {
    aspect: "4/3",
    items: [
      {
        src: demoPiPhone,
        alt: "A soft frame from the demo: a laptop on a desk showing the app while the Raspberry Pi prototype sits on the floor below, tethered by a cable",
        caption: "The demo from the pitch: the Raspberry Pi prototype syncing with the phone. A frame from the deck, so it is soft.",
      },
      {
        src: whiteboard,
        alt: "Whiteboard sketch of the first design: an ankle housing with a rod and a piezo sensor, notes on the Bluetooth link, the phone, and a list of parts",
        caption: "The first whiteboard: a rod-mounted piezo sensor and Bluetooth. Both were dropped for the accelerometer and Firebase.",
      },
      {
        src: boxExploded,
        alt: "CAD render of the enclosure opened: the lid lifted off the base, showing the slots for the strap and the cable",
        caption: "The box opened. Everything lives in one enclosure once the rod went and the accelerometer came in.",
      },
      {
        src: boxHalves,
        alt: "CAD render of the two long sides of the enclosure laid flat, each with a slot cut in it",
        caption: "The two side walls, with the slots for the strap.",
      },
    ],
  },
  screens: {
    aspect: "4/3",
    items: [
      {
        src: appAnalytics,
        alt: "The Antifreeze app's Analytics tab on an iPad: bar charts of freeze episodes by time of day and by day of week, an activity analysis with horizontal bars, and the start of a risk prediction card",
        caption: "Analytics: episodes by time of day, by weekday and by activity. From the walkthrough in the deck.",
      },
      {
        src: appRisk,
        alt: "The Analytics tab scrolled down: a Risk Prediction card reading 62 % current risk level based on 90 recorded episodes, risk factors turning and morning, and six insight lines about peak hours, Sundays and turning",
        caption: "Risk prediction and the AI insights: 62 % based on 90 recorded episodes, turning and mornings as the risk factors.",
      },
    ],
  },
  video: {
    kind: "placeholder",
    label: "Demo video coming (30–60 s): wear the sensor, stop, watch the phone react",
    aspect: "16/9",
  },
  tech: [
    "Haptic ankle device",
    "SwiftUI",
    "Swift Charts",
    "Socket.IO (Swift client)",
    "Raspberry Pi",
    "MPU6050",
    "Python",
    "Flask-SocketIO",
    "Firebase Firestore",
    "Cloud Functions",
    "UserNotifications",
  ],
  repo: "https://github.com/KalpKan/UnPark",
  status:
    "Hardware prototype built for the MedSprint competition, tested on the bench with one sensor · App Store: not published (needs the Apple Developer Program) · Thresholds tuned by hand, not validated against clinical freezing",
  links: [{ label: "Pitch deck (PDF)", href: "/docs/unpark-medsprint-pitch.pdf" }],
  wanted: [
    "1 photo of the device strapped on an ankle (the hero is a CAD render until then)",
    "1 sharp photo of the bare Pi + MPU6050 on the bench (the demo frame from the deck is soft)",
    "2 iPhone screenshots: the dashboard and the episode list (the deck only has the analytics tab, on an iPad)",
    "one 30–60 s video: walk, stop, feel the buzz, watch the phone log it (send the file or an unlisted YouTube link)",
  ],
};

export default unpark;

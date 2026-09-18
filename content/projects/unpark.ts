import type { CaseStudy } from "@/content/case-study";

// Written from KalpKan/UnPark (README, server_template.py, functions/index.js,
// Antifreeze/Models/FreezeDataManager.swift, ViewModels/FreezeAnalyticsViewModel.swift,
// Utilities/NotificationManager.swift). Numbers below are the constants in
// that code, not estimates.

const unpark: CaseStudy = {
  slug: "unpark",
  kicker: "Hardware · iOS · 2025",
  title: "UnPark, codename Antifreeze",
  lede:
    "A wearable accelerometer on a Raspberry Pi that notices when someone with Parkinson's has frozen mid-step, logs it to the cloud, and shows the pattern in an iPhone app.",
  hero: {
    kind: "placeholder",
    label: "Device photo coming: Kalp will add",
    aspect: "16/9",
  },
  problem:
    "Freezing of gait is the moment a person with Parkinson's disease wants to walk and their feet stay planted. It tends to happen in doorways, on turns, in crowds, and in the evening, and it is the leading cause of falls in the disease. Clinics only see it when it happens in the room; at home nobody is counting. UnPark (the repo's name; the app is called Antifreeze) asks a small question: if a cheap motion sensor could tell the difference between standing still on purpose and being stuck, could a phone learn when and where a person freezes, and warn them before the next one?",
  howItWorks: {
    intro:
      "Three parts, joined by Firebase: a Raspberry Pi with an MPU6050 accelerometer runs the detector and writes each freeze to Firestore; a scheduled Cloud Function turns the last 30 days into insights; the SwiftUI app listens to both and also takes live events straight from the Pi over Wi-Fi.",
    diagram: "unpark",
    steps: [
      {
        title: "Sense",
        body:
          "The MPU6050 sits on the I²C bus at 0x68 and is read every 100 ms. A running baseline follows the reading with exponential smoothing (α = 0.05), so slow drift in how the device is worn does not count as motion.",
      },
      {
        title: "Decide",
        body:
          "Each sample is compared two ways: distance from the smoothed baseline (motion if over 4.8 m/s²) and distance from the previous sample (motion if over 3.8 m/s²). If neither trips for 3 seconds, the wearer has stopped, and the detector records one freeze rather than re-firing every tick.",
      },
      {
        title: "Log",
        body:
          "The Pi writes a freezeEpisodes document to Firestore with a server timestamp, the motion level, the derivative and the duration, and a Flask-SocketIO server on port 5000 emits a freeze_event to any phone connected on the same network, so the app shows it immediately even before Firestore syncs.",
      },
      {
        title: "Analyse",
        body:
          "A Firebase Cloud Function runs every hour over the last 30 days of episodes and writes freezeInsights/latest: the peak hour, the distribution by hour and by activity, and a tip matched to the most common trigger (turning, doorways, standing up, crowds).",
      },
      {
        title: "Show and warn",
        body:
          "The SwiftUI app keeps a live Firestore listener, charts episodes by day, time of day, weekday and activity, and lets the wearer add notes and a location to each one. Every minute it checks whether the current activity accounts for more than 30 % of past episodes and, if so, posts a local risk notification; a follow-up notification one minute after each detected freeze asks what was happening.",
      },
    ],
  },
  gallery: {
    kind: "placeholder",
    label: "Photos coming: Kalp will add (Pi + MPU6050 on the wrist, bench setup)",
    aspect: "4/3",
    count: 2,
  },
  screens: {
    kind: "placeholder",
    label: "App screenshots coming: dashboard, episode list, analytics",
    aspect: "9/19.5",
    count: 3,
  },
  video: {
    kind: "placeholder",
    label: "Demo video coming (30–60 s): wear the sensor, stop, watch the phone react",
    aspect: "16/9",
  },
  tech: [
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
    "Hardware prototype, tested on the bench with one sensor · App Store: not published (needs the Apple Developer Program) · Thresholds tuned by hand, not validated against clinical freezing",
  wanted: [
    "2 device photos (the Pi + MPU6050 as worn, and the bench setup)",
    "3 app screenshots (dashboard, episode list, analytics)",
    "one 30–60 s demo video (unlisted YouTube link is fine)",
  ],
};

export default unpark;

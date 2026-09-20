import type { CaseStudy } from "@/content/case-study";

// Kalp's own description (docs/content/project-descriptions.md) sets the
// framing; the technical specifics are from KalpKan/UnPark (README,
// server_template.py, functions/index.js, Antifreeze/Models/FreezeDataManager.swift,
// ViewModels/FreezeAnalyticsViewModel.swift, Views/SettingsView.swift,
// Utilities/NotificationManager.swift). Numbers below are the constants in
// that code, not estimates. The haptic cue lives on the device, not in the
// committed code.

const unpark: CaseStudy = {
  slug: "unpark",
  kicker: "Hardware · iOS · 2025",
  title: "UnPark, codename Antifreeze",
  lede:
    "A haptic device worn on the ankle that catches freezing-of-gait episodes in Parkinson's with an accelerometer, logs each one to your phone on its own, and lets an AI model find the patterns in the background. Built for a competition.",
  hero: {
    kind: "placeholder",
    label: "Device photo coming: Kalp will add",
    aspect: "16/9",
  },
  problem:
    "I built this for a competition. It helps people with Parkinson's who get freezing-of-gait episodes: the moment you want to walk and your feet stay planted, which tends to happen in doorways, on turns and in crowds, and is the leading cause of falls in the disease. A clinic only sees a freeze if it happens in the room; at home nobody is counting. So the device is a haptic device worn on the ankle with an accelerometer that detects a freeze, and when it detects one it automatically logs it and sends it to your phone (auto-logging, no button to press). On the phone the data populates a dashboard, an AI model runs in the background deriving insights people never thought about, and you can export everything that was collected, so monitoring disease progression gets easier. UnPark is the repo's name; the app is called Antifreeze.",
  howItWorks: {
    intro:
      "Three parts, joined by Firebase: the ankle device, a Raspberry Pi with an MPU6050 accelerometer, runs the detector and writes each freeze to Firestore; a scheduled Cloud Function turns the last 30 days into insights in the background; the SwiftUI app listens to both and also takes live events straight from the device over Wi-Fi.",
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
    kind: "placeholder",
    label: "Photos coming: Kalp will add (the device on an ankle, and the bench setup)",
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
    "Hardware prototype built for a competition, tested on the bench with one sensor · App Store: not published (needs the Apple Developer Program) · Thresholds tuned by hand, not validated against clinical freezing",
  wanted: [
    "2 photos: the device strapped on an ankle, and the bare Pi + MPU6050 on the bench",
    "3 iPhone screenshots: the dashboard, the episode list, the analytics/insights screen",
    "one 30–60 s video: walk, stop, feel the buzz, watch the phone log it (unlisted YouTube link is fine)",
    "optional: a photo or slide from the competition, and its name",
  ],
};

export default unpark;

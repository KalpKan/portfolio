import type { DiagramId } from "@/content/case-study";
import { FlowDiagram, type FlowData } from "./FlowDiagram";

/**
 * One diagram per case study, as data for FlowDiagram. Node text is what the
 * code actually does (file names, ports, collections), not marketing.
 */
const DIAGRAMS: Record<DiagramId, FlowData> = {
  unpark: {
    title: "UnPark architecture: Raspberry Pi to Firebase to the iPhone app, with a direct Socket.IO path and an hourly Cloud Function",
    nodes: [
      { id: "pi", title: "Raspberry Pi", sub: ["MPU6050 @ 0x68, 10 Hz", "server_template.py", "3 s still = freeze"] },
      { id: "fb", title: "Firebase", sub: ["Firestore freezeEpisodes", "Function: hourly", "→ freezeInsights/latest"] },
      { id: "app", title: "Antifreeze (iOS)", sub: ["SwiftUI + Charts", "Firestore listener", "local notifications"] },
    ],
    edges: ["freeze doc", "snapshot"],
    extra: [{ from: 0, to: 2, label: "Socket.IO :5000 freeze_event (Wi-Fi)" }],
  },
  "rc-car": {
    title: "RC car architecture: PS4 controller or Pi camera into the Raspberry Pi, out to the motor and steering",
    nodes: [
      { id: "in", title: "Inputs", sub: ["DualShock 4 (Bluetooth)", "Pi Camera (autonomous)"] },
      { id: "pi", title: "Raspberry Pi", sub: ["C++: evdev + SDL2 threads", "HSV mask → largest blob", "throttle, steering"] },
      { id: "car", title: "Drivetrain", sub: ["N20 motor + spur gears", "steering servo", "3D-printed chassis"] },
    ],
    edges: ["events / frames", "PWM"],
  },
  outline: {
    title: "Outline pipeline: PencilKit strokes to a shape-only MSE to JSON export for Python analysis",
    nodes: [
      { id: "canvas", title: "PencilKit canvas", sub: ["raw x, y, t", "no smoothing", "5 practice trials"] },
      { id: "mse", title: "MSECalculator.swift", sub: ["centre, scale to r=250", "360 angles", "mean (r−250)²"] },
      { id: "export", title: "Export", sub: ["circle-*.json per trial", "session-metadata.json", "→ NumPy notebook"] },
    ],
    edges: ["stroke", "score"],
  },
  flashcards: {
    title: "FlashCards structure: sign-in, sets and cards, study view, widget",
    nodes: [
      { id: "auth", title: "Sign in", sub: ["LoginView, SignupView", "AuthViewModel", "Firebase Auth"] },
      { id: "sets", title: "Sets and cards", sub: ["FlashcardSet, FlashCard", "MainView, FlashcardSetView", "PersistenceManager"] },
      { id: "study", title: "Study", sub: ["FlashCardView", "FlashcardsWidget", "WidgetKit"] },
    ],
    edges: ["AppState", "cards"],
  },
  classmyschedule: {
    title: "classmyschedule flow: popup dates, content script scrape, .ics download",
    nodes: [
      { id: "popup", title: "Popup", sub: ["term start / end dates"] },
      { id: "scrape", title: "content.js", sub: ["reads timetable tables", "expands weekly slots"] },
      { id: "ics", title: ".ics file", sub: ["VEVENTs", "blob download"] },
    ],
    edges: ["message", "events"],
  },
};

export function Diagram({ id }: { id: DiagramId }) {
  return <FlowDiagram data={DIAGRAMS[id]} />;
}

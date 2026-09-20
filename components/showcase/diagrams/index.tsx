import type { DiagramId } from "@/content/case-study";
import { FlowDiagram, type FlowData } from "./FlowDiagram";

/**
 * One diagram per case study, as data for FlowDiagram. Node text is what the
 * code actually does (file names, ports, collections), not marketing.
 */
export const DIAGRAMS: Record<DiagramId, FlowData> = {
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
  flashcards: {
    title: "FlashCards structure: sign-in, sets and cards, study view, widget",
    nodes: [
      { id: "auth", title: "Sign in", sub: ["LoginView, SignupView", "AuthViewModel", "Firebase Auth"] },
      { id: "sets", title: "Sets and cards", sub: ["FlashcardSet, FlashCard", "MainView, FlashcardSetView", "PersistenceManager"] },
      { id: "study", title: "Study", sub: ["FlashCardView", "FlashcardsWidget", "WidgetKit"] },
    ],
    edges: ["AppState", "cards"],
  },
  "porsche-pcb-keychain": {
    title: "Porsche PCB keychain: a USB-C plug takes 5 V from the phone, three LEDs on the underside light the Porsche cut through the board",
    nodes: [
      { id: "usb", title: "USB-C plug", sub: ["Molex 105444, 2.0", "CC1/CC2: 5.1 kΩ to GND", "D+/D−: no connect"] },
      { id: "led", title: "Three LEDs (underside)", sub: ["0603, 220 Ω each", "along the cut-out edge"] },
      { id: "art", title: "Porsche cut-out", sub: ["Edge.Cuts: ~1,700 points", "keychain hole: 3.5 mm", "12 × 37 mm board"] },
    ],
    edges: ["VBUS 5 V", "lights"],
  },
  eeg: {
    title: "DIY EEG signal chain (under construction): electrodes into an AD620, two RC filters, a TL084 gain stage, then an ADS1115 ADC on a Raspberry Pi",
    nodes: [
      { id: "in", title: "Electrodes", sub: ["DIN-3: active, ref, body", "10 kΩ safety each", "±9 V from 2 × 9 V"] },
      { id: "amp", title: "Amplify + filter", sub: ["AD620, Rg 1 kΩ → ×50", "HPF 0.48 Hz, LPF 48 Hz", "TL084 ×11, bias 1.65 V"] },
      { id: "out", title: "Digitize", sub: ["ADS1115, 16-bit, I2C", "Raspberry Pi 4", "software: not started"] },
    ],
    edges: ["µV", "mV"],
  },
};

export function Diagram({ id }: { id: DiagramId }) {
  return <FlowDiagram data={DIAGRAMS[id]} />;
}

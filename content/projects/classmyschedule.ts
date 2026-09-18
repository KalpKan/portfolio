import type { CaseStudy } from "@/content/case-study";

// DRAFT, not published. The folder ~/Desktop/Apps/classmyschedule-main is
// byte-for-byte the 2025-06-24 state of github.com/jshklz/classmyschedule
// (GPL-3, one contributor). Nothing in it shows a contribution by Kalp, so
// this page must not go live until he answers STATUS.md checkpoint H9
// (did he contribute, or should the entry be removed?). While the registry
// entry is "coming" the hub shows the placeholder page, not this text.

const classmyschedule: CaseStudy = {
  slug: "classmyschedule",
  kicker: "Chrome extension · JavaScript",
  title: "classmyschedule",
  lede:
    "A Chrome extension that reads a Western University DraftMySchedule timetable and downloads it as an .ics calendar file.",
  hero: {
    kind: "placeholder",
    label: "Screenshot coming",
    aspect: "16/9",
  },
  problem:
    "DraftMySchedule shows a Western student their term timetable as a web page with no export. The extension scrapes the class list under the visual calendar, expands each weekly slot across the term's start and end dates, and writes a standard iCalendar file that Google Calendar or Apple Calendar can import.",
  howItWorks: {
    intro:
      "A popup asks for the term dates; a content script reads the page; a small iCalendar writer produces the file.",
    diagram: "classmyschedule",
    steps: [
      { title: "Popup", body: "Fall and winter start/end date fields and one button per term." },
      { title: "Scrape", body: "The content script finds the bordered timetable tables, reads each class box's hidden data-content HTML for title, time, day, location, instructor and type." },
      { title: "Expand and write", body: "Each weekly slot is repeated from the start date to the end date and emitted as VEVENTs; the .ics is downloaded from a blob URL." },
    ],
  },
  gallery: { kind: "placeholder", label: "Screenshot coming", aspect: "16/9", count: 1 },
  screens: { kind: "placeholder", label: "Popup screenshot coming", aspect: "4/3", count: 1 },
  video: { kind: "placeholder", label: "No video", aspect: "16/9" },
  tech: ["Chrome Manifest V3", "JavaScript", "iCalendar"],
  repo: null,
  status: "Authorship unconfirmed (see STATUS.md H9); not published",
  draft: true,
  wanted: ["answer H9 before any media is needed"],
};

export default classmyschedule;

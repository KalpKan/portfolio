import type { CaseStudy } from "@/content/case-study";
import icon from "@/public/images/projects/flashcards/icon.webp";

// FlashCardsApp is a private repository with no README (only a Swift header
// comment). This page is written from the file and folder names in the
// repository tree and its commit dates, nothing more; no code is linked or
// quoted. The repo link stays hidden until Kalp makes it public and removes
// the committed Firebase configuration file (STATUS.md, H4).

const flashcards: CaseStudy = {
  slug: "flashcards",
  kicker: "iOS · Swift · Under construction",
  title: "FlashCards",
  lede:
    "Under construction. Planned: a native iPhone flashcard app with sign-in, sets of cards, a flip-to-reveal study view and a home-screen widget, built as a first SwiftUI project.",
  hero: {
    src: icon,
    alt: "The FlashCards app icon",
    caption: "App icon (the only artwork in the repository that can be shown yet).",
  },
  problem:
    "Every flashcard app worth using is either a subscription or a web page pretending to be an app. Kalp wanted the basic loop, make a set, add cards, flip through them, on a phone, with the cards saved to an account so they survive a new device, and a widget so a card shows up on the home screen without opening anything. It was also the project used to learn SwiftUI, Firebase authentication and WidgetKit in one go, over three weeks in February 2025.",
  howItWorks: {
    intro:
      "The repository is organised the way a SwiftUI app usually is: models, view models, views, a persistence helper and a widget extension. Described from those file names only.",
    diagram: "flashcards",
    steps: [
      {
        title: "Account",
        body:
          "LoginView and SignupView feed an AuthViewModel, and an AppState object decides whether the app shows the login flow or the main screen. Firebase provides the accounts.",
      },
      {
        title: "Sets and cards",
        body:
          "Two models, FlashcardSet and FlashCard. MainView lists the sets; CreateFlashcardSetView makes a new one; FlashcardSetView shows the cards in a set with AddCardView and EditCardView to change them.",
      },
      {
        title: "Studying",
        body:
          "FlashCardView is the study screen: one card at a time, front then back. AppTheme keeps colours and type consistent across screens.",
      },
      {
        title: "Saving and the widget",
        body:
          "PersistenceManager handles saving and loading, and a separate FlashcardsWidget target (FlashCardWidget and WidgetView) puts a card on the home screen with WidgetKit.",
      },
    ],
  },
  // Nothing physical to photograph; the screens carousel is the gallery.
  gallery: null,
  screens: {
    kind: "placeholder",
    label: "Screenshots coming: sign-in, sets list, a set, the study card, the widget",
    aspect: "9/19.5",
    count: 4,
  },
  video: {
    kind: "placeholder",
    label: "Optional 20 s screen recording: create a set, add a card, flip it",
    aspect: "9/19.5",
  },
  tech: ["Swift", "SwiftUI", "WidgetKit", "Firebase Auth"],
  repo: null,
  // Kalp, 2026-09-18: the public page is the short "under construction"
  // placeholder only, so this content stays a draft until he says otherwise.
  draft: true,
  status:
    "Under construction: not much built yet · Repository private until a committed Firebase config file is removed · App Store: no",
  wanted: [
    "5 iPhone screenshots (sign-in, sets list, one set, study card, widget on the home screen)",
    "decide H4: make the repo public after removing GoogleService-Info.plist from its history",
  ],
};

export default flashcards;

import { describe, it, expect, beforeAll } from "vitest";
import { act } from "react";
import { fixtureVfs } from "@/lib/vfs.fixture";
import { render } from "@/test/render";
import AboutWindow from "./AboutWindow";
import ContactWindow from "./ContactWindow";
import HobbiesWindow from "./HobbiesWindow";
import TrashWindow from "./TrashWindow";
import MusicWindow from "./MusicWindow";
import TerminalWindow from "./TerminalWindow";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const site = {
  name: "Kalp Kansara",
  note: "Everything on this desk shipped.",
  tagline: "Western University.",
  resumeUrl: "",
  photo: "",
  nowPlaying: { title: "", artist: "" },
  contact: { email: "", github: "", linkedin: "" },
};

describe("the small windows", () => {
  it("About shows the name, tagline, note; no contact row and no résumé while empty", () => {
    const { container, unmount } = render(<AboutWindow site={site} />);
    expect(container.textContent).toContain("Kalp Kansara");
    expect(container.textContent).toContain("Western University.");
    expect(container.textContent).toContain("Everything on this desk shipped.");
    expect(container.querySelector("a")).toBeNull();
    unmount();
  });

  it("About links the résumé and the contacts once set", () => {
    const { container, unmount } = render(
      <AboutWindow site={{ ...site, resumeUrl: "https://x/cv.pdf", contact: { email: "k@x.com", github: "", linkedin: "" } }} />,
    );
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://x/cv.pdf", "mailto:k@x.com"]);
    unmount();
  });

  it("Contact renders an empty state with no links while every field is empty", () => {
    const { container, unmount } = render(<ContactWindow contact={site.contact} name={site.name} />);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("No contact details filed yet");
    unmount();
  });

  it("Contact renders mail-style rows for the set fields only", () => {
    const { container, unmount } = render(
      <ContactWindow contact={{ email: "", github: "KalpKan", linkedin: "kalp" }} name={site.name} />,
    );
    expect(container.textContent).not.toContain("mailto");
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://github.com/KalpKan", "https://www.linkedin.com/in/kalp"]);
    unmount();
  });

  it("Hobbies is the empty state", () => {
    const { container, unmount } = render(<HobbiesWindow />);
    expect(container.textContent).toContain("Nothing filed yet");
    unmount();
  });

  it("Trash lists the two scrapped coinflip repos with links", () => {
    const { container, unmount } = render(<TrashWindow />);
    expect(container.textContent).toContain("Scrapped ideas");
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "https://github.com/KalpKan/token-gamble-coinflip",
      "https://github.com/KalpKan/token-coinflip",
    ]);
    unmount();
  });

  it("Music shows the track or 'Nothing playing'", () => {
    const a = render(<MusicWindow nowPlaying={{ title: "", artist: "" }} />);
    expect(a.container.textContent).toContain("Nothing playing right now");
    a.unmount();
    const b = render(<MusicWindow nowPlaying={{ title: "Bloom", artist: "Radiohead" }} />);
    expect(b.container.textContent).toContain("Bloom");
    expect(b.container.textContent).toContain("Radiohead");
    b.unmount();
  });

  it("Terminal is its own component (TerminalWindow.test.tsx); it mounts with a labelled input and a log", async () => {
    const { container, unmount } = render(
      <TerminalWindow tiles={[]} signals={{}} onOpenCase={() => {}} onClose={() => {}} loadRoot={async () => fixtureVfs()} />,
    );
    await act(async () => {});
    expect(container.querySelector('input[aria-label="Terminal command"]')).not.toBeNull();
    expect(container.querySelector('[role="log"]')!.textContent).toContain("Welcome to KalpOS");
    unmount();
  });
});

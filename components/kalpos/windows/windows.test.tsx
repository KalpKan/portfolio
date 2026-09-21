import { describe, it, expect, beforeAll } from "vitest";
import { act } from "react";
import { SITE } from "@/lib/site";
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
  note: "Open a folder.",
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
    expect(container.textContent).toContain("Open a folder.");
    expect(container.querySelector("a")).toBeNull();
    unmount();
  });

  it("About shows the portrait beside the bio once set, with Kalp's name as alt, and nothing while empty", () => {
    const empty = render(<AboutWindow site={site} />);
    expect(empty.container.querySelector("img")).toBeNull();
    empty.unmount();
    const { container, unmount } = render(<AboutWindow site={{ ...site, portrait: "/images/kalp/about.webp" }} />);
    const img = container.querySelector("img.kos-about-portrait")!;
    expect(img.getAttribute("src")).toBe("/images/kalp/about.webp");
    expect(img.getAttribute("alt")).toBe("Kalp Kansara");
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

  it("Contact shows Kalp's real email, GitHub and LinkedIn as clickable links (SITE, T6.9)", () => {
    const { container, unmount } = render(<ContactWindow contact={SITE.contact} name={SITE.name} />);
    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "mailto:Kalpkansara123@gmail.com",
      "https://github.com/KalpKan",
      "https://www.linkedin.com/in/kalp-kansara123/",
    ]);
    expect(links.map((a) => a.textContent)).toEqual(["Kalpkansara123@gmail.com", "github.com/KalpKan", "LinkedIn"]);
    // The address is public on purpose; the two off-site links do not leak the referrer.
    expect(links.slice(1).map((a) => a.getAttribute("rel"))).toEqual(["noreferrer", "noreferrer"]);
    expect([...container.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["To", "GitHub", "LinkedIn"]);
    unmount();
  });

  it("About shows the same three contacts in its row, with rel=noreferrer off-site", () => {
    const { container, unmount } = render(<AboutWindow site={{ ...site, contact: SITE.contact }} />);
    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "mailto:Kalpkansara123@gmail.com",
      "https://github.com/KalpKan",
      "https://www.linkedin.com/in/kalp-kansara123/",
    ]);
    expect(links.slice(1).every((a) => a.getAttribute("rel") === "noreferrer")).toBe(true);
    unmount();
  });

  it("Hobbies is the empty state while nothing is filed", () => {
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

  it("Music shows the songs or 'Nothing playing' (the app itself is MusicWindow.test.tsx)", () => {
    const a = render(<MusicWindow playlist={[]} />);
    expect(a.container.textContent).toContain("Nothing playing right now");
    a.unmount();
    const b = render(<MusicWindow playlist={[{ title: "Bloom", artist: "Radiohead" }]} />);
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

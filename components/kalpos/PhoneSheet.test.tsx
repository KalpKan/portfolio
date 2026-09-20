import { describe, it, expect, vi, beforeAll } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { click, render } from "@/test/render";
import PhoneSheet from "./PhoneSheet";
import { loadProjects } from "@/lib/projects";
import { tilesFor } from "@/lib/tiles";
import { initialSignals } from "@/lib/signal";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const tiles = tilesFor(loadProjects());
const site = {
  name: "Kalp Kansara",
  note: "Western University. I build things that measure something real.",
  tagline: "Western University.",
  resumeUrl: "",
  photo: "",
  nowPlaying: { title: "", artist: "" },
  contact: { email: "", github: "", linkedin: "" },
};

function mount(over: Partial<React.ComponentProps<typeof PhoneSheet>> = {}) {
  const onOpenCase = vi.fn();
  const r = render(<PhoneSheet tiles={tiles} signals={initialSignals(tiles)} site={site} onOpenCase={onOpenCase} checkedAt={null} {...over} />);
  return { ...r, onOpenCase };
}

describe("Phone sheet (card 1e)", () => {
  it("has the top bar, the name, the count line and the folders (Music only when a track is set)", () => {
    const { container, unmount } = mount();
    expect(container.querySelector(".kos-phone-bar")?.textContent).toContain("KalpOS");
    expect(container.querySelector(".kos-phone-name")?.textContent).toBe("Kalp Kansara");
    expect(container.querySelector(".kos-phone-line")?.textContent).toBe("Tap a folder. 12 projects, checking for live signals…");
    const folders = [...container.querySelectorAll(".kos-phone-grid button")].map((b) => b.textContent?.trim());
    expect(folders).toEqual(["12Projects", "Hobbies", "About", "@Contact", ">_Terminal", "Trash"]);
    expect(container.querySelector(".kos-phone-note")?.textContent).toContain("measure something real");
    unmount();
  });

  it("shows the measured live count once the checks are done", () => {
    const sig = Object.fromEntries(tiles.map((t) => [t.slug, t.healthUrl ? "ok" : "none"])) as Record<string, "ok" | "none">;
    const { container, unmount } = mount({ signals: sig, checkedAt: new Date() });
    expect(container.querySelector(".kos-phone-line")?.textContent).toBe("Tap a folder. 12 projects, 7 with a live signal right now.");
    unmount();
  });

  it("opens with the Projects sheet listing one row per tile with its status word", () => {
    const { container, unmount } = mount();
    const sheet = container.querySelector(".kos-sheet")!;
    expect(sheet.querySelector(".kos-sheet-head")?.textContent).toContain("Projects");
    expect(sheet.querySelector(".kos-sheet-head")?.textContent).toContain("12 items · 7 live");
    const rows = sheet.querySelectorAll(".kos-row");
    expect(rows.length).toBe(12);
    expect(rows[0].textContent).toContain("promptflip");
    expect(rows[0].textContent).toContain("checking…");
    unmount();
  });

  it("a case-study row asks to open the case sheet; Hobbies opens a full-height sheet", () => {
    const { container, onOpenCase, unmount } = mount();
    click([...container.querySelectorAll(".kos-sheet .kos-row")].find((r) => r.textContent?.includes("UnPark"))!);
    expect(onOpenCase).toHaveBeenCalledWith("unpark");
    click([...container.querySelectorAll(".kos-phone-grid button")].find((b) => b.textContent?.includes("Hobbies"))!);
    expect(container.querySelector('.kos-sheet[role="dialog"]')?.getAttribute("aria-label")).toBe("Hobbies");
    expect(container.textContent).toContain("Nothing filed yet");
    unmount();
  });
});

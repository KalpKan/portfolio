import { afterEach, beforeEach, describe, it, expect, vi, beforeAll } from "vitest";
import { act } from "react";
import { MS } from "@/lib/motion";

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
    expect(folders).toEqual(["12Projects", "Hobbies", "About", "Contact", ">_Terminal", "Trash"]);
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

  it("the ■ KalpOS in the top bar is the KalpOS menu: About opens the About sheet, Lock Screen and Restart… reach the desk", () => {
    const onLock = vi.fn();
    const onRestart = vi.fn();
    const { container, unmount } = mount({ onLock, onRestart });
    const brand = container.querySelector<HTMLButtonElement>('.kos-phone-bar button[aria-haspopup="menu"]')!;
    expect(brand.textContent).toBe("KalpOS");
    click(brand);
    const row = (label: string) => [...container.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((i) => i.textContent?.includes(label))!;
    click(row("About KalpOS"));
    expect(container.querySelector('.kos-sheet[role="dialog"]')?.getAttribute("aria-label")).toBe("About");
    click(brand);
    click(row("Lock Screen"));
    expect(onLock).toHaveBeenCalledTimes(1);
    click(brand);
    click(row("Restart…"));
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="menu"]')).toBeNull();
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

  describe("closing a sheet is a plain slide-down (2026-09-20)", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("Hobbies → close: the sheet keeps its title and slides to 100% first, then the Projects sheet peeks back", () => {
      const { container, unmount } = mount();
      click([...container.querySelectorAll(".kos-phone-grid button")].find((b) => b.textContent?.includes("Hobbies"))!);
      const sheet = container.querySelector<HTMLElement>(".kos-sheet")!;
      expect(sheet.style.getPropertyValue("--sheet-y")).toBe("30px");
      click(sheet.querySelector(".kos-sheet-close")!);
      // still Hobbies, now off the bottom: no content swap mid-slide
      expect(sheet.getAttribute("aria-label")).toBe("Hobbies");
      expect(sheet.style.getPropertyValue("--sheet-y")).toBe("100%");
      act(() => { vi.advanceTimersByTime(MS.sheet + 1); });
      expect(sheet.getAttribute("aria-label")).toBe("Projects");
      expect(sheet.style.getPropertyValue("--sheet-y")).toContain("calc(100% - ");
      unmount();
    });

    it("Escape on a case sheet does the same and tells the desk once", () => {
      const onCloseCase = vi.fn();
      const { container, unmount } = mount({ initialCase: "unpark", onCloseCase });
      const sheet = container.querySelector<HTMLElement>(".kos-sheet")!;
      expect(sheet.getAttribute("aria-label")).toContain("UnPark");
      act(() => { sheet.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
      act(() => { sheet.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
      expect(sheet.style.getPropertyValue("--sheet-y")).toBe("100%");
      act(() => { vi.advanceTimersByTime(MS.sheet + 1); });
      expect(onCloseCase).toHaveBeenCalledTimes(1);
      expect(sheet.getAttribute("aria-label")).toBe("Projects");
      unmount();
    });
  });
});

describe("Phone: the personal shelves (T6.9)", () => {
  const reading = [{ title: "The Molecule of More", authors: "Lieberman & Long", cover: "/images/reading/molecule-of-more.jpg", url: "https://openlibrary.org/isbn/9781946885111" }];
  const hobbies = [{ slug: "swimming" as const, name: "Swimming", line: "I love swimming." }];

  it("has a READING row under the note that opens the Reading sheet", () => {
    const { container, unmount } = mount({ site: { ...site, reading } });
    const row = container.querySelector<HTMLButtonElement>(".kos-phone-scroll button.kos-reading")!;
    expect(row).not.toBeNull();
    expect(row.textContent).toContain("The Molecule of More");
    click(row);
    expect(container.querySelector(".kos-sheet-head b")?.textContent).toBe("Reading");
    expect(container.querySelector(".kos-sheet-body img.kos-book")?.getAttribute("alt")).toBe("The Molecule of More book cover");
    unmount();
  });

  it("has no READING row while the reading list is empty", () => {
    const { container, unmount } = mount();
    expect(container.querySelector(".kos-reading")).toBeNull();
    unmount();
  });

  it("opens the Hobbies sheet with the drawn list, and badges the folder", () => {
    const { container, unmount } = mount({ site: { ...site, hobbies } });
    const folders = [...container.querySelectorAll(".kos-phone-grid button")];
    expect(folders[1].textContent?.trim()).toBe("01Hobbies");
    click(folders[1] as HTMLButtonElement);
    expect(container.querySelector(".kos-sheet-head b")?.textContent).toBe("Hobbies");
    expect(container.querySelector(".kos-sheet-body .kos-hobbies b")?.textContent).toBe("Swimming");
    expect(container.querySelector(".kos-sheet-body .kos-hobby-glyph svg")).not.toBeNull();
    unmount();
  });
});

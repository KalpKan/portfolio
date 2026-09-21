import { describe, it, expect, vi, beforeAll } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { click, render, setValue } from "@/test/render";
import ProjectsWindow from "./ProjectsWindow";
import { loadProjects } from "@/lib/projects";
import { tilesFor } from "@/lib/tiles";
import { initialSignals } from "@/lib/signal";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const tiles = tilesFor(loadProjects());

function mount(over: Partial<React.ComponentProps<typeof ProjectsWindow>> = {}) {
  const onOpenCase = vi.fn();
  const r = render(<ProjectsWindow tiles={tiles} signals={initialSignals(tiles)} onOpenCase={onOpenCase} checkedAt={null} {...over} />);
  return { ...r, onOpenCase };
}

describe("Projects window (card 2d)", () => {
  it("lists the five filters with real counts and the header count", () => {
    const { container, unmount } = mount();
    const rows = [...container.querySelectorAll(".kos-filter")].map((b) => b.textContent);
    expect(rows).toEqual(["All13", "Live signal8", "Hardware5", "Case studies5", "Coming2"]);
    expect(container.querySelector(".kos-main-count")?.textContent).toBe("13 items, 8 live");
    expect(container.querySelector(".kos-sidebar-foot")?.textContent).toContain("checking");
    unmount();
  });

  it("filters the grid when a sidebar row is pressed", () => {
    const { container, unmount } = mount();
    click([...container.querySelectorAll(".kos-filter")][4]);
    const names = [...container.querySelectorAll(".kos-tile-name")].map((n) => n.textContent);
    expect(names).toEqual(["FlashCards", "DIY EEG"]);
    expect(container.querySelectorAll(".kos-tile-art--coming").length).toBe(2);
    unmount();
  });

  it("draws the trace on a tile whose signal is ok and the ○ while checking", () => {
    const { container, unmount } = mount({ signals: { ...initialSignals(tiles), promptflip: "ok" } });
    const live = [...container.querySelectorAll(".kos-tile")].find((t) => t.textContent?.includes("promptflip"))!;
    expect(live.querySelector("path.trace")).not.toBeNull();
    expect(live.querySelector(".kos-tile-status")?.textContent).toBe("Live signal");
    expect(live.getAttribute("href")).toBe("https://promptflip.kalpkan.com");
    expect(live.getAttribute("target")).toBe("_blank");
    const checking = [...container.querySelectorAll(".kos-tile")].find((t) => t.textContent?.includes("Plato"))!;
    expect(checking.querySelector(".kos-mark-check")).not.toBeNull();
    expect(checking.querySelector(".kos-tile-status")?.textContent).toBe("Checking…");
    unmount();
  });

  it("a case-study tile is a button that asks to open the case window", () => {
    const { container, onOpenCase, unmount } = mount();
    const t = [...container.querySelectorAll("button.kos-tile")].find((b) => b.textContent?.includes("Automatic RC Car"))!;
    expect(t.querySelector(".kos-mark-case")).not.toBeNull();
    click(t);
    expect(onOpenCase).toHaveBeenCalledWith("rc-car", expect.anything());
    unmount();
  });

  it("search narrows by name, tagline or tag", () => {
    const { container, unmount } = mount();
    setValue(container.querySelector<HTMLInputElement>(".kos-search")!, "kicad");
    const names = [...container.querySelectorAll(".kos-tile-name")].map((n) => n.textContent);
    expect(names).toEqual(["Porsche PCB keychain", "DIY EEG"]);
    unmount();
  });

  it("reports the ping line once every check has answered", () => {
    const sig = Object.fromEntries(tiles.map((t) => [t.slug, t.healthUrl ? "ok" : "none"])) as Record<string, "ok" | "none">;
    const { container, unmount } = mount({ signals: sig, checkedAt: new Date(2026, 8, 19, 11, 42, 6) });
    expect(container.querySelector(".kos-sidebar-foot")?.textContent).toBe("pinged 11:42:06 · 8/8 ok");
    unmount();
  });
});

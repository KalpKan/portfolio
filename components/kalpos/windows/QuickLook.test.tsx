import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { act } from "react";

vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { track } from "@/lib/track";
import { click, fire, render } from "@/test/render";
import ProjectsWindow from "./ProjectsWindow";
import { GRID_COLUMNS, moveIndex, quickLookVerb } from "./QuickLook";
import { loadProjects } from "@/lib/projects";
import { tilesFor, type Tile } from "@/lib/tiles";
import { initialSignals } from "@/lib/signal";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
beforeEach(() => {
  vi.mocked(track).mockClear();
});

const tiles = tilesFor(loadProjects());

function mount(over: Partial<React.ComponentProps<typeof ProjectsWindow>> = {}) {
  const onOpenCase = vi.fn();
  const r = render(<ProjectsWindow tiles={tiles} signals={initialSignals(tiles)} onOpenCase={onOpenCase} checkedAt={null} {...over} />);
  const cells = () => [...r.container.querySelectorAll<HTMLElement>("li[data-slug]")];
  const panel = () => r.container.querySelector<HTMLElement>(".kos-ql");
  const focusTile = (i: number) => {
    const el = cells()[i].querySelector<HTMLElement>("a.kos-tile, button.kos-tile") ?? cells()[i];
    act(() => el.focus());
    return el;
  };
  const key = (k: string) => fire(document.activeElement!, "keydown", { key: k });
  return { ...r, onOpenCase, cells, panel, focusTile, key };
}

/** Wait for the content module the panel imports on demand (up to 2 s). */
async function until(f: () => boolean) {
  for (let i = 0; i < 40 && !f(); i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
  }
}

describe("moveIndex (the arrow-key model)", () => {
  it("steps one tile sideways and one row up or down, stopping at the edges", () => {
    expect(GRID_COLUMNS).toBe(3);
    expect(moveIndex("ArrowRight", 0, 12)).toBe(1);
    expect(moveIndex("ArrowLeft", 0, 12)).toBe(0);
    expect(moveIndex("ArrowDown", 0, 12)).toBe(3);
    expect(moveIndex("ArrowUp", 1, 12)).toBe(0);
    expect(moveIndex("ArrowDown", 10, 12)).toBe(11);
    expect(moveIndex("ArrowRight", 11, 12)).toBe(11);
    expect(moveIndex("Enter", 4, 12)).toBeNull();
    expect(moveIndex("ArrowRight", 0, 0)).toBeNull();
  });
});

describe("quickLookVerb", () => {
  const t = (over: Partial<Tile>): Tile => ({ ...tiles[0], ...over });
  it("Open for a live app, Read for a case study, Coming otherwise", () => {
    expect(quickLookVerb(t({ kind: "live", href: "https://x" }))).toBe("Open");
    expect(quickLookVerb(t({ kind: "case", href: "/projects/x" }))).toBe("Read");
    expect(quickLookVerb(t({ kind: "coming", href: "https://github.com/x" }))).toBe("Coming");
    expect(quickLookVerb(t({ kind: "coming", href: null }))).toBe("Coming");
  });
});

describe("Quick Look in the Projects window", () => {
  it("is closed until Space is pressed on a focused tile, then shows that tile", () => {
    const { panel, focusTile, key, container, unmount } = mount();
    expect(panel()).toBeNull();
    focusTile(0);
    const ev = key(" ");
    expect(ev.defaultPrevented).toBe(true);
    expect(panel()?.dataset.slug).toBe("promptflip");
    expect(panel()?.querySelector(".kos-ql-name")?.textContent).toBe("promptflip");
    expect(panel()?.querySelector(".kos-ql-tagline")?.textContent).toBe(tiles[0].tagline);
    expect([...panel()!.querySelectorAll(".kos-ql-tags li")].map((n) => n.textContent)).toEqual(tiles[0].tags);
    expect(container.querySelector<HTMLElement>('li[data-previewed="true"]')?.dataset.slug).toBe("promptflip");
    expect(track).toHaveBeenCalledWith("quicklook_opened", { slug: "promptflip" });
    unmount();
  });

  it("shows the app's hero screenshot lazily, and the Open button goes where the tile goes", () => {
    const { panel, focusTile, key, unmount } = mount();
    focusTile(0);
    key(" ");
    const img = panel()?.querySelector<HTMLImageElement>("img.kos-ql-img");
    expect(img?.getAttribute("src")).toContain(encodeURIComponent("/images/projects/promptflip/hero.webp"));
    expect(img?.getAttribute("loading")).toBe("lazy");
    const open = panel()?.querySelector<HTMLAnchorElement>(".kos-ql-action");
    expect(open?.textContent).toBe("Open");
    expect(open?.getAttribute("href")).toBe("https://promptflip.kalpkan.com");
    expect(open?.getAttribute("target")).toBe("_blank");
    click(open!);
    expect(track).toHaveBeenCalledWith("project_card_clicked", { slug: "promptflip", type: "app", kind: "live" });
    unmount();
  });

  it("Space again closes it, Esc closes it without reaching the window", () => {
    const { panel, focusTile, key, unmount } = mount();
    focusTile(0);
    key(" ");
    expect(panel()).not.toBeNull();
    key(" ");
    expect(panel()).toBeNull();
    key(" ");
    expect(panel()).not.toBeNull();
    let reachedWindow = false;
    const spy = () => {
      reachedWindow = true;
    };
    document.addEventListener("keydown", spy);
    const ev = key("Escape");
    document.removeEventListener("keydown", spy);
    expect(panel()).toBeNull();
    expect(ev.defaultPrevented).toBe(true);
    expect(reachedWindow).toBe(false);
    unmount();
  });

  it("arrow keys move focus between tiles and the open panel follows", () => {
    const { cells, panel, focusTile, key, unmount } = mount();
    focusTile(0);
    key(" ");
    key("ArrowRight");
    expect(document.activeElement?.closest("li")?.dataset.slug).toBe(cells()[1].dataset.slug);
    expect(panel()?.dataset.slug).toBe(cells()[1].dataset.slug);
    key("ArrowDown");
    expect(panel()?.dataset.slug).toBe(cells()[4].dataset.slug);
    key("ArrowLeft");
    expect(panel()?.dataset.slug).toBe(cells()[3].dataset.slug);
    key("ArrowUp");
    expect(panel()?.dataset.slug).toBe(cells()[0].dataset.slug);
    key("ArrowUp");
    expect(panel()?.dataset.slug).toBe(cells()[0].dataset.slug);
    expect(vi.mocked(track).mock.calls.filter((c) => c[0] === "quicklook_opened").map((c) => (c[1] as { slug: string }).slug)).toEqual([
      cells()[0].dataset.slug,
      cells()[1].dataset.slug,
      cells()[4].dataset.slug,
      cells()[3].dataset.slug,
      cells()[0].dataset.slug,
    ]);
    unmount();
  });

  it("arrow keys move focus while it is closed, without opening it", () => {
    const { cells, panel, focusTile, key, unmount } = mount();
    focusTile(2);
    key("ArrowDown");
    expect(document.activeElement?.closest("li")?.dataset.slug).toBe(cells()[5].dataset.slug);
    expect(panel()).toBeNull();
    expect(track).not.toHaveBeenCalled();
    unmount();
  });

  it("the ⓘ on a tile opens the panel for that tile and toggles it off", () => {
    const { cells, panel, unmount } = mount();
    const info = cells()[2].querySelector<HTMLButtonElement>(".kos-ql-btn")!;
    expect(info.getAttribute("aria-label")).toBe(`Quick Look: ${tiles[2].name}`);
    click(info);
    expect(panel()?.dataset.slug).toBe(tiles[2].slug);
    expect(info.getAttribute("aria-pressed")).toBe("true");
    click(info);
    expect(panel()).toBeNull();
    click(info);
    click(panel()!.querySelector(".kos-ql-close")!);
    expect(panel()).toBeNull();
    unmount();
  });

  it("a case-study tile shows its content hero and Read opens the case window", async () => {
    const { cells, panel, focusTile, key, onOpenCase, unmount } = mount();
    const i = cells().findIndex((c) => c.dataset.slug === "rc-car");
    focusTile(i);
    key(" ");
    expect(panel()?.querySelector(".kos-ql-action")?.textContent).toBe("Read");
    await until(() => panel()?.querySelector("img.kos-ql-img") !== null);
    const img = panel()?.querySelector<HTMLImageElement>("img.kos-ql-img");
    expect(img).not.toBeNull();
    expect(decodeURIComponent(img?.getAttribute("src") ?? "")).toContain("floor-run");
    expect(img?.getAttribute("loading")).toBe("lazy");
    click(panel()!.querySelector(".kos-ql-action")!);
    expect(onOpenCase).toHaveBeenCalledWith("rc-car", expect.anything());
    expect(track).toHaveBeenCalledWith("project_card_clicked", { slug: "rc-car", type: "showcase", kind: "case" });
    unmount();
  });

  it("a coming tile says Coming and has no link", () => {
    const { cells, panel, focusTile, key, unmount } = mount();
    const i = cells().findIndex((c) => c.dataset.slug === "eeg");
    focusTile(i);
    key(" ");
    const action = panel()?.querySelector(".kos-ql-action");
    expect(action?.textContent).toBe("Coming");
    expect(action?.tagName).toBe("SPAN");
    expect(panel()?.querySelector(".kos-tile-art--coming")).not.toBeNull();
    unmount();
  });

  it("closes when a filter hides the previewed tile", () => {
    const { container, panel, focusTile, key, unmount } = mount();
    focusTile(0);
    key(" ");
    expect(panel()).not.toBeNull();
    click([...container.querySelectorAll(".kos-filter")][4]);
    expect(panel()).toBeNull();
    unmount();
  });
});

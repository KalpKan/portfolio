import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { act } from "react";
import { click, fire, installPointerCapture, realClick, render } from "@/test/render";
import KalpOS from "./KalpOS";
import { loadProjects } from "@/lib/projects";
import { VISITED_KEY } from "@/lib/visitor";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom has no matchMedia; the desk breakpoint and reduced-motion query read it.
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-kos-boot");
});

const projects = loadProjects();

describe("KalpOS boot", () => {
  it("starts on the lock screen with the desk rendered underneath, and unlocks on Enter", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("lock");
    expect(container.querySelector(".kos-lock")).not.toBeNull();
    expect(container.querySelector(".kos-desk")).not.toBeNull();
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    // The pill pulses for 400 ms before the lock blurs out.
    expect(root.getAttribute("data-stage")).toBe("lock");
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(root.getAttribute("data-stage")).toBe("unlocking");
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(root.getAttribute("data-stage")).toBe("desk");
    expect(localStorage.getItem(VISITED_KEY)).toBe("1");
    expect(container.querySelector(".kos-lock")).toBeNull();
    vi.useRealTimers();
    unmount();
  });

  it("skips the lock for a returning visitor (the pre-paint attribute) with a crossfade", () => {
    document.documentElement.setAttribute("data-kos-boot", "desk");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("desk");
    expect(root.getAttribute("data-boot")).toBe("crossfade");
    unmount();
  });

  it("renders the desk with the case-study window already open for a deep link", () => {
    const { container, unmount } = render(
      <KalpOS projects={projects} skipLock initialWindow="case:rc-car" initialBody={<p id="deep">body</p>} />,
    );
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("desk");
    expect(container.querySelector(".kos-lock")).toBeNull();
    expect(container.querySelector('[role="dialog"] #deep')).not.toBeNull();
    unmount();
  });
});

describe("KalpOS windows with a real pointer (the browser's pointer-capture path)", () => {
  beforeAll(installPointerCapture);

  const icon = (c: Element, label: string) => [...c.querySelectorAll("button.kos-icon")].find((b) => b.textContent?.includes(label))!;

  it("one click on Projects opens the window; a held click on the red light closes it", () => {
    const { container, unmount } = render(<KalpOS projects={projects} skipLock />);
    realClick(icon(container, "Projects"));
    expect(container.querySelector('[role="dialog"][data-window="projects"]')).not.toBeNull();
    realClick(container.querySelector(".kos-light--close")!);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    unmount();
  });

  it("the yellow light minimises into the dock tile (running dot stays), and the tile restores it", () => {
    const { container, unmount } = render(<KalpOS projects={projects} skipLock />);
    realClick(icon(container, "Projects"));
    realClick(container.querySelector(".kos-light--min")!);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const tile = container.querySelector(".kos-dock-item--finder")!;
    expect(tile.querySelector(".kos-dock-dot")).not.toBeNull();
    realClick(tile);
    expect(container.querySelector('[role="dialog"][data-window="projects"]')).not.toBeNull();
    unmount();
  });

  it("the green light zooms the window and a second click restores it", () => {
    const { container, unmount } = render(<KalpOS projects={projects} skipLock />);
    realClick(icon(container, "Projects"));
    const dlg = container.querySelector<HTMLElement>('[role="dialog"]')!;
    realClick(container.querySelector(".kos-light--zoom")!);
    expect(dlg.style.width).toBe("calc(100vw - 24px)");
    realClick(container.querySelector(".kos-light--zoom")!);
    expect(dlg.style.width).toBe("760px");
    unmount();
  });

  it("the second click of a double-click on an icon (within 400 ms) is ignored: the window opens once and stays open", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<KalpOS projects={projects} skipLock />);
    const about = icon(container, "About me");
    click(about);
    act(() => {
      vi.advanceTimersByTime(120);
    });
    click(about);
    const dialogs = container.querySelectorAll('[role="dialog"]');
    expect(dialogs.length).toBe(1);
    // A later click (past 400 ms) still counts: it focuses the same window, never closes it.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    click(about);
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(1);
    vi.useRealTimers();
    unmount();
  });
});

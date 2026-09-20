import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { act } from "react";
import { fire, render } from "@/test/render";
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

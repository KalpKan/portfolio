import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { act } from "react";
import { click, fire, installPointerCapture, realClick, render } from "@/test/render";
import KalpOS from "./KalpOS";
import { loadProjects } from "@/lib/projects";
import { track } from "@/lib/track";
import { _resetChimeForTests, setMuted } from "@/lib/chime";

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

/* A fake AudioContext: suspended until the test says a gesture happened (`made.gestured`), as browsers do. */
function fakeAudio(state: "running" | "suspended") {
  const made: { started: number[]; gestured: boolean } = { started: [], gestured: false };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  class Ctx {
    state = state;
    currentTime = 1;
    destination = { connect() {} };
    createOscillator() { return { type: "sine", frequency: param(), detune: param(), connect() {}, start: (t: number) => made.started.push(t), stop() {} }; }
    createGain() { return { gain: param(), connect() {} }; }
    createBiquadFilter() { return { type: "lowpass", frequency: param(), connect() {} }; }
    async resume() { if (made.gestured) this.state = "running"; }
  }
  (window as unknown as { AudioContext: unknown }).AudioContext = Ctx;
  return made;
}

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });

describe("KalpOS boot → lock → desk (cards 2a, 3b, 3c)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetChimeForTests();
    fakeAudio("suspended");
    (track as ReturnType<typeof vi.fn>).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a plain visit shows the boot (mark + hairline) over a hidden lock; the hairline is the health round; the lock appears once every check answered and 900 ms passed", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(container.querySelector(".kos-boot-mark")?.textContent).toBe("KK");
    expect(container.querySelector(".kos-lock")).not.toBeNull();
    const fill = container.querySelector<HTMLElement>(".kos-boot-line i")!;
    // Hydrated: the registry step is done, seven health checks are not.
    expect(fill.style.transform).toBe("scaleX(0.125)");
    await flush();
    expect(fill.style.transform).toBe("scaleX(1)");
    act(() => { vi.advanceTimersByTime(800); });
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(100); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    act(() => { vi.advanceTimersByTime(600); });
    expect(root.getAttribute("data-stage")).toBe("lock");
    expect(container.querySelector(".kos-boot")).toBeNull();
    expect(container.querySelector(".kos-lock")).not.toBeNull();
    unmount();
  });

  it("a slow health endpoint cannot hold the boot past 3 s", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    act(() => { vi.advanceTimersByTime(2900); });
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(100); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    expect(container.querySelector<HTMLElement>(".kos-boot-line i")!.style.transform).toBe("scaleX(1)");
    unmount();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
  });

  it("a returning visitor boots and locks again: the old localStorage flag means nothing", () => {
    localStorage.setItem("kalpos:visited", "1");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("boot");
    unmount();
  });

  it("unlocks on Enter: pulse 400 ms, unlocking 900 ms, desk", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    await flush();
    act(() => { vi.advanceTimersByTime(1500); });
    expect(root.getAttribute("data-stage")).toBe("lock");
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    expect(root.getAttribute("data-stage")).toBe("lock");
    act(() => { vi.advanceTimersByTime(400); });
    expect(root.getAttribute("data-stage")).toBe("unlocking");
    expect(root.getAttribute("data-boot")).toBe("animate");
    act(() => { vi.advanceTimersByTime(900); });
    expect(root.getAttribute("data-stage")).toBe("desk");
    expect(container.querySelector(".kos-lock")).toBeNull();
    expect(localStorage.getItem("kalpos:visited")).toBeNull();
    unmount();
  });

  it("with reduced motion the boot ends at once and crossfades to the lock in 400 ms", () => {
    window.matchMedia = ((q: string) => ({
      matches: q.includes("reduced-motion"),
      media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(root.getAttribute("data-leaving")).toBe("true");
    act(() => { vi.advanceTimersByTime(400); });
    expect(root.getAttribute("data-stage")).toBe("lock");
    unmount();
    window.matchMedia = ((q: string) => ({
      matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  });

  it("?desk (the pre-paint attribute) skips boot and lock with a crossfade", () => {
    document.documentElement.setAttribute("data-kos-boot", "desk");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("desk");
    expect(root.getAttribute("data-boot")).toBe("crossfade");
    expect(container.querySelector(".kos-boot")).toBeNull();
    unmount();
  });

  it("a deep link renders the desk with the case-study window open, no boot, no lock", () => {
    const { container, unmount } = render(
      <KalpOS projects={projects} skipLock initialWindow="case:rc-car" initialBody={<p id="deep">body</p>} />,
    );
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("desk");
    expect(container.querySelector(".kos-boot")).toBeNull();
    expect(container.querySelector(".kos-lock")).toBeNull();
    expect(container.querySelector('[role="dialog"] #deep')).not.toBeNull();
    unmount();
  });
});

describe("the startup chime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetChimeForTests();
    localStorage.clear();
    (track as ReturnType<typeof vi.fn>).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function toLock(container: Element) {
    await flush();
    act(() => { vi.advanceTimersByTime(1500); });
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("lock");
  }

  it("plays on the unlock gesture, 400 ms later (with the blur-out), and reports chime_played {at: unlock}", async () => {
    const made = fakeAudio("suspended");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toLock(container);
    expect(track).not.toHaveBeenCalledWith("chime_played", expect.anything());
    made.gestured = true;
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    await flush();
    expect(made.started[0]).toBeCloseTo(1.4, 3);
    expect(track).toHaveBeenCalledWith("chime_played", { at: "unlock" });
    unmount();
  });

  it("plays at the boot mark when the tab already allows audio, and then not again on unlock", async () => {
    const made = fakeAudio("running");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await flush();
    expect(made.started.length).toBeGreaterThan(0);
    expect(track).toHaveBeenCalledWith("chime_played", { at: "boot" });
    await toLock(container);
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    await flush();
    expect((track as ReturnType<typeof vi.fn>).mock.calls.filter(([e]) => e === "chime_played").length).toBe(1);
    unmount();
  });

  it("stays silent when muted", async () => {
    const made = fakeAudio("running");
    setMuted(true);
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toLock(container);
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    await flush();
    expect(made.started.length).toBe(0);
    expect(track).not.toHaveBeenCalledWith("chime_played", expect.anything());
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

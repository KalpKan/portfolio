import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { act } from "react";
import { click, fire, installPointerCapture, realClick, render, setValue } from "@/test/render";
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
    expect(container.querySelector(".kos")!.getAttribute("data-chime")).toBe("unlock");
    unmount();
  });

  it("plays at the boot mark when the tab already allows audio, and then not again on unlock", async () => {
    const made = fakeAudio("running");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await flush();
    expect(made.started.length).toBeGreaterThan(0);
    expect(track).toHaveBeenCalledWith("chime_played", { at: "boot" });
    expect(container.querySelector(".kos")!.getAttribute("data-chime")).toBe("boot");
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
    expect(container.querySelector(".kos")!.getAttribute("data-chime")).toBeNull();
    unmount();
  });
});

describe("Lock Screen and Restart (the KalpOS menu, ⌘L / ⌃⌘R, the terminal)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetChimeForTests();
    // Audio already allowed in this tab: the chime sounds at the boot mark, so a restart's second chime is countable.
    fakeAudio("running");
    (track as ReturnType<typeof vi.fn>).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const chimes = () => (track as ReturnType<typeof vi.fn>).mock.calls.filter(([e]) => e === "chime_played").length;
  const stageOf = (c: Element) => c.querySelector(".kos")!.getAttribute("data-stage");
  const brand = (c: Element) => c.querySelector<HTMLButtonElement>('.kos-menubar button[aria-haspopup="menu"]')!;
  const menuRow = (c: Element, label: string) => [...c.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((i) => i.textContent?.includes(label))!;
  const icon = (c: Element, label: string) => [...c.querySelectorAll("button.kos-icon")].find((b) => b.textContent?.includes(label))!;

  async function toDesk(container: Element) {
    await flush();
    act(() => { vi.advanceTimersByTime(1500); });
    expect(stageOf(container)).toBe("lock");
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    act(() => { vi.advanceTimersByTime(1300); });
    expect(stageOf(container)).toBe("desk");
  }

  it("Lock Screen: the desk blurs out over 320 ms with its windows, then the lock shows with the password field focused and the desk cleared; Enter unlocks again with no second chime", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toDesk(container);
    expect(chimes()).toBe(1);
    click(icon(container, "About me"));
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(1);
    click(brand(container));
    click(menuRow(container, "Lock Screen"));
    expect(track).toHaveBeenCalledWith("menu_action", { item: "lock" });
    expect(stageOf(container)).toBe("locking");
    expect(container.querySelector(".kos-lock")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(320); });
    expect(stageOf(container)).toBe("lock");
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(0);
    expect(container.querySelector(".kos")!.getAttribute("data-boot")).toBeNull();
    expect(document.activeElement).toBe(container.querySelector("input[type=password]"));
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    act(() => { vi.advanceTimersByTime(400); });
    expect(stageOf(container)).toBe("unlocking");
    expect(container.querySelector(".kos")!.getAttribute("data-boot")).toBe("animate");
    act(() => { vi.advanceTimersByTime(900); });
    expect(stageOf(container)).toBe("desk");
    expect(chimes()).toBe(1);
    unmount();
  });

  it("Restart…: a confirm sheet (Cancel keeps the desk); Restart fades to black 300 ms, then the boot replays from the mark with the health round, the chime sounds again, lock, unlock, desk", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toDesk(container);
    click(icon(container, "Projects"));
    click(brand(container));
    click(menuRow(container, "Restart…"));
    expect(track).toHaveBeenCalledWith("menu_action", { item: "restart" });
    const sheet = container.querySelector<HTMLElement>('[role="alertdialog"]')!;
    expect(sheet.textContent).toContain("Restart KalpOS?");
    expect(sheet.textContent).toContain("The desk will reboot.");
    const restartBtn = [...sheet.querySelectorAll("button")].find((b) => b.textContent === "Restart")!;
    expect(document.activeElement).toBe(restartBtn);
    click([...sheet.querySelectorAll("button")].find((b) => b.textContent === "Cancel")!);
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(stageOf(container)).toBe("desk");
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(1);

    click(brand(container));
    click(menuRow(container, "Restart…"));
    click([...container.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === "Restart")!);
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(stageOf(container)).toBe("restarting");
    expect(container.querySelector(".kos-restart")).not.toBeNull();
    // Still the desk under the fade; the lock is not painted over it.
    expect(container.querySelector(".kos-lock")).toBeNull();
    act(() => { vi.advanceTimersByTime(300); });
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(container.querySelector(".kos-restart")).toBeNull();
    expect(container.querySelector(".kos-boot-mark")?.textContent).toBe("KK");
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(0);
    expect(root.getAttribute("data-boot")).toBeNull();
    // The health round runs again: the hairline starts over.
    expect(container.querySelector<HTMLElement>(".kos-boot-line i")!.style.transform).toBe("scaleX(0.125)");
    await flush();
    expect(container.querySelector<HTMLElement>(".kos-boot-line i")!.style.transform).toBe("scaleX(1)");
    expect(chimes()).toBe(2);
    expect(root.getAttribute("data-chime")).toBe("boot");
    act(() => { vi.advanceTimersByTime(900); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    act(() => { vi.advanceTimersByTime(600); });
    expect(root.getAttribute("data-stage")).toBe("lock");
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    act(() => { vi.advanceTimersByTime(1300); });
    expect(root.getAttribute("data-stage")).toBe("desk");
    expect(root.getAttribute("data-boot")).toBe("animate");
    expect(chimes()).toBe(2);
    unmount();
  });

  it("⌘L locks; ⌃⌘R opens the restart sheet and Esc cancels it; neither does anything off the desk", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await flush();
    fire(document.body, "keydown", { key: "l", metaKey: true });
    expect(stageOf(container)).toBe("boot");
    await toDesk(container);
    fire(document.body, "keydown", { key: "r", metaKey: true, ctrlKey: true });
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
    fire(document.activeElement!, "keydown", { key: "Escape" });
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(stageOf(container)).toBe("desk");
    fire(document.body, "keydown", { key: "l", metaKey: true });
    expect(stageOf(container)).toBe("locking");
    act(() => { vi.advanceTimersByTime(320); });
    expect(stageOf(container)).toBe("lock");
    fire(document.body, "keydown", { key: "l", metaKey: true });
    expect(stageOf(container)).toBe("lock");
    unmount();
  });

  it("a restart (or a lock) on a ?desk page drops the pre-paint attribute so the boot and the lock really show", () => {
    document.documentElement.setAttribute("data-kos-boot", "desk");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    expect(stageOf(container)).toBe("desk");
    fire(document.body, "keydown", { key: "l", metaKey: true });
    expect(document.documentElement.getAttribute("data-kos-boot")).toBeNull();
    expect(stageOf(container)).toBe("locking");
    act(() => { vi.advanceTimersByTime(320); });
    expect(stageOf(container)).toBe("lock");
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    act(() => { vi.advanceTimersByTime(1300); });
    expect(stageOf(container)).toBe("desk");
    fire(document.body, "keydown", { key: "r", metaKey: true, ctrlKey: true });
    click([...container.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === "Restart")!);
    act(() => { vi.advanceTimersByTime(300); });
    expect(document.documentElement.getAttribute("data-kos-boot")).toBeNull();
    expect(stageOf(container)).toBe("boot");
    expect(container.querySelector(".kos-boot")).not.toBeNull();
    unmount();
  });

  it("a deep link's case window closes on lock and the URL goes back to /", () => {
    history.replaceState(null, "", "/projects/rc-car");
    const { container, unmount } = render(<KalpOS projects={projects} skipLock initialWindow="case:rc-car" initialBody={<p>b</p>} />);
    fire(document.body, "keydown", { key: "l", metaKey: true });
    act(() => { vi.advanceTimersByTime(320); });
    expect(stageOf(container)).toBe("lock");
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(0);
    expect(location.pathname).toBe("/");
    unmount();
  });

  it("on a phone the sheets are the windows: a lock puts the Projects drawer back and a deep-linked case does not come back", () => {
    const desktopMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: q.includes("max-width"), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    const { container, unmount } = render(<KalpOS projects={projects} skipLock initialWindow="case:rc-car" initialBody={<p>b</p>} />);
    expect(container.querySelector(".kos-sheet")?.getAttribute("aria-label")).toBe("Automatic RC Car");
    click(container.querySelector<HTMLButtonElement>('.kos-phone-bar button[aria-haspopup="menu"]')!);
    click(menuRow(container, "Lock Screen"));
    act(() => { vi.advanceTimersByTime(320); });
    expect(stageOf(container)).toBe("lock");
    expect(container.querySelector(".kos-sheet")?.getAttribute("aria-label")).toBe("Projects");
    window.matchMedia = desktopMedia;
    unmount();
  });

  it("the terminal's `reboot` restarts the desk", async () => {
    // The terminal's filesystem is a real dynamic import: let it land on real timers first.
    vi.useRealTimers();
    const { container, unmount } = render(<KalpOS projects={projects} skipLock />);
    click(container.querySelector(".kos-dock-item--terminal")!);
    await act(async () => { await new Promise((r) => setTimeout(r, 150)); });
    vi.useFakeTimers();
    const input = container.querySelector<HTMLInputElement>('input[aria-label="Terminal command"]')!;
    setValue(input, "reboot");
    fire(input, "keydown", { key: "Enter" });
    await flush();
    expect(container.querySelector('[role="log"]')!.textContent).toContain("Restarting…");
    act(() => { vi.advanceTimersByTime(400); });
    expect(stageOf(container)).toBe("restarting");
    act(() => { vi.advanceTimersByTime(300); });
    expect(stageOf(container)).toBe("boot");
    expect(track).toHaveBeenCalledWith("terminal_command", { name: "reboot" });
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

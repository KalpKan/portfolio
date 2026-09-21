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

/** The power button: a fresh visit waits for a gesture; the key press starts the boot (and the chime inside it). */
function pressPower(made?: { gestured: boolean }) {
  if (made) made.gestured = true;
  fire(document.body, "keydown", { key: "k" });
}

/** From a fresh render to the lock: power on, 2.1 s of boot, 250 ms hold, 600 ms exit. */
async function toLock(container: Element, made?: { gestured: boolean }) {
  await flush();
  pressPower(made);
  await flush();
  act(() => { vi.advanceTimersByTime(2100 + 250 + 600); });
  expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("lock");
}

describe("KalpOS power screen → boot → lock → desk (a Mac starts from its power button)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetChimeForTests();
    fakeAudio("suspended");
    (track as ReturnType<typeof vi.fn>).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a plain visit shows pure black with a drawn power glyph and 'press any key to start'; nothing moves until a gesture", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    const boot = container.querySelector(".kos-boot")!;
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(boot.getAttribute("data-power")).toBe("off");
    expect(boot.querySelector("svg.kos-power")).not.toBeNull();
    expect(boot.querySelector(".kos-power-caption")?.textContent).toBe("press any key to start");
    expect(container.querySelector(".kos-boot-mark")).toBeNull();
    expect(container.querySelector(".kos-boot-bar")).toBeNull();
    expect(container.querySelector(".kos-lock")).not.toBeNull();
    // The health round already ran; the boot still waits.
    await flush();
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(boot.getAttribute("data-power")).toBe("off");
    expect(root.getAttribute("data-leaving")).toBeNull();
    expect(root.getAttribute("data-chime")).toBeNull();
    // A lone modifier, Escape, or a browser chord (⌘L) is not the power button.
    fire(document.body, "keydown", { key: "Shift" });
    fire(document.body, "keydown", { key: "Escape" });
    fire(document.body, "keydown", { key: "l", metaKey: true });
    expect(boot.getAttribute("data-power")).toBe("off");
    unmount();
  });

  it("on a coarse pointer the caption says 'tap to start'", () => {
    const desktopMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: q.includes("pointer: coarse"), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    const { container, unmount } = render(<KalpOS projects={projects} />);
    expect(container.querySelector(".kos-power-caption")?.textContent).toBe("tap to start");
    window.matchMedia = desktopMedia;
    unmount();
  });

  it("a key press starts the boot: the logo fades in, the bar appears 700 ms later and glides to 100 % on the real health round, holds 250 ms, then 600 ms to the lock", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    await flush();
    pressPower();
    const boot = container.querySelector(".kos-boot")!;
    expect(boot.getAttribute("data-power")).toBe("on");
    expect(boot.querySelector("svg.kos-power")).toBeNull();
    expect(container.querySelector(".kos-boot-mark")?.textContent).toBe("KK");
    const fill = container.querySelector<HTMLElement>(".kos-boot-bar i")!;
    // Logo (400 ms) then the bar 300 ms later: the fill stays at 0 until the bar is shown.
    expect(fill.style.transform).toBe("scaleX(0)");
    act(() => { vi.advanceTimersByTime(699); });
    expect(fill.style.transform).toBe("scaleX(0)");
    expect(boot.getAttribute("data-bar")).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(boot.getAttribute("data-bar")).toBe("shown");
    // Everything answered before the bar showed: one glide to 100 % that lasts the bar's 1.4 s minimum.
    expect(fill.style.transform).toBe("scaleX(1)");
    expect(fill.style.transitionDuration).toBe("1400ms");
    act(() => { vi.advanceTimersByTime(1399); });
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    // 2100 ms: the bar is full; hold 250 ms before leaving.
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(249); });
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    expect(root.getAttribute("data-stage")).toBe("boot");
    act(() => { vi.advanceTimersByTime(599); });
    expect(root.getAttribute("data-stage")).toBe("boot");
    act(() => { vi.advanceTimersByTime(1); });
    expect(root.getAttribute("data-stage")).toBe("lock");
    expect(container.querySelector(".kos-boot")).toBeNull();
    expect(container.querySelector(".kos-lock")).not.toBeNull();
    unmount();
  });

  it("a click or a tap is the power button too", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    fire(container.querySelector(".kos-boot")!, "click");
    expect(container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("on");
    unmount();
    const second = render(<KalpOS projects={projects} />);
    fire(second.container.querySelector(".kos-boot")!, "touchend");
    expect(second.container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("on");
    second.unmount();
  });

  it("the bar advances on real progress, step by step, and never moves backwards", async () => {
    // Every health check answers only when the test says so.
    const pending: Array<() => void> = [];
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => pending.push(() => resolve(new Response(JSON.stringify({ ok: true })))))));
    const { container, unmount } = render(<KalpOS projects={projects} />);
    pressPower();
    const fill = container.querySelector<HTMLElement>(".kos-boot-bar i")!;
    act(() => { vi.advanceTimersByTime(700); });
    // The registry step only (1 of 8).
    expect(fill.style.transform).toBe("scaleX(0.1111111111111111)");
    expect(fill.style.transitionDuration).toBe("400ms");
    const seen = [1 / 9];
    const answer = async () => {
      pending.shift()!();
      await flush();
      seen.push(Number(fill.style.transform.replace(/scaleX\((.*)\)/, "$1")));
    };
    await answer();
    await answer();
    expect(seen).toEqual([1 / 9, 2 / 9, 3 / 9]);
    act(() => { vi.advanceTimersByTime(300); });
    while (pending.length) await answer();
    expect(seen.at(-1)).toBe(1);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    // The last step is the 1.4 s glide, and the boot ends with it: 1000 + 1400, then the 250 ms hold.
    expect(fill.style.transitionDuration).toBe("1400ms");
    const root = container.querySelector(".kos")!;
    act(() => { vi.advanceTimersByTime(1400 + 249); });
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    unmount();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
  });

  it("a slow health endpoint cannot hold the boot past 4 s after the power button; the bar is drawn full as it leaves", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    act(() => { vi.advanceTimersByTime(5000); });
    pressPower();
    act(() => { vi.advanceTimersByTime(3999); });
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(1 + 250); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    expect(container.querySelector<HTMLElement>(".kos-boot-bar i")!.style.transform).toBe("scaleX(1)");
    unmount();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
  });

  it("a returning visitor sees the power screen again: the old localStorage flag means nothing", () => {
    localStorage.setItem("kalpos:visited", "1");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("boot");
    expect(container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("off");
    unmount();
  });

  it("unlocks on Enter: pulse 400 ms, unlocking 900 ms, desk", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    await toLock(container);
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

  it("with reduced motion: the power screen, then the logo and the full bar held for 800 ms, then a 400 ms crossfade to the lock", async () => {
    window.matchMedia = ((q: string) => ({
      matches: q.includes("reduced-motion"),
      media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("boot");
    expect(container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("off");
    pressPower();
    const boot = container.querySelector(".kos-boot")!;
    expect(boot.getAttribute("data-bar")).toBe("shown");
    // Static: the bar is full at once, even with every check still pending.
    expect(container.querySelector<HTMLElement>(".kos-boot-bar i")!.style.transform).toBe("scaleX(1)");
    act(() => { vi.advanceTimersByTime(799); });
    expect(root.getAttribute("data-leaving")).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(root.getAttribute("data-leaving")).toBe("true");
    act(() => { vi.advanceTimersByTime(399); });
    expect(root.getAttribute("data-stage")).toBe("boot");
    act(() => { vi.advanceTimersByTime(1); });
    expect(root.getAttribute("data-stage")).toBe("lock");
    unmount();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
    window.matchMedia = ((q: string) => ({
      matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  });

  it("?desk (the pre-paint attribute) skips the power screen, boot and lock with a crossfade", () => {
    document.documentElement.setAttribute("data-kos-boot", "desk");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    const root = container.querySelector(".kos")!;
    expect(root.getAttribute("data-stage")).toBe("desk");
    expect(root.getAttribute("data-boot")).toBe("crossfade");
    expect(container.querySelector(".kos-boot")).toBeNull();
    // A key press on the desk is not a power button.
    fire(document.body, "keydown", { key: "k" });
    expect(root.getAttribute("data-stage")).toBe("desk");
    unmount();
  });

  it("a deep link renders the desk with the case-study window open, no power screen, no boot, no lock", () => {
    const { container, unmount } = render(
      <KalpOS projects={projects} skipLock initialWindow="case:rc-car" initialBody={<p id="deep">body</p>} />,
    );
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("desk");
    expect(container.querySelector(".kos-boot")).toBeNull();
    expect(container.querySelector(".kos-power")).toBeNull();
    expect(container.querySelector(".kos-lock")).toBeNull();
    expect(container.querySelector('[role="dialog"] #deep')).not.toBeNull();
    unmount();
  });
});

describe("the startup chime (at boot, inside the power-button gesture)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetChimeForTests();
    localStorage.clear();
    (track as ReturnType<typeof vi.fn>).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const chimes = () => (track as ReturnType<typeof vi.fn>).mock.calls.filter(([e]) => e === "chime_played").length;

  it("plays immediately in the key press (the context is created and resumed inside the gesture), exactly once per boot, and reports chime_played {at: boot}", async () => {
    const made = fakeAudio("suspended");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await flush();
    expect(made.started.length).toBe(0);
    expect(track).not.toHaveBeenCalledWith("chime_played", expect.anything());
    // The gesture: audio is allowed from now on (the browser's rule), and the boot starts.
    pressPower(made);
    await flush();
    expect(made.started.length).toBe(4);
    expect(made.started[0]).toBeCloseTo(1, 3);
    expect(track).toHaveBeenCalledWith("chime_played", { at: "boot" });
    expect(container.querySelector(".kos")!.getAttribute("data-chime")).toBe("boot");
    // More keys, the boot itself, and the unlock add nothing.
    fire(document.body, "keydown", { key: "j" });
    fire(document.body, "click");
    act(() => { vi.advanceTimersByTime(2100 + 250 + 600); });
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("lock");
    fire(container.querySelector("input[type=password]")!, "keydown", { key: "Enter" });
    await flush();
    act(() => { vi.advanceTimersByTime(1300); });
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("desk");
    expect(made.started.length).toBe(4);
    expect(chimes()).toBe(1);
    expect((track as ReturnType<typeof vi.fn>).mock.calls.some(([, p]) => (p as { at?: string })?.at === "unlock")).toBe(false);
    unmount();
  });

  it("when the browser still refuses audio the boot proceeds silently and nothing throws", async () => {
    const made = fakeAudio("suspended");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await flush();
    // made.gestured stays false: resume() leaves the context suspended, as a strict policy would.
    fire(document.body, "keydown", { key: "k" });
    await flush();
    expect(made.started.length).toBe(0);
    expect(container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("on");
    expect(container.querySelector(".kos")!.getAttribute("data-chime")).toBeNull();
    act(() => { vi.advanceTimersByTime(2100 + 250 + 600); });
    expect(container.querySelector(".kos")!.getAttribute("data-stage")).toBe("lock");
    expect(chimes()).toBe(0);
    unmount();
  });

  it("stays silent when muted; the boot still runs from the gesture", async () => {
    const made = fakeAudio("running");
    setMuted(true);
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toLock(container, made);
    expect(made.started.length).toBe(0);
    expect(track).not.toHaveBeenCalledWith("chime_played", expect.anything());
    expect(container.querySelector(".kos")!.getAttribute("data-chime")).toBeNull();
    unmount();
  });
});

describe("Lock Screen and Restart (the KalpOS menu, ⌃⌘Q / ⌃⌘R, the terminal)", () => {
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
    await toLock(container);
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

  it("Restart…: a confirm sheet (Cancel keeps the desk); Restart fades to black 300 ms, then the boot replays with no power screen (the click was the gesture), the chime sounds at once, the bar runs the health round again, lock, unlock, desk", async () => {
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
    // No power screen: the Restart click was the gesture, so the logo is up and the chime sounds now.
    expect(container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("on");
    expect(container.querySelector(".kos-power")).toBeNull();
    expect(container.querySelector(".kos-boot-mark")?.textContent).toBe("KK");
    expect(container.querySelectorAll('[role="dialog"]').length).toBe(0);
    expect(root.getAttribute("data-boot")).toBeNull();
    await flush();
    expect(chimes()).toBe(2);
    expect(root.getAttribute("data-chime")).toBe("boot");
    // The health round runs again: the bar starts over once it is shown (700 ms).
    const fill = container.querySelector<HTMLElement>(".kos-boot-bar i")!;
    expect(fill.style.transform).toBe("scaleX(0)");
    act(() => { vi.advanceTimersByTime(700); });
    expect(fill.style.transform).toBe("scaleX(1)");
    expect(fill.style.transitionDuration).toBe("1400ms");
    act(() => { vi.advanceTimersByTime(1400 + 250); });
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

  it("⌃⌘Q locks (the real macOS shortcut); ⌃⌘R opens the restart sheet and Esc cancels it; neither does anything off the desk", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toDesk(container);
    fire(document.body, "keydown", { key: "r", metaKey: true, ctrlKey: true });
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
    fire(document.activeElement!, "keydown", { key: "Escape" });
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(stageOf(container)).toBe("desk");
    const q = fire(document.body, "keydown", { key: "q", metaKey: true, ctrlKey: true });
    expect(q.defaultPrevented).toBe(true);
    expect(track).toHaveBeenCalledWith("menu_action", { item: "lock" });
    expect(stageOf(container)).toBe("locking");
    act(() => { vi.advanceTimersByTime(320); });
    expect(stageOf(container)).toBe("lock");
    fire(document.body, "keydown", { key: "q", metaKey: true, ctrlKey: true });
    expect(stageOf(container)).toBe("lock");
    unmount();
  });

  it("⌘L is the browser's address-bar shortcut (Kalp, 2026-09-20): never intercepted, never locks; ⌘Q alone does nothing either", async () => {
    const { container, unmount } = render(<KalpOS projects={projects} />);
    await toDesk(container);
    const l = fire(document.body, "keydown", { key: "l", metaKey: true });
    expect(l.defaultPrevented).toBe(false);
    expect(stageOf(container)).toBe("desk");
    const q = fire(document.body, "keydown", { key: "q", metaKey: true });
    expect(q.defaultPrevented).toBe(false);
    expect(stageOf(container)).toBe("desk");
    expect(track).not.toHaveBeenCalledWith("menu_action", { item: "lock" });
    unmount();
  });

  it("a restart (or a lock) on a ?desk page drops the pre-paint attribute so the boot and the lock really show", () => {
    document.documentElement.setAttribute("data-kos-boot", "desk");
    const { container, unmount } = render(<KalpOS projects={projects} />);
    expect(stageOf(container)).toBe("desk");
    fire(document.body, "keydown", { key: "q", metaKey: true, ctrlKey: true });
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
    expect(container.querySelector(".kos-boot")!.getAttribute("data-power")).toBe("on");
    unmount();
  });

  it("a deep link's case window closes on lock and the URL goes back to /", () => {
    history.replaceState(null, "", "/projects/rc-car");
    const { container, unmount } = render(<KalpOS projects={projects} skipLock initialWindow="case:rc-car" initialBody={<p>b</p>} />);
    fire(document.body, "keydown", { key: "q", metaKey: true, ctrlKey: true });
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
    // The terminal's filesystem is a real dynamic import: let it land on real
    // timers first. A fixed sleep is a race (a loaded machine, or one more
    // module in the vfs chunk, and the log is still empty: flaky ~2 runs in 3
    // on 2026-09-21), so poll for the MOTD the import prints.
    vi.useRealTimers();
    const { container, unmount } = render(<KalpOS projects={projects} skipLock />);
    click(container.querySelector(".kos-dock-item--terminal")!);
    for (let i = 0; i < 100; i++) {
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      if (container.querySelector('[role="log"]')?.textContent?.includes("Welcome to KalpOS")) break;
    }
    expect(container.querySelector('[role="log"]')!.textContent).toContain("Welcome to KalpOS");
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

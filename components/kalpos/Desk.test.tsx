import { describe, it, expect, vi, beforeAll } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { act } from "react";
import { capturedElement, click, fire, installPointerCapture, render } from "@/test/render";
import Desk from "./Desk";
import { loadProjects } from "@/lib/projects";
import { tilesFor } from "@/lib/tiles";
import { initialSignals } from "@/lib/signal";
import { EMPTY_WINDOWS } from "@/lib/windows";
import { track } from "@/lib/track";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const tiles = tilesFor(loadProjects());
const site = {
  name: "Kalp Kansara",
  note: "Hi — I'm Kalp.",
  tagline: "Western.",
  resumeUrl: "",
  photo: "",
  nowPlaying: { title: "", artist: "" },
  contact: { email: "", github: "", linkedin: "" },
};

function mount(over: Partial<React.ComponentProps<typeof Desk>> = {}) {
  const dispatch = vi.fn();
  const r = render(
    <Desk
      tiles={tiles}
      signals={initialSignals(tiles)}
      windows={EMPTY_WINDOWS}
      dispatch={dispatch}
      site={site}
      checkedAt={null}
      {...over}
    />,
  );
  return { ...r, dispatch };
}

describe("Desk (card 2c)", () => {
  it("has the menubar with the brand, the five menus and a clock, and no Résumé pill while resumeUrl is empty", () => {
    const { container, unmount } = mount();
    const bar = container.querySelector(".kos-menubar")!;
    expect(bar.textContent).toContain("KalpOS");
    for (const m of ["File", "Edit", "View", "Go", "Window"]) expect(bar.textContent).toContain(m);
    expect(bar.querySelector("#kos-clock")).not.toBeNull();
    expect(bar.querySelector(".kos-pill")).toBeNull();
    unmount();
  });

  it("shows the Résumé pill and the dock PDF tile once resumeUrl is set", () => {
    const { container, unmount } = mount({ site: { ...site, resumeUrl: "https://x/cv.pdf" } });
    expect(container.querySelector(".kos-menubar .kos-pill")?.getAttribute("href")).toBe("https://x/cv.pdf");
    expect(container.querySelector(".kos-dock-item--pdf")?.getAttribute("href")).toBe("https://x/cv.pdf");
    unmount();
  });

  it("draws the folders and icons as buttons, with the Projects badge = tile count, and hides Now playing while empty", () => {
    const { container, unmount } = mount();
    const icons = [...container.querySelectorAll("button.kos-icon")].map((b) => b.textContent?.trim());
    expect(icons).toEqual(["12Projects", "Hobbies", "About me", "@Contact", "Trash"]);
    expect(container.querySelector(".kos-now")).toBeNull();
    unmount();
  });

  it("shows the Now playing icon and widget when a track is set", () => {
    const { container, unmount } = mount({ site: { ...site, nowPlaying: { title: "Bloom", artist: "Radiohead" } } });
    expect(container.querySelector(".kos-now")?.textContent).toContain("Bloom");
    expect([...container.querySelectorAll("button.kos-icon")].some((b) => b.textContent?.includes("Now playing"))).toBe(true);
    unmount();
  });

  it("clicking the Projects folder opens the projects window", () => {
    const { container, dispatch, unmount } = mount();
    click([...container.querySelectorAll("button.kos-icon")].find((b) => b.textContent?.includes("Projects"))!);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "open", id: "projects" }));
    unmount();
  });

  it("has the dock with seven tiles (no PDF while resumeUrl is empty) and a running dot for an open window", () => {
    const { container, unmount } = mount({
      windows: { windows: [{ id: "about", z: 1, minimized: false }], nextZ: 2 },
    });
    expect(container.querySelectorAll(".kos-dock-item").length).toBe(7);
    expect(container.querySelector(".kos-dock-item--notes .kos-dock-dot")).not.toBeNull();
    expect(container.querySelector(".kos-dock-item--finder .kos-dock-dot")).toBeNull();
    unmount();
  });
});

describe("Desk icon double-click", () => {
  it("dispatches one open for two clicks inside 400 ms, and a second open once 400 ms have passed", () => {
    vi.useFakeTimers();
    const { container, dispatch, unmount } = mount();
    const about = [...container.querySelectorAll("button.kos-icon")].find((b) => b.textContent?.includes("About me"))!;
    click(about);
    vi.advanceTimersByTime(150);
    click(about);
    expect(dispatch.mock.calls.filter(([a]) => a.type === "open").length).toBe(1);
    vi.advanceTimersByTime(400);
    click(about);
    expect(dispatch.mock.calls.filter(([a]) => a.type === "open").length).toBe(2);
    vi.useRealTimers();
    unmount();
  });
});

describe("menubar mute toggle (startup chime)", () => {
  it("sits in the right cluster, flips aria-pressed and persists kalpos:mute", () => {
    localStorage.clear();
    const { container, unmount } = mount();
    const btn = container.querySelector<HTMLButtonElement>(".kos-menubar-right .kos-mute")!;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.getAttribute("aria-label")).toMatch(/mute/i);
    click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("kalpos:mute")).toBe("1");
    click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem("kalpos:mute")).toBeNull();
    unmount();
  });
});

describe("Desk icons move anywhere (2026-09-20)", () => {
  beforeAll(installPointerCapture);
  const icon = (c: Element, label: string) => [...c.querySelectorAll<HTMLButtonElement>("button.kos-icon")].find((b) => b.textContent?.includes(label))!;
  const pointer = (type: string, x: number, y: number) => new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y, ...({ pointerId: 1 } as object) });

  it("places each icon absolutely on the card 2c grid by default, above the menubar line and off the dock", () => {
    localStorage.clear();
    const { container, unmount } = mount();
    expect(icon(container, "Projects").style.left).toBe("38px");
    expect(icon(container, "Projects").style.top).toBe("64px");
    expect(icon(container, "Hobbies").style.left).toBe("148px");
    expect(icon(container, "About me").style.top).toBe("174px");
    expect(icon(container, "Trash").style.left).toBe("148px");
    expect(icon(container, "Trash").style.top).toBe("284px");
    unmount();
  });

  it("a drag moves the icon 1:1 and, on release, snaps it to the 22 px grid and persists kalpos:icons", () => {
    localStorage.clear();
    const { container, unmount } = mount();
    const hob = icon(container, "Hobbies");
    act(() => {
      hob.dispatchEvent(pointer("pointerdown", 200, 100));
      hob.dispatchEvent(pointer("pointermove", 500, 130));
    });
    expect(hob.getAttribute("data-dragging")).toBe("true");
    expect(hob.style.left).toBe("448px"); // 148 + 300, no snapping while the hand holds it
    expect(hob.style.top).toBe("94px");
    act(() => {
      hob.dispatchEvent(pointer("pointerup", 500, 130));
    });
    expect(hob.getAttribute("data-dragging")).toBeNull();
    // 448 → cell round((448-38)/22) = 19 → 456; 94 → cell round((94-64)/22) = 1 → 86
    expect(hob.style.left).toBe("456px");
    expect(hob.style.top).toBe("86px");
    expect(JSON.parse(localStorage.getItem("kalpos:icons")!).hobbies).toEqual({ c: 19, r: 1 });
    unmount();
  });

  it("restores the saved layout on mount; a drop onto another icon nudges to a free cell; the layout survives a remount (lock / restart)", () => {
    localStorage.setItem("kalpos:icons", JSON.stringify({ contact: { c: 20, r: 2 } }));
    const { container, unmount } = mount();
    expect(icon(container, "Contact").style.left).toBe("478px");
    expect(icon(container, "Contact").style.top).toBe("108px");
    const hob = icon(container, "Hobbies");
    act(() => {
      hob.dispatchEvent(pointer("pointerdown", 200, 100));
      hob.dispatchEvent(pointer("pointermove", 90, 100));
      hob.dispatchEvent(pointer("pointerup", 90, 100));
    });
    // wanted cell (0,0) is Projects: nudged to the nearest free cell, never on top of it
    const saved = JSON.parse(localStorage.getItem("kalpos:icons")!);
    expect(saved.hobbies).not.toEqual({ c: 0, r: 0 });
    expect(Math.abs(saved.hobbies.c - 0) >= 5 || Math.abs(saved.hobbies.r - 0) >= 5).toBe(true);
    unmount();
    const again = mount();
    expect(icon(again.container, "Contact").style.left).toBe("478px");
    again.unmount();
  });

  it("arrow keys move a focused icon one grid cell and persist it", () => {
    localStorage.clear();
    const { container, unmount } = mount();
    const hob = icon(container, "Hobbies");
    hob.focus();
    const ev = fire(hob, "keydown", { key: "ArrowRight" });
    expect(ev.defaultPrevented).toBe(true);
    expect(hob.style.left).toBe("170px");
    // down: Contact (c 5, r 5) and the Trash (c 5, r 10) are in the way, so it lands on the far side of both (r 15)
    fire(hob, "keydown", { key: "ArrowDown" });
    expect(hob.style.top).toBe("394px");
    fire(hob, "keydown", { key: "ArrowUp" });
    expect(hob.style.top).toBe("64px");
    // one plain cell when nothing is in the way
    fire(icon(container, "Trash"), "keydown", { key: "ArrowDown" });
    expect(icon(container, "Trash").style.top).toBe("306px");
    expect(JSON.parse(localStorage.getItem("kalpos:icons")!).hobbies).toEqual({ c: 6, r: 0 });
    unmount();
  });

  it("Clean Up in the KalpOS menu (and ⌥⌘1) restores the default layout", () => {
    localStorage.setItem("kalpos:icons", JSON.stringify({ hobbies: { c: 30, r: 3 } }));
    const { container, unmount } = mount();
    expect(icon(container, "Hobbies").style.left).toBe("698px");
    click(container.querySelector('.kos-menubar button[aria-haspopup="menu"]')!);
    const row = [...container.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((i) => i.textContent?.includes("Clean Up"))!;
    expect(row.querySelector(".kos-menu-kbd")?.textContent).toBe("⌥⌘1");
    click(row);
    expect(icon(container, "Hobbies").style.left).toBe("148px");
    expect(JSON.parse(localStorage.getItem("kalpos:icons")!).hobbies).toEqual({ c: 5, r: 0 });
    fire(icon(container, "Hobbies"), "keydown", { key: "ArrowRight" });
    expect(icon(container, "Hobbies").style.left).toBe("170px");
    fire(document.body, "keydown", { key: "1", metaKey: true, altKey: true });
    expect(icon(container, "Hobbies").style.left).toBe("148px");
    unmount();
  });
});

describe("Drag an icon into the Trash: crumple, sink, the hand swats it back (2026-09-20)", () => {
  beforeAll(installPointerCapture);
  const icon = (c: Element, label: string) => [...c.querySelectorAll<HTMLButtonElement>("button.kos-icon")].find((b) => b.textContent?.includes(label))!;
  const pointer = (type: string, x: number, y: number) => new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y, ...({ pointerId: 1 } as object) });
  const rect = (el: Element, r: { x: number; y: number; w: number; h: number }) => {
    (el as HTMLElement).getBoundingClientRect = () => ({ left: r.x, top: r.y, width: r.w, height: r.h, right: r.x + r.w, bottom: r.y + r.h, x: r.x, y: r.y, toJSON() {} }) as DOMRect;
  };
  const setup = (over: Partial<React.ComponentProps<typeof Desk>> = {}) => {
    localStorage.clear();
    (track as ReturnType<typeof vi.fn>).mockClear();
    const m = mount(over);
    // jsdom has no layout: give the two trash rects their desk geometry
    rect(icon(m.container, "Trash"), { x: 148, y: 284, w: 96, h: 89 });
    rect(m.container.querySelector(".kos-dock-item--trash")!, { x: 700, y: 730, w: 54, h: 54 });
    return m;
  };
  const dragTo = (el: Element, x: number, y: number) =>
    act(() => {
      el.dispatchEvent(pointer("pointerdown", 200, 100));
      el.dispatchEvent(pointer("pointermove", x, y));
    });
  const release = (el: Element, x: number, y: number) => act(() => { el.dispatchEvent(pointer("pointerup", x, y)); });

  it("holding Hobbies over the desk Trash lifts its lid and crumples the folder; moving off restores both", () => {
    const { container, unmount } = setup();
    const hob = icon(container, "Hobbies");
    const bin = icon(container, "Trash");
    dragTo(hob, 190, 320);
    expect(hob.getAttribute("data-state")).toBe("crumple");
    expect(bin.getAttribute("data-lid")).toBe("up");
    expect(container.querySelector(".kos-dock-item--trash")?.getAttribute("data-lid")).toBeNull();
    act(() => { hob.dispatchEvent(pointer("pointermove", 500, 320)); });
    expect(hob.getAttribute("data-state")).toBeNull();
    expect(bin.getAttribute("data-lid")).toBeNull();
    release(hob, 500, 320);
    // a normal drop: it moved
    expect(JSON.parse(localStorage.getItem("kalpos:icons")!).hobbies).not.toEqual({ c: 5, r: 0 });
    expect(track).not.toHaveBeenCalledWith("trash_swat", expect.anything());
    unmount();
  });

  it("dropping it in: sinks, the hand pops out of the basket and swats it back to its old cell, toast for 1.6 s, trash_swat {icon}", () => {
    vi.useFakeTimers();
    const { container, unmount } = setup();
    const hob = icon(container, "Hobbies");
    dragTo(hob, 190, 320);
    release(hob, 190, 320);
    const desk = container.querySelector(".kos-desk")!;
    expect(desk.getAttribute("data-swat")).toBe("dropped");
    expect(hob.getAttribute("data-state")).toBe("sink");
    expect(track).toHaveBeenCalledWith("trash_swat", { icon: "hobbies" });
    // never moved: the cell is still the old one, nothing persisted
    expect(hob.style.left).toBe("148px");
    expect(localStorage.getItem("kalpos:icons")).toBeNull();
    act(() => { vi.advanceTimersByTime(200); });
    expect(desk.getAttribute("data-swat")).toBe("swatted");
    const hand = container.querySelector(".kos-hand")!;
    expect(hand).not.toBeNull();
    expect(hand.getAttribute("data-hand")).toBe("out");
    expect(hand.querySelector("svg")).not.toBeNull(); // a drawn hand, not an emoji
    expect(hand.textContent).not.toMatch(/[\u{1F44B}\u{270B}\u{1F590}]/u);
    expect(container.querySelector(".kos-toast")?.textContent).toBe("Nice try — everything on this desk shipped.");
    act(() => { vi.advanceTimersByTime(260); });
    expect(hob.getAttribute("data-state")).toBe("fly");
    act(() => { vi.advanceTimersByTime(520); });
    expect(desk.getAttribute("data-swat")).toBe("home");
    expect(hand.getAttribute("data-hand")).toBe("in");
    expect(hob.getAttribute("data-state")).toBeNull();
    act(() => { vi.advanceTimersByTime(200); });
    expect(desk.getAttribute("data-swat")).toBeNull();
    expect(container.querySelector(".kos-hand")).toBeNull();
    expect(icon(container, "Trash").getAttribute("data-lid")).toBeNull();
    expect(container.querySelector(".kos-toast")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1600); });
    expect(container.querySelector(".kos-toast")).toBeNull();
    vi.useRealTimers();
    unmount();
  });

  it("the dock's Trash tile is a target too; the Trash itself cannot be thrown away", () => {
    vi.useFakeTimers();
    const { container, unmount } = setup();
    const about = icon(container, "About me");
    dragTo(about, 720, 750);
    expect(container.querySelector(".kos-dock-item--trash")?.getAttribute("data-lid")).toBe("up");
    release(about, 720, 750);
    expect(container.querySelector(".kos-desk")?.getAttribute("data-swat")).toBe("dropped");
    // React flushes a phase's dispatch at the end of each act, so the clock steps through the beats
    for (let i = 0; i < 20; i++) act(() => { vi.advanceTimersByTime(100); });
    expect(container.querySelector(".kos-desk")?.getAttribute("data-swat")).toBeNull();
    const trash = icon(container, "Trash");
    dragTo(trash, 720, 750);
    release(trash, 720, 750);
    expect(container.querySelector(".kos-desk")?.getAttribute("data-swat")).toBeNull();
    expect(track).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    unmount();
  });

  it("reduced motion: the icon just comes back with a fade, the hand still appears briefly", () => {
    vi.useFakeTimers();
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduced-motion"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const { container, unmount } = setup();
    const hob = icon(container, "Hobbies");
    dragTo(hob, 190, 320);
    release(hob, 190, 320);
    act(() => { vi.advanceTimersByTime(0); });
    expect(container.querySelector(".kos-desk")?.getAttribute("data-swat")).toBe("swatted");
    expect(container.querySelector(".kos-hand")).not.toBeNull();
    expect(hob.getAttribute("data-state")).toBe("return");
    act(() => { vi.advanceTimersByTime(460); });
    expect(container.querySelector(".kos-desk")?.getAttribute("data-swat")).toBe("home");
    act(() => { vi.advanceTimersByTime(200); });
    expect(container.querySelector(".kos-hand")).toBeNull();
    expect(hob.style.left).toBe("148px");
    window.matchMedia = mm;
    vi.useRealTimers();
    unmount();
  });
});

describe("Desk icon drag survives a fast first move (capture on pointerdown)", () => {
  beforeAll(installPointerCapture);
  it("captures the pointer on pointerdown so a first move that leaves the icon still drags it", () => {
    localStorage.clear();
    const { container, dispatch, unmount } = mount();
    const hob = [...container.querySelectorAll<HTMLButtonElement>("button.kos-icon")].find((b) => b.textContent?.includes("Hobbies"))!;
    const p = (type: string, x: number, y: number) => new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y, ...({ pointerId: 1 } as object) });
    act(() => { hob.dispatchEvent(p("pointerdown", 200, 100)); });
    expect(capturedElement()).toBe(hob);
    act(() => {
      (capturedElement() ?? hob).dispatchEvent(p("pointermove", 400, 100));
      (capturedElement() ?? hob).dispatchEvent(p("pointerup", 400, 100));
    });
    expect(hob.style.left).toBe("346px"); // 148 + 200 → cell 14 → 346
    // the click the browser sends after the release must not open the window; a plain click still does
    act(() => { hob.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "open" }));
    act(() => { hob.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "open", id: "hobbies" }));
    unmount();
  });
});

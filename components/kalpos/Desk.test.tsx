import { describe, it, expect, vi, beforeAll } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { click, render } from "@/test/render";
import Desk from "./Desk";
import { loadProjects } from "@/lib/projects";
import { tilesFor } from "@/lib/tiles";
import { initialSignals } from "@/lib/signal";
import { EMPTY_WINDOWS } from "@/lib/windows";

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
    expect(container.querySelector(".kos-dock-item--music")).not.toBeNull();
    unmount();
  });

  it("clicking the Projects folder opens the projects window", () => {
    const { container, dispatch, unmount } = mount();
    click([...container.querySelectorAll("button.kos-icon")].find((b) => b.textContent?.includes("Projects"))!);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "open", id: "projects" }));
    unmount();
  });

  it("has the dock with six tiles (no PDF while resumeUrl is empty, no Music while the playlist is empty) and a running dot for an open window", () => {
    const { container, unmount } = mount({
      windows: { windows: [{ id: "about", z: 1, minimized: false }], nextZ: 2 },
    });
    expect(container.querySelectorAll(".kos-dock-item").length).toBe(6);
    expect(container.querySelector(".kos-dock-item--music")).toBeNull();
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

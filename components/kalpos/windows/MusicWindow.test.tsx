import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const track = vi.fn();
vi.mock("@/lib/track", () => ({ track: (...a: unknown[]) => track(...a) }));
import { click, fire, render } from "@/test/render";
import { PLAYLIST } from "@/lib/site";
import { TRACK_MS } from "@/lib/player";
import { resetPlayer } from "../usePlayer";
import MusicWindow from "./MusicWindow";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
beforeEach(() => {
  track.mockClear();
  resetPlayer();
});

const rows = (c: Element) => [...c.querySelectorAll<HTMLButtonElement>("button.kos-track")];
const current = (c: Element) => rows(c).findIndex((r) => r.getAttribute("aria-current") === "true");

describe("MusicWindow (the Music app)", () => {
  it("lists the three songs with the index, title, artist, the unreleased tag and a — duration; row 1 is current", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} title="On repeat" />);
    expect(container.querySelector(".kos-label")?.textContent).toBe("On repeat");
    const r = rows(container);
    expect(r).toHaveLength(3);
    expect(r[1].textContent).toContain("These Words");
    expect(r[1].textContent).toContain("Badger & Natasha Bedingfield");
    expect(r[1].querySelector(".n")?.textContent).toBe("2");
    expect(r[1].querySelector(".d")?.textContent).toBe("—");
    expect(r[2].querySelector(".kos-tag")?.textContent).toBe("unreleased");
    expect(r[0].querySelector(".kos-tag")).toBeNull();
    expect(current(container)).toBe(0);
    expect(r[0].querySelector(".n")?.textContent).toBe("♪");
    expect(container.textContent).toContain("Visual only");
    unmount();
  });

  it("draws a generated cover (gradient + initials), never an <img>", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const cover = container.querySelector<HTMLElement>(".kos-cover")!;
    expect(container.querySelector("img")).toBeNull();
    expect(cover.style.background).toContain("linear-gradient");
    expect(cover.textContent).toBe("S");
    unmount();
  });

  it("the transport moves the current song, wraps, and reports the index to analytics", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const next = container.querySelector('button[aria-label="Next song"]')!;
    const prev = container.querySelector('button[aria-label="Previous song"]')!;
    click(next);
    expect(current(container)).toBe(1);
    expect(container.querySelector(".kos-cover")?.textContent).toBe("TW");
    expect(track).toHaveBeenLastCalledWith("music_track_selected", { index: 1 });
    click(next);
    click(next);
    expect(current(container)).toBe(0);
    click(prev);
    expect(current(container)).toBe(2);
    expect(track).toHaveBeenLastCalledWith("music_track_selected", { index: 2 });
    unmount();
  });

  it("clicking a row plays it; play/pause toggles the button label and the row glyph", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    click(rows(container)[2]);
    expect(current(container)).toBe(2);
    expect(track).toHaveBeenLastCalledWith("music_track_selected", { index: 2 });
    const play = () => container.querySelector<HTMLButtonElement>(".kos-transport .play")!;
    expect(play().getAttribute("aria-label")).toBe("Pause");
    click(play());
    expect(play().getAttribute("aria-label")).toBe("Play");
    expect(rows(container)[2].querySelector(".n")?.textContent).toBe("3");
    click(play());
    expect(play().getAttribute("aria-label")).toBe("Pause");
    unmount();
  });

  it("keyboard: ↑/↓ move focus between rows (wrapping), Enter plays the focused row, Space pauses", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const body = container.querySelector(".kos-music")!;
    rows(container)[0].focus();
    fire(rows(container)[0], "keydown", { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows(container)[1]);
    fire(document.activeElement!, "keydown", { key: "ArrowUp" });
    fire(document.activeElement!, "keydown", { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows(container)[2]);
    // Enter on a focused <button> is a click in a browser.
    click(document.activeElement!);
    expect(current(container)).toBe(2);
    const space = fire(body, "keydown", { key: " " });
    expect(space.defaultPrevented).toBe(true);
    expect(container.querySelector(".kos-transport .play")?.getAttribute("aria-label")).toBe("Play");
    unmount();
  });

  it("shows the fake 3:20 length and a position that starts at 0:00", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const times = [...container.querySelectorAll(".kos-music-progress .times span")].map((s) => s.textContent);
    expect(times).toEqual(["0:00", "3:20"]);
    expect(TRACK_MS).toBe(200_000);
    unmount();
  });
});

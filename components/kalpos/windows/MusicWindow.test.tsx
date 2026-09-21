import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const track = vi.fn();
vi.mock("@/lib/track", () => ({ track: (...a: unknown[]) => track(...a) }));
import { click, fire, render } from "@/test/render";
import { PLAYLIST } from "@/lib/site";
import { TRACK_MS } from "@/lib/player";
import { resetPlayer } from "../usePlayer";
import MusicWindow, { isSpotifyTrackUrl } from "./MusicWindow";

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
  it("lists the three songs with the index, title, artist and a — duration; row 1 is current", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} title="On repeat" />);
    expect(container.querySelector(".kos-label")?.textContent).toBe("On repeat");
    const r = rows(container);
    expect(r).toHaveLength(3);
    expect(r[1].textContent).toContain("These Words");
    expect(r[1].textContent).toContain("Badger & Natasha Bedingfield");
    expect(r[1].querySelector(".n")?.textContent).toBe("2");
    expect(r[1].querySelector(".d")?.textContent).toBe("—");
    expect(r[2].querySelector(".kos-tag")).toBeNull();
    expect(r[0].querySelector(".kos-tag")).toBeNull();
    expect(current(container)).toBe(0);
    expect(r[0].querySelector(".n")?.textContent).toBe("♪");
    expect(container.textContent).toContain("Visual only");
    unmount();
  });

  it("shows the real single artwork when a track has a cover, and the generated gradient + initials when it does not", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const art = container.querySelector<HTMLImageElement>("img.kos-cover--art")!;
    expect(art).not.toBeNull();
    expect(art.getAttribute("src")).toBe("/images/music/suffer.jpg");
    expect(art.getAttribute("alt")).toContain("Suffer");
    unmount();
    const noArt = render(<MusicWindow playlist={[{ title: "Choosin' Texas", artist: "Drake & Don Toliver", tag: "unreleased" }]} />);
    const cover = noArt.container.querySelector<HTMLElement>(".kos-cover")!;
    expect(noArt.container.querySelector("img")).toBeNull();
    expect(cover.style.background).toContain("linear-gradient");
    expect(cover.textContent).toBe("CT");
    noArt.unmount();
  });

  it("the transport moves the current song, wraps, and reports the index to analytics", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const next = container.querySelector('button[aria-label="Next song"]')!;
    const prev = container.querySelector('button[aria-label="Previous song"]')!;
    click(next);
    expect(current(container)).toBe(1);
    expect(container.querySelector<HTMLImageElement>("img.kos-cover--art")?.getAttribute("src")).toBe("/images/music/these-words.jpg");
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

  it("double-clicking a row opens its Spotify URL in a new tab and reports the index to analytics; single click never does", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    click(rows(container)[1]);
    expect(open).not.toHaveBeenCalled();
    fire(rows(container)[1], "dblclick");
    expect(open).toHaveBeenCalledWith("https://open.spotify.com/track/7leW1Dmvs9A4oDh9i5Qwpz", "_blank", "noopener,noreferrer");
    expect(track).toHaveBeenLastCalledWith("music_opened_spotify", { index: 1 });
    open.mockRestore();
    unmount();
  });

  it("Enter on a row that is already the current track opens Spotify; Enter on a different row selects it instead", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    rows(container)[0].focus();
    expect(current(container)).toBe(0);
    fire(document.activeElement!, "keydown", { key: "Enter" });
    expect(open).toHaveBeenCalledWith("https://open.spotify.com/track/1rp2VekrJkaJ71HEaQUwAx", "_blank", "noopener,noreferrer");
    expect(track).toHaveBeenLastCalledWith("music_opened_spotify", { index: 0 });
    open.mockClear();
    fire(rows(container)[0], "keydown", { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows(container)[1]);
    fire(document.activeElement!, "keydown", { key: "Enter" });
    expect(open).not.toHaveBeenCalled();
    expect(current(container)).toBe(1);
    open.mockRestore();
    unmount();
  });

  it("shows a small \"open ↗\" hint only on rows with a Spotify link, never a logo asset", () => {
    const { container, unmount } = render(<MusicWindow playlist={PLAYLIST} />);
    const hints = rows(container).map((r) => r.querySelector(".kos-open-hint")?.textContent ?? null);
    expect(hints).toEqual(["open ↗", "open ↗", "open ↗"]);
    expect(container.querySelector("img[src*='spotify' i], svg[class*='spotify' i]")).toBeNull();
    unmount();
    const noLink = render(<MusicWindow playlist={[{ title: "Choosin' Texas", artist: "Drake & Don Toliver", tag: "unreleased" }]} />);
    expect(rows(noLink.container)[0].querySelector(".kos-open-hint")).toBeNull();
    noLink.unmount();
  });
});

describe("isSpotifyTrackUrl (the URL guard)", () => {
  it("only ever allows a real https://open.spotify.com/track/... link", () => {
    expect(isSpotifyTrackUrl("https://open.spotify.com/track/1rp2VekrJkaJ71HEaQUwAx")).toBe(true);
    expect(isSpotifyTrackUrl(undefined)).toBe(false);
    expect(isSpotifyTrackUrl("")).toBe(false);
    expect(isSpotifyTrackUrl("http://open.spotify.com/track/1rp2VekrJkaJ71HEaQUwAx")).toBe(false);
    expect(isSpotifyTrackUrl("https://evil.example.com/track/1rp2VekrJkaJ71HEaQUwAx")).toBe(false);
    expect(isSpotifyTrackUrl("https://open.spotify.com/album/1rp2VekrJkaJ71HEaQUwAx")).toBe(false);
    expect(isSpotifyTrackUrl("https://open.spotify.com.evil.com/track/abc")).toBe(false);
    expect(isSpotifyTrackUrl("javascript:alert(1)")).toBe(false);
    expect(isSpotifyTrackUrl("not a url")).toBe(false);
  });
});

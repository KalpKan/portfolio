import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { act } from "react";
import { click, render } from "@/test/render";
import { PLAYLIST } from "@/lib/site";
import NowPlaying from "./NowPlaying";
import { dispatchPlayer, resetPlayer } from "./usePlayer";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
beforeEach(() => resetPlayer());

describe("NowPlaying widget (card 2c)", () => {
  it("renders the current song as a button with the label, the dot and the progress line", () => {
    const onOpen = vi.fn();
    const { container, unmount } = render(<NowPlaying playlist={PLAYLIST} onOpen={onOpen} />);
    const card = container.querySelector<HTMLButtonElement>("button.kos-now")!;
    expect(card).not.toBeNull();
    expect(card.querySelector(".kos-label")?.textContent).toBe("Now playing");
    expect(card.querySelector(".title")?.textContent).toBe("Suffer");
    expect(card.querySelector(".artist")?.textContent).toBe("BEX");
    expect(card.querySelector("header i")).not.toBeNull();
    expect(card.querySelector(".bar i")).not.toBeNull();
    expect(card.style.getPropertyValue("--p")).toBe("0.0000");
    click(card);
    expect(onOpen).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("follows the shared player: a skip elsewhere changes the song here, a pause marks the card", () => {
    const { container, unmount } = render(<NowPlaying playlist={PLAYLIST} />);
    act(() => dispatchPlayer({ type: "next" }));
    expect(container.querySelector(".title")?.textContent).toBe("These Words");
    expect(container.querySelector(".kos-now")?.getAttribute("data-paused")).toBeNull();
    act(() => dispatchPlayer({ type: "pause" }));
    expect(container.querySelector(".kos-now")?.getAttribute("data-paused")).toBe("true");
    unmount();
  });

  it("renders nothing for an empty playlist", () => {
    const { container, unmount } = render(<NowPlaying playlist={[]} />);
    expect(container.querySelector(".kos-now")).toBeNull();
    unmount();
  });
});

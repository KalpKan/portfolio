import { describe, it, expect, vi, beforeAll } from "vitest";
import { click, fire, render, setValue } from "@/test/render";
import LockScreen from "./LockScreen";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

describe("LockScreen (card 3c)", () => {
  it("renders the date, clock, avatar, name, the password pill and the caption", () => {
    const { container, unmount } = render(<LockScreen onUnlock={() => {}} name="Kalp Kansara" />);
    expect(container.querySelector("#kos-lock-date")?.textContent).toMatch(/^[A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2}$/);
    expect(container.querySelector("#kos-lock-time")?.textContent).toMatch(/^\d{2}:\d{2}$/);
    expect(container.textContent).toContain("KK");
    expect(container.textContent).toContain("Kalp Kansara");
    expect(container.textContent).toContain("Enter Password");
    expect(container.textContent).toContain("It's a portfolio — type anything, then Enter");
    expect(container.textContent).toContain("tap to unlock");
    expect(container.querySelector("input[type=password]")?.getAttribute("aria-label")).toBe("Password");
    unmount();
  });

  it("shows one dot per typed character and hides the placeholder", () => {
    const { container, unmount } = render(<LockScreen onUnlock={() => {}} name="K" />);
    const input = container.querySelector<HTMLInputElement>("input[type=password]")!;
    setValue(input, "abc");
    expect(container.querySelectorAll(".kos-pw-dots i").length).toBe(3);
    expect(container.textContent).not.toContain("Enter Password");
    unmount();
  });

  it("unlocks on Enter, on the → button, and on a bare tap of the pill", () => {
    const onUnlock = vi.fn();
    const { container, unmount } = render(<LockScreen onUnlock={onUnlock} name="K" />);
    const input = container.querySelector<HTMLInputElement>("input[type=password]")!;
    fire(input, "keydown", { key: "Enter" });
    expect(onUnlock).toHaveBeenCalledTimes(1);
    setValue(input, "x");
    click(container.querySelector(".kos-pw-go")!);
    expect(onUnlock).toHaveBeenCalledTimes(2);
    click(container.querySelector("#kos-unlock")!);
    expect(onUnlock).toHaveBeenCalledTimes(3);
    unmount();
  });
});

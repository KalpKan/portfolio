import { describe, it, expect, vi, beforeAll } from "vitest";
import { click, fire, render } from "@/test/render";
import Window from "./Window";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function mount(over: Partial<React.ComponentProps<typeof Window>> = {}) {
  const onClose = vi.fn();
  const onFocus = vi.fn();
  const onMinimize = vi.fn();
  const r = render(
    <Window id="about" title="About me" focused z={3} onClose={onClose} onFocus={onFocus} onMinimize={onMinimize} width={520} {...over}>
      <button id="first">first</button>
      <a href="#x" id="last">last</a>
    </Window>,
  );
  return { ...r, onClose, onFocus, onMinimize };
}

describe("Window frame (cards 2d/2e)", () => {
  it("is a labelled dialog with three traffic lights and the title", () => {
    const { container, unmount } = mount();
    const dlg = container.querySelector('[role="dialog"]')!;
    expect(dlg.getAttribute("aria-label")).toBe("About me");
    expect(dlg.getAttribute("data-focused")).toBe("true");
    expect(container.querySelectorAll(".kos-light").length).toBe(3);
    expect(container.querySelector(".kos-window-title")?.textContent).toBe("About me");
    unmount();
  });

  it("closes on Escape when focused and on the red light", () => {
    const { container, onClose, unmount } = mount();
    fire(container.querySelector('[role="dialog"]')!, "keydown", { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    click(container.querySelector(".kos-light--close")!);
    expect(onClose).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("minimises on the yellow light and focuses on pointerdown anywhere", () => {
    const { container, onMinimize, onFocus, unmount } = mount({ focused: false });
    click(container.querySelector(".kos-light--min")!);
    expect(onMinimize).toHaveBeenCalledTimes(1);
    fire(container.querySelector(".kos-window-content")!, "pointerdown");
    expect(onFocus).toHaveBeenCalled();
    unmount();
  });

  it("traps Tab inside: from the last focusable, Tab wraps to the first light", () => {
    const { container, unmount } = mount();
    const last = container.querySelector<HTMLElement>("#last")!;
    last.focus();
    const ev = fire(last, "keydown", { key: "Tab" });
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement?.classList.contains("kos-light--close")).toBe(true);
    unmount();
  });
});

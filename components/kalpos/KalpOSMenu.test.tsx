import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// Analytics is a lazy import that would outlive the test environment; stub it.
vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { click, fire, render } from "@/test/render";
import KalpOSMenu from "./KalpOSMenu";
import { APPEARANCE_KEY, readAppearance, _resetAppearanceForTests } from "@/lib/appearance";
import { _resetChimeForTests, isMuted } from "@/lib/chime";
import { track } from "@/lib/track";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-appearance");
  _resetChimeForTests();
  _resetAppearanceForTests();
  (track as ReturnType<typeof vi.fn>).mockClear();
});

function mount() {
  const onAbout = vi.fn();
  const onLock = vi.fn();
  const onRestart = vi.fn();
  const r = render(
    <div>
      <KalpOSMenu onAbout={onAbout} onLock={onLock} onRestart={onRestart} />
      <button id="outside">outside</button>
    </div>,
  );
  const button = r.container.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
  const menu = () => r.container.querySelector<HTMLElement>('[role="menu"]');
  const items = () => [...r.container.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  const item = (label: string) => items().find((i) => i.textContent?.includes(label))!;
  const submenu = () => r.container.querySelector<HTMLElement>(".kos-submenu");
  const choices = () => [...r.container.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
  const choice = (label: string) => choices().find((i) => i.textContent?.includes(label))!;
  return { ...r, button, menu, items, item, submenu, choices, choice, onAbout, onLock, onRestart };
}

describe("the KalpOS menu (the brand word in the menubar)", () => {
  it("is a real menu button: closed by default, opens on click with the five rows and two separators, focus on the first row", () => {
    const m = mount();
    expect(m.button.textContent).toBe("KalpOS");
    expect(m.button.getAttribute("aria-expanded")).toBe("false");
    expect(m.menu()).toBeNull();
    click(m.button);
    expect(m.button.getAttribute("aria-expanded")).toBe("true");
    expect(m.menu()).not.toBeNull();
    expect(m.items().map((i) => i.querySelector(".kos-menu-label")?.textContent)).toEqual([
      "About KalpOS",
      "Lock Screen",
      "Restart…",
      "Appearance",
      "Mute chime",
    ]);
    expect(m.menu()!.querySelectorAll('[role="separator"]').length).toBe(3);
    expect(m.item("Lock Screen").querySelector(".kos-menu-kbd")?.textContent).toBe("⌃⌘Q");
    expect(m.item("Restart…").querySelector(".kos-menu-kbd")?.textContent).toBe("⌃⌘R");
    expect(document.activeElement).toBe(m.items()[0]);
    m.unmount();
  });

  it("each row does its job, closes the menu, returns focus to the button and reports menu_action {item}", () => {
    const m = mount();
    click(m.button);
    click(m.item("About KalpOS"));
    expect(m.onAbout).toHaveBeenCalledTimes(1);
    expect(m.menu()).toBeNull();
    expect(m.button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(m.button);
    expect(track).toHaveBeenCalledWith("menu_action", { item: "about" });

    click(m.button);
    click(m.item("Lock Screen"));
    expect(m.onLock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("menu_action", { item: "lock" });

    click(m.button);
    click(m.item("Restart…"));
    expect(m.onRestart).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("menu_action", { item: "restart" });

    click(m.button);
    click(m.item("Mute chime"));
    expect(isMuted()).toBe(true);
    expect(track).toHaveBeenCalledWith("menu_action", { item: "mute" });
    click(m.button);
    expect(m.item("Unmute chime")).toBeDefined();
    click(m.item("Unmute chime"));
    expect(isMuted()).toBe(false);
    m.unmount();
  });

  it("keyboard: ↓ on the button opens on the first row, ↑/↓ move and wrap, Enter chooses, Esc closes and restores focus", () => {
    const m = mount();
    m.button.focus();
    fire(m.button, "keydown", { key: "ArrowDown" });
    expect(m.menu()).not.toBeNull();
    expect(document.activeElement).toBe(m.items()[0]);
    fire(document.activeElement!, "keydown", { key: "ArrowDown" });
    expect(document.activeElement).toBe(m.items()[1]);
    fire(document.activeElement!, "keydown", { key: "ArrowUp" });
    fire(document.activeElement!, "keydown", { key: "ArrowUp" });
    expect(document.activeElement).toBe(m.items()[4]);
    fire(document.activeElement!, "keydown", { key: "End" });
    expect(document.activeElement).toBe(m.items()[4]);
    fire(document.activeElement!, "keydown", { key: "Home" });
    expect(document.activeElement).toBe(m.items()[0]);
    fire(document.activeElement!, "keydown", { key: "Escape" });
    expect(m.menu()).toBeNull();
    expect(document.activeElement).toBe(m.button);
    // Enter on a focused row activates it (a button's native Enter → click).
    click(m.button);
    fire(document.activeElement!, "keydown", { key: "ArrowDown" });
    click(document.activeElement!);
    expect(m.onLock).toHaveBeenCalledTimes(1);
    m.unmount();
  });

  it("Appearance ▸ is a submenu of Light / Dark / Auto with a ✓ on the current one", () => {
    const m = mount();
    click(m.button);
    const row = m.item("Appearance");
    expect(row.getAttribute("aria-haspopup")).toBe("menu");
    expect(row.getAttribute("aria-expanded")).toBe("false");
    expect(m.submenu()).toBeNull();

    click(row);
    expect(row.getAttribute("aria-expanded")).toBe("true");
    expect(m.choices().map((c) => c.querySelector(".kos-menu-label")?.textContent)).toEqual(["Light", "Dark", "Auto"]);
    // Light is the default, so it is the one checked, and it takes the focus.
    expect(m.choices().map((c) => c.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
    expect(document.activeElement).toBe(m.choices()[0]);
    expect(m.choice("Light").querySelector(".kos-menu-check")?.textContent).toBe("✓");
    expect(m.choice("Dark").querySelector(".kos-menu-check")?.textContent).toBe("");
    m.unmount();
  });

  it("choosing Dark stores it, dresses <html>, closes the whole menu and reports menu_action {item, value}", () => {
    const m = mount();
    click(m.button);
    click(m.item("Appearance"));
    click(m.choice("Dark"));

    expect(readAppearance()).toBe("dark");
    expect(localStorage.getItem(APPEARANCE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute("data-appearance")).toBe("dark");
    expect(track).toHaveBeenCalledWith("menu_action", { item: "appearance", value: "dark" });
    expect(m.menu()).toBeNull();
    expect(document.activeElement).toBe(m.button);

    // Reopened, the submenu now opens on Dark and Auto is still selectable.
    click(m.button);
    click(m.item("Appearance"));
    expect(document.activeElement).toBe(m.choices()[1]);
    expect(m.choices().map((c) => c.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    click(m.choice("Auto"));
    expect(readAppearance()).toBe("auto");
    expect(document.documentElement.getAttribute("data-appearance")).toBe("auto");
    expect(track).toHaveBeenCalledWith("menu_action", { item: "appearance", value: "auto" });
    m.unmount();
  });

  it("keyboard: → opens the submenu, ↑/↓ wrap inside it, ← and Esc go back to the row without choosing", () => {
    const m = mount();
    click(m.button);
    m.item("Appearance").focus();
    fire(document.activeElement!, "keydown", { key: "ArrowRight" });
    expect(m.submenu()).not.toBeNull();
    expect(document.activeElement).toBe(m.choices()[0]);

    fire(document.activeElement!, "keydown", { key: "ArrowDown" });
    expect(document.activeElement).toBe(m.choices()[1]);
    fire(document.activeElement!, "keydown", { key: "ArrowUp" });
    fire(document.activeElement!, "keydown", { key: "ArrowUp" });
    expect(document.activeElement).toBe(m.choices()[2]);
    fire(document.activeElement!, "keydown", { key: "Home" });
    expect(document.activeElement).toBe(m.choices()[0]);

    // ← closes the submenu only; the menu itself stays open on the row.
    fire(document.activeElement!, "keydown", { key: "ArrowLeft" });
    expect(m.submenu()).toBeNull();
    expect(m.menu()).not.toBeNull();
    expect(document.activeElement).toBe(m.item("Appearance"));

    // Esc inside the submenu does the same, and never closes the whole menu.
    fire(document.activeElement!, "keydown", { key: "ArrowRight" });
    fire(document.activeElement!, "keydown", { key: "Escape" });
    expect(m.submenu()).toBeNull();
    expect(m.menu()).not.toBeNull();
    expect(readAppearance()).toBe("light");
    m.unmount();
  });

  it("a click outside closes it without choosing; Tab closes it too", () => {
    const m = mount();
    click(m.button);
    fire(m.container.querySelector("#outside")!, "pointerdown");
    expect(m.menu()).toBeNull();
    expect(m.onAbout).not.toHaveBeenCalled();
    click(m.button);
    fire(document.activeElement!, "keydown", { key: "Tab" });
    expect(m.menu()).toBeNull();
    m.unmount();
  });
});

import { describe, it, expect } from "vitest";
import { EMPTY_WINDOWS, isOpen, topWindow, windowsReducer } from "./windows";

describe("windowsReducer", () => {
  it("opens a window on top with its origin rect", () => {
    const s = windowsReducer(EMPTY_WINDOWS, { type: "open", id: "projects", origin: { x: 1, y: 2, w: 3, h: 4 } });
    expect(s.windows).toHaveLength(1);
    expect(s.windows[0]).toMatchObject({ id: "projects", minimized: false, origin: { x: 1, y: 2, w: 3, h: 4 } });
    expect(topWindow(s)).toBe("projects");
    expect(isOpen(s, "projects")).toBe(true);
  });

  it("re-opening an open window just focuses it (and restores it if minimised)", () => {
    let s = windowsReducer(EMPTY_WINDOWS, { type: "open", id: "projects" });
    s = windowsReducer(s, { type: "open", id: "about" });
    s = windowsReducer(s, { type: "minimize", id: "projects" });
    expect(s.windows.find((w) => w.id === "projects")?.minimized).toBe(true);
    s = windowsReducer(s, { type: "open", id: "projects" });
    expect(s.windows).toHaveLength(2);
    expect(s.windows.find((w) => w.id === "projects")?.minimized).toBe(false);
    expect(topWindow(s)).toBe("projects");
  });

  it("focus raises a window above the others without reordering the array", () => {
    let s = windowsReducer(EMPTY_WINDOWS, { type: "open", id: "projects" });
    s = windowsReducer(s, { type: "open", id: "about" });
    s = windowsReducer(s, { type: "focus", id: "projects" });
    expect(s.windows.map((w) => w.id)).toEqual(["projects", "about"]);
    expect(topWindow(s)).toBe("projects");
  });

  it("close removes it and the next highest becomes top; minimised windows are never top", () => {
    let s = windowsReducer(EMPTY_WINDOWS, { type: "open", id: "projects" });
    s = windowsReducer(s, { type: "open", id: "about" });
    s = windowsReducer(s, { type: "open", id: "case:rc-car" });
    s = windowsReducer(s, { type: "close", id: "case:rc-car" });
    expect(topWindow(s)).toBe("about");
    s = windowsReducer(s, { type: "minimize", id: "about" });
    expect(topWindow(s)).toBe("projects");
    s = windowsReducer(s, { type: "close", id: "projects" });
    expect(topWindow(s)).toBeNull();
    s = windowsReducer(s, { type: "restore", id: "about" });
    expect(topWindow(s)).toBe("about");
  });

  it("closing an unknown window is a no-op that returns the same state", () => {
    const s = windowsReducer(EMPTY_WINDOWS, { type: "open", id: "projects" });
    expect(windowsReducer(s, { type: "close", id: "trash" })).toBe(s);
  });
});

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { act } from "react";
import { click, fire, installPointerCapture, realClick, render } from "@/test/render";
import { MS } from "@/lib/motion";
import Window from "./Window";

/*
 * The close / minimise beats (2026-09-20, "closing tabs and windows animation
 * is a little weird and buggy: it goes to the folders, minimizes, and then
 * closes"). Root cause on the live site: [data-anim="close"] reused the open
 * keyframes (`kos-win-open … reverse`); CSS only restarts an animation when
 * its NAME changes, so the finished open animation was merely edited in place
 * and its fill jumped the frame to the origin rect for 320 ms before the
 * unmount. These tests pin the contract: distinct keyframes per beat, one
 * animation state per transition, one dispatch per close.
 */

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  installPointerCapture();
});

const css = readFileSync(path.join(process.cwd(), "app/kalpos.css"), "utf8");
const rule = (selector: string) => {
  const i = css.indexOf(selector + " {");
  expect(i, `rule ${selector}`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf("\n}", i));
};

describe("kalpos.css: each window beat has its own keyframes", () => {
  it("open, close and minimise never share an animation-name (a shared name is never restarted)", () => {
    expect(rule('.kos-window[data-anim="open"]')).toMatch(/animation:\s*kos-win-open\b/);
    expect(rule('.kos-window[data-anim="close"]')).toMatch(/animation:\s*kos-win-close\s+160ms/);
    expect(rule('.kos-window[data-anim="close"]')).not.toMatch(/reverse/);
    expect(rule('.kos-window[data-anim="min"]')).toMatch(/animation:\s*kos-win-min\s+320ms/);
    expect(css).toMatch(/@keyframes kos-win-close/);
    expect(css).toMatch(/@keyframes kos-win-min/);
  });

  it("close is in place: scale 1 → .96 and opacity 1 → 0, no translate", () => {
    const kf = rule("@keyframes kos-win-close");
    expect(kf).toMatch(/scale\(0\.96\)/);
    expect(kf).toMatch(/opacity:\s*0/);
    expect(kf).not.toMatch(/translate/);
  });

  it("the timings in lib/motion agree with the CSS", () => {
    expect(MS.winClose).toBe(160);
    expect(MS.minimize).toBe(320);
  });
});

function fakeRect(el: Element, r: { x: number; y: number; w: number; h: number }) {
  (el as HTMLElement).getBoundingClientRect = () => ({ left: r.x, top: r.y, width: r.w, height: r.h, right: r.x + r.w, bottom: r.y + r.h, x: r.x, y: r.y, toJSON() {} }) as DOMRect;
}

function mount(over: Partial<React.ComponentProps<typeof Window>> = {}) {
  const onClose = vi.fn();
  const onFocus = vi.fn();
  const onMinimize = vi.fn();
  const r = render(
    <Window id="about" title="About me" focused z={3} onClose={onClose} onFocus={onFocus} onMinimize={onMinimize} width={520} origin={{ x: 40, y: 80, w: 96, h: 96 }} {...over}>
      <button id="first">first</button>
    </Window>,
  );
  const dlg = r.container.querySelector<HTMLElement>('[role="dialog"]')!;
  fakeRect(dlg, { x: 400, y: 100, w: 520, h: 400 });
  return { ...r, dlg, onClose, onFocus, onMinimize };
}

describe("Window animation state (close in place, minimise into the dock, exactly once)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("close: data-anim goes open → close in place, onClose fires once after 160 ms, never toward the origin", () => {
    const m = mount();
    click(m.dlg.querySelector(".kos-light--close")!);
    expect(m.dlg.getAttribute("data-anim")).toBe("close");
    expect(m.onClose).not.toHaveBeenCalled();
    // a close never re-points the FLIP variables at the icon
    expect(m.dlg.style.getPropertyValue("--from-x")).toBe("");
    act(() => { vi.advanceTimersByTime(MS.winClose - 1); });
    expect(m.onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(2); });
    expect(m.onClose).toHaveBeenCalledTimes(1);
    m.unmount();
  });

  it("a second close (red light again, Escape, the parent's closeRequest) during the beat does not dispatch twice", () => {
    const m = mount();
    click(m.dlg.querySelector(".kos-light--close")!);
    click(m.dlg.querySelector(".kos-light--close")!);
    fire(m.dlg, "keydown", { key: "Escape" });
    m.rerender(
      <Window id="about" title="About me" focused z={3} onClose={m.onClose} onFocus={m.onFocus} onMinimize={m.onMinimize} width={520} closeRequest={1}>
        <button id="first">first</button>
      </Window>,
    );
    act(() => { vi.advanceTimersByTime(1000); });
    expect(m.onClose).toHaveBeenCalledTimes(1);
    m.unmount();
  });

  it("a held click on the red light while the open animation is still running cancels it and closes in place", () => {
    const m = mount();
    const cancel = vi.fn();
    (m.dlg as HTMLElement & { getAnimations: () => Animation[] }).getAnimations = () => [{ cancel, playState: "running" } as unknown as Animation];
    realClick(m.dlg.querySelector(".kos-light--close")!);
    expect(cancel).toHaveBeenCalled();
    expect(m.dlg.getAttribute("data-anim")).toBe("close");
    act(() => { vi.advanceTimersByTime(MS.winClose + 1); });
    expect(m.onClose).toHaveBeenCalledTimes(1);
    m.unmount();
  });

  it("minimise: travels toward this window's own dock tile ([data-window]) over 320 ms, then onMinimize once", () => {
    const dock = document.createElement("nav");
    dock.className = "kos-dock";
    const tile = document.createElement("button");
    tile.className = "kos-dock-item";
    tile.setAttribute("data-window", "about");
    fakeRect(tile, { x: 700, y: 730, w: 54, h: 54 });
    dock.appendChild(tile);
    document.body.appendChild(dock);
    const m = mount();
    click(m.dlg.querySelector(".kos-light--min")!);
    expect(m.dlg.getAttribute("data-anim")).toBe("min");
    expect(m.dlg.style.getPropertyValue("--from-x")).toBe("300px");
    expect(m.dlg.style.getPropertyValue("--from-y")).toBe("630px");
    click(m.dlg.querySelector(".kos-light--min")!);
    act(() => { vi.advanceTimersByTime(MS.minimize + 1); });
    expect(m.onMinimize).toHaveBeenCalledTimes(1);
    m.unmount();
    dock.remove();
  });

  it("reduced motion: close and minimise dispatch at once with no travel", () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduced-motion"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const m = mount();
    click(m.dlg.querySelector(".kos-light--close")!);
    expect(m.onClose).toHaveBeenCalledTimes(1);
    m.unmount();
    window.matchMedia = mm;
  });
});

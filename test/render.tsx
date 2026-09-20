import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * Minimal DOM render helper for component tests (jsdom, no testing-library).
 * Returns the container and an unmount; wrap interactions in `act`.
 */
export function render(el: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => root.render(el));
  return {
    container,
    rerender: (next: React.ReactElement) => act(() => root.render(next)),
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

export function fire(el: Element, type: string, init: Record<string, unknown> = {}) {
  let ev: Event;
  if (type.startsWith("key")) ev = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
  else if (type.startsWith("pointer")) ev = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  else ev = new Event(type, { bubbles: true, cancelable: true, ...init });
  act(() => {
    el.dispatchEvent(ev);
  });
  return ev;
}

export function click(el: Element) {
  act(() => {
    (el as HTMLElement).click();
  });
}

export function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/*
 * Pointer capture the way Chrome does it. jsdom has no setPointerCapture; the
 * shim records which element captured the pointer so realClick() can retarget
 * the later events exactly as a browser would: "process pending pointer
 * capture" runs before the next pointer event, so pointerup (and the
 * compatibility mouseup) go to the capturing element, and UI Events send the
 * click to the nearest common ancestor of the mousedown and mouseup targets.
 */
let captured: Element | null = null;
const setCaptured = (el: Element | null) => {
  captured = el;
};
export function installPointerCapture() {
  const proto = Element.prototype as Element & {
    setPointerCapture: (id: number) => void;
    releasePointerCapture: (id: number) => void;
    hasPointerCapture: (id: number) => boolean;
  };
  proto.setPointerCapture = function (this: Element) {
    setCaptured(this);
  };
  proto.releasePointerCapture = function (this: Element) {
    if (captured === this) captured = null;
  };
  proto.hasPointerCapture = function (this: Element) {
    return captured === this;
  };
}
export function capturedElement(): Element | null {
  return captured;
}

function commonAncestor(a: Element, b: Element): Element {
  let n: Element | null = a;
  while (n && !n.contains(b)) n = n.parentElement;
  return n ?? a;
}

function pointer(type: string, init: Record<string, unknown> = {}) {
  return new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init });
}

/**
 * A real hand's click on `el`: pointerdown, an optional move of `move` px,
 * pointerup, click, with pointer capture applied the way the browser applies
 * it. Returns the element the click event actually reached.
 */
export function realClick(el: Element, { move = 0, x = 100, y = 100 }: { move?: number; x?: number; y?: number } = {}): Element | null {
  captured = null;
  let clickedOn: Element | null = null;
  const seen = (e: Event) => {
    clickedOn = e.target as Element;
  };
  document.addEventListener("click", seen, true);
  act(() => {
    el.dispatchEvent(pointer("pointerdown", { clientX: x, clientY: y, pointerId: 1, timeStamp: 0 }));
    const dx = move;
    if (dx) {
      const moveTarget = captured ?? el;
      moveTarget.dispatchEvent(pointer("pointermove", { clientX: x + dx, clientY: y, pointerId: 1 }));
    }
    const upTarget = captured ?? el;
    upTarget.dispatchEvent(pointer("pointerup", { clientX: x + dx, clientY: y, pointerId: 1 }));
    commonAncestor(el, upTarget).dispatchEvent(pointer("click", { clientX: x + dx, clientY: y }));
  });
  document.removeEventListener("click", seen, true);
  return clickedOn;
}

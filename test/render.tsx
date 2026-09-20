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

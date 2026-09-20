"use client";

import { useEffect, useId, useRef } from "react";

/*
 * "Restart KalpOS? The desk will reboot." A small confirm sheet in the
 * window idiom (card 2d: #f8f4f4, radius 12, the lg shadow) over a light
 * scrim: the KK mark, the question, one line, Cancel / Restart. Restart has
 * focus (Enter reboots), Esc or the scrim cancels, Tab wraps between the two
 * buttons, and on Cancel focus goes back to where it came from (the menu
 * button). role="alertdialog": it interrupts and needs an answer.
 */
export default function RestartSheet({ onCancel, onRestart }: { onCancel: () => void; onRestart: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const from = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    from.current = document.activeElement;
    primary.current?.focus({ preventScroll: true });
  }, []);

  const cancel = () => {
    onCancel();
    const el = from.current as HTMLElement | null;
    if (el && el.isConnected && typeof el.focus === "function") el.focus({ preventScroll: true });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    } else if (e.key === "Tab") {
      const btns = [...(box.current?.querySelectorAll<HTMLElement>("button") ?? [])];
      const i = btns.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length]?.focus({ preventScroll: true });
    }
  };

  return (
    <div
      className="kos-alert-scrim"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} className="kos-alert" onKeyDown={onKey}>
        <div className="kos-alert-mark" aria-hidden>
          KK
        </div>
        <h2 id={titleId}>Restart KalpOS?</h2>
        <p id={descId}>The desk will reboot.</p>
        <div className="kos-alert-actions">
          <button type="button" className="kos-alert-btn" onClick={cancel}>
            Cancel
          </button>
          <button ref={primary} type="button" className="kos-alert-btn kos-alert-btn--primary" onClick={onRestart}>
            Restart
          </button>
        </div>
      </div>
    </div>
  );
}

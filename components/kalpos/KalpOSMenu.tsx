"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { isMuted, setMuted, subscribeMute } from "@/lib/chime";
import { track } from "@/lib/track";

/*
 * The KalpOS menu: the brand word in the menubar (and the ■ KalpOS in the
 * phone's top bar) is a real menu button. Its dropdown is the dock's frost
 * (card 2c: rgba(248,244,244,.62) blur(24px) saturate(1.4), radius 12, a
 * 1 px white .75 edge, the lg shadow) with 13 px rows: About KalpOS, a
 * separator, Lock Screen (⌃⌘Q), Restart… (⌃⌘R), a separator, and the chime
 * toggle that mirrors the speaker in the menubar's right cluster.
 *
 * The dropdown is portalled next to the bar, not inside it: a bar with its
 * own backdrop-filter is a "backdrop root", so a frosted child would only
 * blur the bar's own content and the desk would show through crisp. It is
 * placed from the button's rect, relative to the bar's parent (the desk or
 * the phone shell, both position: absolute; inset: 0).
 *
 * WAI-ARIA menu button: aria-haspopup="menu" + aria-expanded on the button,
 * role="menu" / role="menuitem" inside. Click, Enter, Space or ↓ open it with
 * the first row focused; ↑/↓ move (wrapping), Home/End jump, Esc and Tab
 * close, a click outside closes; choosing a row closes it. Focus always
 * returns to the button. PostHog: menu_action {item}.
 */

export type MenuItem = "about" | "lock" | "restart" | "mute";

function useMuted(): boolean {
  return useSyncExternalStore(subscribeMute, isMuted, () => false);
}

export default function KalpOSMenu({
  onAbout,
  onLock,
  onRestart,
  className = "kos-brand",
}: {
  onAbout: () => void;
  onLock: () => void;
  onRestart: () => void;
  className?: string;
}) {
  /** Open = placed: the host element and the offset under the button (see the note above). */
  const [place, setPlace] = useState<{ host: HTMLElement; left: number; top: number } | null>(null);
  const open = place !== null;
  const muted = useMuted();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = useCallback(() => [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])], []);

  const close = useCallback((refocus = true) => {
    setPlace(null);
    if (refocus) button.current?.focus({ preventScroll: true });
  }, []);

  const openMenu = useCallback(() => {
    const btn = button.current;
    if (!btn) return;
    const bar = btn.closest<HTMLElement>(".kos-menubar, .kos-phone-bar");
    const host = bar?.parentElement ?? btn.parentElement;
    if (!host) return;
    const b = btn.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    setPlace({ host, left: b.left - h.left - 7, top: b.bottom - h.top + 8 });
  }, []);

  // Focus the first row once the menu exists.
  useEffect(() => {
    if (open) items()[0]?.focus({ preventScroll: true });
  }, [open, items]);

  // A press anywhere outside the button or the menu closes it (no choice made).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      const t = e.target as Node | null;
      if (button.current?.contains(t) || menu.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  const choose = (item: MenuItem, action: () => void) => {
    close();
    track("menu_action", { item });
    action();
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const all = items();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      all[(n + all.length) % all.length]?.focus({ preventScroll: true });
    };
    switch (e.key) {
      case "ArrowDown":
        return go(i + 1);
      case "ArrowUp":
        return go(i - 1);
      case "Home":
        return go(0);
      case "End":
        return go(all.length - 1);
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        return close();
      case "Tab":
        return close(false);
    }
  };

  const onButtonKey = (e: React.KeyboardEvent) => {
    // Enter and Space are the button's own click; ↓ (and ↑) open it like a native menu.
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    }
  };

  const row = (item: MenuItem, label: string, action: () => void, kbd?: string) => (
    <button type="button" role="menuitem" className="kos-menu-row" tabIndex={-1} onClick={() => choose(item, action)}>
      <span className="kos-menu-label">{label}</span>
      {kbd ? (
        <span className="kos-menu-kbd" aria-hidden>
          {kbd}
        </span>
      ) : null}
    </button>
  );

  const dropdown = (
    <div
      ref={menu}
      id={menuId}
      role="menu"
      aria-label="KalpOS"
      className="kos-menu"
      style={{ left: place?.left, top: place?.top }}
      onKeyDown={onMenuKey}
    >
      {row("about", "About KalpOS", onAbout)}
      <i role="separator" className="kos-menu-sep" />
      {row("lock", "Lock Screen", onLock, "⌃⌘Q")}
      {row("restart", "Restart…", onRestart, "⌃⌘R")}
      <i role="separator" className="kos-menu-sep" />
      {row("mute", muted ? "Unmute chime" : "Mute chime", () => setMuted(!muted))}
    </div>
  );

  return (
    <>
      <button
        ref={button}
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-open={open ? "true" : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKey}
      >
        KalpOS
      </button>
      {place ? createPortal(dropdown, place.host) : null}
    </>
  );
}

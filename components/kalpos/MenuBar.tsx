"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMute } from "@/lib/chime";
import { CLOCK_IDS, formatMenubarClock } from "@/lib/clock";
import KalpOSMenu from "./KalpOSMenu";

const MENUS = ["File", "Edit", "View", "Go", "Window"];
/** Card 2d: with a window focused the bar reads "KalpOS · Projects · File · View · Go". */
const MENUS_FOCUSED = ["File", "View", "Go"];

/**
 * Card 2c's menubar: the brand (a real menu button, KalpOSMenu.tsx: About,
 * Lock Screen, Restart…, the chime toggle), the five menu words, and on the right the
 * Résumé pill (hidden while lib/site.ts has no resumeUrl), the startup-chime
 * mute toggle (lib/chime.ts, persisted as kalpos:mute), wifi, battery and
 * the live clock "Sat 20 Sep  11:42". The visits count in the mock is
 * omitted: there is no cheap PostHog endpoint for it and the spec says not
 * to fake it. The clock node is filled before first paint by CLOCK_SCRIPT
 * (LockScreen renders that script; here the effect keeps it current).
 */
function useMuted(): boolean {
  return useSyncExternalStore(subscribeMute, isMuted, () => false);
}

export default function MenuBar({
  resumeUrl,
  activeTitle,
  onAbout = () => {},
  onLock = () => {},
  onRestart = () => {},
  onCleanUp,
}: {
  resumeUrl: string;
  activeTitle?: string;
  onAbout?: () => void;
  onLock?: () => void;
  onRestart?: () => void;
  /** Clean Up (⌥⌘1): the desk's icons back to the card 2c grid. Absent on the phone. */
  onCleanUp?: () => void;
}) {
  const clockEl = useRef<HTMLSpanElement>(null);
  const muted = useMuted();
  useEffect(() => {
    const tick = () => {
      const c = formatMenubarClock(new Date());
      const text = `${c.date}\u2002\u2002${c.time}`;
      if (clockEl.current && clockEl.current.textContent !== text) clockEl.current.textContent = text;
    };
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="kos-menubar" aria-label="Menu bar">
      <KalpOSMenu onAbout={onAbout} onLock={onLock} onRestart={onRestart} onCleanUp={onCleanUp} />
      {activeTitle ? <b style={{ opacity: 0.9 }}>{activeTitle}</b> : null}
      {(activeTitle ? MENUS_FOCUSED : MENUS).map((m) => (
        <span key={m} className="kos-menu-item" aria-hidden>
          {m}
        </span>
      ))}
      <span className="kos-menubar-right">
        {resumeUrl ? (
          <a className="kos-pill" href={resumeUrl} target="_blank" rel="noreferrer">
            Résumé ↓
          </a>
        ) : null}
        <button
          type="button"
          className="kos-mute"
          aria-pressed={muted}
          aria-label={muted ? "Unmute the startup chime" : "Mute the startup chime"}
          title={muted ? "Startup chime off" : "Startup chime on"}
          onClick={() => setMuted(!muted)}
        >
          {muted ? <SpeakerSlash size={15} weight="bold" /> : <SpeakerHigh size={15} weight="bold" />}
        </button>
        <span className="kos-wifi" aria-hidden><i /><i /><i /><i /></span>
        <span className="kos-battery" aria-hidden><span><i /></span><i /></span>
        <span ref={clockEl} id={CLOCK_IDS.menubar} className="kos-clock" suppressHydrationWarning>
          {"\u00a0"}
        </span>
      </span>
    </header>
  );
}

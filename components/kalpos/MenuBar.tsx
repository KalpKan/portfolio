"use client";

import { useEffect, useRef } from "react";
import { CLOCK_IDS, formatMenubarClock } from "@/lib/clock";

const MENUS = ["File", "Edit", "View", "Go", "Window"];
/** Card 2d: with a window focused the bar reads "KalpOS · Projects · File · View · Go". */
const MENUS_FOCUSED = ["File", "View", "Go"];

/**
 * Card 2c's menubar: brand, the five menu words, and on the right the
 * Résumé pill (hidden while lib/site.ts has no resumeUrl), wifi, battery and
 * the live clock "Sat 20 Sep  11:42". The visits count in the mock is
 * omitted: there is no cheap PostHog endpoint for it and the spec says not
 * to fake it. The clock node is filled before first paint by CLOCK_SCRIPT
 * (LockScreen renders that script; here the effect keeps it current).
 */
export default function MenuBar({ resumeUrl, activeTitle }: { resumeUrl: string; activeTitle?: string }) {
  const clockEl = useRef<HTMLSpanElement>(null);
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
      <b>KalpOS</b>
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
        <span className="kos-wifi" aria-hidden><i /><i /><i /><i /></span>
        <span className="kos-battery" aria-hidden><span><i /></span><i /></span>
        <span ref={clockEl} id={CLOCK_IDS.menubar} className="kos-clock" suppressHydrationWarning>
          {"\u00a0"}
        </span>
      </span>
    </header>
  );
}

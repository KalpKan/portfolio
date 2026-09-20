"use client";

import { useEffect, useState } from "react";
import { CLOCK_IDS, formatMenubarClock } from "@/lib/clock";

const MENUS = ["File", "Edit", "View", "Go", "Window"];

/**
 * Card 2c's menubar: brand, the five menu words, and on the right the
 * Résumé pill (hidden while lib/site.ts has no resumeUrl), wifi, battery and
 * the live clock "Sat 20 Sep  11:42". The visits count in the mock is
 * omitted: there is no cheap PostHog endpoint for it and the spec says not
 * to fake it. The clock node is filled before first paint by CLOCK_SCRIPT
 * (LockScreen renders that script; here the effect keeps it current).
 */
export default function MenuBar({ resumeUrl, activeTitle }: { resumeUrl: string; activeTitle?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);
  const clock = now ? formatMenubarClock(now) : null;
  return (
    <header className="kos-menubar" aria-label="Menu bar">
      <b>KalpOS</b>
      {activeTitle ? <b style={{ opacity: 0.9 }}>{activeTitle}</b> : null}
      {MENUS.map((m) => (
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
        <span id={CLOCK_IDS.menubar} className="kos-clock" suppressHydrationWarning>
          {clock ? `${clock.date}  ${clock.time}` : " "}
        </span>
      </span>
    </header>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CLOCK_IDS, CLOCK_SCRIPT, formatLockDate, formatLockTime } from "@/lib/clock";
import { InlineScript } from "./InlineScript";

/**
 * Card 3c: the black lock screen. Date over a very large clock, the KK
 * avatar, the name, a frosted password pill and the caption. Any text
 * unlocks: each typed character pops in a dot (3b: scale .3→1), Enter, the
 * → button or a bare tap of the pill (phone) call onUnlock. The pulse and
 * the blur-out are the parent's (KalpOS.tsx) job once onUnlock fires.
 *
 * The clock is the visitor's local time. The server renders a placeholder
 * of the same size; CLOCK_SCRIPT fills the real value before the first
 * paint so nothing shifts, and the effect keeps it ticking.
 */
export default function LockScreen({
  onUnlock,
  name,
  pulsing = false,
}: {
  onUnlock: () => void;
  name: string;
  pulsing?: boolean;
}) {
  const [pw, setPw] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  const initials = name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="kos-lock" aria-label="Lock screen">
      <div className="kos-lock-status" aria-hidden>
        <span className="kos-wifi"><i /><i /><i /><i /></span>
        <span className="kos-battery"><span><i /></span><i /></span>
      </div>

      <div className="kos-lock-clock">
        <span id={CLOCK_IDS.lockDate} className="kos-lock-date" suppressHydrationWarning>
          {now ? formatLockDate(now) : " "}
        </span>
        <time id={CLOCK_IDS.lockTime} className="kos-lock-time" suppressHydrationWarning>
          {now ? formatLockTime(now) : " "}
        </time>
        <InlineScript html={CLOCK_SCRIPT} />
      </div>

      <div className="kos-lock-user">
        <div className="kos-avatar" aria-hidden>
          {initials}
        </div>
        <span className="kos-lock-name">{name}</span>
        {/* The pill is a real button on top of the field: on a phone one tap unlocks. */}
        <div
          className="kos-pw"
          data-pulse={pulsing ? "true" : undefined}
          onClick={(e) => {
            if (e.target === e.currentTarget && !pw) onUnlock();
          }}
        >
          <input
            ref={input}
            id={inputId}
            type="password"
            autoComplete="off"
            aria-label="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onUnlock();
              }
            }}
          />
          {pw ? (
            <div className="kos-pw-dots" aria-hidden>
              {Array.from(pw, (_, i) => (
                <i key={i} />
              ))}
            </div>
          ) : (
            <span className="kos-pw-placeholder">Enter Password</span>
          )}
          {pw ? (
            <button type="button" className="kos-pw-go" aria-label="Unlock" onClick={onUnlock}>
              →
            </button>
          ) : null}
        </div>
        <button
          type="button"
          id="kos-unlock"
          className="kos-lock-caption"
          style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
          onClick={onUnlock}
        >
          It&#39;s a portfolio — type anything, then Enter
        </button>
      </div>
    </div>
  );
}

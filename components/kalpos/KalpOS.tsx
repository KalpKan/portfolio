"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { MS, reducedMotion } from "@/lib/motion";
import type { Project } from "@/lib/projects";
import { checksDone, initialSignals, runHealthChecks, type Signal } from "@/lib/signal";
import { SITE, type SiteConfig } from "@/lib/site";
import { tilesFor } from "@/lib/tiles";
import { track } from "@/lib/track";
import { markVisited } from "@/lib/visitor";
import { EMPTY_WINDOWS, windowsReducer, type WindowId, type WindowsState } from "@/lib/windows";
import Desk from "./Desk";
import LockScreen from "./LockScreen";
import PhoneSheet from "./PhoneSheet";

/*
 * The KalpOS root. Owns the boot stage (lock → unlocking → desk), the
 * returning-visitor skip, the phone/desk switch, the window reducer and the
 * one health round the desk runs on load.
 *
 * Boot (cards 3c + 3b + 2a): the desk is rendered under the lock from the
 * first paint. On Enter the pill pulses for 400 ms, then the lock blurs out
 * while the desk scales 1.06→1 (900 ms, CSS), the menubar drops in, icons
 * pop 40 ms apart and the dock rises last. A returning visitor (the pre-paint
 * script in app/layout.tsx set data-kos-boot="desk" on <html>) or a deep link
 * (skipLock) starts on the desk with a 400 ms crossfade.
 */

type Stage = "lock" | "unlocking" | "desk";

const PHONE_QUERY = "(max-width: 768px)";

function subscribePhone(cb: () => void) {
  const mq = window.matchMedia?.(PHONE_QUERY);
  mq?.addEventListener?.("change", cb);
  return () => mq?.removeEventListener?.("change", cb);
}

function usePhone(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => !!window.matchMedia?.(PHONE_QUERY).matches,
    () => false,
  );
}

const noSubscribe = () => () => {};

/** The pre-paint script's verdict (app/layout.tsx): "desk" for a returning visitor. */
function useBootAttr(): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => document.documentElement.getAttribute("data-kos-boot"),
    () => null,
  );
}

type Health = { signals: Record<string, Signal>; checkedAt: Date | null };

function initialWindows(initialWindow?: WindowId): WindowsState {
  return initialWindow ? windowsReducer(EMPTY_WINDOWS, { type: "open", id: initialWindow }) : EMPTY_WINDOWS;
}

export default function KalpOS({
  projects,
  site = SITE,
  skipLock = false,
  initialWindow,
  initialBody,
}: {
  projects: Project[];
  site?: SiteConfig;
  /** Deep links start on the desk (no lock) with `initialWindow` open. */
  skipLock?: boolean;
  initialWindow?: WindowId;
  /** The server-rendered body of the deep-linked case-study window. */
  initialBody?: React.ReactNode;
}) {
  const tiles = useMemo(() => tilesFor(projects), [projects]);
  const [stageState, setStage] = useState<Stage>(skipLock ? "desk" : "lock");
  const [bootState, setBoot] = useState<"animate" | "crossfade" | null>(skipLock ? "crossfade" : null);
  const [pulsing, setPulsing] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer, initialWindow, initialWindows);
  const [health, setHealth] = useState<Health>(() => ({ signals: initialSignals(tiles), checkedAt: null }));
  const timers = useRef<number[]>([]);
  const phone = usePhone();

  // Returning visitor: the pre-paint script already shows the desk; agree with it.
  const returning = useBootAttr() === "desk" && stageState === "lock";
  const stage: Stage = returning ? "desk" : stageState;
  const boot = returning ? "crossfade" : bootState;

  // One health round per page load, started as soon as the desk exists (behind the lock).
  useEffect(
    () =>
      runHealthChecks(tiles, (slug, sig) =>
        setHealth((h) => {
          const signals = { ...h.signals, [slug]: sig };
          return { signals, checkedAt: h.checkedAt ?? (checksDone(signals) ? new Date() : null) };
        }),
      ),
    [tiles],
  );
  const { signals, checkedAt } = health;

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const unlock = useCallback(() => {
    if (stage !== "lock" || pulsing) return;
    setPulsing(true);
    const reduced = reducedMotion();
    timers.current.push(
      window.setTimeout(() => {
        setStage("unlocking");
        setBoot(reduced ? "crossfade" : "animate");
        markVisited();
        track("unlocked");
        timers.current.push(window.setTimeout(() => setStage("desk"), reduced ? MS.crossfade : MS.unlock));
      }, MS.pulse),
    );
  }, [stage, pulsing]);

  // Opening a case study from the desk gives it its shareable URL; closing the last one restores "/".
  const onOpenWindow = useCallback((id: WindowId) => {
    track("window_opened", { slug: id });
    if (id.startsWith("case:") && typeof history !== "undefined") history.replaceState(null, "", `/projects/${id.slice(5)}`);
  }, []);
  const openCases = windows.windows.filter((w) => w.id.startsWith("case:")).length;
  const prevCases = useRef(openCases);
  useEffect(() => {
    if (prevCases.current > 0 && openCases === 0 && location.pathname.startsWith("/projects/")) history.replaceState(null, "", "/");
    prevCases.current = openCases;
  }, [openCases]);

  const caseBodies = useMemo(
    () => (initialWindow?.startsWith("case:") && initialBody ? { [initialWindow.slice(5)]: initialBody } : {}),
    [initialWindow, initialBody],
  );

  return (
    <div className="kos" data-stage={stage} data-boot={boot ?? undefined}>
      <a className="kos-skip" href="#kos-main">
        Skip to the desk
      </a>
      {phone ? (
        <div className="kos-desk">
          <PhoneSheet
            tiles={tiles}
            signals={signals}
            site={site}
            checkedAt={checkedAt}
            onOpenCase={(slug) => onOpenWindow(`case:${slug}`)}
            initialCase={initialWindow?.startsWith("case:") ? initialWindow.slice(5) : undefined}
            caseBodies={caseBodies}
          />
        </div>
      ) : (
        <Desk
          tiles={tiles}
          signals={signals}
          windows={windows}
          dispatch={dispatch}
          site={site}
          checkedAt={checkedAt}
          caseBodies={caseBodies}
          onOpenWindow={onOpenWindow}
        />
      )}
      {stage === "desk" ? null : <LockScreen onUnlock={unlock} name={site.name} pulsing={pulsing} />}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { BOOT_EXIT_MS, BOOT_MAX_MS, BOOT_MIN_MS, bootDone, bootProgress } from "@/lib/boot";
import { playChime } from "@/lib/chime";
import { MS, reducedMotion } from "@/lib/motion";
import type { Project } from "@/lib/projects";
import { checksDone, initialSignals, runHealthChecks, type Signal } from "@/lib/signal";
import { SITE, type SiteConfig } from "@/lib/site";
import { tilesFor } from "@/lib/tiles";
import { track } from "@/lib/track";
import { EMPTY_WINDOWS, windowsReducer, type WindowId, type WindowsState } from "@/lib/windows";
import BootScreen from "./BootScreen";
import Desk from "./Desk";
import LockScreen from "./LockScreen";
import PhoneSheet from "./PhoneSheet";

/*
 * The KalpOS root. Owns the stage machine (boot → lock → unlocking → desk),
 * the deep-link skip, the phone/desk switch, the window reducer, the one
 * health round the desk runs on load, and the startup chime.
 *
 * Boot (card 2a, then 3b/3c): the KK mark resolves from blur on black while
 * the hairline fills with the health round (lib/boot.ts: at least 900 ms,
 * at most 3 s), then the boot layer fades and the lock fades in under it
 * (BOOT_EXIT_MS). On Enter the pill pulses for 400 ms, the chime sounds,
 * the lock blurs out while the desk scales 1.06→1 (900 ms, CSS), the
 * menubar drops in, icons pop 40 ms apart and the dock rises last.
 *
 * Every plain visit to "/" boots and locks (2026-09-20: no localStorage
 * skip). A deep link (skipLock) or ?desk (the pre-paint script in
 * app/layout.tsx set data-kos-boot="desk" on <html>) starts on the desk with
 * a 400 ms crossfade. Reduced motion: the boot is a 400 ms crossfade to the
 * lock, the unlock a 400 ms crossfade to the desk.
 */

type Stage = "boot" | "lock" | "unlocking" | "desk";

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

/** The pre-paint script's verdict (app/layout.tsx): "desk" for a deep link or ?desk. */
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
  const [stageState, setStage] = useState<Stage>(skipLock ? "desk" : "boot");
  const [bootState, setBoot] = useState<"animate" | "crossfade" | null>(skipLock ? "crossfade" : null);
  const [leaving, setLeaving] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer, initialWindow, initialWindows);
  const [health, setHealth] = useState<Health>(() => ({ signals: initialSignals(tiles), checkedAt: null }));
  const timers = useRef<number[]>([]);
  const phone = usePhone();

  // ?desk: the pre-paint script already shows the desk; agree with it.
  const straightToDesk = useBootAttr() === "desk" && stageState === "boot";
  const stage: Stage = straightToDesk ? "desk" : stageState;
  const boot = straightToDesk ? "crossfade" : bootState;

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

  // The boot: the hairline is the health round; it ends once everything answered
  // and BOOT_MIN_MS passed, or at BOOT_MAX_MS, then the layer leaves over BOOT_EXIT_MS.
  const bootStart = useRef(0);
  const progress = bootProgress(signals, true);
  useEffect(() => {
    if (stage !== "boot" || leaving) return;
    const reduced = reducedMotion();
    if (!bootStart.current) {
      bootStart.current = performance.now();
      // The chime at the boot mark, when a prior gesture in this tab lets audio start.
      void playChime("boot");
    }
    const elapsed = performance.now() - bootStart.current;
    const done = () => {
      setLeaving(true);
      timers.current.push(
        window.setTimeout(() => {
          setStage("lock");
          setLeaving(false);
        }, reduced ? MS.crossfade : BOOT_EXIT_MS),
      );
    };
    if (bootDone({ elapsed, progress, reduced })) {
      done();
      return;
    }
    const wait = progress >= 1 ? BOOT_MIN_MS - elapsed : BOOT_MAX_MS - elapsed;
    const t = window.setTimeout(done, Math.max(0, wait));
    return () => clearTimeout(t);
  }, [stage, leaving, progress]);

  const unlock = useCallback(() => {
    if (stage !== "lock" || pulsing) return;
    setPulsing(true);
    const reduced = reducedMotion();
    // Started inside the gesture (browsers gate audio on one), sounding with the blur-out.
    void playChime("unlock", { delayS: MS.pulse / 1000 });
    timers.current.push(
      window.setTimeout(() => {
        setStage("unlocking");
        setBoot(reduced ? "crossfade" : "animate");
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

  const initials = site.name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="kos" data-stage={stage} data-boot={boot ?? undefined} data-leaving={leaving ? "true" : undefined}>
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
            onCloseCase={() => {
              if (location.pathname.startsWith("/projects/")) history.replaceState(null, "", "/");
            }}
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
      {stage === "boot" ? <BootScreen mark={initials} progress={leaving ? 1 : progress} leaving={leaving} /> : null}
    </div>
  );
}

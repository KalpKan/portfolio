"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { BOOT_EXIT_MS, BOOT_MAX_MS, BOOT_MIN_MS, bootDone, bootProgress } from "@/lib/boot";
import { playChime, rearmChime } from "@/lib/chime";
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
import RestartSheet from "./RestartSheet";

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
 *
 * Two ways back (the KalpOS menu, ⌘L / ⌃⌘R, the terminal's lock / reboot):
 * "locking" runs the unlock in reverse (the desk blurs out and scales to
 * 1.06 over 320 ms while the lock fades in), then clears the windows and
 * shows the lock with the field focused; no chime, it is the same boot.
 * "restarting" fades to black over 300 ms, then resets everything the boot
 * owns (windows, health round, chime, the pre-paint attribute) and sets the
 * stage back to "boot", so the whole sequence replays exactly as a fresh
 * visit without a page load (the session and analytics survive).
 */

type Stage = "boot" | "lock" | "unlocking" | "desk" | "locking" | "restarting";

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
  /** Where the chime sounded this page load (data-chime, so a check can see it). */
  const [chimed, setChimed] = useState<"boot" | "unlock" | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer, initialWindow, initialWindows);
  const [health, setHealth] = useState<Health>(() => ({ signals: initialSignals(tiles), checkedAt: null }));
  /** The "Restart KalpOS?" sheet. */
  const [confirm, setConfirm] = useState(false);
  /** Bumped by a restart: a new health round, a fresh lock screen. */
  const [bootId, setBootId] = useState(0);
  /** Bumped by a lock or a restart: the phone sheet remounts (its sheets are its windows). */
  const [session, setSession] = useState(0);
  const timers = useRef<number[]>([]);
  const phone = usePhone();

  // ?desk: the pre-paint script already shows the desk; agree with it.
  const straightToDesk = useBootAttr() === "desk" && stageState === "boot";
  const stage: Stage = straightToDesk ? "desk" : stageState;
  const boot = straightToDesk ? "crossfade" : bootState;

  // One health round per boot, started as soon as the desk exists (behind the lock).
  useEffect(
    () =>
      runHealthChecks(tiles, (slug, sig) =>
        setHealth((h) => {
          const signals = { ...h.signals, [slug]: sig };
          return { signals, checkedAt: h.checkedAt ?? (checksDone(signals) ? new Date() : null) };
        }),
      ),
    [tiles, bootId],
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
      void playChime("boot").then((ok) => ok && setChimed("boot"));
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
    void playChime("unlock", { delayS: MS.pulse / 1000 }).then((ok) => ok && setChimed("unlock"));
    timers.current.push(
      window.setTimeout(() => {
        setStage("unlocking");
        setBoot(reduced ? "crossfade" : "animate");
        track("unlocked");
        timers.current.push(window.setTimeout(() => setStage("desk"), reduced ? MS.crossfade : MS.unlock));
      }, MS.pulse),
    );
  }, [stage, pulsing]);

  /** Lock Screen and Restart both clear the desk: windows, sheets, and a case study's URL. */
  const clearDesk = useCallback(() => {
    dispatch({ type: "closeAll" });
    setSession((n) => n + 1);
    if (typeof location !== "undefined" && location.pathname.startsWith("/projects/")) history.replaceState(null, "", "/");
  }, []);

  /** Lock Screen: the unlock in reverse, then the lock with the desk cleared (window state never survives it). */
  const lockScreen = useCallback(() => {
    if (stage !== "desk") return;
    setConfirm(false);
    setPulsing(false);
    // A ?desk or deep-link page told the CSS to hide the lock and the boot before the first paint; that job is done.
    document.documentElement.removeAttribute("data-kos-boot");
    setStage("locking");
    timers.current.push(
      window.setTimeout(
        () => {
          clearDesk();
          // Dropped so the chrome drop-in / icon pops replay on the next unlock (invisible now: the desk is hidden under the lock).
          setBoot(null);
          setStage("lock");
        },
        reducedMotion() ? MS.crossfade : MS.lock,
      ),
    );
  }, [stage, clearDesk]);

  /** Restart: fade to black, then boot again from the mark as if the page had just loaded. */
  const restart = useCallback(() => {
    if (stage !== "desk") return;
    setConfirm(false);
    document.documentElement.removeAttribute("data-kos-boot");
    setStage("restarting");
    timers.current.push(
      window.setTimeout(() => {
        clearDesk();
        bootStart.current = 0;
        rearmChime();
        setChimed(null);
        setPulsing(false);
        setLeaving(false);
        setBoot(null);
        setHealth({ signals: initialSignals(tiles), checkedAt: null });
        setBootId((n) => n + 1);
        setStage("boot");
      }, MS.restart),
    );
  }, [stage, tiles, clearDesk]);

  const askRestart = useCallback(() => {
    if (stage === "desk") setConfirm(true);
  }, [stage]);

  // ⌘L locks, ⌃⌘R asks to restart: the menu's own shortcuts, so they count as the menu.
  useEffect(() => {
    if (stage !== "desk") return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "l" && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        track("menu_action", { item: "lock" });
        lockScreen();
      } else if (k === "r" && e.ctrlKey && !confirm) {
        e.preventDefault();
        track("menu_action", { item: "restart" });
        setConfirm(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [stage, confirm, lockScreen]);

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
    <div className="kos" data-stage={stage} data-boot={boot ?? undefined} data-leaving={leaving ? "true" : undefined} data-chime={chimed ?? undefined}>
      <a className="kos-skip" href="#kos-main">
        Skip to the desk
      </a>
      {phone ? (
        <div className="kos-desk">
          <PhoneSheet
            key={session}
            tiles={tiles}
            signals={signals}
            site={site}
            checkedAt={checkedAt}
            onOpenCase={(slug) => onOpenWindow(`case:${slug}`)}
            onCloseCase={() => {
              if (location.pathname.startsWith("/projects/")) history.replaceState(null, "", "/");
            }}
            initialCase={session === 0 && initialWindow?.startsWith("case:") ? initialWindow.slice(5) : undefined}
            caseBodies={caseBodies}
            onLock={lockScreen}
            onRestart={askRestart}
            onReboot={restart}
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
          onLock={lockScreen}
          onRestart={askRestart}
          onReboot={restart}
        />
      )}
      {confirm && stage === "desk" ? <RestartSheet onCancel={() => setConfirm(false)} onRestart={restart} /> : null}
      {stage === "desk" || stage === "restarting" ? null : (
        <LockScreen key={bootId} onUnlock={unlock} name={site.name} pulsing={pulsing} active={stage === "lock"} />
      )}
      {stage === "boot" ? <BootScreen mark={initials} progress={leaving ? 1 : progress} leaving={leaving} /> : null}
      {stage === "restarting" ? <div className="kos-restart" aria-hidden /> : null}
    </div>
  );
}

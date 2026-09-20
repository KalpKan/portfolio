"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import {
  BOOT_BAR_DELAY_MS,
  BOOT_BAR_MIN_MS,
  BOOT_EXIT_MS,
  BOOT_HOLD_MS,
  BOOT_LOGO_MS,
  BOOT_MAX_MS,
  BOOT_REDUCED_HOLD_MS,
  BOOT_STEP_MS,
  bootDone,
  bootFill,
  bootProgress,
  fillDuration,
  startsBoot,
} from "@/lib/boot";
import { playChime, rearmChime } from "@/lib/chime";
import { MS, reducedMotion } from "@/lib/motion";
import type { Project } from "@/lib/projects";
import { checksDone, initialSignals, runHealthChecks, type Signal } from "@/lib/signal";
import { SITE, type SiteConfig } from "@/lib/site";
import { tilesFor, type Tile } from "@/lib/tiles";
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
 * Boot (macOS idiom, 2026-09-20; lib/boot.ts has the timings): a fresh
 * visit is a power screen (black, a faint ⏻, "press any key to start")
 * until a key, click or tap: inside that gesture the chime plays (browsers
 * start audio only there) and the boot begins: the KK mark fades in white,
 * a thin bar appears 700 ms in and fills with the health round (at least
 * 1.4 s visible, the whole boot at most 4 s), holds 250 ms full, then the
 * layer fades and the lock fades in under it (BOOT_EXIT_MS). On Enter the
 * pill pulses for 400 ms, the lock blurs out while the desk scales 1.06→1
 * (900 ms, CSS), the menubar drops in, icons pop 40 ms apart and the dock
 * rises last. No chime at unlock: it sounded at the boot.
 *
 * Every plain visit to "/" boots and locks (2026-09-20: no localStorage
 * skip). A deep link (skipLock) or ?desk (the pre-paint script in
 * app/layout.tsx set data-kos-boot="desk" on <html>) starts on the desk with
 * a 400 ms crossfade. Reduced motion: the boot is a 400 ms crossfade to the
 * lock, the unlock a 400 ms crossfade to the desk.
 *
 * Two ways back (the KalpOS menu, ⌃⌘Q / ⌃⌘R, the terminal's lock / reboot):
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

const COARSE_QUERY = "(pointer: coarse)";

/** A touch device: the power screen says "tap to start". */
function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia?.(COARSE_QUERY);
      mq?.addEventListener?.("change", cb);
      return () => mq?.removeEventListener?.("change", cb);
    },
    () => !!window.matchMedia?.(COARSE_QUERY).matches,
    () => false,
  );
}

/** The pre-paint script's verdict (app/layout.tsx): "desk" for a deep link or ?desk. */
function useBootAttr(): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => document.documentElement.getAttribute("data-kos-boot"),
    () => null,
  );
}

type Health = {
  signals: Record<string, Signal>;
  checkedAt: Date | null;
  /** The boot bar's readiness (lib/boot.ts bootProgress), kept monotone here so the bar never moves backwards. */
  ready: number;
};

function freshHealth(tiles: Tile[]): Health {
  const signals = initialSignals(tiles);
  return { signals, checkedAt: null, ready: bootProgress(signals, true) };
}

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
  /** The power screen: a fresh visit waits for a gesture; a Restart already had one. */
  const [power, setPower] = useState<"off" | "on">("off");
  /** performance.now() at the power button (null until then); every boot timing counts from it. */
  const [bootAt, setBootAt] = useState<number | null>(null);
  /** Set once the boot has decided to end (the hold, then leaving): later readiness no longer counts. */
  const bootEnding = useRef(false);
  /** performance.now() when the bar's glide to 100 % began (null until readiness is complete and the bar is shown). */
  const fullAt = useRef<number | null>(null);
  /** The bar shows BOOT_LOGO_MS + BOOT_BAR_DELAY_MS after the power button (at once under reduced motion). */
  const [barShownAfterLogo, setBarShown] = useState(false);
  /** Set once the chime sounded this boot (data-chime, so a check can see it). */
  const [chimed, setChimed] = useState<"boot" | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer, initialWindow, initialWindows);
  const [health, setHealth] = useState<Health>(() => freshHealth(tiles));
  /** The "Restart KalpOS?" sheet. */
  const [confirm, setConfirm] = useState(false);
  /** Bumped by a restart: a new health round, a fresh lock screen. */
  const [bootId, setBootId] = useState(0);
  /** Bumped by a lock or a restart: the phone sheet remounts (its sheets are its windows). */
  const [session, setSession] = useState(0);
  const timers = useRef<number[]>([]);
  const phone = usePhone();
  const coarse = useCoarsePointer();

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
          return { signals, checkedAt: h.checkedAt ?? (checksDone(signals) ? new Date() : null), ready: bootFill(h.ready, bootProgress(signals, true)) };
        }),
      ),
    [tiles, bootId],
  );
  const { signals, checkedAt, ready } = health;

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // The power button (a fresh visit): the first key, click or tap starts the boot,
  // and the chime plays inside that gesture, which is the only place a browser lets
  // audio start. Listened for on the document in the capture phase so nothing under
  // the layer sees it first; never prevented (⌘L, ⌘R stay the browser's); ignored
  // once the boot is running.
  useEffect(() => {
    if (stage !== "boot" || power !== "off") return;
    let fired = false;
    const onGesture = (e: Event) => {
      if (fired || !startsBoot(e as KeyboardEvent)) return;
      fired = true;
      void playChime("boot").then((ok) => ok && setChimed("boot"));
      setBootAt(performance.now());
      setPower("on");
    };
    const types = ["keydown", "mousedown", "touchend", "pointerup", "click"];
    types.forEach((t) => document.addEventListener(t, onGesture, true));
    return () => types.forEach((t) => document.removeEventListener(t, onGesture, true));
  }, [stage, power]);

  // The boot proper, from the power button: the bar is the health round (`ready`,
  // monotone). Once readiness is complete and the bar is shown, the fill glides to
  // 100 % over BOOT_BAR_MIN_MS and the boot ends with that glide (so never before
  // BOOT_MIN_MS), or at BOOT_MAX_MS regardless; then it holds BOOT_HOLD_MS full and the
  // layer leaves over BOOT_EXIT_MS. Reduced motion: the logo and the full bar sit for
  // BOOT_REDUCED_HOLD_MS, then a crossfade.
  const reduced = stage === "boot" && power === "on" && reducedMotion();
  const barShown = reduced || barShownAfterLogo;
  const fill = reduced ? 1 : barShown ? ready : 0;
  const fillMs = leaving ? BOOT_STEP_MS : fillDuration(fill);
  useEffect(() => {
    if (stage !== "boot" || power !== "on" || bootAt === null || leaving || bootEnding.current) return;
    const now = performance.now();
    const elapsed = now - bootAt;
    // The glide starts when readiness completes, or when the bar is shown if that is later.
    if (ready >= 1 && fullAt.current === null) fullAt.current = Math.max(now, bootAt + BOOT_LOGO_MS + BOOT_BAR_DELAY_MS);
    const fullFor = fullAt.current === null ? null : now - fullAt.current;
    const done = () => {
      bootEnding.current = true;
      const leave = () => {
        setLeaving(true);
        timers.current.push(
          window.setTimeout(() => {
            setStage("lock");
            setLeaving(false);
          }, reduced ? MS.crossfade : BOOT_EXIT_MS),
        );
      };
      if (reduced) leave();
      else timers.current.push(window.setTimeout(leave, BOOT_HOLD_MS));
    };
    if (bootDone({ elapsed, fullFor, reduced })) {
      done();
      return;
    }
    const wait = reduced ? BOOT_REDUCED_HOLD_MS - elapsed : Math.min(BOOT_MAX_MS - elapsed, fullFor === null ? Infinity : BOOT_BAR_MIN_MS - fullFor);
    const t = window.setTimeout(done, Math.max(0, wait));
    return () => clearTimeout(t);
  }, [stage, power, bootAt, leaving, ready, reduced]);

  // The bar appears after the logo (under reduced motion it is derived: shown at once, full).
  useEffect(() => {
    if (stage !== "boot" || power !== "on" || bootAt === null || reduced) return;
    const t = window.setTimeout(() => setBarShown(true), Math.max(0, bootAt + BOOT_LOGO_MS + BOOT_BAR_DELAY_MS - performance.now()));
    return () => clearTimeout(t);
  }, [stage, power, reduced, bootAt]);

  const unlock = useCallback(() => {
    if (stage !== "lock" || pulsing) return;
    setPulsing(true);
    const reduced = reducedMotion();
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

  /** Restart: fade to black, then boot again from the logo (no power screen: this click was the gesture). */
  const restart = useCallback(() => {
    if (stage !== "desk") return;
    setConfirm(false);
    document.documentElement.removeAttribute("data-kos-boot");
    setStage("restarting");
    timers.current.push(
      window.setTimeout(() => {
        clearDesk();
        bootEnding.current = false;
        fullAt.current = null;
        setChimed(null);
        setPower("on");
        setBarShown(false);
        setPulsing(false);
        setLeaving(false);
        setBoot(null);
        setHealth(freshHealth(tiles));
        // No power screen: the Restart click (or the terminal's Enter) was the gesture, so the chime sounds now.
        setBootAt(performance.now());
        rearmChime();
        void playChime("boot").then((ok) => ok && setChimed("boot"));
        setBootId((n) => n + 1);
        setStage("boot");
      }, MS.restart),
    );
  }, [stage, tiles, clearDesk]);

  const askRestart = useCallback(() => {
    if (stage === "desk") setConfirm(true);
  }, [stage]);

  // ⌃⌘Q locks (macOS's own lock shortcut), ⌃⌘R asks to restart: the menu's own
  // shortcuts, so they count as the menu. Nothing on ⌘ alone: ⌘L is the
  // browser's address bar (Kalp, 2026-09-20), so it is never intercepted.
  useEffect(() => {
    if (stage !== "desk") return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey || !e.ctrlKey || e.altKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "q") {
        e.preventDefault();
        track("menu_action", { item: "lock" });
        lockScreen();
      } else if (k === "r" && !confirm) {
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
      {stage === "boot" ? (
        <BootScreen mark={initials} power={power} barShown={barShown} fill={leaving ? 1 : fill} fillMs={fillMs} caption={coarse ? "tap to start" : "press any key to start"} leaving={leaving} />
      ) : null}
      {stage === "restarting" ? <div className="kos-restart" aria-hidden /> : null}
    </div>
  );
}

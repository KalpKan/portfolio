import { BOOT_STEP_MS } from "@/lib/boot";

/**
 * The boot layer in the macOS idiom, over pure black. Two faces:
 *
 * power "off" (a fresh visit): a faint drawn power glyph (⏻, an arc with a
 * gap at the top and a stem) centred, and "press any key to start" 40 px
 * under it ("tap to start" on a coarse pointer). The parent listens for the
 * gesture; this layer only shows it and swallows the click.
 *
 * power "on": the KK mark as a solid white silhouette (600 96px system
 * sans, -.02em, #f3f2f2) centred 35 % from the top fades in over 400 ms
 * (CSS animation); a thin rounded bar (22 vw × 5 px, dim white track) at
 * 62 % appears 300 ms later (`data-bar="shown"`), and its solid white fill
 * advances on real readiness (lib/boot.ts) with `cubic-bezier(.4,0,.2,1)`,
 * `fillMs` per step, never backwards. When the parent sets `leaving` the
 * whole layer fades over BOOT_EXIT_MS while the lock fades up underneath.
 * Purely presentational.
 */
export default function BootScreen({
  mark,
  power,
  barShown,
  fill,
  fillMs = BOOT_STEP_MS,
  caption = "press any key to start",
  leaving,
}: {
  mark: string;
  power: "off" | "on";
  barShown: boolean;
  fill: number;
  fillMs?: number;
  caption?: string;
  leaving: boolean;
}) {
  const p = Math.min(1, Math.max(0, fill));
  return (
    <div
      className="kos-boot"
      data-power={power}
      data-bar={barShown ? "shown" : undefined}
      data-leaving={leaving ? "true" : undefined}
      aria-hidden={power === "on" ? true : undefined}
    >
      {power === "off" ? (
        <div className="kos-power-screen">
          <svg className="kos-power" viewBox="0 0 40 40" width="40" height="40" aria-hidden focusable="false">
            <path d="M13.2 10.9a12.5 12.5 0 1 0 13.6 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M20 5.5v13.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <p className="kos-power-caption" role="status">
            {caption}
          </p>
        </div>
      ) : (
        <>
          <div className="kos-boot-mark">{mark}</div>
          <div className="kos-boot-bar">
            <i style={{ transform: `scaleX(${p})`, transitionDuration: `${fillMs}ms` }} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Card 2a's intro, before the lock: on #0b0b0c the KK mark (600 96px system
 * sans, -.02em, #f3f2f2) resolves from a 16 px blur and a 1.1 scale in 600 ms
 * (CSS animation, so it runs from the first paint, before hydration), with
 * one 180×2 px hairline 34 px under it whose fill is real readiness
 * (lib/boot.ts: the registry, then each health check). When the parent sets
 * `leaving` the mark blurs out (8 px, .94) and the layer fades while the lock
 * fades in underneath (BOOT_EXIT_MS). Purely presentational.
 */
export default function BootScreen({ mark, progress, leaving }: { mark: string; progress: number; leaving: boolean }) {
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className="kos-boot" data-leaving={leaving ? "true" : undefined} aria-hidden>
      <div className="kos-boot-mark">{mark}</div>
      <div className="kos-boot-line">
        <i style={{ transform: `scaleX(${p})` }} />
      </div>
    </div>
  );
}

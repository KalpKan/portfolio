import type { Kind } from "@/lib/projects";

export type Signal = "checking" | "ok" | "down" | "none";

/**
 * Site marks. State is a mark, never a hue: only a site with a live signal
 * gets the accent. One stroke weight throughout. The mark is derived from the
 * row's single `kind` (lib/projects.ts) plus the measured signal.
 *
 * Size comes from `className` (e.g. `size-2 sm:size-3`) so one element can be
 * compact on the phone strip and full size in the desktop map; `size` is the
 * fixed-pixel fallback used inside the channel row.
 */
export function SiteMark({
  kind,
  signal,
  size,
  className = "",
}: {
  kind: Kind;
  signal: Signal;
  size?: number;
  className?: string;
}) {
  const common = {
    ...(size ? { width: size, height: size } : {}),
    viewBox: "0 0 16 16",
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    vectorEffect: "non-scaling-stroke" as const,
  };
  if (kind === "showcase" || kind === "showcase-soon") {
    // Reference site: off-array, documented on the hub.
    return (
      <svg {...common} className={className}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M8 4.5 11.5 11.5H4.5Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "archived") {
    return (
      <svg {...common} className={className}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M2 14 14 2" />
      </svg>
    );
  }
  if (kind === "coming") {
    return (
      <svg {...common} className={className}>
        <rect x="1.5" y="1.5" width="13" height="13" strokeDasharray="2 2" />
      </svg>
    );
  }
  // live (status live / demo): the mark reports the measured signal
  if (signal === "ok") {
    return (
      <svg {...common} className={`text-signal ${className}`}>
        <rect x="1.5" y="1.5" width="13" height="13" fill="currentColor" />
        <path
          d="M3 9h2l1-4 2 7 1.5-5 1 2H13"
          stroke="var(--signal-ink)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (signal === "down") {
    return (
      <svg {...common} className={className}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M3.5 8.5h9" />
      </svg>
    );
  }
  // checking or no health url: filled, quiet
  return (
    <svg {...common} className={`text-quiet ${className}`}>
      <rect x="1.5" y="1.5" width="13" height="13" fill="currentColor" />
    </svg>
  );
}

/** Plain-English word for the measured health check, or null when there is none. */
export function healthWord(
  hasHealthUrl: boolean,
  signal: Signal,
): string | null {
  if (!hasHealthUrl) return null;
  if (signal === "ok") return "health-checked";
  if (signal === "down") return "health check failed";
  if (signal === "checking") return "checking";
  return null;
}

/** Drawn arrow for the destination column, same stroke as the site marks. */
export function Arrow({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8h11M9.5 4l4 4-4 4" />
    </svg>
  );
}

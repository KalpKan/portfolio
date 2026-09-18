import type { Project } from "@/lib/projects";

export type Signal = "checking" | "ok" | "down" | "none";

/**
 * Site marks. State is a mark, never a hue: only a site with a live signal
 * gets the accent. One stroke weight throughout.
 */
export function SiteMark({
  project,
  signal,
  size = 14,
}: {
  project: Project;
  signal: Signal;
  size?: number;
}) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 16 16",
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    vectorEffect: "non-scaling-stroke" as const,
  };
  if (project.type === "showcase") {
    // Reference site: off-array, documented on the hub.
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M8 4.5 11.5 11.5H4.5Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (project.status === "archived") {
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M2 14 14 2" />
      </svg>
    );
  }
  if (project.status === "coming") {
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" strokeDasharray="2 2" />
      </svg>
    );
  }
  // live / demo
  if (signal === "ok") {
    return (
      <svg {...common} className="text-signal">
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
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M3.5 8.5h9" />
      </svg>
    );
  }
  // checking or no health url: filled, quiet
  return (
    <svg {...common} className="text-quiet">
      <rect x="1.5" y="1.5" width="13" height="13" fill="currentColor" />
    </svg>
  );
}

export function statusWord(p: Project): string {
  if (p.type === "showcase") return "case study";
  return p.status;
}

export function signalWord(p: Project, signal: Signal): string | null {
  if (p.type !== "app" || !p.healthUrl) return null;
  if (signal === "ok") return "signal";
  if (signal === "down") return "no signal";
  if (signal === "checking") return "checking";
  return null;
}

export function destinationWord(p: Project): string {
  if (p.type === "showcase") return "read";
  if (p.url) return "open";
  if (p.repo) return "repo";
  return "read";
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

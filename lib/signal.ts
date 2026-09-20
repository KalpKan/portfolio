import type { Tile } from "./tiles";

/**
 * Browser-side health signal for the Projects window (card 2d) and the phone
 * sheet. The server proxy at /api/status/<slug> (lib/health.ts) does the real
 * check; here we only ask it once per page load and turn the answer into a
 * mark. A live tile draws its spike trace only when the answer is ok.
 */
export type Signal = "checking" | "ok" | "down" | "none";

/** What the tile draws: cyan + trace, grey ○, grey —, grey ▲, dashed. */
export type Mark = "trace" | "checking" | "down" | "case" | "coming";

// The browser waits longer than the server (lib/health.ts, 3 s) so a slow
// upstream still reports "down" rather than the fetch being cut off mid-check.
export const BROWSER_HEALTH_TIMEOUT_MS = 8000;

export function hasCheck(t: Tile): boolean {
  return t.kind === "live" && !!t.healthUrl;
}

export function initialSignals(tiles: Tile[]): Record<string, Signal> {
  const out: Record<string, Signal> = {};
  for (const t of tiles) out[t.slug] = hasCheck(t) ? "checking" : "none";
  return out;
}

export function signalFromBody(body: unknown): Signal {
  return typeof body === "object" && body !== null && (body as { ok?: unknown }).ok === true ? "ok" : "down";
}

export function tileMark(t: Tile, signal: Signal): Mark {
  if (t.kind === "case") return "case";
  if (t.kind === "coming") return "coming";
  if (signal === "ok") return "trace";
  if (signal === "down") return "down";
  return "checking";
}

export function statusWord(t: Tile, signal: Signal): string {
  if (t.kind === "case") return "Case study";
  if (t.kind === "coming") return "Coming";
  if (t.archived) return "Archived";
  if (!hasCheck(t)) return "Live";
  if (signal === "ok") return "Live signal";
  if (signal === "down") return "No signal";
  return "Checking…";
}

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Ask the hub's status proxy for every live tile that has a health url and
 * report each answer as it lands. Returns a cancel function; after cancel no
 * further report is made (React strict-mode double mounts and unmounts).
 *
 * No AbortController: a fetch wrapper on the page (posthog-js session
 * replay records network calls) turns an aborted request into an unhandled
 * rejection, so a slow answer is simply ignored after `timeoutMs` instead.
 * The proxy itself gives up on the upstream after 3 s (lib/health.ts).
 */
export function runHealthChecks(
  tiles: Tile[],
  onSignal: (slug: string, signal: Signal) => void,
  { fetcher = fetch, timeoutMs = BROWSER_HEALTH_TIMEOUT_MS }: { fetcher?: Fetcher; timeoutMs?: number } = {},
): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const t of tiles) {
    if (!hasCheck(t)) continue;
    let settled = false;
    const report = (s: Signal) => {
      if (settled || cancelled) return;
      settled = true;
      onSignal(t.slug, s);
    };
    timers.push(setTimeout(() => report("down"), timeoutMs));
    fetcher(`/api/status/${t.slug}`, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: unknown) => report(signalFromBody(body)))
      .catch(() => report("down"));
  }
  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}

export function okCount(signals: Record<string, Signal>): number {
  return Object.values(signals).filter((s) => s === "ok").length;
}

/** True once no tile is still checking. */
export function checksDone(signals: Record<string, Signal>): boolean {
  return !Object.values(signals).includes("checking");
}

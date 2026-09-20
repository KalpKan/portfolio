import type { Signal } from "@/lib/signal";

export type TermLine = { slug: string; signal: Signal };

const WORD: Record<Signal, { text: string; cls: string }> = {
  ok: { text: "200 ok", cls: "ok" },
  down: { text: "no signal", cls: "down" },
  checking: { text: "…", cls: "dim" },
  none: { text: "skipped (no health url)", cls: "dim" },
};

/** Not mocked; the Terminal dock tile shows the health round the desk ran on load. */
export default function TerminalWindow({ lines }: { lines: TermLine[] }) {
  return (
    <pre className="kos-term">
      <span className="dim">kalpos ~ % </span>health --all{"\n"}
      {lines.map((l) => (
        <span key={l.slug}>
          <span className="dim">GET </span>/api/status/{l.slug}
          {" → "}
          <span className={WORD[l.signal].cls}>{WORD[l.signal].text}</span>
          {"\n"}
        </span>
      ))}
      <span className="dim">kalpos ~ % </span>
    </pre>
  );
}

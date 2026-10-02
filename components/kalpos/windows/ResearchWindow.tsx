import { RESEARCH, RESEARCH_HEADER } from "@/lib/research";

/**
 * Not mocked; the Research folder (2026-10-02): Kalp's volunteer research
 * outside the apps on this desk, in the Projects list's row grammar (a bold
 * title, a status word, a muted meta line, one description paragraph) but as
 * full rows rather than tiles, since each entry carries more than a tile can
 * show. Content is lib/research.ts; rendered exactly, nothing added here.
 */
export default function ResearchWindow() {
  return (
    <div className="kos-body">
      <p className="kos-muted">{RESEARCH_HEADER}</p>
      <ul className="kos-research">
        {RESEARCH.map((r) => (
          <li key={r.slug} className="kos-research-row">
            <div className="kos-research-head">
              <b className="kos-tile-name">{r.title}</b>
              <span className="kos-tile-status">{r.status}</span>
            </div>
            <p className="kos-muted kos-research-meta">
              {r.role} · {r.where}
            </p>
            <p>{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

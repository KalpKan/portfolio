import { RESEARCH, RESEARCH_HEADER } from "@/lib/research";
import ResearchGlyph from "../ResearchGlyph";

/**
 * The Research folder (2026-10-02; redrawn 2026-11-18, Kalp: "a little bland"):
 * a shelf of entries, each a drawn glyph, the title, a muted role · where line,
 * a status pill and the description. RESEARCH_HEADER is the intro. Content is
 * lib/research.ts, rendered exactly, nothing added here. Also the phone
 * sheet's Research page.
 */
export default function ResearchWindow() {
  return (
    <div className="kos-body kos-research-body">
      <p className="kos-research-intro">{RESEARCH_HEADER}</p>
      <ul className="kos-research">
        {RESEARCH.map((r) => (
          <li key={r.slug} className="kos-research-row">
            <ResearchGlyph id={r.glyph} />
            <div className="kos-research-main">
              <h3 className="kos-research-title">{r.title}</h3>
              <p className="kos-research-meta">
                {r.role} · {r.where}
              </p>
              <p className="kos-research-desc">{r.description}</p>
              <span className={`kos-research-pill${r.status.startsWith("Written") ? " kos-research-pill--written" : " kos-research-pill--progress"}`}>
                {r.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { OUTSIDE_INTRO, OUTSIDE_SECTIONS } from "@/lib/outside";
import OutsideGlyph from "../OutsideGlyph";

/**
 * The Involvement folder (2026-11-18): the Research window's look (drawn
 * glyph chip, title, muted meta line, one paragraph; the .kos-research-*
 * styles are shared) under three small headings. Content is lib/outside.ts,
 * rendered exactly; an empty role, place or dates renders nothing. Also the
 * phone sheet's page.
 */
export default function OutsideWindow() {
  return (
    <div className="kos-body kos-research-body">
      <p className="kos-research-intro">{OUTSIDE_INTRO}</p>
      {OUTSIDE_SECTIONS.map((s) => (
        <section key={s.heading} className="kos-outside-section" aria-labelledby={`kos-outside-${s.heading}`}>
          <h2 className="kos-outside-heading" id={`kos-outside-${s.heading}`}>
            {s.heading}
          </h2>
          <ul className="kos-research">
            {s.entries.map((e) => {
              const meta = [e.role, e.where, e.dates].filter(Boolean).join(" · ");
              return (
                <li key={e.slug} className="kos-research-row">
                  <OutsideGlyph id={e.glyph} />
                  <div className="kos-research-main">
                    <h3 className="kos-research-title">{e.title}</h3>
                    {meta ? <p className="kos-research-meta">{meta}</p> : null}
                    <p className="kos-research-desc kos-outside-desc">{e.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

import type { Hobby } from "@/lib/site";
import HobbyGlyph from "../HobbyGlyph";

/**
 * Not mocked; the Hobbies folder in the window idiom: one row per entry in
 * SITE.hobbies, each a drawn mini-glyph (HobbyGlyph.tsx) beside the name and
 * Kalp's own line. Two columns on the desk, one on the phone sheet (CSS).
 * Empty list keeps the old empty state, so the window never lies.
 */
export default function HobbiesWindow({ hobbies = [] }: { hobbies?: readonly Hobby[] }) {
  if (hobbies.length === 0) {
    return (
      <div className="kos-body">
        <p className="kos-muted">Nothing filed yet.</p>
      </div>
    );
  }
  return (
    <div className="kos-body">
      <ul className="kos-hobbies">
        {hobbies.map((h) => (
          <li key={h.slug}>
            <HobbyGlyph id={h.slug} />
            <span>
              <b>{h.name}</b>
              <small>{h.line}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

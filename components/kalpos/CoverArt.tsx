import type { DrawnCover } from "@/lib/covers";

/*
 * Drawn covers for projects with nothing to photograph yet: the same hand as
 * HobbyGlyph and DeskIcons (stroke drawings, round caps, no stock art), on the
 * pad grey, in token colours only so they follow the appearance.
 *
 * cards: a fanned stack of three flash cards, the front one with a question
 *        line and answer lines.
 * eeg:   four electrode dots on the left, each feeding a trace that runs across.
 */
const S = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Cards() {
  return (
    <>
      <g transform="rotate(-9 80 62)">
        <rect x="38" y="30" width="78" height="52" rx="7" fill="var(--card)" stroke="var(--quiet)" strokeWidth="1.5" />
      </g>
      <g transform="rotate(7 80 62)">
        <rect x="46" y="28" width="78" height="52" rx="7" fill="var(--card)" stroke="var(--mark-quiet)" strokeWidth="1.5" />
      </g>
      <rect x="42" y="36" width="78" height="52" rx="7" fill="var(--card)" stroke="var(--teal)" strokeWidth="2" />
      <path d="M52 50h30" {...S} stroke="var(--teal)" strokeWidth="3" />
      <path d="M52 62h56M52 71h44" {...S} stroke="var(--mark-quiet)" strokeWidth="2" />
    </>
  );
}

function Eeg() {
  const rows = [
    { y: 30, d: "M40 30h10l3-7 4 14 4-9 3 4h10l3-6 4 11 4-8h14" },
    { y: 50, d: "M40 50h14l3-4 4 8 4-6 3 2h12l3-9 4 15 4-9h10" },
    { y: 70, d: "M40 70h8l3-5 5 10 3-5h13l3-3 4 7 4-6h14" },
    { y: 90, d: "M40 90h16l3-8 4 15 4-10 3 3h8l3-4 4 8 4-6h12" },
  ];
  return (
    <>
      {rows.map((r, i) => (
        <g key={r.y}>
          <circle cx="26" cy={r.y} r="5" fill="var(--card)" stroke={i === 1 ? "var(--teal)" : "var(--mark-quiet)"} strokeWidth="2" />
          <path d={`M31 ${r.y}h9`} {...S} stroke="var(--quiet)" strokeWidth="1.5" />
          <path d={r.d} {...S} stroke={i === 1 ? "var(--teal)" : "var(--mark)"} strokeWidth={i === 1 ? 2.2 : 1.8} opacity={i === 1 ? 1 : 0.7} />
        </g>
      ))}
    </>
  );
}

export default function CoverArt({ id }: { id: DrawnCover }) {
  return (
    <svg className="kos-pic-drawn" viewBox="0 0 160 120" aria-hidden preserveAspectRatio="xMidYMid slice">
      {id === "cards" ? <Cards /> : <Eeg />}
    </svg>
  );
}

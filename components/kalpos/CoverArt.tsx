import type { DrawnCover } from "@/lib/covers";

/*
 * Drawn covers for projects with nothing to photograph yet: the same hand as
 * HobbyGlyph and DeskIcons (stroke drawings, round caps, no stock art), on the
 * pad grey, in token colours only so they follow the appearance.
 *
 * eeg:   four electrode dots on the left, each feeding a trace that runs across.
 */
const S = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- only "eeg" is drawn today; the id stays for the next one
export default function CoverArt(_props: { id: DrawnCover }) {
  return (
    <svg className="kos-pic-drawn" viewBox="0 0 160 120" aria-hidden preserveAspectRatio="xMidYMid slice">
      <Eeg />
    </svg>
  );
}

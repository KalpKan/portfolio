/**
 * A small architecture diagram drawn as inline SVG in the sheet's own marks:
 * square nodes at one 1.25 stroke, mono labels, `currentColor` throughout so
 * both themes work with no extra styling. The same data renders twice, a
 * horizontal chain from `md` and a vertical chain on phones, so the labels
 * never fall below 12 px at 390 px wide.
 *
 * `nodes` is an ordered chain; every neighbour pair gets an arrow with the
 * `edges[i]` label. `extra` draws one more arrow between any two nodes as an
 * arc (for the second path: Socket.IO beside Firestore, the hourly function
 * looping back, and so on).
 */

export type FlowNode = { id: string; title: string; sub: string[] };
export type FlowExtra = { from: number; to: number; label: string };
export type FlowData = { nodes: FlowNode[]; edges: string[]; extra?: FlowExtra[]; title: string };

const MONO = "var(--font-mono), ui-monospace, Menlo, monospace";

function Node({ n, x, y, w, h }: { n: FlowNode; x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="var(--pad)" stroke="currentColor" strokeWidth={1.25} />
      <text x={x + 10} y={y + 20} fontFamily={MONO} fontSize={12} fill="currentColor">
        {n.title}
      </text>
      {n.sub.map((s, i) => (
        <text
          key={s}
          x={x + 10}
          y={y + 36 + i * 14}
          fontFamily={MONO}
          fontSize={11}
          fill="var(--ink-2)"
        >
          {s}
        </text>
      ))}
    </g>
  );
}

function ArrowHead({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M1 1 7 4 1 7" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    </defs>
  );
}

export function FlowDiagram({ data }: { data: FlowData }) {
  const N = data.nodes.length;
  const subMax = Math.max(...data.nodes.map((n) => n.sub.length));
  const H = 30 + subMax * 14; // node height

  // Horizontal layout (md and up). 11 px mono is ~6.6 px per glyph, so a
  // 196 px node holds 27 characters; diagrams/index.tsx keeps lines under that.
  const W = 196;
  const GAP = 72;
  const PAD = 8;
  const TOP = data.extra?.length ? 44 : PAD;
  const hw = PAD * 2 + N * W + (N - 1) * GAP;
  const hh = TOP + H + PAD + 16;
  const hx = (i: number) => PAD + i * (W + GAP);

  // Vertical layout (phones)
  const VW = 320;
  const VGAP = 44;
  const vh = PAD * 2 + N * H + (N - 1) * VGAP;
  const vy = (i: number) => PAD + i * (H + VGAP);
  const vx = data.extra?.length ? 8 : 20;
  const vNodeW = data.extra?.length ? 240 : 280;

  return (
    <>
      <svg
        viewBox={`0 0 ${hw} ${hh}`}
        role="img"
        aria-label={data.title}
        className="hidden w-full max-w-[44rem] md:block"
      >
        <ArrowHead id="fd-h" />
        {data.nodes.map((n, i) => (
          <Node key={n.id} n={n} x={hx(i)} y={TOP} w={W} h={H} />
        ))}
        {data.edges.map((label, i) => {
          const x1 = hx(i) + W;
          const x2 = hx(i + 1);
          const y = TOP + H / 2;
          return (
            <g key={label + i}>
              <line x1={x1 + 2} y1={y} x2={x2 - 2} y2={y} stroke="currentColor" strokeWidth={1.25} markerEnd="url(#fd-h)" />
              <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontFamily={MONO} fontSize={11} fill="var(--ink-2)">
                {label}
              </text>
            </g>
          );
        })}
        {data.extra?.map((e, i) => {
          const x1 = hx(e.from) + W / 2 + (e.from < e.to ? 24 : -24);
          const x2 = hx(e.to) + W / 2 + (e.from < e.to ? -24 : 24);
          const y = TOP;
          const cy = 8;
          return (
            <g key={e.label + i}>
              <path d={`M${x1} ${y - 2} Q ${(x1 + x2) / 2} ${cy} ${x2} ${y - 2}`} fill="none" stroke="currentColor" strokeWidth={1.25} strokeDasharray="3 3" markerEnd="url(#fd-h)" />
              <text x={(x1 + x2) / 2} y={cy + 14 - 2} textAnchor="middle" fontFamily={MONO} fontSize={11} fill="var(--ink-2)">
                {e.label}
              </text>
            </g>
          );
        })}
      </svg>

      <svg viewBox={`0 0 ${VW} ${vh}`} role="img" aria-label={data.title} className="w-full md:hidden">
        <ArrowHead id="fd-v" />
        {data.nodes.map((n, i) => (
          <Node key={n.id} n={n} x={vx} y={vy(i)} w={vNodeW} h={H} />
        ))}
        {data.edges.map((label, i) => {
          const y1 = vy(i) + H;
          const y2 = vy(i + 1);
          const x = vx + 40;
          return (
            <g key={label + i}>
              <line x1={x} y1={y1 + 2} x2={x} y2={y2 - 2} stroke="currentColor" strokeWidth={1.25} markerEnd="url(#fd-v)" />
              <text x={x + 10} y={(y1 + y2) / 2 + 4} fontFamily={MONO} fontSize={11} fill="var(--ink-2)">
                {label}
              </text>
            </g>
          );
        })}
        {data.extra?.map((e, i) => {
          const x = vx + vNodeW;
          const y1 = vy(e.from) + H / 2;
          const y2 = vy(e.to) + H / 2;
          const cx = x + 40;
          return (
            <g key={e.label + i}>
              <path d={`M${x + 2} ${y1} Q ${cx} ${(y1 + y2) / 2} ${x + 2} ${y2}`} fill="none" stroke="currentColor" strokeWidth={1.25} strokeDasharray="3 3" markerEnd="url(#fd-v)" />
              <text
                x={cx - 12}
                y={(y1 + y2) / 2}
                transform={`rotate(90 ${cx - 12} ${(y1 + y2) / 2})`}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={11}
                fill="var(--ink-2)"
              >
                {e.label}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FlowDiagram, H_GAP, LABEL_GLYPH_PX, edgeLabelLines } from "./FlowDiagram";
import { DIAGRAMS } from "./index";

// Reviewer finding 2026-09-18: on /projects/rc-car at 1440 the edge label
// "events / frames" (15 glyphs ≈ 99 px) overran the 72 px gap and collided
// with the Raspberry Pi node. Edge labels are now stacked one line per
// " / " part and every line must fit inside the gap.

describe("FlowDiagram edge labels", () => {
  it("splits a label on ' / ' into stacked lines", () => {
    expect(edgeLabelLines("events / frames")).toEqual(["events", "frames"]);
    expect(edgeLabelLines("PWM")).toEqual(["PWM"]);
  });

  it("keeps every horizontal edge-label line inside the gap between nodes", () => {
    for (const [id, data] of Object.entries(DIAGRAMS)) {
      for (const label of data.edges) {
        for (const line of edgeLabelLines(label)) {
          // The arrow itself spans H_GAP - 4 px (2 px clear of each node box).
          const px = line.length * LABEL_GLYPH_PX;
          expect(px, `${id}: "${line}" is ${px.toFixed(0)} px, gap is ${H_GAP} px`).toBeLessThanOrEqual(H_GAP - 4);
        }
      }
    }
  });

  it("renders the rc-car label as two tspans, not one wide text", () => {
    const html = renderToStaticMarkup(<FlowDiagram data={DIAGRAMS["rc-car"]} />);
    expect(html).not.toContain(">events / frames<");
    expect(html).toContain(">events</tspan>");
    expect(html).toContain(">frames</tspan>");
  });
});

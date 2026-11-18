import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { RESEARCH, RESEARCH_GLYPH_IDS, RESEARCH_HEADER } from "@/lib/research";
import ResearchGlyph from "./ResearchGlyph";
import ResearchWindow from "./windows/ResearchWindow";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

describe("ResearchGlyph", () => {
  it("draws every glyph id as a distinct SVG with no text", () => {
    const seen = new Set<string>();
    for (const id of RESEARCH_GLYPH_IDS) {
      const { container, unmount } = render(<ResearchGlyph id={id} />);
      const svg = container.querySelector("svg")!;
      expect(svg.querySelectorAll("path, circle, ellipse").length, id).toBeGreaterThanOrEqual(2);
      expect(container.textContent).toBe("");
      seen.add(svg.innerHTML);
      unmount();
    }
    expect(seen.size).toBe(RESEARCH_GLYPH_IDS.length);
  });

  it("falls back to the document glyph for a missing or unknown id", () => {
    const doc = render(<ResearchGlyph id="document" />);
    const expected = doc.container.querySelector("svg")!.innerHTML;
    doc.unmount();
    for (const id of [undefined, "nope", ""]) {
      const { container, unmount } = render(<ResearchGlyph id={id} />);
      expect(container.querySelector("[data-glyph]")!.getAttribute("data-glyph")).toBe("document");
      expect(container.querySelector("svg")!.innerHTML).toBe(expected);
      unmount();
    }
  });
});

describe("ResearchWindow", () => {
  it("renders the header and every entry's text verbatim", () => {
    const { container, unmount } = render(<ResearchWindow />);
    const text = (sel: string) => [...container.querySelectorAll(sel)].map((e) => e.textContent);
    expect(container.querySelector(".kos-research-intro")!.textContent).toBe(RESEARCH_HEADER);
    expect(text(".kos-research-title")).toEqual(RESEARCH.map((r) => r.title));
    expect(text(".kos-research-meta")).toEqual(RESEARCH.map((r) => `${r.role} · ${r.where}`));
    expect(text(".kos-research-desc")).toEqual(RESEARCH.map((r) => r.description));
    expect(text(".kos-research-pill")).toEqual(RESEARCH.map((r) => r.status));
    unmount();
  });
});

import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { OUTSIDE, OUTSIDE_GLYPH_IDS, OUTSIDE_INTRO, OUTSIDE_SECTIONS } from "@/lib/outside";
import OutsideGlyph from "./OutsideGlyph";
import OutsideWindow from "./windows/OutsideWindow";
import { DEFAULT_LAYOUT, ICON_CELL, ICON_IDS } from "@/lib/icons";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

describe("OutsideWindow", () => {
  it("renders the intro, the three headings in order and every entry verbatim", () => {
    const { container } = render(<OutsideWindow />);
    const text = (sel: string) => [...container.querySelectorAll(sel)].map((n) => n.textContent);
    expect(container.querySelector(".kos-research-intro")!.textContent).toBe(OUTSIDE_INTRO);
    expect(text(".kos-outside-heading")).toEqual(["Building", "Caring", "Teaching"]);
    expect(OUTSIDE.length).toBe(7);
    expect(text(".kos-research-title")).toEqual(OUTSIDE.map((e) => e.title));
    expect(text(".kos-research-desc")).toEqual(OUTSIDE.map((e) => e.text));
    expect(text(".kos-research-meta")).toEqual(OUTSIDE.map((e) => [e.role, e.where, e.dates].filter(Boolean).join(" · ")));
    expect(OUTSIDE_SECTIONS.map((s) => s.entries.length)).toEqual([3, 2, 2]);
  });

  it("empty dates render nothing (no dangling separator)", () => {
    const { container } = render(<OutsideWindow />);
    const metas = [...container.querySelectorAll(".kos-research-meta")].map((n) => n.textContent);
    expect(metas[1]).toBe("Director of Events · Western University");
    expect(container.textContent).not.toMatch(/·\s*$|· ·/m);
  });
});

describe("OutsideGlyph", () => {
  it("draws every id distinctly and falls back to neutral", () => {
    const seen = new Set<string>();
    for (const id of OUTSIDE_GLYPH_IDS) {
      const { container, unmount } = render(<OutsideGlyph id={id} />);
      seen.add(container.querySelector("svg")!.innerHTML);
      expect(container.textContent).toBe("");
      unmount();
    }
    expect(seen.size).toBe(OUTSIDE_GLYPH_IDS.length);
    const neutral = render(<OutsideGlyph id="neutral" />);
    const expected = neutral.container.querySelector("svg")!.innerHTML;
    neutral.unmount();
    for (const id of [undefined, "nope", ""]) {
      const { container, unmount } = render(<OutsideGlyph id={id} />);
      expect(container.querySelector("svg")!.innerHTML).toBe(expected);
      unmount();
    }
  });
});

describe("default layout", () => {
  it("has no two icon footprints overlapping", () => {
    for (let i = 0; i < ICON_IDS.length; i++)
      for (let j = i + 1; j < ICON_IDS.length; j++) {
        const a = DEFAULT_LAYOUT[ICON_IDS[i]];
        const b = DEFAULT_LAYOUT[ICON_IDS[j]];
        const overlap = Math.abs(a.c - b.c) < ICON_CELL.w && Math.abs(a.r - b.r) < ICON_CELL.h;
        expect(overlap, `${ICON_IDS[i]} vs ${ICON_IDS[j]}`).toBe(false);
      }
  });
});

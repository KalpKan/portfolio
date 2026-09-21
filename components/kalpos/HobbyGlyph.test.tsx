import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { HOBBIES } from "@/lib/site";
import HobbyGlyph from "./HobbyGlyph";
import HobbiesWindow from "./windows/HobbiesWindow";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

/** Emoji and other pictographs: the desk draws its own marks, never types one. */
const PICTOGRAPH = /\p{Extended_Pictographic}/u;

describe("HobbyGlyph", () => {
  it("draws an SVG for every hobby in SITE.hobbies, with no emoji anywhere", () => {
    for (const h of HOBBIES) {
      const { container, unmount } = render(<HobbyGlyph id={h.slug} />);
      const svg = container.querySelector(".kos-hobby-glyph svg")!;
      expect(svg, h.slug).not.toBeNull();
      expect(svg.getAttribute("viewBox")).toBe("0 0 26 26");
      // A drawing, not an empty box: at least two painted shapes.
      expect(svg.querySelectorAll("path, circle, ellipse").length, h.slug).toBeGreaterThanOrEqual(2);
      expect(container.textContent).toBe("");
      unmount();
    }
  });

  it("gives each hobby its own drawing (no two slugs share a path set)", () => {
    const drawings = HOBBIES.map((h) => {
      const { container, unmount } = render(<HobbyGlyph id={h.slug} />);
      const html = container.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(drawings).size).toBe(HOBBIES.length);
  });
});

describe("the Hobbies window", () => {
  it("lists every hobby with its name, Kalp's line and a drawn glyph", () => {
    const { container, unmount } = render(<HobbiesWindow hobbies={HOBBIES} />);
    const rows = [...container.querySelectorAll("ul.kos-hobbies > li")];
    expect(rows).toHaveLength(HOBBIES.length);
    rows.forEach((row, i) => {
      expect(row.querySelector("b")!.textContent).toBe(HOBBIES[i].name);
      expect(row.querySelector("small")!.textContent).toBe(HOBBIES[i].line);
      expect(row.querySelector(".kos-hobby-glyph svg")).not.toBeNull();
    });
    expect(PICTOGRAPH.test(container.textContent ?? "")).toBe(false);
    unmount();
  });

  it("keeps the empty state when nothing is filed", () => {
    const { container, unmount } = render(<HobbiesWindow />);
    expect(container.textContent).toContain("Nothing filed yet");
    expect(container.querySelector("ul.kos-hobbies")).toBeNull();
    unmount();
  });
});

describe("SITE.hobbies", () => {
  it("is the five Kalp named, each with a one-line sentence in his voice", () => {
    expect(HOBBIES.map((h) => h.name)).toEqual(["Swimming", "Tennis", "Sim racing", "Clash Royale", "Reselling"]);
    for (const h of HOBBIES) {
      expect(h.slug).toMatch(/^[a-z][a-z-]*$/);
      expect(h.line.length).toBeGreaterThan(8);
      expect(h.line.length).toBeLessThanOrEqual(60);
      expect(h.line.endsWith(".")).toBe(true);
    }
  });
});

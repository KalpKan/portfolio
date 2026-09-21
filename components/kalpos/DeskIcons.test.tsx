import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { AppGlyph, MailGlyph, TrashGlyph } from "./DeskIcons";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

/** The SVG with React's useId-based ids normalised, so the snapshot is stable. */
function svgOf(el: React.ReactElement): string {
  const { container, unmount } = render(el);
  const html = container.innerHTML.replace(/kbin[a-zA-Z0-9]+/g, "kbin");
  unmount();
  return html;
}

describe("TrashGlyph", () => {
  it("draws the empty basket: rim, mesh, no paper (snapshot)", () => {
    const html = svgOf(<TrashGlyph state="empty" />);
    expect(html).toContain('data-state="empty"');
    expect(html).toContain("<pattern");
    expect(html).not.toContain("kos-bin-paper");
    expect(html).toMatchSnapshot();
  });

  it("draws the full basket with paper above the rim (snapshot)", () => {
    const html = svgOf(<TrashGlyph state="full" />);
    expect(html).toContain('data-state="full"');
    expect(html).toContain("kos-bin-paper");
    expect(html).toMatchSnapshot();
  });

  it("is full by default while the Trash window has items, and 48×56 on the desk", () => {
    const html = svgOf(<TrashGlyph />);
    expect(html).toContain('data-state="full"');
    expect(html).toContain('width="48" height="56"');
  });

  it("the dock size is the same drawing, smaller", () => {
    const html = svgOf(<TrashGlyph size="dock" />);
    expect(html).toContain('width="26" height="30"');
    expect(html).toContain("kos-bin--dock");
    expect(html).toContain("kos-bin-lid");
  });

  it("uses unique gradient ids per instance so two on one page do not clash", () => {
    const { container, unmount } = render(
      <>
        <TrashGlyph />
        <TrashGlyph size="dock" />
      </>,
    );
    const ids = [...container.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    unmount();
  });
});

describe("MailGlyph (the Contact envelope)", () => {
  it("draws the envelope, not the old @ character (snapshot)", () => {
    const html = svgOf(<MailGlyph />);
    expect(html).toContain("kos-mail--desk");
    expect(html).toContain('width="32"');
    expect(html).not.toContain("@");
    expect(html).toMatchSnapshot();
  });

  it("the dock tile is the same drawing at the dock's size", () => {
    const desk = svgOf(<MailGlyph />);
    const dock = svgOf(<MailGlyph size="dock" />);
    expect(dock).toContain("kos-mail--dock");
    expect(dock).toContain('width="30"');
    // Same paths, only the class and the px differ: one envelope, two sizes.
    const paths = (s: string) => [...s.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
    expect(paths(dock)).toEqual(paths(desk));
  });

  it("the Contact desk tile holds the envelope on the card-2c cyan tile", () => {
    const { container, unmount } = render(<AppGlyph kind="contact" />);
    const tile = container.querySelector(".kos-app--contact")!;
    expect(tile.querySelector("svg.kos-mail")).not.toBeNull();
    expect(tile.textContent).toBe("");
    unmount();
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contactLinks } from "./contact";
import { SITE } from "./site";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("SITE.contact", () => {
  it("is Kalp's real, public email, GitHub and LinkedIn", () => {
    expect(SITE.contact.email).toBe("Kalpkansara123@gmail.com");
    expect(SITE.contact.github).toBe("https://github.com/KalpKan");
    expect(SITE.contact.linkedin).toBe("https://www.linkedin.com/in/kalp-kansara123/");
  });

  it("becomes three real links: a mailto and two https, GitHub by handle", () => {
    expect(contactLinks(SITE.contact)).toEqual([
      { kind: "email", label: "Kalpkansara123@gmail.com", href: "mailto:Kalpkansara123@gmail.com" },
      { kind: "github", label: "github.com/KalpKan", href: "https://github.com/KalpKan" },
      { kind: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/kalp-kansara123/" },
    ]);
  });
});

/*
 * 2026-09-21, Kalp: "Remove (everything on this … is shipped) references from
 * the page." Nothing a visitor reads may claim that every project on the desk
 * shipped. This test fails if the claim comes back anywhere a visitor sees it.
 */
describe("no 'everything shipped' claim anywhere a visitor reads", () => {
  const VISITOR_TEXT = [
    "lib/site.ts",
    "lib/swat.ts",
    "lib/fake-claude.ts",
    "lib/vfs.ts",
    "app/layout.tsx",
    "app/opengraph-image.tsx",
    "components/kalpos/windows/AboutWindow.tsx",
    "components/kalpos/PhoneSheet.tsx",
  ];

  it("no source a visitor reads says 'shipped' in a claim", () => {
    for (const f of VISITOR_TEXT) {
      // lib/fake-claude.ts matches the visitor's own word in a regex; that is
      // the only "shipped" allowed, and only inside a pattern.
      const lines = read(f)
        .split("\n")
        .filter((l) => /shipped/i.test(l) && !/\.test\(q\)|\btest\(/.test(l));
      expect(lines, f).toEqual([]);
    }
  });

  it("the desk note introduces Kalp and points at a folder, claiming nothing", () => {
    expect(SITE.note).toBe("Hi — I'm Kalp. Western University, headed for physician-scientist work in neurotech. Open a folder.");
  });
});

describe("the tab icon", () => {
  it("app/icon.svg is the drawn MacBook on transparent, sized for 16/32/180 px", () => {
    const svg = read("app/icon.svg");
    expect(svg).toContain('viewBox="0 0 32 32"');
    // No background plate: the tab strip (light or dark) shows through.
    expect(svg).not.toMatch(/<rect[^>]*width="32"[^>]*height="32"/);
    // The screen is dark, the deck light: it reads either way round.
    expect(svg).toContain("#201e1d");
    expect(svg).toContain("#e4e1e1");
    // The KK mark is drawn as paths, so no font has to be present.
    expect(svg).not.toContain("<text");
  });
});

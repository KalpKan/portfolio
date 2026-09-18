import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CaseStudy from "./CaseStudy";
import unpark from "@/content/projects/unpark";
import rcCar from "@/content/projects/rc-car";

describe("CaseStudy page body", () => {
  // React escapes apostrophes as &#x27;; undo that so prose compares as written.
  const html = renderToStaticMarkup(<CaseStudy study={unpark} />).replace(/&#x27;/g, "'");

  it("renders the title, lede, problem and every step in order", () => {
    expect(html).toContain("UnPark, codename Antifreeze");
    expect(html).toContain(unpark.lede);
    expect(html).toContain(unpark.problem.slice(0, 60));
    const titles = unpark.howItWorks.steps.map((s) => s.title);
    let last = -1;
    for (const t of titles) {
      const i = html.indexOf(t);
      expect(i, `step "${t}" missing`).toBeGreaterThan(last);
      last = i;
    }
    expect(html).toContain(">01<");
    expect(html).toContain(">05<");
  });

  it("draws labelled placeholders where media is missing, sized like the final media", () => {
    expect(html).toContain("Device photo coming: Kalp will add");
    expect((html.match(/data-placeholder/g) ?? []).length).toBe(1 + 2 + 3 + 1); // hero + 2 photos + 3 screens + video
    expect(html).toContain("aspect-[9/19.5]");
  });

  it("has the diagram twice (phone and desktop) with an accessible name", () => {
    expect((html.match(/role="img" aria-label="UnPark architecture/g) ?? []).length).toBe(2);
    expect(html).toContain("Socket.IO :5000");
  });

  it("lists the tech, the status line and the repo link", () => {
    expect(html).toContain("Flask-SocketIO");
    expect(html).toContain("Hardware prototype");
    expect(html).toContain('href="https://github.com/KalpKan/UnPark"');
  });

  it("never uses colour for a state: no green/red/amber utility classes", () => {
    expect(html).not.toMatch(/(?:bg|text|border)-(?:green|red|amber|emerald|rose|yellow)-/);
  });
});

describe("CaseStudy with real images", () => {
  const html = renderToStaticMarkup(<CaseStudy study={rcCar} />);

  it("renders next/image figures with alt text and captions, and no placeholder for the hero", () => {
    expect(html).toContain("<img");
    expect(html).toContain("Printed chassis, steering servo");
    expect(html).toContain('alt="The car head-on');
    expect(html).not.toContain("Device photo coming");
  });

  it("hides the repo link when the content has none", () => {
    const noRepo = renderToStaticMarkup(<CaseStudy study={{ ...rcCar, repo: null }} />);
    expect(noRepo).not.toContain("source repository");
  });
});

describe("CaseStudy under construction (registry status coming, content not a draft)", () => {
  it("says under construction in the meta line and keeps the content", () => {
    const html = renderToStaticMarkup(<CaseStudy study={rcCar} underConstruction />);
    expect(html).toContain("under construction");
    expect(html).not.toContain(">case study<");
    expect(html).toContain(rcCar.problem.slice(0, 60));
  });

  it("says case study when not under construction", () => {
    const html = renderToStaticMarkup(<CaseStudy study={rcCar} />);
    expect(html).toContain(">case study<");
    expect(html).not.toContain("under construction");
  });
});

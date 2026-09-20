import { describe, it, expect } from "vitest";
import { loadProjects } from "@/lib/projects";
import { caseStudies } from "@/content/projects";
import { buildVfs, getNode, type VDir } from "@/lib/vfs";
import { SITE } from "@/lib/site";

// Kalp's own words (docs/content/project-descriptions.md, 2026-09-20) are the
// source of truth for the taglines and the case-study prose. These pin the
// facts he stated, so nobody drifts back to the earlier, wrong copy (the
// Porsche keychain was once described as a basketball player).

const byText = (slug: string) => {
  const c = caseStudies[slug];
  return [c.lede, c.problem, c.howItWorks.intro, ...c.howItWorks.steps.map((s) => s.body), c.status].join(" ");
};

describe("Kalp's descriptions are what the pages say", () => {
  it("the Porsche keychain is a Porsche, not a basketball player, with a keychain hole, USB-C and three LEDs underneath", () => {
    const all = byText("porsche-pcb-keychain").toLowerCase();
    expect(all).toContain("porsche");
    expect(all).toContain("keychain");
    expect(all).toContain("usb-c");
    expect(all).toMatch(/three leds/);
    expect(all).toContain("yash");
    expect(all).not.toMatch(/basketball|player|dunk/);
    const c = caseStudies["porsche-pcb-keychain"];
    expect(JSON.stringify(c).toLowerCase()).not.toMatch(/basketball|dunk/);
  });

  it("UnPark is a haptic ankle device with an accelerometer, auto-logging, a dashboard, background insights and export, for a competition", () => {
    const all = byText("unpark").toLowerCase();
    for (const w of ["haptic", "ankle", "accelerometer", "auto-log", "dashboard", "background", "export", "competition", "parkinson"]) {
      expect(all, w).toContain(w);
    }
  });

  it("the RC car is a PS4 controller plus a self-driving mode that follows a green tennis ball via the Pi", () => {
    const all = byText("rc-car").toLowerCase();
    for (const w of ["ps4", "self-driving", "tennis ball", "raspberry pi", "green"]) expect(all, w).toContain(w);
  });

  it("every registry tagline is one sentence in Kalp's voice and no tagline mentions a basketball player", () => {
    for (const p of loadProjects()) {
      expect(p.tagline.length, p.slug).toBeGreaterThan(20);
      expect(p.tagline, p.slug).not.toMatch(/basketball player/i);
      // one sentence: at most one terminal period (abbreviations like "vs." are not used)
      expect((p.tagline.match(/[.!?](\s|$)/g) ?? []).length, `${p.slug} should be one sentence`).toBe(1);
    }
    expect(loadProjects().find((p) => p.slug === "basketball")?.tagline).toContain("mini hoop in my room");
  });

  it("the terminal's case-study.md and README.md carry the new words", () => {
    const root = buildVfs({ projects: loadProjects(), caseStudies, site: SITE, scrapped: [] });
    const cs = (getNode(root, "/projects/porsche-pcb-keychain/case-study.md") as { content: string }).content;
    expect(cs).toContain("Porsche cut clean through it");
    expect(cs.toLowerCase()).not.toContain("basketball");
    const up = (getNode(root, "/projects/unpark/case-study.md") as { content: string }).content;
    expect(up).toContain("haptic device worn on the ankle");
    const readme = (getNode(root, "/projects/basketball/README.md") as { content: string }).content;
    expect(readme).toContain("mini hoop in my room");
    expect(getNode(root, "/projects") as VDir).toBeTruthy();
  });
});

describe("the Porsche diagram's node text fits its 196 px box", () => {
  it("keeps every title and sub line under the box width", async () => {
    const { DIAGRAMS } = await import("@/components/showcase/diagrams");
    const { LABEL_GLYPH_PX } = await import("@/components/showcase/diagrams/FlowDiagram");
    for (const n of DIAGRAMS["porsche-pcb-keychain"].nodes) {
      for (const line of [n.title, ...n.sub]) {
        expect(line.length * LABEL_GLYPH_PX, `"${line}"`).toBeLessThanOrEqual(196 - 16);
      }
    }
    expect(JSON.stringify(DIAGRAMS["porsche-pcb-keychain"]).toLowerCase()).not.toMatch(/player|ball/);
  });
});

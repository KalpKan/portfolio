import { describe, it, expect } from "vitest";
import pcb from "@/content/projects/porsche-pcb-keychain";
import eeg from "@/content/projects/eeg";
import flashcards from "@/content/projects/flashcards";
import { isPlaceholder } from "@/content/case-study";

// The two hardware pages are written from the KiCad / LTspice files on
// Kalp's Mac (read-only). These pin the facts the prose must carry.

describe("Porsche PCB keychain content", () => {
  it("is publishable, with a rendered board as the hero and real numbers", () => {
    expect(pcb.draft).not.toBe(true);
    expect(isPlaceholder(pcb.hero)).toBe(false);
    expect(pcb.problem).toMatch(/USB-C/);
    expect(pcb.howItWorks.steps.map((s) => s.body).join(" ")).toMatch(/5\.1 ?k/);
    expect(pcb.howItWorks.steps.map((s) => s.body).join(" ")).toMatch(/220/);
    expect(pcb.howItWorks.steps.map((s) => s.body).join(" ")).toMatch(/12 ?(×|x|by) ?37/);
    expect(pcb.gallery && !isPlaceholder(pcb.gallery) && pcb.gallery.items.length).toBeGreaterThanOrEqual(3);
  });
});

describe("DIY EEG content", () => {
  it("is an under-construction page with the real signal chain", () => {
    expect(eeg.draft).not.toBe(true);
    const all = [eeg.problem, eeg.howItWorks.intro, ...eeg.howItWorks.steps.map((s) => s.body)].join(" ");
    expect(all).toMatch(/AD620/);
    expect(all).toMatch(/TL084/);
    expect(all).toMatch(/ADS1115/);
    expect(all).toMatch(/0\.48 ?Hz/);
    expect(all).toMatch(/48 ?Hz/);
    expect(eeg.status.toLowerCase()).toContain("under construction");
    expect(isPlaceholder(eeg.hero)).toBe(false); // the schematic render
  });
});

describe("FlashCards", () => {
  it("stays a draft so the page is the short placeholder (Kalp, 2026-09-18)", () => {
    expect(flashcards.draft).toBe(true);
  });
});

describe("white document images on the dark sheet", () => {
  it("mark the schematics as documents so the dark theme inverts them instead of showing a white slab", () => {
    expect(!isPlaceholder(eeg.hero) && eeg.hero.tone).toBe("document");
    const tile = pcb.gallery && !isPlaceholder(pcb.gallery) ? pcb.gallery.items.find((i) => /schematic/i.test(i.alt)) : undefined;
    expect(tile?.tone).toBe("document");
  });
});

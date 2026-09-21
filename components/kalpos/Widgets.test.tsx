import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { render } from "@/test/render";
import Widgets from "./Widgets";
import { SITE } from "@/lib/site";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const site = {
  name: "Kalp Kansara",
  note: "Hi — I'm Kalp.",
  tagline: "Western.",
  resumeUrl: "",
  photo: "",
  nowPlaying: { title: "", artist: "" },
  contact: { email: "", github: "", linkedin: "" },
};

describe("the photo widget", () => {
  it("shows the striped placeholder while photo is empty", () => {
    const { container, unmount } = render(<Widgets site={site} />);
    const frame = container.querySelector(".kos-photo")!;
    expect(frame.querySelector("img")).toBeNull();
    expect(frame.textContent).toContain("photo of Kalp");
    unmount();
  });

  it("renders the photo with Kalp's name as alt once photo is set", () => {
    const { container, unmount } = render(<Widgets site={{ ...site, photo: "/images/kalp/desk.webp" }} />);
    const img = container.querySelector(".kos-photo img")!;
    expect(img.getAttribute("src")).toBe("/images/kalp/desk.webp");
    expect(img.getAttribute("alt")).toBe("Kalp Kansara");
    expect(container.querySelector(".kos-photo")?.textContent).not.toContain("photo of Kalp");
    unmount();
  });

  it("the live SITE.photo points at a committed WebP of 120 KB or less (the widget is a 130 px frame)", () => {
    expect(SITE.photo).toMatch(/^\/images\/kalp\/.+\.webp$/);
    const file = path.join(path.resolve(__dirname, "..", ".."), "public", SITE.photo);
    expect(existsSync(file), file).toBe(true);
    expect(statSync(file).size).toBeLessThanOrEqual(120 * 1024);
    const { container, unmount } = render(<Widgets site={{ ...site, photo: SITE.photo }} />);
    expect(container.querySelector(".kos-photo img")?.getAttribute("src")).toBe(SITE.photo);
    unmount();
  });
});

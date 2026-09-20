import { describe, it, expect } from "vitest";
import { contactLinks } from "./contact";

describe("contactLinks", () => {
  it("returns nothing while every value is empty", () => {
    expect(contactLinks({ email: "", github: "", linkedin: "" })).toEqual([]);
  });
  it("builds mailto, github and linkedin links from bare handles or full urls", () => {
    expect(contactLinks({ email: "k@x.com", github: "KalpKan", linkedin: "kalp" })).toEqual([
      { kind: "email", label: "k@x.com", href: "mailto:k@x.com" },
      { kind: "github", label: "github.com/KalpKan", href: "https://github.com/KalpKan" },
      { kind: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/kalp" },
    ]);
    expect(contactLinks({ email: "", github: "https://github.com/KalpKan/", linkedin: "https://linkedin.com/in/k/" })).toEqual([
      { kind: "github", label: "github.com/KalpKan", href: "https://github.com/KalpKan" },
      { kind: "linkedin", label: "LinkedIn", href: "https://linkedin.com/in/k/" },
    ]);
  });
});

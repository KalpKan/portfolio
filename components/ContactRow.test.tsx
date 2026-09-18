import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ContactRow from "./ContactRow";

describe("ContactRow", () => {
  it("renders nothing while every contact value is empty", () => {
    const html = renderToStaticMarkup(
      <ContactRow contact={{ email: "", github: "", linkedin: "" }} />,
    );
    expect(html).toBe("");
  });

  it("renders only the links that have values", () => {
    const html = renderToStaticMarkup(
      <ContactRow contact={{ email: "", github: "KalpKan", linkedin: "" }} />,
    );
    expect(html).toContain('href="https://github.com/KalpKan"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("linkedin");
  });
});

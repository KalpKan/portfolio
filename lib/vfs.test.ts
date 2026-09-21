import { describe, expect, it } from "vitest";
import { buildVfs, caseStudyText, countTree, displayPath, getNode, listDir, resolvePath, treeLines, type VDir } from "./vfs";
import { fixtureVfs, unpark } from "./vfs.fixture";

describe("buildVfs", () => {
  const root = fixtureVfs();

  it("has one folder per registry entry with a README", () => {
    expect(listDir(getNode(root, "/projects") as VDir)).toEqual(["eeg", "later", "promptflip", "unpark"]);
    const readme = getNode(root, "/projects/promptflip/README.md");
    expect(readme?.type).toBe("file");
    const text = (readme as { content: string }).content;
    expect(text).toContain("# promptflip");
    expect(text).toContain("Two prompts walk in, one gets answered.");
    expect(text).toContain("status: live (live)");
    expect(text).toContain("url:    https://promptflip.kalpkan.com");
    expect(text).toContain("repo:   https://github.com/KalpKan/promptflip");
    expect(text.endsWith("\n")).toBe(true);
  });

  it("writes case-study.md only for written (non-draft) showcases", () => {
    expect(listDir(getNode(root, "/projects/unpark") as VDir)).toEqual(["README.md", "case-study.md"]);
    expect(listDir(getNode(root, "/projects/eeg") as VDir)).toEqual(["README.md"]);
    expect(listDir(getNode(root, "/projects/later") as VDir)).toEqual(["README.md"]);
    const cs = (getNode(root, "/projects/unpark/case-study.md") as { content: string }).content;
    expect(cs).toContain("# UnPark, codename Antifreeze");
    expect(cs).toContain("## Problem");
    expect(cs).toContain("1. Sense");
    expect(cs).toContain("- SwiftUI");
    expect(cs).toContain("Hardware prototype.");
    expect(cs).toContain("repo: https://github.com/KalpKan/UnPark");
  });

  it("renders a case study as plain text with no markup beyond headings", () => {
    const text = caseStudyText(unpark);
    expect(text).not.toContain("<");
    expect(text.split("\n")[0]).toBe("# UnPark, codename Antifreeze");
  });

  it("has about, hobbies, the trash, /etc and the hidden secret", () => {
    expect(listDir(root)).toEqual(["about", "etc", "hobbies", "projects", "trash"]);
    expect(listDir(root, true)).toEqual([".secret", "about", "etc", "hobbies", "projects", "trash"]);
    expect((getNode(root, "/about/README.md") as { content: string }).content).toContain("Western University.");
    expect(listDir(getNode(root, "/about") as VDir)).toEqual(["README.md", "music.md", "reading.md"]);
    const music = (getNode(root, "/about/music.md") as { content: string }).content;
    expect(music.split("\n").slice(0, 4)).toEqual(["# On repeat", "", "1. Suffer — Bex", "2. Choosin' Texas — Drake & Don Toliver [unreleased]"]);
    expect(listDir(getNode(root, "/trash") as VDir)).toEqual(["token-coinflip.md"]);
    expect((getNode(root, "/etc/hostname") as { content: string }).content).toBe("kalpkan.com\n");
    expect((getNode(root, "/etc/motd") as { content: string }).content).toContain("4 projects on the desk, 1 live");
    expect((getNode(root, "/.secret") as { content: string }).content).toContain("you found it");
  });

  it("lists the contacts under the bio in /about/README.md, links not handles", () => {
    const readme = (getNode(root, "/about/README.md") as { content: string }).content;
    expect(readme).toContain("email    k@example.com");
    expect(readme).toContain("github   https://github.com/KalpKan");
    expect(readme).toContain("linkedin https://www.linkedin.com/in/kalp-kansara123/");
  });

  it("writes /about/reading.md from site.reading (title, authors, where to look it up)", () => {
    const text = (getNode(root, "/about/reading.md") as { content: string }).content;
    expect(text.split("\n").slice(0, 5)).toEqual([
      "# Currently reading",
      "",
      "The Molecule of More",
      "by Lieberman & Long",
      "https://openlibrary.org/isbn/9781946885111",
    ]);
  });

  it("derives one /hobbies/<slug>.md per site.hobbies entry", () => {
    expect(listDir(getNode(root, "/hobbies") as VDir)).toEqual(["swimming.md", "tennis.md"]);
    expect((getNode(root, "/hobbies/swimming.md") as { content: string }).content).toBe("# Swimming\n\nI love swimming.\n");
  });

  it("leaves /about and /hobbies bare when the site has no reading list, hobbies or contacts", () => {
    const bare = buildVfs({
      projects: [],
      caseStudies: {},
      site: { name: "K", note: "n", tagline: "t" },
      scrapped: [],
    });
    expect(listDir(getNode(bare, "/about") as VDir)).toEqual(["README.md"]);
    expect(listDir(getNode(bare, "/hobbies") as VDir)).toEqual([]);
    expect((getNode(bare, "/about/README.md") as { content: string }).content).toBe("# K\n\nt\n\nn\n");
  });
});

describe("resolvePath", () => {
  it("handles ~, .., absolute and relative paths and never leaves the root", () => {
    expect(resolvePath("/", "projects")).toBe("/projects");
    expect(resolvePath("/projects", "promptflip/README.md")).toBe("/projects/promptflip/README.md");
    expect(resolvePath("/projects/promptflip", "..")).toBe("/projects");
    expect(resolvePath("/projects", "../trash")).toBe("/trash");
    expect(resolvePath("/projects/promptflip", "../../trash")).toBe("/trash");
    expect(resolvePath("/projects", "~")).toBe("/");
    expect(resolvePath("/projects", "~/etc/motd")).toBe("/etc/motd");
    expect(resolvePath("/projects", "/etc")).toBe("/etc");
    expect(resolvePath("/", "../../..")).toBe("/");
    expect(resolvePath("/projects", "./././promptflip/")).toBe("/projects/promptflip");
    expect(resolvePath("/projects", "")).toBe("/");
    expect(resolvePath("/a/b", "..//c/../d")).toBe("/a/d");
  });

  it("shows the home as ~", () => {
    expect(displayPath("/")).toBe("~");
    expect(displayPath("/projects")).toBe("~/projects");
    expect(displayPath("/home/kalp", "/home/kalp")).toBe("~");
    expect(displayPath("/home/kalp/x", "/home/kalp")).toBe("~/x");
    expect(displayPath("/etc", "/home/kalp")).toBe("/etc");
  });
});

describe("tree", () => {
  it("draws the tree with dirs marked and counts what it drew", () => {
    const root = fixtureVfs();
    const lines = treeLines(getNode(root, "/projects") as VDir);
    expect(lines[0]).toBe("├── eeg/");
    expect(lines[1]).toBe("│   └── README.md");
    expect(lines.slice(-3)).toEqual(["└── unpark/", "    ├── README.md", "    └── case-study.md"]);
    expect(countTree(getNode(root, "/projects") as VDir)).toEqual({ dirs: 4, files: 5 });
    // The secret is a dotfile: tree and the count leave it out.
    expect(treeLines(root).some((l) => l.includes(".secret"))).toBe(false);
  });
});

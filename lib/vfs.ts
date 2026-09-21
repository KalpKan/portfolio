import type { CaseStudy } from "@/content/case-study";
import type { Project } from "./projects";
import { projectKind } from "./projects";
import type { Scrapped } from "./scrapped";
import { contactLinks } from "./contact";
import type { Book, Hobby, SiteConfig, Track } from "./site";

/*
 * The terminal's read-only virtual filesystem (Terminal window, T6.1).
 *
 * Everything in it is derived from the real data at render time, never typed
 * in by hand: one folder per registry entry under /projects (so adding a
 * project to projects.json adds a folder), the case studies as plain text,
 * the site note (and the playlist as music.md) under /about, the Trash's scrapped repos under /trash, and a
 * few /etc files. The home directory is the root: `~` and `/` are the same
 * place, so `cd projects` works from the prompt and `/projects/<slug>` is
 * also `~/projects/<slug>`.
 *
 * Pure functions only; lib/shell.ts interprets commands over this tree and
 * the React component just renders.
 */

export type VDir = { type: "dir"; children: Record<string, VNode> };
export type VFile = { type: "file"; content: string };
export type VNode = VDir | VFile;

export const HOME = "/";

export function dir(children: Record<string, VNode> = {}): VDir {
  return { type: "dir", children };
}

export function file(content: string): VFile {
  return { type: "file", content: content.endsWith("\n") ? content : `${content}\n` };
}

/** The spike trace, in ASCII, for ~/.secret and neofetch. */
export const KK_ART = [
  "      /\\",
  "     /  \\    /\\",
  " ___/    \\  /  \\/\\___",
  "          \\/",
].join("\n");

const KIND_WORD: Record<ReturnType<typeof projectKind>, string> = {
  live: "live",
  archived: "archived",
  coming: "coming",
  showcase: "case study",
  "showcase-soon": "case study (not written yet)",
};

function readmeFor(p: Project): string {
  const lines = [`# ${p.name}`, "", p.tagline, "", `status: ${p.status} (${KIND_WORD[projectKind(p)]})`];
  if (p.type === "app" && p.url) lines.push(`url:    ${p.url}`);
  if (p.type === "showcase") lines.push(`url:    https://kalpkan.com/projects/${p.slug}`);
  lines.push(`repo:   ${p.repo ?? "not on GitHub"}`);
  if (p.tags.length) lines.push(`tags:   ${p.tags.join(", ")}`);
  if (p.type === "app" && p.healthUrl) lines.push(`health: ${p.healthUrl}`);
  return lines.join("\n");
}

/** A case study (content/projects/<slug>.ts) as plain text. */
export function caseStudyText(c: CaseStudy): string {
  const out: string[] = [`# ${c.title}`, c.kicker, "", c.lede, "", "## Problem", "", c.problem, "", "## How it works", "", c.howItWorks.intro, ""];
  c.howItWorks.steps.forEach((s, i) => {
    out.push(`${i + 1}. ${s.title}`, `   ${s.body}`, "");
  });
  out.push("## Tech", "", c.tech.map((t) => `- ${t}`).join("\n"), "", "## Status", "", c.status);
  for (const l of c.links ?? []) out.push("", `${l.label.toLowerCase()}: ${l.href}`);
  if (c.repo) out.push("", `repo: ${c.repo}`);
  return out.join("\n");
}

/** The playlist (lib/site.ts) as a numbered list; tags in brackets. */
export function playlistText(playlist: readonly Track[], title: string): string {
  const rows = playlist.map((t, i) => `${i + 1}. ${t.title} — ${t.artist}${t.tag ? ` [${t.tag}]` : ""}`);
  return [`# ${title}`, "", ...rows, "", "Visual only: the desk's Music app plays nothing, it just keeps the list."].join("\n");
}

/** The reading list (lib/site.ts) as plain text; the first book is the current one. */
export function readingText(reading: readonly Book[]): string {
  const out: string[] = ["# Currently reading", ""];
  reading.forEach((b, i) => {
    if (i) out.push("");
    out.push(b.title, `by ${b.authors}`, b.url);
  });
  return out.join("\n");
}

/** One hobby as its own .md file: the name, Kalp's line, nothing else. */
export function hobbyText(h: Hobby): string {
  return [`# ${h.name}`, "", h.line].join("\n");
}

export interface VfsInput {
  projects: Project[];
  caseStudies: Record<string, CaseStudy>;
  site: Pick<SiteConfig, "name" | "note" | "tagline"> & Partial<Pick<SiteConfig, "playlist" | "musicTitle" | "reading" | "hobbies" | "contact">>;
  scrapped: readonly Scrapped[];
  /** Overrides the build-time hostname in /etc/hostname (tests). */
  hostname?: string;
}

export function buildVfs({ projects, caseStudies, site, scrapped, hostname = "kalpkan.com" }: VfsInput): VDir {
  const projectDirs: Record<string, VNode> = {};
  for (const p of projects) {
    const children: Record<string, VNode> = { "README.md": file(readmeFor(p)) };
    const cs = caseStudies[p.slug];
    if (p.type === "showcase" && cs && !cs.draft) children["case-study.md"] = file(caseStudyText(cs));
    projectDirs[p.slug] = dir(children);
  }

  const trash: Record<string, VNode> = {};
  for (const s of scrapped) trash[`${s.name}.md`] = file(`# ${s.name}\n\n${s.line}\n\nrepo: ${s.href}`);

  const live = projects.filter((p) => projectKind(p) === "live").length;
  const motd = [
    `Welcome to KalpOS 1.0 (${hostname})`,
    "",
    `${projects.length} projects on the desk, ${live} live.`,
    "Type `help` to see what this shell can do. Everything here is read-only.",
  ].join("\n");

  const readme = [`# ${site.name}`, "", site.tagline, "", site.note];
  const contacts = site.contact ? contactLinks(site.contact) : [];
  if (contacts.length) {
    readme.push("");
    for (const l of contacts) readme.push(`${l.kind.padEnd(8)} ${l.kind === "email" ? l.label : l.href}`);
  }
  const about: Record<string, VNode> = { "README.md": file(readme.join("\n")) };
  if (site.playlist?.length) about["music.md"] = file(playlistText(site.playlist, site.musicTitle ?? "On repeat"));
  if (site.reading?.length) about["reading.md"] = file(readingText(site.reading));

  const hobbies: Record<string, VNode> = {};
  for (const h of site.hobbies ?? []) hobbies[`${h.slug}.md`] = file(hobbyText(h));

  return dir({
    projects: dir(projectDirs),
    about: dir(about),
    hobbies: dir(hobbies),
    trash: dir(trash),
    etc: dir({
      motd: file(motd),
      hostname: file(hostname),
    }),
    ".secret": file(
      [
        KK_ART,
        "",
        "you found it.",
        "",
        "This desk is a Next.js app on Vercel's free tier; every project on it",
        "is checked for a pulse each time the page loads. The spike above is the",
        "trace a tile draws when its check answers ok.",
        "",
        "Source: https://github.com/KalpKan/portfolio",
      ].join("\n"),
    ),
  });
}

/* ------------------------------------------------------------ path ops */

/** Split an absolute path into its segments ("/" → []). */
export function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/**
 * Resolve `input` against `cwd` (both absolute unless `input` is relative):
 * `~` and `~/x` expand to the home, `.`/`..` collapse, and going above the
 * root stays at the root. Never touches the tree, so it works for paths that
 * do not exist yet (cd errors are the shell's job).
 */
export function resolvePath(cwd: string, input: string, home: string = HOME): string {
  let raw = input.trim();
  if (raw === "" || raw === "~") raw = home;
  else if (raw.startsWith("~/")) raw = `${home === "/" ? "" : home}/${raw.slice(2)}`;
  const base = raw.startsWith("/") ? [] : segments(cwd);
  const out = [...base];
  for (const part of segments(raw)) {
    if (part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return `/${out.join("/")}`;
}

/** Look a node up by absolute path. */
export function getNode(root: VDir, path: string): VNode | undefined {
  let node: VNode = root;
  for (const part of segments(path)) {
    if (node.type !== "dir") return undefined;
    const next: VNode | undefined = node.children[part];
    if (!next) return undefined;
    node = next;
  }
  return node;
}

/** Directory entries sorted like BSD ls (byte order, so README.md before case-study.md); dotfiles only when `all`. */
export function listDir(node: VDir, all = false): string[] {
  return Object.keys(node.children)
    .filter((n) => all || !n.startsWith("."))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Display form of an absolute path: the home becomes `~`. */
export function displayPath(path: string, home: string = HOME): string {
  if (path === home) return "~";
  if (home === "/") return `~${path}`;
  return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

export function basename(path: string): string {
  const s = segments(path);
  return s[s.length - 1] ?? "";
}

export function dirname(path: string): string {
  const s = segments(path);
  s.pop();
  return `/${s.join("/")}`;
}

/** The tree as `tree` prints it. */
export function treeLines(node: VDir, prefix = ""): string[] {
  const names = listDir(node);
  const out: string[] = [];
  names.forEach((name, i) => {
    const last = i === names.length - 1;
    const child = node.children[name];
    out.push(`${prefix}${last ? "└── " : "├── "}${name}${child.type === "dir" ? "/" : ""}`);
    if (child.type === "dir") out.push(...treeLines(child, `${prefix}${last ? "    " : "│   "}`));
  });
  return out;
}

export function countTree(node: VDir): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;
  for (const name of listDir(node)) {
    const child = node.children[name];
    if (child.type === "dir") {
      dirs += 1;
      const c = countTree(child);
      dirs += c.dirs;
      files += c.files;
    } else files += 1;
  }
  return { dirs, files };
}

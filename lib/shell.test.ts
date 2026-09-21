import { describe, expect, it } from "vitest";
import type { Tile } from "./tiles";
import { complete, INITIAL_STATE, promptFor, runLine, tokenize, UNAME, type Line, type ShellContext, type ShellState } from "./shell";
import { fixtureVfs } from "./vfs.fixture";

const tile = (t: Partial<Tile> & Pick<Tile, "slug" | "kind">): Tile => ({
  name: t.slug,
  tagline: "",
  hardware: false,
  href: null,
  external: false,
  repo: null,
  healthUrl: null,
  tags: [],
  archived: false,
  showcase: false,
  ...t,
});

const tiles: Tile[] = [
  tile({ slug: "promptflip", kind: "live", href: "https://promptflip.kalpkan.com", external: true, healthUrl: "https://promptflip.kalpkan.com/api/health" }),
  tile({ slug: "unpark", kind: "case", name: "UnPark", href: "/projects/unpark", showcase: true }),
  tile({ slug: "eeg", kind: "coming", showcase: true }),
  tile({ slug: "later", kind: "coming" }),
];

const ctx: ShellContext = {
  root: fixtureVfs(),
  tiles,
  signals: { promptflip: "ok" },
  now: () => new Date(2026, 8, 20, 11, 42, 8),
};

const text = (lines: Line[]) => lines.map((l) => l.map((s) => s.text).join("")).join("\n");

/** Run several lines in sequence, returning the final state and every printed line. */
function session(cmds: string[], state: ShellState = INITIAL_STATE) {
  let s = state;
  const all: string[] = [];
  const effects = [];
  for (const c of cmds) {
    const r = runLine(ctx, s, c);
    s = r.state;
    all.push(text(r.lines));
    effects.push(...r.effects);
  }
  return { state: s, out: all, effects };
}

describe("tokenize", () => {
  it("splits on whitespace and keeps quoted words together", () => {
    expect(tokenize("  ls -la  projects ")).toEqual(["ls", "-la", "projects"]);
    expect(tokenize(`echo "hi there" 'you'`)).toEqual(["echo", "hi there", "you"]);
    expect(tokenize(`echo ""`)).toEqual(["echo", ""]);
    expect(tokenize("")).toEqual([]);
  });
});

describe("the prompt and the plain commands", () => {
  it("prompts as kalp@kalpos ~ % and follows cd", () => {
    expect(promptFor(INITIAL_STATE)).toBe("kalp@kalpos ~ %");
    const { state } = session(["cd projects"]);
    expect(promptFor(state)).toBe("kalp@kalpos ~/projects %");
  });

  it("whoami, uname, date, echo, pwd", () => {
    const { out } = session(["whoami", "uname", "uname -a", "date", "echo hello   world", "pwd"]);
    expect(out).toEqual(["kalp", "KalpOS", UNAME, "Sun Sep 20 11:42:08 2026", "hello world", "/"]);
  });

  it("an empty line prints nothing and is not recorded; history lists what was typed", () => {
    const r = runLine(ctx, INITIAL_STATE, "   ");
    expect(r.lines).toEqual([]);
    expect(r.name).toBeNull();
    expect(r.state.history).toEqual([]);
    const { out } = session(["ls", "  pwd ", "history"]);
    expect(out[2]).toBe("   1  ls\n   2  pwd\n   3  history");
  });

  it("an unknown command is a zsh error and still names the command", () => {
    const r = runLine(ctx, INITIAL_STATE, "vim README.md");
    expect(text(r.lines)).toBe("zsh: command not found: vim");
    expect(r.lines[0][0].tone).toBe("err");
    expect(r.name).toBe("vim");
  });

  it("help lists every command", () => {
    const r = runLine(ctx, INITIAL_STATE, "help");
    for (const c of ["ls", "cd", "cat", "tree", "open", "status", "neofetch", "exit", "reboot", "lock", "logout"]) expect(text(r.lines)).toContain(c);
  });
});

describe("ls", () => {
  it("lists the cwd, hides dotfiles unless -a, and marks directories", () => {
    const r = runLine(ctx, INITIAL_STATE, "ls");
    expect(text(r.lines)).toBe("about  etc  hobbies  projects  trash");
    expect(r.lines[0][0]).toEqual({ text: "about", tone: "dir" });
    expect(text(runLine(ctx, INITIAL_STATE, "ls -a").lines)).toBe(".secret  about  etc  hobbies  projects  trash");
  });

  it("takes a path, relative or absolute, and errors on a missing one", () => {
    expect(text(runLine(ctx, INITIAL_STATE, "ls projects").lines)).toBe("eeg  later  promptflip  unpark");
    expect(text(runLine(ctx, { ...INITIAL_STATE, cwd: "/projects/eeg" }, "ls ../unpark").lines)).toBe("README.md  case-study.md");
    expect(text(runLine(ctx, INITIAL_STATE, "ls /etc").lines)).toBe("hostname  motd");
    expect(text(runLine(ctx, INITIAL_STATE, "ls nope").lines)).toBe("ls: nope: No such file or directory");
  });

  it("ls of a file prints the file; hobbies lists one .md per hobby; -l is a long listing", () => {
    expect(text(runLine(ctx, INITIAL_STATE, "ls etc/motd").lines)).toBe("motd");
    expect(text(runLine(ctx, INITIAL_STATE, "ls hobbies").lines)).toBe("swimming.md  tennis.md");
    const long = text(runLine(ctx, INITIAL_STATE, "ls -la etc").lines).split("\n");
    expect(long[0]).toBe("total 4");
    expect(long[1]).toMatch(/^dr--r--r--  kalp  staff\s+\d+  \.$/);
    expect(long[3]).toMatch(/^-r--r--r--  kalp  staff\s+\d+  hostname$/);
  });

  it("lists several paths with headings", () => {
    const out = text(runLine(ctx, INITIAL_STATE, "ls etc trash").lines);
    expect(out).toBe("etc:\nhostname  motd\n\ntrash:\ntoken-coinflip.md");
  });
});

describe("cd", () => {
  it("moves with relative, .., ~ and absolute paths and clamps at the root", () => {
    const { state, out } = session(["cd projects", "cd promptflip", "cd ..", "cd ../trash", "cd ~", "cd /etc", "cd ../../.."]);
    expect(out.every((o) => o === "")).toBe(true);
    expect(state.cwd).toBe("/");
    expect(session(["cd projects", "cd unpark"]).state.cwd).toBe("/projects/unpark");
    expect(session(["cd /projects/unpark", "cd"]).state.cwd).toBe("/");
  });

  it("errors on a missing dir or a file, staying put", () => {
    const missing = runLine(ctx, INITIAL_STATE, "cd nope");
    expect(text(missing.lines)).toBe("cd: no such file or directory: nope");
    expect(missing.state.cwd).toBe("/");
    const f = runLine(ctx, INITIAL_STATE, "cd etc/motd");
    expect(text(f.lines)).toBe("cd: not a directory: etc/motd");
    expect(text(runLine(ctx, INITIAL_STATE, "cd a b").lines)).toBe("cd: too many arguments");
  });
});

describe("cat, head, tree", () => {
  it("cat prints a file relative to the cwd; errors are per argument", () => {
    const { out } = session(["cd projects", "cat promptflip/README.md"]);
    expect(out[1]).toContain("# promptflip");
    expect(out[1]).toContain("status: live");
    expect(out[1].endsWith("\n")).toBe(false);
    expect(text(runLine(ctx, INITIAL_STATE, "cat").lines)).toBe("cat: no file given (try `ls`)");
    expect(text(runLine(ctx, INITIAL_STATE, "cat trash").lines)).toBe("cat: trash: Is a directory");
    expect(text(runLine(ctx, INITIAL_STATE, "cat etc/hostname nope").lines)).toBe("kalpkan.com\ncat: nope: No such file or directory");
    expect(text(runLine(ctx, INITIAL_STATE, "cat ~/.secret").lines)).toContain("you found it");
  });

  it("head prints the first lines, -n or -N", () => {
    expect(text(runLine(ctx, INITIAL_STATE, "head -n 1 projects/unpark/case-study.md").lines)).toBe("# UnPark, codename Antifreeze");
    expect(text(runLine(ctx, INITIAL_STATE, "head -2 etc/motd").lines)).toBe("Welcome to KalpOS 1.0 (kalpkan.com)\n");
    expect(text(runLine(ctx, INITIAL_STATE, "head etc/motd").lines).split("\n").length).toBe(4);
    expect(text(runLine(ctx, INITIAL_STATE, "head").lines)).toBe("head: no file given");
    expect(text(runLine(ctx, INITIAL_STATE, "head -n x etc/motd").lines)).toBe("head: illegal line count");
  });

  it("tree draws the cwd or a path and counts", () => {
    const out = text(runLine(ctx, INITIAL_STATE, "tree projects").lines).split("\n");
    expect(out[0]).toBe("projects");
    expect(out[1]).toBe("├── eeg/");
    expect(out[out.length - 1]).toBe("4 directories, 5 files");
    expect(text(runLine(ctx, INITIAL_STATE, "tree").lines).split("\n")[0]).toBe("~");
    expect(text(runLine(ctx, INITIAL_STATE, "tree nope").lines)).toBe("tree: nope: No such file or directory");
  });
});

describe("open, status, clear, exit", () => {
  it("open a live app is an external open; a case study opens its window; coming has nothing", () => {
    const live = runLine(ctx, INITIAL_STATE, "open promptflip");
    expect(live.effects).toEqual([{ type: "open", slug: "promptflip", href: "https://promptflip.kalpkan.com", external: true }]);
    const cs = runLine(ctx, INITIAL_STATE, "open unpark");
    expect(cs.effects).toEqual([{ type: "open", slug: "unpark", href: "/projects/unpark", external: false }]);
    expect(text(cs.lines)).toBe("Opening the UnPark case study…");
    expect(text(runLine(ctx, INITIAL_STATE, "open later").lines)).toBe("open: later has nothing to open yet (coming)");
    expect(text(runLine(ctx, INITIAL_STATE, "open nope").lines)).toBe("open: no project named nope");
    expect(text(runLine(ctx, INITIAL_STATE, "open").lines)).toBe("open: which project? (ls projects)");
    // A path to the project's folder works too.
    expect(runLine(ctx, { ...INITIAL_STATE, cwd: "/projects" }, "open ./promptflip/").effects[0]).toMatchObject({ slug: "promptflip" });
  });

  it("status asks the component to run the round; clear and exit are effects", () => {
    const s = runLine(ctx, INITIAL_STATE, "status");
    expect(s.effects).toEqual([{ type: "status" }]);
    expect(text(s.lines)).toBe("Checking 1 live apps through /api/status/<slug>…");
    expect(runLine(ctx, INITIAL_STATE, "clear").effects).toEqual([{ type: "clear" }]);
    const e = runLine(ctx, INITIAL_STATE, "exit");
    expect(e.effects).toEqual([{ type: "exit" }]);
    expect(text(e.lines)).toBe("logout");
  });

  it("reboot / restart ask the desk to reboot after printing Restarting…; lock / logout ask for the lock screen", () => {
    for (const cmd of ["reboot", "restart"]) {
      const r = runLine(ctx, INITIAL_STATE, cmd);
      expect(r.effects).toEqual([{ type: "restart" }]);
      expect(text(r.lines)).toBe("Restarting…");
      expect(r.name).toBe(cmd);
    }
    for (const cmd of ["lock", "logout"]) {
      const r = runLine(ctx, INITIAL_STATE, cmd);
      expect(r.effects).toEqual([{ type: "lock" }]);
      expect(r.name).toBe(cmd);
    }
  });

  it("neofetch prints the mark and the measured stats", () => {
    const out = text(runLine(ctx, INITIAL_STATE, "neofetch").lines);
    expect(out).toContain("kalp@kalpos");
    expect(out).toContain("OS: KalpOS 1.0 (kalpkan.com)");
    expect(out).toContain("Projects: 4 (1 live, 1 case studies, 2 coming)");
    expect(out).toContain("Signal: 1/1 ok");
    expect(out).toContain("Uptime: https://stats.uptimerobot.com/a6n3Wx3PBp");
    expect(out).toContain("/\\");
    const checking = text(runLine({ ...ctx, signals: {} }, INITIAL_STATE, "neofetch").lines);
    expect(checking).toContain("Signal: 0/1 ok, still checking…");
  });

  it("writes are refused politely", () => {
    expect(text(runLine(ctx, INITIAL_STATE, "rm -rf /").lines)).toBe("rm: read-only file system");
    expect(text(runLine(ctx, INITIAL_STATE, "sudo ls").lines)).toContain("not in the sudoers file");
  });
});

describe("Tab completion", () => {
  it("completes a command word, adding a space when unique", () => {
    expect(complete(ctx, INITIAL_STATE, "neo")).toEqual({ input: "neofetch ", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "reb")).toEqual({ input: "reboot ", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "lo")).toEqual({ input: "lo", candidates: ["lock", "logout"] });
    expect(complete(ctx, INITIAL_STATE, "")).toMatchObject({ input: "" });
    expect(complete(ctx, INITIAL_STATE, "").candidates.length).toBeGreaterThan(10);
  });

  it("completes a path, adding / for a directory and listing ambiguities", () => {
    expect(complete(ctx, INITIAL_STATE, "cd pro")).toEqual({ input: "cd projects/", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "cat projects/promptflip/R")).toEqual({ input: "cat projects/promptflip/README.md ", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "ls projects/")).toEqual({ input: "ls projects/", candidates: ["eeg/", "later/", "promptflip/", "unpark/"] });
    expect(complete(ctx, { ...INITIAL_STATE, cwd: "/projects" }, "cat unpark/")).toEqual({ input: "cat unpark/", candidates: ["README.md", "case-study.md"] });
    expect(complete(ctx, INITIAL_STATE, "cd ../pr")).toEqual({ input: "cd ../projects/", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "cd ~/e")).toEqual({ input: "cd ~/etc/", candidates: [] });
  });

  it("extends to the common prefix and shows dotfiles only when asked", () => {
    const r = complete(ctx, INITIAL_STATE, "ls h");
    expect(r).toEqual({ input: "ls hobbies/", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "cat .")).toEqual({ input: "cat .secret ", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "ls zzz")).toEqual({ input: "ls zzz", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "ls nowhere/x")).toEqual({ input: "ls nowhere/x", candidates: [] });
  });

  it("completes project slugs after open", () => {
    expect(complete(ctx, INITIAL_STATE, "open pr")).toEqual({ input: "open promptflip ", candidates: [] });
    expect(complete(ctx, INITIAL_STATE, "open ")).toMatchObject({ candidates: ["promptflip", "unpark", "eeg", "later"] });
  });
});

describe("theme (T6.10)", () => {
  it("reports the appearance it was given, and how to change it", () => {
    const r = runLine({ ...ctx, appearance: "dark" }, INITIAL_STATE, "theme");
    expect(text(r.lines)).toBe("appearance  dark\nusage: theme light | dark | auto");
    expect(r.effects).toEqual([]);
    // With no appearance in the context (SSR, a test) it says light, the default.
    expect(text(runLine(ctx, INITIAL_STATE, "theme").lines).split("\n")[0]).toBe("appearance  light");
  });

  it("sets each of the three, as one effect the component performs", () => {
    for (const value of ["light", "dark", "auto"] as const) {
      const r = runLine(ctx, INITIAL_STATE, `theme ${value}`);
      expect(r.effects).toEqual([{ type: "appearance", value }]);
      expect(text(r.lines)).toBe(`appearance  ${value}`);
    }
  });

  it("refuses anything else without changing the desk", () => {
    const bad = runLine(ctx, INITIAL_STATE, "theme midnight");
    expect(text(bad.lines)).toBe("theme: midnight: expected light, dark, auto");
    expect(bad.effects).toEqual([]);
    const many = runLine(ctx, INITIAL_STATE, "theme dark light");
    expect(text(many.lines)).toBe("theme: too many arguments");
    expect(many.effects).toEqual([]);
  });

  it("is in help and in Tab completion", () => {
    expect(text(runLine(ctx, INITIAL_STATE, "help").lines)).toContain("theme [light|dark|auto]");
    expect(complete(ctx, INITIAL_STATE, "the")).toEqual({ input: "theme ", candidates: [] });
  });
});

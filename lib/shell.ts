import { APPEARANCES, isAppearance, type Appearance } from "./appearance";
import { claudeLine, completeClaude, welcome, type Chunk } from "./fake-claude";
import { checksDone, hasCheck, okCount, type Signal } from "./signal";
import type { Tile } from "./tiles";
import { basename, countTree, displayPath, getNode, HOME, KK_ART, listDir, resolvePath, treeLines, type VDir, type VNode } from "./vfs";

/*
 * The terminal's shell: a pure interpreter over lib/vfs.ts. `runLine` takes
 * the shell state and one typed line and returns the new state, the lines to
 * print and the side effects the component must perform (open a project,
 * clear the screen, run the health round, close the window). Nothing here
 * touches the DOM, fetch or PostHog, so every command is unit-testable.
 */

export type Tone = "out" | "dim" | "ok" | "err" | "dir" | "accent";
export type Span = { text: string; tone?: Tone };
export type Line = Span[];

export type Effect =
  | { type: "open"; slug: string; href: string; external: boolean }
  | { type: "status" }
  | { type: "clear" }
  | { type: "exit" }
  /** `lock` / `logout`: the desk shows the lock screen (KalpOS.tsx). */
  | { type: "lock" }
  /** `reboot` / `restart`: the desk reboots through the full boot sequence, no confirm. */
  | { type: "restart" }
  /** `theme light|dark|auto`: the same switch as the KalpOS menu's Appearance row. */
  | { type: "appearance"; value: Appearance }
  /** A fake-Claude reply to play with its typing rhythm (lib/fake-claude.ts). */
  | { type: "reply"; chunks: Chunk[] };

export interface ShellContext {
  root: VDir;
  tiles: Tile[];
  signals: Record<string, Signal>;
  hostname?: string;
  now?: () => Date;
  /** The appearance the desk is set to, so bare `theme` can report it. */
  appearance?: Appearance;
  /** For the fake Claude's canned replies; tests seed it. */
  random?: () => number;
}

/** `zsh` is the shell; `claude` is the fake Claude Code session started by `claude`. */
export type Mode = "zsh" | "claude";

export interface ShellState {
  cwd: string;
  mode: Mode;
  /** zsh history; the Claude session keeps its own. */
  history: string[];
  claudeHistory: string[];
}

export interface ShellResult {
  state: ShellState;
  lines: Line[];
  effects: Effect[];
  /** The command word that ran (for the `terminal_command` event); null for an empty line. */
  name: string | null;
}

export const INITIAL_STATE: ShellState = { cwd: HOME, mode: "zsh", history: [], claudeHistory: [] };

export const USER = "kalp";
export const HOST = "kalpos";
export const UNAME = "KalpOS 1.0 kalpkan.com";
export const UPTIME_URL = "https://stats.uptimerobot.com/a6n3Wx3PBp";

export const COMMANDS = [
  "help",
  "ls",
  "cd",
  "pwd",
  "cat",
  "head",
  "tree",
  "echo",
  "whoami",
  "uname",
  "date",
  "open",
  "status",
  "neofetch",
  "history",
  "claude",
  "clear",
  "exit",
  "lock",
  "logout",
  "reboot",
  "restart",
  "theme",
] as const;

const HELP: [string, string][] = [
  ["help", "this list"],
  ["ls [-la] [path]", "list a directory"],
  ["cd [path]", "change directory (.., ~, absolute or relative)"],
  ["pwd", "print the working directory"],
  ["cat <file>", "print a file"],
  ["head [-n N] <file>", "print the first N lines (10)"],
  ["tree [path]", "the directory as a tree"],
  ["echo <text>", "print text"],
  ["whoami / uname -a / date", "who, what, when"],
  ["open <project>", "open a project: the live app, or its case study"],
  ["status", "run the health round: GET /api/status/<slug> for every live app"],
  ["neofetch", "the desk's stats"],
  ["history", "what you typed"],
  ["claude", "start a Claude Code session (a fake one)"],
  ["clear / exit", "wipe the screen / close the window"],
  ["lock / logout", "show the lock screen"],
  ["reboot / restart", "reboot KalpOS: the boot, the chime, the lock"],
  ["theme [light|dark|auto]", "the desk's appearance (auto follows your machine)"],
];

export function promptFor(state: ShellState): string {
  if (state.mode === "claude") return ">";
  return `${USER}@${HOST} ${displayPath(state.cwd)} %`;
}

/** The history the ↑/↓ keys walk in the current mode. */
export function historyFor(state: ShellState): string[] {
  return state.mode === "claude" ? state.claudeHistory : state.history;
}

const out = (text: string, tone?: Tone): Line => [{ text, tone }];
const err = (text: string): Line => out(text, "err");

/** Split a line into words; double and single quotes group words. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: string | null = null;
  let has = false;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (has || cur) tokens.push(cur);
      cur = "";
      has = false;
    } else cur += ch;
  }
  if (has || cur) tokens.push(cur);
  return tokens;
}

function flagsAndArgs(args: string[]): { flags: Set<string>; rest: string[] } {
  const flags = new Set<string>();
  const rest: string[] = [];
  for (const a of args) {
    if (a.startsWith("-") && a.length > 1 && !/^-\d/.test(a)) for (const c of a.slice(1)) flags.add(c);
    else rest.push(a);
  }
  return { flags, rest };
}

function lsLines(node: VNode, path: string, all: boolean, long: boolean, label?: string): Line[] {
  const lines: Line[] = [];
  if (label !== undefined) lines.push(out(`${label}:`, "dim"));
  if (node.type === "file") {
    lines.push(out(basename(path)));
    return lines;
  }
  const names = listDir(node, all);
  if (long) {
    const shown = all ? [".", "..", ...names] : names;
    lines.push(out(`total ${shown.length}`, "dim"));
    for (const n of shown) {
      const child = n === "." || n === ".." ? node : node.children[n];
      const isDir = child.type === "dir";
      const size = isDir ? Object.keys((child as VDir).children).length : (child as { content: string }).content.length;
      lines.push([
        { text: `${isDir ? "d" : "-"}r--r--r--  ${USER}  staff  ${String(size).padStart(6)}  `, tone: "dim" },
        { text: n, tone: isDir ? "dir" : undefined },
      ]);
    }
    return lines;
  }
  if (names.length === 0) return lines;
  const line: Line = [];
  names.forEach((n, i) => {
    line.push({ text: n, tone: node.children[n].type === "dir" ? "dir" : undefined });
    if (i < names.length - 1) line.push({ text: "  " });
  });
  lines.push(line);
  return lines;
}

function readFileLines(ctx: ShellContext, cwd: string, arg: string, cmd: string): { lines?: string[]; error?: Line } {
  const path = resolvePath(cwd, arg);
  const node = getNode(ctx.root, path);
  if (!node) return { error: err(`${cmd}: ${arg}: No such file or directory`) };
  if (node.type === "dir") return { error: err(`${cmd}: ${arg}: Is a directory`) };
  const lines = node.content.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return { lines };
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function signalWord(ctx: ShellContext): string {
  const checked = ctx.tiles.filter(hasCheck);
  if (checked.length === 0) return "no health checks";
  const sub: Record<string, Signal> = {};
  for (const t of checked) sub[t.slug] = ctx.signals[t.slug] ?? "checking";
  return checksDone(sub) ? `${okCount(sub)}/${checked.length} ok` : `${okCount(sub)}/${checked.length} ok, still checking…`;
}

function neofetch(ctx: ShellContext): Line[] {
  const live = ctx.tiles.filter((t) => t.kind === "live").length;
  const cases = ctx.tiles.filter((t) => t.kind === "case").length;
  const coming = ctx.tiles.filter((t) => t.kind === "coming").length;
  const host = ctx.hostname ?? "kalpkan.com";
  const info: [string, string][] = [
    ["OS", `KalpOS 1.0 (${host})`],
    ["Host", "Vercel Hobby, $0 + the domain"],
    ["Shell", "kos-sh (read-only)"],
    ["Projects", `${ctx.tiles.length} (${live} live, ${cases} case studies, ${coming} coming)`],
    ["Signal", signalWord(ctx)],
    ["Uptime", UPTIME_URL],
    ["Source", "github.com/KalpKan/portfolio"],
  ];
  const art = KK_ART.split("\n");
  const width = Math.max(...art.map((l) => l.length)) + 3;
  const rows = Math.max(art.length + 1, info.length + 2);
  const lines: Line[] = [];
  for (let i = 0; i < rows; i++) {
    const left = pad(art[i] ?? "", width);
    if (i === 0) lines.push([{ text: left, tone: "accent" }, { text: `${USER}@${HOST}`, tone: "ok" }]);
    else if (i === 1) lines.push([{ text: left, tone: "accent" }, { text: "-".repeat(`${USER}@${HOST}`.length), tone: "dim" }]);
    else {
      const row = info[i - 2];
      lines.push(row ? [{ text: left, tone: "accent" }, { text: `${row[0]}: `, tone: "ok" }, { text: row[1] }] : [{ text: left, tone: "accent" }]);
    }
  }
  return lines;
}

function formatDate(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const two = (n: number) => String(n).padStart(2, "0");
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())} ${d.getFullYear()}`;
}

function runClaudeLine(ctx: ShellContext, state: ShellState, trimmed: string): ShellResult {
  const claudeHistory = trimmed ? [...state.claudeHistory, trimmed] : state.claudeHistory;
  const r = claudeLine({ tiles: ctx.tiles, root: ctx.root, random: ctx.random }, trimmed);
  const effects: Effect[] = [];
  if (r.status) effects.push({ type: "status" });
  if (r.clear) effects.push({ type: "clear" });
  if (r.chunks.length) effects.push({ type: "reply", chunks: r.chunks });
  const next: ShellState = { ...state, claudeHistory, mode: r.exit ? "zsh" : "claude" };
  // Only the `claude` command itself is tracked; what is typed inside the session is not.
  return { state: next, lines: r.lines, effects, name: null };
}

export function runLine(ctx: ShellContext, state: ShellState, input: string): ShellResult {
  const trimmed = input.trim();
  if (state.mode === "claude") return runClaudeLine(ctx, state, trimmed);
  const history = trimmed ? [...state.history, trimmed] : state.history;
  let cwd = state.cwd;
  const lines: Line[] = [];
  const effects: Effect[] = [];
  const tokens = tokenize(trimmed);
  const name = tokens[0] ?? null;
  const args = tokens.slice(1);
  const { flags, rest } = flagsAndArgs(args);
  let mode: Mode = "zsh";

  switch (name) {
    case null:
      break;
    case "help":
      lines.push(out("KalpOS shell. Everything is read-only; the files are the desk.", "dim"));
      for (const [cmd, what] of HELP) lines.push([{ text: `  ${pad(cmd, 26)}`, tone: "ok" }, { text: what }]);
      break;
    case "ls": {
      const targets = rest.length ? rest : ["."];
      targets.forEach((t, i) => {
        const path = resolvePath(cwd, t);
        const node = getNode(ctx.root, path);
        if (!node) {
          lines.push(err(`ls: ${t}: No such file or directory`));
          return;
        }
        if (i > 0) lines.push(out(""));
        lines.push(...lsLines(node, path, flags.has("a"), flags.has("l"), targets.length > 1 ? t : undefined));
      });
      break;
    }
    case "cd": {
      if (rest.length > 1) {
        lines.push(err("cd: too many arguments"));
        break;
      }
      const target = rest[0] ?? "~";
      const path = resolvePath(cwd, target);
      const node = getNode(ctx.root, path);
      if (!node) lines.push(err(`cd: no such file or directory: ${target}`));
      else if (node.type !== "dir") lines.push(err(`cd: not a directory: ${target}`));
      else cwd = path;
      break;
    }
    case "pwd":
      lines.push(out(cwd));
      break;
    case "cat": {
      if (rest.length === 0) {
        lines.push(err("cat: no file given (try `ls`)"));
        break;
      }
      for (const a of rest) {
        const r = readFileLines(ctx, cwd, a, "cat");
        if (r.error) lines.push(r.error);
        else for (const l of r.lines!) lines.push(out(l));
      }
      break;
    }
    case "head": {
      let n = 10;
      const files: string[] = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-n" && args[i + 1] !== undefined) {
          n = Number(args[++i]);
        } else if (/^-\d+$/.test(a)) n = Number(a.slice(1));
        else if (!a.startsWith("-")) files.push(a);
      }
      if (!Number.isFinite(n) || n < 0) {
        lines.push(err("head: illegal line count"));
        break;
      }
      if (files.length === 0) {
        lines.push(err("head: no file given"));
        break;
      }
      files.forEach((f, i) => {
        const r = readFileLines(ctx, cwd, f, "head");
        if (r.error) {
          lines.push(r.error);
          return;
        }
        if (files.length > 1) lines.push(out(`${i > 0 ? "\n" : ""}==> ${f} <==`, "dim"));
        for (const l of r.lines!.slice(0, n)) lines.push(out(l));
      });
      break;
    }
    case "tree": {
      const target = rest[0] ?? ".";
      const path = resolvePath(cwd, target);
      const node = getNode(ctx.root, path);
      if (!node) {
        lines.push(err(`tree: ${target}: No such file or directory`));
        break;
      }
      if (node.type === "file") {
        lines.push(out(target));
        break;
      }
      lines.push(out(target === "." ? displayPath(path) : target, "dir"));
      for (const l of treeLines(node)) {
        const isDir = l.endsWith("/");
        const cut = l.lastIndexOf("─ ") + 2;
        lines.push([{ text: l.slice(0, cut), tone: "dim" }, { text: l.slice(cut), tone: isDir ? "dir" : undefined }]);
      }
      const c = countTree(node);
      lines.push(out(`${c.dirs} directories, ${c.files} files`, "dim"));
      break;
    }
    case "echo":
      lines.push(out(args.join(" ")));
      break;
    case "whoami":
      lines.push(out(USER));
      break;
    case "uname":
      lines.push(out(flags.has("a") ? UNAME : "KalpOS"));
      break;
    case "date":
      lines.push(out(formatDate((ctx.now ?? (() => new Date()))())));
      break;
    case "open": {
      const slug = rest[0];
      if (!slug) {
        lines.push(err("open: which project? (ls projects)"));
        break;
      }
      const tile = ctx.tiles.find((t) => t.slug === slug || t.slug === basename(resolvePath(cwd, slug)));
      if (!tile) {
        lines.push(err(`open: no project named ${slug}`));
        break;
      }
      if (tile.kind === "case") {
        lines.push(out(`Opening the ${tile.name} case study…`, "dim"));
        effects.push({ type: "open", slug: tile.slug, href: `/projects/${tile.slug}`, external: false });
      } else if (tile.href) {
        lines.push(out(`Opening ${tile.href} in a new tab…`, "dim"));
        effects.push({ type: "open", slug: tile.slug, href: tile.href, external: true });
      } else lines.push(err(`open: ${tile.name} has nothing to open yet (${tile.kind})`));
      break;
    }
    case "status": {
      const checked = ctx.tiles.filter(hasCheck);
      lines.push(out(`Checking ${checked.length} live apps through /api/status/<slug>…`, "dim"));
      effects.push({ type: "status" });
      break;
    }
    case "neofetch":
      lines.push(...neofetch(ctx));
      break;
    case "history":
      history.forEach((h, i) => lines.push([{ text: `${String(i + 1).padStart(4)}  `, tone: "dim" }, { text: h }]));
      break;
    case "claude":
      lines.push(...welcome());
      mode = "claude";
      break;
    case "clear":
      effects.push({ type: "clear" });
      break;
    case "exit":
      lines.push(out("logout", "dim"));
      effects.push({ type: "exit" });
      break;
    case "lock":
    case "logout":
      effects.push({ type: "lock" });
      break;
    case "reboot":
    case "restart":
      lines.push(out("Restarting…", "dim"));
      effects.push({ type: "restart" });
      break;
    case "theme": {
      if (rest.length > 1) {
        lines.push(err("theme: too many arguments"));
        break;
      }
      const want = rest[0];
      if (want === undefined) {
        lines.push([{ text: "appearance  " , tone: "dim" }, { text: ctx.appearance ?? "light", tone: "ok" }]);
        lines.push(out(`usage: theme ${APPEARANCES.join(" | ")}`, "dim"));
        break;
      }
      if (!isAppearance(want)) {
        lines.push(err(`theme: ${want}: expected ${APPEARANCES.join(", ")}`));
        break;
      }
      lines.push([{ text: "appearance  " , tone: "dim" }, { text: want, tone: "ok" }]);
      effects.push({ type: "appearance", value: want });
      break;
    }
    case "sudo":
      lines.push(err(`${USER} is not in the sudoers file. This incident will be reported.`));
      break;
    case "rm":
    case "mv":
    case "touch":
    case "mkdir":
      lines.push(err(`${name}: read-only file system`));
      break;
    default:
      lines.push(err(`zsh: command not found: ${name}`));
  }

  return { state: { ...state, cwd, history, mode }, lines, effects, name };
}

function commonPrefix(items: string[]): string {
  if (items.length === 0) return "";
  let p = items[0];
  for (const s of items.slice(1)) {
    while (!s.startsWith(p)) p = p.slice(0, -1);
  }
  return p;
}

export interface Completion {
  /** The input with the last word completed as far as it is unambiguous. */
  input: string;
  /** Every candidate when more than one matched (the component prints them). */
  candidates: string[];
}

/** Tab completion of the command word, a project slug after `open`, or a path. */
export function complete(ctx: ShellContext, state: ShellState, input: string): Completion {
  if (state.mode === "claude") return completeClaude(input);
  const endsWithSpace = /\s$/.test(input);
  const tokens = tokenize(input);
  const last = endsWithSpace ? "" : (tokens[tokens.length - 1] ?? "");
  const head = endsWithSpace ? input : input.slice(0, input.length - last.length);
  const isCommand = tokens.length === 0 || (tokens.length === 1 && !endsWithSpace);

  let candidates: string[];
  let prefixDir = "";
  if (isCommand) {
    candidates = COMMANDS.filter((c) => c.startsWith(last)).map((c) => `${c} `);
  } else if (tokens[0] === "open") {
    candidates = ctx.tiles.map((t) => t.slug).filter((s) => s.startsWith(last)).map((s) => `${s} `);
  } else {
    const slash = last.lastIndexOf("/");
    prefixDir = slash >= 0 ? last.slice(0, slash + 1) : "";
    const partial = slash >= 0 ? last.slice(slash + 1) : last;
    const node = getNode(ctx.root, resolvePath(state.cwd, prefixDir || "."));
    if (!node || node.type !== "dir") return { input, candidates: [] };
    candidates = listDir(node, partial.startsWith("."))
      .filter((n) => n.startsWith(partial))
      .map((n) => (node.children[n].type === "dir" ? `${n}/` : `${n} `));
  }

  if (candidates.length === 0) return { input, candidates: [] };
  if (candidates.length === 1) return { input: `${head}${prefixDir}${candidates[0]}`, candidates: [] };
  const common = commonPrefix(candidates);
  return { input: `${head}${prefixDir}${common}`, candidates: candidates.map((c) => c.trim()) };
}

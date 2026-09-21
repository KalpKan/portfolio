import type { Line, Span } from "./shell";
import type { Tile } from "./tiles";
import { getNode, type VDir } from "./vfs";

/*
 * `claude` inside the terminal: a FAKE Claude Code session. No network, no
 * API, no key, $0: the replies are scripted from the real registry and
 * played with a typing rhythm by the component. Pure functions; the
 * randomness is injected so tests are deterministic.
 */

export const CLAUDE_MODEL = "claude-kalpos-1";
export const CLAUDE_CWD = "/Users/kalp/kalpos";
export const CLAUDE_COMMANDS = ["/help", "/status", "/exit", "/quit", "/clear", "/cost", "/model"] as const;

/** One step of a reply: lines to print after `delay` ms (300–600, the CLI's rhythm). */
export type Chunk = { lines: Line[]; delay: number };

export interface ClaudeContext {
  tiles: Tile[];
  root: VDir;
  /** 0 ≤ random() < 1; tests pass a seeded one. */
  random?: () => number;
}

export interface ClaudeResult {
  /** Printed immediately (slash commands). */
  lines: Line[];
  /** Played over time (free text). */
  chunks: Chunk[];
  status?: boolean;
  clear?: boolean;
  exit?: boolean;
}

const t = (text: string, tone?: Span["tone"]): Span => ({ text, tone });
const line = (...spans: Span[]): Line => spans;

/** A small deterministic PRNG (mulberry32) for tests and for a seedable default. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function box(rows: string[]): Line[] {
  const width = Math.max(...rows.map((r) => r.length)) + 2;
  const pad = (s: string) => ` ${s}${" ".repeat(width - s.length - 1)}`;
  return [
    line(t(`╭${"─".repeat(width)}╮`, "accent")),
    ...rows.map((r) => line(t("│", "accent"), t(pad(r)), t("│", "accent"))),
    line(t(`╰${"─".repeat(width)}╯`, "accent")),
  ];
}

/** The welcome box printed when `claude` starts. */
export function welcome(): Line[] {
  return [
    ...box(["✻ Welcome to Claude Code!", "", "  /help for help, /status for the health round", "", `  cwd: ${CLAUDE_CWD}`, `  model: ${CLAUDE_MODEL} · fake`]),
    line(t("This session is scripted: no network, no API key, $0. Esc interrupts, /exit leaves.", "dim")),
  ];
}

const HELP: [string, string][] = [
  ["/help", "this list"],
  ["/status", "run the health round (GET /api/status/<slug>)"],
  ["/cost", "what this session has cost"],
  ["/model", "which model this is"],
  ["/clear", "clear the screen"],
  ["/exit, /quit", "back to zsh"],
];

const SHORTCUTS: [string, string][] = [
  ["Enter", "send"],
  ["Esc", "interrupt a reply"],
  ["↑ ↓", "history"],
  ["Tab", "complete a slash command"],
  ["Ctrl+C", "back to zsh"],
];

function padRight(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function tool(call: string, result: string): Line[] {
  return [line(t("⏺ ", "ok"), t(call)), line(t("  ⎿  ", "dim"), t(result, "dim"))];
}

function say(text: string): Line {
  return line(t("⏺ ", "ok"), t(text));
}

function listNames(tiles: Tile[], max = 4): string {
  const names = tiles.map((x) => x.name);
  return names.length > max ? `${names.slice(0, max).join(", ")} and ${names.length - max} more` : names.join(", ");
}

/** The scripted reply to free text, as timed chunks. */
export function reply(ctx: ClaudeContext, input: string): Chunk[] {
  const random = ctx.random ?? Math.random;
  const delay = () => 300 + Math.floor(random() * 300);
  const q = input.toLowerCase();
  const live = ctx.tiles.filter((x) => x.kind === "live");
  const cases = ctx.tiles.filter((x) => x.kind === "case");
  const coming = ctx.tiles.filter((x) => x.kind === "coming");
  const n = ctx.tiles.length;
  const chunk = (lines: Line[]): Chunk => ({ lines, delay: delay() });

  if (/\b(secret|password|passcode|token|api key)\b/.test(q)) {
    return [chunk([say("It's a portfolio — type anything. The lock screen takes any password, and the only secret I know is a dotfile in ~ (try `ls -a` back in zsh).")])];
  }
  if (/\b(who are you|who r u|kalp|about you|yourself)\b/.test(q)) {
    const readme = getNode(ctx.root, "/about/README.md");
    const text = readme?.type === "file" ? readme.content.trimEnd().split("\n") : [];
    const tagline = text.find((l, i) => i > 0 && l.trim() && !l.startsWith("#")) ?? "";
    return [
      chunk(tool("Read(about/README.md)", `Read ${text.length} lines`)),
      chunk([say(`${tagline} That's Kalp. I'm the fake one: a script in his terminal, no model behind me. The real bio is in About me on the desk.`)]),
    ];
  }
  if (/\b(project|projects|portfolio|built|build|made)\b/.test(q)) {
    return [
      chunk(tool("Read(projects.json)", `Read ${n} projects`)),
      chunk([
        say(
          `${n} projects: ${live.length} live (${listNames(live)}), ${cases.length} case ${cases.length === 1 ? "study" : "studies"} (${listNames(cases, 3)})${coming.length ? `, ${coming.length} coming` : ""}. \`open <slug>\` in zsh opens one.`,
        ),
      ]),
    ];
  }
  if (/\b(deploy|ship|shipped|release|push to prod|production)\b/.test(q)) {
    return [chunk(tool("Bash(vercel --prod)", "No pending changes on main.")), chunk([say("Nothing to deploy: every tile with a pulse is on kalpkan.com, on the free tier, at $0 plus the domain.")])];
  }
  if (/\b(bug|bugs|fix|broken|error|crash|issue)\b/.test(q)) {
    return [chunk(tool('Grep("TODO")', "0 results — the humans keep saying that too")), chunk([say("No bugs found, which is what every bug says. If one of the live tiles is grey, `status` in zsh shows which check failed.")])];
  }
  if (/\b(hi|hello|hey|yo|sup)\b/.test(q) && q.length < 20) {
    return [chunk([say("Hi. I'm a scripted Claude in a scripted terminal on a real portfolio. Ask about the projects, a bug, or shipping.")])];
  }

  const pick = ctx.tiles[Math.floor(random() * Math.max(1, n))];
  const canned: string[] = [
    `I checked: ${live.length} of ${n} projects have a health check right now. Ask me about a project.`,
    `Try "what projects are here": I read projects.json faster than the folder opens.`,
    pick ? `${pick.name}: ${pick.tagline} That one is real; I am not.` : "The desk is empty, which is a first.",
    "I cannot run tools here (no network, no key, $0), but I can read the desk.",
    `Fun fact: this shell is ${n} project folders and one dotfile. You have found the second easter egg.`,
    "Kalp builds things that measure something real. I measure nothing; I am a script.",
    "Esc interrupts me, /exit sends me home. Neither is rude.",
    "Ask about a project, a bug, or shipping. Anything else and I improvise, badly.",
  ];
  return [chunk([say(canned[Math.floor(random() * canned.length)])])];
}

/** One line typed at the `> ` prompt: a slash command, `?`, or free text. */
export function claudeLine(ctx: ClaudeContext, input: string): ClaudeResult {
  const trimmed = input.trim();
  const none: ClaudeResult = { lines: [], chunks: [] };
  if (!trimmed) return none;
  if (trimmed === "?") {
    return { ...none, lines: SHORTCUTS.map(([k, v]) => line(t(`  ${padRight(k, 8)}`, "ok"), t(v, "dim"))) };
  }
  if (trimmed.startsWith("/")) {
    const cmd = trimmed.split(/\s+/)[0].toLowerCase();
    switch (cmd) {
      case "/help":
        return { ...none, lines: [line(t("Claude Code (fake) commands:", "dim")), ...HELP.map(([k, v]) => line(t(`  ${padRight(k, 14)}`, "ok"), t(v)))] };
      case "/status":
        return { ...none, status: true };
      case "/exit":
      case "/quit":
        return { ...none, lines: [line(t("Bye!", "dim"))], exit: true };
      case "/clear":
        return { ...none, clear: true };
      case "/cost":
        return { ...none, lines: [line(t("Total cost: $0.00 (it's fake)")), line(t("Total duration: as long as you like", "dim"))] };
      case "/model":
        return { ...none, lines: [line(t(`Model: ${CLAUDE_MODEL}`)), line(t("A script in lib/fake-claude.ts; no API behind it.", "dim"))] };
      default:
        return { ...none, lines: [line(t(`Unknown slash command: ${cmd}. Try /help.`, "err"))] };
    }
  }
  return { ...none, chunks: reply(ctx, trimmed) };
}

/** Tab completion of the slash commands. */
export function completeClaude(input: string): { input: string; candidates: string[] } {
  if (!input.startsWith("/") || /\s/.test(input)) return { input, candidates: [] };
  const matches = CLAUDE_COMMANDS.filter((c) => c.startsWith(input));
  if (matches.length === 0) return { input, candidates: [] };
  if (matches.length === 1) return { input: `${matches[0]} `, candidates: [] };
  let common: string = matches[0];
  for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
  return { input: common, candidates: [...matches] };
}

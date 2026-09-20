import { describe, expect, it } from "vitest";
import { claudeLine, CLAUDE_MODEL, completeClaude, reply, seeded, welcome, type ClaudeContext } from "./fake-claude";
import { INITIAL_STATE, runLine, complete, promptFor, historyFor, type Line, type ShellContext } from "./shell";
import type { Tile } from "./tiles";
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
  tile({ slug: "promptflip", kind: "live", name: "promptflip", tagline: "Two prompts walk in.", href: "https://promptflip.kalpkan.com", external: true, healthUrl: "https://promptflip.kalpkan.com/api/health" }),
  tile({ slug: "plato", kind: "live", name: "Plato", tagline: "Outlines to plans.", href: "https://plato.kalpkan.com", external: true }),
  tile({ slug: "unpark", kind: "case", name: "UnPark", href: "/projects/unpark", showcase: true }),
  tile({ slug: "eeg", kind: "coming", showcase: true }),
];
const root = fixtureVfs();
const ctx: ClaudeContext = { tiles, root, random: seeded(1) };
const text = (lines: Line[]) => lines.map((l) => l.map((s) => s.text).join("")).join("\n");

describe("the welcome box", () => {
  it("is box-drawn with the title, help, cwd and the fake model line", () => {
    const w = text(welcome());
    expect(w).toContain("╭");
    expect(w).toContain("╰");
    expect(w).toContain("✻ Welcome to Claude Code!");
    expect(w).toContain("/help for help");
    expect(w).toContain("cwd: /Users/kalp/kalpos");
    expect(w).toContain(`model: ${CLAUDE_MODEL} · fake`);
    // Every box row is the same width.
    const rows = welcome().slice(0, -1).map((l) => text([l]));
    expect(new Set(rows.map((r) => r.length)).size).toBe(1);
  });
});

describe("slash commands", () => {
  it("/help lists the commands", () => {
    const out = text(claudeLine(ctx, "/help").lines);
    for (const c of ["/help", "/status", "/cost", "/model", "/clear", "/exit"]) expect(out).toContain(c);
  });
  it("/status asks for the health round", () => {
    expect(claudeLine(ctx, "/status")).toMatchObject({ status: true, lines: [], chunks: [] });
  });
  it("/exit and /quit say Bye! and leave", () => {
    expect(claudeLine(ctx, "/exit")).toMatchObject({ exit: true });
    expect(text(claudeLine(ctx, "/quit").lines)).toBe("Bye!");
  });
  it("/clear clears; /cost is $0.00; /model names the fake model", () => {
    expect(claudeLine(ctx, "/clear")).toMatchObject({ clear: true });
    expect(text(claudeLine(ctx, "/cost").lines)).toContain("Total cost: $0.00 (it's fake)");
    expect(text(claudeLine(ctx, "/model").lines)).toContain("claude-kalpos-1");
  });
  it("an unknown slash command is an error; ? shows the shortcuts; empty is nothing", () => {
    expect(text(claudeLine(ctx, "/nope").lines)).toContain("Unknown slash command: /nope");
    expect(text(claudeLine(ctx, "?").lines)).toContain("Esc");
    expect(claudeLine(ctx, "   ")).toEqual({ lines: [], chunks: [] });
  });
});

describe("scripted intents", () => {
  it("'project' reads projects.json and summarises the real registry", () => {
    const chunks = reply(ctx, "what projects are here?");
    expect(chunks.length).toBe(2);
    expect(text(chunks[0].lines)).toBe("⏺ Read(projects.json)\n  ⎿  Read 4 projects");
    expect(text(chunks[1].lines)).toContain("4 projects: 2 live (promptflip, Plato), 1 case study (UnPark), 1 coming");
    for (const c of chunks) {
      expect(c.delay).toBeGreaterThanOrEqual(300);
      expect(c.delay).toBeLessThan(600);
    }
  });
  it("'who are you' reads /about/README.md", () => {
    const chunks = reply(ctx, "who are you?");
    expect(text(chunks[0].lines)).toContain("⏺ Read(about/README.md)");
    expect(text(chunks[1].lines)).toContain("Western University.");
    expect(text(chunks[1].lines)).toContain("fake one");
  });
  it("'deploy' runs the fake vercel; 'bug' greps TODO", () => {
    expect(text(reply(ctx, "deploy it")[0].lines)).toBe("⏺ Bash(vercel --prod)\n  ⎿  Everything on this desk already shipped.");
    expect(text(reply(ctx, "fix the bug")[0].lines)).toBe('⏺ Grep("TODO")\n  ⎿  0 results — the humans keep saying that too');
  });
  it("'secret' is refused politely and never claims to run anything", () => {
    const out = text(reply(ctx, "what is the password")[0].lines);
    expect(out).toContain("It's a portfolio — type anything");
    expect(out).not.toContain("⏺ Bash");
  });
  it("the default reply is deterministic for a seed and references the registry", () => {
    const a = text(reply({ ...ctx, random: seeded(7) }, "tell me a joke")[0].lines);
    const b = text(reply({ ...ctx, random: seeded(7) }, "tell me a joke")[0].lines);
    expect(a).toBe(b);
    expect(a.startsWith("⏺ ")).toBe(true);
    const seen = new Set<string>();
    for (let s = 0; s < 40; s++) seen.add(text(reply({ ...ctx, random: seeded(s) }, "tell me a joke")[0].lines));
    expect(seen.size).toBeGreaterThan(4);
  });
});

describe("the shell's claude mode", () => {
  const sctx: ShellContext = { root, tiles, signals: {}, random: seeded(3) };

  it("`claude` prints the welcome, switches the prompt to > and is the only tracked name", () => {
    const r = runLine(sctx, INITIAL_STATE, "claude");
    expect(r.name).toBe("claude");
    expect(r.state.mode).toBe("claude");
    expect(text(r.lines)).toContain("Welcome to Claude Code!");
    expect(promptFor(r.state)).toBe(">");
    const inside = runLine(sctx, r.state, "what projects?");
    expect(inside.name).toBeNull();
    expect(inside.effects[0]).toMatchObject({ type: "reply" });
    expect(inside.state.mode).toBe("claude");
  });

  it("slash commands map to effects and /exit returns to zsh with its own history", () => {
    let s = runLine(sctx, INITIAL_STATE, "claude").state;
    s = runLine(sctx, s, "/status").state;
    expect(runLine(sctx, s, "/status").effects).toEqual([{ type: "status" }]);
    expect(runLine(sctx, s, "/clear").effects).toEqual([{ type: "clear" }]);
    const out = runLine(sctx, s, "/exit");
    expect(text(out.lines)).toBe("Bye!");
    expect(out.state.mode).toBe("zsh");
    expect(promptFor(out.state)).toBe("kalp@kalpos ~ %");
    expect(historyFor(out.state)).toEqual(["claude"]);
    expect(out.state.claudeHistory).toEqual(["/status", "/exit"]);
    // zsh commands still work afterwards
    expect(text(runLine(sctx, out.state, "pwd").lines)).toBe("/");
  });

  it("Tab completes slash commands in claude mode and nothing else", () => {
    const s = runLine(sctx, INITIAL_STATE, "claude").state;
    expect(complete(sctx, s, "/he")).toEqual({ input: "/help ", candidates: [] });
    expect(complete(sctx, s, "/")).toMatchObject({ candidates: ["/help", "/status", "/exit", "/quit", "/clear", "/cost", "/model"] });
    expect(complete(sctx, s, "/c")).toEqual({ input: "/c", candidates: ["/clear", "/cost"] });
    expect(complete(sctx, s, "ls pro")).toEqual({ input: "ls pro", candidates: [] });
    expect(completeClaude("/exi")).toEqual({ input: "/exit ", candidates: [] });
  });
});

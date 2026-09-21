import { act } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_KEY, readAppearance, _resetAppearanceForTests } from "@/lib/appearance";
import { fire, render, setValue } from "@/test/render";
import type { Tile } from "@/lib/tiles";
import { fixtureVfs } from "@/lib/vfs.fixture";
import TerminalWindow from "./TerminalWindow";

vi.mock("@/lib/track", () => ({ track: vi.fn() }));
import { track } from "@/lib/track";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
beforeEach(() => {
  vi.mocked(track).mockClear();
  localStorage.clear();
  document.documentElement.removeAttribute("data-appearance");
  _resetAppearanceForTests();
});

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
];

async function mount(extra: Partial<React.ComponentProps<typeof TerminalWindow>> = {}) {
  const onOpenCase = vi.fn();
  const onClose = vi.fn();
  const r = render(
    <TerminalWindow tiles={tiles} signals={{ promptflip: "ok" }} onOpenCase={onOpenCase} onClose={onClose} loadRoot={async () => fixtureVfs()} {...extra} />,
  );
  await act(async () => {});
  const input = r.container.querySelector<HTMLInputElement>('input[aria-label="Terminal command"]')!;
  const log = () => r.container.querySelector('[role="log"]')!.textContent!;
  const type = async (cmd: string) => {
    setValue(input, cmd);
    fire(input, "keydown", { key: "Enter" });
    await act(async () => {});
  };
  return { ...r, input, log, type, onOpenCase, onClose };
}

describe("TerminalWindow", () => {
  it("boots with the motd, a real labelled input and a role=log region", async () => {
    const t = await mount();
    expect(t.input.disabled).toBe(false);
    expect(t.log()).toContain("Welcome to KalpOS 1.0 (kalpkan.com)");
    expect(t.container.querySelector(".kos-shell-prompt")!.textContent).toContain("kalp@kalpos ~ %");
    t.unmount();
  });

  it("runs a command, echoes it with the prompt, and tracks the command name only", async () => {
    const t = await mount();
    await t.type("ls projects/unpark");
    expect(t.log()).toContain("kalp@kalpos ~ % ls projects/unpark");
    expect(t.log()).toContain("README.md  case-study.md");
    expect(track).toHaveBeenCalledWith("terminal_command", { name: "ls" });
    expect(vi.mocked(track).mock.calls[0][1]).not.toHaveProperty("args");
    expect(t.input.value).toBe("");
    t.unmount();
  });

  it("cd changes the prompt; cat reads relative to it; unknown commands are zsh errors", async () => {
    const t = await mount();
    await t.type("cd projects");
    expect(t.container.querySelector(".kos-shell-prompt")!.textContent).toContain("kalp@kalpos ~/projects %");
    await t.type("cat promptflip/README.md");
    expect(t.log()).toContain("# promptflip");
    await t.type("frobnicate");
    expect(t.log()).toContain("zsh: command not found: frobnicate");
    expect(t.container.querySelector(".kos-shell-err")!.textContent).toBe("zsh: command not found: frobnicate");
    t.unmount();
  });

  it("↑ and ↓ walk the history", async () => {
    const t = await mount();
    await t.type("pwd");
    await t.type("whoami");
    fire(t.input, "keydown", { key: "ArrowUp" });
    expect(t.input.value).toBe("whoami");
    fire(t.input, "keydown", { key: "ArrowUp" });
    expect(t.input.value).toBe("pwd");
    fire(t.input, "keydown", { key: "ArrowDown" });
    expect(t.input.value).toBe("whoami");
    fire(t.input, "keydown", { key: "ArrowDown" });
    expect(t.input.value).toBe("");
    t.unmount();
  });

  it("Tab completes a path and lists the candidates when ambiguous; the window's focus trap never sees it", async () => {
    const t = await mount();
    // A React handler above the terminal (the Window's focus trap) must not receive the Tab.
    let escaped = false;
    const onTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") escaped = true;
    };
    document.body.addEventListener("keydown", onTab);
    setValue(t.input, "cd pro");
    fire(t.input, "keydown", { key: "Tab" });
    expect(t.input.value).toBe("cd projects/");
    fire(t.input, "keydown", { key: "Tab" });
    expect(t.input.value).toBe("cd projects/");
    expect(t.log()).toContain("eeg/  later/  promptflip/  unpark/");
    expect(escaped).toBe(false);
    document.body.removeEventListener("keydown", onTab);
    t.unmount();
  });

  it("clear wipes the log, Ctrl+L too", async () => {
    const t = await mount();
    await t.type("pwd");
    await t.type("clear");
    expect(t.log()).toBe("");
    await t.type("pwd");
    expect(t.log()).toContain("/");
    fire(t.input, "keydown", { key: "l", ctrlKey: true });
    expect(t.log()).toBe("");
    t.unmount();
  });

  it("exit closes the window", async () => {
    vi.useFakeTimers();
    const t = await mount();
    await t.type("exit");
    expect(t.log()).toContain("logout");
    act(() => {
      vi.runAllTimers();
    });
    expect(t.onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    t.unmount();
  });

  it("reboot prints Restarting… and hands the reboot to the desk after a beat; lock hands over the lock screen", async () => {
    vi.useFakeTimers();
    const onRestart = vi.fn();
    const onLock = vi.fn();
    const t = await mount({ onRestart, onLock });
    await t.type("reboot");
    expect(t.log()).toContain("Restarting…");
    expect(onRestart).not.toHaveBeenCalled();
    act(() => {
      vi.runAllTimers();
    });
    expect(onRestart).toHaveBeenCalledTimes(1);
    await t.type("lock");
    act(() => {
      vi.runAllTimers();
    });
    expect(onLock).toHaveBeenCalledTimes(1);
    expect(t.onClose).not.toHaveBeenCalled();
    vi.useRealTimers();
    t.unmount();
  });

  it("open: a live app goes to a new tab, a case study opens its window", async () => {
    const t = await mount();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await t.type("open promptflip");
    expect(open).toHaveBeenCalledWith("https://promptflip.kalpkan.com", "_blank", "noopener,noreferrer");
    await t.type("open unpark");
    expect(t.onOpenCase).toHaveBeenCalledWith("unpark");
    open.mockRestore();
    t.unmount();
  });

  it("status runs the health round through /api/status/<slug> and prints the tally", async () => {
    const fetcher = vi.fn(async (url: string) => ({ ok: true, json: async () => ({ ok: url.includes("promptflip") }) })) as unknown as typeof fetch;
    const t = await mount({ fetcher });
    await t.type("status");
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledWith("/api/status/promptflip", expect.anything());
    expect(t.log()).toContain("GET /api/status/promptflip → 200 ok");
    expect(t.log()).toContain("1/1 ok");
    expect(t.container.querySelector(".kos-shell-prompt")!.getAttribute("data-busy")).toBeNull();
    t.unmount();
  });

  it("the caret follows the selection", async () => {
    const t = await mount();
    setValue(t.input, "echo hi");
    expect(t.container.querySelector(".kos-shell-mirror")!.textContent).toBe("echo hi ");
    t.input.setSelectionRange(2, 2);
    fire(t.input, "keyup", { key: "ArrowLeft" });
    const mirror = t.container.querySelector(".kos-shell-mirror")!;
    expect(mirror.querySelector(".kos-shell-caret")!.textContent).toBe("h");
    t.unmount();
  });

  describe("the fake Claude session", () => {
    it("`claude` shows the welcome box, the > prompt and the hint; only the command word is tracked", async () => {
      const t = await mount();
      await t.type("claude");
      expect(t.log()).toContain("Welcome to Claude Code!");
      const prompt = t.container.querySelector(".kos-shell-prompt")!;
      expect(prompt.getAttribute("data-mode")).toBe("claude");
      expect(prompt.textContent).toContain(">");
      expect(t.container.querySelector(".kos-shell-hint")!.textContent).toBe("? for shortcuts");
      expect(track).toHaveBeenCalledWith("terminal_command", { name: "claude" });
      vi.mocked(track).mockClear();
      await t.type("/cost");
      expect(t.log()).toContain("Total cost: $0.00");
      expect(track).not.toHaveBeenCalled();
      t.unmount();
    });

    it("free text plays a reply chunk by chunk with the CLI rhythm; Esc interrupts it", async () => {
      vi.useFakeTimers();
      const t = await mount();
      await t.type("claude");
      await t.type("what projects are here");
      expect(t.log()).not.toContain("Read(projects.json)");
      expect(t.container.querySelector(".kos-shell-hint")!.textContent).toBe("esc to interrupt");
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(t.log()).toContain("⏺ Read(projects.json)");
      expect(t.log()).toContain("⎿  Read 2 projects");
      expect(t.log()).not.toContain("2 projects:");
      // Esc while the second chunk is pending: interrupted, and the window must not close.
      let escaped = false;
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") escaped = true;
      };
      document.body.addEventListener("keydown", onEsc);
      fire(t.input, "keydown", { key: "Escape" });
      document.body.removeEventListener("keydown", onEsc);
      expect(escaped).toBe(false);
      expect(t.log()).toContain("Interrupted");
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(t.log()).not.toContain("2 projects:");
      // Idle Esc goes through to the window (it closes it).
      let idle = false;
      const onIdle = (e: KeyboardEvent) => {
        if (e.key === "Escape") idle = true;
      };
      document.body.addEventListener("keydown", onIdle);
      fire(t.input, "keydown", { key: "Escape" });
      document.body.removeEventListener("keydown", onIdle);
      expect(idle).toBe(true);
      vi.useRealTimers();
      t.unmount();
    });

    it("/exit and Ctrl+C return to zsh", async () => {
      const t = await mount();
      await t.type("claude");
      await t.type("/exit");
      expect(t.log()).toContain("Bye!");
      expect(t.container.querySelector(".kos-shell-prompt")!.getAttribute("data-mode")).toBe("zsh");
      expect(t.container.querySelector(".kos-shell-hint")).toBeNull();
      await t.type("claude");
      fire(t.input, "keydown", { key: "c", ctrlKey: true });
      expect(t.container.querySelector(".kos-shell-prompt")!.getAttribute("data-mode")).toBe("zsh");
      await t.type("pwd");
      expect(t.log()).toContain("kalp@kalpos ~ % pwd");
      t.unmount();
    });
  });

  it("`theme` reports the appearance and `theme dark` changes it for real", async () => {
    const t = await mount();
    await t.type("theme");
    expect(t.log()).toContain("appearance  light");
    expect(t.log()).toContain("usage: theme light | dark | auto");

    await t.type("theme dark");
    expect(readAppearance()).toBe("dark");
    expect(localStorage.getItem(APPEARANCE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute("data-appearance")).toBe("dark");

    // And a bare `theme` now reports the new one, read from the same store.
    await t.type("theme");
    expect(t.log()).toContain("appearance  dark");

    await t.type("theme nope");
    expect(t.log()).toContain("theme: nope: expected light, dark, auto");
    expect(readAppearance()).toBe("dark");
    t.unmount();
  });
});

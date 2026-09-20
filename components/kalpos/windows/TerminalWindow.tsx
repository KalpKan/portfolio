"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { complete, INITIAL_STATE, promptFor, runLine, type Effect, type Line, type ShellState } from "@/lib/shell";
import { hasCheck, runHealthChecks, type Signal } from "@/lib/signal";
import type { Tile } from "@/lib/tiles";
import { track } from "@/lib/track";
import { getNode, type VDir } from "@/lib/vfs";

/*
 * The Terminal window: an interactive shell over a read-only filesystem
 * built from the registry (lib/vfs.ts, lib/shell.ts). This component only
 * renders and performs the shell's effects; every command is a pure
 * function, tested in lib/shell.test.ts.
 *
 * Accessibility: the prompt is a real <input> with a label, the output is a
 * role="log" region (screen readers announce new lines), the scroll pins to
 * the bottom, and a click anywhere on the surface focuses the input. The
 * block caret is drawn (the native caret is hidden) and follows the input's
 * selection, so ← → still work.
 */

type Row = { id: number; spans: Line };

let nextId = 1;
const row = (spans: Line): Row => ({ id: nextId++, spans });

export type TerminalWindowProps = {
  tiles: Tile[];
  signals: Record<string, Signal>;
  /** `open <slug>` on a case study opens its window on the desk (or its sheet on a phone). */
  onOpenCase: (slug: string) => void;
  /** `exit` closes the window. */
  onClose: () => void;
  /** Injected in tests; defaults to the lazy import of the real data. */
  loadRoot?: () => Promise<VDir>;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
};

const defaultLoad = () => import("@/lib/vfs-data").then((m) => m.buildKalpVfs());

export default function TerminalWindow({ tiles, signals, onOpenCase, onClose, loadRoot = defaultLoad, fetcher }: TerminalWindowProps) {
  const [root, setRoot] = useState<VDir | null>(null);
  const [shell, setShell] = useState<ShellState>(INITIAL_STATE);
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [caret, setCaret] = useState(0);
  const [busy, setBusy] = useState(false);
  const histIdx = useRef<number | null>(null);
  const draft = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelStatus = useRef<(() => void) | null>(null);

  const append = useCallback((lines: Line[]) => {
    if (lines.length) setRows((r) => [...r, ...lines.map(row)]);
  }, []);

  // Boot: build the filesystem (code-split), print the motd, take focus.
  useEffect(() => {
    let alive = true;
    loadRoot().then((r) => {
      if (!alive) return;
      setRoot(r);
      const motd = getNode(r, "/etc/motd");
      const lines: Line[] = [[{ text: `Last login: ${new Date().toDateString()} on ttys000`, tone: "dim" }]];
      if (motd?.type === "file") for (const l of motd.content.trimEnd().split("\n")) lines.push([{ text: l }]);
      append(lines);
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => {
      alive = false;
      cancelStatus.current?.();
    };
  }, [loadRoot, append]);

  // Pin the scroll to the newest line.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows, input]);

  const runStatus = useCallback(() => {
    const checked = tiles.filter(hasCheck);
    if (checked.length === 0) {
      append([[{ text: "No live app has a health url.", tone: "dim" }]]);
      return;
    }
    setBusy(true);
    let done = 0;
    let ok = 0;
    cancelStatus.current?.();
    cancelStatus.current = runHealthChecks(
      checked,
      (slug, sig) => {
        done += 1;
        if (sig === "ok") ok += 1;
        append([
          [
            { text: "GET ", tone: "dim" },
            { text: `/api/status/${slug}` },
            { text: " → " },
            sig === "ok" ? { text: "200 ok", tone: "ok" } : { text: "no signal", tone: "err" },
          ],
        ]);
        if (done === checked.length) {
          append([[{ text: `${ok}/${checked.length} ok`, tone: ok === checked.length ? "ok" : "err" }]]);
          setBusy(false);
          cancelStatus.current = null;
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
        }
      },
      fetcher ? { fetcher } : {},
    );
  }, [tiles, append, fetcher]);

  const perform = useCallback(
    (effects: Effect[]) => {
      for (const e of effects) {
        switch (e.type) {
          case "clear":
            setRows([]);
            break;
          case "exit":
            setTimeout(onClose, 120);
            break;
          case "open":
            if (e.external) window.open(e.href, "_blank", "noopener,noreferrer");
            else onOpenCase(e.slug);
            break;
          case "status":
            runStatus();
            break;
        }
      }
    },
    [onClose, onOpenCase, runStatus],
  );

  const submit = useCallback(() => {
    if (!root || busy) return;
    const prompt = promptFor(shell);
    const result = runLine({ root, tiles, signals }, shell, input);
    const echo: Line = [{ text: `${prompt} `, tone: "dim" }, { text: input }];
    // `clear` wipes the log including the echoed command line.
    if (result.effects.some((e) => e.type === "clear")) setRows([]);
    else append([echo, ...result.lines]);
    setShell(result.state);
    setInput("");
    setCaret(0);
    histIdx.current = null;
    draft.current = "";
    if (result.name) track("terminal_command", { name: result.name });
    perform(result.effects);
  }, [root, busy, shell, tiles, signals, input, append, perform]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = shell.history;
      if (h.length === 0) return;
      let idx = histIdx.current;
      if (e.key === "ArrowUp") {
        if (idx === null) {
          draft.current = input;
          idx = h.length - 1;
        } else if (idx > 0) idx -= 1;
      } else if (idx !== null) idx = idx + 1 >= h.length ? null : idx + 1;
      histIdx.current = idx;
      const next = idx === null ? draft.current : h[idx];
      setInput(next);
      setCaret(next.length);
      requestAnimationFrame(() => el.setSelectionRange(next.length, next.length));
    } else if (e.key === "Tab") {
      // Completion, not focus travel: the window's focus trap must not see this Tab.
      e.preventDefault();
      e.stopPropagation();
      if (!root) return;
      const c = complete({ root, tiles, signals }, shell, input);
      setInput(c.input);
      setCaret(c.input.length);
      if (c.candidates.length > 1) {
        const line: Line = [];
        c.candidates.forEach((n, i) => {
          line.push({ text: n, tone: n.endsWith("/") ? "dir" : undefined });
          if (i < c.candidates.length - 1) line.push({ text: "  " });
        });
        append([[{ text: `${promptFor(shell)} `, tone: "dim" }, { text: input }], line]);
      }
      requestAnimationFrame(() => el.setSelectionRange(c.input.length, c.input.length));
    } else if (e.key === "Escape") {
      // The window's own Esc closes it; let it through.
    } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      setRows([]);
    } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      cancelStatus.current?.();
      cancelStatus.current = null;
      setBusy(false);
      append([[{ text: `${promptFor(shell)} `, tone: "dim" }, { text: `${input}^C` }]]);
      setInput("");
      setCaret(0);
    } else if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
      setInput("");
      setCaret(0);
    }
  };

  const syncCaret = (el: HTMLInputElement) => setCaret(el.selectionStart ?? el.value.length);
  const prompt = promptFor(shell);

  return (
    <div
      className="kos-shell"
      ref={scrollRef}
      onMouseUp={() => {
        // A click on the surface (not a text selection) hands focus to the prompt.
        if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <div className="kos-shell-log" role="log" aria-live="polite" aria-label="Terminal output">
        {rows.map((r) => (
          <div key={r.id} className="kos-shell-line">
            {r.spans.map((s, i) => (
              <span key={i} className={s.tone ? `kos-shell-${s.tone}` : undefined}>
                {s.text}
              </span>
            ))}
          </div>
        ))}
      </div>
      <label className="kos-shell-prompt" data-busy={busy ? "true" : undefined}>
        <span className="kos-shell-dim">{prompt} </span>
        <span className="kos-shell-field">
          <span className="kos-shell-mirror" aria-hidden>
            {input.slice(0, caret)}
            <i className="kos-shell-caret">{input[caret] ?? " "}</i>
            {input.slice(caret + 1)}
          </span>
          <input
            ref={inputRef}
            type="text"
            aria-label="Terminal command"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            value={input}
            disabled={!root}
            onChange={(e) => {
              setInput(e.target.value);
              histIdx.current = null;
              syncCaret(e.target);
            }}
            onKeyDown={onKeyDown}
            onKeyUp={(e) => syncCaret(e.currentTarget)}
            onSelect={(e) => syncCaret(e.currentTarget)}
            onClick={(e) => syncCaret(e.currentTarget)}
          />
        </span>
      </label>
    </div>
  );
}

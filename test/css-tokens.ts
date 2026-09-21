import { readFileSync } from "node:fs";
import { join } from "node:path";

/** vitest runs from the repo root (vitest.config.ts lives there). */

/*
 * A very small CSS reader for the appearance tests (T6.10).
 *
 * jsdom does not apply stylesheets, so a rendered component snapshot cannot
 * show what a surface is actually painted. What *can* be checked exactly is
 * the thing the appearance is made of: the token table in app/globals.css and
 * the declarations in app/kalpos.css that reference it. This module reads
 * both, resolves `var()` and `light-dark()` for a chosen appearance, and
 * gives the tests a real colour to measure.
 *
 * It is deliberately not a CSS parser: it understands exactly the subset the
 * hub's stylesheets use (flat rules, @media / @supports blocks, custom
 * properties, var() with an optional fallback, light-dark(), hex and rgb/a).
 */

const ROOT = process.cwd();

export function css(file: string): string {
  return readFileSync(join(ROOT, file), "utf8");
}

/** Split `a, b` at top level, so rgba(1, 2, 3) counts as one argument. */
export function splitTop(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      parts.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(input.slice(start).trim());
  return parts;
}

export type Rule = { selector: string; body: string; at: string[] };

/** Every rule in the sheet, with the @-blocks it sits inside. */
export function rules(source: string): Rule[] {
  const out: Rule[] = [];
  const walk = (text: string, at: string[]) => {
    let depth = 0;
    let preludeStart = 0;
    let bodyStart = -1;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === "{") {
        if (depth === 0) bodyStart = i;
        depth++;
      } else if (c === ";" && depth === 0) {
        // A top-level statement (@import, @charset): not a rule's prelude.
        preludeStart = i + 1;
      } else if (c === "}") {
        depth--;
        if (depth === 0) {
          const prelude = text.slice(preludeStart, bodyStart).trim();
          const body = text.slice(bodyStart + 1, i);
          if (prelude.startsWith("@")) walk(body, [...at, prelude]);
          else if (prelude) out.push({ selector: prelude, body, at });
          preludeStart = i + 1;
        }
      }
    }
  };
  walk(stripComments(source), []);
  return out;
}

export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** The declarations of a rule body, last one winning, in source order. */
export function declarations(body: string): [string, string][] {
  const out: [string, string][] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === ";" && depth === 0) {
      push(body.slice(start, i));
      start = i + 1;
    }
  }
  push(body.slice(start));
  function push(chunk: string) {
    const text = chunk.trim();
    if (!text) return;
    const colon = text.indexOf(":");
    if (colon < 0) return;
    out.push([text.slice(0, colon).trim(), text.slice(colon + 1).trim()]);
  }
  return out;
}

export type Appearance = "light" | "dark";

export interface Tokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * The token table: every custom property declared on a plain `:root` in
 * globals.css, in both appearances. A later declaration of the same name
 * wins, which is how the `--x: <light>; --x: light-dark(<light>, <dark>);`
 * fallback pair is meant to read.
 */
export function tokens(source: string): Tokens {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (const rule of rules(source)) {
    if (rule.at.length || rule.selector !== ":root") continue;
    for (const [name, value] of declarations(rule.body)) {
      if (!name.startsWith("--")) continue;
      const pair = matchLightDark(value);
      if (pair) {
        light[name] = pair[0];
        dark[name] = pair[1];
      } else {
        light[name] = value;
        dark[name] = value;
      }
    }
  }
  return { light, dark };
}

function matchLightDark(value: string): [string, string] | null {
  const m = /^light-dark\(([\s\S]*)\)$/.exec(value.trim());
  if (!m) return null;
  const args = splitTop(m[1]);
  if (args.length !== 2) throw new Error(`light-dark() needs exactly two arguments: ${value}`);
  return [args[0], args[1]];
}

/** Resolve every var() (and any light-dark() inside one) for one appearance. */
export function resolve(value: string, table: Tokens, mode: Appearance, depth = 0): string {
  if (depth > 12) throw new Error(`var() cycle resolving ${value}`);
  const map = table[mode];
  let out = "";
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf("var(", i);
    if (at < 0) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    let depthP = 0;
    let end = at;
    for (; end < value.length; end++) {
      if (value[end] === "(") depthP++;
      else if (value[end] === ")") {
        depthP--;
        if (depthP === 0) break;
      }
    }
    const args = splitTop(value.slice(at + 4, end));
    const name = args[0].trim();
    const fallback = args.slice(1).join(", ");
    const found = map[name];
    if (found === undefined && !fallback) throw new Error(`unknown token ${name}`);
    out += resolve(found ?? fallback, table, mode, depth + 1);
    i = end + 1;
  }
  const pair = matchLightDark(out);
  return pair ? pair[mode === "dark" ? 1 : 0] : out;
}

/** The declarations of the first rule with exactly this selector. */
export function ruleFor(source: string, selector: string): Record<string, string> {
  const found = rules(source).filter((r) => !r.at.length && r.selector === selector);
  if (!found.length) throw new Error(`no rule for ${selector}`);
  const out: Record<string, string> = {};
  for (const r of found) for (const [k, v] of declarations(r.body)) out[k] = v.replace(/\s+/g, " ");
  return out;
}

/* ------------------------------------------------------------- colour ---- */

export type RGBA = { r: number; g: number; b: number; a: number };

export function parseColor(input: string): RGBA {
  const value = input.trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
    const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
  }
  m = /^rgba?\(([^)]*)\)$/i.exec(value);
  if (m) {
    const parts = m[1].split(/[,/]/).map((p) => parseFloat(p.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  throw new Error(`cannot parse colour: ${input}`);
}

/** `over` a background, so a translucent surface is measured as it is seen. */
export function flatten(color: RGBA, over: RGBA): RGBA {
  const a = color.a;
  return {
    r: color.r * a + over.r * (1 - a),
    g: color.g * a + over.g * (1 - a),
    b: color.b * a + over.b * (1 - a),
    a: 1,
  };
}

export function luminance({ r, g, b }: RGBA): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG 2.1 contrast ratio, rounded to two decimals. */
export function contrast(fg: RGBA, bg: RGBA): number {
  const f = luminance(fg.a < 1 ? flatten(fg, bg) : fg);
  const b = luminance(bg);
  const ratio = (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
  return Math.round(ratio * 100) / 100;
}

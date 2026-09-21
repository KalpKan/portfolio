import { describe, expect, it } from "vitest";
import { contrast, css, declarations, flatten, parseColor, resolve, ruleFor, rules, stripComments, tokens, type Appearance } from "@/test/css-tokens";

/*
 * The appearance system as it is actually painted (T6.10).
 *
 * jsdom applies no stylesheets, so a rendered-HTML snapshot of a component
 * says nothing about whether the dark desk exists. These tests read the real
 * CSS instead: they resolve every token for both appearances, snapshot what
 * each key surface of KalpOS resolves to, and measure the contrast of the
 * text that sits on it. A change to either appearance shows up as a snapshot
 * diff with the old and the new colour side by side.
 */

const GLOBALS = css("app/globals.css");
const KALPOS = css("app/kalpos.css");
const EXTRAS = css("app/kalpos-extras.css");
const TOKENS = tokens(GLOBALS);

const px = (value: string, mode: Appearance) => resolve(value, TOKENS, mode);
const colorOf = (value: string, mode: Appearance) => parseColor(px(value, mode));

/** The ground a floating surface is seen against, per appearance. */
const GROUND = { light: colorOf("var(--paper)", "light"), dark: colorOf("var(--paper)", "dark") };

describe("the three selectors that choose an appearance", () => {
  const roots = rules(GLOBALS).filter((r) => r.selector.includes(":root") && r.body.includes("color-scheme"));

  it("light is the default, dark is [data-appearance=\"dark\"], and auto follows prefers-color-scheme", () => {
    const one = (text: string) => text.replace(/\s+/g, " ").trim();
    const flat = roots.filter((r) => !r.at.length).map((r) => `${one(r.selector)} -> ${one(r.body)}`);
    expect(flat).toEqual([
      ":root -> color-scheme: light;",
      ':root[data-appearance="light"] -> color-scheme: light;',
      ':root[data-appearance="dark"] -> color-scheme: dark;',
    ]);

    const media = roots.filter((r) => r.at.length);
    expect(media).toHaveLength(1);
    expect(media[0].at).toEqual(["@media (prefers-color-scheme: dark)"]);
    // Auto, plus the no-JavaScript visitor for whom no attribute was written.
    expect(one(media[0].selector)).toBe(':root[data-appearance="auto"], :root:not([data-appearance])');
    expect(one(media[0].body)).toBe("color-scheme: dark;");
  });

  it("every token is one declaration with its light value as the no-light-dark() fallback", () => {
    const pairs = [...stripComments(GLOBALS).matchAll(/(--[\w-]+):\s*light-dark\(/g)].map((m) => m[1]);
    for (const name of new Set(pairs)) {
      const plain = new RegExp(`${name}:\\s*(?!light-dark)`).test(stripComments(GLOBALS));
      expect(plain, `${name} has no plain light fallback before its light-dark() pair`).toBe(true);
    }
    // Every pair differs: a token whose two halves are equal should not be a pair.
    for (const name of new Set(pairs)) {
      expect(TOKENS.light[name], `${name} is a light-dark() pair with two identical halves`).not.toBe(TOKENS.dark[name]);
    }
  });
});

describe("no component carries its own colour any more", () => {
  /*
   * The exceptions are deliberate and listed here so that adding one is a
   * decision rather than an accident: the power / boot / lock / restart
   * layers are black in both appearances, the Terminal is its own dark
   * surface, and the drawn icons (Trash steel, the envelope, the generated
   * album art) are objects whose shading is part of the drawing.
   */
  const ALLOWED_KALPOS = [
    ".kos", // the black under everything
    ".kos-restart",
    ".kos-alert-mark",
    ".kos-power",
    ".kos-boot",
    ".kos-lock",
    ".kos-pw",
    ".kos-clock",
    ".kos-user",
    ".kos-caps",
    ".kos-hint",
    ".kos-folder--",
    ".kos-dock-item--finder",
    ".kos-dock-item--mail",
    ".kos-dock-item--music",
    ".kos-dock-item--photos",
    ".kos-dock-item--terminal",
    "@keyframes",
  ];
  const ALLOWED_EXTRAS = [".kos-app--terminal", ".kos-shell", ".kos-cover", ".kos-mail", "@keyframes"];

  const hex = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;

  const offenders = (source: string, allowed: string[]) =>
    rules(source)
      .filter((r) => hex.test(r.body))
      .filter((r) => !allowed.some((a) => r.selector.includes(a) || r.at.some((x) => x.includes(a))))
      .map((r) => r.selector);

  it("app/kalpos.css", () => {
    expect(offenders(KALPOS, ALLOWED_KALPOS)).toEqual([]);
  });

  it("app/kalpos-extras.css", () => {
    expect(offenders(EXTRAS, ALLOWED_EXTRAS)).toEqual([]);
  });
});

/*
 * The dark desk, surface by surface. Each entry names the rule and the
 * properties that carry its appearance; the snapshot holds what they resolve
 * to in both, so a change to either one is visible in the diff.
 */
const SURFACES: [string, string, string[]][] = [
  ["desk ground", ".kos-desk", ["background"]],
  ["dot grid", ".kos-dots", ["background-image"]],
  ["desk sheen", ".kos-sheen", ["background"]],
  ["menubar", ".kos-menubar", ["background", "border-bottom", "box-shadow", "color"]],
  ["KalpOS menu", ".kos-menu", ["background", "border", "box-shadow"]],
  ["Appearance submenu", ".kos-submenu", ["background", "border", "box-shadow"]],
  ["dock", ".kos-dock", ["background", "border", "box-shadow"]],
  ["dock hover label", ".kos-dock-label", ["background", "border", "box-shadow", "color"]],
  ["window (unfocused)", ".kos-window", ["background", "box-shadow"]],
  ["window (focused)", '.kos-window[data-focused="true"]', ["background", "box-shadow"]],
  ["window sidebar", ".kos-sidebar", ["background", "border-right"]],
  ["NOTE widget", ".kos-note", ["background", "color", "box-shadow"]],
  ["photo frame", ".kos-photo", ["background", "box-shadow"]],
  ["NOW PLAYING widget", ".kos-now", ["background", "border", "box-shadow"]],
  ["About document icon", ".kos-doc", ["background", "box-shadow"]],
  ["project tile art (live)", ".kos-tile-art--live", ["background", "box-shadow"]],
  ["project tile art (grey)", ".kos-tile-art--grey", ["background", "box-shadow"]],
  ["project tile art (coming)", ".kos-tile-art--coming", ["border"]],
  ["Quick Look panel", ".kos-ql", ["background", "border-left", "color"]],
  ["confirm sheet", ".kos-alert", ["background", "box-shadow", "color"]],
  ["phone desk", ".kos-phone", ["background"]],
  ["phone sheet", ".kos-sheet", ["background", "border-top", "box-shadow"]],
];

describe("what each surface is painted, in both appearances", () => {
  it("resolves to these colours", () => {
    const sheet = (selector: string) => {
      try {
        return ruleFor(KALPOS, selector);
      } catch {
        return ruleFor(EXTRAS, selector);
      }
    };
    const lines: string[] = [];
    for (const [label, selector, props] of SURFACES) {
      const decls = sheet(selector);
      lines.push(`${label}  (${selector})`);
      for (const prop of props) {
        const raw = decls[prop];
        expect(raw, `${selector} has no ${prop}`).toBeDefined();
        lines.push(`  ${prop.padEnd(14)} light  ${px(raw, "light")}`);
        lines.push(`  ${" ".repeat(14)} dark   ${px(raw, "dark")}`);
      }
      lines.push("");
    }
    expect(lines.join("\n")).toMatchSnapshot();
  });
});

/*
 * Contrast, measured rather than asserted by eye. Each pair is text (or a
 * mark that carries meaning) over the surface it actually sits on, after
 * that surface has been flattened onto the ground it floats over, so a
 * frosted bar is measured as it is seen.
 *
 * Two bars, because the two appearances start from different places: `light`
 * is the value the mock already shipped and must not regress, and `dark` is
 * held to AA (4.5:1 for text, 3:1 for a mark or a fill) on its own merit.
 * The one place light is below AA is --ink-3, the 10.5–12 px meta the mock
 * specified at #8a8686; dark does not inherit that and is 4.89:1.
 */
const PAIRS: [string, string, string, number, number][] = [
  ["desk label on the desk", "var(--ink)", "var(--paper)", 4.5, 4.5],
  ["menubar label on the menubar frost", "var(--ink)", "var(--frost)", 4.5, 4.5],
  ["dock hover label on its plate", "var(--ink)", "var(--frost-plate)", 4.5, 4.5],
  ["menu row on the menu frost", "var(--ink)", "var(--frost-dock)", 4.5, 4.5],
  ["window body on a focused window", "var(--ink)", "var(--paper-raised)", 4.5, 4.5],
  ["case-study prose on a focused window", "var(--ink-2)", "var(--paper-raised)", 4.5, 4.5],
  ["meta on a focused window (--ink-3)", "var(--ink-3)", "var(--paper-raised)", 3, 4.5],
  ["sidebar label on the sidebar frost", "var(--ink)", "var(--frost-sidebar)", 4.5, 4.5],
  ["Quick Look text on its frost", "var(--ink)", "var(--frost-sidebar-strong)", 4.5, 4.5],
  ["note text on the NOTE widget", "var(--note-ink)", "var(--note)", 4.5, 4.5],
  ["ink on a card (document, photo frame)", "var(--ink)", "var(--card)", 4.5, 4.5],
  ["photo caption on a card", "var(--ink-2)", "var(--card)", 4.5, 4.5],
  ["ink on a pad button", "var(--ink)", "var(--pad)", 4.5, 4.5],
  ["dock label ink on its plate", "var(--ink-2)", "var(--plate)", 4.5, 4.5],
  ["link inside a window", "var(--teal)", "var(--paper-raised)", 4.5, 4.5],
  ["link hover inside a window", "var(--link-hover)", "var(--paper-raised)", 4.5, 4.5],
  ["'Live signal' under a tile", "var(--teal)", "var(--paper-raised)", 4.5, 4.5],
  ["the Music dock tile's note on its card", "var(--magenta-on-card)", "var(--card)", 4.5, 4.5],
  ["white on the Music (magenta) tile", "var(--on-accent)", "var(--magenta)", 4.5, 4.5],
  ["white on a live (cyan) tile", "var(--on-accent)", "var(--cyan)", 3, 3],
  ["a cyan tile against the desk", "var(--cyan)", "var(--paper)", 3, 3],
  ["the focus ring against the desk", "var(--ring)", "var(--paper)", 3, 3],
  ["the focus ring against a window", "var(--ring)", "var(--paper-raised)", 3, 3],
  ["the ▲ case-study mark on a grey tile", "var(--mark)", "var(--pad)", 3, 3],
  ["the ○ checking mark on a grey tile", "var(--mark-quiet)", "var(--pad)", 2, 3],
  ["the dashed 'coming' outline on a window", "var(--quiet)", "var(--paper-raised)", 1.5, 1.5],
  ["a hairline rule on a focused window", "var(--rule)", "var(--paper-raised)", 1.2, 1.2],
];

describe("contrast in both appearances", () => {
  it("meets the bar for every pair, and the measured table is recorded", () => {
    const lines = ["pair".padEnd(42) + "light   dark    bar (light / dark)"];
    for (const [label, fg, bg, minLight, minDark] of PAIRS) {
      const seen: Record<Appearance, number> = { light: 0, dark: 0 };
      for (const mode of ["light", "dark"] as Appearance[]) {
        const surface = colorOf(bg, mode);
        seen[mode] = contrast(colorOf(fg, mode), surface.a < 1 ? flatten(surface, GROUND[mode]) : surface);
      }
      expect(seen.light, `${label} in light`).toBeGreaterThanOrEqual(minLight);
      expect(seen.dark, `${label} in dark`).toBeGreaterThanOrEqual(minDark);
      lines.push(label.padEnd(42) + `${seen.light.toFixed(2).padEnd(8)}${seen.dark.toFixed(2).padEnd(8)}${minLight} / ${minDark}`);
    }
    expect(lines.join("\n")).toMatchSnapshot();
  });

  it("every piece of *text* clears AA in dark, with no exception", () => {
    const text = PAIRS.filter(([, , , , minDark]) => minDark >= 4.5);
    expect(text.length).toBeGreaterThanOrEqual(18);
    for (const [label, fg, bg] of text) {
      const surface = colorOf(bg, "dark");
      const ratio = contrast(colorOf(fg, "dark"), surface.a < 1 ? flatten(surface, GROUND.dark) : surface);
      expect(ratio, label).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the dark desk keeps the shape of the light one", () => {
  it("the dot grid is the same 22 px pitch, only the alpha moves", () => {
    const dots = ruleFor(KALPOS, ".kos-dots");
    expect(dots["background-size"]).toBe("22px 22px");
    expect(parseColor(px("var(--dot)", "light")).a).toBeCloseTo(0.18, 3);
    expect(parseColor(px("var(--dot)", "dark")).a).toBeLessThan(0.12);
  });

  it("the frost keeps its blur and saturation in both", () => {
    for (const [selector, blur] of [
      [".kos-menubar", "blur(20px) saturate(1.4)"],
      [".kos-dock", "blur(24px) saturate(1.4)"],
      [".kos-menu", "blur(24px) saturate(1.4)"],
      [".kos-sidebar", "blur(20px)"],
    ] as [string, string][]) {
      expect(ruleFor(KALPOS, selector)["backdrop-filter"]).toBe(blur);
    }
  });

  it("radii are untouched: dark only changes colour", () => {
    expect(ruleFor(KALPOS, ".kos-window")["border-radius"]).toBe("12px");
    expect(ruleFor(KALPOS, ".kos-note")["border-radius"]).toBe("18px");
    expect(ruleFor(KALPOS, ".kos-dock")["border-radius"]).toBe("22px");
    expect(ruleFor(KALPOS, ".kos-menu")["border-radius"]).toBe("12px");
  });

  it("the shadows are retuned rather than reused: dark is black and deeper", () => {
    for (const name of ["--c-sh-sm", "--c-sh-md", "--c-sh-lg", "--c-sh-dock"]) {
      const light = parseColor(px(`var(${name})`, "light"));
      const dark = parseColor(px(`var(${name})`, "dark"));
      expect([dark.r, dark.g, dark.b]).toEqual([0, 0, 0]);
      expect(dark.a).toBeGreaterThan(light.a * 2);
    }
  });

  it("the boot, the lock and the power screen are black in both: they hold no token", () => {
    for (const selector of [".kos-boot", ".kos-lock", ".kos-power"]) {
      const found = rules(KALPOS).filter((r) => r.selector === selector);
      expect(found.length, selector).toBeGreaterThan(0);
      for (const r of found) expect(r.body).not.toContain("var(--paper");
    }
  });
});

/*
 * Found on the live site the day dark mode shipped, and the reason this test
 * exists: `.kos-window` transitioned the `background` SHORTHAND. Chrome does
 * not re-resolve a shorthand transition when only an underlying custom
 * property changes, so a window that was already open when the appearance
 * was switched kept its light background for ever — `--paper-raised`
 * computed to #2a2a2e on the element while its background-color stayed
 * rgb(248,244,244), and clearing the transition snapped it to the right
 * colour. Colours now change with no class or attribute change on the
 * element, so the shorthand must never be transitioned again.
 *
 * T6.12a (2026-09-21): narrowing to the `background-color` LONGHAND was not
 * enough either — the same live defect persisted on `.kos-window`,
 * `.kos-light`, `.kos-transport button` and `.kos-track`, because the bug is
 * about a custom property changing under a persistent transition, not about
 * the shorthand specifically. The proven fix is to drop `background-color`
 * from those four selectors' persistent `transition` lists entirely (other
 * transitioned properties, e.g. `box-shadow`/`transform`, are unaffected and
 * kept); the appearance switch itself still cross-fades every colour via the
 * temporary `.kos-appearance-shift` class below, so nothing is lost except an
 * instant-instead-of-eased colour change on hover/focus/current-row.
 */
describe("nothing transitions the `background` shorthand", () => {
  /*
   * The lock screen is the one place the shorthand is still allowed: it is
   * black in both appearances, so none of its colours can change under an
   * element and nothing can be pinned. Leaving it alone also keeps the brief's
   * "boot / lock / power unchanged" literally true.
   */
  const EXEMPT = [".kos-pw"];

  for (const [name, source] of [
    ["app/kalpos.css", KALPOS],
    ["app/kalpos-extras.css", EXTRAS],
    ["app/globals.css", GLOBALS],
  ] as [string, string][]) {
    it(name, () => {
      const offenders = rules(source)
        .filter((r) => !EXEMPT.some((e) => r.selector.includes(e)))
        .filter((r) => /transition(-property)?\s*:/.test(r.body))
        .filter((r) =>
          declarations(r.body).some(
            ([prop, value]) =>
              (prop === "transition" || prop === "transition-property") &&
              value.split(",").some((part) => /(^|\s)background(\s|$)/.test(part.trim())),
          ),
        )
        .map((r) => r.selector.replace(/\s+/g, " "));
      expect(offenders).toEqual([]);
    });
  }

  it("the window still cross-fades its shadow on focus, but not a persistent background-color (T6.12a)", () => {
    const win = ruleFor(KALPOS, ".kos-window");
    expect(win.transition).toContain("box-shadow 180ms ease");
    expect(win.transition).not.toMatch(/background-color/);
  });

  /*
   * T6.12a: the live "already-open window keeps its old background" defect
   * also hit these three selectors. None of them may carry a persistent
   * `background-color` transition any more; `.kos-transport button` keeps its
   * `transform` transition and `.kos-light`/`.kos-track` are left with none.
   */
  it("no persistent background-color transition on .kos-light, .kos-transport button, or .kos-track (T6.12a)", () => {
    const light = ruleFor(KALPOS, ".kos-light");
    expect(light.transition ?? "").not.toMatch(/background-color/);

    const transport = ruleFor(EXTRAS, ".kos-transport button");
    expect(transport.transition ?? "").not.toMatch(/background-color/);
    expect(transport.transition).toContain("transform 160ms");

    const track = ruleFor(EXTRAS, ".kos-track");
    expect(track.transition ?? "").not.toMatch(/background-color/);
  });
});

describe("the appearance crossfade", () => {
  const shift = rules(GLOBALS).filter((r) => r.selector.includes("kos-appearance-shift"));

  it("is 160 ms of paint only, and nothing at all under reduced motion", () => {
    const plain = shift.find((r) => !r.at.length)!;
    expect(plain.body).toContain("160ms");
    expect(plain.body).not.toMatch(/transform|width|height|top|left/);

    const reduced = shift.find((r) => r.at.some((a) => a.includes("prefers-reduced-motion")))!;
    expect(reduced.body.trim()).toBe("transition: none !important;");
  });
});

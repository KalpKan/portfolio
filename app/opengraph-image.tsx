import { ImageResponse } from "next/og";
import { countKinds, loadProjects, projectKind, type Kind } from "@/lib/projects";
import { SITE } from "@/lib/site";

// The share card: the sheet header and the array, drawn with the same marks
// as the page. Generated at build time from projects.json, so a registry
// change updates the card on the next deploy. A "live" pad here is the
// registry's status, since a build cannot measure a signal.

export const alt = "Kalp Kansara — a channel map of every shipped project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  sheet: "#f1f3f6",
  ink: "#15171d",
  ink2: "#4d5261",
  ink3: "#62677a",
  rule: "#c3c7cf",
  ruleSoft: "#d9dde4",
  pad: "#e1e4ea",
  signal: "#1d3fd6",
  signalInk: "#ffffff",
};

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`,
      // An older UA makes Google serve woff (satori reads ttf/otf/woff, not woff2).
      { headers: { "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" } },
    ).then((r) => (r.ok ? r.text() : ""));
    const m = css.match(/src: url\((https:\/\/[^)]+)\) format\('(?:truetype|opentype|woff)'\)/);
    if (!m) return null;
    const bin = await fetch(m[1]).then((r) => (r.ok ? r.arrayBuffer() : null));
    return bin;
  } catch {
    return null;
  }
}

function Mark({ kind }: { kind: Kind }) {
  const s = 18;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
  };
  if (kind === "showcase" || kind === "showcase-soon") {
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M8 4.5 11.5 11.5H4.5Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "archived") {
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M2 14 14 2" />
      </svg>
    );
  }
  if (kind === "coming") {
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="13" height="13" strokeDasharray="2 2" />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 64 24" width={56} height={21} strokeWidth={1.5}>
      <path d="M2 14h9l3-8 5 14 4-10 3 4h8l3-6 4 10 3-4h18" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default async function Image() {
  const projects = loadProjects();
  const c = countKinds(projects);
  const countLine = `${c.live} live · ${c.coming} coming · ${c.caseStudies} case studies`;
  const lede = "Every project that has actually shipped, on one sheet.";

  const [grotesk, mono] = await Promise.all([
    loadGoogleFont("Bricolage Grotesque", `${SITE.name}${lede}`),
    loadGoogleFont("Geist Mono", `${countLine}ARRAY0123456789 · kalpkan.com`),
  ]);
  const fonts = [
    ...(grotesk ? [{ name: "Bricolage Grotesque", data: grotesk, weight: 400 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "Geist Mono", data: mono, weight: 400 as const, style: "normal" as const }] : []),
  ];
  const sans = grotesk ? "Bricolage Grotesque" : "sans-serif";
  const monoFace = mono ? "Geist Mono" : "monospace";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: C.sheet,
          color: C.ink,
          padding: "64px 72px 56px",
          fontFamily: sans,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, lineHeight: 0.95, letterSpacing: "-0.03em" }}>{SITE.name}</div>
          <div style={{ marginTop: 22, fontSize: 34, lineHeight: 1.25, color: C.ink2, maxWidth: 900 }}>{lede}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: monoFace,
              fontSize: 18,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.ink2,
              paddingBottom: 10,
              borderBottom: `1px solid ${C.rule}`,
            }}
          >
            <span>Array</span>
            <span>{countLine}</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              background: C.ruleSoft,
              padding: 1,
              gap: 1,
            }}
          >
            {projects.map((p, i) => {
              const kind = projectKind(p);
              const lit = kind === "live";
              return (
                <div
                  key={p.slug}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    width: 87,
                    height: 87,
                    padding: 10,
                    background: lit ? C.signal : C.pad,
                    color: lit ? C.signalInk : C.ink,
                    fontFamily: monoFace,
                    fontSize: 16,
                  }}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Mark kind={kind} />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 18,
              fontFamily: monoFace,
              fontSize: 16,
              color: C.ink3,
            }}
          >
            <span>a filled pad is a live site · dashed is not yet deployed · a triangle is a case study</span>
            <span>kalpkan.com</span>
          </div>
        </div>
      </div>
    ),
    // With no font fetched (offline build) satori falls back to its bundled face.
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}

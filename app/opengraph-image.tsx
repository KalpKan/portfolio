import { ImageResponse } from "next/og";
import { countKinds, loadProjects } from "@/lib/projects";
import { SITE } from "@/lib/site";

// The share card: a small KalpOS desk (card 2c) drawn with satori's flexbox:
// paper, dots, the frosted menubar, the two folders, the yellow note with the
// name and the registry counts. Generated at build time from projects.json,
// so a registry change updates the card on the next deploy.

export const alt = "Kalp Kansara — KalpOS, a desk of his projects";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  paper: "#f3f2f2",
  ink: "#201e1d",
  frost: "rgba(248,244,244,0.9)",
  note: "#f6e7ae",
  cyan: "#0088b0",
};

function Folder({ tint, badge }: { tint: "projects" | "hobbies"; badge?: string }) {
  const tab = tint === "projects" ? "#006786" : "#aa0b56";
  const back = tint === "projects" ? "#0a5f7d" : "#8e0f4a";
  const front =
    tint === "projects"
      ? "linear-gradient(180deg,#5cc3ec 0%,#2e9fcc 45%,#1186ac 100%)"
      : "linear-gradient(180deg,#ff90b1 0%,#ff458e 45%,#d82071 100%)";
  return (
    <div style={{ position: "relative", width: 140, height: 112, display: "flex" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 56, height: 34, background: tab, borderRadius: "14px 20px 0 0" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 16, bottom: 0, background: back, borderRadius: "0 16px 20px 20px" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 30, height: 8, background: "#fff", borderRadius: 6 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 36, bottom: 0, background: front, borderRadius: "8px 8px 20px 20px", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "0 16px 12px", color: "#fff", fontSize: 20, opacity: 0.9 }}>
        {badge ?? ""}
      </div>
    </div>
  );
}

export default async function Image() {
  const projects = loadProjects();
  const c = countKinds(projects);
  const countLine = `${projects.length} projects · ${c.live} live · ${c.caseStudies} case studies`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.paper,
          backgroundImage: "radial-gradient(rgba(32,30,29,0.18) 2px, transparent 2.4px)",
          backgroundSize: "40px 40px",
          color: C.ink,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* menubar */}
        <div
          style={{
            height: 58,
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: "0 36px",
            background: C.frost,
            borderBottom: "2px solid rgba(255,255,255,0.65)",
            fontSize: 24,
          }}
        >
          <span style={{ fontWeight: 700 }}>KalpOS</span>
          <span style={{ opacity: 0.72 }}>File</span>
          <span style={{ opacity: 0.72 }}>Edit</span>
          <span style={{ opacity: 0.72 }}>View</span>
          <span style={{ opacity: 0.72 }}>Go</span>
          <span style={{ opacity: 0.72 }}>Window</span>
          <span style={{ marginLeft: "auto", opacity: 0.72 }}>kalpkan.com</span>
        </div>

        {/* folders */}
        <div style={{ position: "absolute", left: 72, top: 118, display: "flex", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontSize: 26 }}>
            <Folder tint="projects" badge={String(projects.length).padStart(2, "0")} />
            <span>Projects</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontSize: 26 }}>
            <Folder tint="hobbies" />
            <span>Hobbies</span>
          </div>
        </div>

        {/* note */}
        <div
          style={{
            position: "absolute",
            right: 72,
            top: 118,
            width: 560,
            display: "flex",
            flexDirection: "column",
            background: C.note,
            borderRadius: 36,
            padding: "34px 40px",
            boxShadow: "0 6px 20px rgba(45,43,43,0.12)",
          }}
        >
          <span style={{ fontSize: 20, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.55 }}>Note</span>
          <span style={{ marginTop: 14, fontSize: 58, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{SITE.name}</span>
          <span style={{ marginTop: 18, fontSize: 28, lineHeight: 1.4 }}>{SITE.note}</span>
        </div>

        {/* dock */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 34,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: 18,
              background: "rgba(248,244,244,0.85)",
              border: "2px solid rgba(255,255,255,0.75)",
              borderRadius: 44,
              boxShadow: "0 24px 64px rgba(45,43,43,0.2)",
            }}
          >
            {["linear-gradient(180deg,#62c5ee,#1186ac)", "linear-gradient(180deg,#fff6d6,#f6e7ae)", "linear-gradient(180deg,#38a6cf,#006786)", "linear-gradient(180deg,#ff458e,#aa0b56)", "#fff", "linear-gradient(180deg,#444141,#201e1d)"].map((bg, i) => (
              <div key={i} style={{ width: 96, height: 96, borderRadius: 28, background: bg, boxShadow: "0 2px 4px rgba(45,43,43,0.18)" }} />
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", left: 72, bottom: 190, fontSize: 24, color: C.cyan, display: "flex" }}>{countLine}</div>
      </div>
    ),
    size,
  );
}

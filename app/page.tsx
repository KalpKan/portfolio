import KalpOS from "@/components/kalpos/KalpOS";
import { loadProjects } from "@/lib/projects";

// The hub is KalpOS (docs/superpowers/specs/2026-09-20-kalpos-frontend-design.md):
// a lock screen over a desk. Everything the desk shows comes from
// projects.json (lib/projects.ts) and lib/site.ts, validated at build time.
export default function Home() {
  return <KalpOS projects={loadProjects()} />;
}

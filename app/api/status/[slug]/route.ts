import { loadProjects } from "@/lib/projects";
import { checkHealth } from "@/lib/health";

// GET /api/status/<slug> -> { slug, ok: boolean, checkedAt }
// Server-side check of a registry project's healthUrl (3 s timeout, no
// redirects followed, healthy only on a JSON body with `ok: true`; see
// lib/health.ts). Exists because project health routes do not send CORS
// headers, so the browser cannot fetch them directly from the hub's origin.
// Only registry URLs are ever fetched, so this is not an open proxy.

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/status/[slug]">,
) {
  const { slug } = await ctx.params;
  const project = loadProjects().find((p) => p.slug === slug);
  const healthUrl = project?.type === "app" ? project.healthUrl : null;

  if (!project || !healthUrl) {
    return Response.json(
      { slug, ok: false, reason: "no-health-url" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const ok = await checkHealth(healthUrl);

  return Response.json(
    { slug, ok, checkedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}

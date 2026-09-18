import { loadProjects } from "@/lib/projects";

// GET /api/status/<slug> -> { slug, ok: boolean, checkedAt }
// Server-side check of a registry project's healthUrl (3 s timeout). Exists
// because project health routes do not send CORS headers, so the browser
// cannot fetch them directly from the hub's origin. Only registry URLs are
// ever fetched, so this is not an open proxy.

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 3000;

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let ok = false;
  try {
    const res = await fetch(healthUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (res.ok) {
      const body = (await res.json().catch(() => null)) as {
        ok?: unknown;
      } | null;
      ok = body === null ? true : body.ok !== false;
    }
  } catch {
    ok = false;
  } finally {
    clearTimeout(timer);
  }

  return Response.json(
    { slug, ok, checkedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}

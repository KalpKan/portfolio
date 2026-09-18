// GET /api/health -> { ok: true, service: "hub", time: "<ISO>" }
// Contract used by UptimeRobot (T0.3) and by the hub's own status badge. Do not rename fields.

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { ok: true, service: "hub", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

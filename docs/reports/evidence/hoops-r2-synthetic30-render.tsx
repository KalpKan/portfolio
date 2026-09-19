// Renders the dashboard with the 30-session synthetic corpus through the real pure builder.
// Usage (from apps/web): CSS=<built css path> OUT=<html path> npx tsx --tsconfig tsconfig.test.json <this file>
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync, writeFileSync } from "node:fs";
import { DashboardPage } from "/Users/kalp/projects/basketball/apps/web/components/dashboard-page";
import { buildDashboardPayload } from "/Users/kalp/projects/basketball/apps/web/lib/dashboard-data";
const rows = JSON.parse(readFileSync("/Users/kalp/projects/basketball/tests/fixtures/synthetic-30-sessions.json", "utf8"));
const payload = buildDashboardPayload({ sessions: rows.sessions, shots: rows.shot_events }, { now: new Date("2026-09-18T12:00:00Z") });
const html = renderToStaticMarkup(createElement(DashboardPage, { initialData: payload }));
writeFileSync(process.env.OUT!, `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${process.env.CSS}"><style>body{margin:0;background:#050505}</style></head><body>${html}</body></html>`);
console.log("sessions", payload.sessions.length, "progress", payload.progress.length, "shots", payload.shotMap.length, "bytes", html.length);

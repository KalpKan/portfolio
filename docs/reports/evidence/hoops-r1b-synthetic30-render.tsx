import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync, writeFileSync } from "node:fs";
import { DashboardPage } from "/Users/kalp/projects/basketball/apps/web/components/dashboard-page";
// synthetic payload, but uncap: rebuild sessions list from ground truth so all 30 days are present
const truth = JSON.parse(readFileSync("/Users/kalp/projects/basketball/tests/fixtures/synthetic-30-expected-metrics.json", "utf8"));
const p = JSON.parse(readFileSync(process.env.IN!, "utf8"));
const iso = (s: string) => s.replace(" ", "T").replace(/\+00$/, "+00:00");
const sessions = truth.per_utc_day.map((d: any) => ({ sessionId: d.day_id, deviceId: d.device_ids[0], startedAt: iso(truth.per_session.find((s: any) => s.session_id === d.merged_sessions[0]).started_at), lastShotAt: iso(d.last_shot_at), attempts: d.attempts, made: d.made, missed: d.missed, fgPercent: d.fg_percent, efgPercent: d.efg_percent, swishRate: d.swish_rate, bestStreak: d.best_streak })).sort((a: any, b: any) => b.startedAt.localeCompare(a.startedAt));
const progress = sessions.slice().reverse().map((s: any) => ({ label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(s.startedAt)), fgPercent: s.fgPercent, efgPercent: s.efgPercent, streak: s.bestStreak }));
const payload = { ...p, sessions, progress };
const html = renderToStaticMarkup(createElement(DashboardPage, { initialData: payload }));
writeFileSync(process.env.OUT!, `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${process.env.CSS}"><style>body{margin:0;background:#050505}</style></head><body>${html}</body></html>`);
console.log("sessions", sessions.length, "progress", progress.length, "bytes", html.length);

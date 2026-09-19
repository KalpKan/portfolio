import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
const rows = JSON.parse(readFileSync("/Users/kalp/projects/basketball/tests/fixtures/synthetic-30-sessions.json", "utf8"));
const truth = JSON.parse(readFileSync("/Users/kalp/projects/basketball/tests/fixtures/synthetic-30-expected-metrics.json", "utf8"));
const iso = (s: string) => s.replace(" ", "T").replace(/\+00$/, "+00:00");
const summaries = truth.per_session.map((s: any) => ({ session_id: s.session_id, device_id: s.device_id, started_at: iso(s.started_at), last_shot_at: iso(s.last_shot_at), attempts: s.attempts, made: s.made, missed: s.missed, fg_percent: s.fg_percent, efg_percent: s.efg_percent, swish_rate: s.swish_rate, best_streak: s.best_streak }));
const overall = [{ attempts: truth.overall.attempts, made: truth.overall.made, missed: truth.overall.missed, fg_percent: truth.overall.fg_percent, consistency: truth.overall.consistency_raw_session_basis ?? truth.overall.consistency, avg_streak: truth.overall.avg_streak, swish_rate: truth.overall.swish_rate }];
const shots = rows.shot_events.map((e: any) => ({ ...e, captured_at: iso(e.captured_at) }));
function table(data: any[]) {
  const q: any = { _data: data, _order: null as any, _limit: Infinity };
  q.select = () => q; q.order = (col: string, o: any) => { q._order = [col, o?.ascending]; return q; }; q.limit = (n: number) => { q._limit = n; return q; };
  q.then = (res: any, rej: any) => { let d = q._data.slice(); if (q._order) { const [c, asc] = q._order; d.sort((a: any, b: any) => (asc ? 1 : -1) * String(a[c]).localeCompare(String(b[c]))); } return Promise.resolve({ data: d.slice(0, q._limit), error: null }).then(res, rej); };
  return q;
}
const client = { from: (t: string) => table(t === "overall_analytics" ? overall : t === "session_summaries" ? summaries : shots) };
mock.module("./supabase-admin.ts", { namedExports: { getSupabaseAdmin: () => client } });

test("pipeline on the 30-session synthetic corpus", async () => {
  const { getDashboardPayload } = await import("/Users/kalp/projects/basketball/apps/web/lib/dashboard-data.ts");
  const p = await getDashboardPayload();
  writeFileSync(process.env.OUT!, JSON.stringify(p, null, 1));
  console.log("source", p.source, "sessions", p.sessions.length, "progress", p.progress.length, "shotMap", p.shotMap.length, "total", p.totalShotsRecorded);
  const byDay = new Map(truth.per_utc_day.map((d: any) => [d.day_id, d]));
  let mismatches: string[] = [];
  for (const s of p.sessions) { const t: any = byDay.get(s.sessionId); if (!t) { mismatches.push("no truth for " + s.sessionId); continue; }
    for (const [k, tk] of [["attempts","attempts"],["made","made"],["missed","missed"],["fgPercent","fg_percent"],["efgPercent","efg_percent"],["swishRate","swish_rate"],["bestStreak","best_streak"]] as const) if ((s as any)[k] !== t[tk]) mismatches.push(`${s.sessionId} ${k} ${(s as any)[k]} != ${t[tk]}`); }
  console.log("mismatches", mismatches.length, mismatches.slice(0, 5));
  console.log("efg>100", p.sessions.filter(s => s.efgPercent > 100).length, "labels", p.progress.map(x => x.label).join(","));
  assert.equal(p.sessions.length, 30, "history is capped: only " + p.sessions.length + " of 30 sessions survive .limit(12)");
});

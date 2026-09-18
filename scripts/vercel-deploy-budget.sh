#!/usr/bin/env bash
# Agent-only tooling. Prints how many Vercel deployments the team created in the last 24 hours,
# by project, and when the oldest listed one ages out. Vercel's limit "Deployments per day (Free)"
# is 100 per 86400 s, scope "owner" = the whole Hobby team (error code "api-deployments-free-per-day").
# This count is only what the API still lists (deleted projects' deployments are gone from it but may
# still be counted by Vercel), and on 2026-09-18 refusals were INTERMITTENT while the list sat at
# 99-100: two hub pushes went through (22:46, 23:01 UTC) between refused ones (22:44, 22:53, 22:55).
# So treat the output as a warning, not a schedule: the "ages out" line is not when the next deploy
# will succeed. Uses the Vercel CLI's own login (no secrets printed). Usage: scripts/vercel-deploy-budget.sh
set -euo pipefail
TEAM_ID="${VERCEL_TEAM_ID:-team_COuL6hLftYDdKidApgwbIQIK}"   # kks-projects-2edcb11a
AUTH=""
for f in "$HOME/Library/Application Support/com.vercel.cli/auth.json" "$HOME/.local/share/com.vercel.cli/auth.json"; do
  [ -f "$f" ] && AUTH="$f" && break
done
[ -n "$AUTH" ] || { echo "Vercel CLI is not logged in (no auth.json)"; exit 2; }
TOKEN=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['token'])" "$AUTH")
curl -sf "https://api.vercel.com/v6/deployments?teamId=$TEAM_ID&limit=100" -H "Authorization: Bearer $TOKEN" | python3 -c '
import json, sys, time, collections
d = json.load(sys.stdin)["deployments"]
now = time.time() * 1000
recent = sorted([x for x in d if now - x["created"] < 86400000], key=lambda x: x["created"])
print(f"deployments still listed from the last 24 h: {len(recent)} (Hobby limit 100/day, team-wide; only the newest 100 are inspected; refusals are intermittent near the limit, so this is a warning, not a schedule)")
for name, n in collections.Counter(x["name"] for x in recent).most_common():
    print(f"  {n:3d}  {name}")
if recent:
    oldest = recent[0]["created"] / 1000 + 86400
    print("oldest listed one ages out at", time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(oldest)), "(not a prediction of when a deploy will be accepted; just retry)")
'

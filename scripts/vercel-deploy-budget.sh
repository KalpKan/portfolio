#!/usr/bin/env bash
# Prints how many Vercel deployments the team created in the last 24 hours, by project,
# and when the oldest ones age out. Hobby teams get 100 deployments per rolling 24 h
# (error code "api-deployments-free-per-day"); canceled builds count too.
# Uses the Vercel CLI's own login (no secrets printed). Usage: scripts/vercel-deploy-budget.sh
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
print(f"deployments created in the last 24 h: {len(recent)} of 100 (Hobby cap; only the newest 100 are inspected)")
for name, n in collections.Counter(x["name"] for x in recent).most_common():
    print(f"  {n:3d}  {name}")
if recent:
    oldest = recent[0]["created"] / 1000 + 86400
    print("oldest ages out at", time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(oldest)))
    if len(recent) >= 100:
        free = recent[len(recent) - 100]["created"] / 1000 + 86400
        print("a slot frees at   ", time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(free)))
'

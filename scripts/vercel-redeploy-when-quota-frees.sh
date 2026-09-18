#!/usr/bin/env bash
# Agent-only tooling (Kalp never needs to run this; he says "redeploy plantit" to Claude instead).
# Re-runs `vercel --prod` for one project until Vercel's team-wide deployment limit
# ("api-deployments-free-per-day", refusals are intermittent) lets it through, then PROVES the
# result: the new deployment must be READY, must carry the repo's current HEAD commit, and the
# public host must be aliased to it. Host health alone is not proof (the old build answers 200 too).
# Usage: scripts/vercel-redeploy-when-quota-frees.sh <project-dir> <public-host> [max-attempts] [minutes-between]
#   e.g. scripts/vercel-redeploy-when-quota-frees.sh ~/projects/plantit plantit.kalpkan.com 32 15
# Logs to ~/.config/portfolio-ops/logs/redeploy-<host>.log. Exit 0 = HEAD is live on the host;
# exit 1 = gave up or the deploy/build failed (the tail of the CLI output is in the log).
# Uses the Vercel CLI's own login (auth.json); no secret is printed. Nothing is installed or scheduled.
set -uo pipefail
DIR="$1"; HOST="$2"; MAX="${3:-32}"; EVERY="${4:-15}"
SCOPE="${VERCEL_SCOPE:-kks-projects-2edcb11a}"
TEAM_ID="${VERCEL_TEAM_ID:-team_COuL6hLftYDdKidApgwbIQIK}"
CLI="vercel@59.23.2"   # pinned: `npx -y` never stops to ask "Ok to proceed?" when a newer CLI is published
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
LOG="$HOME/.config/portfolio-ops/logs/redeploy-${HOST}.log"; mkdir -p "$(dirname "$LOG")"
say() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG"; }
cd "$DIR" || { say "no such dir $DIR"; exit 1; }
HEAD_SHA=$(git rev-parse HEAD)
AUTH=""
for f in "$HOME/Library/Application Support/com.vercel.cli/auth.json" "$HOME/.local/share/com.vercel.cli/auth.json"; do
  [ -f "$f" ] && AUTH="$f" && break
done
[ -n "$AUTH" ] || { say "Vercel CLI is not logged in (no auth.json)"; exit 1; }
TOKEN=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['token'])" "$AUTH")
say "start: $DIR -> $HOST (HEAD ${HEAD_SHA:0:7}), up to $MAX attempts every $EVERY min"
for i in $(seq 1 "$MAX"); do
  OUT=$(npx -y "$CLI" --prod --yes --scope "$SCOPE" 2>&1); RC=$?
  if echo "$OUT" | grep -q "api-deployments-free-per-day"; then
    say "attempt $i: refused (api-deployments-free-per-day); retry in $EVERY min"
    sleep $((EVERY * 60)); continue
  fi
  URL=$(echo "$OUT" | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)
  if [ "$RC" -ne 0 ] || [ -z "$URL" ]; then
    say "attempt $i: vercel exited $RC (deploy or build failed):"; echo "$OUT" | tail -15 | tee -a "$LOG"; exit 1
  fi
  say "attempt $i: deployment created $URL; checking it is READY, is commit ${HEAD_SHA:0:7}, and owns $HOST"
  for j in $(seq 1 30); do
    INFO=$(curl -s "https://api.vercel.com/v13/deployments/${URL#https://}?teamId=$TEAM_ID" -H "Authorization: Bearer $TOKEN")
    VERDICT=$(printf '%s' "$INFO" | HOST="$HOST" HEAD_SHA="$HEAD_SHA" python3 -c '
import json, os, sys
d = json.load(sys.stdin)
state = d.get("readyState") or d.get("state")
sha = (d.get("meta") or {}).get("githubCommitSha") or (d.get("gitSource") or {}).get("sha") or ""
aliased = os.environ["HOST"] in [a if isinstance(a, str) else a.get("alias", "") for a in d.get("alias", [])]
print(state, sha[:7] or "-", "aliased" if aliased else "not-aliased")
if state in ("ERROR", "CANCELED"): sys.exit(2)
if state == "READY" and sha == os.environ["HEAD_SHA"] and aliased: sys.exit(0)
sys.exit(3)'); VRC=$?
    if [ "$VRC" -eq 0 ]; then
      say "verified: $VERDICT -> https://$HOST serves ${HEAD_SHA:0:7}"
      say "health: $(curl -s -o /dev/null -w '%{http_code}' "https://$HOST/api/health" || true) $(curl -s "https://$HOST/api/health" | head -c 300)"
      exit 0
    elif [ "$VRC" -eq 2 ]; then
      say "deployment ended in $VERDICT; see https://vercel.com/$SCOPE and $(echo "$OUT" | grep -Eo 'https://vercel.com/[^ ]+' | head -1)"; exit 1
    fi
    sleep 10
  done
  say "gave up waiting for the deployment to become READY + aliased (last: $VERDICT)"; exit 1
done
say "gave up after $MAX attempts (limit still in force)"; exit 1

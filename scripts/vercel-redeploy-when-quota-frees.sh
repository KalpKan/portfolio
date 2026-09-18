#!/usr/bin/env bash
# Re-runs `vercel --prod` for one project until the team's 100-deployments-per-day cap lets it through,
# then checks the public host. Run it in a Terminal and leave it; nothing is installed or scheduled.
# Usage: scripts/vercel-redeploy-when-quota-frees.sh <project-dir> <public-host> [max-attempts] [minutes-between]
#   e.g. scripts/vercel-redeploy-when-quota-frees.sh ~/projects/plantit plantit.kalpkan.com 32 15
# Logs to ~/.config/portfolio-ops/logs/redeploy-<host>.log. Exit 0 = deployed and the host's /api/health
# answered 200; exit 1 = gave up (cap still in force or the deploy failed). No secrets are read or printed.
set -uo pipefail
DIR="$1"; HOST="$2"; MAX="${3:-32}"; EVERY="${4:-15}"
SCOPE="${VERCEL_SCOPE:-kks-projects-2edcb11a}"
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
LOG="$HOME/.config/portfolio-ops/logs/redeploy-${HOST}.log"; mkdir -p "$(dirname "$LOG")"
say() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG"; }
cd "$DIR" || { say "no such dir $DIR"; exit 1; }
say "start: $DIR -> $HOST (HEAD $(git rev-parse --short HEAD)), up to $MAX attempts every $EVERY min"
for i in $(seq 1 "$MAX"); do
  OUT=$(npx vercel@latest --prod --yes --scope "$SCOPE" 2>&1)
  if echo "$OUT" | grep -q "api-deployments-free-per-day"; then
    say "attempt $i: cap still in force (api-deployments-free-per-day); retry in $EVERY min"
    sleep $((EVERY * 60)); continue
  fi
  URL=$(echo "$OUT" | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)
  if [ -z "$URL" ]; then say "attempt $i: deploy failed:"; echo "$OUT" | tail -15 | tee -a "$LOG"; exit 1; fi
  say "attempt $i: deployed $URL"
  CODE=000
  for j in $(seq 1 20); do
    CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://$HOST/api/health" || true)
    [ "$CODE" = "200" ] && break; sleep 5
  done
  say "https://$HOST/api/health -> $CODE"
  say "health body: $(curl -s "https://$HOST/api/health")"
  [ "$CODE" = "200" ] && exit 0 || exit 1
done
say "gave up after $MAX attempts"; exit 1

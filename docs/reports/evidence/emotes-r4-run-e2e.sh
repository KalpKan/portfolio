#!/bin/bash
# TEST round 4: run named reels through the real pipeline on a URL at a width, one Chrome at a time.
#   emotes-r4-run-e2e.sh URL WIDTH OUTFILE name [name ...]      (env: THROTTLE, BROWSER passed through)
URL=$1; W=$2; OUT=$3; shift 3
S=${S:-/tmp/emotes-e2e}   # the clip folder (scripts/build_e2e_clips.py + the r3/r4 builders write here)
H=/Users/kalp/projects/portfolio/docs/reports/evidence/emotes-r3-e2e-harness.mjs
cd /Users/kalp/projects/emotes
for n in "$@"; do
  if [ "$n" = official ]; then CLIP=tests/fixtures/clips/e2e-three-gestures.mjpeg; LAB=tests/fixtures/clips/e2e-labels.json; else CLIP=$S/e2e-$n.mjpeg; LAB=$S/e2e-$n-labels.json; fi
  echo "=== $n width=$W throttle=${THROTTLE:-0} browser=${BROWSER:-chrome} $(date -u +%H:%M:%SZ)" >> "$OUT"
  GPU=1 WIDTH=$W CLIP=$CLIP LABELS=$LAB node $H "$URL" >> "$OUT" 2>&1 || echo "(exit $?)" >> "$OUT"
done
echo "=== done $(date -u +%H:%M:%SZ)" >> "$OUT"

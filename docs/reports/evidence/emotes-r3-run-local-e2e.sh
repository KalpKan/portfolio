#!/bin/zsh
S=/private/tmp/claude-501/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/scratchpad
OUT=$S/e2e-local-r3.txt
: > $OUT
URL=http://localhost:4173/
run() { echo "=== $1 WIDTH=$2 THROTTLE=${3:-0} BROWSER=${4:-chrome} ===" >> $OUT; GPU=1 WIDTH=$2 THROTTLE=${3:-0} BROWSER=${4:-chrome} CLIP=$S/clips/e2e-$1.mjpeg LABELS=$S/clips/e2e-$1-labels.json node $S/e2e-r3.mjs $URL >> $OUT 2>&1; }
# portrait stream (S8/D6), new positives, motion, dim, quick rests, neutral mix
run portrait 390; run portrait 1000; run portrait2 390
run motion 1000; run motion 390; run motion-hard 1000
run dim 1000; run dim 390
run quick-thumb 1000; run quick-flex 1000; run quick-yawn 1000
run neutral-mix 1000
run flex-both 1000; run thumbs-more 1000; run yawn-more 1000
# phone-like frame rates: CPU throttled 4x and 6x on the official clip
echo "=== official WIDTH=390 THROTTLE=4 ===" >> $OUT; GPU=1 WIDTH=390 THROTTLE=4 node $S/e2e-r3.mjs $URL >> $OUT 2>&1
echo "=== official WIDTH=390 THROTTLE=6 ===" >> $OUT; GPU=1 WIDTH=390 THROTTLE=6 node $S/e2e-r3.mjs $URL >> $OUT 2>&1
run fast 390 6; run tu04x4 390 6; run hard 390 6
# Playwright Chromium instead of Google Chrome
echo "=== official WIDTH=1000 BROWSER=playwright ===" >> $OUT; GPU=1 WIDTH=1000 BROWSER=playwright node $S/e2e-r3.mjs $URL >> $OUT 2>&1
echo "=== official WIDTH=390 BROWSER=playwright ===" >> $OUT; GPU=1 WIDTH=390 BROWSER=playwright node $S/e2e-r3.mjs $URL >> $OUT 2>&1
run fast 390 0 playwright; run tu04x4 1000 0 playwright
echo "=== DONE ===" >> $OUT

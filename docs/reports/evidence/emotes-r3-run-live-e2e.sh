#!/bin/zsh
cd /Users/kalp/projects/emotes
S=/private/tmp/claude-501/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/scratchpad
OUT=$S/e2e-live-r3.txt
: > $OUT
URL=https://emotes.kalpkan.com/
for W in 1000 390; do
  echo "=== official WIDTH=$W ===" >> $OUT
  GPU=1 WIDTH=$W node scripts/e2e-camera.mjs $URL >> $OUT 2>&1
  for n in tu04x4 tu04x4 tu04x4 fast hard hard2 misses repeat mirror sweep far hold-yawn hold-thumb hold-flex tu17x4 flex09x3; do
    echo "=== $n WIDTH=$W ===" >> $OUT
    GPU=1 WIDTH=$W CLIP=$S/clips/e2e-$n.mjpeg LABELS=$S/clips/e2e-$n-labels.json node scripts/e2e-camera.mjs $URL >> $OUT 2>&1
  done
done
echo "=== DONE ===" >> $OUT

#!/usr/bin/env python3
"""Grab one frame of a video as a PNG, to turn into a WebP poster/photo.

Usage:
    python3 scripts/video-poster.py <video> <seconds> <out.png>

Needs OpenCV (``pip install opencv-python-headless``); the microtubules
project's virtualenv on Kalp's Mac already has it:
    ~/projects/microtubules/.venv/bin/python scripts/video-poster.py ...

Then convert: ``node scripts/media-to-webp.mjs out.png public/images/projects/<slug>/<name>.webp``.
The video itself is never committed (docs/hosting-plan.md §6).
"""
import sys

import cv2

src, secs, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
cap.set(cv2.CAP_PROP_POS_FRAMES, min(int(secs * fps), frames - 1))
ok, frame = cap.read()
if not ok:
    sys.exit(f"could not read a frame at {secs}s from {src}")
cv2.imwrite(out, frame)
print(f"{out}: {frame.shape[1]}x{frame.shape[0]} (video {fps:.0f} fps, {frames} frames)")

#!/usr/bin/env python3
"""Held-out-ish robustness sets from the read-only photo folder (never committed):
mirror   = horizontal flip (the rules must be symmetric; the landmarkers are not)
portrait = photo letterboxed into a 3:4 portrait frame at 78 % scale (a phone's front camera, subject smaller)
far      = photo shrunk to 60 % on a neutral canvas of the same size (subject further from the camera)
"""
import os, sys
from PIL import Image, ImageOps
SRC = os.path.expanduser("~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/data/raw/gestures")
OUT = sys.argv[1]
LABELS = ["flex", "thumbs_up", "yawn", "angry", "cover_eyes", "dab"]
BG = (128, 128, 128)
for variant in ["mirror", "portrait", "far"]:
    for label in LABELS:
        d = os.path.join(OUT, variant, label); os.makedirs(d, exist_ok=True)
        for name in sorted(os.listdir(os.path.join(SRC, label))):
            if not name.lower().endswith((".png", ".jpg", ".jpeg")): continue
            im = Image.open(os.path.join(SRC, label, name)).convert("RGB")
            w, h = im.size
            if variant == "mirror":
                out = ImageOps.mirror(im)
            elif variant == "portrait":
                W, H = 480, 640
                s = 0.78 * min(W / w, H / h)
                r = im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
                out = Image.new("RGB", (W, H), BG); out.paste(r, ((W - r.width) // 2, (H - r.height) // 2))
            else:
                r = im.resize((max(1, int(w * 0.6)), max(1, int(h * 0.6))), Image.LANCZOS)
                out = Image.new("RGB", (w, h), BG); out.paste(r, ((w - r.width) // 2, (h - r.height) // 2))
            out.save(os.path.join(d, name), "PNG")
print("ok")

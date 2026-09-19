#!/usr/bin/env python3
"""TEST round 3 fake-camera clips: portrait frames (480x640), slow zoom/pan motion, a dim blurry
webcam, 0.6 s rests, and a scratch-head/talking style rest. Same recipe as scripts/build_e2e_clips.py."""
import io, json, os, sys, math
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
REPO = "/Users/kalp/projects/emotes"
STILLS = os.path.join(REPO, "tests", "fixtures", "stills")
SRC = os.path.expanduser("~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/data/raw/gestures")
FPS = 30
REST = "angry-04"
POS = {"thumbs_up", "flex", "yawn"}
OFFICIAL = [(REST, 2.0), ("thumbs_up-07", 2.5), (REST, 2.0), ("flex-14", 2.5), (REST, 2.0), ("yawn-19", 2.5), (REST, 2.0)]
CLIPS = {
  "portrait": dict(size=(480, 640), segs=OFFICIAL),
  "portrait2": dict(size=(480, 640), segs=[(REST, 2.0), ("thumbs_up-11", 2.5), (REST, 2.0), ("flex-04", 2.5), (REST, 2.0), ("yawn-02", 2.5), (REST, 2.0), ("cover_eyes-05", 2.5), (REST, 2.0), ("dab-07", 2.5), (REST, 1.5)]),
  "motion": dict(size=(640, 480), motion=True, segs=[(REST, 2.0), ("thumbs_up-07", 2.5), (REST, 2.0), ("flex-14", 2.5), (REST, 2.0), ("yawn-19", 2.5), (REST, 2.0), ("flex-04", 2.5), (REST, 2.0), ("thumbs_up-11", 2.5), (REST, 2.0), ("yawn-02", 2.5), (REST, 2.0)]),
  "motion-hard": dict(size=(640, 480), motion=True, hard=True, segs=[(REST, 2.0), ("cover_eyes-02", 2.5), (REST, 2.0), ("dab-01", 2.5), (REST, 2.0), ("angry-05", 2.5), (REST, 2.0), ("cover_eyes-11", 2.5), (REST, 2.0), ("dab-12", 2.5), (REST, 2.0), ("angry-01", 2.5), (REST, 2.0)]),
  "dim": dict(size=(640, 480), dim=True, segs=OFFICIAL + [("flex-04", 2.5), (REST, 2.0), ("thumbs_up-11", 2.5), (REST, 2.0), ("yawn-02", 2.5), (REST, 2.0)]),
  "quick-thumb": dict(size=(640, 480), segs=[(REST, 1.5)] + [("thumbs_up-07", 1.5), (REST, 0.6)] * 3 + [(REST, 1.0)]),
  "quick-flex": dict(size=(640, 480), segs=[(REST, 1.5)] + [("flex-14", 1.5), (REST, 0.6)] * 3 + [(REST, 1.0)]),
  "quick-yawn": dict(size=(640, 480), segs=[(REST, 1.5)] + [("yawn-19", 1.5), (REST, 0.6)] * 3 + [(REST, 1.0)]),
  "neutral-mix": dict(size=(640, 480), hard=True, segs=[("angry-04", 3.0), ("angry-10", 3.0), ("angry-02", 3.0), ("angry-07", 3.0), ("angry-09", 3.0), ("angry-03", 3.0), ("angry-11", 3.0), ("angry-12", 3.0), ("angry-08", 3.0), ("angry-04", 3.0)]),
  "flex-both": dict(size=(640, 480), segs=[(REST, 2.0), ("flex-11", 2.5), (REST, 2.0), ("flex-12", 2.5), (REST, 2.0), ("flex-02", 2.5), (REST, 2.0), ("flex-05", 2.5), (REST, 2.0), ("flex-07", 2.5), (REST, 2.0)]),
  "thumbs-more": dict(size=(640, 480), segs=[(REST, 2.0), ("thumbs_up-01", 2.5), (REST, 2.0), ("thumbs_up-03", 2.5), (REST, 2.0), ("thumbs_up-08", 2.5), (REST, 2.0), ("thumbs_up-12", 2.5), (REST, 2.0), ("thumbs_up-14", 2.5), (REST, 2.0), ("thumbs_up-15", 2.5), (REST, 2.0)]),
  "yawn-more": dict(size=(640, 480), segs=[(REST, 2.0), ("yawn-05", 2.5), (REST, 2.0), ("yawn-07", 2.5), (REST, 2.0), ("yawn-12", 2.5), (REST, 2.0), ("yawn-17", 2.5), (REST, 2.0), ("yawn-18", 2.5), (REST, 2.0), ("yawn-03", 2.5), (REST, 2.0)]),
}

def load(sid):
    src = json.load(open(os.path.join(STILLS, sid + ".json")))["source"]
    return Image.open(os.path.join(SRC, src)).convert("RGB")

def render(im, size, t=None, motion=False, dim=False):
    W, H = size
    im = im.copy()
    if motion and t is not None:
        # slow zoom 1.0 -> 1.12 and a pan of up to 4 % of the width over the segment, a gentle sway
        z = 1.0 + 0.12 * t
        dx = 0.04 * math.sin(2 * math.pi * t) 
        dy = 0.02 * math.cos(2 * math.pi * t)
        w, h = im.size
        cw, ch = w / z, h / z
        cx = w / 2 + dx * w
        cy = h / 2 + dy * h
        box = (max(0, cx - cw / 2), max(0, cy - ch / 2), min(w, cx + cw / 2), min(h, cy + ch / 2))
        im = im.crop(tuple(int(v) for v in box))
    im.thumbnail((W, H))
    canvas = Image.new("RGB", (W, H), "white")
    canvas.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
    q = 88
    if dim:
        canvas = ImageEnhance.Brightness(canvas).enhance(0.45).filter(ImageFilter.GaussianBlur(1.5))
        q = 55
    buf = io.BytesIO()
    canvas.save(buf, "JPEG", quality=q)
    return buf.getvalue()

def build(outdir, name):
    c = CLIPS[name]
    W, H = c["size"]
    out = os.path.join(outdir, f"e2e-{name}.mjpeg")
    events, t = [], 0.0
    with open(out, "wb") as f:
        for sid, secs in c["segs"]:
            im = load(sid)
            n = int(round(secs * FPS))
            if c.get("motion"):
                for k in range(n):
                    f.write(render(im, (W, H), t=k / max(n - 1, 1), motion=True))
            else:
                jpeg = render(im, (W, H), dim=c.get("dim", False))
                for _ in range(n):
                    f.write(jpeg)
            g = sid.rsplit("-", 1)[0]
            if sid != REST and g in POS and not c.get("hard"):
                events.append({"gesture": g, "still": sid, "startMs": int(t * 1000), "endMs": int((t + secs) * 1000)})
            t += secs
    json.dump({"file": os.path.basename(out), "fps": FPS, "width": W, "height": H, "durationMs": int(t * 1000), "segments": [[s, d] for s, d in c["segs"]], "events": events}, open(os.path.join(outdir, f"e2e-{name}-labels.json"), "w"), indent=1)
    print(out, round(os.path.getsize(out) / 1e6, 1), "MB", t, "s", len(events), "events")

if __name__ == "__main__":
    outdir = sys.argv[1]
    names = sys.argv[2:] or list(CLIPS)
    os.makedirs(outdir, exist_ok=True)
    for n in names:
        build(outdir, n)

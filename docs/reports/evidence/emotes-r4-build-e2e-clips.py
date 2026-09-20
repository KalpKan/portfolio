#!/usr/bin/env python3
"""TEST round 4 fake-camera clips (real pipeline, Chrome's fake camera). New this round: every clear
positive still through the pipeline once (all-flex / all-thumbs / all-yawn), every hard negative,
occluded and partial still (all-hard / occluded), gestures that morph into one another with no rest,
flex <-> thumbs-up takeovers, 0.8 s and 1.0 s rests (the minimum rest), 0.8 s holds (a flashed
gesture), mirrored and far flex-09, and the official sequence with a different rest photo (every
earlier reel rested on angry-04). Same recipe as scripts/build_e2e_clips.py; "~" mirrors, "^" shrinks
to 55 %. Never commit the output (stock photos)."""
import io, json, os, sys
from PIL import Image, ImageOps
REPO = "/Users/kalp/projects/emotes"
STILLS = os.path.join(REPO, "tests", "fixtures", "stills")
SRC = os.path.expanduser("~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/data/raw/gestures")
FPS = 30
REST = "angry-04"
POS = {"thumbs_up", "flex", "yawn"}
idx = json.load(open(os.path.join(STILLS, "index.json")))
KIND = {s["id"]: s["kind"] for s in idx["stills"]}
def ids(kind, g=None):
    return sorted(i for i, k in KIND.items() if k == kind and (g is None or i.rsplit("-", 1)[0] == g))
def spaced(stills, hold=2.5, rest=2.0, rests=(REST,)):
    segs = []
    for n, s in enumerate(stills):
        segs += [(rests[n % len(rests)], rest), (s, hold)]
    return segs + [(rests[0], rest)]
CLIPS = {
  "all-flex": dict(segs=spaced(ids("ok", "flex"), rests=("angry-04", "angry-10"))),
  "all-thumbs": dict(segs=spaced(ids("ok", "thumbs_up"), rests=("angry-04", "angry-02"))),
  "all-yawn": dict(segs=spaced(ids("ok", "yawn"), rests=("angry-04", "angry-09"))),
  "all-hard": dict(hard=True, segs=spaced(ids("hard"), hold=2.0, rest=1.0, rests=("angry-04", "angry-10", "angry-02"))),
  "occluded": dict(hard=True, segs=spaced(ids("occluded") + ids("partial"), hold=2.0, rest=1.0)),
  "morph": dict(segs=[(REST, 2.0), ("flex-14", 1.5), ("thumbs_up-07", 1.5), ("yawn-19", 1.5), ("flex-04", 1.5), ("yawn-02", 1.5), ("thumbs_up-11", 1.5), ("flex-01", 1.5), (REST, 2.0)]),
  "takeover": dict(segs=[(REST, 2.0), ("flex-09", 2.5), ("thumbs_up-04", 2.5), (REST, 2.0), ("thumbs_up-07", 2.5), ("flex-09", 2.5), (REST, 2.0), ("thumbs_up-04", 2.5), ("flex-14", 2.5), (REST, 2.0)]),
  "rest08-thumb": dict(segs=[(REST, 1.5)] + [("thumbs_up-07", 1.5), (REST, 0.8)] * 3 + [(REST, 1.0)]),
  "rest08-flex": dict(segs=[(REST, 1.5)] + [("flex-14", 1.5), (REST, 0.8)] * 3 + [(REST, 1.0)]),
  "rest10-thumb": dict(segs=[(REST, 1.5)] + [("thumbs_up-07", 1.5), (REST, 1.0)] * 3 + [(REST, 1.0)]),
  "rest10-flex": dict(segs=[(REST, 1.5)] + [("flex-14", 1.5), (REST, 1.0)] * 3 + [(REST, 1.0)]),
  "short-hold": dict(segs=[(REST, 2.0), ("thumbs_up-07", 0.8), (REST, 2.0), ("flex-14", 0.8), (REST, 2.0), ("yawn-19", 1.0), (REST, 2.0), ("thumbs_up-11", 0.6), (REST, 2.0), ("flex-04", 0.6), (REST, 2.0)]),
  "flex09-mirror": dict(segs=[(REST, 2.0), ("flex-09~", 2.5)] * 3 + [(REST, 1.0)]),
  "flex09-far": dict(segs=[(REST, 2.0), ("flex-09^", 2.5), (REST, 2.0), ("thumbs_up-04^", 2.5), (REST, 2.0), ("flex-09^", 2.5), (REST, 1.0)]),
  "a10-flex": dict(segs=[("angry-10", 2.0), ("flex-04", 2.5), ("angry-10", 2.0), ("flex-06", 2.5), ("angry-10", 2.0), ("flex-04", 2.5), ("angry-10", 2.0), ("flex-06", 2.5), ("angry-10", 1.0)]),
  "a04-flex": dict(segs=[("angry-04", 2.0), ("flex-04", 2.5), ("angry-04", 2.0), ("flex-06", 2.5), ("angry-04", 2.0), ("flex-04", 2.5), ("angry-04", 2.0), ("flex-06", 2.5), ("angry-04", 1.0)]),
  # crossfade variants (fade= seconds of linear blend between neighbouring segments): a hard cut is not a webcam
  "a10-flex-fade": dict(fade=0.4, segs=[("angry-10", 2.0), ("flex-04", 2.5), ("angry-10", 2.0), ("flex-06", 2.5), ("angry-10", 2.0), ("flex-04", 2.5), ("angry-10", 2.0), ("flex-06", 2.5), ("angry-10", 1.0)]),
  "flex09-far-fade": dict(fade=0.4, segs=[(REST, 2.0), ("flex-09^", 2.5), (REST, 2.0), ("thumbs_up-04^", 2.5), (REST, 2.0), ("flex-09^", 2.5), (REST, 2.0), ("flex-09^", 2.5), (REST, 1.0)]),
  "flex09-far2": dict(segs=[(REST, 2.0), ("flex-09^", 2.5)] * 4 + [(REST, 1.0)]),
  "other-rest": dict(segs=[("angry-10", 2.0), ("thumbs_up-07", 2.5), ("angry-02", 2.0), ("flex-14", 2.5), ("angry-09", 2.0), ("yawn-19", 2.5), ("angry-03", 2.0), ("flex-09", 2.5), ("angry-11", 2.0), ("thumbs_up-04", 2.5), ("angry-12", 2.0)]),
}

def load(sid):
    base = sid.rstrip("~^")
    src = json.load(open(os.path.join(STILLS, base + ".json")))["source"]
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    if "~" in sid:
        im = ImageOps.mirror(im)
    return im

def render_im(im, far=False):
    W, H = 640, 480
    im = im.copy()
    im.thumbnail((W, H))
    if far:
        im = im.resize((int(im.width * 0.55), int(im.height * 0.55)), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), "white")
    canvas.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
    return canvas

def jpeg_bytes(im):
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=88)
    return buf.getvalue()

def build(outdir, name):
    c = CLIPS[name]
    out = os.path.join(outdir, f"e2e-{name}.mjpeg")
    events, t = [], 0.0
    fade = c.get("fade", 0)
    frames = [(render_im(load(sid), far="^" in sid), secs) for sid, secs in c["segs"]]
    with open(out, "wb") as f:
        for i, (sid, secs) in enumerate(c["segs"]):
            im, _ = frames[i]
            still = jpeg_bytes(im)
            n = int(round(secs * FPS))
            nf = int(round(fade * FPS)) if fade and i + 1 < len(frames) else 0
            for k in range(n):
                if k >= n - nf:
                    a = (k - (n - nf) + 1) / (nf + 1)
                    fr = Image.blend(im, frames[i + 1][0], a)
                    f.write(jpeg_bytes(fr))
                else:
                    f.write(still)
            base = sid.rstrip("~^")
            g = base.rsplit("-", 1)[0]
            if g in POS and KIND.get(base) == "ok" and not c.get("hard"):
                events.append({"gesture": g, "still": sid, "startMs": int(t * 1000), "endMs": int((t + secs) * 1000)})
            t += secs
    json.dump({"file": os.path.basename(out), "fps": FPS, "width": 640, "height": 480, "durationMs": int(t * 1000), "segments": [[s, d] for s, d in c["segs"]], "events": events}, open(os.path.join(outdir, f"e2e-{name}-labels.json"), "w"), indent=1)
    print(out, round(os.path.getsize(out) / 1e6, 1), "MB", round(t, 1), "s", len(events), "events")

if __name__ == "__main__":
    outdir = sys.argv[1]
    names = sys.argv[2:] or list(CLIPS)
    os.makedirs(outdir, exist_ok=True)
    for n in names:
        build(outdir, n)

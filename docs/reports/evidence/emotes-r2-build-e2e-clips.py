import io, json, os, sys
from PIL import Image, ImageOps
REPO="/Users/kalp/projects/emotes"
STILLS=os.path.join(REPO,"tests/fixtures/stills")
SRC=os.path.expanduser("~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/data/raw/gestures")
OUTDIR=sys.argv[1]; name=sys.argv[2]
FPS=30; W,H=640,480; REST="angry-04"
# suffix "~" = mirrored source image
CLIPS={
 "far": [(REST,2.0),("thumbs_up-07^",2.5),(REST,2.0),("flex-14^",2.5),(REST,2.0),("yawn-19^",2.5),(REST,2.0),("yawn-02^",2.5),(REST,2.0),("flex-04^",2.5),(REST,2.0),("thumbs_up-11^",2.5),(REST,2.0)],
 "tu04x4": [(REST,2.0),("thumbs_up-04",2.5)]*4+[(REST,1.0)],
 "tu17x4": [(REST,2.0),("thumbs_up-17",2.5)]*4+[(REST,1.0)],
 "hold-yawn":   [(REST,2.0),("yawn-12",10.0),(REST,2.0)],
 "hold-thumb":  [(REST,2.0),("thumbs_up-11",10.0),(REST,2.0)],
 "hold-flex":   [(REST,2.0),("flex-04",10.0),(REST,2.0)],
 "mirror":      [(REST,2.0),("thumbs_up-07~",2.5),(REST,2.0),("flex-14~",2.5),(REST,2.0),("yawn-19~",2.5),(REST,2.0),("cover_eyes-02~",2.5),(REST,2.0),("dab-01~",2.5),(REST,2.0)],
 "sweep":       [(REST,2.0),("flex-01",2.5),(REST,2.0),("thumbs_up-11",2.5),(REST,2.0),("yawn-02",2.5),(REST,2.0),("flex-04",2.5),(REST,2.0),("thumbs_up-13",2.5),(REST,2.0),("yawn-15",2.5),(REST,2.0)],
 "fast":        [(REST,2.0),("thumbs_up-07",1.2),("flex-14",1.2),("yawn-19",1.5),(REST,2.0)],
 "hard2":       [(REST,2.0),("cover_eyes-05",2.5),(REST,2.0),("dab-07",2.5),(REST,2.0),("angry-05",2.5),(REST,2.0),("cover_eyes-11",2.5),(REST,2.0),("dab-12",2.5),(REST,2.0),("angry-09",2.5),(REST,2.0)],
}
POS={"thumbs_up","flex","yawn"}
segs=CLIPS[name]
out=os.path.join(OUTDIR,f"e2e-{name}.mjpeg"); labels=os.path.join(OUTDIR,f"e2e-{name}-labels.json")
def frame(path, mirror, far=False):
    im=Image.open(path).convert("RGB")
    if mirror: im=ImageOps.mirror(im)
    im.thumbnail((W,H))
    if far: im=im.resize((int(im.width*0.55),int(im.height*0.55)), Image.LANCZOS)
    c=Image.new("RGB",(W,H),"white"); c.paste(im,((W-im.width)//2,(H-im.height)//2))
    b=io.BytesIO(); c.save(b,"JPEG",quality=88); return b.getvalue()
events=[]; t=0.0
with open(out,"wb") as f:
    for sid,secs in segs:
        mirror=sid.endswith("~"); far=sid.endswith("^"); base=sid.rstrip("~^")
        src=json.load(open(os.path.join(STILLS,base+".json")))["source"]
        j=frame(os.path.join(SRC,src), mirror, far)
        for _ in range(int(round(secs*FPS))): f.write(j)
        g=base.rsplit("-",1)[0]
        if base!=REST and g in POS:
            events.append({"gesture":g,"still":sid,"startMs":int(t*1000),"endMs":int((t+secs)*1000)})
        t+=secs
json.dump({"file":os.path.basename(out),"fps":FPS,"width":W,"height":H,"durationMs":int(t*1000),"segments":[[s,d] for s,d in segs],"events":events},open(labels,"w"),indent=1)
print(out, round(os.path.getsize(out)/1e6,1), "MB", t, "s", len(events), "events")

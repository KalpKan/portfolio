import io, json, os, sys
from PIL import Image
REPO="/Users/kalp/projects/emotes"
STILLS=os.path.join(REPO,"tests/fixtures/stills")
SRC=os.path.expanduser("~/Desktop/Out and About/Sidequest/Clash Royale Emote Bot/data/raw/gestures")
OUTDIR=sys.argv[1]; name=sys.argv[2]
FPS=30; W,H=640,480; REST="angry-04"
# name -> segments; negatives get no event (any fire = false trigger)
CLIPS={
 "hard": [(REST,2.0),("cover_eyes-02",2.5),(REST,2.0),("dab-01",2.5),(REST,2.0),("angry-01",2.5),(REST,2.0),("yawn-08",2.5),(REST,2.0),("angry-07",2.5),(REST,2.0)],
 "misses": [(REST,2.0),("thumbs_up-04",2.5),(REST,2.0),("thumbs_up-09",2.5),(REST,2.0),("yawn-05",2.5),(REST,2.0),("yawn-02",2.5),(REST,2.0),("thumbs_up-16",2.5),(REST,2.0)],
 "repeat": [(REST,1.5),("thumbs_up-07",2.0),(REST,1.3),("thumbs_up-07",2.0),(REST,1.3),("thumbs_up-07",2.0),(REST,1.5)],
}
POS={"thumbs_up","flex","yawn"}
segs=CLIPS[name]
out=os.path.join(OUTDIR,f"e2e-{name}.mjpeg"); labels=os.path.join(OUTDIR,f"e2e-{name}-labels.json")
def frame(path):
    im=Image.open(path).convert("RGB"); im.thumbnail((W,H))
    c=Image.new("RGB",(W,H),"white"); c.paste(im,((W-im.width)//2,(H-im.height)//2))
    b=io.BytesIO(); c.save(b,"JPEG",quality=88); return b.getvalue()
events=[]; t=0.0
with open(out,"wb") as f:
    for sid,secs in segs:
        src=json.load(open(os.path.join(STILLS,sid+".json")))["source"]
        j=frame(os.path.join(SRC,src))
        for _ in range(int(round(secs*FPS))): f.write(j)
        g=sid.rsplit("-",1)[0]
        if sid!=REST and g in POS and not (name=="hard"):
            events.append({"gesture":g,"still":sid,"startMs":int(t*1000),"endMs":int((t+secs)*1000)})
        t+=secs
json.dump({"file":os.path.basename(out),"fps":FPS,"width":W,"height":H,"durationMs":int(t*1000),"segments":[[s,d] for s,d in segs],"events":events},open(labels,"w"),indent=1)
print(out, os.path.getsize(out)/1e6, "MB", t, "s", len(events), "events")

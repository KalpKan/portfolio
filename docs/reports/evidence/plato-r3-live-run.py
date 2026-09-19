import requests, time, os, glob, json, sys, re
BASE='https://plato.kalpkan.com'
PDFS=os.path.expanduser('~/projects/plato-corpus/pdfs')
EV=os.path.expanduser('~/projects/plato-corpus/evidence/audit-r3-2026-09-19')
os.makedirs(EV,exist_ok=True)
rows=[]
files=sorted(glob.glob(PDFS+'/*.pdf'))
if len(sys.argv)>1: files=[f for f in files if any(a in f for a in sys.argv[1:])]
for p in files:
    name=os.path.basename(p); stem=name[:-4]
    s=requests.Session()
    t=time.time()
    r=s.post(BASE+'/upload',files={'pdf_file':open(p,'rb')},data={'force_refresh':'on'},allow_redirects=False,timeout=120)
    dt=time.time()-t
    loc=r.headers.get('Location','')
    row={'file':name,'upload_status':r.status_code,'location':loc,'upload_s':round(dt,1)}
    rv=s.get(BASE+'/review',timeout=60)
    row['review_status']=rv.status_code
    open(f'{EV}/{stem}.review.html','w').write(rv.text)
    if rv.status_code==200 and 'review' in loc:
        m=re.search(r'showing the saved result',rv.text); row['stale_banner']=bool(m)
        d=s.post(BASE+'/review',data={'lecture_section':'0','lab_section':'0','tutorial_section':'0'},timeout=60)
        row['download_status']=d.status_code; row['ctype']=d.headers.get('content-type')
        if d.status_code==200 and 'calendar' in (d.headers.get('content-type') or ''):
            open(f'{EV}/{stem}.ics','wb').write(d.content)
            row['ics_bytes']=len(d.content); row['vevents']=d.text.count('BEGIN:VEVENT')
        else:
            row['download_body']=d.text[:300]
    else:
        row['flash']=re.findall(r'class="flash[^"]*"[^>]*>\s*(.*?)\s*<',rv.text)[:2]
    rows.append(row); print(json.dumps(row)); sys.stdout.flush()
json.dump(rows,open(f'{EV}/live-run.json','w'),indent=1)

import glob,os,json,re,datetime,difflib
from icalendar import Calendar
import sys; sys.path.insert(0,'tests/corpus')
from score import norm_title
EV=os.path.expanduser('~/projects/plato-corpus/evidence/audit-r3-2026-09-19')
exact_n=exact_ok=time_n=time_ok=und_n=und_bad=0
for gp in sorted(glob.glob('tests/corpus/ground_truth/*.json')):
    g=json.load(open(gp)); stem=g['file'][:-4]
    cal=Calendar.from_ical(open(f'{EV}/{stem}.ics','rb').read())
    dues=[]
    for e in cal.walk('VEVENT'):
        if 'RRULE' in e: continue
        s=str(e.get('SUMMARY'))
        if not s.lower().endswith(' due'): continue
        ds=e.get('DTSTART').dt
        dues.append((s, ds.date() if isinstance(ds,datetime.datetime) else ds, ds.time() if isinstance(ds,datetime.datetime) else None))
    for a in g['assessments']:
        t=norm_title(a['title'])
        cands=[(difflib.SequenceMatcher(None,t,norm_title(re.sub(r'^[^:]*:\s*','',s)[:-4])).ratio(),s,d,tm) for s,d,tm in dues]
        best=max(cands,default=None,key=lambda x:x[0])
        if a.get('date_status')=='exact':
            exact_n+=1
            hit=[c for c in cands if c[0]>=0.5 and str(c[2])==a['due']]
            if hit:
                exact_ok+=1
                if a.get('due_time'):
                    time_n+=1
                    ok=hit[0][3] and hit[0][3].strftime('%H:%M')==a['due_time']
                    time_ok+=ok
                    if not ok: print('TIME',stem,'|',a['title'],a['due_time'],'->',hit[0][3])
            else: print('MISSING',stem,'|',a['title'],a['due'],'| best',best and (round(best[0],2),best[1],str(best[2])))
        elif a.get('date_status') in ('tba','registrar','range','recurring'):
            und_n+=1
            hits=[c for c in cands if c[0]>=0.6]
            if hits:
                # a dated event exists for an undated item: is it in the window / listed dates?
                for c in hits:
                    inwin = (a.get('dates') and str(c[2]) in a['dates']) or (a.get('window') and a['window'][0]<=str(c[2])<=a['window'][1])
                    print('UNDATED-GOT-EVENT',stem,'|',a['title'],a['date_status'],'->',c[1],c[2],'in-window' if inwin else 'OUTSIDE')
                    if not inwin: und_bad+=1
print(f'exact dated: {exact_ok}/{exact_n}  time right when stated: {time_ok}/{time_n}  undated items: {und_n}, outside-window events: {und_bad}')

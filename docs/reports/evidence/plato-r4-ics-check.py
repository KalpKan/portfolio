import glob,os,json,re,datetime
from icalendar import Calendar
EV=os.path.expanduser('~/projects/plato-corpus/evidence/audit-r4-2026-09-19')
OUT='/private/tmp/claude-501/-Users-kalp/6a491b3c-d386-4c83-9fec-6077672a40f8/scratchpad/plato-out'
today=datetime.date(2026,9,19)
tot=dict(files=0,events=0,no_dtstamp=0,no_uid=0,no_vtz=0,rrule=0,until_utc=0,sum_ok=0,on_today=0,on_term_end=0,parse_err=0)
per=[]
for p in sorted(glob.glob(EV+'/*.ics')):
    stem=os.path.basename(p)[:-4]
    ex=json.load(open(f'{OUT}/{stem}.json'))
    code=ex['course_code']; tend=ex['term']['end']
    try: cal=Calendar.from_ical(open(p,'rb').read())
    except Exception as e: tot['parse_err']+=1; print('PARSE ERR',stem,e); continue
    tot['files']+=1
    has_vtz=any(c.name=='VTIMEZONE' for c in cal.walk())
    tot['no_vtz']+= (not has_vtz)
    evs=[c for c in cal.walk('VEVENT')]
    row={'file':stem,'events':len(evs),'due':0,'rrule':0,'summaries':[]}
    for e in evs:
        tot['events']+=1
        if 'DTSTAMP' not in e: tot['no_dtstamp']+=1
        if 'UID' not in e: tot['no_uid']+=1
        s=str(e.get('SUMMARY')); row['summaries'].append(s)
        if code and s.startswith(code): tot['sum_ok']+=1
        ds=e.get('DTSTART').dt; d=ds.date() if isinstance(ds,datetime.datetime) else ds
        if 'RRULE' in e:
            tot['rrule']+=1; row['rrule']+=1
            u=e['RRULE'].get('UNTIL'); 
            if u and isinstance(u[0],datetime.datetime) and u[0].tzinfo is not None: tot['until_utc']+=1
            row.setdefault('until',[]).append(str(u[0]) if u else None)
        else:
            if d==today: tot['on_today']+=1; print('ON TODAY',stem,s)
            if str(d)==tend and 'due' in s.lower(): tot['on_term_end']+=1; print('ON TERM END',stem,s,d)
            if 'due' in s.lower(): row['due']+=1
    per.append(row)
print(json.dumps(tot,indent=1))
json.dump(per,open(EV+'/ics-check.json','w'),indent=1)

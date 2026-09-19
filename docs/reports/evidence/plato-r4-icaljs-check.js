const ICAL = require('ical.js'); const fs=require('fs'); const path=require('path');
const dir='/Users/kalp/projects/plato-corpus/evidence/audit-r4-2026-09-19';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.ics')).map(f=>path.join(dir,f)).concat([process.env.HOME+'/Downloads/HS_2610G_Winter2026_1827ac53.ics']);
let ok=0,ev=0,rr=0,errs=[];
for(const f of files){ try{ const jcal=ICAL.parse(fs.readFileSync(f,'utf8')); const comp=new ICAL.Component(jcal); const vevents=comp.getAllSubcomponents('vevent');
  for(const v of vevents){ const e=new ICAL.Event(v); ev++; if(!e.uid||!e.startDate) errs.push(f+': event without uid/dtstart'); if(e.isRecurring()){ rr++; const it=e.iterator(); let n=0; while(it.next()&&n<60)n++; if(n<1) errs.push(f+': recurrence yields 0'); }
    if(!v.getFirstPropertyValue('dtstamp')) errs.push(f+': no dtstamp'); }
  ok++; }catch(e){ errs.push(f+': '+e.message); } }
console.log(JSON.stringify({files:files.length,parsed:ok,events:ev,recurring:rr,errors:errs.slice(0,10)}));

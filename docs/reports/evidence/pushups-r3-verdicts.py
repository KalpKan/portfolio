# Per-rep verdicts on the page's own live trace (TRACE_DIR of e2e-corpus.mjs) vs ground_truth.json.
import json, sys, glob, os
gt = json.load(open('tests/fixtures/clips/ground_truth.json'))
tdir = sys.argv[1]
n = ok = 0; misses = []; allrows = []
for c in gt['clips']:
    p = os.path.join(tdir, c['id'] + '.json')
    if not os.path.exists(p): print('missing', p); continue
    fr = json.load(open(p))['frames']
    ev = [(f['mediaTime'], f['event']) for f in fr if f.get('event')]
    reps = [(t, e) for t, e in ev if e != 'partial']
    partials = [t for t, e in ev if e == 'partial']
    # first rep
    first = c['reps'][0]
    firstEv = reps[0][0] if reps else None
    # not-rep windows
    bad_nr = []
    for nr in c.get('not_reps', []):
        a, b = map(float, nr['t'].split('-'))
        inside = [t for t, e in reps if a <= t <= b + 0.3]
        if inside: bad_nr.append((nr['t'], inside))
    rows = []
    for i, r in enumerate(c['reps']):
        nxt = c['reps'][i + 1]['bottom_s'] if i + 1 < len(c['reps']) else 1e9
        cand = [(t, e) for t, e in reps if r['bottom_s'] <= t < nxt + 0.3]
        got = cand[0][1] if cand else None
        gotGood = None if got is None else got == 'good'
        match = gotGood is not None and gotGood == (r['form'] == 'good')
        if r['confidence'] == 'high':
            n += 1; ok += match
            if not match: misses.append(f"{c['id']} {r['bottom_s']}s label {r['form']} got {got}")
        rows.append(f"r{r['n']}@{r['bottom_s']} {r['form'][0]}/{r['confidence'][0]} -> {got}")
    print(f"{c['id']:15s} total {len(reps)} (want {c['total']}) good {sum(1 for _,e in reps if e=='good')} (want {c['good_min']}-{c['good_max']}) first-event {firstEv} (label bottom {first['bottom_s']}) partials {[round(t,1) for t in partials]} not-rep-violations {bad_nr}")
    print('    ' + '; '.join(rows))
print(f"\nhigh-confidence verdicts: {ok}/{n}")
for m in misses: print('  MISS', m)

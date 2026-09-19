#!/usr/bin/env bash
# Scan every git repo under ~/projects (full history, all branches) for the operator secrets in
# ~/.config/portfolio-ops/secrets.env (exact values, never printed) and for common key patterns.
# Usage: scripts/secret-scan.sh   (prints one line per repo; "EXACT:" hits are emergencies)
set -u
python3 - <<'PY'
import os,subprocess,re,glob
vals={}
p=os.path.expanduser("~/.config/portfolio-ops/secrets.env")
if os.path.exists(p):
    for line in open(p):
        if "=" in line and not line.startswith("#"):
            k,v=line.strip().split("=",1)
            if len(v)>=12 and k not in ("POSTHOG_HOST","NEON_PROJECT_ID"): vals[k]=v
pats={"jwt":r"eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}","openai":r"sk-[A-Za-z0-9]{20,}","posthog_personal":r"phx_[A-Za-z0-9]{20,}","neon":r"napi_[a-z0-9]{40,}","cloudflare":r"cfut_[A-Za-z0-9]{30,}","supabase_pat":r"sbp_[0-9a-f]{30,}","postgres_url":r"postgres(ql)?://[^\s'\"\[]+:[^\s'\"\[@]+@","private_key":r"-----BEGIN (RSA |EC )?PRIVATE KEY-----","uptimerobot":r"u[0-9]{6,7}-[0-9a-f]{32}","plantnet":r"2b10[A-Za-z0-9]{20}"}
for r in sorted(glob.glob(os.path.expanduser("~/projects/*"))):
    if not os.path.isdir(os.path.join(r,".git")): continue
    hist=subprocess.run(["git","-C",r,"log","-p","--all","--no-color"],capture_output=True,text=True,errors="ignore").stdout
    hits=[f"EXACT:{k}" for k,v in vals.items() if v in hist]
    hits+=[f"pattern:{k}x{len(set(re.findall(x,hist)))}" for k,x in pats.items() if re.search(x,hist)]
    tracked=subprocess.run(["git","-C",r,"ls-files"],capture_output=True,text=True).stdout.split("\n")
    envs=[t for t in tracked if re.search(r"(^|/)\.env(\.|$)",t) and not t.endswith(".example")]
    print(f"{os.path.basename(r):20} history={hits or 'clean'} tracked_env={envs or 'none'}")
print("Pattern hits need a human look (test fixtures match too); EXACT hits mean rotate the key now.")
PY

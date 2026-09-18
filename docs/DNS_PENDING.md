# DNS_PENDING — records to create once H1 (domain purchase) lands

_Status: **H1 done 2026-09-18, domain is `kalpkan.com`** (Cloudflare Registrar, zone id `288a6a2d07f7868c85faa8634f86b885`, Free plan, nameservers `carmelo.ns.cloudflare.com` / `sky.ns.cloudflare.com`). **Executed 2026-09-18 for the hub (apex + www) and hoops**; see §5. The remaining rows wait on their Vercel projects (and promptflip on H5)._

Written 2026-09-18 for Task T0.4 (`docs/superpowers/plans/2026-09-18-phase-0-foundation.md`). Source map: `docs/hosting-plan.md` §6 "DNS & subdomain map". Execution runbook: `skills/portfolio-ops/runbooks.md` → "Attach a domain to a Vercel project".

`<domain>` below is the apex Kalp buys (e.g. `kalpkansara.com`). Replace it everywhere before running anything.

## 1. Record table

All Vercel-target records are **DNS-only (grey cloud, `proxied: false`)**. Reason: Vercel terminates TLS itself and issues Let's Encrypt certificates by checking the record. With Cloudflare's orange-cloud proxy in front, Vercel cannot verify the domain or issue/renew the cert, and Cloudflare's "Flexible" SSL mode causes a redirect loop (Vercel KB "Can I use my domain on Vercel with A records?", https://vercel.com/kb/guide/a-record-and-caa-with-vercel, last updated 2026-07-28). Double-proxying also adds a hop for zero benefit, since Vercel already has its own CDN. `docs/hosting-plan.md` §6 states the same rule.

| Host (Cloudflare `name`) | Type | Target (`content`) | Proxy | Vercel project | Status |
|---|---|---|---|---|---|
| `@` (apex `kalpkan.com`) | A | `76.76.21.21` | DNS-only | `portfolio` (hub) | **done 2026-09-18** (§5) |
| `www` | CNAME | `a9e60d5e9d41cb23.vercel-dns-017.com` (project-specific value from `vercel domains verify`, overrides the general-purpose `cname.vercel-dns-0.com`) | DNS-only | `portfolio` (hub); Vercel redirects `www` → apex (308, set via API) | **done 2026-09-18** (§5) |
| `promptflip` | CNAME | `0e6549802006eaa1.vercel-dns-017.com` (observed in the zone 2026-09-18, record id `b65067376817169f88cb5c7a09052e63`, comment "Vercel project promptflip-35qv") | DNS-only | `promptflip-35qv` per the record comment. **Not created by the T0.4 execution task**; it was added by the parallel H5/promptflip task, which owns its §5 row and the §3 follow-ups (`NEXT_PUBLIC_APP_URL`, Supabase Auth redirect URLs) | record present; follow-ups per §3 owned by the promptflip task |
| `hoops` | CNAME | `71da701c9c3d8bdf.vercel-dns-017.com` (project-specific value from `vercel domains verify`) | DNS-only | `v0-basketball-analytics-dashboard` (to be re-linked / renamed in T1.1; if T1.1 creates a *new* Vercel project the CNAME value changes, re-run `verify` and PATCH the record) | **done 2026-09-18** (§5) |
| `plato` | CNAME | value printed by `vercel domains verify` (expect `<hash>.vercel-dns-017.com`) | DNS-only | `plato` (project not yet created, T1.3) | pending T1.3 |
| `plantit` | CNAME | value printed by `vercel domains verify` | DNS-only | `plantit` (project not yet created) | pending project |
| `pushups` | CNAME | value printed by `vercel domains verify` | DNS-only | `pushups` (project not yet created) | pending project |
| `emotes` | CNAME | value printed by `vercel domains verify` | DNS-only | `emotes` (project not yet created) | pending project |
| `microtubules` | CNAME | value printed by `vercel domains verify` | DNS-only | `microtubules` (project not yet created) | pending project |
| `status` | CNAME | — | — | UptimeRobot public status page | **deferred**: UptimeRobot's Free plan does not allow a custom domain on status pages (Solo plan, $9 USD/mo, is the minimum; verified uptimerobot.com/pricing 2026-09-18). Spend rule is $0, so the hub links to the `stats.uptimerobot.com/<id>` page instead. Revisit only if the plan changes. |
| Future GPU demo | CNAME | `hf.space` custom domain or Modal URL | DNS-only | — | not planned yet; add a row when a demo exists |

Rules:
- Create a record only when its Vercel project exists **and** the domain has been added to that project (`npx vercel domains add`). A CNAME pointing at Vercel for a hostname Vercel does not know about serves a Vercel 404 page.
- `www` is a real CNAME, not a Cloudflare redirect rule: Vercel wants both `<domain>` and `www.<domain>` on the `portfolio` project and handles the redirect itself (Vercel prompts for this when the apex is added in the dashboard; via CLI/API it is set explicitly, see §2 step 4).
- TTL: `1` (Cloudflare "Auto") for every record.
- Never add AAAA or a second A/CNAME for the same hostname; Vercel flags conflicting records as "Invalid Configuration".

### Where the target values come from (verified 2026-09-18)

- **Apex A `76.76.21.21`**: Vercel, "Setting up a custom domain" (https://vercel.com/docs/domains/set-up-custom-domain, last updated 2026-08-11) and KB "Can I use my domain on Vercel with A records?" (https://vercel.com/kb/guide/a-record-and-caa-with-vercel, last updated 2026-07-28). The KB says: "Always use the value shown in your project's domain card. For most projects that value is `76.76.21.21`."
- **Subdomain CNAME `cname.vercel-dns-0.com`**: same "Setting up a custom domain" page. **This differs from the value in the Phase 0 plan (`cname.vercel-dns.com`)**; the docs' current general-purpose value is `cname.vercel-dns-0.com`, so the docs' value is used here. The older `cname.vercel-dns.com` still resolves at the time of writing, but do not use it.
- **Per-project values override both**: Vercel's "Adding & Configuring a Custom Domain" page (https://vercel.com/docs/domains/working-with-domains/add-a-domain, last updated 2026-09-16) states "Each project has a unique CNAME record e.g. `d1d4fc829fe7bc7c.vercel-dns-017.com`" and that the domain card / `vercel domains inspect` output is the source of truth. **The executor must run `npx vercel domains inspect <host>` after adding each domain and use whatever A/CNAME value it prints**, falling back to the general-purpose values above only if `inspect` prints them. Record the value actually used in the "Executed" column of §5.
- **Cloudflare DNS record create API**: `POST /zones/{zone_id}/dns_records` with `Authorization: Bearer <token>`; body `type`, `name`, `content`, `ttl` (`1` = auto), `proxied` (boolean), `comment` (https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/create/). Zone id from `GET /zones?name=<domain>`. Token needs the "Edit zone DNS" template (H0 item 4).
- **Vercel www redirect via API**: `PATCH /v9/projects/{idOrName}/domains/{domain}` with `{"redirect": "<domain>", "redirectStatusCode": 308}` (https://vercel.com/docs/rest-api/projects/update-a-project-domain).

## 2. Execution sequence (run after H1, from `~/projects/portfolio`)

Prerequisites: `CLOUDFLARE_API_TOKEN` exported in the shell (from H0 item 4; never committed), `npx vercel whoami` returns Kalp's account, the domain shows "Active" in Cloudflare → Domain Registration, the zone uses Cloudflare nameservers (automatic for Registrar purchases), and **H5 is resolved** (STATUS.md) so the promptflip row targets the surviving Vercel project (`promptflip-35qv` if "keep 35qv"; `promptflip` only once its build is fixed).

```bash
export DOMAIN="<domain>"                       # e.g. kalpkansara.com
export CF_API="https://api.cloudflare.com/client/v4"
export VERCEL_TEAM="kks-projects-2edcb11a"     # team slug for "Kk's projects"

# 0. Zone id (once)
export ZONE_ID=$(curl -s "$CF_API/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0].id')
echo "$ZONE_ID"   # must be a 32-char hex id, not "null"

# 1. Hub: apex + www on the `portfolio` Vercel project
npx vercel domains add "$DOMAIN" portfolio --scope "$VERCEL_TEAM"
npx vercel domains add "www.$DOMAIN" portfolio --scope "$VERCEL_TEAM"
npx vercel domains inspect "$DOMAIN" --scope "$VERCEL_TEAM"        # read the A value it wants
npx vercel domains inspect "www.$DOMAIN" --scope "$VERCEL_TEAM"    # read the CNAME value it wants
export A_TARGET="<A value printed by inspect>"            # 76.76.21.21 for most projects
export CNAME_TARGET="<CNAME value printed by inspect>"    # cname.vercel-dns-0.com if inspect prints the general-purpose value

# 2. Cloudflare records for the hub (DNS-only), using the values inspect printed.
#    Dashboard equivalent: Cloudflare -> <domain> -> DNS -> Records -> Add record -> Type A, Name @, IPv4 $A_TARGET,
#    Proxy status OFF (grey cloud), TTL Auto, Save; then Type CNAME, Name www, Target $CNAME_TARGET, Proxy OFF, Save.
curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$A_TARGET\",\"ttl\":1,\"proxied\":false,\"comment\":\"Vercel hub (portfolio) - DNS-only so Vercel can issue TLS\"}"

curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d "{\"type\":\"CNAME\",\"name\":\"www\",\"content\":\"$CNAME_TARGET\",\"ttl\":1,\"proxied\":false,\"comment\":\"Vercel hub (portfolio) www -> apex redirect handled by Vercel\"}"

# 3. Wait for Vercel to verify (repeat until both say configured / no missing records)
npx vercel domains inspect "$DOMAIN" --scope "$VERCEL_TEAM"
npx vercel domains inspect "www.$DOMAIN" --scope "$VERCEL_TEAM"

# 4. Make www redirect to apex (308). Needs a Vercel token: `npx vercel whoami` works,
#    but the REST call needs VERCEL_TOKEN from https://vercel.com/account/tokens (never commit it).
#    Alternative with no token: Vercel dashboard -> portfolio -> Settings -> Domains -> www.<domain> -> Edit -> Redirect to <domain>, 308.
curl -s -X PATCH "https://api.vercel.com/v9/projects/portfolio/domains/www.$DOMAIN?slug=$VERCEL_TEAM" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d "{\"redirect\":\"$DOMAIN\",\"redirectStatusCode\":308}"

# 5. One subdomain per row of §1 -- run this block once per (SUB, PROJECT) pair whose Vercel project exists.
#    Pairs today: promptflip/<H5 survivor>. Later: hoops/<hoops project>, plato/plato, plantit/plantit,
#    pushups/pushups, emotes/emotes, microtubules/microtubules.
export SUB="promptflip"; export PROJECT="promptflip-35qv"   # H5: "keep 35qv" -> promptflip-35qv; "keep promptflip" -> promptflip (only after its build is fixed)
npx vercel domains add "$SUB.$DOMAIN" "$PROJECT" --scope "$VERCEL_TEAM"
npx vercel domains inspect "$SUB.$DOMAIN" --scope "$VERCEL_TEAM"   # read the CNAME value it wants
export CNAME_TARGET="<CNAME value printed by inspect for this host>"
#    Dashboard equivalent: Cloudflare -> <domain> -> DNS -> Records -> Add record -> Type CNAME, Name $SUB,
#    Target $CNAME_TARGET, Proxy status OFF (grey cloud), TTL Auto, Save.
curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d "{\"type\":\"CNAME\",\"name\":\"$SUB\",\"content\":\"$CNAME_TARGET\",\"ttl\":1,\"proxied\":false,\"comment\":\"Vercel project $PROJECT - DNS-only so Vercel can issue TLS\"}"
npx vercel domains inspect "$SUB.$DOMAIN" --scope "$VERCEL_TEAM"   # repeat until verified

# 6. Verify every host (docs/hosting-plan.md §10 item 1)
for h in "$DOMAIN" "www.$DOMAIN" "promptflip.$DOMAIN"; do
  echo "== $h"; dig +short "$h"; curl -sI "https://$h" | head -1
done
npx vercel certs ls --scope "$VERCEL_TEAM"
```

Expected: `dig` prints `76.76.21.21` for the apex and a `vercel-dns` hostname for the CNAMEs; `curl -sI https://<domain>` → `HTTP/2 200`; `curl -sI https://www.<domain>` → `HTTP/2 308` with `location: https://<domain>/`; `curl -sI https://promptflip.<domain>` → `HTTP/2 200`. Certificates can take a few minutes after DNS verifies.

If a `curl` to Cloudflare returns `"success": false`, read `errors[0].message`: code `81057` = record already exists (inspect with `GET /zones/$ZONE_ID/dns_records?name=<host>.$DOMAIN` and `PATCH` it instead of creating); `9109`/`10000` = token lacks DNS Write on this zone (re-create the token with the "Edit zone DNS" template covering this zone).

## 3. Follow-ups after the records resolve

1. **promptflip** (Vercel project `promptflip`):
   - Set `NEXT_PUBLIC_APP_URL=https://promptflip.<domain>` for the Production environment: `npx vercel env rm NEXT_PUBLIC_APP_URL production --yes && printf 'https://promptflip.%s' "$DOMAIN" | npx vercel env add NEXT_PUBLIC_APP_URL production` (run in `~/projects/promptflip`, which must be linked to the H5 survivor; piping the value keeps `env add` non-interactive), then redeploy: `npx vercel --prod --yes`.
   - Supabase (Project A, promptflip) → Authentication → URL Configuration: Site URL `https://promptflip.<domain>`; add `https://promptflip.<domain>/**` to Redirect URLs. Keep the `*.vercel.app` entries until the new host is confirmed working, then remove them.
   - Google Cloud console OAuth client: authorised JavaScript origin `https://promptflip.<domain>` (the redirect URI stays on Supabase's `/auth/v1/callback`; only add the origin). This is **H2** if the CLI cannot do it.
   - Runbook: `skills/portfolio-ops/runbooks.md` → "Re-point OAuth redirects" (written when that task lands) and "Attach a domain to a Vercel project".
2. **projects.json**: change each entry's `url` and `healthUrl` from `*.vercel.app` to the new host; redeploy the hub.
3. **UptimeRobot** (T0.3): monitors point at the new hosts; keep the `*.vercel.app` monitors for 24 h then delete them.
4. **PostHog** (T0.5): nothing to change; the snippet keys on host, so new hosts appear as new sites automatically.
5. **`skills/portfolio-ops/SKILL.md`** system-map table: replace "PENDING" hosts with the live ones; `architecture.md` DNS section: mark executed.
6. Move each row of §1 to "done" in §5 with the date, the exact target used, and the Cloudflare record id.

## 4. Things that are deliberately NOT done

- No Cloudflare proxy (orange cloud) on any Vercel record (see §1 reason).
- No Cloudflare Page Rule / Redirect Rule for `www`; Vercel owns that redirect.
- No wildcard `*.<domain>` record. Vercel wildcards need Vercel nameservers or an `_acme-challenge` NS delegation, and every subdomain here maps to a different project anyway.
- No `status.<domain>` (see the row in §1).
- No email (MX) records: the domain is not used for mail. If that changes, MX/TXT records are additive and unaffected by the above.

## 5. Executed log

Executed 2026-09-18 from `~/projects/portfolio` for `kalpkan.com` (zone `288a6a2d07f7868c85faa8634f86b885`). The zone was **empty** before execution (`GET /zones/{id}/dns_records` returned `count: 0`; Cloudflare Registrar seeded no parking records), so nothing was replaced or deleted.

What Vercel actually asked for (2026-09-18, CLI 59.23.2): `vercel domains inspect` printed `A kalpkan.com 76.76.21.21` for the apex; `vercel domains verify --json` ranked two A values (`216.198.79.1`, `64.29.17.1`) first and `76.76.21.21` second for the apex, and for every subdomain a **project-specific** CNAME `<hash>.vercel-dns-017.com` first with `cname.vercel-dns.com` second. The apex uses the single `76.76.21.21` (the value `inspect` printed and this plan's expected `dig` output; one record only, per the no-second-A rule). Subdomains use the project-specific CNAME, as the "Per-project values override both" note above requires. The general-purpose `cname.vercel-dns-0.com` was therefore never used.

| Host | Date | Target actually used | Cloudflare record id | Verified by (`dig` + `curl` output) |
|---|---|---|---|---|
| `kalpkan.com` (A) | 2026-09-18 | `76.76.21.21` | `ce04e091bc93b09e5f0a1dfd8782239f` | `dig +short kalpkan.com` → `76.76.21.21`; `curl -sI https://kalpkan.com \| head -1` → `HTTP/2 200`; `curl -s https://kalpkan.com/api/health` → `{"ok":true,"service":"hub","time":"2026-09-18T19:12:11.981Z"}`; `server: Vercel`; cert `cert_egPlm75fpv8BnF7JdaMOVVSp` (90 d, auto-renew) |
| `www.kalpkan.com` (CNAME) | 2026-09-18 | `a9e60d5e9d41cb23.vercel-dns-017.com` | `28d15d424dc483a68df3f7825e5e7352` | `dig +short www.kalpkan.com` → `a9e60d5e9d41cb23.vercel-dns-017.com.` then `216.198.79.1` / `64.29.17.1`; `curl -sI https://www.kalpkan.com` → `HTTP/2 308`, `location: https://kalpkan.com/`; cert `cert_a8RHbwQplhfsXFmZfGc9Ezed` |
| `hoops.kalpkan.com` (CNAME) | 2026-09-18 | `71da701c9c3d8bdf.vercel-dns-017.com` | `2aaae4538c91f055c9613907884f7531` | `dig +short hoops.kalpkan.com` → `71da701c9c3d8bdf.vercel-dns-017.com.` then `64.29.17.1` / `216.198.79.1`; `curl -sI https://hoops.kalpkan.com \| head -1` → `HTTP/2 200`; `server: Vercel`; cert `cert_eTirfriGuDAJjxCiOVJhEwrH` |
| `promptflip.kalpkan.com` (CNAME) | 2026-09-18 | `0e6549802006eaa1.vercel-dns-017.com` | `b65067376817169f88cb5c7a09052e63` | **not executed by this task** (observed in the zone and in `vercel certs ls` as `cert_QAufduOZKLgVC3Bvb9bon3qi` while verifying); the promptflip/H5 task records its own verification |

Notes from execution:
- **`www` → apex redirect (308)** was set with `PATCH https://api.vercel.com/v9/projects/portfolio/domains/www.kalpkan.com?slug=kks-projects-2edcb11a` and body `{"redirect":"kalpkan.com","redirectStatusCode":308}`. No separate `VERCEL_TOKEN` was needed: the bearer token the logged-in CLI stores in `~/Library/Application Support/com.vercel.cli/auth.json` (`.token`) is accepted by the REST API. Response: `"redirect":"kalpkan.com","redirectStatusCode":308,"verified":true`.
- **hoops needed a redeploy first.** `vercel domains add hoops.kalpkan.com v0-basketball-analytics-dashboard` failed with `Your project's latest production deployment has errored. Therefore, the domain cannot be assigned. (400)`: the newest production build (`v0-basketball-analytics-dashboard-946t9vobl`, 2026-04-15, from a git branch) had errored with "No Next.js version detected", while the production alias was serving the older Ready build `3k3444buk`. `vercel promote 3k3444buk` returned 409 (already current), so `npx vercel redeploy https://v0-basketball-analytics-dashboard-3k3444buk.vercel.app --scope kks-projects-2edcb11a --non-interactive` rebuilt the same source as a new production deployment (`v0-basketball-analytics-dashboard-ebyuwvmyr`, Ready in about 1 min, aliased to `v0-shootersshoot.vercel.app`), after which `domains add` succeeded. Nothing was deleted.
- TLS: apex and www answered over HTTPS within about a minute of the records being created; hoops within about 1.5 min of its record. All certs show `renew: yes` in `vercel certs ls`.
- After the records landed, `vercel domains verify` reports `www.kalpkan.com` and `hoops.kalpkan.com` as `configured_correctly` and `kalpkan.com` as `status: ok`, `reason: dns_change_recommended`, `misconfigured: false`: Vercel would prefer its newer apex pair (`216.198.79.1` + `64.29.17.1`) over `76.76.21.21`, but `76.76.21.21` is still fully supported (TLS issued, site serving). Leave it unless Vercel ever flips it to `invalid_configuration`; if that happens, PATCH record `ce04e091bc93b09e5f0a1dfd8782239f` to `216.198.79.1` and add a second A for `64.29.17.1` (that is the one case where two A records for the apex are correct).
- `vercel domains ls` reports `kalpkan.com` as Registrar "Third Party" / Nameservers "Third Party": expected, because the zone stays on Cloudflare nameservers by design (§1); Vercel's "intended nameservers" warning in `inspect` is informational and ignored.
- Still to do per §3: UptimeRobot monitors still point at the `*.vercel.app` hosts (keep for 24 h, then move with `PATCH /v3/monitors/<id>`); `hoops` has no `/api/health` route yet (`https://hoops.kalpkan.com/api/health` → 404), so `projects.json` keeps `healthUrl: null` for it.

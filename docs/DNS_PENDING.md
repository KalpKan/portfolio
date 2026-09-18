# DNS_PENDING — records to create once H1 (domain purchase) lands

_Status: **PENDING H1.** Nothing below has been executed. Until Kalp buys the `.com` at Cloudflare Registrar, every app stays on its `*.vercel.app` URL._

Written 2026-09-18 for Task T0.4 (`docs/superpowers/plans/2026-09-18-phase-0-foundation.md`). Source map: `docs/hosting-plan.md` §6 "DNS & subdomain map". Execution runbook: `skills/portfolio-ops/runbooks.md` → "Attach a domain to a Vercel project".

`<domain>` below is the apex Kalp buys (e.g. `kalpkansara.com`). Replace it everywhere before running anything.

## 1. Record table

All Vercel-target records are **DNS-only (grey cloud, `proxied: false`)**. Reason: Vercel terminates TLS itself and issues Let's Encrypt certificates by checking the record. With Cloudflare's orange-cloud proxy in front, Vercel cannot verify the domain or issue/renew the cert, and Cloudflare's "Flexible" SSL mode causes a redirect loop (Vercel KB, July 2026). Double-proxying also adds a hop for zero benefit, since Vercel already has its own CDN. `docs/hosting-plan.md` §6 states the same rule.

| Host (Cloudflare `name`) | Type | Target (`content`) | Proxy | Vercel project | Status |
|---|---|---|---|---|---|
| `@` (apex `<domain>`) | A | `76.76.21.21` | DNS-only | `portfolio` (hub) | pending H1 |
| `www` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `portfolio` (hub); Vercel redirects `www` → apex (308) | pending H1 |
| `promptflip` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `promptflip` | pending H1; then update `NEXT_PUBLIC_APP_URL` + Supabase Auth redirect URLs (§3) |
| `hoops` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `v0-basketball-analytics-dashboard` (to be re-linked / renamed in T1.1) | pending H1 + T1.1 |
| `plato` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `plato` (project not yet created, T1.3) | pending H1 + T1.3 |
| `plantit` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `plantit` (project not yet created) | pending H1 + project |
| `pushups` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `pushups` (project not yet created) | pending H1 + project |
| `emotes` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `emotes` (project not yet created) | pending H1 + project |
| `microtubules` | CNAME | `cname.vercel-dns-0.com` | DNS-only | `microtubules` (project not yet created) | pending H1 + project |
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

Prerequisites: `CLOUDFLARE_API_TOKEN` exported in the shell (from H0 item 4; never committed), `npx vercel whoami` returns Kalp's account, the domain shows "Active" in Cloudflare → Domain Registration, and the zone uses Cloudflare nameservers (automatic for Registrar purchases).

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

# 2. Cloudflare records for the hub (DNS-only). Replace content if `inspect` printed different values.
curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"A","name":"@","content":"76.76.21.21","ttl":1,"proxied":false,"comment":"Vercel hub (portfolio) - DNS-only so Vercel can issue TLS"}'

curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"www","content":"cname.vercel-dns-0.com","ttl":1,"proxied":false,"comment":"Vercel hub (portfolio) www -> apex redirect handled by Vercel"}'

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
#    Pairs today: promptflip/promptflip. Later: hoops/<hoops project>, plato/plato, plantit/plantit,
#    pushups/pushups, emotes/emotes, microtubules/microtubules.
export SUB="promptflip"; export PROJECT="promptflip"
npx vercel domains add "$SUB.$DOMAIN" "$PROJECT" --scope "$VERCEL_TEAM"
npx vercel domains inspect "$SUB.$DOMAIN" --scope "$VERCEL_TEAM"   # read the CNAME value it wants
curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d "{\"type\":\"CNAME\",\"name\":\"$SUB\",\"content\":\"cname.vercel-dns-0.com\",\"ttl\":1,\"proxied\":false,\"comment\":\"Vercel project $PROJECT - DNS-only so Vercel can issue TLS\"}"
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
   - Set `NEXT_PUBLIC_APP_URL=https://promptflip.<domain>` for the Production environment: `npx vercel env rm NEXT_PUBLIC_APP_URL production --yes && npx vercel env add NEXT_PUBLIC_APP_URL production` (run in `~/projects/promptflip`), then redeploy: `npx vercel --prod --yes`.
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

## 5. Executed log (fill in when H1 lands)

| Host | Date | Target actually used (from `inspect`) | Cloudflare record id | Verified by (`dig` + `curl` output) |
|---|---|---|---|---|
| — | — | — | — | — |

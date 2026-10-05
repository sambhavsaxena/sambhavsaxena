# Phase 5 — deploy, domain, analytics, ads

Ordered runbook. The Astro/wrangler commands at the top were run and verified;
everything from "Buy the domain" down is **dashboard work that only the user
can do** — it needs their Cloudflare, registrar, Google and Adsense logins.
Walk them through it, do not pretend to have done it.

## Cloudflare Pages — verified commands

```bash
npm install wrangler@latest --save-dev
npx astro add cloudflare --yes
```

Verified: `npx astro add cloudflare` rewrites `astro.config.mjs` to add
`adapter: cloudflare()`, writes `wrangler.jsonc`, and extends `tsconfig.json`
with `./worker-configuration.d.ts`. wrangler resolves to 4.x via npx.

**The adapter changes the build layout.** A static build emits `dist/`; with
the Cloudflare adapter it becomes `dist/client` + `dist/server`, and the
sitemap lands in `dist/client`. `verify.mjs` handles both, but any hand-rolled
path or CI step that assumes `dist/index.html` breaks here.

Login is interactive — it opens a browser:

```bash
npx wrangler login
```

Then add a deploy script to `package.json` and run it:

```json
"deploy": "astro build && wrangler pages deploy dist/client"
```

Connect the Pages project to GitHub in the dashboard so pushes redeploy, and
test the `*.pages.dev` URL before going further.

## Buy the domain — user action, last

The order is deliberate: **finish development first, then buy.** Compare
Hostinger / GoDaddy / BigRock / Cloudflare Registrar and take the cheapest
first-year price with a sane renewal.

Never purchase a domain on the user's behalf. Hand them the
`instantdomainsearch.com/get/<domain>` link from phase 1 and let them buy.

## Point the domain at Cloudflare — user action

1. Cloudflare → Add a site → enter the domain.
2. Delete every existing DNS record.
3. Add one `A` record pointing at a placeholder IP (`8.8.8.8`). Cloudflare
   needs a record to exist before it will activate the zone; Pages overrides
   it when the custom domain is attached.
4. At the registrar, replace the nameservers with **only** Cloudflare's two.
5. Back in Cloudflare, wait for the zone to go active. Propagation is minutes
   to hours.
6. Pages project → Settings → Custom domains → add both `example.com` and
   `www.example.com`.

Then verify the live URL and the deduplication:

```bash
curl -I https://<domain>/
```

The live host must **not** return `X-Robots-Tag: noindex`; the `.pages.dev`
host must. If both are clean, the `shouldNoindex` layout check and
`src/middleware.ts` from `build-spec.md` are not wired up.

Also set `site` in `astro.config.mjs` to the live URL before this deploy — the
sitemap and every canonical URL are generated from it.

## Google Analytics — user action

1. Create a property at https://marketingplatform.google.com/about/analytics/
   for the domain.
2. Copy the gtag snippet. **Do not click "Test Installation" yet.**
3. Ask the agent to add the snippet to `Layout.astro`'s `<head>`, then deploy.
4. Now click "Test Installation".

## Search Console — user action

1. https://search.google.com/search-console/ → add the domain property.
2. Choose "Any DNS provider", copy the TXT value.
3. Cloudflare → DNS → Records → add it as a `TXT` record → Verify.
4. Submit `https://<domain>/sitemap-index.xml` as the sitemap.
5. URL Inspection → paste the live URL → Request Indexing.
6. Bing Webmaster Tools → Import from Google → submit the URL.

## Adsense — only after ~10 users/day

1. https://adsense.google.com/ → add the site URL.
2. Verify ownership: the Adsense snippet goes in the `<head>`, and `ads.txt`
   goes in `public/`. Both only count once deployed.
3. Request review → Create consent message → pick the two-choice option →
   Submit.
4. Once approved: Adsense console → Ads → enable Auto Ads.

Applying before there is real traffic gets the application rejected, and a
rejection costs a waiting period. Wait for the traffic.

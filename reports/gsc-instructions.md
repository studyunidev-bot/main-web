# Google Search Console — Request Indexing Instructions

Property: **`https://thaibusinessmate.com`**

Follow these steps to request indexing for a URL in Google Search Console (GSC):

1. Open Google Search Console and select the property `https://thaibusinessmate.com`.
2. In the top search box, paste the exact URL you want to inspect (e.g. `https://thaibusinessmate.com/th/services/company-website`) and press Enter.
3. GSC will fetch the URL and show an inspection result. Observe the status:
   - `URL is on Google` — page is indexed.
   - `URL is on Google, but not indexed` or `Crawled - currently not indexed` — request indexing after verifying on-page SEO (see `context.md` §12).
   - `Discovered - currently not indexed` — ensure internal links + sitemap; then request indexing.
   - `Blocked by robots` or broken redirect — fix in code before requesting.
4. If the URL is not indexed and there is no blocking issue, click **Request indexing**.
5. Wait for Google's verification (may take from a few minutes to several weeks). Check Coverage / Page indexing reports later.
6. Repeat for high-priority URLs: homepage, core services, portfolio categories, top blog posts.

Suggested note when requesting indexing (optional):

"Updated SEO internal linking, canonical metadata, and sitemap coverage. Please recrawl and index if quality guidelines are met."

## Pre-request checklist (agent / dev)

- [ ] URL returns **200** (or correct **301** to canonical)
- [ ] `rel=canonical` points to preferred URL
- [ ] `robots` is `index, follow` (unless intentionally noindex)
- [ ] Page linked from homepage, footer, or hub page
- [ ] URL present in `/sitemap.xml`
- [ ] Legacy alternate URLs redirect with **301** (see `src/lib/legacy-redirects.ts`)

Full SEO/AEO/GEO rules for agents: **`context.md` section 12**.

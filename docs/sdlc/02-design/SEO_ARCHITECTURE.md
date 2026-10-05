# SEO Architecture

**Primary evidence (committed):** `seo/master-keyword-map.csv`, `seo/cannibalization-report.md`, `seo/url-audit.csv`, `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md`  
**Optional local:** `SEO_AEO_GEO_FULL_AUDIT.md`, `seo/_raw/` (not guaranteed after clone — see CURRENT_STATE.md)

---

## Core principle

```text
ONE PRIMARY SEARCH INTENT
→ ONE OWNER URL
```

Keyword ownership map: `seo/master-keyword-map.csv`  
Cannibalization review: `seo/cannibalization-report.md`

Do not assign the same primary commercial intent to multiple public URLs without an explicit SEO Change Request.

---

## Publication → HTTP behavior

```text
published     → HTTP 200 (public detail / listing as designed)
draft         → HTTP 404
missing       → HTTP 404
```

Soft-404 prevention is part of the structural baseline (`cleanup-audit/FINAL_STRUCTURE_REPORT.md`).

---

## Sitemap

- Published-only URLs
- Draft/unpublished content excluded
- Inventory cross-check: published DB vs sitemap routes; optional local dumps under `seo/_raw/` / `qa/db-vs-sitemap.csv` if present

---

## Canonical rules

- Canonicals built via absolute URL helpers (`ensureAbsoluteUrl` / site helpers)
- Production origin: `https://thaibusinessmate.com` (localhost stripped from public SEO fields)
- Local `NEXT_PUBLIC_SITE_URL` must not leak into production canonicals

Evidence: `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md` Part 4; optional local `qa/canonical-results.csv` if present.

---

## Robots

- Robots configuration must remain consistent with indexable vs noindex pages
- Example: `/workflow` treated as noindex in structure report
- Changes to robots require SEO gate

---

## Structured data

| Type | Source |
| --- | --- |
| Organization | `getCompanyConfig()` / layout |
| LocalBusiness | contact page + company config (hours from `openingHoursJson` post-SSOT hardening) |
| FAQPage | CMS `faqJson` / page FAQ where implemented |

No fake `aggregateRating` / review schema observed in baseline samples.

Company facts for org/local business **must** follow CompanyInfo SSOT (ADR-001).

---

## CompanyInfo → SEO

```text
CompanyInfo
  → getCompanyConfig()
  → generateMetadata (brand, description, OG, geo)
  → Organization / LocalBusiness schema
```

Cache: admin save invalidates company tag + layout revalidation.

---

## Metadata expectations (public pages)

For SEO-sensitive changes verify:

- Title
- Meta description
- Single clear H1 aligned to intent
- Canonical
- Indexability (robots meta / headers as applicable)
- Internal links do not create conflicting owners

Money pages (services) verified in baseline audit title/H1 samples.

---

## AEO / GEO

- FAQ JSON and answer-oriented fields support AEO where implemented
- Geo meta / area served helpers support local/GEO signals
- Full narrative audit: optional local `SEO_AEO_GEO_FULL_AUDIT.md` (not required after clone)

---

## Change control

Any change affecting public HTML, metadata, sitemap, robots, schema, or keyword owners must pass [SEO_GATE.md](../04-testing/SEO_GATE.md) before release.

---

## Related

- FR-015 … FR-017, NFR-006 … NFR-008
- [CURRENT_STATE.md](../CURRENT_STATE.md)

# SEO Gate

Required for public-facing changes (HTML, metadata, sitemap, robots, schema, slugs, publication state, internal links, keyword targeting).

---

## Principle

```text
ONE PRIMARY SEARCH INTENT → ONE OWNER URL
```

Consult `seo/master-keyword-map.csv` before changing titles/H1s/paths on money pages.

---

## Checklist (per affected URL)

```text
[ ] HTTP status correct (200 vs 404)
[ ] Title present and intent-aligned
[ ] H1 present and intent-aligned (single primary H1)
[ ] Canonical absolute and production-origin (no localhost leak)
[ ] Robots / indexability as intended
[ ] Sitemap inclusion/exclusion matches publication state
[ ] Structured data valid for page type (Organization/LocalBusiness/FAQ as applicable)
[ ] Internal links do not create conflicting primary owners
[ ] Keyword owner still correct (or CR explicitly reassigns ownership)
[ ] Dynamic 404 still works for draft/missing entities touched by the change
```

---

## Publication matrix reminder

```text
published → 200
draft     → 404
missing   → 404
sitemap   → published-only
```

---

## Company / schema SEO

If company facts or org schema change:

```text
[ ] Values come from CompanyInfo / getCompanyConfig()
[ ] Admin save invalidation path still works
[ ] No bootstrap overlay on steady-state DB data
```

---

## Pass criteria

```text
SEO GATE: PASS
No P0/P1 SEO regressions on owner/money pages in scope
```

Evidence examples: committed SEO maps + security/SEO audit; optional local CSVs/`qa/_evidence/` if present.

---

## Related

- [SEO_ARCHITECTURE.md](../02-design/SEO_ARCHITECTURE.md)
- `seo/cannibalization-report.md`

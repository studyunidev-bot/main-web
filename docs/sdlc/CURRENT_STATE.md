# Current State — Artifact Map

Maps repository evidence to SDLC stages.  
**Do not duplicate entire reports here — reference them.**

---

## Verified baseline pointer

See [BASELINE.md](./BASELINE.md).

```text
Historical Structural Base: a8711534ab52c229d1ef92ccc25c2805ee232e3b
Current Verified Application Baseline: 78be67c2d44b6f8ae621087d617bb1ed4ccdf302
```

---

## Evidence classes

### A. Required long-term repository evidence (committed / expected after clone)

| Path | SDLC use |
| --- | --- |
| `cleanup-audit/` | Structural / architecture baseline (already on structural base) |
| `qa/COMPANY_SSOT_HARDENING.md` | Company SSOT verification |
| `qa/company-settings-ssot.csv` | SSOT field ownership matrix |
| `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md` | Security + SEO integrity baseline |
| `qa/final-db-schema-integrity.md` | DB/Prisma integrity notes |
| `qa/TEST_PLAN.md` / `TEST_CASES.md` / `TEST_RESULTS.md` | Test process references |
| `seo/master-keyword-map.csv` | Keyword → owner URL governance |
| `seo/cannibalization-report.md` | Intent overlap analysis |
| `seo/url-audit.csv` | Public URL inventory |
| `seo/internal-link-map.csv` | Internal linking map |
| `seo/content-gap.md` | Content planning input |
| `docs/sdlc/` | This governance framework |

### B. Historical / local-only evidence (NOT guaranteed after clone)

These may exist on a developer machine from audit runs. SDLC docs may mention them as **optional local evidence** only.

| Path | Note |
| --- | --- |
| `qa/_evidence/` | HTTP/HTML/JSON capture dumps |
| `qa/_raw/` | Crawl/raw JSON dumps |
| `qa/*.mjs`, `qa/run-unit.ts`, `qa/_tmp-*.mjs` | Ephemeral local runners |
| `qa/canonical-results.csv`, `qa/url-regression-results.csv`, other one-off CSV/MD audits | Session-specific unless explicitly promoted |
| `seo/_raw/` | Sitemap/crawl dumps |
| `seo/scripts/` | Local inventory generators |
| `SEO_AEO_GEO_FULL_AUDIT.md` (repo root) | Large historical audit narrative |

When an optional path is missing after clone, use the committed curated files above and regenerate evidence under a Change Request as needed.

---

## Artifact → SDLC stage mapping

### `cleanup-audit/` (committed)

```text
cleanup-audit/
→ architecture / structural baseline evidence
```

### Curated `qa/` (committed subset)

```text
qa/ (curated)
→ testing / security / SSOT / regression process evidence
```

### Curated `seo/` (committed subset)

```text
seo/ (curated maps + reports)
→ SEO architecture / keyword ownership evidence
```

---

## Runtime / schema sources of truth (code)

| Concern | Location |
| --- | --- |
| Prisma models | `prisma/schema.prisma` (30 models) |
| Migrations | `prisma/migrations/` (includes `20260921020000_company_logo_hours`) |
| Company config reader | `src/features/company/services/company.service.ts` |
| Company admin mutation | `src/features/company/actions.ts` |
| Bootstrap fallback | `src/lib/site.ts` (`BOOTSTRAP_COMPANY_CONFIG`) |
| Locales | `src/lib/locales.ts` (`th`, `en`, `ja`, `zh`) |
| Auth | NextAuth (`src/app/api/auth/[...nextauth]/route.ts`) |

---

## Publication / SEO behavior (current)

```text
published → HTTP 200 (public detail)
draft / unpublished → HTTP 404
missing → HTTP 404
sitemap → published-only
```

Details: [02-design/SEO_ARCHITECTURE.md](./02-design/SEO_ARCHITECTURE.md).

---

## Gaps (documented, non-blocking)

- `Permissions-Policy` header missing
- Analytics abuse monitoring recommended
- Favicon / Instagram not in `CompanyInfo`
- Application security baseline ≠ penetration test

---

## Change control

```text
Next Change ID: CR-2026-001
```

No feature or structural change without a Change Request from this freeze onward.

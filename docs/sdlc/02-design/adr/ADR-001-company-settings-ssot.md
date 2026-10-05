# ADR-001: Company Settings Single Source of Truth (SSOT)

**Status:** Accepted  
**Date:** 2026-09-21  
**Deciders:** ThaiBusinessMate engineering (verified local hardening)

---

## Context

Company business facts (phone, email, address, social links, and related fields) were previously duplicated across:

- Database `CompanyInfo`
- Hardcoded / `SITE_CONFIG`-style values in `src/lib/site.ts`
- Occasional consumer-level fallbacks that could overlay steady-state DB data

This created risk of frontend / metadata / structured data drift and unclear ownership during admin edits vs code defaults.

Audit evidence: `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md` (Company Settings parts),  
post-hardening: `qa/COMPANY_SSOT_HARDENING.md`.

---

## Decision

```text
CompanyInfo = authoritative SSOT
BOOTSTRAP_COMPANY_CONFIG = bootstrap-only fallback
```

### Included ownership (CompanyInfo)

```text
logoUrl
openingHoursJson
contact / business facts
(names, phone, email, addresses, geo, social links, tax/founding fields as modeled)
```

### Reader

- `getCompanyConfig()` in `src/features/company/services/company.service.ts`
- Maps DB row authoritatively when present
- Uses `BOOTSTRAP_COMPANY_CONFIG` only when the DB row is missing or the query fails
- Must **not** apply production-fact overlays (`|| SITE_CONFIG.telephone` style) on steady-state DB values

### Writer

- Admin Company Settings → `updateCompanyInfoAction` (validated, authorized)

### Cache behavior

```text
Admin save
→ updateTag(COMPANY_CONFIG_TAG)
→ revalidatePath("/", "layout")
→ frontend / metadata / schema refresh
```

---

## Consequences

### Positive

- One writable authority for company facts
- Admin edits propagate through supported cache invalidation
- Metadata and Organization/LocalBusiness schema stay aligned with DB at steady state

### Trade-offs (expected)

```text
Direct DB changes may remain cached until rebuild/revalidation.
This is expected and supported.
```

Raw Prisma/SQL edits that bypass admin actions do **not** automatically invalidate ISR/tag cache.

### Non-goals / remaining non-blockers

- Favicon may remain filesystem-based
- Instagram field may be absent
- `areasServed` / some marketing SEO helpers may remain bootstrap or env constants (not contact-fact duplicates)

---

## Note on git baseline

```text
Historical Structural Base: a871153 (predates this ADR)
Current Verified Application Baseline: 78be67c
  (includes CompanyInfo.logoUrl / openingHoursJson + BOOTSTRAP-only fallback)
```

See `docs/sdlc/BASELINE.md`.

---

## References

- `src/lib/site.ts`
- `src/features/company/services/company.service.ts`
- `src/features/company/actions.ts`
- `src/app/admins/pages/settings/_components/company-settings-form.tsx`
- `qa/COMPANY_SSOT_HARDENING.md`
- `qa/company-settings-ssot.csv`
- FR-009, FR-010, FR-011, NFR-012

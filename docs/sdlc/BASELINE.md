# Verified System Baseline

**Project:** ThaiBusinessMate  
**Purpose:** Record the controlled baselines this SDLC framework governs.

---

## Baseline commits (distinct)

```text
Historical Structural Base:
a8711534ab52c229d1ef92ccc25c2805ee232e3b

Message:
chore: finalize clean ThaiBusinessMate structural base

Current Verified Application Baseline:
78be67c2d44b6f8ae621087d617bb1ed4ccdf302

Message:
refactor: harden CompanyInfo single source of truth

Current SDLC Governance Baseline:
Commit message: docs: establish ThaiBusinessMate SDLC foundation
(resolve hash with: git log -1 --format=%H --grep='establish ThaiBusinessMate SDLC foundation')
```

| Baseline | Meaning |
| --- | --- |
| Historical Structural Base (`a871153`) | Clean structure / copy-repo gate. Predates Company SSOT hardening and SDLC docs. |
| Current Verified Application Baseline (`78be67c`) | CompanyInfo SSOT hardening + logo/hours ownership + bootstrap-only fallback + related consumers. **Application baseline to extend from.** |
| Current SDLC Governance Baseline | Formal SDLC docs + curated long-term evidence. **Process baseline for all future Change Requests.** |

---

## Verification summary (application baseline)

| Area | Result |
| --- | --- |
| STRUCTURE | PASS |
| DATABASE / PRISMA | PASS |
| FRESH DATABASE MIGRATION | PASS |
| EXISTING PROD-SNAPSHOT DATABASE | PASS |
| DYNAMIC 404 | PASS |
| SEO FOUNDATION | PASS |
| COMPANY SETTINGS SSOT | PASS |
| APPLICATION SECURITY BASELINE | PASS WITH DOCUMENTED NON-BLOCKING HARDENING |
| BUILD | PASS |
| TYPECHECK | PASS |

Condensed:

```text
DB / Prisma: PASS
Migration: PASS (includes 20260921020000_company_logo_hours)
Dynamic 404: PASS
CompanyInfo SSOT: PASS
SEO Foundation: PASS
Security Baseline: PASS WITH DOCUMENTED HARDENING
Build: PASS
Typecheck: PASS
```

---

## Company Settings architecture (verified)

```text
CompanyInfo = authoritative source of truth

Owns (among supported fields):
- phone / email
- address / company information
- logoUrl
- openingHoursJson
- other supported company fields

BOOTSTRAP_COMPANY_CONFIG
= bootstrap / fallback only (DB missing or query failure)

No production fact overlay on steady-state DB data
```

### Supported cache workflow

```text
Admin Save
→ updateTag(COMPANY_CONFIG_TAG)
→ revalidatePath("/", "layout")
→ frontend / metadata / schema refresh
```

Raw direct DB edits **not** invalidating ISR automatically is **expected and supported**.

Curated evidence in-repo:

- `qa/COMPANY_SSOT_HARDENING.md`
- `qa/company-settings-ssot.csv`

---

## Security baseline caveat

```text
Application security baseline is NOT a penetration test.
Documented non-blocking hardening may include:
- Permissions-Policy header
- analytics abuse monitoring
```

Primary curated evidence: `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md` (committed with SDLC evidence set when present).

---

## What this baseline does NOT authorize

- Production database writes
- Deployment
- Changing SEO keyword ownership without SEO gate
- Manual Production schema edits

---

## Evidence policy

See [CURRENT_STATE.md](./CURRENT_STATE.md) for **committed curated evidence** vs **local-only audit artifacts** (not guaranteed after clone).

---

## Next change control

From this freeze onward, no feature/structural work begins without a Change Request.

```text
Next Change ID: CR-2026-001
```

Workflow: Change Request → Requirements → Impact → Design (if needed) → Implementation → Testing → Security Gate → SEO Gate → Release Gate → Explicit Deploy Approval → Production Smoke → Close CR.

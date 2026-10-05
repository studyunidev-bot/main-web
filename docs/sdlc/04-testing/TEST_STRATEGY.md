# Test Strategy

**Evidence roots (committed):** curated `qa/` + `seo/` maps, `cleanup-audit/`, `docs/sdlc/`  
**Baseline plan reference:** `qa/TEST_PLAN.md`, `qa/TEST_CASES.md`, `qa/TEST_RESULTS.md`  
**Optional local dumps:** `qa/_evidence/`, `qa/_raw/`, `seo/_raw/` (see CURRENT_STATE.md)

---

## Important clarification

```text
This project’s verified baseline relies primarily on:
- Scripted / manual QA runners (local HTTP fetch; optional local `qa/*.mjs` if present)
- Build + TypeScript checks
- Audit documents and CSV evidence

Do NOT claim a comprehensive automated Unit Test suite as a release gate
unless such tests are actually present and maintained.
```

---

## Test layers

| Layer | Purpose | Typical method | Automation level |
| --- | --- | --- | --- |
| Functional | Feature behaves per acceptance criteria | Manual + local server + Prisma `[TEST]` data | Partial scripts |
| Integration | Actions ↔ DB ↔ UI paths | Admin save → frontend/metadata observation | Partial scripts |
| Regression | Prior money pages / URLs still correct | URL crawl CSVs, keyword checks | Scripted crawl |
| Database | Schema drift, migrations, integrity | `prisma migrate`, `migrate diff`, integrity notes | CLI + docs |
| SEO | HTTP/title/H1/canonical/sitemap/schema/owners | SEO gate checklist + seo/ maps | Scripted + manual |
| Security | AuthN/Z, validation, upload, headers | Security gate + baseline audit probes | Manual/scripted probes |
| Build | Production build succeeds | `npm run build` | Automated command |
| Typecheck | TS correctness | `npx tsc --noEmit` | Automated command |
| Production Smoke | Post-deploy critical paths | See Deployment / Release checklist | Manual (authorized) |

---

## Environments

| Env | Use |
| --- | --- |
| Local MySQL (`127.0.0.1`, e.g. `db_tbm_local`) | Default verification |
| Fresh empty DB | Migration bootstrap tests |
| Prod-snapshot clone | Compatibility / content realism |
| Production | **Only** with explicit authorization |

Hard gate: do not run destructive CMS/DB experiments against Production.

---

## Required for every code change

1. Typecheck PASS  
2. Build PASS  
3. Functional checks for touched acceptance criteria  
4. Security and/or SEO gate when risk applies  

---

## Test data hygiene

- Prefer `[TEST]` prefixed records
- Snapshot before/after when mutating (store under Change Request evidence; optional local `qa/_evidence/`)
- Clean up leftover test data before close of CR
- Never leave test company phone/email on shared DBs

---

## Related templates

- [TEST_CASE_TEMPLATE.md](./TEST_CASE_TEMPLATE.md)
- [SECURITY_GATE.md](./SECURITY_GATE.md)
- [SEO_GATE.md](./SEO_GATE.md)

# Security Gate

Risk-based checklist before releasing changes that touch auth, mutations, uploads, HTML, SQL, secrets, or headers.

> Baseline ≠ penetration test. Expand depth for HIGH/CRITICAL risk changes.

---

## When mandatory

- Change type `SECURITY`
- New/changed admin APIs or Server Actions
- Upload / file handling
- AuthN/AuthZ / roles
- Public write endpoints
- HTML rendering of user/CMS content
- Raw SQL introduction
- Header / middleware security changes
- Payment / PII flows

---

## Checklist

```text
[ ] Authentication
    - Unauthenticated users cannot reach protected mutations/APIs

[ ] Authorization
    - Authenticated but unauthorized roles cannot perform privileged actions
    - Object access checked (no trivial IDOR on new endpoints)

[ ] IDOR
    - IDs in URLs/body cannot access other users’/tenants’ resources

[ ] Input validation
    - Zod (or equivalent) rejects malformed payloads
    - Server does not trust client-only checks

[ ] XSS
    - HTML sanitized on allowlisted paths
    - Dangerous tags/attrs blocked on sample payloads

[ ] Upload
    - Auth required
    - Type/size constraints enforced
    - Stored/served paths cannot be abused for execution/traversal beyond design

[ ] Raw SQL
    - No string-concatenated SQL
    - Parameterized only (prefer Prisma)

[ ] Secrets
    - No secrets in commits, logs, or client bundles
    - Env usage correct for local vs production intent

[ ] Headers
    - Existing security headers retained
    - Permissions-Policy debt acknowledged if still missing
```

---

## Risk escalation

| Risk | Extra expectations |
| --- | --- |
| LOW | Checklist review + build/typecheck |
| MEDIUM | Probe unauth + invalid input on touched surfaces |
| HIGH / CRITICAL | Expanded IDOR matrix, upload abuse cases, dual-role tests, explicit evidence under `qa/` |

---

## Pass criteria

```text
SECURITY GATE: PASS
No open P0/P1 security defects in change scope
```

Fail → do not release.

---

## Related

- [SECURITY_ARCHITECTURE.md](../02-design/SECURITY_ARCHITECTURE.md)
- `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md`

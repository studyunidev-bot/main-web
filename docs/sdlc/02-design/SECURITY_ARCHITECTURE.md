# Security Architecture

**Source:** Verified local application security baseline  
**Primary evidence:** `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md`

> **Application security baseline is not a penetration test.**

---

## Baseline status

```text
APPLICATION SECURITY BASELINE:
PASS WITH DOCUMENTED NON-BLOCKING HARDENING
```

---

## Authentication

- Admin: NextAuth credentials against `AdminUser` (`/api/auth/[...nextauth]`, `/auth/sign-in`)
- Customer: shop account authentication and password reset token flows
- Admin password reset via `PasswordResetToken`

Unauthenticated access to protected admin surfaces shall be rejected (baseline PASS on sampled paths).

---

## Authorization

- Admin mutations and admin APIs require authenticated admin session
- Company Settings updates restricted as implemented (Super Admin path in audit)
- Baseline probes PASS — **not** a full IDOR penetration suite

High-risk changes (new IDOR surfaces, role changes, public write endpoints) require expanded [SECURITY_GATE](../04-testing/SECURITY_GATE.md) testing.

---

## Admin mutation protection

- Server Actions under `src/features/**/actions*` perform session/auth checks before mutating
- Public writes limited to justified surfaces (e.g. contact form, analytics track, customer shop flows)

---

## Upload authentication

- `/api/admin/upload-image` requires admin authentication
- Baseline upload controls PASS (type/size/auth as implemented)
- Served via `/api/images/[...path]` / public paths — treat new upload paths as high risk

---

## Input validation

- Zod schemas on admin/CMS/company/shop mutation inputs
- Client input is not trusted raw into Prisma without parse/guards (baseline PASS)

---

## HTML sanitization

- `isomorphic-dompurify` allowlist on HTML content paths
- XSS baseline PASS (unit payload re-verify in audit) — not a full XSS lab

---

## Raw SQL policy

- Prefer Prisma Client
- Any raw SQL must be parameterized
- Audit: no unsafe raw concatenation found (PASS)

---

## Secret handling

- Secrets via environment variables (`.env` local; not committed)
- Tracked-file secret check PASS in baseline
- Never commit API keys, DB URLs with credentials, or webhook secrets

---

## Security headers

Baseline: security headers present with documented gap:

| Item | Baseline note |
| --- | --- |
| Core headers | PASS as audited |
| Permissions-Policy | **MISSING** (documented hardening debt) |

Other documented hardening/debt may include:

- Analytics abuse monitoring

These are **non-blocking** for the recorded baseline but must be tracked for future SECURITY-type changes.

---

## What this architecture does not claim

- Full penetration test
- Complete IDOR matrix across all shop/admin IDs
- Guaranteed absence of all XSS/CSRF classes beyond reviewed paths
- Production monitoring/WAF configuration (ops concern)

---

## Related

- [SECURITY_GATE.md](../04-testing/SECURITY_GATE.md)
- NFR-001 … NFR-005

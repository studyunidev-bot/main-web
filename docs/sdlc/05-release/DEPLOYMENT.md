# Deployment

This document defines **process only**. It does not authorize any specific deploy.

---

## Authorization

```text
Deploy ONLY when explicitly authorized for the Change ID.
Default for agents and routine work: DO NOT DEPLOY.
```

---

## Preconditions

1. [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) all hard gates PASS  
2. Rollback plan filled for this release  
3. Production secrets/env confirmed by human operator  
4. Database backup considered if migrations or data writes apply  
5. Maintenance window communicated if needed  

---

## Recommended order

```text
1. Confirm release candidate (git tag/commit SHA)
2. Backup Production DB (if DB impact)
3. Run migrations via Prisma (controlled) — never manual DDL
4. Deploy application build
5. Smoke test (see below)
6. Monitor errors / critical URLs
7. Record changelog entry per CHANGELOG_POLICY
```

---

## Smoke test (minimum)

```text
[ ] Home `/th` returns 200
[ ] One money service page returns 200 with expected title
[ ] One blog or portfolio published URL returns 200
[ ] Draft/missing sample still 404 if tested on non-prod or safe fixture
[ ] Admin sign-in works
[ ] Company contact facts visible (phone/email) match CompanyInfo expectation
[ ] Sitemap reachable
```

Expand for shop/payment releases.

---

## Environments

| Step | Local | Staging (if any) | Production |
| --- | --- | --- | --- |
| Build/typecheck | Required | Required | Required pre-deploy |
| Migrations | Verify first | Verify | Controlled only |
| Content experiments | Allowed with cleanup | Careful | Forbidden without CR |

---

## Forbidden

- Deploying with failing build/typecheck
- Manual Production schema edits
- Deploying with open P0/P1
- Silent keyword-owner changes
- Skipping rollback readiness for DB releases

---

## Related

- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
- [AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md)

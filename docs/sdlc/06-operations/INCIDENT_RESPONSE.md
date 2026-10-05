# Incident Response

---

## Severity levels

| Severity | Definition | Examples | Response target |
| --- | --- | --- | --- |
| **SEV-1** | Site down or critical security/data breach | Homepage 500s sitewide; auth bypass; DB unavailable; leaked secrets in prod | Immediate all-hands |
| **SEV-2** | Major feature broken or serious SEO/security regression | Checkout down; admin cannot publish; money pages soft-404; mass wrong canonicals | Urgent same-day |
| **SEV-3** | Limited impact defect | Single locale bug; non-owner page metadata issue; elevated but contained errors | Scheduled fix |
| **SEV-4** | Minor / cosmetic | Copy typo; minor UI alignment | Backlog |

---

## Response flow

```text
1. Detect & declare severity
2. Contain (feature disable, rollback, credential rotate, take offline if needed)
3. Communicate impact to stakeholders
4. Diagnose root cause
5. Resolve (fix forward or rollback — see ROLLBACK_PLAN)
6. Verify (smoke + relevant security/SEO gates)
7. Record incident report
8. Prevention actions → Change Requests
```

---

## Incident record template

```text
Incident ID:     INC-YYYYMMDD-###
Date/time:
Severity:        SEV-1 | SEV-2 | SEV-3 | SEV-4
Status:          Open | Mitigated | Resolved | Closed

Impact:
-

Root cause:
-

Containment:
-

Resolution:
-

Verification:
-

Prevention:
-

Related Change IDs:
Related commits/deploy:
```

---

## Notes

- Prefer rollback for SEV-1 when forward-fix is uncertain
- DB incidents: backup-first thinking; avoid destructive “fixes” on Production without authorization
- SEO SEV-2: restore owner titles/canonicals quickly; document keyword map updates

---

## Related

- [ROLLBACK_PLAN.md](../05-release/ROLLBACK_PLAN.md)
- [SECURITY_GATE.md](../04-testing/SECURITY_GATE.md)

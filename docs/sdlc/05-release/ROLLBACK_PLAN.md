# Rollback Plan

Separate rollback strategies. **Never assume destructive migrations are automatically reversible.**

---

## 1. Code rollback

```text
Redeploy previous known-good application revision (commit SHA / image / build artifact).
Confirm smoke tests on prior version.
```

Use when: UI bugs, logic regressions, SEO template mistakes without irreversible DB changes.

---

## 2. Database rollback / forward-fix

| Approach | When |
| --- | --- |
| **Forward-fix migration** | Preferred for Production: add corrective migration |
| **Restore from backup** | Data corruption / catastrophic failed migration |
| **Down migration** | Only if explicitly written, tested, and authorized |

```text
Never assume prisma migrate automatically reverses destructive changes
(drop column/table, data deletion, type narrowing).
```

Before Production migrations:

- Backup
- Test migrate on prod-snapshot clone
- Document forward-fix path in the Change Request

---

## 3. Content rollback

```text
Restore prior CMS fields (title, slug, published flag, body, faqJson)
from backup, admin history, or Change Request evidence snapshots (optional local `qa/_evidence/` if present).
Re-publish carefully; verify 404/200 and sitemap.
```

Use when: bad content publish, accidental unpublish, slug mistakes.

---

## 4. Configuration rollback

```text
Revert env vars / hosting config / feature flags to last known-good.
Revert CompanyInfo via Admin Settings (supported cache invalidation path)
or restore DB row then invalidate cache / rebuild if raw restore used.
```

Company cache note: raw DB restore may need `updateTag` path, redeploy, or rebuild to refresh ISR.

---

## Rollback decision record (fill per incident/release)

```text
Change ID / Incident ID:
Failed component: CODE | DATABASE | CONTENT | CONFIG
Rollback method:
Backup used: YES / NO
Verification steps:
Time restored:
Remaining risk:
```

---

## Related

- [INCIDENT_RESPONSE.md](../06-operations/INCIDENT_RESPONSE.md)
- [DATABASE_ARCHITECTURE.md](../02-design/DATABASE_ARCHITECTURE.md)

# Release Checklist

Release **cannot proceed** unless all gates below are satisfied.

---

## Hard gates

```text
[ ] Build PASS (`npm run build`)
[ ] Typecheck PASS (`npx tsc --noEmit`)

[ ] P0 = 0
[ ] P1 = 0

[ ] Security gate PASS (if applicable; mandatory for security-risk changes)
[ ] SEO gate PASS (if public-facing)

[ ] Migration reviewed (if any)
[ ] Backup considered (if Production DB touch)

[ ] Rollback plan ready
[ ] Smoke test ready
```

---

## Pre-release confirmation

```text
[ ] Change Request completed with acceptance criteria
[ ] Definition of Done checked
[ ] Company SSOT / cache impact understood
[ ] Keyword ownership unchanged OR explicitly approved
[ ] Production authorization recorded (YES/NO)
[ ] Deploy authorization recorded (YES/NO)
```

---

## Go / No-Go

| Result | Action |
| --- | --- |
| All hard gates PASS + authorized | Proceed per [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Any hard gate FAIL | **No-Go** — fix or roll back candidate |
| Unauthorized Production | **Stop** |

---

## Post-release (when deployed)

```text
[ ] Smoke tests executed
[ ] Critical money pages HTTP 200
[ ] Admin login works
[ ] No unexpected 500s on critical paths
[ ] Incident channel ready if SEV declared
```

---

## Related

- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
- [DEFINITION_OF_DONE.md](../03-development/DEFINITION_OF_DONE.md)

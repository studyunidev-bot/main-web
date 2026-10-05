# Definition of Done

A change is **Done** only when all applicable items are checked.

```text
[ ] Requirement completed (SRS / Change Request)
[ ] Acceptance criteria passed
[ ] Typecheck passed (`npx tsc --noEmit`)
[ ] Build passed (`npm run build`)
[ ] Functional tests passed
[ ] Regression passed (relevant surfaces)
[ ] DB migration verified if applicable
[ ] Existing DB compatible (if schema changed)
[ ] Fresh DB compatible if schema changed
[ ] Security impact reviewed (SECURITY_GATE if warranted)
[ ] SEO impact reviewed (SEO_GATE if public-facing)
[ ] Cache behavior verified (tags / revalidatePath / expected staleness)
[ ] Documentation updated (SDLC / ADR / evidence as needed)
[ ] Rollback considered (code / DB / content / config)
```

---

## Not Done if

- Production was modified without authorization
- Build or typecheck failed
- P0/P1 defects remain for the change scope
- Keyword ownership violated without approved SEO CR
- Company facts written as live overlays in bootstrap/SITE_CONFIG
- Schema changed without migration + dual DB verification

---

## Agent reminder

Report DoD status explicitly.  
**STOP before Production** unless authorized (`AGENT_WORKFLOW.md`).

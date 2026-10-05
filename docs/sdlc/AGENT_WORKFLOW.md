# Agent Workflow (Coding Agents)

Every coding agent working on ThaiBusinessMate **must** follow this sequence.  
History, prior chats, or “quick fixes” never bypass these steps.

---

## Mandatory sequence

```text
1. Read SDLC README
   docs/sdlc/README.md

2. Identify or create Change ID
   Use docs/sdlc/01-planning/CHANGE_REQUEST_TEMPLATE.md

3. Read requirement
   SRS / product scope / change request acceptance criteria

4. Perform impact analysis
   Routes, components, DB models, APIs / server actions

5. Identify cross-cutting impact
   DATABASE · SECURITY · SEO · CACHE

6. Implement locally only
   Follow DEVELOPMENT_STANDARD.md
   Do not modify Production
   Do not deploy unless explicitly authorized in the user request

7. Test
   TEST_STRATEGY + SECURITY_GATE and/or SEO_GATE as risk requires
   Build + typecheck for code changes

8. Update evidence
   Prefer committed curated qa/seo paths; optional local dumps only if present
   (do not invent passes; see CURRENT_STATE.md)

9. Report release readiness
   Map results to RELEASE_CHECKLIST.md
   State P0/P1 counts, gate results, rollback notes

10. STOP before Production
    Unless the user explicitly authorizes Production write / deploy
```

---

## Hard stops

| Condition | Action |
| --- | --- |
| Production `DATABASE_URL` active accidentally | Stop; switch to local |
| Change needs schema change without migration plan | Stop; design migration first |
| SEO keyword ownership unclear | Stop; consult `seo/master-keyword-map.csv` + SEO gate |
| Prisma 7 IDE says remove `datasource.url` | Stop; project is Prisma 6.19 — keep `url`; pin `prisma.pinToPrisma6`; trust CLI |
| Company facts proposed in `SITE_CONFIG` / bootstrap as live overlay | Stop; use CompanyInfo SSOT |
| User did not authorize commit / deploy | Do not commit / deploy |

---

## Company Settings / cache rule for agents

```text
Supported path:
Admin Save → updateTag(COMPANY_CONFIG_TAG) → revalidatePath("/", "layout")

Raw Prisma edits without tag invalidation may appear stale until rebuild/revalidation.
That is expected — do not “fix” by overlaying BOOTSTRAP_COMPANY_CONFIG on DB data.
```

---

## Output expected from agents

When finishing a change, report at minimum:

```text
Change ID:
Type:
Files touched:
DB impact:
Security impact:
SEO impact:
Cache impact:
Tests run:
Build:
Typecheck:
Release ready: YES / NO
Production authorized: YES / NO
```

---

## Related

- [DEFINITION_OF_DONE.md](./03-development/DEFINITION_OF_DONE.md)
- [RELEASE_CHECKLIST.md](./05-release/RELEASE_CHECKLIST.md)
- [BASELINE.md](./BASELINE.md)

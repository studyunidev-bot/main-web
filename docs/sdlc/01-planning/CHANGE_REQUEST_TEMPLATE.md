# Change Request Template

Copy this template for every non-trivial change. Assign a unique **Change ID**.

```text
Change ID:     CR-YYYYMMDD-###
Title:
Type:          FEATURE | BUG | UI | SEO | SECURITY | DATABASE | PERFORMANCE | CONTENT | MAINTENANCE
Risk:          LOW | MEDIUM | HIGH | CRITICAL
Date:

Author:
Linked SRS IDs:
Linked ADR IDs:

────────────────────────────────────────
Problem:

Requirement:

Expected Result:

────────────────────────────────────────
Affected Routes:

Affected Components:

Affected DB Models:

Affected APIs / Server Actions:

────────────────────────────────────────
DB Impact:
Migration Required: YES / NO
Migration name/path (if YES):

Security Impact:

SEO Impact:
Keyword owners affected (if any):

Caching Impact:
Tags / revalidatePath required:

────────────────────────────────────────
Backward Compatibility:

Rollback Risk:
Rollback approach (code / DB / content / config):

────────────────────────────────────────
Acceptance Criteria:
1.
2.
3.

Required Tests:
[ ] Functional
[ ] Regression
[ ] Security gate (if risk warrants)
[ ] SEO gate (if public-facing)
[ ] Build
[ ] Typecheck
[ ] Migration fresh DB (if schema)
[ ] Migration existing DB (if schema)

Evidence location (qa/ / seo/ / notes):

Release authorized: YES / NO
Production authorized: YES / NO
```

---

## Change types

| Type | Typical examples |
| --- | --- |
| FEATURE | New capability within product scope |
| BUG | Defect fix restoring intended behavior |
| UI | Presentation without SEO/DB ownership change |
| SEO | Metadata, sitemap, schema, keyword ownership |
| SECURITY | AuthZ, validation, headers, upload hardening |
| DATABASE | Schema, migrations, indexes, relations |
| PERFORMANCE | Cache, query, rendering performance |
| CONTENT | CMS/content operations following publication rules |
| MAINTENANCE | Dependency, docs, tooling, cleanup without behavior change |

---

## Minimum process

```text
Fill CR → Impact analysis → Design/ADR if needed → Implement → Test → DoD → Release checklist
```

Agents: follow `docs/sdlc/AGENT_WORKFLOW.md`.

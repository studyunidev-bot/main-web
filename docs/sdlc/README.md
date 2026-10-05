# ThaiBusinessMate — SDLC Framework

**Single entry point** for change governance. Every future change must follow:

```text
PLAN → DESIGN → IMPLEMENT → TEST → RELEASE → OPERATE → FEEDBACK
```

This framework is derived from the **verified controlled baselines** (see [BASELINE.md](./BASELINE.md)). It does **not** change application behavior by itself.

```text
Historical Structural Base: a871153
Current Verified Application Baseline: 78be67c
Next Change ID: CR-2026-001
```

From this freeze onward: **no feature or structural change without a Change Request.**

---

## How to use this folder

| Role | Start here |
| --- | --- |
| Product / planning | [01-planning/](./01-planning/) |
| Architecture / ADR | [02-design/](./02-design/) |
| Engineers / agents | [03-development/](./03-development/) + [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md) |
| QA | [04-testing/](./04-testing/) |
| Release owners | [05-release/](./05-release/) |
| Ops / incidents | [06-operations/](./06-operations/) |
| Current evidence map | [CURRENT_STATE.md](./CURRENT_STATE.md) |

---

## Lifecycle stages

### 1. PLAN

- Confirm change fits [PRODUCT_SCOPE.md](./01-planning/PRODUCT_SCOPE.md)
- Capture requirement in [CHANGE_REQUEST_TEMPLATE.md](./01-planning/CHANGE_REQUEST_TEMPLATE.md)
- Trace to SRS IDs in [SRS.md](./01-planning/SRS.md) and [REQUIREMENT_TRACEABILITY_MATRIX.csv](./01-planning/REQUIREMENT_TRACEABILITY_MATRIX.csv)

### 2. DESIGN

- Update or reference [SYSTEM_ARCHITECTURE.md](./02-design/SYSTEM_ARCHITECTURE.md)
- If DB/schema: [DATABASE_ARCHITECTURE.md](./02-design/DATABASE_ARCHITECTURE.md)
- If security/SEO: respective architecture docs + gates
- Significant decisions → ADR under [02-design/adr/](./02-design/adr/)

### 3. IMPLEMENT

- Follow [DEVELOPMENT_STANDARD.md](./03-development/DEVELOPMENT_STANDARD.md)
- Branching: [GIT_WORKFLOW.md](./03-development/GIT_WORKFLOW.md)
- Stop when [DEFINITION_OF_DONE.md](./03-development/DEFINITION_OF_DONE.md) is satisfied

### 4. TEST

- Strategy: [TEST_STRATEGY.md](./04-testing/TEST_STRATEGY.md)
- Mandatory gates for risk areas:
  - [SECURITY_GATE.md](./04-testing/SECURITY_GATE.md)
  - [SEO_GATE.md](./04-testing/SEO_GATE.md)

### 5. RELEASE

- [RELEASE_CHECKLIST.md](./05-release/RELEASE_CHECKLIST.md)
- [DEPLOYMENT.md](./05-release/DEPLOYMENT.md)
- [ROLLBACK_PLAN.md](./05-release/ROLLBACK_PLAN.md)

### 6. OPERATE → FEEDBACK

- [MAINTENANCE.md](./06-operations/MAINTENANCE.md)
- [INCIDENT_RESPONSE.md](./06-operations/INCIDENT_RESPONSE.md)
- [CHANGELOG_POLICY.md](./06-operations/CHANGELOG_POLICY.md)
- Feed learnings back into SRS / ADRs / gates

---

## Cross-cutting concerns

Every change must explicitly assess:

| Concern | Primary docs |
| --- | --- |
| **SECURITY** | Security architecture + Security gate |
| **DATABASE** | Database architecture + migration rules |
| **SEO** | SEO architecture + SEO gate |
| **CACHE** | Company SSOT ADR + Development standard (tags / `revalidatePath`) |

---

## Hard rules (governance)

1. **No Production write / deploy** unless explicitly authorized for that change.
2. **CompanyInfo** is the authoritative SSOT for company business facts ([ADR-001](./02-design/adr/ADR-001-company-settings-ssot.md)).
3. **Production DB schema** must never be modified manually outside a controlled migration/change process.
4. **ONE PRIMARY SEARCH INTENT → ONE OWNER URL** (keyword ownership).
5. Agents must follow [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md) and **STOP before Production** unless authorized.
6. **Next open Change ID:** `CR-2026-001` — fill [CHANGE_REQUEST_TEMPLATE.md](./01-planning/CHANGE_REQUEST_TEMPLATE.md) before implementation.

---

## Document index

```text
docs/sdlc/
├── README.md                          ← you are here
├── BASELINE.md
├── CURRENT_STATE.md
├── AGENT_WORKFLOW.md
├── SDLC_IMPLEMENTATION_REPORT.md
│
├── 01-planning/
│   ├── PRODUCT_SCOPE.md
│   ├── SRS.md
│   ├── CHANGE_REQUEST_TEMPLATE.md
│   └── REQUIREMENT_TRACEABILITY_MATRIX.csv
│
├── 02-design/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_ARCHITECTURE.md
│   ├── SECURITY_ARCHITECTURE.md
│   ├── SEO_ARCHITECTURE.md
│   └── adr/
│       ├── ADR_TEMPLATE.md
│       └── ADR-001-company-settings-ssot.md
│
├── 03-development/
│   ├── DEVELOPMENT_STANDARD.md
│   ├── GIT_WORKFLOW.md
│   └── DEFINITION_OF_DONE.md
│
├── 04-testing/
│   ├── TEST_STRATEGY.md
│   ├── TEST_CASE_TEMPLATE.md
│   ├── SECURITY_GATE.md
│   └── SEO_GATE.md
│
├── 05-release/
│   ├── RELEASE_CHECKLIST.md
│   ├── DEPLOYMENT.md
│   └── ROLLBACK_PLAN.md
│
└── 06-operations/
    ├── MAINTENANCE.md
    ├── INCIDENT_RESPONSE.md
    └── CHANGELOG_POLICY.md
```

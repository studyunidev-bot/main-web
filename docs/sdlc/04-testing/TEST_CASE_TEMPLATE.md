# Test Case Template

```text
Test Case ID:   TC-AREA-###
Change ID:
Title:
Type:           Functional | Integration | Regression | Database | SEO | Security | Build | Smoke
Priority:       P0 | P1 | P2 | P3
Automation:     Manual | Scripted | N/A

Preconditions:
-

Steps:
1.
2.
3.

Expected Result:
-

Actual Result:
-

Status:         PASS | FAIL | BLOCKED | SKIP
Evidence:       (committed qa/seo path or CR notes; optional local dumps if present)
Date:
Tester:
```

---

## Priority guidance

| Priority | Meaning |
| --- | --- |
| P0 | Release blocker (data loss, auth bypass, wrong money-page SEO, site down) |
| P1 | High severity; must fix before release |
| P2 | Important; schedule promptly |
| P3 | Minor / cosmetic |

Release rule: **P0 = 0 and P1 = 0** (see Release Checklist).

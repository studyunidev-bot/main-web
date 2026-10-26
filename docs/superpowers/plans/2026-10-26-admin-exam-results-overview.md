# Admin exam results overview Implementation Plan

> **For agentic workers:** Implement this plan task-by-task in the current checkout. Keep all existing user changes intact.

**Goal:** Make the Admin results route a useful cross-exam overview with complete filters over the currently available result fixtures.

**Architecture:** Extend the existing overview branch and local state in `WebBAdminDemo.tsx`. Derive filter options, filtered rows, and summary metrics from the same fixture list; preserve the current report modal and Ranking view.

**Tech Stack:** Next.js App Router, React state, TypeScript, existing `AdminSelect` and Webb Admin UI primitives.

**Spec:** `docs/superpowers/specs/2026-10-26-admin-exam-results-overview-design.md`

## Global Constraints

- Use the existing Webb Admin UI primitives and `AdminSelect` for searchable categorical controls.
- Keep the set-specific results screen and Webb Client routes unchanged.
- Keep mock fixtures clearly identified as presentation data; do not add backend integration or invented results.
- Do not modify the pre-existing `next-env.d.ts` change.

## Review Focus

- Empty filter matches must show zero summaries and the empty table state.
- Date-only and one-sided ranges must include boundary dates.
- Search must match Thai student names and result IDs without case sensitivity for IDs.
- Clearing filters must restore all rows.
- Ranking and the per-student report action must remain available.

---

### Task 1: Complete aggregate results filters

**Files:**
- Modify: `src/components/webb/WebBAdminDemo.tsx`
- Modify: `src/components/Layouts/sidebar/index.tsx`

**Implementation:**

- Add query, status, date-from, and date-to state for the aggregate results overview.
- Parse the existing Thai Buddhist date labels into sortable `YYYY-MM-DD` keys without changing the visible date strings.
- Derive categorical options from `resultOverviewRows`; keep selected filters combined with the existing type, set, grade, province, and date logic.
- Add name/ID search, status select, inclusive range inputs, and a reset action using existing shared controls where they fit.
- Add a permission-aware sidebar item under “รายงาน” linking to `/webb/admin/results`; title the destination “ภาพรวมผลสอบ”.
- Remove selected-product/set framing from the global report and use `WebBThaiDatePicker` for both date bounds.
- Show grouped exam/set summaries first, then reveal candidates and individual reports after selecting a group.
- Hide the score-event and publish-all actions on the global results route while retaining them in exam-management context.
- In embedded set results, move the searchable product/part selector into the filter row and hide exam-type/set selectors.
- Derive all result summary counts and numeric metrics from the filtered rows; retain the per-student report and Ranking tab.

**Completion checks:**

- Inspect the diff to confirm only the aggregate overview and its required local state/helpers changed.
- Run a TypeScript check (`npx tsc --noEmit`) and report its result.
- Do not run or add tests unless the user asks for tests or implementation verification.

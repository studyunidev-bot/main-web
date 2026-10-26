# Admin exam results overview design

## Intent

Make `/webb/admin/results` a useful cross-exam overview for admins by letting them find submitted result examples and review aggregate metrics across the available mock rows.

## Goals

- Search by student name and result ID.
- Filter by exam type, set, grade, province, result status, and an inclusive submitted-date range.
- Keep summary cards and result table in sync with the active filters; provide a one-action reset.
- Keep the existing per-student report flow and Ranking tab available.
- Add a dedicated Admin sidebar entry for the cross-exam overview, separate from set-level result tabs.
- Keep the overview header independent of the currently selected product/set so it reads as a global report.
- Use the existing Thai-localized date picker for the submitted-date range.
- Group the initial results table by exam type and set; reveal candidate rows only after opening a group, then allow the existing individual report action.
- Keep recalculation-log and publish/pause actions off the aggregate overview; retain those controls in the exam-management context.
- In a set-scoped results view, omit redundant exam-type/set filters and place the searchable product/part selector with the other filters.

## Non-goals and constraints

- This remains a presentation Mockup using the existing local fixture rows; it does not add API/database integration or invent results for exam types and sets that have no data.
- Keep the set-specific `exam-catalog/tgat/tgat-a` workflow and Client routes unchanged.
- Generate filter choices from available result rows so values stay aligned with displayed data.

## Approaches

- **Extend the existing results overview (chosen):** retain its route and component, add the missing search/status/date-range filters, and make all summary metrics derive from filtered rows. This reuses the current result list and report modal.
- Extract a dedicated aggregate-results component: improves file ownership but adds a new seam without changing the data needs or behavior.
- Add only a separate menu label: clarifies navigation but leaves the current filtering gaps.

## Builder decisions

- Use the existing AdminSelect for categorical filters and shared Admin table framing where it fits.
- Interpret “date range” as two inclusive dates, with an open start or end allowed.
- Show the available fixture scope honestly; when no rows match, show the existing empty state and zeroed summaries.

## Acceptance

- Combined filter values narrow both rows and summary count/average consistently.
- Search matches student name and result ID.
- Start/end date filtering is inclusive and handles either bound alone.
- Reset restores all filters and the complete available fixture list.
- Existing report opening and Ranking tab remain available.

# Webb Mockup Structure Audit and Refactor Plan

## Scope

This work is limited to Webb Admin. Webb Client routes and UI are outside the change scope and must not be edited. The current workspace (including its existing uncommitted Webb changes) is the before-state for comparisons; do not reset or replace it with `HEAD`. The proposed Admin refactor must preserve existing screens, routes, visible information, mock records, defaults, and interactions while reducing duplication and making ownership clearer.

## Before-state baseline

Baseline captured before any refactor in this task:

- `npx tsc --noEmit` passed.
- HTTP smoke checks returned `200` for all 20 existing Admin URLs below.
- The repository has no configured Playwright, Cypress, Vitest, or Jest test script/dependency. Route responses alone do not verify clicks, forms, modals, filters, permissions, or persisted mock state. Those interaction checks remain required before marking any page complete.
- The development server was already running locally; no server configuration or application feature was changed to capture the baseline.

| Admin URL | Current rendering owner | Before-state route check |
| --- | --- | --- |
| `/webb/admin/dashboard` | `WebBAdminDemo` (`overview`) | 200 |
| `/webb/admin/orders`, `/webb/admin/payments` | `WebBAdminDemo` (`orders` / `payments`) | 200 |
| `/webb/admin/finance` | `WebBAdminDemo` (`finance`) | 200 |
| `/webb/admin/real-exams`, `/webb/admin/trial-exams` | `WebBAdminDemo` (`real-exams` / `trial-exams`) | 200 |
| `/webb/admin/students`, `/webb/admin/admins`, `/webb/admin/audit`, `/webb/admin/settings` | `WebBAdminDemo` (same-named screen) | 200 |
| `/webb/admin/approvals` | `WebBExamApprovals` | 200 |
| `/webb/admin/exam-catalog` | `WebBExamCatalog` | 200 |
| `/webb/admin/exam-catalog/tgat/tgat-a` | `WebBExamCatalog` (set detail) | 200 |
| `/webb/admin/exam-management` | `WebBExamCatalog` (set detail) | 200 |
| `/webb/admin/products`, `/webb/admin/content`, `/webb/admin/entitlements`, `/webb/admin/attempts`, `/webb/admin/results`, `/webb/admin/solutions` | `WebBAdminDemo` (screen aliases) | 200 |

## Refactor log

### Step 1 — extract presentation-only Admin primitives

Moved `Panel`, `Button`, and `Badge` with their existing props, markup, and class names from `WebBAdminDemo.tsx` into `WebBAdminPrimitives.tsx`. No state, handlers, screen conditions, mock data, routes, or Client files were changed in this step.

| Before/after check | Result |
| --- | --- |
| TypeScript (`npx tsc --noEmit`) | Pass before and after |
| Admin route smoke checks | All 20 URLs returned 200 before and after |
| Handler/state review | The extracted components are presentation-only; Admin state, handler, and routing code remains in place |
| Browser interaction checks | Not run; this workspace has no configured browser automation. This step does not claim interaction-by-interaction certification for the full Admin product. |

This is the first small structural step. Continue with one Admin workflow at a time, recording its before/after interaction checks here. Do not mark a workflow complete based only on a route response.

## Findings

The route files are generally thin entry points. For example, the Student routes select a mode for `WebBStudentArea`, while several Admin routes select an `activeScreen` for `WebBAdminDemo`. This keeps route code small, but it also concentrates screen implementation in shared components.

There are approximately 19,061 lines across `src/components/webb` TSX files. The largest components are:

| File | Lines | Current responsibility / concern |
| --- | ---: | --- |
| `WebBAdminDemo.tsx` | 7,509 | Multiple Admin screens, screen-specific state, actions, tables, and modal/form markup are selected in one large component. This is the highest risk area for accidental cross-screen effects. |
| `WebBStudentArea.tsx` | 3,565 | Student overview, exam room, result views, ranking, solutions, profile, and related dialogs share one component file. The file already has named internal components, but they remain coupled in one module. |
| `WebBExamCatalog.tsx` | 1,057 | Catalog and exam-set management. It is much smaller than the two largest files, but combines multiple tabs, CRUD modals, and inline table layouts. |
| `WebBSubjectPurchaseFlow.tsx` | 843 | Subject selection and purchase flow. It is a distinct flow and should be treated as its own behavior boundary. |
| `WebBExam.tsx` | 768 | Client exam-taking flow. Keep its timer, answer state, and navigation behavior intact if it is later decomposed. |

There is already partial reuse:

- `WebBAdminTable.tsx` provides a shared table frame with search, page size, pagination, and an empty state. It accepts the actual table rows as children, so each screen still authors its own headers and cells. It is used in several Admin areas, but many tables remain inline.
- `AdminSelect.tsx` provides a common searchable select and is used in Webb Admin, including inside `WebBAdminTable`.
- `WebBThaiDatePicker.tsx` is a shared date input used by Admin screens.
- These components establish a useful foundation, but there is not yet a shared Webb Input/Form Field primitive that consistently handles labels, hints, validation, disabled state, and input styling. Repeated native `<input>`, `<select>`, and table markup therefore remains visible in screen files.

The main structural issue is not that every file is too large. It is that the largest Admin and Student components own several workflows at once. A change to shared state or conditional rendering in those files can affect a different screen, which matches the observed risk of controls triggering an action in another section. Refactor boundaries should follow user-visible workflows and state ownership, not arbitrary line ranges.

## Recommended shared UI patterns

1. Keep `WebBAdminTable` as the existing shared search/pagination wrapper. During a later refactor, assess whether common table header, cell, action, loading, and empty-state primitives are justified by actual repeated markup. Do not replace custom columns where their content or behavior differs.
2. Keep using `AdminSelect` for searchable selects. Do not replace native selects in bulk without checking whether search, clear, keyboard, and default-value behavior would change.
3. Establish a small shared Webb Admin `FormField` / `Input` / `Textarea` pattern before migrating repeated controls. Include labels, help/error text, disabled state, and accessible names. Migrate incrementally; preserve each screen's current validation, values, and submit behavior.
4. Keep domain-specific display and action logic in the owning screen. Share presentation primitives, but do not build an overly generic component that hides different workflow behavior behind many flags.

## Staged refactor plan

| Stage | Work boundary | Candidate files | Behavior-preservation check |
| --- | --- | --- | --- |
| 0. Baseline | Record current route-to-screen mapping, key mock data, default states, and representative interaction paths before moving code. | `src/app/webb/**/page.tsx`, `WebBAdminDemo.tsx`, `WebBStudentArea.tsx`, `WebBExamCatalog.tsx` | Capture the existing build/typecheck result and screenshots or concise interaction notes for each route. Do not change behavior in this stage. |
| 1. Admin domain extraction | Separate Admin screen data/types and pure formatting/filtering helpers from rendering. Keep handlers and UI behavior stable. | `WebBAdminDemo.tsx`; new narrowly scoped files under `src/components/webb/admin/` | Compare each affected screen's initial data, filters, counts, and action results against the baseline. |
| 2. Admin screen ownership | Move one screen domain at a time out of `WebBAdminDemo` into screen components, leaving the current route wrappers and navigation contract intact. Start with lower-coupling screens, then exam management. | `WebBAdminDemo.tsx`, `src/app/webb/admin/**/page.tsx`, new `src/components/webb/admin/*` | Verify route, selected tab, query-string defaults, modal open/close, CRUD mock results, and cross-screen state isolation after each domain. |
| 3. Shared Admin controls | Add the shared Form Field/Input/Textarea and only the table subcomponents supported by repeated markup. Migrate one screen at a time. | `AdminSelect.tsx`, `WebBAdminTable.tsx`, new shared files under `src/components/webb/` or `src/components/ui/`, then individual Admin screens | Check labels, required/disabled states, errors, keyboard use, search/pagination, empty states, and row actions against the baseline. |
| 4. Student workflow ownership | Split the large Student area along the existing modes and internal workflow components: overview, exam room, results/detail, ranking, solutions, profile. Keep the mode routes stable. | `WebBStudentArea.tsx`, `src/app/webb/student/page.tsx`, `profile/page.tsx`, `results/page.tsx`, `ranking/page.tsx`, `solutions/page.tsx` | Verify mode selection, exam answers/timer/navigation, result and ranking filters, solution modal, and profile editing using the same mock data. |
| 5. Client flow cleanup | Review and extract repeated controls only where there is concrete duplication across purchase, checkout, exam, and result flows. | `WebBSubjectPurchaseFlow.tsx`, `WebBCheckout.tsx`, `WebBExam.tsx`, `WebBResultDetail.tsx`, relevant shared UI | Re-run the complete mock path from subject selection through purchase, exam completion, and result display. Keep Client routes and content unchanged. |

> Stage 5 is reference-only for this task. Do not edit Client files or Client UI.

## Completion criteria for future code changes

- The same Admin routes, content, mock data, defaults, and user-visible actions remain available.
- No Client route, component, styling, or UI is changed as part of the Admin refactor.
- The same action still affects only the intended screen, row, or item.
- Component extraction does not silently change validation, ordering, filters, access rules, or modal behavior.
- Shared Table/Input controls are used consistently where behavior and appearance are actually the same; intentionally different controls remain explicit.
- For each Admin page, compare the before-state with the after-state: initial view and mock data, filters, create/edit/delete actions, modal open/close, permissions, persistence, and route/query defaults as applicable. Mark that page complete only after every applicable check passes.
- Run the repository's relevant typecheck/build and focused interaction checks after each stage. Resolve failures introduced by the refactor before proceeding to the next stage. A `200` route response or successful typecheck alone is not proof of 100% behavior preservation.

## Audit limitations

Line counts and component locations describe the current worktree at the time of this audit. This is a source-structure review, not a full UI accessibility audit or a proof that all possible interactions work. The baseline currently verifies types and route responses; interaction-by-interaction verification is still pending for any code refactor.

## Webb Admin demo alignment — 21 October 2026

This phase changes Webb Admin only. The Client components, routes, styling, and scoring behavior are unchanged. The goal is a coherent presentation dataset, not an API, cross-browser persistence, or a requirement that clicking an Admin fixture updates a Client screen. Webb has no Client surrender/forfeit flow, so this phase does not add one.

| Demo path | Before this phase | Admin presentation after this phase | Remaining limit |
| --- | --- | --- | --- |
| Account and paid TGAT A | Somchai was the Client's fallback student, while the first Admin order, student, and attempt named another student. | The first Admin order, student, attempt, result, and Ranking example identify Somchai; the order precedes the 15 July exam. | Client stores one account per browser; Admin fixtures remain examples. Existing browser-saved Admin rows are not silently overwritten. |
| Other result rows | Nicha's attempt score differed from the result table; Pim's result was shown while her sample order was pending. | Nicha, Thanakorn, and Pim have matching sample paid orders, submitted attempts, result scores, and dates. A separate pending order keeps the payment-state example. | Their rows are Admin examples, not real Client submissions. |
| Result and Ranking | Somchai's Admin total was 0 while the Client's no-result fallback displayed 60.7. Result date filters did not list every displayed date. | Somchai's Admin total is 60.7, his part scores and rank example match the Client display, and date choices come from the displayed rows. The Admin labels fixed result examples separately from browser-recorded Ranking rows. | The Client itself still mixes a fallback total, fixed part scores, fixed rank, and actual saved score. Admin-only work cannot make those values derive from one exam. |
| New-exam request | Opening Admin approvals or catalog created a request, purchase, paid order, and attempt in storage shared with Client. | Reading the request list is side-effect free. Only a request already saved by the Client or Admin action appears; approval of a real linked purchase remains available. | A browser that ran the earlier version may retain the previously seeded records; this change does not delete existing browser data. |
| Order actions | Admin-only sample rows could be marked paid or refunded even though they had no matching canonical Client order, making the UI suggest an entitlement changed. | Rows absent from Client order storage carry a “ตัวอย่างหลังบ้าน” label and offer details only. Real canonical orders retain their existing payment/refund actions. | The example rows still contribute to Admin presentation totals and Finance; those totals must be presented as Mockup examples. |

The TGAT A sample uses a 179 baht base price and a 197 baht charged example for the direct checkout route. The Client's separate subject-selection purchase route currently charges the 179 baht base amount. This inconsistency cannot be resolved fully while Client files remain out of scope. The same applies to TGAT3 multi-select/linked scoring, Client report details, and Admin-edited media not replacing Client's static assets. Do not claim that these paths are synchronized or fully accurate in the customer demonstration.

TPAT, A-Level, and NETSAT remain disabled in Client. Their Admin set examples are labeled as future-service examples and do not represent actual purchases, entitlements, attempts, or results. The request menu is for “ขอสอบใหม่” after interruption; it is not a surrender/forfeit menu.

Verification for this phase: `npx tsc --noEmit --incremental false` passed before and after the changes; `npm run build` and `git diff --check` passed. The initial sandboxed route probe could not reach port 3003; an approved local probe then returned HTTP 200 for the catalog, approvals, orders, results, and TGAT A set-detail routes. Browser interaction checks were not possible because no browser instance was available in the session. Existing `localStorage` values override built-in seed rows; use a fresh browser profile when presenting the updated default examples, or review the saved demo state first. Do not clear a customer's or teammate's saved state automatically.

### Follow-up — make the Client result/ranking distinction explicit

The Admin Client-reference panel previously described the fixed 415/2709 rank example as if it were the fallback shown when the browser had no submitted result. Source review shows two different Client behaviors: the report detail displays the fixed example, while the Ranking modal derives its values from browser-saved submitted attempts and can show an empty state. Updated only the Admin reference panel to label the fixed report example and explain the separate empty-state behavior. No Client files or mock records were changed.

| Check | Result |
| --- | --- |
| Before-state TypeScript (`npx tsc --noEmit --incremental false`) | Pass |
| After-state TypeScript (`npx tsc --noEmit --incremental false`) | Pass |
| Client file changes | None |
| Browser interaction check | Not run; no browser instance is available in this session |

## Webb Admin and Client mockup alignment — 22 October 2026

This implementation is Admin-only. Admin demo state now uses the `webb-admin-mock:*` localStorage namespace and the `webb-admin-mock-updated` event. Admin order, product, offer, answer-key, solution, result-publication, contact-setting, entitlement, request, attempt, and ranking actions no longer read or write Client account, purchase, order, result, answer, or ranking storage. The Client files and routes were not edited. This is deliberate: the Admin and Client examples use compatible sample identities and values for presentation, but an Admin action does not update the Client mockup and a Client action does not populate Admin.

| Client-facing flow | Admin mockup coverage after this change | Sample path shown |
| --- | --- | --- |
| Register / account | Student directory, profile fields, status, and entitlement count | Somchai and other sample students; Varisara is included for the interrupted-exam support case |
| Select and buy | Exam catalog, TGAT package, included sections, base price and charged price | Full TGAT · Set A · TGAT1–3 · 179 baht base / 197 baht charged example |
| Pay | Orders, payment status, method, mock webhook, Payso fee breakdown, and finance view | Paid, pending, expired, failed, and refunded order examples; payment actions update Admin mock records only |
| Receive exam access | Entitlement list derived from Admin mock purchase records; manual grant/revoke stays within Admin | Paid order `DO-2570-0007` links to Varisara's Set A entitlement |
| Start, interrupt, submit, or request another attempt | Attempt history and a reviewable request with approve/reject actions | Varisara's interrupted TGAT3 attempt links to request `TKT-2570-0001`; approval reopens only the Admin mock entitlement and adds a retry attempt |
| Review result and rank | Multi-student result table, report detail, filters, and separate Ranking view | Somchai report uses Client's visible 60.7 total, part scores 60.7 / 67.4 / 54.6, and fixed report rank example 415/2709; the Client Ranking modal can still be empty without a browser-submitted row |
| View solution media | Per-question PDF/video CRUD and publication state | TGAT1 example video, tutor information, duration, summary, and downloadable PDF label |
| Future exam categories | Disabled future catalog examples | TPAT1–5, A-Level, and NETSAT remain future-service examples and do not imply active Client purchases or attempts |

All sample order and support actions now update only Admin mock records. The admin exam catalog also writes its product and set summaries to the Admin mock namespace rather than the product settings that Client helpers read. Admin reset removes only `webb-admin-mock:*` values. Existing values under the previous `webb-admin-demo:*` and Client keys were left untouched; they are not migrated into the new Admin mock state.

### Remaining Client/Admin differences

- Client's subject-selection checkout currently uses the 179 baht base amount while the direct checkout example applies the 197 baht charged amount. Admin presents both values as requested, but cannot make those two Client paths agree without changing Client code.
- Client's TGAT3 answer UI supports multiple selections for questions marked multi-answer and labels linked questions. Linked answers are not entered as a single paired response, and Client scoring compares the complete selected-answer set; it does not apply Admin's configurable partial-credit rules. Admin's scoring settings remain mock-only and do not change Client scoring.
- Client report detail uses fixed example scores and rank, while its Ranking modal reads browser-submitted records. Admin now labels these as separate examples instead of describing them as one synchronized result.
- Admin-edited solution files and publication state are presentation-only; Client uses its current static solution documents and browser-side availability rules.
- Admin's sign-up coverage is the student directory and account mock record; it does not add a separate registration-approval workflow absent from the Client UI.

### Verification

| Check | Result |
| --- | --- |
| Before-state TypeScript | Pass |
| After-state TypeScript (`npx tsc --noEmit --incremental false`) | Pass |
| Production build (`npm run build`) | Pass |
| Admin route smoke checks | All 20 URLs in the baseline table returned HTTP 200 |
| Whitespace check (`git diff --check`) | Pass |
| Browser interaction checks | Not run; no Browser session was available. The build and route checks do not certify clicks, modal behavior, storage persistence, or visual layout. |
| Client files changed in this phase | None |

### Follow-up — align Admin fixtures with the stated Client flows

Updated only Webb Admin mock behavior and fixtures:

- Admin orders and purchase records now display `PromptPay QR` even when the current browser has an older saved Admin mock row using another method. This is a read-time presentation normalization; it does not overwrite saved browser data.
- Ranking rows are scoped to the exact product, set, and product version so a combined TGAT package is not mixed into an individual subject ranking. The UI names this comparison scope.
- The Client answer UI now supports multi-answer questions and labels linked questions. Its scoring still does not apply Admin's per-question partial-credit configuration, and linked answers are not captured as a paired response. Keep this distinction visible in the Admin Client-reference panel; Client was not edited.
- Corrected duplicated/misordered sample-data labels in the Admin exam catalog. The Admin solution fixture remains aligned with the Client's TGAT1 video duration, tutor, description, and PDF label.

| Verification | Result |
| --- | --- |
| TypeScript (`npx tsc --noEmit --incremental false`) | Pass |
| Admin route smoke checks | Pass: orders, payments, results, solutions, and TGAT A catalog returned HTTP 200 |
| Browser interaction checks | Not run; still requires manual verification using the paths listed in the task response |
| Client files changed | None |

### Mockup handoff readiness — Admin-only review

The Admin has mock screens and actions for each Client-facing journey in the alignment table above: student records, packages and prices, PromptPay order/payment states, access, interrupted attempts and requests, result overview/detail and Ranking, and per-question solution media. The seeded Varisara support case links purchase `DO-2570-0007`, interrupted attempt `ATT-005`, and request `TKT-2570-0001`. The seeded Somchai report uses the Client's displayed total and section scores. These are presentation fixtures; Admin actions do not update Client state by design.

Before handoff, walk these checks in the Admin UI: (1) open TGAT Set A → content and inspect TGAT1–3 answer rows, including TGAT3 multi-answer, linked-question labels, and partial-score fields; (2) open package/offers and confirm included sections, 179 baht base price, and 197 baht charged example; (3) open results → overview, filter the sample submissions, and open Somchai's report and per-question examples; (4) open solutions and inspect the TGAT1 video/PDF details and add/edit/publish controls; (5) open orders and payments and inspect the paid, pending, expired, and refunded examples plus finance; (6) open access/requests and trace Varisara's order, interrupted attempt, and request decision.

The mock screens cover the agreed Admin presentation flows, but do not claim synchronized data, executable payment-provider behavior, or scoring equivalence between Admin settings and Client scoring. Browser interaction checks remain a handoff verification step; TypeScript, build, and route checks alone do not certify them.

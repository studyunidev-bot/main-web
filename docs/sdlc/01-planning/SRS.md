# Software Requirements Specification (SRS)

**Product:** ThaiBusinessMate  
**Derived from:** Existing verified behavior (baseline 2026-09-21)  
**IDs:** `FR-###` functional · `NFR-###` non-functional

Requirements describe **current system obligations**. New features need a Change Request that adds new FR/NFR IDs.

---

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-001 | The system shall serve a public multilingual frontend under `/[lang]` for locales `th`, `en`, `ja`, `zh`. |
| FR-002 | The system shall provide marketing pages including home, about, contact, and legal pages (privacy, terms, refund-policy). |
| FR-003 | The system shall publish CMS-managed blog posts at `/[lang]/blog` and `/[lang]/blog/[slug]`. |
| FR-004 | The system shall publish portfolio items at `/[lang]/portfolio` and `/[lang]/portfolio/[slug]` (plus existing static portfolio marketing pages). |
| FR-005 | The system shall publish services via CMS slug routes and existing static service marketing pages under `/[lang]/services/...`. |
| FR-006 | The system shall return HTTP 404 for missing or unpublished public detail content (blog, portfolio, product, service catch-all, shop category as implemented). |
| FR-007 | The system shall provide admin authentication and protect admin routes/mutations. |
| FR-008 | Administrators shall create, update, and delete CMS content (blogs, categories, portfolio, services) via admin UI / server actions. |
| FR-009 | Administrators shall manage Company Settings stored in `CompanyInfo` (id=1), including contact facts, logo URL, and opening hours JSON. |
| FR-010 | Public frontend, metadata, and structured data shall read company facts from `getCompanyConfig()` backed by `CompanyInfo`, using `BOOTSTRAP_COMPANY_CONFIG` only when DB data is unavailable. |
| FR-011 | Saving Company Settings shall invalidate company cache tag and revalidate the root layout path. |
| FR-012 | The system shall accept public contact form submissions and store them as `ContactSubmission` records for admin review. |
| FR-013 | The system shall support ecommerce: products, categories, cart, wishlist, checkout, customer accounts, orders, coupons, and payment settings as implemented. |
| FR-014 | Administrators shall upload images through authenticated admin upload API; images shall be servable via the images API/public paths as implemented. |
| FR-015 | The system shall emit SEO metadata (title, description, Open Graph, Twitter, geo meta where applicable) for public pages. |
| FR-016 | The system shall generate sitemap and robots behavior that lists published public URLs only (draft/unpublished excluded). |
| FR-017 | The system shall emit structured data for Organization / LocalBusiness using company config, and FAQ schema where FAQ content exists. |
| FR-018 | CMS content may store per-locale translations and optional `faqJson` for FAQ rendering / schema. |
| FR-019 | The system shall provide analytics tracking endpoints and admin analytics views as implemented. |
| FR-020 | Customer and admin password reset flows shall use token models with expiry as implemented. |

---

## Non-functional requirements

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-001 | Security | Authentication and authorization shall protect admin mutations, uploads, and sensitive APIs; unauthenticated access shall be rejected on protected surfaces. |
| NFR-002 | Security | User/HTML content shall be validated (Zod) and sanitized (DOMPurify allowlist) before trust for render/persist paths that accept HTML. |
| NFR-003 | Security | Secrets shall not be committed; configuration via environment variables. |
| NFR-004 | Security | Raw SQL, if used, shall be parameterized; unsafe string concatenation for SQL is forbidden. |
| NFR-005 | Security | Security headers baseline shall be maintained; known gaps (e.g. Permissions-Policy) tracked as hardening debt, not silent omissions. |
| NFR-006 | SEO | One primary search intent maps to one owner URL; changes must not create uncontrolled cannibalization. |
| NFR-007 | SEO | Canonical URLs shall use production origin helpers and must not leak localhost into public SEO fields. |
| NFR-008 | SEO | Published content is indexable as designed; draft/missing content returns 404 and is excluded from sitemap. |
| NFR-009 | Accessibility | Interactive controls (e.g. FAQ, category filters) shall preserve basic a11y patterns already in use (focusable controls, `aria-current` where implemented). |
| NFR-010 | Maintainability | Feature code shall follow existing Next.js App Router + features/modules layout; significant decisions recorded as ADRs. |
| NFR-011 | Data Integrity | Prisma schema and migrations remain the schema source of truth; Production schema must not be edited manually outside controlled process. |
| NFR-012 | Data Integrity | `CompanyInfo` remains SSOT for company business facts; bootstrap config must not overlay steady-state DB values. |
| NFR-013 | Availability | Public site shall build and start via documented `npm run build` / `npm start` paths; release requires build+typecheck pass. |
| NFR-014 | Performance | Cache tags and path revalidation shall be used for company/content updates; long-lived ISR without invalidation is accepted for raw DB edits. |
| NFR-015 | Database migration safety | Schema changes require Prisma migrations; verify fresh DB migrate and existing DB compatibility before release. |

---

## Requirement change control

1. Propose Change Request (`CHANGE_REQUEST_TEMPLATE.md`).
2. Add/update FR/NFR IDs in this file.
3. Update `REQUIREMENT_TRACEABILITY_MATRIX.csv`.
4. Pass Definition of Done + relevant gates.

---

## Related evidence

- `qa/FINAL_SYSTEM_SECURITY_SEO_AUDIT.md`
- `qa/COMPANY_SSOT_HARDENING.md`
- `seo/master-keyword-map.csv`
- [PRODUCT_SCOPE.md](./PRODUCT_SCOPE.md)

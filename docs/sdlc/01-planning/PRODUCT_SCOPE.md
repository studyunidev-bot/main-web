# Product Scope

**Product:** ThaiBusinessMate (thaibusinessmate.com)  
**Scope source:** Verified existing system capabilities only — no invented features.

---

## In scope (actual capabilities)

### Public frontend

- Marketing / company website for ThaiBusinessMate
- Multilingual routing via `[lang]` with locales: `th`, `en`, `ja`, `zh` (`src/lib/locales.ts`)
- Public pages including home, about, contact, workflow, legal (privacy, terms, refund-policy)
- Service catalog (CMS-driven + selected static service marketing pages)
- Blog index + article detail
- Portfolio index + detail (+ selected static portfolio marketing pages)
- FAQ UI (page FAQs and CMS `faqJson` where implemented)
- Contact form submissions (`ContactSubmission`)

### Shop / ecommerce (present in codebase)

- Product catalog, categories, product detail
- Cart, wishlist, checkout flows
- Customer account (register, sign-in, profile, orders, password reset)
- Coupons, payment settings, bank/checkout success/cancel paths
- Stripe webhook endpoint (configured when secrets present)

### Admin

- Admin authentication (NextAuth)
- Dashboard / analytics views
- CMS: blogs, blog categories, portfolio, services, contacts
- Shop admin: products, categories, orders, coupons, payment settings
- Company Settings (CompanyInfo)
- Employees management
- Image upload API for admin media

### Company Settings (SSOT)

- Authoritative `CompanyInfo` row (id=1)
- Contact, address, social links, logo URL, opening hours JSON, and related company fields
- Consumed by frontend shell, metadata, and structured data via `getCompanyConfig()`

### SEO foundation

- Per-page metadata / Open Graph / Twitter
- Canonical URL helpers (production origin; localhost stripped)
- `robots` / sitemap generation (published-only listings)
- Structured data (Organization / LocalBusiness and content FAQ schema where applicable)
- Keyword ownership principle: one primary intent → one owner URL
- Dynamic HTTP 404 for missing / unpublished public content

### Media

- Admin image upload (`/api/admin/upload-image`)
- Image serving route (`/api/images/[...path]`)
- Static assets under public images

### Authentication

- Admin: NextAuth credentials session
- Customer: shop account auth / password reset tokens
- Admin password reset token model

### Platform stack (runtime)

- Next.js App Router + React
- Prisma ORM + MySQL
- Zod validation, DOMPurify sanitization (content HTML)
- Server Actions for many admin/CMS/shop mutations
- Tagged cache / path revalidation for company and content updates

---

## Explicitly out of inventing

Do not treat the following as product commitments unless they already exist and are verified:

- Features not present in routes/models/admin
- Third-party integrations beyond what is coded (e.g. unused SMTP fields are deprecated; Resend/env is the mail path)
- Automated unit-test suite as a release dependency (see Test Strategy — largely manual/scripted QA)

---

## Non-goals of this SDLC baseline phase

- Changing application behavior
- Expanding product scope
- Production deployment

---

## Related

- [SRS.md](./SRS.md)
- [BASELINE.md](../BASELINE.md)
- [SYSTEM_ARCHITECTURE.md](../02-design/SYSTEM_ARCHITECTURE.md)
